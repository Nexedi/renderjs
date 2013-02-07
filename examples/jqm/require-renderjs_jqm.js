// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "../..",
  paths: {
    jqm: "lib/jqm/jquery.mobile-1.3.0-rc.1.min"
  },
  shim: {
    jqm: [ "jquery" ]
  }
});

require([ "require-renderjs", "renderjs", "jqm" ], function(domReady) {
  // when all gadgets are loaded make sure JQM renders them
  RenderJs.bindReady(
    function () {
      $("[data-gadget]").trigger('create');
    }
  );
});
