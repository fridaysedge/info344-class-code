package main 

import (
    "github.com/fridaysedge/info344-class-code/gotypes/structs/person"
)

func main() {
    prs := person.NewPerson("Dave", "Stearns")
    prs.FirstName = "Dr"
    
    prs.SayHello()
}