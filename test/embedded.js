/*jslint nomen: true*/
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
    .declareMethod('isSubGadgetDictInitialize', function () {
      return ((this.hasOwnProperty("__sub_gadget_dict")) &&
              (JSON.stringify(this.__sub_gadget_dict) === "{}"));
    })
    .declareMethod('triggerError', function (value) {
      throw new Error("Manually triggered embedded error");
    })
    .declareMethod('setContent', function (value) {
      this.embedded_property = value;
    })
    .declareMethod('getContent', function () {
      return this.embedded_property;
    })
    .declareAcquiredMethod('plugOKAcquire', 'acquireMethodRequested')
    .declareMethod('callOKAcquire', function (param1, param2) {
      return this.plugOKAcquire(param1, param2);
    })
    .declareAcquiredMethod('plugErrorAcquire',
                          'acquireMethodRequestedWithAcquisitionError')
    .declareMethod('callErrorAcquire', function (param1, param2) {
      return this.plugErrorAcquire(param1, param2);
    });

}(window, rJS));
