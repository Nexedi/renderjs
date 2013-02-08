/*jslint browser: true, indent : 2, maxerr : 50, nomen : true, regexp : true,
sloppy : true */
/*global define: false, $: false, document: false, require: false */

define([], function () {
  "use strict";

  var start = function () {
    require(['overrides', 'jquery', 'jqm', 'jquery.json', 'renderjs'],
      function () {
        console.log("done loading");
        // START
        if ($.mobile.autoInitializePage === false) {
          // initialize JQM
          $.mobile.initializePage();
          console.log("init JQM");
          // initialize renderJS
          RenderJs.init();
 
          // when all gadgets are loaded make sure JQM renders them
          RenderJs.bindReady(
            function () {
              console.log("bindReady called, trigger create");
              $("[data-gadget]").trigger('create');
            });
        }
      });
  };
  return {"start": start};
});
