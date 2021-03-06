package main

import (
    "bufio"
    "fmt"
    "os"
    "github.com/fridaysedge/info344-class-code/gotrie/wordTrie"
)
	
func check(e error) {
    if e != nil {
        panic(e)
    }
}

func main() {

    wordTrie := wordTrie.NewTrie()
    
    // Open the text file
    f, err := os.Open("wordsEn.txt")
    check(err)
    
    // Begin scanning the text file line by line
    scanner := bufio.NewScanner(f)
	for scanner.Scan() {
        wordTrie.AddEntry(scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "reading standard input:", err)
	}

    f.Close()
    
    var listOfWords []string
    listOfWords = wordTrie.FindEntries("car", 10)
    fmt.Println(listOfWords)
    fmt.Println(wordTrie.GetNumberOfItems())
}