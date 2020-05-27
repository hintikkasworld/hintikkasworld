package main

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

func ServeTouist(w http.ResponseWriter, r *http.Request) {
	args := r.PostFormValue("args")
	stdin := r.PostFormValue("stdin")

	log.Println("Got request with args: ", args)

	argsArr := []string{"-"}
	argsArr = append(argsArr, strings.Fields(args)...)

	cmd := exec.Command("touist-cli", argsArr...)
	cmd.Stdin = strings.NewReader(stdin)

	cmd.Stdout = w
	cmd.Stderr = w

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text")
	w.WriteHeader(http.StatusOK)

	err := cmd.Run()

	if e, ok := err.(*exec.ExitError); ok {
		log.Println("Failed with code ", e.ExitCode())
		_, _ = fmt.Fprintln(w, "Exit code", e.ExitCode())
		return
	}
}

func ServeHomepage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "touist_test.html")
}

func main() {
	http.HandleFunc("/touist_cmd", ServeTouist)
	http.HandleFunc("/index.html", ServeHomepage)

	log.Println("Touist webservice started!")
	log.Fatal(http.ListenAndServe(":7015", nil))
}
