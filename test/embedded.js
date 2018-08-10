/*
 * Copyright 2013, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
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
  gk.ready(function () {
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
