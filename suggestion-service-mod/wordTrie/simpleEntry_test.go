package wordTrie

import(
    "testing"
    "github.com/fridaysedge/info344-class-code/suggestion-service-mod/wordTrie"
) 

func testEntry(t *testing.T){
    var trie = wordTrie.NewTrie()
    trie.AddEntry("car")
    trie.AddEntry("cars")
    word := trie.FindEntries("c", uint8(5))
    if string(word) != "[car cars]" {
        t.Errorf("Entry not correct")
    }
}

