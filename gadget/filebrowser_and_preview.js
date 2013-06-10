/*global document, jQuery */
(function (document, $) {
  "use strict";

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

  var mapUrl = function (searchString) {
    var fileToDisplay = getParameter(searchString, "file"),
      browserAPI,
      previewAPI;

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

          // merge again once working!
          browserAPI = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href:''},
              scope: {href: value._links.scope.href},
              call: {href:'browser://call/{method}/{scope}/{interaction}'}
            }}));

          previewAPI = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href:''},
              scope: {href: value._links.scope.href},
              call: {href:'browser://call/{method}/{scope}/{interaction}'}
            }}));

          $("body").addGadget({
            "src": 'filebrowser.html?file=' + browserAPI,
            "iframe": "true"
          });

          $("body").addGadget({
            "src": value._links.target.href + '?file=' + previewAPI,
            "iframe": "true"
          });
        }
      });
    } else {
      $("body").text("No parameter found in url");
    }
  };

  $(document).ready(function () {
    var search = window.location.search;
    if (search) {
      mapUrl(search.slice(1));
    } else {
      $("body").text("No parameter found in url");
    }

//     if (window.addEventListener){
//       window.addEventListener("message", handler, false)
//     } else {
//       window.attachEvent("onmessage", handler)
//     }
  });

}(document, jQuery));
