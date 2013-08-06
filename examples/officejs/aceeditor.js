/*global window, jQuery, rJS, ace */
"use strict";
(function (window, $, rJS) {

  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    rJS(this).editor.getSession().setValue(value);
    // return rJS(this).context.find('textarea').val(escape_text(value));
  })
    .declareMethod('getContent', function () {
      return rJS(this).editor.getSession().getValue();
      // return rJS(this).context.find('textarea').val();
    });

  gk.ready(function () {
    var g = rJS(this);
    g.editor = ace.edit("editor");
    g.editor.setTheme("ace/theme/monokai");
    // g.context.find("textarea").jqte();
//     editor.setTheme("ace/theme/twilight");
//     editor.getSession().setMode("ace/mode/javascript");
  });

}(window, jQuery, rJS, ace));
