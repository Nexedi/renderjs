/*global window, rJS, jQuery */

(function (window, rJS, $) {
  "use strict";

  rJS(window)

    .declareMethod('setContent', function (content) {
      rJS(this).editor.setContent(content);
    })
  
    .declareMethod('getContent', function () {
      return rJS(this).editor.getContent();
    })

    .ready(function (g) {
      g.editor = $('#slide-list').presentation();
    });

}(window, rJS, jQuery));
