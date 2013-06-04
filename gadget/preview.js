// > grab URL with parameters of file to open
// > call addGadget with those parameters?
// > display a file from some storage (local/session)
// > storage type will also be a parameter in the url?
// return "browser://localstorage/foo"
// file=browser%3A%2F%2Flocalstorage%2Ffoo

/*global document, jQuery */
"use strict";
(function (document, $) {
  $(document).ready(function () {

    localStorage.setItem("foo", JSON.stringify("bar"));
    localStorage.setItem("bar", JSON.stringify("baz"));
    sessionStorage.setItem("cous", JSON.stringify("cous"));
    sessionStorage.setItem("deux", JSON.stringify("pommes"));

    var mapUrl = function (url) {
      var searchString = url.href.split("?")[1],
        fileToDisplay;

      if (searchString) {
        fileToDisplay = getParameter(searchString, "file");
        if (fileToDisplay) {
          $.ajax({
            method: 'GET',
            url: fileToDisplay,
            context: $('body'),
            error: function (jqXHR, textStatus, errorThrown) {
              $(this).text(errorThrown);
            },
            success: function (value, textStatus, jqXHR) {
              $(this).text(value);
            },
          });
        }
      }
    };

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

  mapUrl(window.location);
  });

}(document, jQuery));