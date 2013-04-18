define(
    function() {

        /*
         * Defines the communication protocol between the sandbox and
         * the outer world.
         */
        
        /* Exception messages */

        var protocolException = 'Protocol exception occured.';
        var forbidden         = 'Access denied by policy';


        /*
         * Creates and answer a protocol object.
         *
         * spec properties:
         * - worker : Web worker instance (required)
         * - scripts : JS files (required)
         * - policy : policy object (required)
         * - dependencies: JS dependencies collection (optional)
         */

        var protocol = function(spec) {
            var that = {};

            var worker       = spec.worker;
            var scripts      = spec.scripts;
            var node         = spec.node;
            var dependencies = spec.dependencies || [];

            that.policy       = spec.policy;

            /* 
             * Keep a public reference to the impacted node
             */
            that.node = node;

            /* 
             * Each event data should have a command property, matching
             * one of the commands defined below. If none, the worker will
             * be terminated.
             * 
             * The event data can contain an additional JSON `data'. 
             * Any other data property is discarded.
             *
             * Each command is responsible for handling a specific kind of
             * event.
             */

            that.commands = {};


            /* Incoming events */
            that.read = function(data) {
                //try {
                    rawRead(data);
                //} catch (e) {
                //    terminate();
// // //         }
            };
            
            function rawRead(data) {
                var command = commandFor(data.command);
                that.policy.validate(command);
                command.handle(worker, data.data);
            };
            
            /* Answer the appropriate command object for string */
            function commandFor(string) {
                var command = that.commands[string];
                if(!command) {throw protocolException};
                return command;
            };            

            /* Something wrong happened. Kill the worker process */
            function terminate(exception) {
                console.log(exception || 'Terminating worker.');
                worker.terminate();
            };


            /* Commands definition */

            /* 
             * The start command is the only command actually sending a
             * message back to the worker.
             * 
             * Also, it doesn't read any data.
             */

            var startCommand = (function() {
                var that = command();

                that.label = 'start';
                
                // No data read
                that.handle = function(worker) {
                    var jsonmlNode = JsonML.fromHTML(node);
                    worker.postMessage({
                        command: 'init',
                        data: {
                            node: jsonmlNode,
                            scripts: scripts,
                            dependencies: dependencies
                        }
                    });
                };

                return that;
            })();

            /*
             * Terminate command. The sandbox can this way ask to be
             * properly terminated.
             */

            var terminateCommand = (function() {
                var that = command();

                that.label = 'terminate';
                that.handle = function(worker) {
                    worker.terminate('Termination of worker requested.');
                }

                return that;
            })();


            that.commands['start']     = startCommand;
            that.commands['terminate'] = terminateCommand;

            return that;

        };
        
        var command = function() {
            var that = {};

            var protocol;

            /* Concrete commands should override this. */
            that.label = null;
            that.handle = function(worker, data) {};

            that.setProtocol = function(p) {
                protocol = p;
            };

            that.setNode = function(n) {
                protocol.node = n;
            };

            that.getNode = function() {
                return protocol.node;
            };

            that.isReadCommand = function() {
                return true;
            };

            that.isWriteCommand = function() {
                return false;
            };
            
            return that;
        };

        
        return {protocol: protocol, command: command};
    }
)
