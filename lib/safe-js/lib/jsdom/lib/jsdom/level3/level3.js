define(
    ["./core", "./events", "./html", "./index", "./ls", "./xpath" ], 
    function(core, events, html, index, ls, xpath){
        return {
            core: core,
            events: events,
            html: html,
            index: index,
            ls: ls,
            xpath: xpath
        };   
    })
