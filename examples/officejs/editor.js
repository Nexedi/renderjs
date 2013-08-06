/*global window, jQuery, rJS */
"use strict";
(function (window, $, rJS) {

  function escape_text(text) {
    // &, ", ', <, >, /
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
  }

  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    return rJS(this).context.find('textarea').val(escape_text(value));
  })
    .declareMethod('getContent', function () {
      return rJS(this).context.find('textarea').val();
    });

}(window, jQuery, rJS));
