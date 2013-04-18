define(['./protocol', '../../lib/jsonml/jsonml-dom', '../../lib/jsonml/jsonml-html'], function(protocol) {


    /* 
     * DOM commands. 
     */

    return function() {
        var commands = [];

        commands.push((function() {
            var that = protocol.command();

            that.label = 'replicateDOMChanges';
            that.handle = function(worker, data) {
                var htmlNode = JsonML.toHTML(data);
                replaceWith(htmlNode);
            };

            that.isWriteCommand = function() {
                return true;
            };

            function replaceWith(element) {
                jQuery(that.getNode()).replaceWith(element);
                that.setNode(element);
            };

            return that;
        })());
        
        return commands;
    };
});
