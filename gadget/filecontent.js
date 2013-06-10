/*global document, jQuery */
(function (document, $) {
  "use strict";

  // sample contents
  localStorage.setItem("foo", "bar");
  localStorage.setItem("baz", "bam");
  sessionStorage.setItem("cous", "cous");
  sessionStorage.setItem("schnick", "schnack");

  var setup = function () {

    // TODO: I don't like scope/target for passing too specific information
    // like scope = which storage to use and target = which file to load in
    // the next target
    // TODO: Should be in window.location.href, not declared here
    // TODO: how to pass multiple instances of _links? allow at all?

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
  };

  $(document).ready(function () {
    setup();
  });

}(document, jQuery));
