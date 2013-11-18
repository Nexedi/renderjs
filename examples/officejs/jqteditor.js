/*global window, rJS, jQuery */
"use strict";
(function (window, rJS, $) {

  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    // return rJS(this).context.find('textarea').val(escape_text(value));
    return $(rJS(this).element).find('#textarea-b').jqteVal(value);
  })
    .declareMethod('getContent', function () {
      return $(rJS(this).element).find('#textarea-b').val();
    });

  gk.ready(function (g) {
    $(g.element).find("#textarea-b").jqte();
  });
}(window, rJS, jQuery));
