// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "..",
  shim: {
    "test/renderjs_test": [ "renderjs" ]
  }
});

require([ "require-renderjs", "test/renderjs_test" ], function(domReady) {
  setupRenderJSTest();
});
