package main

import (
	"net/http"
	"fmt"
	"time"
	"encoding/json"
	"log"
)

type HelloResponse struct {
	Name string `json:"name"`
	Message string `json:"message"`
	GeneratedAt time.Time `json:"generatedAt"`
}

func sayHello(w http.ResponseWriter, r *http.Request){
	name := r.URL.Path[len("/api/v1/hello/"):]
	resp := HelloResponse{Name: name, 
		Message: "Hello " + name,
		GeneratedAt: time.Now()}
	
	j, err := json.Marshal(resp)
	if nil != err {
		log.Println(err)
		w.WriteHeader(500)
		w.Write([]byte(err.Error()))
	} else {
		w.Header().Add("Content-Type", "application/json")
		w.Write(j)
	}
	//w.Write([]byte("Hello World"))
	//w.Write([]byte("Hello " + name))
}

func main(){
	//http.HandleFunc("/", sayHello)
	http.Handle("/", http.FileServer(http.Dir("./static")))
	//http.HandleFunc("/api/v1/hello", sayHello)
	http.HandleFunc("/api/v1/hello/", sayHello)
	
	fmt.Println("Server listening on port 9000")
	http.ListenAndServe(":9000", nil)
}

