package readWordFile

import (
    "bufio"
    "fmt"
    "os"
    "strconv"
    "runtime"
    "github.com/fridaysedge/info344-class-code/suggestion-service-mod/wordTrie"
)

var trie = wordTrie.NewTrie()
var mem runtime.MemStats
var memoryLimit = uint64(1000000000)

/*
*/	
func check(e error) {
    if e != nil {
        panic(e)
    }
}

/*
Populates a trie structure with the contents of a text file that
has the provided name
*/
func PopulateTrie(file string){
    // Open the text file
    f, err := os.Open(file)
    //f, err := os.Open(file)
    check(err)
    
    // Begin scanning the text file line by line, populate the trie
    scanner := bufio.NewScanner(f)
    
    // Initial available memory read prior to entering the while loop
    runtime.ReadMemStats(&mem)
    currentMemory := mem.Alloc
    
    // Add entries to the trie as long as there is enough memory
	for scanner.Scan() && currentMemory < memoryLimit {
        runtime.ReadMemStats(&mem)
        currentMemory = mem.TotalAlloc
        trie.AddEntry(scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "reading standard input:", err)
	}
    f.Close()
    
    fmt.Println(trie.GetNumberOfItems()) //TESTING
}

/*
Returns a list of words no longer than the provided maximum length
that match the provided prefix. 
*/
func FindWords(prefix string, max string) []string {
    convertedMax, _ := strconv.ParseInt(max, 10, 8)
    var listOfWords []string
    listOfWords = trie.FindEntries(prefix, uint8(convertedMax))
    return listOfWords
}