/*global document, jQuery */
"use strict";
(function (document, $) {
  $(document).ready(function () {

    $.ajax({
      method: 'GET',
      // XXX Hardcoded
      url: "browser://browser/ls/",
      context: $('body'),
      error: function (jqXHR, textStatus, errorThrown) {
        $(this).text(errorThrown);
      },
      success: function (value, textStatus, jqXHR) {
        $(this).text(value);
      },
    });
  });

}(document, jQuery));
