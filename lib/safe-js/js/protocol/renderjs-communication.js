define(['./protocol'], function(protocol) {

    
      // we need to register all callbacks in a registry to be able to evaluate them later on
      // when handling the response from the worker
      var callbackRegistry = {};
  
    return function() {
        var commands = [];

        var methodCallCommand;
        
        function makeid() {
          var text = "";
          var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
          return text;
        };

        function registerCallback(callback, id) {
            callbackRegistry[id] = callback;
        };
        
        commands.push((function() {
            var that = protocol.command();

            that.label = 'masterAndCommander';
            
            that.handle = function(worker, data) {
              performAction(worker, data.id, data.selector, function(result) { 
                respond(worker, {
                  result: result, 
                  callback: data.callback
                })
              })
            };

            that.isWriteCommand = function() {
                return true;
            };

            function performAction(worker, id, selector, callback) {
              var gadget = RenderJs.GadgetIndex.getGadgetById(id);
              if(gadget.sandbox) {
                methodCallCommand.handle(gadget.sandbox, selector, callback);
              }
              else {
                callback(gadget[selector]());
              }
            };

            function respond(worker, data) {
              worker.postMessage({
                        command: 'commanderResponse',
                        data: data
              });
            };
            
            return that;
        })());
        
        
        methodCallCommand = (function() {
            var that = protocol.command();

            that.label = 'methodCall';
            that.handle = function(worker, selector, callback) {
                var callId = makeid();
                registerCallback(callback, callId);
                
                worker.postMessage({
                    command: 'methodCall',
                    data: {
                      selector: selector,
                      id: callId
                    }
                });
            };
            
            
            return that;
        })();
        
        commands.push(methodCallCommand);

        commands.push((function() {
            var that = protocol.command();

            that.label = 'methodResponse';
            that.handle = function(worker, data) {
              
                var callback = callbackRegistry[data.id];
              
                if(callback) {
                  callback(data.data)
                }
            };
            
            
            return that;
        })());
        
        
        commands.push((function() {
            var that = protocol.command();

            that.label = 'getGadgetById';
            
            that.handle = function(worker, data) {
              var gadget = getGadget(data.id);
              debugger;
              respond(worker, {
                gadget: gadget, 
                callback: data.callback
              })
            };

            that.isWriteCommand = function() {
                return false;
            };

            function getGadget(id) {
              var gadget = RenderJs.GadgetIndex.getGadgetById(id);
              var selectors = [];
              for(var i in gadget) {
                if(typeof gadget[i] === 'function') {
                  selectors.push(i)
                }
              }
              
              return selectors;
            };

            function respond(worker, data) {
              worker.postMessage({
                        command: 'commanderResponse',
                        data: data
              });
            };
            
            return that;
        })());
        
        return commands;
    };
});