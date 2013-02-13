// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "..",
  paths: {
    route: "lib/route/route",
    url: "lib/route/url",
    jquery: "lib/jquery/jquery",
    renderjs: "renderjs",
  },
  shim: {
    "test/renderjs_test": [ "renderjs" ],
    "url": ["renderjs"],
    "route": ["url"]
  }
});

require([ "require-renderjs", "test/renderjs_test", "url", "route" ], function(domReady) {
  setupRenderJSTest();
});
