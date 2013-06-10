/*global document, jQuery */
(function (document, $) {
  "use strict";

  // sample contents
  localStorage.setItem("foo", "bar");
  localStorage.setItem("baz", "bam");
  sessionStorage.setItem("cous", "cous");
  sessionStorage.setItem("schnick", "schnack");

  var setup = function () {
    // not an easy API...
    // can this be done internally?

    // TODO:
    // "call" default API need not be passed,
    // "self" can be added automatically
    // "scope" (previous "storage") don't like... too gadget-specific?
    // "target" (previous "display") don't like, as above

    var instance1 = "data://application/hal+json;base64," +
      window.btoa(JSON.stringify({
      _links: {
        self: {href: ''},
        scope: {href: 'browser://browse/ls/'},
        target: {href: 'preview_by_hash_change.html'},
        call: {href: ''}
      }}));

    var instance2 = "data://application/hal+json;base64," +
      window.btoa(JSON.stringify({
      _links: {
        self: {href: ''},
        scope: {href: 'browser://browse/ss/'},
        target: {href: 'preview_by_postmessage.html'},
        call: {href: ''}
      }}));

    $("body").addGadget({
      "src": "filebrowser_and_preview.html?file=" + instance1,
      "iframe": "true"
    });

    $("body").addGadget({
      "src": "filebrowser_and_preview.html?file=" + instance2,
      "iframe": "true"
    });
  };

  $(document).ready(function () {
    setup();
  });

}(document, jQuery));
