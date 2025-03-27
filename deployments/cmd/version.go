package cmd

import (
	"fmt"

	"github.com/cansu.dev/oblivion/internal"
	"github.com/spf13/cobra"
)

var (
	versionCmd = &cobra.Command{
		Use: "version",
		Run: WrapCommandWithResources(version, ResourceConfig{Resources: []ResourceType{ResourceDocker}}),
	}
)

func getVersionCmd() *cobra.Command {
	return versionCmd
}

func version(cmd *cobra.Command, args []string) {
	app := GetApp(cmd)
	fmt.Printf("Oblivion %s \n", internal.Version)
	fmt.Printf("Docker API %s \n", app.Docker.Client.ClientVersion())
}
