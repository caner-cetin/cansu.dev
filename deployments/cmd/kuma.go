package cmd

import (
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/go-connections/nat"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var (
	kumaDownCmd = &cobra.Command{
		Use: "down",
		Run: WrapCommandWithResources(kumaDown, ResourceConfig{Resources: []ResourceType{ResourceDocker}}),
	}
	kumaUpCmd = &cobra.Command{
		Use: "up",
		Run: WrapCommandWithResources(kumaUp, ResourceConfig{Resources: []ResourceType{ResourceDocker}, Networks: []Network{NetworkDatabase, NetworkUptime}}),
	}
	kumaCmd = &cobra.Command{
		Use: "kuma",
	}
)

func getKumaCmd() *cobra.Command {
	kumaCmd.AddCommand(kumaDownCmd)
	kumaCmd.AddCommand(kumaUpCmd)
	return kumaCmd
}

func kumaUp(cmd *cobra.Command, args []string) {
	app := GetApp(cmd)
	app.Spinner.Prefix = "creating container"
	app.Spinner.Start()
	resp, err := app.Docker.Client.ContainerCreate(cmd.Context(),
		&container.Config{
			AttachStdout: true,
			AttachStderr: true,
			AttachStdin:  false,
			OpenStdin:    false,
			Image:        "louislam/uptime-kuma:1",
			ExposedPorts: nat.PortSet{
				nat.Port("3001/tcp"): struct{}{},
			},
		},
		&container.HostConfig{
			RestartPolicy: container.RestartPolicy{Name: container.RestartPolicyAlways},
			PortBindings:  nat.PortMap{nat.Port("3001/tcp"): []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: "3001"}}},
			Mounts: []mount.Mount{
				{
					Type:   mount.TypeVolume,
					Source: "kuma_kuma_data",
					Target: "/app/data",
				},
			},
		},
		&network.NetworkingConfig{
			EndpointsConfig: app.getNetworks(cfg.Networks.DatabaseNetworkName, cfg.Networks.UptimeNetworkName),
		},
		nil,
		"uptime",
	)
	if err != nil {
		app.Spinner.Stop()
		log.Error().Err(err).Send()
		return
	}
	app.Spinner.Prefix = "starting container"
	if err := app.Docker.Client.ContainerStart(app.Context, resp.ID, container.StartOptions{}); err != nil {
		app.Spinner.Start()
		log.Error().Err(err).Send()
		return
	}
	go app.spawnLogs(resp.ID)
	app.Spinner.Stop()
}

func kumaDown(cmd *cobra.Command, args []string) {
	app := GetApp(cmd)
	sum, err := app.Docker.Client.ContainerList(app.Context, container.ListOptions{Filters: filters.NewArgs(filters.KeyValuePair{Key: "name", Value: "uptime"})})
	if err != nil {
		log.Error().Err(err).Send()
		return
	}

	if err := app.Docker.Client.ContainerStop(app.Context, sum[0].ID, container.StopOptions{}); err != nil {
		log.Error().Err(err).Send()
		return
	}
}
