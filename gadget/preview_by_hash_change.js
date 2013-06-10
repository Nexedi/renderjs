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
    var type = event.data.type,
      method = type ? type.split("/")[0] : undefined;
    // prevent both renderJs and page events triggering on "run"
    if (type === undefined || method !== "run") {
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
  }

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
      scope,
      register,
      service;

    if (fileToDisplay) {
      $.ajax({
        method: 'GET',
        url: fileToDisplay,
        context: $('body'),
        error: function (jqXHR, textStatus, errorThrown) {
          $(this).text(errorThrown);
        },
        success: function (value, textStatus, jqXHR) {

          scope = value._links.scope.href.slice(0,-1).split(/[/]+/).pop();
          register = value._links.call.href
            .replace("{method}", "register")
            .replace("{scope}", scope )
            .replace("{interaction}", "");
          service = {
            "type": "register/any",
            "src": encodeURIComponent(window.location.href),
            "rel": "preview",
            "self": window.frameElement.id
          };

          $.ajax({
            method: 'POST',
            url: register,
            context: $(this),
            data: JSON.stringify(service),
            error: function (jqXHR, textStatus, errorThrown) {
              console.log("registration failed: " + errorThrown);
            },
            success: function (value, textStatus, jqXHR) {
              // console.log("registration successful");
            }
          });
        }
      });
    }
  }

  $(document).ready(function () {
    var search = window.location.search;
    if (search) {
      mapUrl(search.slice(1));
    } else {
      $("body").text("No parameter found in url");
    }

    if (window.addEventListener){
      window.addEventListener("message", handler, false)
    } else {
      window.attachEvent("onmessage", handler)
    }
  });

}(document, jQuery));