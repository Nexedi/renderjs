/*global window, rJS, ace */
"use strict";
(function (window, rJS) {

  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    rJS(this).editor.getSession().setValue(value);
  })
    .declareMethod('getContent', function () {
      return rJS(this).editor.getSession().getValue();
    });

  gk.ready(function (g) {
    g.editor = ace.edit(g.element.getElementsByTagName('div')[0]);
    g.editor.setTheme("ace/theme/monokai");
  });

}(window, rJS, ace));
