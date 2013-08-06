/*global window, jQuery, rJS */
"use strict";
(function (window, $, rJS) {

  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    // return rJS(this).context.find('textarea').val(escape_text(value));
    return rJS(this).context.find('#textarea-b').jqteVal(value);
  })
    .declareMethod('getContent', function () {
      return rJS(this).context.find('#textarea-b').val();
    });

  gk.ready(function () {
    var g = rJS(this);
    g.context.find("#textarea-b").jqte();
  });
}(window, jQuery, rJS));
