/*global window, rJS, jIO, FormData */
/*jslint indent: 2, maxerr: 3 */

(function (window, rJS) {
  "use strict";

  rJS(window)
    .ready(function (gadget) {
      return gadget.getElement()
        .push(function (element) {
          element.dispatchEvent(new Event("rjsready"));
        });
    });
}(window, rJS));
