/*global document, jQuery */
"use strict";
(function (document, $) {

  var setup = function () {
    renderJs.mapUrl(window.location.search, function (value, textStatus, jqXHR) {

      var scope = value._links.scope.href.slice(0,-1).split(/[/]+/).pop(),
        register = value._links.call.href
          .replace("{method}", "register")
          .replace("{scope}", scope )
          .replace("{interaction}", ""),
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
    });
  };

  $(document).ready(function () {
    setup();
  });

}(document, jQuery));