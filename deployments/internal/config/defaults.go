package config

func (c Root) SetDefaults() {
	if c.Docker.Socket == "" {
		c.Docker.Socket = "unix:///var/run/docker.sock"
	}
	if c.Postgres.DB == "" {
		c.Postgres.DB = "postgres"
	}
	if c.Networks.DatabaseNetworkName == "" {
		c.Networks.DatabaseNetworkName = "database_bridge"
	}
	if c.Networks.UptimeNetworkName == "" {
		c.Networks.UptimeNetworkName = "vault_name"
	}
}