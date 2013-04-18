define(
    [
        './protocol/protocol',
        './protocol/console',
        './protocol/dom',
        './protocol/renderjs-communication',
        './policies'
    ], 
    function(protocol, consoleProtocol, domProtocol, renderjsProtocol, policies) {

        // Worker script path.
        var jailJS = 'lib/safe-js/js/jail.js';
        
        /*
         * A handler is responsible for handling communication with a
         * dedicated worker for a sandboxed script. Communication
         * happens in one way only. The worker works in a sandboxed
         * blind environment.
         */

        function handler() {

            var that = {};

            /*
             * Incoming data only. The worker is completely blind. 
             * Delegate to the sandbox protocol.
             */

            that.read = function(data, protocol, callback) {
                protocol.read(data);
                
                if(callback) {
                    callback(data);
                }
            };

            return that;
        };

        /* 
         * Creates and answer a sandboxed (jail) environment inside a
         * web worker. Attach a protocol object to it. To handle
         * incoming events. 
         *
         * Each sandbox has a separate protocol object, holding into
         * the policy.
         */
        
        function sandbox(spec) {

            var policy       = spec.policy;
            var scripts      = spec.scripts;
            var dependencies = spec.dependencies || [];
            var node         = spec.node;

            var my = {};
            
            my.worker = new Worker(jailJS);
            my.protocol = protocol.protocol({
                worker: my.worker,
                policy: policy,
                scripts: scripts,
                dependencies: dependencies,
                node: node
            });

            /* setup commands */
            consoleProtocol().forEach(function(each) {
                each.setProtocol(my.protocol);
                my.protocol.commands[each.label] = each;
            });

            domProtocol().forEach(function(each) {
                each.setProtocol(my.protocol);
                my.protocol.commands[each.label] = each;
            });

            renderjsProtocol().forEach(function(each) {
                each.setProtocol(my.protocol);
                my.protocol.commands[each.label] = each;
            });

            
            /*
             * Creates a dedicated handler for the worker
             */

            var workerHandler = handler();
            setupWorkerEvents(my.worker);
            
            /*
             * Properly initialize worker with event listeners.
             */
            
            function setupWorkerEvents(worker) {
                my.worker.onmessage = function(event) {
                    workerHandler.read(
                        event.data, 
                        my.protocol, 
                        function() {} //log
                    );
                };
            };

            /* Testing purposes */
            function log(data) {
                console.log(data);
            };
            
            return my.worker;
        };


        return sandbox;

    }
)
