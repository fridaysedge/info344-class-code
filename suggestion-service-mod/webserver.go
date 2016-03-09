package main

import (
	"net/http"
	"fmt"
	"encoding/json"
	"log"
    "github.com/fridaysedge/info344-class-code/suggestion-service-mod/readWordFile"
)

// HelloResponse represents a response from the hello route
type SuggestionResponse struct {
	// Override the json output using`` syntax after variables/types
	Suggestions []string `json:"suggestions"`
}

func landing(w http.ResponseWriter, r *http.Request){
	http.ServeFile(w, r, "static/index.html")
	readWordFile.PopulateTrie("./files/enwiki-latest-all-titles-in-ns0")
}

// sayHello handles the http read and write
func suggestions(w http.ResponseWriter, r *http.Request){

    // Retrieve the variable in the query string
    q := r.URL.Query().Get("q")
    max := r.URL.Query().Get("max")
    
    wordList := readWordFile.FindWords(q, max)

    // Build the response
	resp := SuggestionResponse{Suggestions: wordList}
	
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
}

func main(){
	//http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/", landing)
	http.HandleFunc("/api/v1/suggestions", suggestions)
	fmt.Println("Server listening on port 9000")
    // This stops the flow until the server is manually shut down
	http.ListenAndServe(":9000", nil)
}

