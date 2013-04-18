define(
    [], 
    function() {

        var policies = {};

        function policyFor(label) {
            return policies[label];
        };

        var policy = function() {
            
            var that = {};

            that.validate = function(command) {
                throw "Abstract policy";
            };

            return that;
        };

        var readWritePolicy = function() {
            
            var that = {};

            that.validate = function(command) {};

            return that;
        };

        var readOnlyPolicy = function() {
            
            var that = {};

            that.validate = function(command) {
                if(command.isWriteCommand()) {
                    throw "Attempting to perform a write while in a read-only policy";
                }
            };

            return that;
        };

        // Populate the policiies objects
        (function() {
            policies['read-only']  = readOnlyPolicy();
            policies['read-write'] = readWritePolicy();
        }());


        return policyFor;
    }
)
