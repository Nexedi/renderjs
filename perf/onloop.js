/*jslint nomen: true*/
(function (window, rJS) {
  "use strict";


  rJS(window)
    .declareMethod('doNothing', function doNothing() {
      return;
    })
    .onLoop(function iterateLoop() {
      return new RSVP.Queue();
    });

}(window, rJS));
