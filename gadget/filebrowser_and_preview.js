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

        $("body").html(
          '<iframe src="' +
          // XXX Hardcoded gadget to load
          'filebrowser.html?file=' + fileToDisplay +
          '">' +
          '<p>Your browser does not support iframes.</p>' +
          '</iframe">');

        $("body").append(
          '<iframe src="' +
          // XXX Hardcoded gadget to load
          'preview.html' +
          '">' +
          '<p>Your browser does not support iframes.</p>' +
          '</iframe">');

      } else {
        $("body").text("No parameter found in url");
      }
    } else {
      $("body").text("No parameter found in url (2)");
    }
  };

  $(document).ready(function () {
    mapUrl(window.location);
  });

}(document, jQuery));
