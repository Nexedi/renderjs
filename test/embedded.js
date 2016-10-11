/*jslint nomen: true*/
(function (window, rJS) {
  "use strict";

  var gk = rJS(window),
    ready_called = false,
    service_started = false,
    job_started = false,
    event_started = false,
    state_change_callback_called = false,
    state_change_count = 0,
    init_state = {bar: 'foo'},
    state_change_callback = function (modification_dict) {
      state_change_callback_called = (state_change_count === 0) &&
                                     (modification_dict.foo === 'bar');
      state_change_count += 1;
    };

  gk.ready(function (g) {
    ready_called = true;
  })
    .setState(init_state)
    .onStateChange(state_change_callback)
    .onEvent('bar', function () {
      event_started = true;
    })
    .declareService(function () {
      service_started = true;
      var event = new Event("bar");
      this.element.dispatchEvent(event);
    })
    .declareMethod('wasStateInitialized', function () {
      return ((this.hasOwnProperty("state")) &&
              (JSON.stringify(this.state) === '{"bar":"foo"}')) &&
              (this.state !== init_state);
    })
    .declareMethod('wasStateHandlerDeclared', function () {
      return ((!this.hasOwnProperty("__state_change_callback")) &&
              (this.__state_change_callback === state_change_callback));
    })
    .declareMethod('wasReadyCalled', function () {
      return ready_called;
    })
    .declareMethod('wasServiceStarted', function () {
      return service_started;
    })
    .declareMethod('triggerJob', function () {
      return this.runJob();
    })
    .declareMethod('wasEventStarted', function () {
      return event_started;
    })
    .declareMethod('wasJobStarted', function () {
      return job_started;
    })
    .declareMethod('triggerStateChange', function () {
      return this.changeState({foo: 'bar'});
    })
    .declareMethod('wasStateChangeHandled', function () {
      return state_change_callback_called;
    })
    .declareJob('runJob', function () {
      job_started = true;
    })
    .declareMethod('canReportServiceError', function () {
      return (this.aq_reportServiceError !== undefined);
    })
    .declareMethod('isSubGadgetDictInitialize', function () {
      return ((this.hasOwnProperty("__sub_gadget_dict")) &&
              (JSON.stringify(this.__sub_gadget_dict) === "{}"));
    })
    .declareMethod('isAcquisitionDictInitialize', function () {
      return (this.__acquired_method_dict !== undefined);
    })
    .declareMethod('isServiceListInitialize', function () {
      return (this.constructor.__service_list !== undefined);
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
