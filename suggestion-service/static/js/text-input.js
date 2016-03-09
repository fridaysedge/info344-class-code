'use strict'

$(document).ready(function(){
    $("input").keyup(function(event){
        $("div").empty()
        var max =  $("select option:selected").val();
        var word = $("input").val();
        var uri = "http://localhost:9000/api/v1/suggestions?q=" + word +"&max=" + max;
        $.getJSON(uri, function(result){
            $.each(result, function(i, field){
                for (var w in field){
                        $("div").append("<a href='http://dictionary.reference.com/browse/" + field[w] + "'>" + field[w] + "</a><br>");
                }
            });
        });
    });
});

