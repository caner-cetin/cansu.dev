package cmd

import (
	"fmt"
	"time"

	"github.com/docker/docker/api/types"
	v1 "github.com/moby/docker-image-spec/specs-go/v1"
	"github.com/rs/zerolog/log"
)

func (a *AppCtx) waitForContainerHealthWithConfig(containerID string, healthConfig *v1.HealthcheckConfig) error {
	if healthConfig == nil {
		return fmt.Errorf("health config is nil")
	}

	startTime := time.Now()
	for i := 0; i < int(healthConfig.Retries); i++ {
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
