package cmd

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/go-connections/nat"
	v1 "github.com/moby/docker-image-spec/specs-go/v1"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

type userPasswordPair struct {
	User     string
	Password string
}

type postgresCredentials struct {
	Bouncer    userPasswordPair
	Replicator userPasswordPair
	Postgres   userPasswordPair
}

var (
	postgresUpCmd = &cobra.Command{
		Use: "up",
		Run: WrapCommandWithResources(postgresUp, ResourceConfig{[]ResourceType{ResourceDocker, ResourceOnePassword}, []Network{NetworkDatabase}}),
	}
	postgresCmd = &cobra.Command{
		Use: "postgres",
	}
)

func getPostgresCmd() *cobra.Command {
	postgresCmd.AddCommand(postgresUpCmd)
	return postgresCmd
}

func postgresUp(cmd *cobra.Command, args []string) {
	app := GetApp(cmd)
	credentials, err := app.loadPostgresSecrets()
	if err != nil {
		log.Error().Err(err).Send()
		return
	}

	if err := credentials.startPrimary(&app); err != nil {
		log.Error().Err(err).Send()
		return
	}
	if err := credentials.startReplica(&app); err != nil {
		log.Error().Err(err).Send()
		return
	}
	if err := credentials.startBouncer(&app); err != nil {
		log.Error().Err(err).Send()
		return
	}
}

func (a *AppCtx) loadPostgresSecrets() (*postgresCredentials, error) {
	var keys = []string{
		"/Postgres/Replicator/username",
		"/Postgres/Replicator/password",
		"/Postgres/Root/username",
		"/Postgres/Root/password",
		"/Postgres/Bouncer/username",
		"/Postgres/Bouncer/password",
	}
	var prefixedKeys = make([]string, 0, len(keys))
	for _, key := range keys {
		prefixedKeys = append(prefixedKeys, a.Vault.Prefix+strings.TrimSpace(key))
	}
	secretsResponse, err := a.Vault.Client.Secrets().ResolveAll(a.Context, prefixedKeys)
	if err != nil {
		return nil, err
	}
	var secrets []string
	for _, key := range prefixedKeys {
		secret := secretsResponse.IndividualResponses[key]
		if secret.Error != nil {
			return nil, fmt.Errorf("error: %s", secret.Error.Type)
		}
		cleanedSecret := strings.TrimSpace(secret.Content.Secret)
		cleanedSecret = strings.TrimFunc(cleanedSecret, func(r rune) bool {
			return unicode.IsControl(r)
		})
		secrets = append(secrets, cleanedSecret)
	}
	var credentials = postgresCredentials{
		Replicator: userPasswordPair{
			User:     secrets[0],
			Password: secrets[1],
		},
		Postgres: userPasswordPair{
			User:     secrets[2],
			Password: secrets[3],
		},
		Bouncer: userPasswordPair{
			User:     secrets[4],
			Password: secrets[5],
		},
	}
	return &credentials, nil
}

func (c *postgresCredentials) startPrimary(app *AppCtx) error {
	containers, err := app.Docker.Client.ContainerList(app.Context, container.ListOptions{Filters: filters.NewArgs(filters.KeyValuePair{Key: "name", Value: "pg-primary"})})
	if err != nil {
		return err
	}
	if len(containers) > 0 {
		log.Info().Msg("primary pg container running")
		return nil
	}
	bouncer_init_sql := fmt.Sprintf(`
CREATE ROLE %s LOGIN;
-- set a password for the user
ALTER USER %s WITH PASSWORD '%s';
 
CREATE FUNCTION public.lookup (
   INOUT p_user     name,
   OUT   p_password text
) RETURNS record
   LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS
$$SELECT usename, passwd FROM pg_shadow WHERE usename = p_user$$;
 
-- make sure only 'pgbouncer' can use the function
REVOKE EXECUTE ON FUNCTION public.lookup(name) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup(name) TO %s;
	`, c.Bouncer.User, c.Bouncer.User, c.Bouncer.Password, c.Bouncer.User)
	temp_bouncer_init_sql, err := os.CreateTemp(os.TempDir(), "temp-postgres-bouncer-init-*.sql")
	if err != nil {
		return err
	}
	defer temp_bouncer_init_sql.Close()
	defer os.Remove(temp_bouncer_init_sql.Name())
	io.Copy(temp_bouncer_init_sql, strings.NewReader(bouncer_init_sql))
	response, err := app.Docker.Client.ContainerCreate(app.Context,
		&container.Config{
			AttachStdout: true,
			AttachStderr: true,
			AttachStdin:  false,

			OpenStdin: false,
			Image:     "postgres:17",
			Cmd: []string{
				"-c",
				"wal_level=replica",
				"-c",
				"max_wal_senders=10",
				"-c",
				"max_replication_slots=10",
			},
			Env: []string{
				fmt.Sprintf("POSTGRES_DB=%s", cfg.Postgres.DB),
				fmt.Sprintf("POSTGRES_USER=%s", c.Postgres.User),
				fmt.Sprintf("POSTGRES_PASSWORD=%s", c.Postgres.Password),
				"POSTGRES_HOST_AUTH_METHOD=scram-sha-256",
				fmt.Sprintf("POSTGRES_REPLICATION_USER=%s", c.Replicator.User),
				fmt.Sprintf("POSTGRES_REPLICATION_PASSWORD=%s", c.Replicator.Password),
			},
			Healthcheck: postgres_healthcheck,
		},
		&container.HostConfig{
			PortBindings: nat.PortMap{
				nat.Port("5432/tcp"): []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: "5432"}},
			},
			Mounts: []mount.Mount{
				{
					Type:   mount.TypeVolume,
					Source: "pg_primary_data",
					Target: "/var/lib/postgresql/data",
				},
				{
					Type:   mount.TypeBind,
					Source: temp_bouncer_init_sql.Name(),
					Target: "/docker-entrypoint-initdb.d/bouncer-init.sql",
				},
			},
		},
		&network.NetworkingConfig{
			EndpointsConfig: app.getNetworks(cfg.Networks.DatabaseNetworkName),
		},
		nil,
		"cansu.dev-pg-primary")
	if err != nil {
		return err
	}
	log.Info().Str("id", response.ID).Msg("created primary postgres container")
	err = app.Docker.Client.ContainerStart(app.Context, response.ID, container.StartOptions{})
	if err != nil {
		return err
	}
	cancel := app.spawnLogs(response.ID)
	defer cancel()
	if err := app.waitForContainerHealthWithConfig(response.ID, postgres_healthcheck); err != nil {
		return fmt.Errorf("start of primary postgres failed: %w", err)
	}
	return nil
}

func (c *postgresCredentials) startReplica(app *AppCtx) error {
	containers, err := app.Docker.Client.ContainerList(app.Context, container.ListOptions{Filters: filters.NewArgs(filters.KeyValuePair{Key: "name", Value: "pg-replica"})})
	if err != nil {
		return err
	}
	if len(containers) > 0 {
		log.Info().Msg("primary pg replica running")
		return nil
	}
	response, err := app.Docker.Client.ContainerCreate(app.Context,
		&container.Config{
			AttachStdout: true,
			AttachStderr: true,
			AttachStdin:  false,
			OpenStdin:    false,
			Image:        "postgres:17",
			Cmd: []string{
				"-c",
				"wal_level=replica",
				"-c",
				"max_wal_senders=10",
				"-c",
				"max_replication_slots=10",
			},
			Env: []string{
				fmt.Sprintf("POSTGRES_DB=%s", cfg.Postgres.DB),
				fmt.Sprintf("POSTGRES_USER=%s", c.Postgres.User),
				fmt.Sprintf("POSTGRES_PASSWORD=%s", c.Postgres.Password),
				"POSTGRES_HOST_AUTH_METHOD=scram-sha-256",
				"PGDATA=/var/lib/postgresql/data",
			},
			Healthcheck: postgres_healthcheck,
		},
		&container.HostConfig{
			Mounts: []mount.Mount{
				{
					Type:   mount.TypeVolume,
					Source: "pg_replica_data",
					Target: "/var/lib/postgresql/data",
				},
			},
		},
		&network.NetworkingConfig{
			EndpointsConfig: app.getNetworks(cfg.Networks.DatabaseNetworkName),
		},
		nil,
		"cansu.dev-pg-replica")
	if err != nil {
		return err
	}

	err = app.Docker.Client.ContainerStart(app.Context, response.ID, container.StartOptions{})
	if err != nil {
		return err
	}
	cancel := app.spawnLogs(response.ID)
	defer cancel()
	if err := app.waitForContainerHealthWithConfig(response.ID, postgres_healthcheck); err != nil {
		return fmt.Errorf("start of replica postgres failed: %w", err)
	}
	return nil
}

func (c *postgresCredentials) startBouncer(app *AppCtx) error {
	containers, err := app.Docker.Client.ContainerList(app.Context, container.ListOptions{
		Filters: filters.NewArgs(filters.KeyValuePair{Key: "name", Value: "pg-bouncer"}),
	})
	if err != nil {
		return err
	}
	if len(containers) > 0 {
		log.Info().Msg("pgbouncer container running")
		return nil
	}
	response, err := app.Docker.Client.ContainerCreate(app.Context,
		&container.Config{
			AttachStdout: true,
			AttachStderr: true,
			Image:        "edoburu/pgbouncer",
			Env: []string{
				"DB_HOST=cansu.dev-pg-primary",
				"DB_PORT=5432",
				"AUTH_USER=" + c.Bouncer.User,
				"AUTH_FILE=/etc/pgbouncer/userlist.txt",
				"AUTH_TYPE=scram-sha-256",
				"AUTH_QUERY='SELECT p_user, p_password FROM public.lookup($1)'",
				"LISTEN_PORT=6432",
				"LISTEN_ADDR=0.0.0.0",
				"POOL_MODE=session",
				"MAX_CLIENT_CONN=250",
				"DEFAULT_POOL_SIZE=20",
				"MIN_POOL_SIZE=5",
				"RESERVE_POOL_SIZE=10",
				"SERVER_RESET_QUERY=DISCARD ALL",
				"SERVER_CHECK_QUERY=SELECT 1",
				"SERVER_CHECK_DELAY=30",
				"IGNORE_STARTUP_PARAMETERS=extra_float_digits",
			},
			ExposedPorts: nat.PortSet{
				"6432/tcp": struct{}{},
			},
		},
		&container.HostConfig{
			PortBindings: nat.PortMap{
				nat.Port("6432/tcp"): []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: "6432"}},
			},
		},
		&network.NetworkingConfig{
			EndpointsConfig: app.getNetworks(cfg.Networks.DatabaseNetworkName),
		},
		nil,
		"cansu.dev-pg-bouncer",
	)
	if err != nil {
		return err
	}
	err = app.Docker.Client.ContainerStart(app.Context, response.ID, container.StartOptions{})
	if err != nil {
		return err
	}
	save_user_list, err := app.Docker.Client.ContainerExecCreate(app.Context, response.ID, container.ExecOptions{
		Cmd: []string{"/bin/sh", "-c", fmt.Sprintf("echo '%s %s' > /etc/pgbouncer/userlist.txt", c.Bouncer.User, c.Bouncer.Password)},
	})
	if err != nil {
		return err
	}
	err = app.Docker.Client.ContainerExecStart(app.Context, save_user_list.ID, container.ExecStartOptions{})
	if err != nil {
		return err
	}
	return nil
}

var postgres_healthcheck = &v1.HealthcheckConfig{
	Test:     []string{"CMD-SHELL", "pg_isready"},
	Interval: time.Second * 10,
	Timeout:  time.Second * 5,
	Retries:  5,
}
