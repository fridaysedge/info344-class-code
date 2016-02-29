package main

import (
	"os"
	"log"
	"encoding/csv"
	"fmt"
	"io"
)

func main(){
	
	file, err := os.Open("zip_code_database.csv")
	
	if err != nil {
		fmt.Println(err)
		return
    }
		
	reader := csv.NewReader(file)
	
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println(record)
	}
	
	file.Close()
}