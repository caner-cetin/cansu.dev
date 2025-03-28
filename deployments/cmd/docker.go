package cmd

import (
	"archive/tar"
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/pkg/stdcopy"
	v1 "github.com/moby/docker-image-spec/specs-go/v1"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func (a *AppCtx) waitForContainerHealthWithConfig(containerID string, healthConfig *v1.HealthcheckConfig) error {
	if healthConfig == nil {
		return fmt.Errorf("health config is nil")
	}
	startTime := time.Now()
	a.Spinner.Prefix = "polling for health"
	for i := range healthConfig.Retries {
		a.Spinner.Prefix = fmt.Sprintf("polling for health, retry %d", i+1)
		inspect, err := a.Docker.Client.ContainerInspect(a.Context, containerID)
		if err != nil {
			return err
		}
		if inspect.State != nil && inspect.State.Health != nil && inspect.State.Health.Status == types.Healthy {
			log.Info().Msg("container is healthy")
			return nil
		}
		if time.Since(startTime) > healthConfig.Interval*time.Duration(healthConfig.Retries) {
			return fmt.Errorf("timeout waiting for container to become healthy")
		}

		time.Sleep(healthConfig.Interval)
	}
	return fmt.Errorf("container never became healthy after retries")

}

func (a *AppCtx) readLogs(ctx context.Context, containerID string) {
	logger := log.With().Str("container_id", containerID).Logger()
	container_info, err := a.Docker.Client.ContainerInspect(ctx, containerID)
	if err != nil {
		log.Error().Str("id", containerID).Err(err).Msg("failed to inspect container")
		return
	}
	logs, err := a.Docker.Client.ContainerLogs(a.Context, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Timestamps: true,
	})
	if err != nil {
		logger.Error().Err(err).Msg("failed to open reader for container logs")
		return
	}
	defer logs.Close()
	logger.Info().Msg("attaching to container logs")

	done := make(chan struct{})
	go func() {
		_, err := stdcopy.StdCopy(
			&containerLogWriter{
				Writer:    os.Stdout,
				Container: &container_info,
			},
			&containerLogWriter{
				Writer:    os.Stderr,
				Container: &container_info,
			},
			logs)

		if err != nil && err != io.EOF {
			logger.Error().Err(err).Msg("error reading container logs")
		}
		close(done)
	}()

	select {
	case <-ctx.Done():
		logger.Info().Msg("log streaming canceled")
		logs.Close()
		return
	case <-done:
		logger.Debug().Msg("log streaming completed")
		return
	}

}

type containerLogWriter struct {
	Writer    io.Writer
	Container *container.InspectResponse
	lastByte  byte
}

func (w *containerLogWriter) Write(p []byte) (n int, err error) {
	var prefix string
	if w.Writer == os.Stdout {
		prefix = fmt.Sprintf("[%s][stdout] ", w.Container.Name)
	} else if w.Writer == os.Stderr {
		prefix = fmt.Sprintf("[%s][stderr] ", w.Container.Name)
	}
	prefix_bytes := []byte(prefix)
	if w.lastByte == 0 || w.lastByte == '\n' {
		_, err = w.Writer.Write(prefix_bytes)
		if err != nil {
			return 0, err
		}
	}

	start := 0
	for i, b := range p {
		if b == '\n' && i < len(p)-1 {
			_, err = w.Writer.Write(p[start : i+1])
			if err != nil {
				return 0, err
			}
			_, err = w.Writer.Write(prefix_bytes)
			if err != nil {
				return 0, err
			}
			start = i + 1
		}
		w.lastByte = b
	}

	if start < len(p) {
		_, err = w.Writer.Write(p[start:])
		if err != nil {
			return 0, err
		}
	}
	return len(p), nil
}

func (a *AppCtx) spawnLogs(containerID string) context.CancelFunc {
	ctx, cancel := context.WithCancel(a.Context)
	go a.readLogs(ctx, containerID)
	return cancel
}

type BuildResponse struct {
	Stream string `json:"stream"`
	Error  string `json:"error"`
}

// src is the source folder
func (a *AppCtx) buildImage(fs embed.FS, dir string, image_tag string, dockerfile string) error {
	buildCtx, err := createBuildContext(fs, dir)
	if err != nil {
		return err
	}
	response, err := a.Docker.Client.ImageBuild(a.Context, buildCtx, types.ImageBuildOptions{
		Tags:       []string{image_tag},
		Dockerfile: dockerfile,
	})
	if err != nil {
		return err
	}
	decoder := json.NewDecoder(response.Body)
	for {
		var message BuildResponse
		if err := decoder.Decode(&message); err != nil {
			if err == io.EOF {
				break
			}
			cobra.CheckErr(err)
		}

		if message.Error != "" {
			a.Spinner.Stop()
			log.Error().Msg(message.Error)
			a.Spinner.Start()
			continue
		}

		if message.Stream != "" {
			cleanMsg := strings.TrimSuffix(message.Stream, "\n")
			if cleanMsg != "" {
				a.Spinner.Stop()
				fmt.Println(cleanMsg)
				a.Spinner.Start()
			}
		}
	}
	return nil
}

func createBuildContext(filesystem embed.FS, dir string) (*bytes.Buffer, error) {
	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)
	defer func() {
		if closeErr := tw.Close(); closeErr != nil {
			err := fmt.Errorf("failed to close tar writer: %w", closeErr)
			log.Error().Err(err).Msg("error closing tar writer")
			return
		}
	}()

	err := fs.WalkDir(filesystem, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		relPath, err := filepath.Rel(dir, path)
		if err != nil {
			return fmt.Errorf("failed to get relative path: %w", err)
		}
		data, err := filesystem.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", path, err)
		}
		info, err := d.Info()
		if err != nil {
			return fmt.Errorf("failed to get info for file %s: %w", path, err)
		}
		header := &tar.Header{
			Name:    relPath,
			Size:    info.Size(),
			Mode:    int64(info.Mode()),
			ModTime: info.ModTime(),
		}
		if err := tw.WriteHeader(header); err != nil {
			return fmt.Errorf("failed to write tar header: %w", err)
		}

		if _, err := tw.Write(data); err != nil {
			return fmt.Errorf("failed to write tar content: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to walk context path: %w", err)
	}
	return buf, nil
}

func (a *AppCtx) volumeExists(name string) (bool, error) {
	resp, err := a.Docker.Client.VolumeList(a.Context, volume.ListOptions{
		Filters: filters.NewArgs(filters.Arg("name", name)),
	})
	if err != nil {
		log.Error().Err(err).Msg("failed to check if volume exists")
		return false, err
	}
	return len(resp.Volumes) > 0, nil
}

func (a *AppCtx) imageExists(name string) (bool, error) {
	resp, err := a.Docker.Client.ImageList(a.Context, image.ListOptions{
		Filters: filters.NewArgs(filters.Arg("reference", name)),
	})
	if err != nil {
		log.Error().Err(err).Msg("failed to check if image exists")
		return false, err
	}
	return len(resp) > 0, nil
}
