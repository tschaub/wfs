package cmd

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os/exec"
	"runtime"
	"strings"

	"github.com/gobuffalo/packr"
	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
)

var (
	servePort     int
	serveUpstream string
	serveOpen     bool
)

func init() {
	var defaultPort = 8080
	var defaultOpen = true

	flags := serveCmd.Flags()
	flags.IntVar(&servePort, "port", defaultPort, "listen on this port")
	flags.BoolVar(&serveOpen, "open", defaultOpen, "open a browser")

	rootCmd.AddCommand(serveCmd)
}

// open opens the specified URL in the default browser of the user.
func open(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}

var serveCmd = &cobra.Command{
	Use:   "serve [upstream]",
	Short: "Serve a WFS client",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		upstream, err := url.Parse(args[0])
		if err != nil {
			return err
		}

		r := mux.NewRouter()

		r.PathPrefix("/wfs").Handler(http.StripPrefix("/wfs", newReverseProxy(upstream)))

		// serve the client
		box := packr.NewBox("../public")
		r.PathPrefix("/").Handler(http.FileServer(box))

		http.Handle("/", r)

		addr := fmt.Sprintf(":%d", servePort)
		url := fmt.Sprintf("http://localhost%s", addr)

		if serveOpen {
			go open(url)
		}
		fmt.Printf("Listening on %s\n", url)
		return http.ListenAndServe(addr, nil)
	},
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}

func newReverseProxy(upstream *url.URL) *httputil.ReverseProxy {
	director := func(req *http.Request) {
		req.URL.Scheme = upstream.Scheme
		req.URL.Host = upstream.Host
		req.Host = upstream.Host
		req.URL.Path = singleJoiningSlash(upstream.Path, req.URL.Path)
		if upstream.RawQuery == "" || req.URL.RawQuery == "" {
			req.URL.RawQuery = upstream.RawQuery + req.URL.RawQuery
		} else {
			req.URL.RawQuery = upstream.RawQuery + "&" + req.URL.RawQuery
		}
		if _, ok := req.Header["User-Agent"]; !ok {
			req.Header.Set("User-Agent", "")
		}
	}

	modifier := func(res *http.Response) error {
		origin := res.Request.Header.Get("Origin")
		if origin != "" {
			res.Header.Set("Access-Control-Allow-Origin", origin)
			res.Header.Set("Access-Control-Max-Age", "86400")
			res.Header.Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
			res.Header.Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if res.Request.Method == http.MethodOptions && res.StatusCode == http.StatusMethodNotAllowed {
			res.StatusCode = http.StatusOK
			res.Status = http.StatusText(http.StatusOK)
		}
		return nil
	}

	return &httputil.ReverseProxy{Director: director, ModifyResponse: modifier}
}
