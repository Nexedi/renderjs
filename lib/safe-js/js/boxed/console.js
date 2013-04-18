/* 
 * Boxed replacement for native console object
 */

var console = {};

console.log = function(data) {
    postMessage({
        command: 'log', 
        data: data.toString()
    })
};

console.warn = function(data) {
    postMessage({
        command: 'warn',
        data: data.toString()
    })
};

console.error = function(data) {
    postMessage({
        command: 'error',
        data: data.toString()
    })
};

window.console = console
