/*global document, jQuery */
// filebrowser.html?file=browser%3A%2F%2Fbrowse%2Fls%2F
"use strict";
(function (document, $) {

  var getParameter = function(searchString, paramName) {
    var i, val, params = searchString.split("&");

    for (i=0;i<params.length;i++) {
      val = params[i].split("=");
      if (val[0] == paramName) {
        return decodeURIComponent(val[1]);
      }
    }
    return null;
  };

  var mapUrl = function (url) {
    var searchString = url.href.split("?")[1],
      fileToDisplay;

    if (searchString) {
      fileToDisplay = getParameter(searchString, "file");
      if (fileToDisplay) {

        $.ajax({
          method: 'GET',
          // XXX Hardcoded
          url: fileToDisplay,
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
                 $(this).append("<li><button id='" + i + "'>" +
                   value._links.contents[i].href + "</button></li>");
                 $(this).find("#" + i.toString()).on('click', function(e, target) {
                   // XXX What to do with the url info?
                   console.log($(this).text());
                 });
              }
              $(this).append("</ul>");
            } else {
              $(this).text("Unsupported content type " + content_type);
            };
          },
        });
      } else {
        $(this).text("No parameter found in url");
      }
    }
  };

  $(document).ready(function () {
    mapUrl(window.location);
  });

}(document, jQuery));
