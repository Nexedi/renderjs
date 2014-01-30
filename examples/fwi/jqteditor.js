(function (window, rJS, $) {
  "use strict";

  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    // return this.context.find('textarea').val(escape_text(value));
    return $(this.element).find('#textarea-b').jqteVal(value);
  })
    .declareMethod('getContent', function () {
      return $(this.element).find('#textarea-b').val();
    });

  gk.ready(function (g) {
    $(g.element).find("#textarea-b").jqte();
  });
}(window, rJS, jQuery));
