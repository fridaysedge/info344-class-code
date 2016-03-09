package wordTrie

import (
    "strings"
)

/*
Stores a pointer to the root node of a Trie
*/
type Trie struct {
    root *node
    numberOfItems int64
}

/*
Stores character, children, and whether node is end of a word.
*/
type node struct {
    character string
    children map[string]*node
    wordEnd bool
}

/*
Returns the root of an empty word Trie
*/
func NewTrie() *Trie {
    root := &Trie {
        &node{
            character: "",
            children: make(map[string]*node),
        },
        0,
    }
    return root
}

/*
Returns the number of items in the trie
*/
func (trie *Trie) GetNumberOfItems() int64 {
    return trie.numberOfItems
}

/*
Adds a word to this Trie
*/
func (trie *Trie) AddEntry(entry string) {
    entry = strings.ToLower(entry)
    addEntry(trie.root, entry)
    trie.numberOfItems++
}

/*
Adds a word to this Trie
*/
func addEntry(curNode *node, entry string) {
    characters := []rune(entry)
    
    // Is this the end of the word?
    if len(characters) == 0 {
        curNode.wordEnd = true
    } else {
        firstCharacter := string(characters[0])
        remainCharacters := string(characters[1:])
        tempNode := curNode.children[firstCharacter]
        
        // Does the first character exist in the children?
        if tempNode != nil {
            // If true traverse down to that node.
            addEntry(tempNode, remainCharacters)
        } else {
            // If false create a new node, then recurse down it.
            newNode := &node {
                character: firstCharacter,
                children: make(map[string]*node),
            }
            curNode.children[firstCharacter] = newNode
            addEntry(newNode, remainCharacters)
        }
    }
 }

/*
Returns a list of words that potentially match the provided prefix.
*/
func (trie *Trie) FindEntries(prefix string, max uint8) []string {
    prefix = strings.ToLower(prefix)
    var words []string
    characters := []rune(prefix)
    tempNode := trie.root
    curWord := prefix
    
    // If possible, navigate the trie using the provided prefix 
    for max > 0 {
        if len(characters) != 0 {
            firstCharacter := string(characters[0])
            characters = characters[1:]
            // Is there a child node that matches the firstCharacter?
            if tempNode.children[firstCharacter] != nil{
                tempNode = tempNode.children[firstCharacter]
            // If false, there are no matches, stop the while loop.
            } else {
                max = 0
            }
        // Otherwise start traversing the trie
        } else {
            words = findEntries(tempNode, prefix, curWord, words, max)
            max = 0
        }
    }
    return words
}

/*
Returns a list of words from the provided Trie. The list's size is determined
using the provided "max" size.
*/
func findEntries(curNode *node, prefix string, curWord string, words []string, 
    max uint8) []string {
    for _, value :=  range curNode.children {
        tempWord := curWord
        // Is there a child node?
        if value != nil {
            // Is this the end of a word and the word max has not been met.
            if value.wordEnd == true && len(words) < int(max){
                // Add the character to the word.
                tempWord += value.character
                // Add the word to the list of words.
                words = append(words, tempWord)
                // Has the branch been completely explored?
                if value.children != nil {
                    words = findEntries(value, prefix, tempWord, words, max)
                }
            } else {
                // Add the character to the word.
                tempWord += value.character
                words = findEntries(value, prefix, tempWord, words, max)
            }
        }
    }
    return words
}