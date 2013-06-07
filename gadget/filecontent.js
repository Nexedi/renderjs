/*global document, jQuery */
"use strict";
(function (document, $) {

  // sample contents
  localStorage.setItem("foo", "bar");
  localStorage.setItem("baz", "bam");
  sessionStorage.setItem("cous", "cous");
  sessionStorage.setItem("schnick", "schnack");

  var generateUuid = function () {
    var S4 = function () {
      var i, string = Math.floor(
        Math.random() * 0x10000
      ).toString(16);
      for (i = string.length; i < 4; i += 1) {
        string = "0" + string;
      }
      return string;
    };
    return S4() + S4();
  };

  var setup = function () {
    // this will have to run automatically should renderJs have an easy API
    var instance1 = "data://application/hal+json;base64," +
      window.btoa(JSON.stringify({
      _links: {
        self: {href: ''},
        // not sure if scope should be passed as a link or JSON parameter
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

    $("body").append(
      '<iframe src="' +
      // XXX Hardcoded gadget to load
      'filebrowser_and_preview.html' + "?file=" + instance1 +
      '" id="' + generateUuid() +
      '">' +
      '<p>Your browser does not support iframes.</p>' +
      '</iframe">');

    $("body").append(
      '<iframe src="' +
      // XXX Hardcoded gadget to load
      'filebrowser_and_preview.html' + "?file=" + instance2 +
      '" id="' + generateUuid() +
      '">' +
      '<p>Your browser does not support iframes.</p>' +
      '</iframe">');
  };

  $(document).ready(function () {
    setup();
  });

}(document, jQuery));
