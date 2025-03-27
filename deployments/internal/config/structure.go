package config

type Root struct {
	Docker   DockerConfig
	Networks NetworkConfig
	Postgres PostgresConfig
	Onepass  OnepasswordConfig `toml:"onepass"`
}

type DockerConfig struct {
	Socket string
}

type NetworkConfig struct {
	DatabaseNetworkName string `toml:"database_network_name"`
	UptimeNetworkName   string `toml:"uptime_network_name"`
}

type OnepasswordConfig struct {
	VaultName string `toml:"vault_name"`
}

type PostgresConfig struct {
	DB string `toml:"db"`
}

var Config Root
