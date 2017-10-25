/*jslint nomen: true*/
(function (window, rJS) {
  "use strict";

  rJS(window)
    .onLoop(function createNewChildOnLoop() {
      var gadget = this;
      return this.declareGadget('sub1.html', {scope: 'foo'})
        .push(function (sub_gadget) {
          var div = gadget.element.querySelector('div');
          while (div.firstChild) {
            div.removeChild(div.firstChild);
          }
          div.appendChild(sub_gadget.element);
        });
    });

}(window, rJS));
