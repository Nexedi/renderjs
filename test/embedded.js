/*jslint nomen: true*/
(function (window, rJS) {
  "use strict";

  var gk = rJS(window),
    ready_called = false,
    service_started = false,
    job_started = false,
    event_started = false;

  gk.ready(function (g) {
    ready_called = true;
  })
    .onEvent('bar', function () {
      event_started = true;
    })
    .declareService(function () {
      service_started = true;
      var event = new Event("bar");
      this.__element.dispatchEvent(event);
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
