/* Load jsdom first */

importScripts('./require.js');

var jsdom;

var onJSDomReady = function(callback) {
    jsDomReady = callback;
}

require({
        baseUrl: "./"
    },
        ["require", "../lib/jsdom/lib/jsdom.js"],
        function(require, dom) {
            jsdom = dom;
            jsDomReady(jsdom);
        }
);

replicateDOMChanges = function(element) {
    postMessage({
        command: 'replicateDOMChanges', 
        data: element
    })
};
