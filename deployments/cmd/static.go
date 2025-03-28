package cmd

import (
	"embed"
	"os"
	"os/exec"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/go-connections/nat"
	v1 "github.com/moby/docker-image-spec/specs-go/v1"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

//go:embed config/static/*
var staticBuildFiles embed.FS

var (
	staticUpCmd = &cobra.Command{
		Use: "up",
		Run: WrapCommandWithResources(staticUp, ResourceConfig{Resources: []ResourceType{ResourceDocker}}),
	}
	staticCmd = &cobra.Command{
		Use: "static",
	}
)

func getStaticCmd() *cobra.Command {
	staticCmd.AddCommand(staticUpCmd)
	return staticCmd
}

func staticUp(cmd *cobra.Command, args []string) {
	app := GetApp(cmd)
	app.Spinner.Prefix = "building static"
	app.Spinner.Start()
	app.Spinner.Prefix = "checking for nginx image"
	defer app.Spinner.Stop()
	exists, err := app.imageExists("cansu.dev-static-nginx")
	if err != nil {
		log.Error().Err(err).Msg("failed to check if volume exists")
		return
	}
	if !exists {
		app.Spinner.Prefix = "building image..."
		if err := app.buildImage(staticBuildFiles, "config/static", "cansu.dev-static-nginx", "nginx.Dockerfile"); err != nil {
			log.Error().Err(err).Send()
			return
		}
	}
	app.Spinner.Prefix = "checking for content volume"
	exists, err = app.volumeExists("static_content")
	if err != nil {
		log.Error().Err(err).Msg("failed to check if volume exists")
		return
	}
	if !exists {
		_, err := os.Stat("/var/www/servers/cansu.dev/static")
		if os.IsNotExist(err) {
			app.Spinner.Stop()
			log.Warn().Msg("directory /var/www/servers/cansu.dev/static doesn't exist. root privileges needed to create it.")

			cmd := exec.Command("sudo", "mkdir", "-p", "/var/www/servers/cansu.dev/static")
			cmd.Stdin = os.Stdin
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr

			if err := cmd.Run(); err != nil {
				log.Error().Err(err).Msg("Failed to create directory with sudo")
				return
			}

			// also set permissions to allow your user to write to it
			chownCmd := exec.Command("sudo", "chown", "-R", os.Getenv("USER"), "/var/www/servers/cansu.dev/static")
			chownCmd.Stdin = os.Stdin
			chownCmd.Stdout = os.Stdout
			chownCmd.Stderr = os.Stderr

			if err := chownCmd.Run(); err != nil {
				log.Error().Err(err).Msg("Failed to set directory permissions")
				return
			}

			app.Spinner.Start()
		} else if err != nil {
			log.Error().Err(err).Str("path", "/var/www/servers/cansu.dev/static").Msg("Failed to check if directory exists")
			return
		}
		app.Spinner.Prefix = "creating content volume"
		_, err = app.Docker.Client.VolumeCreate(app.Context, volume.CreateOptions{
			Driver: "local",
			DriverOpts: map[string]string{
				"type":   "none",
				"o":      "bind",
				"device": "/var/www/servers/cansu.dev/static",
			},
			Name: "static_content",
		})
		if err != nil {
			log.Error().Err(err).Msg("failed to create static volume")
			return
		}
	}
	app.Spinner.Prefix = "creating static container"
	resp, err := app.Docker.Client.ContainerCreate(app.Context,
		&container.Config{
			Image:        "cansu.dev-static-nginx",
			AttachStdout: true,
			AttachStderr: true,
			AttachStdin:  false,
			OpenStdin:    false,
			Healthcheck:  nginx_healthcheck,
		},
		&container.HostConfig{
			PortBindings: nat.PortMap{
				nat.Port("80/tcp"): []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: "44444"}},
			},
			Mounts: []mount.Mount{
				{
					Type:   mount.TypeVolume,
					Source: "static_content",
					Target: "/var/www/servers/cansu.dev/static/",
				},
			},
		},
		nil,
		nil,
		"file-server",
	)
	if err != nil {
		log.Error().Err(err).Msg("failed to create static container")
		return
	}
	app.Spinner.Prefix = "starting container"
	if err := app.Docker.Client.ContainerStart(app.Context, resp.ID, container.StartOptions{}); err != nil {
		log.Error().Err(err).Send()
		return
	}
	if err := app.waitForContainerHealthWithConfig(resp.ID, nginx_healthcheck); err != nil {
		log.Error().Err(err).Send()
		return
	}

}

var nginx_healthcheck = &v1.HealthcheckConfig{
	Test:     []string{"CMD-SHELL", "wget -O /dev/null http://localhost || exit 1"},
	Interval: 5 * time.Second,
	Timeout:  10 * time.Second,
	Retries:  10,
}
