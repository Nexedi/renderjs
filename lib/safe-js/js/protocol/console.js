define(['./protocol'], function(protocol) {

    return function() {

        var commands = [];

        /* 
         * Log commands. Later on replaced by domain specific
         * commands, handled with the right policy (ex: DOM
         * command).
         */

        commands.push((function() {
            var that = protocol.command();

            that.label = 'log';
            that.handle = function(worker, data) {
                console.log(data);
            }

            return that;
        })());

        commands.push((function() {
            var that = protocol.command();

            that.label = 'warn';
            that.handle = function(worker, data) {
                console.warn(data);
            }

            return that;
        })());

        commands.push((function() {
            var that = protocol.command();

            that.label = 'error';
            that.handle = function(worker, data) {
                console.error(data);
            }

            return that;
        })());

        
        return commands;

    };

})
