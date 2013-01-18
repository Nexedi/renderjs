// JavaScript file that is used to load RenderJs depenencies
require.config({
  paths: {
    jquery: "lib/jquery/jquery",
    "jquery.json": "lib/json/jquery.json.min",
    renderjs: "renderjs"
  },
  shim: {
    "jquery.json": [ "jquery" ],
    renderjs: [ "jquery", "jquery.json" ]
  }
});

require([ "jquery", "jquery.json", "renderjs" ], function(domReady) {
  RenderJs.init();
});