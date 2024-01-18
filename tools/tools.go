//go:build tools

package tools

import (
	_ "github.com/google/wire"
	_ "github.com/onsi/ginkgo/v2"
	_ "go.uber.org/mock/mockgen"
)