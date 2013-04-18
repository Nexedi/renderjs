// JavaScript file that is used to load RenderJs depenencies
require.config({
  paths: {
    jquery: "lib/jquery/jquery",
//     "jquery.json": "lib/json/jquery.json.min",
//     davstorage: "lib/jio/davstorage",
//     md5: "lib/jio/md5",
//     jio: "lib/jio/jio",
    renderjs: "renderjs",
    //"safe": "./lib/safe-js/safe"
  },
  shim: {
//     "jquery.json": [ "jquery" ],
//     jio: ["md5"],
//     davstorage: ["jio"],
    //"safe": ["renderjs"],
    renderjs: [ "jquery"] //, "jquery.json", "jio", "md5", "davstorage" ]
  }
});

require([ "renderjs"], function(domReady) {
  RenderJs.init();
});