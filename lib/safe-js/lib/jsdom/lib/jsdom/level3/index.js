define(
    ["./core", "./xpath", "./events", "./html", "./ls"], 
    function(core, xpath, events, html, ls) {
        return {
            dom: {
                core   : core.dom.level3.core,
                xpath  : xpath,
                events : events.dom.level3.events,
                html   : html.dom.level3.html,
                ls     : ls.dom.level3.ls            
            }
        }
})
