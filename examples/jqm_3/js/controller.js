/*jslint browser: true, indent : 2, maxerr : 50, nomen : true, regexp : true,
sloppy : true */
/*global define: false, $: false, document: false, require: false */

define([], function () {
  "use strict";

  var start = function () {
    require(['overrides', 'jquery', 'jqm', 'jquery.json', 'renderjs'],
      function () {

        $(document).on('pagebeforeshow','div:jqmData(role="page")', function () {

          RenderJs.init();
          RenderJs.bindReady(
            function () {
              $("[data-gadget]").filter(
                function() {
                  return $(this).jqmData("bound") !== true;
                }
              ).each(
                function () {
                  $(this).jqmData("bound",true).trigger('create');
                }
              )
            }
          );
        });

        // initialize JQM
        if ($.mobile.autoInitializePage === false) {
          $.mobile.initializePage();
        }
      });
  };
  return {"start": start};
});