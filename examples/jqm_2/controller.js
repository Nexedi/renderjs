/*jslint browser: true, indent : 2, maxerr : 50, nomen : true, regexp : true,
sloppy : true */
/*global define: false, $: false, document: false, require: false */

define([], function () {
  "use strict";

  var start = function () {
    require(['overrides', 'jquery', 'jqm', 'jquery.json', 'renderjs'],
      function () {

        // this is my application controller
        // as I have not used renderJS before, this is where all my
        // client-side "stuff" happens (ajax form requests, content modifications,
        // on demand loading of additional plugins

        // detect gadgets on a page
        $(document).on('pagebeforeshow', 'div.ui-page', function () {
          $('[data-gadget]').filter(
            function () { 
              return $(this).jqmData("bound") !== true;
            }
          )
          .each(
            function () {
              // trigger gadget loading
              RenderJs.bindReady(
                function () {
                  $("[data-gadget]").trigger('create');
                });
            }
          );
        });

        // START
        if ($.mobile.autoInitializePage === false) {
          // initialize JQM
          $.mobile.initializePage();

          // initialize renderJS
          RenderJs.init();
 
          // when all gadgets are loaded make sure JQM renders them
          RenderJs.bindReady(
            function () {
              $("[data-gadget]").trigger('create');
            });
        }
      });
  };
  return {"start": start};
});
