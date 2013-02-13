/*jslint indent : 2, nomen : true, sloppy : true */
/*global jQuery: false, $: false, document: false */
(function ($, document) {
  "use strict";

  $(document).bind("mobileinit", function () {
    var evt;
    // [JQM] - trigger JQM with requireJS (pageinit vs docready)
    $.mobile.autoInitializePage = false;
  });
}(jQuery, document));
