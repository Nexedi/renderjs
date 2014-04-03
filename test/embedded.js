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
      return ((this.hasOwnProperty("sub_gadget_dict")) &&
              (JSON.stringify(this.sub_gadget_dict) === "{}"));
    })
    .declareMethod('triggerError', function (value) {
      throw new Error("Manually triggered embedded error");
    })
    .declareMethod('triggerEvent', function (value) {
      return this.trigger('fooTrigger', 'barValue');
    })
    .declareMethod('setContent', function (value) {
      this.embedded_property = value;
    })
    .declareMethod('getContent', function () {
      return this.embedded_property;
    })
    .declareMethod('callAcquire', function (method_name, param_list) {
      return this.acquire(method_name, param_list);
    });

}(window, rJS));
