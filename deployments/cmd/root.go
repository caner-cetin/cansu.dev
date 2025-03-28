package cmd

import (
	"os"
	"path/filepath"

	"github.com/cansu.dev/oblivion/internal"
	"github.com/cansu.dev/oblivion/internal/config"
	"github.com/pelletier/go-toml/v2"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var cfg = &config.Config
var cfgPath string

var rootCmd = &cobra.Command{
	Use:   "oblivion",
	Short: "deployment setup for cansu.dev",
	Long:  `A DEAD ROAD, A DARK SUN, NOW WAITS BEYOND OBLIIVIIOOOOOOOOOOOOOOOON`,
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	initConfig()
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
	rootCmd.Flags().StringVar(&cfgPath, "config", "", "toml path (default $HOME/.oblivion.toml)")
	rootCmd.AddCommand(getPostgresCmd())
	rootCmd.AddCommand(getVersionCmd())
	rootCmd.AddCommand(getKumaCmd())
	rootCmd.AddCommand(getStaticCmd())
}

func initConfig() {
	if cfgPath == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			log.Error().Err(err).Send()
			return
		}
		cfgPath = filepath.Join(home, ".oblivion.toml")
	}
	contents, err := internal.ReadFile(cfgPath)
	if err != nil {
		log.Error().Err(err).Send()
		return
	}
	cfg.SetDefaults()
	toml.Unmarshal(contents, cfg)
}
