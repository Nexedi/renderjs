(function (window, rJS) {
  "use strict";

  var gk = rJS(window),
    ready_called = false;

  gk.ready(function (g) {
    ready_called = true;
  })
    .declareMethod('wasReadyCalled', function () {
      return ready_called;
    })
    .declareMethod('triggerError', function (value) {
      throw new Error("Manually triggered embedded error");
    })
    .declareMethod('setContent', function (value) {
      rJS(this).embedded_property = value;
    })
    .declareMethod('getContent', function () {
      return rJS(this).embedded_property;
    });

}(window, rJS));
