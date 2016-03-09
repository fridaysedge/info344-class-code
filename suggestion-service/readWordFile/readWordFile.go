package readWordFile

import (
    "bufio"
    "fmt"
    "os"
    "strconv"
    "github.com/fridaysedge/info344-class-code/suggestion-service/wordTrie"
)
	
func check(e error) {
    if e != nil {
        panic(e)
    }
}

func FindWords(prefix string, max string) []string {
    
    convertedMax, _ := strconv.ParseInt(max, 10, 8)

    wordTrie := wordTrie.NewTrie()
    
    // Open the text file
    f, err := os.Open("./files/wordsEn.txt")
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
    listOfWords = wordTrie.FindEntries(prefix, uint8(convertedMax))
    return listOfWords
}