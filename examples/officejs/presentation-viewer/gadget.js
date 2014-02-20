/*global window, document, rJS, dZmain */

(function (window, document, rJS) {
  "use strict";

  rJS(window)

    .declareMethod('setContent', function (content) {
      document.body.innerHTML = content;
      dZmain();
    })
  
    .declareMethod('getContent', function () {
      return document.innerHTML;
    });

}(window, document, rJS));
