package wordTrie

import (
    "fmt"
)

// Stores a pointer to the root node of a Trie
type Trie struct {
    root *node
}

// Stores character, children, and whether node is end of a word.
type node struct {
    character string
    children map[string]*node
    wordEnd bool
}

// Returns the root of an empty wordTrie
func CreateTrie() *Trie {
    root := &Trie {
        &node{
            character: "",
            children: make(map[string]*node),
        },
    }
    return root
}

// Adds a word to a Trie
func (trie *Trie) AddEntry(entry string) {
    addEntry(trie.root, entry)
}

// Adds a word to a Trie
func addEntry(curNode *node, entry string) {
    characters := []rune(entry)
    
    // Is this the end of the word?
    if len(characters) == 0 {
        curNode.wordEnd = true
    } else {
        firstCharacter := string(characters[0])
        fmt.Println(firstCharacter) // FOR TESTING
        remainCharacters := string(characters[1:])
        tempNode := curNode.children[firstCharacter]
        
        // Does the first character exist in the children?
        if tempNode != nil {
            // If true recurse down to that node.
            addEntry(tempNode, remainCharacters)
        } else {
            // If true create a new node, then recurse down it.
            newNode := &node {
                character: firstCharacter,
                children: make(map[string]*node),
            }
            curNode.children[firstCharacter] = newNode
            addEntry(newNode, remainCharacters)
        }
    }
 }

// Returns a list of words that potentially match the provided prefix.
func (trie *Trie) FindEntries(prefix string, max uint8) []string {
    var words []string
    characters := []rune(prefix)
    tempNode = trie.root
    
    for max > 0 {
        if len(characters) != 0 {
            firstCharacter := string(characters[0])
            characters = string(characters[1:])
            tempNode = tempNode.children[firstCharacter]
        } else {
            for key, value :=  range tempNode.children{
                
            }
        }
    }
    
    return words
}
