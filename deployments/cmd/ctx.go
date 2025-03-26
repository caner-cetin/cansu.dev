package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/1password/onepassword-sdk-go"
	"github.com/cansu.dev/oblivion/internal"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

type AppCtx struct {
	Docker *client.Client
	Vault  struct {
		Prefix string
		Client *onepassword.Client
		ID     string
	}
	Context context.Context
}

type ContextKey string

var (
	APP_CONTEXT_KEY ContextKey = "oblivion.app"
)

type ResourceType int

const (
	ResourceDocker ResourceType = iota
	ResourceOnePassword
)

func WrapCommandWithResources(fn func(cmd *cobra.Command, args []string), resources []ResourceType) func(cmd *cobra.Command, args []string) {
	return func(cmd *cobra.Command, args []string) {
		appCtx := AppCtx{}
		appCtx.Context = cmd.Context()
		for _, resource := range resources {
			switch resource {
			case ResourceDocker:
				if err := appCtx.InitializeDocker(); err != nil {
					log.Error().Err(err).Msg("failed to initialize docker")
					return
				}
			case ResourceOnePassword:
				if err := appCtx.InitializeOnePass(); err != nil {
					log.Error().Err(err).Msg("failed to initialize onepassword")
					return
				}
			}
		}
		defer func() {
			if appCtx.Docker != nil {
				if err := appCtx.Docker.Close(); err != nil {
					log.Error().Err(err).Msg("failed to close docker client")
				}
			}
		}()
		cmd.SetContext(context.WithValue(cmd.Context(), APP_CONTEXT_KEY, appCtx))
		fn(cmd, args)
	}
}

func (ctx *AppCtx) InitializeDocker() error {
	client, err := NewDockerClient()
	if err != nil {
		return err
	}
	ctx.Docker = client
	return nil
}

func (ctx *AppCtx) InitializeOnePass() error {
	token := os.Getenv("OP_SERVICE_ACCOUNT_TOKEN")
	if token == "" {
		return fmt.Errorf("onepassword service account token not set")
	}
	client, err := onepassword.NewClient(
		ctx.Context,
		onepassword.WithServiceAccountToken(token),
		onepassword.WithIntegrationInfo("cansu-dev - Oblivion", internal.Version),
	)
	if err != nil {
		return err
	}
	ctx.Vault.Client = client
	ctx.Vault.Prefix = fmt.Sprintf("op://%s", cfg.Onepass.VaultName)
	vaults, err := ctx.Vault.Client.Vaults().ListAll(ctx.Context)
	if err != nil {
		return err
	}
	for {
		vault, err := vaults.Next()
		if err != nil {
			if err == onepassword.ErrorIteratorDone {
				break
			}
			return fmt.Errorf("error reading vaults: %w", err)
		}
		if vault.Title == cfg.Onepass.VaultName {
			ctx.Vault.ID = vault.ID
			break
		}
	}
	if ctx.Vault.ID == "" {
		return fmt.Errorf("cannot find vault id from name %s", cfg.Onepass.VaultName)
	}
	return nil
}

func NewDockerClient() (*client.Client, error) {
	if cfg.Docker.Socket == "" {
		log.Warn().Msg("docker socket is not set, defaulting back to unix:///var/run/docker.sock")
		os.Setenv(client.DefaultDockerHost, "unix:///var/run/docker.sock")
	} else {
		os.Setenv(client.DefaultDockerHost, cfg.Docker.Socket)
	}
	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return docker, nil
}

func GetApp(cmd *cobra.Command) AppCtx {
	return cmd.Context().Value(APP_CONTEXT_KEY).(AppCtx)
}
