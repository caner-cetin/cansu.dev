package cmd

import (
	"context"
	"fmt"

	"github.com/docker/docker/api/types/network"
)

func (a *AppCtx) getNetworkIDByName(ctx context.Context, networkName string) (string, error) {
	networks, err := a.Docker.NetworkList(ctx, network.ListOptions{})
	if err != nil {
		return "", err
	}

	for _, network := range networks {
		if network.Name == networkName {
			return network.ID, nil
		}
	}

	return "", fmt.Errorf("network with name '%s' not found", networkName)
}
