package cmd

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/pkg/stdcopy"
	v1 "github.com/moby/docker-image-spec/specs-go/v1"
	"github.com/rs/zerolog/log"
)

func (a *AppCtx) waitForContainerHealthWithConfig(containerID string, healthConfig *v1.HealthcheckConfig) error {
	if healthConfig == nil {
		return fmt.Errorf("health config is nil")
	}
	startTime := time.Now()
	for range healthConfig.Retries {
		inspect, err := a.Docker.ContainerInspect(a.Context, containerID)
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
	container_info, err := a.Docker.ContainerInspect(ctx, containerID)
	if err != nil {
		log.Error().Str("id", containerID).Err(err).Msg("failed to inspect container")
		return
	}
	logs, err := a.Docker.ContainerLogs(a.Context, containerID, container.LogsOptions{
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
