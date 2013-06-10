/*global document, jQuery */
(function (document, $) {
  "use strict";

  // sample contents
  localStorage.setItem("foo", "bar");
  localStorage.setItem("baz", "bam");
  sessionStorage.setItem("cous", "cous");
  sessionStorage.setItem("schnick", "schnack");

  var setup = function () {
    // instance1 and 2 should be passed through the URl, mapped here!
    renderJs.mapUrl(window.location.search, function (value, textStatus, jqXHR) {

      var instance1 = "data://application/hal+json;base64," +
        window.btoa(JSON.stringify({
        _links: {
          self: {href: ''},
          scope: {href: 'browser://browse/ls/'},
          target: {href: 'preview_by_hash_change.html'}
      }}));

      var instance2 = "data://application/hal+json;base64," +
        window.btoa(JSON.stringify({
        _links: {
          self: {href: ''},
          scope: {href: 'browser://browse/ss/'},
          target: {href: 'preview_by_postmessage.html'}
      }}));

      $("body").addGadget({
        "src": "filebrowser_and_preview.html?file=" + instance1,
        "iframe": "true"
      });

      $("body").addGadget({
        "src": "filebrowser_and_preview.html?file=" + instance2,
        "iframe": "true"
      });
    });
  };

  $(document).ready(function () {
    setup();
  });

}(document, jQuery));
