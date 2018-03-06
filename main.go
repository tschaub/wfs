package main

import (
	"fmt"

	"github.com/tschaub/wfs/cmd"
)

var (
	Version string
	Build   string
)

func main() {
	cmd.Execute(fmt.Sprintf("%s.%s", Version, Build))
}
