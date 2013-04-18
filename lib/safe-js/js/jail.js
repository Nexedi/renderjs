/* 
 * Runs inside a web worker, loading a jailed script in the
 * worker.
 */

var document;
var window;
var global = this;

var jail = function() {
    
    var additionalLibraries = ["jquery-1.9.1.js"];

    /* 
     * Load the dependencies & jailed script 
     */
    
    function load(scripts, dependencies, node) {
        dependencies = dependencies || [];
        scripts = scripts || [];
        
        importScripts('boxed/dom.js');

        onJSDomReady(function(jsdom) {
            bootstrapDOM(jsdom);

            importScripts('boxed/console.js');
            importScripts('../lib/jsonml/jsonml-dom.js', '../lib/jsonml/jsonml-html.js');
            
            loadAdditionalLibraries();
            
            dependencies.forEach(function(each) {
                importScripts(each);
            });

            fixReferences();
            installNode(node);

            importScripts(scripts);
        })
    };

    /*
     * Once the dom library is loaded, we need to create a real dom tree for the worker
     */
    function bootstrapDOM(dom) {
        document = dom.jsdom("<html><body></body></html>", dom.level(3, "core"));
        
        window = document.createWindow();

        document.title = 'Worker';
    }


    /* 
     * Load the boxing libraries, replacement for native browser
     * libs. in our jailed env.
     */

    function loadAdditionalLibraries() {
        additionalLibraries.forEach(function(each) {
            importScripts(each);
        });
    };

    /*  
     * Once our libs are running, we need to fix some references to
     * the global object vs window object
     */

    function fixReferences() {
        this.$ = this.jQuery = window.jQuery;
    }

    /*
     * Once all the dependencies are laoded and the boostrap done, we
     * install the node the worker has access to.
     */
    
    function installNode(node) {
        var htmlNode = JsonML.toHTML(node);
        jQuery('body').append(htmlNode);
        addListeners(htmlNode);
    }
    

    /*
     * Listen for DOM changes inside our node, to replicate them in
     * the host DOM.
     */

    function addListeners(node) {
        node.addEventListener("DOMNodeInserted", function() {
            onDOMModified();
        });

        node.addEventListener("DOMNodeRemoved", function() {
            onDOMModified();
        });

        node.addEventListener("DOMAttrModified", function() {
            onDOMModified();
        });

        function onDOMModified() {
            var jsonmlNode = JsonML.fromHTML(node);
            replicateDOMChanges(jsonmlNode);
        };
    };

    /* 
     * Actual loading on init protocol message. Note that the
     * only message sent to the worker is the init message.
     * All further communication is the other way only.
     */

    this.onmessage = function(event) {
        if(event.data.command === 'init') {
            load(
                event.data.data.scripts, 
                event.data.data.dependencies,
                event.data.data.node);
        }
        
        // This addition is the counter part of the extended renderjs.js command pattern
        // See renderjs.js begin of file for the other commands triggered from the worker
        if(event.data.command === 'commanderResponse') {
          handleResponse(event.data.data);
        }
        
        if(event.data.command === 'getGadgetById') {
          handleGadgetResponse(event.data.data);
        }
        
        if(event.data.command === 'methodCall') {
          handleMethodCall(event.data.data);
        }
    };

    /* Ask for initialization. See protocol.js for more */
    this.postMessage({command: 'start'});

};

jail();
