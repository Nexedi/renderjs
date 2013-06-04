/*global document, jQuery */
"use strict";
(function (document, $) {
  $(document).ready(function () {

    $.ajax({
      method: 'GET',
      // XXX Hardcoded
      url: "browser://browse/ls/",
      context: $('body'),
      error: function (jqXHR, textStatus, errorThrown) {
        $(this).text(errorThrown);
      },
      success: function (value, textStatus, jqXHR) {
        var content_type = jqXHR.getResponseHeader("Content-Type") || "";
        // XXX Hardcoded mime type
        if (content_type.split(';')[0] === "application/hal+json") {
          // XXX Will fail if response does not send expected links...
          $(this).html("<ul>");
          for (var i in value._links.contents){
             $(this).append("<li>" + value._links.contents[i].href + "</li>");
          }
          $(this).append("</ul>");
        } else {
          $(this).text("Unsupported content type " + content_type);
        };
      },
    });
  });

}(document, jQuery));
