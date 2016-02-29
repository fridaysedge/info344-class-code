package main

import (
	"net/http"
	"fmt"
	"time"
	"encoding/json"
	"log"
)

type HelloResponse struct {
	// Override the json output using`` syntax after variables/types
	Name string `json:"name"`
	Message string `json:"message"`
	GeneratedAt time.Time `json:"generatedAt"`
}

func sayHello(w http.ResponseWriter, r *http.Request){
	// Get whatever follows /api/v1/hello/
	// On the requested URL
	name := r.URL.Path[len("/api/v1/hello/"):]
	// Create and initialize the response structure
	resp := HelloResponse{Name: name, 
		Message: "Hello " + name,
		GeneratedAt: time.Now()}
	
	// Convert the structure to json
	j, err := json.Marshal(resp)
	if nil != err {
		log.Println(err)
		w.WriteHeader(500)
		w.Write([]byte(err.Error()))
	} else {
		// Tell the client we are sending back JSON
		w.Header().Add("Content-Type", "application/json")
		w.Write(j)
	}
	// Basic examples
	//w.Write([]byte("Hello World"))
	//w.Write([]byte("Hello " + name))
}

func main(){
	//http.HandleFunc("/", sayHello)
	http.Handle("/", http.FileServer(http.Dir("./static")))
	//http.HandleFunc("/api/v1/hello", sayHello)
	http.HandleFunc("/api/v1/hello/", sayHello)
	
	fmt.Println("Server listening on port 9000")
	
	// This stops the flow until the server is manually shut down
	http.ListenAndServe(":9000", nil)
}

