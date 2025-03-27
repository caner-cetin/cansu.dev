package config

// this wont override your config https://stackoverflow.com/a/30445480
func (c *Root) SetDefaults() {
	c.Docker.Socket = "unix:///var/run/docker.sock"
	c.Postgres.DB = "postgres"
	c.Networks.DatabaseNetworkName = "database_bridge"
	c.Networks.UptimeNetworkName = "uptime_bridge"
	c.Onepass.VaultName = "Server"
}