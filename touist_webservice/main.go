package main

import (
	"bufio"
	"fmt"
	"github.com/gorilla/websocket"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

func ServeTouist(w http.ResponseWriter, r *http.Request) {
	args := r.PostFormValue("args")
	stdin := r.PostFormValue("stdin")

	log.Println("Got request with args: ", args)

	argsArr := []string{"-"}
	argsArr = append(argsArr, strings.Fields(args)...)

	cmd := exec.Command("touist", argsArr...)
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

type InputMsg struct {
	Args  string `json:"args"`
	Stdin string `json:"stdin"`
}

type AdditionalInputMsg struct {
	Stdin string `json:"stdin"`
}

type OutMsg struct {
	Type string `json:"type"`
	Msg  string `json:"msg"`
}

var upgrader = websocket.Upgrader{
	EnableCompression: true,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeTouistWs(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade err:", err)
		return
	}

	wsclosed := make(chan struct{}, 1)
	c.SetCloseHandler(func(code int, text string) error {
		wsclosed <- struct{}{}
		return nil
	})

	var inp InputMsg

	err = c.ReadJSON(&inp)
	if err != nil {
		log.Println("Invalid input json: ", err)
		return
	}

	tmpfile, err := ioutil.TempFile("", "example.*.txt")
	if err != nil {
		log.Println("couldnt open tempfile: ", err)
		return
	}
	name := tmpfile.Name()
	defer os.Remove(name)
	if _, err := io.WriteString(tmpfile, inp.Stdin); err != nil {
		log.Println("coudnt write stdin to tempfile: ", err)
		return
	}
	if err := tmpfile.Close(); err != nil {
		log.Println("couldnt close tempfile: ", err)
		return
	}

	log.Println("Got ws request with args: ", inp.Args)

	argsArr := []string{name}
	argsArr = append(argsArr, strings.Fields(inp.Args)...)

	cmd := exec.Command("touist", argsArr...)

	cmdWriter, err := cmd.StdinPipe()
	if err != nil {
		log.Println("Error creating StdinPipe for Cmd: ", err)
		return
	}

	// create a pipe for the output of the script
	cmdReader, err := cmd.StdoutPipe()
	if err != nil {
		log.Println("Error creating StdoutPipe for Cmd: ", err)
		return
	}
	// create a pipe for the output of the script
	cmdReaderErr, err := cmd.StderrPipe()
	if err != nil {
		log.Println("Error creating StderrPipe for Cmd: ", err)
		return
	}

	scanner := bufio.NewScanner(cmdReader)
	scannererr := bufio.NewScanner(cmdReaderErr)

	err = cmd.Start()
	if err != nil {
		log.Println("Error starting cmd: ", err)
	}

	isDone := false
	go func() {
		_ = cmd.Wait()
		isDone = true
	}()

	defer func() {
		log.Println("ws over")
		if !isDone {
			_ = cmd.Process.Kill()
		}
	}()

	msgdone := make(chan struct{}, 1)
	stdoutmsgs := make(chan string, 1)
	go func() {
		for scanner.Scan() {
			stdoutmsgs <- string(scanner.Bytes())
		}
		msgdone <- struct{}{}
	}()

	stderrmsgs := make(chan string, 1)
	go func() {
		for scannererr.Scan() {
			stderrmsgs <- string(scannererr.Bytes())
		}
	}()

	inmsgs := make(chan string, 1)
	go func() {
		var addInput AdditionalInputMsg
		err := c.ReadJSON(&addInput)
		inmsgs <- addInput.Stdin
		for err == nil {
			err = c.ReadJSON(&addInput)
			inmsgs <- addInput.Stdin
		}
	}()

	for {
		select {
		case inm := <-inmsgs:
			_, err = io.WriteString(cmdWriter, inm)
			if err != nil {
				log.Println("Error trying to write to process: ", err)
			}
		case msg := <-stdoutmsgs:
			err = c.WriteJSON(OutMsg{Type: "stdout", Msg: msg})
			if err != nil {
				return
			}
		case msg := <-stderrmsgs:
			err = c.WriteJSON(OutMsg{Type: "stderr", Msg: msg})
			if err != nil {
				return
			}
		case <-msgdone:
			err = c.Close()
			return
		case <-wsclosed:
			log.Println("Closed early")
			return
		}
	}
}

func ServeHomepage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "touist_test.html")
}

func main() {
	http.HandleFunc("/touist_cmd", ServeTouist)
	http.HandleFunc("/index.html", ServeHomepage)
	http.HandleFunc("/touist_ws", ServeTouistWs)

	log.Println("Touist webservice started!")
	log.Fatal(http.ListenAndServe(":7015", nil))
}
