/*global document, jQuery */
(function (document, $) {
  "use strict";

  var setup = function () {
    renderJs.mapUrl(window.location.search, function (value, textStatus, jqXHR) {

      var sendAPI = "data://application/hal+json;base64," +
        window.btoa(JSON.stringify({
        _links: {
          self: {href:''},
          scope: {href: value._links.scope.href},
          call: {href:'browser://call/{method}/{scope}/{interaction}'}
        }}));

      $("body").addGadget({
        "src": 'filebrowser.html?file=' + sendAPI,
        "iframe": "true"
      });

      $("body").addGadget({
        "src": value._links.target.href + '?file=' + sendAPI,
        "iframe": "true"
      });
    });
  };

  $(document).ready(function () {
    setup();
  });

}(document, jQuery));
