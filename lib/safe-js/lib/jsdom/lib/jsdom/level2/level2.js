define(

    ["./core", "./events", "./html", "./index", "./style", "./languages/javascript" ], 
    function(core, events, html, index, style, javascript){
        return {
            core: core,
            events: events,
            html: html,
            index: index,
            style: style,
            javascript: javascript
        };   
    })
