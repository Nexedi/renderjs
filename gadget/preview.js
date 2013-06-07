// > grab URL with parameters of file to open
// > call addGadget with those parameters?
// > display a file from some storage (local/session)
// > storage type will also be a parameter in the url?
// return "browser://localstorage/foo"
// file=browser%3A%2F%2Flocalstorage%2Ffoo

/*global document, jQuery */
"use strict";
(function (document, $) {

  var ajaxGet = function (src, cb) {
    $.ajax({
      method: 'GET',
      url: src,
      context: $('body'),
      error: function (jqXHR, textStatus, errorThrown) {
        $(this).text(errorThrown);
      },
      success: function (value, textStatus, jqXHR) {
        cb(value, textStatus, jqXHR);
      }
    });
  };

  var handler = function (event) {
    ajaxGet(event.data, function(value, status, jqXHR) {
      ajaxGet(value._links.enclosure.href, function(value, status, jqXHR) {
        if (value === "") {
          window.document.body.innerHTML = "file not found";
        } else {
          window.document.body.innerHTML = value;
        }
      });
    });
  }

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
            if (value === "") {
              $(this).text("file not found");
            } else {
              $(this).text(value);
            }
          },
        });
      }
    } else {
      $(this).text("no file to display");
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

  $(document).ready(function () {  
    // mapUrl(window.location);

    if (window.addEventListener){
      window.addEventListener("message", handler, false)
    } else {
      window.attachEvent("onmessage", handler)
    }
  });

}(document, jQuery));