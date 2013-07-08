// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "../..",
  paths: {
    jqm: "lib/jqm/jquery.mobile-1.3.1.js"
  },
});

require([ "require-renderjs", "renderjs", "jqm" ], function(domReady) {
  // when all gadgets are loaded make sure JQM renders them
  RenderJs.bindReady(
    function () {
      $("[data-gadget]").trigger('create');
    }
  );
});
