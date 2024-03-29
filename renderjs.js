/*
 * Copyright 2012, Nexedi SA
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
/*
 * renderJs - Generic Gadget library renderer.
 * https://renderjs.nexedi.com/
 */
(function wrapRenderJS(document, window, RSVP, DOMParser, Channel,
                       MutationObserver, Node, FileReader, Blob, navigator,
                       Event, URL) {
  "use strict";

  // Error propagation in jschannel uses JSON.stringify
  // Sadly, ...
  // JSON.stringify(new TypeError('lala')) -> '{}'
  // Change the browser default behaviour to propagate at least the message
  // See https://stackoverflow.com/a/18391400
  if (!Error.prototype.hasOwnProperty('toJSON')) {
    Object.defineProperty(Error.prototype, 'toJSON', {
      value: function () {
        var alt = {};

        Object.getOwnPropertyNames(this).forEach(function (key) {
          alt[key] = this[key];
        }, this);

        return alt;
      },
      configurable: true,
      writable: true
    });
  }

  /////////////////////////////////////////////////////////////////
  // Error
  /////////////////////////////////////////////////////////////////
  function ScopeError(message) {
    this.name = "scopeerror";
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string.');
    }
    this.message = message || "Scope Error";
  }
  ScopeError.prototype = new Error();
  ScopeError.prototype.constructor = ScopeError;

  //////////////////////////////////////////
  // ParserError
  //////////////////////////////////////////
  function DOMParserError(message) {
    this.name = "DOMParserError";
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string for DOMParserError.');
    }
    this.message = message || "Default Message";
  }
  DOMParserError.prototype = new Error();
  DOMParserError.prototype.constructor = DOMParserError;

  //////////////////////////////////////////
  // DOMParser
  //////////////////////////////////////////
  function parseDocumentStringOrFail(string, mime_type) {
    var doc = new DOMParser().parseFromString(string, mime_type),
      error_node = doc.querySelector('parsererror');
    if (error_node !== null) {
      // parsing failed
      throw new DOMParserError(error_node.textContent);
    }
    return doc;
  }

  /////////////////////////////////////////////////////////////////
  // renderJS.IframeSerializationError
  /////////////////////////////////////////////////////////////////
  function IframeSerializationError(message) {
    this.name = "IframeSerializationError";
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string.');
    }
    this.message = message || "Parameter serialization failed";
  }
  IframeSerializationError.prototype = new Error();
  IframeSerializationError.prototype.constructor = IframeSerializationError;

  function ensurePushableQueue(callback, argument_list, context) {
    var result;
    try {
      result = callback.apply(context, argument_list);
    } catch (e) {
      return new RSVP.Queue(RSVP.reject(e));
    }
    if (result instanceof RSVP.Queue) {
      return result;
    }
    return new RSVP.Queue(result);
  }

  function readBlobAsDataURL(blob) {
    var fr = new FileReader();
    return new RSVP.Promise(function waitFormDataURLRead(resolve, reject) {
      fr.addEventListener("load", function handleDataURLRead(evt) {
        resolve(evt.target.result);
      });
      fr.addEventListener("error", reject);
      fr.readAsDataURL(blob);
    }, function cancelReadBlobAsDataURL() {
      fr.abort();
    });
  }

  function loopEventListener(target, type, useCapture, callback,
                             prevent_default) {
    //////////////////////////
    // Infinite event listener (promise is never resolved)
    // eventListener is removed when promise is cancelled/rejected
    //////////////////////////
    var handle_event_callback,
      callback_promise;

    if (prevent_default === undefined) {
      prevent_default = true;
    }

    function cancelResolver(msg) {
      if ((callback_promise !== undefined) &&
          (typeof callback_promise.cancel === "function")) {
        callback_promise.cancel(msg);
      }
    }

    function canceller(msg) {
      if (handle_event_callback !== undefined) {
        target.removeEventListener(type, handle_event_callback, useCapture);
      }
      cancelResolver(msg);
    }
    function itsANonResolvableTrap(resolve, reject) {
      var result;
      handle_event_callback = function handleEventCallback(evt) {
        if (prevent_default) {
          evt.stopPropagation();
          evt.preventDefault();
        }

        cancelResolver(
          "Cancelling previous event (" + evt.type + ")"
        );

        try {
          result = callback(evt);
        } catch (e) {
          return reject(e);
        }

        callback_promise = new RSVP.Queue(result)
          .push(undefined, function handleEventCallbackError(error) {
            // Prevent rejecting the loop, if the result cancelled itself
            if (!(error instanceof RSVP.CancellationError)) {
              canceller(error.toString());
              reject(error);
            }
          });
      };

      target.addEventListener(type, handle_event_callback, useCapture);
    }
    return new RSVP.Promise(itsANonResolvableTrap, canceller);
  }

  function promiseAnimationFrame() {
    var request_id;

    function canceller() {
      window.cancelAnimationFrame(request_id);
    }

    function resolver(resolve) {
      request_id = window.requestAnimationFrame(resolve);
    }
    return new RSVP.Promise(resolver, canceller);
  }

  function ajax(url) {
    var xhr;
    function resolver(resolve, reject) {
      function handler() {
        try {
          if (xhr.readyState === 0) {
            // UNSENT
            reject(xhr);
          } else if (xhr.readyState === 4) {
            // DONE
            if ((xhr.status < 200) || (xhr.status >= 300) ||
                (!/^text\/html[;]?/.test(
                  xhr.getResponseHeader("Content-Type") || ""
                ))) {
              reject(xhr);
            } else {
              resolve(xhr);
            }
          }
        } catch (e) {
          reject(e);
        }
      }

      xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.onreadystatechange = handler;
      xhr.setRequestHeader('Accept', 'text/html');
      xhr.withCredentials = true;
      xhr.send();
    }

    function canceller() {
      if ((xhr !== undefined) && (xhr.readyState !== xhr.DONE)) {
        xhr.abort();
      }
    }
    return new RSVP.Promise(resolver, canceller);
  }

  var gadget_model_defer_dict = {},
    javascript_registration_dict = {},
    stylesheet_registration_dict = {},
    gadget_loading_klass_list = [],
    renderJS,
    Monitor,
    Mutex,
    scope_increment = 0,
    isAbsoluteOrDataURL = new RegExp('^(?:[a-z]+:)?//|data:', 'i'),
    is_page_unloaded = false,
    error_list = [],
    unhandled_error_type = 0,
    all_dependency_loaded_deferred;

  window.addEventListener('error', function handleGlobalError(error) {
    error_list.push(error);
  });

  window.addEventListener('beforeunload', function handleBeforeUnload() {
    // XXX If another listener cancel the page unload,
    // it will not restore renderJS crash report
    is_page_unloaded = true;
  });

  /////////////////////////////////////////////////////////////////
  // Mutex
  /////////////////////////////////////////////////////////////////
  Mutex = function createMutex() {
    if (!(this instanceof Mutex)) {
      return new Mutex();
    }
    this._latest_promise = null;
  };

  function doNothing() {
    return;
  }

  Mutex.prototype = {
    constructor: Mutex,
    lockAndRun: function lockMutexAndRun(callback) {
      var previous_promise = this._latest_promise,
        returned_promise;
      if (previous_promise === null) {
        this._latest_promise = RSVP.resolve(callback());
        return this._latest_promise;
      }
      returned_promise = previous_promise
        .always(function () {
          return callback();
        });
      // Do not return latest promise, to not allow external caller
      // to explicitely cancel it,
      // ie, ensure next promise is triggered only when ALL previous
      // promised are finished (not only the single previous one)
      this._latest_promise = RSVP.all([
        previous_promise.always(doNothing),
        returned_promise.always(doNothing)
      ]);
      return returned_promise;
    }
  };

  /////////////////////////////////////////////////////////////////
  // Helper functions
  /////////////////////////////////////////////////////////////////
  function removeHash(url) {
    var index = url.indexOf('#');
    if (index > 0) {
      url = url.substring(0, index);
    }
    return url;
  }

  function getErrorTypeMapping() {
    var error_type_mapping = {
      1: renderJS.AcquisitionError,
      2: RSVP.CancellationError
    };
    // set the unhandle error type to be used as default
    error_type_mapping[unhandled_error_type] = IframeSerializationError;
    return error_type_mapping;
  }

  function convertObjectToErrorType(error) {
    var error_type,
      error_type_mapping = getErrorTypeMapping();

    for (error_type in error_type_mapping) {
      if (error_type_mapping.hasOwnProperty(error_type) &&
          error instanceof error_type_mapping[error_type]) {
        return error_type;
      }
    }
    return unhandled_error_type;
  }

  function rejectErrorType(value, reject) {
    var error_type_mapping = getErrorTypeMapping();
    if (value.hasOwnProperty("type") &&
        error_type_mapping.hasOwnProperty(value.type)) {
      value = new error_type_mapping[value.type](
        value.msg
      );
    }
    return reject(value);
  }

  function letsCrash(e) {
    var i,
      body,
      container,
      paragraph,
      link,
      error;
    if (is_page_unloaded) {
      /*global console*/
      console.info('-- Error dropped, as page is unloaded');
      console.info(e);
      return;
    }

    error_list.push(e);
    // Add error handling stack
    error_list.push(new Error('stopping renderJS'));

    body = document.getElementsByTagName('body')[0];
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }

    container = document.createElement("section");
    paragraph = document.createElement("h1");
    paragraph.textContent = 'Unhandled Error';
    container.appendChild(paragraph);

    paragraph = document.createElement("p");
    paragraph.textContent = 'Please report this error to the support team';
    container.appendChild(paragraph);

    paragraph = document.createElement("p");
    paragraph.textContent = 'Location: ';
    link = document.createElement("a");
    link.href = link.textContent = window.location.toString();
    paragraph.appendChild(link);
    container.appendChild(paragraph);

    paragraph = document.createElement("p");
    paragraph.textContent = 'User-agent: ' + navigator.userAgent;
    container.appendChild(paragraph);

    paragraph = document.createElement("p");
    paragraph.textContent = 'Date: ' + new Date(Date.now()).toISOString();
    container.appendChild(paragraph);

    body.appendChild(container);

    for (i = 0; i < error_list.length; i += 1) {
      error = error_list[i];

      if (error instanceof Event) {
        error = {
          string: error.toString(),
          message: error.message,
          type: error.type,
          target: error.target
        };
        if (error.target !== undefined) {
          error_list.splice(i + 1, 0, error.target);
        }
      }

      if (error instanceof XMLHttpRequest) {
        error = {
          message: error.toString(),
          readyState: error.readyState,
          status: error.status,
          statusText: error.statusText,
          response: error.response,
          responseUrl: error.responseUrl,
          response_headers: error.getAllResponseHeaders()
        };
      }
      if (error.constructor === Array ||
          error.constructor === String ||
          error.constructor === Object) {
        try {
          error = JSON.stringify(error);
        } catch (ignore) {
        }
      }

      container = document.createElement("section");

      paragraph = document.createElement("h2");
      paragraph.textContent = error.message || error;
      container.appendChild(paragraph);

      if (error.fileName !== undefined) {
        paragraph = document.createElement("p");
        paragraph.textContent = 'File: ' +
          error.fileName +
          ': ' + error.lineNumber;
        container.appendChild(paragraph);
      }

      if (error.stack !== undefined) {
        paragraph = document.createElement("pre");
        paragraph.textContent = 'Stack: ' + error.stack;
        container.appendChild(paragraph);
      }

      body.appendChild(container);
    }
    // XXX Do not crash the application if it fails
    // Where to write the error?
    /*global console*/
    console.error(e.stack);
    console.error(e);
  }

  /////////////////////////////////////////////////////////////////
  // Service Monitor promise
  /////////////////////////////////////////////////////////////////
  function ResolvedMonitorError(message) {
    this.name = "resolved";
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string.');
    }
    this.message = message || "Default Message";
  }
  ResolvedMonitorError.prototype = new Error();
  ResolvedMonitorError.prototype.constructor = ResolvedMonitorError;

  Monitor = function createMonitor() {
    var monitor = this,
      promise_list = [],
      promise,
      reject,
      resolved;

    if (!(this instanceof Monitor)) {
      return new Monitor();
    }

    function canceller(msg) {
      var len = promise_list.length,
        i;
      for (i = 0; i < len; i += 1) {
        promise_list[i].cancel(msg);
      }
      // Clean it to speed up other canceller run
      promise_list = [];
    }

    promise = new RSVP.Promise(function promiseMonitor(done, fail) {
      reject = function rejectMonitor(rejectedReason) {
        if (resolved) {
          return;
        }
        monitor.isRejected = true;
        monitor.rejectedReason = rejectedReason;
        resolved = true;
        canceller(rejectedReason.toString());
        return fail(rejectedReason);
      };
    }, canceller);

    monitor.cancel = function cancelMonitor(msg) {
      if (resolved) {
        return;
      }
      resolved = true;
      promise.cancel(msg);
      promise.fail(function rejectMonitorPromise(rejectedReason) {
        monitor.isRejected = true;
        monitor.rejectedReason = rejectedReason;
      });
    };
    monitor.then = promise.then.bind(promise);
    monitor.fail = promise.fail.bind(promise);

    monitor.monitor = function startMonitor(promise_to_monitor) {
      if (resolved) {
        throw new ResolvedMonitorError();
      }
      var queue = new RSVP.Queue(promise_to_monitor)
        .push(function handlePromiseToMonitorSuccess(fulfillmentValue) {
          // Promise to monitor is fullfilled, remove it from the list
          var len = promise_list.length,
            sub_promise_to_monitor,
            new_promise_list = [],
            i;
          for (i = 0; i < len; i += 1) {
            sub_promise_to_monitor = promise_list[i];
            if (!(sub_promise_to_monitor.isFulfilled ||
                sub_promise_to_monitor.isRejected)) {
              new_promise_list.push(sub_promise_to_monitor);
            }
          }
          promise_list = new_promise_list;
        }, function handlePromiseToMonitorError(rejectedReason) {
          reject(rejectedReason);
          throw rejectedReason;
        });

      promise_list.push(queue);

      return this;
    };
  };

  Monitor.prototype = Object.create(RSVP.Promise.prototype);
  Monitor.prototype.constructor = Monitor;

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget
  /////////////////////////////////////////////////////////////////
  function RenderJSGadget() {
    if (!(this instanceof RenderJSGadget)) {
      return new RenderJSGadget();
    }
  }
  RenderJSGadget.prototype.__title = "";
  RenderJSGadget.prototype.__interface_list = [];
  RenderJSGadget.prototype.__path = "";
  RenderJSGadget.prototype.__html = "";
  RenderJSGadget.prototype.__required_css_list = [];
  RenderJSGadget.prototype.__required_js_list = [];

  function deleteGadgetMonitor(g) {
    if (g.hasOwnProperty('__monitor')) {
      g.__monitor.cancel(
        "Deleting Gadget Monitor " + "(" +
          g.element.dataset.gadgetUrl +
          ")"
      );
      delete g.__monitor;
      g.__job_list = [];
    }
  }

  function createGadgetMonitor(g) {
    g.__monitor = new Monitor();
    g.__job_dict = {};
    g.__job_triggered = false;
    g.__monitor.fail(function handleGadgetMonitorError(error) {
      if (!(error instanceof RSVP.CancellationError)) {
        return g.aq_reportServiceError(error);
      }
    // Crash the application if the acquisition generates an error.
    }).fail(letsCrash);
  }

  function clearGadgetInternalParameters(gadget) {
    gadget.__sub_gadget_dict = {};
    gadget.__job_list = [];
    if (gadget.__json_state !== undefined) {
      gadget.state = JSON.parse(gadget.__json_state);
    }
  }

  function loadSubGadgetDOMDeclaration() {
    var element_list = this.element.querySelectorAll('[data-gadget-url]'),
      element,
      promise_list = [],
      scope,
      url,
      sandbox,
      i,
      context = this;

    function prepareReportGadgetDeclarationError(scope) {
      return function reportGadgetDeclarationError(error) {
        var aq_dict = context.__acquired_method_dict || {},
          method_name = 'reportGadgetDeclarationError';
        if (aq_dict.hasOwnProperty(method_name)) {
          return aq_dict[method_name].apply(context,
                                            [arguments, scope]);
        }
        throw error;
      };
    }

    for (i = 0; i < element_list.length; i += 1) {
      element = element_list[i];
      scope = element.getAttribute("data-gadget-scope");
      url = element.getAttribute("data-gadget-url");
      sandbox = element.getAttribute("data-gadget-sandbox");
      if (url !== null) {
        promise_list.push(
          context.declareGadget(url, {
            element: element,
            scope: scope || undefined,
            sandbox: sandbox || undefined
          })
            .push(undefined, prepareReportGadgetDeclarationError(scope))
        );
      }
    }

    return RSVP.all(promise_list);
  }

  RenderJSGadget.__ready_list = [];
  RenderJSGadget.ready = function ready(callback) {
    this.__ready_list.push(callback);
    return this;
  };
  RenderJSGadget.setState = function setState(state_dict) {
    this.prototype.__json_state = JSON.stringify(state_dict);
    return this;
  };
  RenderJSGadget.onStateChange = function onStateChange(callback) {
    this.prototype.__state_change_callback = callback;
    return this;
  };

  RenderJSGadget.__service_list = [];
  RenderJSGadget.declareService = function declareService(callback) {
    this.__service_list.push(callback);
    return this;
  };
  RenderJSGadget.onEvent = function onEvent(type, callback, use_capture,
                                            prevent_default) {
    this.__service_list.push(function startLoopEventListenerService() {
      return loopEventListener(this.element, type, use_capture,
                               callback.bind(this), prevent_default);
    });
    return this;
  };

  RenderJSGadget.onLoop = function onLoop(callback, delay) {
    if (delay === undefined) {
      delay = 0;
    }
    this.__service_list.push(function handleServiceCallback() {
      var queue_loop = new RSVP.Queue(),
        context = this,
        wait = function waitForLoopIteration() {
          queue_loop
            .push(function waitNextOnLoopDelay() {
              return RSVP.delay(delay);
            })
            .push(function waitNextOnLoopAnimationFrame() {
              // Only loop when the app has the focus
              return promiseAnimationFrame();
            })
            .push(function executeOnLoopCallback() {
              return callback.apply(context, []);
            })
            .push(wait);
        };
      wait();
      return queue_loop;
    });
    return this;
  };

  function runJob(gadget, name, callback, argument_list) {
    if (gadget.__job_dict.hasOwnProperty(name)) {
      gadget.__job_dict[name].cancel(name + " : Cancelling previous job");
    }
    var job_promise = ensurePushableQueue(callback, argument_list, gadget);
    gadget.__job_dict[name] = job_promise;
    // gadget.__monitor.monitor(job_promise
    gadget.__monitor.monitor(new RSVP.Queue(job_promise)
      .push(undefined, function handleJobError(error) {
        // Do not crash monitor if the job has been cancelled
        // by a new execution
        if (!(error instanceof RSVP.CancellationError)) {
          throw error;
        }
      }));
  }

  function startService(gadget) {
    if (((gadget.constructor.__service_list.length === 0) &&
         (!gadget.constructor.__job_declared)) ||
        (gadget.hasOwnProperty('__monitor'))) {
      return;
    }
    createGadgetMonitor(gadget);
    gadget.__monitor.monitor(new RSVP.Queue()
      .push(function monitorAllServiceList() {
        var i,
          service_list = gadget.constructor.__service_list,
          job_list = gadget.__job_list;
        for (i = 0; i < service_list.length; i += 1) {
          gadget.__monitor.monitor(service_list[i].apply(gadget));
        }
        for (i = 0; i < job_list.length; i += 1) {
          runJob(gadget, job_list[i][0], job_list[i][1], job_list[i][2]);
        }
        gadget.__job_list = [];
        gadget.__job_triggered = true;
      })
      );
  }

  function registerMethod(gadget_klass, method_name, method_type) {
    if (!gadget_klass.hasOwnProperty('__method_type_dict')) {
      gadget_klass.__method_type_dict = {};
    }
    gadget_klass.__method_type_dict[method_name] = method_type;
  }

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareJob
  // gadget internal method, which trigger execution
  // of a function inside a service
  /////////////////////////////////////////////////////////////////
  RenderJSGadget.declareJob = function declareJob(name, callback) {
    this.__job_declared = true;
    this.prototype[name] = function triggerJob() {
      var context = this,
        argument_list = arguments;

      if (context.__job_triggered) {
        runJob(context, name, callback, argument_list);
      } else {
        context.__job_list.push([name, callback, argument_list]);
      }
    };
    registerMethod(this, name, 'job');
    // Allow chain
    return this;
  };

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareMethod
  /////////////////////////////////////////////////////////////////
  RenderJSGadget.declareMethod = function declareMethod(name, callback,
                                                        options) {
    this.prototype[name] = function triggerMethod() {
      var context = this,
        argument_list = arguments,
        mutex_name;

      function waitForMethodCallback() {
        return callback.apply(context, argument_list);
      }

      if ((options !== undefined) && (options.hasOwnProperty('mutex'))) {
        mutex_name = '__mutex_' + options.mutex;
        if (!context.hasOwnProperty(mutex_name)) {
          context[mutex_name] = new Mutex();
        }
        return ensurePushableQueue(context[mutex_name].lockAndRun,
                                   [waitForMethodCallback],
                                   context[mutex_name]);
      }
      return ensurePushableQueue(callback, argument_list, context);
    };
    registerMethod(this, name, 'method');
    // Allow chain
    return this;
  };

  RenderJSGadget
    .declareMethod('getInterfaceList', function getInterfaceList() {
      // Returns the list of gadget prototype
      return this.__interface_list;
    })
    .declareMethod('getMethodList', function getMethodList(type) {
      // Returns the list of gadget methods
      var key,
        method_list = [],
        method_dict = this.constructor.__method_type_dict || {};
      for (key in method_dict) {
        if (method_dict.hasOwnProperty(key)) {
          if ((type === undefined) ||
              (type === method_dict[key])) {
            method_list.push(key);
          }
        }
      }
      return method_list;
    })
    .declareMethod('getRequiredCSSList', function getRequiredCSSList() {
      // Returns a list of CSS required by the gadget
      return this.__required_css_list;
    })
    .declareMethod('getRequiredJSList', function getRequiredJSList() {
      // Returns a list of JS required by the gadget
      return this.__required_js_list;
    })
    .declareMethod('getPath', function getPath() {
      // Returns the path of the code of a gadget
      return this.__path;
    })
    .declareMethod('getTitle', function getTitle() {
      // Returns the title of a gadget
      return this.__title;
    })
    .declareMethod('getElement', function getElement() {
      // Returns the DOM Element of a gadget
      // XXX Kept for compatibility. Use element property directly
      if (this.element === undefined) {
        throw new Error("No element defined");
      }
      return this.element;
    })
    .declareMethod('changeState', function changeState(state_dict) {
      var context = this,
        key,
        modified = false,
        previous_cancelled = context.hasOwnProperty('__modification_dict'),
        modification_dict;
      if (previous_cancelled) {
        modification_dict = context.__modification_dict;
        modified = true;
      } else {
        modification_dict = {};
      }
      for (key in state_dict) {
        if (state_dict.hasOwnProperty(key) &&
            (state_dict[key] !== context.state[key])) {
          context.state[key] = state_dict[key];
          modification_dict[key] = state_dict[key];
          modified = true;
        }
      }
      if (modified && context.__state_change_callback !== undefined) {
        context.__modification_dict = modification_dict;
        return ensurePushableQueue(
          context.__state_change_callback,
          [modification_dict],
          context
        )
          .push(function handleStateChangeSuccess(result) {
            delete context.__modification_dict;
            return result;
          });
      }
    }, {mutex: 'changestate'});

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareAcquiredMethod
  /////////////////////////////////////////////////////////////////
  function acquire(child_gadget, method_name, argument_list) {
    var gadget = this,
      // Do not specify default __acquired_method_dict on prototype
      // to prevent modifying this default value (with
      // allowPublicAcquiredMethod for example)
      aq_dict = gadget.__acquired_method_dict || {},
      key,
      gadget_scope;

    if (!aq_dict.hasOwnProperty(method_name)) {
      // "aq_dynamic is not defined"
      return gadget.__aq_parent(method_name, argument_list);
    }

    for (key in gadget.__sub_gadget_dict) {
      if (gadget.__sub_gadget_dict.hasOwnProperty(key)) {
        if (gadget.__sub_gadget_dict[key] === child_gadget) {
          gadget_scope = key;
        }
      }
    }

    return ensurePushableQueue(
      aq_dict[method_name],
      [argument_list, gadget_scope],
      gadget
    )
      .push(undefined, function handleAcquireMethodError(error) {
        if (error instanceof renderJS.AcquisitionError) {
          return gadget.__aq_parent(method_name, argument_list);
        }
        throw error;
      });
  }

  RenderJSGadget.declareAcquiredMethod =
    function declareAcquiredMethod(name, method_name_to_acquire) {
      this.prototype[name] = function acquireMethod() {
        var argument_list = Array.prototype.slice.call(arguments, 0),
          gadget = this;
        return ensurePushableQueue(
          gadget.__aq_parent,
          [method_name_to_acquire, argument_list],
          gadget
        );
      };
      registerMethod(this, name, 'acquired_method');
      // Allow chain
      return this;
    };
  RenderJSGadget.declareAcquiredMethod("aq_reportServiceError",
                                       "reportServiceError");
  RenderJSGadget.declareAcquiredMethod("aq_reportGadgetDeclarationError",
                                       "reportGadgetDeclarationError");

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.allowPublicAcquisition
  /////////////////////////////////////////////////////////////////
  RenderJSGadget.allowPublicAcquisition =
    function allowPublicAcquisition(method_name, callback) {
      this.prototype.__acquired_method_dict[method_name] = callback;

      // Allow chain
      return this;
    };

  // Set aq_parent on gadget_instance which call acquire on parent_gadget
  function setAqParent(gadget_instance, parent_gadget) {
    gadget_instance.__aq_parent =
      function __aq_parent(method_name, argument_list) {
        return acquire.apply(parent_gadget, [gadget_instance, method_name,
                                             argument_list]);
      };
  }

  /////////////////////////////////////////////////////////////////
  // RenderJSEmbeddedGadget
  /////////////////////////////////////////////////////////////////
  // Class inheritance
  function RenderJSEmbeddedGadget() {
    if (!(this instanceof RenderJSEmbeddedGadget)) {
      return new RenderJSEmbeddedGadget();
    }
    RenderJSGadget.call(this);
  }
  RenderJSEmbeddedGadget.__ready_list = [];
  RenderJSEmbeddedGadget.__service_list =
    RenderJSGadget.__service_list.slice();
  RenderJSEmbeddedGadget.ready =
    RenderJSGadget.ready;
  RenderJSEmbeddedGadget.setState =
    RenderJSGadget.setState;
  RenderJSEmbeddedGadget.onStateChange =
    RenderJSGadget.onStateChange;
  RenderJSEmbeddedGadget.declareService =
    RenderJSGadget.declareService;
  RenderJSEmbeddedGadget.onEvent =
    RenderJSGadget.onEvent;
  RenderJSEmbeddedGadget.onLoop =
    RenderJSGadget.onLoop;
  RenderJSEmbeddedGadget.prototype = new RenderJSGadget();
  RenderJSEmbeddedGadget.prototype.constructor = RenderJSEmbeddedGadget;

  /////////////////////////////////////////////////////////////////
  // privateDeclarePublicGadget
  /////////////////////////////////////////////////////////////////
  function createPrivateInstanceFromKlass(Klass, options, parent_gadget,
                                          old_element) {
    // Get the gadget class and instanciate it
    var i,
      gadget_instance,
      template_node_list = Klass.__template_element.body.childNodes,
      fragment = document.createDocumentFragment();
    gadget_instance = new Klass();
    gadget_instance.element = options.element;
    gadget_instance.state = {};
    for (i = 0; i < template_node_list.length; i += 1) {
      fragment.appendChild(
        template_node_list[i].cloneNode(true)
      );
    }
    gadget_instance.element.appendChild(fragment);
    setAqParent(gadget_instance, parent_gadget);
    clearGadgetInternalParameters(gadget_instance);
    if (old_element !== undefined) {
      // Add gadget to the DOM if needed
      // Do it when all DOM modifications are done
      old_element.parentNode.replaceChild(options.element,
                                          old_element);
    }
    return gadget_instance;
  }

  function privateDeclarePublicGadget(url, options, parent_gadget,
                                      old_element) {
    var klass = renderJS.declareGadgetKlass(url);
    // gadget loading should not be interrupted
    // if not, gadget's definition will not be complete
    //.then will return another promise
    //so loading_klass_promise can't be cancel
    if (typeof klass.then === 'function') {
      return klass.then(function createAsyncPrivateInstanceFromKlass(Klass) {
        return createPrivateInstanceFromKlass(Klass, options, parent_gadget,
                                              old_element);
      });
    }
    return createPrivateInstanceFromKlass(klass, options, parent_gadget,
                                          old_element);
  }

  /////////////////////////////////////////////////////////////////
  // RenderJSIframeGadget
  /////////////////////////////////////////////////////////////////
  function RenderJSIframeGadget() {
    if (!(this instanceof RenderJSIframeGadget)) {
      return new RenderJSIframeGadget();
    }
    RenderJSGadget.call(this);
  }
  RenderJSIframeGadget.__ready_list = [];
  RenderJSIframeGadget.ready =
    RenderJSGadget.ready;
  RenderJSIframeGadget.setState =
    RenderJSGadget.setState;
  RenderJSIframeGadget.onStateChange =
    RenderJSGadget.onStateChange;
  RenderJSIframeGadget.__service_list = [];
  RenderJSIframeGadget.declareService =
    RenderJSGadget.declareService;
  RenderJSIframeGadget.onEvent =
    RenderJSGadget.onEvent;
  RenderJSIframeGadget.onLoop =
    RenderJSGadget.onLoop;
  RenderJSIframeGadget.prototype = new RenderJSGadget();
  RenderJSIframeGadget.prototype.constructor = RenderJSIframeGadget;

  /////////////////////////////////////////////////////////////////
  // privateDeclareIframeGadget
  /////////////////////////////////////////////////////////////////
  function privateDeclareIframeGadget(url, options, parent_gadget,
                                      old_element) {
    var gadget_instance,
      iframe,
      transaction_dict = {},
      iframe_loading_deferred = RSVP.defer();
    if (old_element === undefined) {
      throw new Error("DOM element is required to create Iframe Gadget " +
                      url);
    }

    // Check if the element is attached to the DOM
    if (!document.contains(old_element)) {
      throw new Error("The parent element is not attached to the DOM for " +
                      url);
    }

    gadget_instance = new RenderJSIframeGadget();
    setAqParent(gadget_instance, parent_gadget);
    iframe = document.createElement("iframe");
    iframe.addEventListener('error', function handleIframeError(error) {
      iframe_loading_deferred.reject(error);
    });
    iframe.addEventListener('load', function handleIframeLoad() {
      return RSVP.timeout(5000)
        .fail(function triggerIframeTimeout() {
          iframe_loading_deferred.reject(
            new Error('Timeout while loading: ' + url)
          );
        });
    });
//    gadget_instance.element.setAttribute("seamless", "seamless");
    iframe.setAttribute("src", url);
    gadget_instance.__path = url;
    gadget_instance.element = options.element;
    gadget_instance.state = {};
    options.element.appendChild(iframe);
    clearGadgetInternalParameters(gadget_instance);
    // Add gadget to the DOM if needed
    // Do it when all DOM modifications are done
    old_element.parentNode.replaceChild(options.element,
                                        old_element);

    // XXX Manage unbind when deleting the gadget

    // Create the communication channel with the iframe
    gadget_instance.__chan = Channel.build({
      window: iframe.contentWindow,
      // origin: (new URL(url, window.location)).origin,
      origin: '*',
      scope: "renderJS"
    });

    // Create new method from the declareMethod call inside the iframe
    gadget_instance.__chan.bind(
      "declareMethod",
      function handleChannelDeclareMethod(trans, method_name) {
        gadget_instance[method_name] = function triggerChannelDeclareMethod() {
          var argument_list = arguments,
            channel_call_id,
            wait_promise = new RSVP.Promise(
              function handleChannelCall(resolve, reject) {
                function errorWrap(value) {
                  return rejectErrorType(value, reject);
                }

                channel_call_id = gadget_instance.__chan.call({
                  method: "methodCall",
                  params: [
                    method_name,
                    Array.prototype.slice.call(argument_list, 0)],
                  success: resolve,
                  error: errorWrap
                });
              },
              function cancelChannelCall(msg) {
                gadget_instance.__chan.notify({
                  method: "cancelMethodCall",
                  params: [
                    channel_call_id,
                    msg
                  ]
                });
              }
            );

          return ensurePushableQueue(function waitForChannelCall() {
            return wait_promise;
          });
        };
        return "OK";
      }
    );

    // Wait for the iframe to be loaded before continuing
    gadget_instance.__chan.bind("ready", function handleChannelReady(trans) {
      iframe_loading_deferred.resolve(gadget_instance);
      return "OK";
    });
    gadget_instance.__chan.bind("failed",
                                function handleChannelFail(trans, params) {
        iframe_loading_deferred.reject(params);
        return "OK";
      });
    gadget_instance.__chan.bind("cancelAcquiredMethodCall",
                                function handleChannelCancel(trans,
                                                           params) {
        var transaction_id = params[0],
          msg = params[1];
        if (transaction_dict.hasOwnProperty(transaction_id)) {
          transaction_dict[transaction_id].cancel(msg);
          delete transaction_dict[transaction_id];
        }
        return "OK";
      });
    gadget_instance.__chan.bind("acquire",
                                function handleChannelAcquire(trans, params,
                                                              transaction_id) {
        function cleanUpTransactionDict(transaction_id) {
          if (transaction_dict.hasOwnProperty(transaction_id)) {
            delete transaction_dict[transaction_id];
          }
        }
        new RSVP.Queue()
          .push(function () {
            var promise = gadget_instance.__aq_parent.apply(
              gadget_instance,
              params
            );
            transaction_dict[transaction_id] = promise;
            return promise;
          })
          .then(function () {
            cleanUpTransactionDict(transaction_id);
            trans.complete.apply(trans, arguments);
          })
          .fail(function handleChannelAcquireError(e) {
            var message = e instanceof Error ? e.message : e;
            trans.error({
              type: convertObjectToErrorType(e),
              msg: message
            });
            return cleanUpTransactionDict(transaction_id);
          });
        trans.delayReturn(true);
      });

    return iframe_loading_deferred.promise;
  }

  /////////////////////////////////////////////////////////////////
  // privateDeclareDataUrlGadget
  /////////////////////////////////////////////////////////////////
  function privateDeclareDataUrlGadget(url, options, parent_gadget,
                                       old_element) {

    return new RSVP.Queue()
      .push(function waitForDataUrlAjax() {
        return ajax(url);
      })
      .push(function handleDataURLAjaxResponse(xhr) {
        // Insert a "base" element, in order to resolve all relative links
        // which could get broken with a data url
        var doc = parseDocumentStringOrFail(xhr.responseText, 'text/html'),
          base = doc.createElement('base'),
          blob;
        base.href = url;
        doc.head.insertBefore(base, doc.head.firstChild);
        blob = new Blob([doc.documentElement.outerHTML],
                        {type: "text/html;charset=UTF-8"});
        return readBlobAsDataURL(blob);
      })
      .push(function handleDataURL(data_url) {
        return privateDeclareIframeGadget(data_url, options, parent_gadget,
                                          old_element);
      });
  }

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget
  /////////////////////////////////////////////////////////////////
  function setGadgetInstanceHTMLContext(gadget_instance, options,
                                        parent_gadget, url,
                                        old_element, scope) {
    var i,
      queue;

    function ready_executable_wrapper(fct) {
      return function executeReadyWrapper() {
        return fct.call(gadget_instance, gadget_instance);
      };
    }

    function ready_wrapper() {
      // Always set the parent reference when all ready are finished
      // in case the gadget declaration is cancelled
      // (and ready are not finished)
      gadget_instance.element._gadget = gadget_instance;
      parent_gadget.__sub_gadget_dict[scope] = gadget_instance;
      if (document.contains(gadget_instance.element)) {
        startService(gadget_instance);
      }
      // Always return the gadget instance after ready function
      return gadget_instance;
    }

    if (gadget_instance.constructor.__ready_list.length) {
      queue = new RSVP.Queue();
      // Trigger calling of all ready callback
      for (i = 0; i < gadget_instance.constructor.__ready_list.length;
           i += 1) {
        // Put a timeout?
        queue.push(ready_executable_wrapper(
          gadget_instance.constructor.__ready_list[i]
        ));
      }
      queue.push(ready_wrapper);
      return queue;
    }
    return ready_wrapper();
  }

  RenderJSGadget
    .declareMethod('declareGadget', function declareGadget(url, options) {
      var parent_gadget = this,
        method,
        result,
        scope,
        old_element;

      if (options === undefined) {
        options = {};
      }
      if (options.sandbox === undefined) {
        options.sandbox = "public";
      }
      if (options.element === undefined) {
        options.element = document.createElement('div');
      } else if (typeof options.element === 'string') {
        options.element = document.createElement(options.element);
      } else if (options.element.parentNode) {
        old_element = options.element;
        // Clean up the element content
        // Remove all existing event listener
        options.element = old_element.cloneNode(false);
      } else {
        throw new Error('No need to manually provide a DOM element ' +
                        'without a parentNode: ' + url);
      }

      // transform url to absolute url if it is relative
      url = renderJS.getAbsoluteURL(url, this.__path);

      // Store local reference to the gadget instance
      scope = options.scope;
      if (scope === undefined) {
        scope = 'RJS_' + scope_increment;
        scope_increment += 1;
        while (parent_gadget.__sub_gadget_dict.hasOwnProperty(scope)) {
          scope = 'RJS_' + scope_increment;
          scope_increment += 1;
        }
      }
      options.element.setAttribute("data-gadget-scope", scope);

      // Put some attribute to ease page layout comprehension
      options.element.setAttribute("data-gadget-url", url);
      options.element.setAttribute("data-gadget-sandbox", options.sandbox);

      if (options.sandbox === "public") {
        method = privateDeclarePublicGadget;
      } else if (options.sandbox === "iframe") {
        method = privateDeclareIframeGadget;
      } else if (options.sandbox === "dataurl") {
        method = privateDeclareDataUrlGadget;
      } else {
        throw new Error("Unsupported sandbox options '" +
                        options.sandbox + "'");
      }
      result = method(url, options, parent_gadget, old_element);
      // Set the HTML context
      if (typeof result.then === 'function') {
        return new RSVP.Queue(result)
          .push(function setAsyncGadgetInstanceHTMLContext(gadget_instance) {
            return setGadgetInstanceHTMLContext(gadget_instance, options,
                                                parent_gadget, url,
                                                old_element, scope);
          });
      }
      return setGadgetInstanceHTMLContext(result, options,
                                          parent_gadget, url, old_element,
                                          scope);
    })
    .declareMethod('getDeclaredGadget',
      function getDeclaredGadget(gadget_scope) {
        if (!this.__sub_gadget_dict.hasOwnProperty(gadget_scope)) {
          throw new ScopeError("Gadget scope '" + gadget_scope +
                               "' is not known.");
        }
        return this.__sub_gadget_dict[gadget_scope];
      })
    .declareMethod('dropGadget', function dropGadget(gadget_scope) {
      if (!this.__sub_gadget_dict.hasOwnProperty(gadget_scope)) {
        throw new ScopeError("Gadget scope '" + gadget_scope +
                             "' is not known.");
      }
      // http://perfectionkills.com/understanding-delete/
      delete this.__sub_gadget_dict[gadget_scope];
    });

  /////////////////////////////////////////////////////////////////
  // renderJS selector
  /////////////////////////////////////////////////////////////////
  renderJS = function getLoadingGadget(selector) {
    var result;
    if (selector === window) {
      // window is the 'this' value when loading a javascript file
      // In this case, use the current loading gadget constructor
      result = gadget_loading_klass_list[0];
    }
    if (result === undefined) {
      throw new Error("Unknown selector '" + selector + "'");
    }
    return result;
  };

  /////////////////////////////////////////////////////////////////
  // renderJS.AcquisitionError
  /////////////////////////////////////////////////////////////////
  renderJS.AcquisitionError = function createAcquisitionError(message) {
    this.name = "AcquisitionError";
    if ((message !== undefined) && (typeof message !== "string")) {
      throw new TypeError('You must pass a string.');
    }
    this.message = message || "Acquisition failed";
  };
  renderJS.AcquisitionError.prototype = new Error();
  renderJS.AcquisitionError.prototype.constructor =
    renderJS.AcquisitionError;

  /////////////////////////////////////////////////////////////////
  // renderJS.getAbsoluteURL
  /////////////////////////////////////////////////////////////////
  renderJS.getAbsoluteURL = function getAbsoluteURL(url, base_url) {
    if (base_url && url) {
      return new URL(url, base_url).href;
    }
    return url;
  };

  /////////////////////////////////////////////////////////////////
  // renderJS.declareJS
  /////////////////////////////////////////////////////////////////
  renderJS.declareJS = function declareJS(url, container, pop) {
    // https://www.html5rocks.com/en/tutorials/speed/script-loading/
    // Prevent infinite recursion if loading render.js
    // more than once
    var result;
    if (javascript_registration_dict.hasOwnProperty(url)) {
      result = RSVP.resolve();
    } else {
      javascript_registration_dict[url] = null;
      result = new RSVP.Promise(
        function waitForJSLoadEvent(resolve, reject) {
          var newScript;
          newScript = document.createElement('script');
          newScript.async = false;
          newScript.type = 'text/javascript';
          newScript.onload = function triggerJSLoaded() {
            if (pop === true) {
              // Drop the current loading klass info used by selector
              gadget_loading_klass_list.shift();
            }
            resolve();
          };
          newScript.onerror = function triggerJSNotLoaded(e) {
            if (pop === true) {
              // Drop the current loading klass info used by selector
              gadget_loading_klass_list.shift();
            }
            reject(e);
          };
          newScript.src = url;
          container.appendChild(newScript);
        }
      );
    }
    return result;
  };

  /////////////////////////////////////////////////////////////////
  // renderJS.declareCSS
  /////////////////////////////////////////////////////////////////
  renderJS.declareCSS = function declareCSS(url, container) {
    // https://github.com/furf/jquery-getCSS/blob/master/jquery.getCSS.js
    // No way to cleanly check if a css has been loaded
    // So, always resolve the promise...
    // http://requirejs.org/docs/faq-advanced.html#css
    var result;
    if (stylesheet_registration_dict.hasOwnProperty(url)) {
      result = RSVP.resolve();
    } else {
      result = new RSVP.Promise(function waitForCSSLoadEvent(resolve, reject) {
        var link;
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.onload = function triggerCSSLoaded() {
          stylesheet_registration_dict[url] = null;
          resolve();
        };
        link.onerror = reject;
        container.appendChild(link);
      });
    }
    return result;
  };

  /////////////////////////////////////////////////////////////////
  // renderJS.declareGadgetKlass
  /////////////////////////////////////////////////////////////////

  function parse(xhr, url) {
    var tmp_constructor,
      key,
      parsed_html;
    // Class inheritance
    tmp_constructor = function createSuperKlass() {
      RenderJSGadget.call(this);
    };
    tmp_constructor.__ready_list = [];
    tmp_constructor.__service_list = RenderJSGadget.__service_list.slice();
    tmp_constructor.declareMethod =
      RenderJSGadget.declareMethod;
    tmp_constructor.declareJob =
      RenderJSGadget.declareJob;
    tmp_constructor.declareAcquiredMethod =
      RenderJSGadget.declareAcquiredMethod;
    tmp_constructor.allowPublicAcquisition =
      RenderJSGadget.allowPublicAcquisition;
    tmp_constructor.ready =
      RenderJSGadget.ready;
    tmp_constructor.setState =
      RenderJSGadget.setState;
    tmp_constructor.onStateChange =
      RenderJSGadget.onStateChange;
    tmp_constructor.declareService =
      RenderJSGadget.declareService;
    tmp_constructor.onEvent =
      RenderJSGadget.onEvent;
    tmp_constructor.onLoop =
      RenderJSGadget.onLoop;
    tmp_constructor.prototype = new RenderJSGadget();
    tmp_constructor.prototype.constructor = tmp_constructor;
    tmp_constructor.prototype.__path = url;
    tmp_constructor.prototype.__acquired_method_dict = {};
    // https://developer.mozilla.org/en-US/docs/HTML_in_XMLHttpRequest
    // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
    // https://developer.mozilla.org/en-US/docs/Code_snippets/HTML_to_DOM
    tmp_constructor.__template_element =
      parseDocumentStringOrFail(xhr.responseText, "text/html");
    parsed_html = renderJS.parseGadgetHTMLDocument(
      tmp_constructor.__template_element,
      url,
      true
    );
    for (key in parsed_html) {
      if (parsed_html.hasOwnProperty(key)) {
        tmp_constructor.prototype['__' + key] = parsed_html[key];
      }
    }
    // Check if there is a HTML declared subgadget
    if (tmp_constructor.__template_element
                       .querySelectorAll('[data-gadget-url]').length) {
      tmp_constructor.__ready_list.push(loadSubGadgetDOMDeclaration);
    }
    return tmp_constructor;
  }

  renderJS.declareGadgetKlass = function declareGadgetKlass(url) {
    var tmp_constructor,
      defer;

    if (gadget_model_defer_dict.hasOwnProperty(url)) {
      // Return klass object if it already exists
      if (gadget_model_defer_dict[url].hasOwnProperty('defer_list')) {
        // Klass not yet loaded.
        // Add a new defer
        defer = RSVP.defer();
        gadget_model_defer_dict[url].defer_list.push(defer);
        return defer.promise;
      }
      if (gadget_model_defer_dict[url].is_resolved) {
        return gadget_model_defer_dict[url].result;
      }
      throw gadget_model_defer_dict[url].result;
    }

    gadget_model_defer_dict[url] = {
      defer_list: []
    };

    // Fetch the HTML page and parse it
    return new RSVP.Queue()
      .push(function waitForGadgetKlassAjax() {
        return ajax(url);
      })
      .push(function handleGadgetKlassAjax(result) {
        tmp_constructor = parse(result, url);
        var fragment = document.createDocumentFragment(),
          promise_list = [],
          i,
          js_list = tmp_constructor.prototype.__required_js_list,
          css_list = tmp_constructor.prototype.__required_css_list;
        // Load JS
        if (js_list.length) {
          gadget_loading_klass_list.push(tmp_constructor);
          for (i = 0; i < js_list.length - 1; i += 1) {
            promise_list.push(renderJS.declareJS(js_list[i], fragment));
          }
          promise_list.push(renderJS.declareJS(js_list[i], fragment, true));
        }
        // Load CSS
        for (i = 0; i < css_list.length; i += 1) {
          promise_list.push(renderJS.declareCSS(css_list[i], fragment));
        }
        document.head.appendChild(fragment);
        return RSVP.all(promise_list);
      })
      .push(function handleGadgetKlassLoadingSuccess() {
        var i,
          len = gadget_model_defer_dict[url].defer_list.length;
        for (i = 0; i < len; i += 1) {
          gadget_model_defer_dict[url].defer_list[i].resolve(tmp_constructor);
        }
        delete gadget_model_defer_dict[url].defer_list;
        gadget_model_defer_dict[url].result = tmp_constructor;
        gadget_model_defer_dict[url].is_resolved = true;
        return tmp_constructor;
      })
      .push(undefined, function handleGadgetKlassLoadingError(e) {
        // Drop the current loading klass info used by selector
        // even in case of error
        var i,
          len = gadget_model_defer_dict[url].defer_list.length;
        for (i = 0; i < len; i += 1) {
          gadget_model_defer_dict[url].defer_list[i].reject(e);
        }
        delete gadget_model_defer_dict[url].defer_list;
        gadget_model_defer_dict[url].result = e;
        gadget_model_defer_dict[url].is_resolved = false;
        throw e;
      });
  };

  /////////////////////////////////////////////////////////////////
  // renderJS.clearGadgetKlassList
  /////////////////////////////////////////////////////////////////
  // For test purpose only
  renderJS.clearGadgetKlassList = function clearGadgetKlassList() {
    gadget_model_defer_dict = {};
    javascript_registration_dict = {};
    stylesheet_registration_dict = {};
  };

  /////////////////////////////////////////////////////////////////
  // renderJS.parseGadgetHTMLDocument
  /////////////////////////////////////////////////////////////////
  renderJS.parseGadgetHTMLDocument =
    function parseGadgetHTMLDocument(document_element, url,
                                     update_relative_url) {
      var settings = {
          title: "",
          interface_list: [],
          required_css_list: [],
          required_js_list: [],
          path: url
        },
        i,
        element,
        element_list,
        j,
        url_attribute_list = ['src', 'href', 'srcset'],
        url_attribute,
        base_found = false;

      if (!url || !isAbsoluteOrDataURL.test(url)) {
        throw new Error("The url should be absolute: " + url);
      }

      if (update_relative_url === undefined) {
        update_relative_url = false;
      }

      if (document_element.nodeType === 9) {
        settings.title = document_element.title;

        if (document_element.head !== null) {
          for (i = 0; i < document_element.head.children.length; i += 1) {
            element = document_element.head.children[i];
            if (element.href !== null) {
              // XXX Manage relative URL during extraction of URLs
              // element.href returns absolute URL in firefox but "" in chrome;
              if (element.rel === "stylesheet") {
                settings.required_css_list.push(
                  renderJS.getAbsoluteURL(element.getAttribute("href"),
                                          settings.path)
                );
              } else if (element.nodeName === "SCRIPT" &&
                         (element.type === "text/javascript" ||
                          !element.type)) {
                settings.required_js_list.push(
                  renderJS.getAbsoluteURL(element.getAttribute("src"),
                                          settings.path)
                );
              } else if (element.rel ===
                         "http://www.renderjs.org/rel/interface") {
                settings.interface_list.push(
                  renderJS.getAbsoluteURL(element.getAttribute("href"),
                                          settings.path)
                );
              } else if ((element.nodeName === "BASE") && !base_found &&
                         element.getAttribute("href")) {
                settings.path = renderJS.getAbsoluteURL(
                  element.getAttribute("href"),
                  settings.path
                );
                // Only use the first base element found
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base#Usage_notes
                base_found = true;
              }
            }
          }
        }

        if (update_relative_url && (document_element.body !== null)) {
          // Resolve all relativeurl configure in the dom as absolute from
          // the gadget url
          for (j = 0; j < url_attribute_list.length; j += 1) {
            url_attribute = url_attribute_list[j];
            element_list = document_element.body.querySelectorAll(
              '[' + url_attribute + ']'
            );
            for (i = 0; i < element_list.length; i += 1) {
              element = element_list[i];
              element.setAttribute(url_attribute, renderJS.getAbsoluteURL(
                element.getAttribute(url_attribute),
                settings.path
              ));
            }
          }
        }

      } else {
        throw new Error("The first parameter should be an HTMLDocument");
      }
      return settings;
    };

  /////////////////////////////////////////////////////////////////
  // global
  /////////////////////////////////////////////////////////////////
  renderJS.Mutex = Mutex;
  renderJS.ScopeError = ScopeError;
  renderJS.IframeSerializationError = IframeSerializationError;
  renderJS.loopEventListener = loopEventListener;
  renderJS.DOMParserError = DOMParserError;
  renderJS.parseDocumentStringOrFail = parseDocumentStringOrFail;
  window.rJS = window.renderJS = renderJS;
  window.__RenderJSGadget = RenderJSGadget;
  window.__RenderJSEmbeddedGadget = RenderJSEmbeddedGadget;
  window.__RenderJSIframeGadget = RenderJSIframeGadget;

  ///////////////////////////////////////////////////
  // Bootstrap process. Register the self gadget.
  ///////////////////////////////////////////////////

  // Detect when all JS dependencies have been loaded
  all_dependency_loaded_deferred = new RSVP.defer();
  // Manually initializes the self gadget if the DOMContentLoaded event
  // is triggered before everything was ready.
  // (For instance, the HTML-tag for the self gadget gets inserted after
  //  page load)
  renderJS.manualBootstrap = function manualBootstrap() {
    all_dependency_loaded_deferred.resolve();
  };
  document.addEventListener('DOMContentLoaded',
                            all_dependency_loaded_deferred.resolve, false);

  function configureMutationObserver(TmpConstructor, url, root_gadget) {
    // XXX HTML properties can only be set when the DOM is fully loaded
    var settings = renderJS.parseGadgetHTMLDocument(document, url),
      j,
      key,
      fragment = document.createDocumentFragment();
    for (key in settings) {
      if (settings.hasOwnProperty(key)) {
        TmpConstructor.prototype['__' + key] = settings[key];
      }
    }
    TmpConstructor.__template_element = document.createElement("div");
    root_gadget.element = document.body;
    root_gadget.state = {};
    for (j = 0; j < root_gadget.element.childNodes.length; j += 1) {
      fragment.appendChild(
        root_gadget.element.childNodes[j].cloneNode(true)
      );
    }
    TmpConstructor.__template_element.appendChild(fragment);
    return RSVP.all([root_gadget.getRequiredJSList(),
              root_gadget.getRequiredCSSList()])
      .then(function handleRequireDependencyList(all_list) {
        var i,
          js_list = all_list[0],
          css_list = all_list[1];
        for (i = 0; i < js_list.length; i += 1) {
          javascript_registration_dict[js_list[i]] = null;
        }
        for (i = 0; i < css_list.length; i += 1) {
          stylesheet_registration_dict[css_list[i]] = null;
        }
        gadget_loading_klass_list.shift();
      }).then(function createMutationObserver() {

        // select the target node
        var target = document.querySelector('body'),
          // create an observer instance
          observer = new MutationObserver(function observeMutatios(mutations) {
            var i, k, len, len2, node, added_list;
            mutations.forEach(function observerMutation(mutation) {
              if (mutation.type === 'childList') {

                len = mutation.removedNodes.length;
                for (i = 0; i < len; i += 1) {
                  node = mutation.removedNodes[i];
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.hasAttribute("data-gadget-url") &&
                        (node._gadget !== undefined)) {
                      deleteGadgetMonitor(node._gadget);
                    }
                    added_list =
                      node.querySelectorAll("[data-gadget-url]");
                    len2 = added_list.length;
                    for (k = 0; k < len2; k += 1) {
                      node = added_list[k];
                      if (node._gadget !== undefined) {
                        deleteGadgetMonitor(node._gadget);
                      }
                    }
                  }
                }

                len = mutation.addedNodes.length;
                for (i = 0; i < len; i += 1) {
                  node = mutation.addedNodes[i];
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.hasAttribute("data-gadget-url") &&
                        (node._gadget !== undefined)) {
                      if (document.contains(node)) {
                        startService(node._gadget);
                      }
                    }
                    added_list =
                      node.querySelectorAll("[data-gadget-url]");
                    len2 = added_list.length;
                    for (k = 0; k < len2; k += 1) {
                      node = added_list[k];
                      if (document.contains(node)) {
                        if (node._gadget !== undefined) {
                          startService(node._gadget);
                        }
                      }
                    }
                  }
                }

              }
            });
          }),
          // configuration of the observer:
          config = {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
          };

        // pass in the target node, as well as the observer options
        observer.observe(target, config);

        return root_gadget;
      });
  }

  function createLastAcquisitionGadget() {
    var last_acquisition_gadget = new RenderJSGadget();
    last_acquisition_gadget.__acquired_method_dict = {
      reportServiceError: function reportServiceError(param_list) {
        letsCrash(param_list[0]);
      }
    };
    // Stop acquisition on the last acquisition gadget
    // Do not put this on the klass, as their could be multiple instances
    last_acquisition_gadget.__aq_parent = function __aq_parent(method_name) {
      throw new renderJS.AcquisitionError(
        "No gadget provides " + method_name
      );
    };
    return last_acquisition_gadget;
  }

/*
  function notifyAllMethodToParent() {
    ;
  }
*/

  function createLoadingGadget(url) {
    var TmpConstructor,
      root_gadget,
      embedded_channel,
      notifyDeclareMethod,
      declare_method_list_waiting,
      loading_result,
      channel_defer,
      real_result_list;
      // gadget_failed = false,
      // connection_ready = false;

    // Create the gadget class for the current url
    if (gadget_model_defer_dict.hasOwnProperty(url)) {
      throw new Error("bootstrap should not be called twice");
    }

    // Create the root gadget instance and put it in the loading stack
    TmpConstructor = RenderJSEmbeddedGadget;
    TmpConstructor.__ready_list = [];
    TmpConstructor.__service_list = RenderJSGadget.__service_list.slice();
    TmpConstructor.prototype.__path = url;
    root_gadget = new TmpConstructor();
    setAqParent(root_gadget, createLastAcquisitionGadget());

    declare_method_list_waiting = [
      "getInterfaceList",
      "getRequiredCSSList",
      "getRequiredJSList",
      "getPath",
      "getTitle",
      "getMethodList"
    ];

    // Inform parent gadget about declareMethod calls here.
    notifyDeclareMethod = function notifyDeclareMethod(name) {
      declare_method_list_waiting.push(name);
    };

    real_result_list = [TmpConstructor, root_gadget, embedded_channel,
                        declare_method_list_waiting];
    if (window.self === window.top) {
      loading_result = real_result_list;
    } else {
      channel_defer = RSVP.defer();
      loading_result = RSVP.any([
        channel_defer.promise,
        new RSVP.Queue()
          .push(function waitForParentChannelCreation() {
            // Expect the channel to parent to be usable after 1 second
            // If not, consider the gadget as the root
            // Drop all iframe channel communication
            return RSVP.delay(1000);
          })
          .push(function handleParentChannelCreation() {
            real_result_list[2] = undefined;
            return real_result_list;
          })
      ]);
      // Create the communication channel
      embedded_channel = Channel.build({
        window: window.parent,
        origin: "*",
        scope: "renderJS",
        onReady: function onChannelReady() {
          var k,
            len;
          // Channel is ready, so now declare all methods
          notifyDeclareMethod = function notifyDeclareMethod(name) {
            declare_method_list_waiting.push(
              new RSVP.Promise(
                function promiseChannelDeclareMethodCall(resolve, reject) {
                  embedded_channel.call({
                    method: "declareMethod",
                    params: name,
                    success: resolve,
                    error: reject
                  });
                }
              )
            );
          };

          len = declare_method_list_waiting.length;
          for (k = 0; k < len; k += 1) {
            notifyDeclareMethod(declare_method_list_waiting[k]);
          }

          channel_defer.resolve(real_result_list);
        }
      });
      real_result_list[2] = embedded_channel;
    }

    // Surcharge declareMethod to inform parent window
    TmpConstructor.declareMethod = function declareMethod(name, callback,
                                                          options) {
      var result = RenderJSGadget.declareMethod.apply(
          this,
          [name, callback, options]
        );
      notifyDeclareMethod(name);
      return result;
    };

    TmpConstructor.declareService =
      RenderJSGadget.declareService;
    TmpConstructor.declareJob =
      RenderJSGadget.declareJob;
    TmpConstructor.onEvent =
      RenderJSGadget.onEvent;
    TmpConstructor.onLoop =
      RenderJSGadget.onLoop;
    TmpConstructor.declareAcquiredMethod =
      RenderJSGadget.declareAcquiredMethod;
    TmpConstructor.allowPublicAcquisition =
      RenderJSGadget.allowPublicAcquisition;

    TmpConstructor.prototype.__acquired_method_dict = {};
    gadget_loading_klass_list.push(TmpConstructor);

    return loading_result;
  }

  function triggerReadyList(TmpConstructor, root_gadget) {
    // XXX Probably duplicated
    var i,
      ready_queue = new RSVP.Queue();

    function ready_executable_wrapper(fct) {
      return function wrapReadyFunction() {
        return fct.call(root_gadget, root_gadget);
      };
    }
    TmpConstructor.ready(function startServiceInReady() {
      return startService(root_gadget);
    });

    for (i = 0; i < TmpConstructor.__ready_list.length; i += 1) {
      // Put a timeout?
      ready_queue
        .push(ready_executable_wrapper(TmpConstructor.__ready_list[i]));
    }
    return ready_queue;
  }

  function finishAqParentConfiguration(TmpConstructor, root_gadget,
                                       embedded_channel) {
    var local_transaction_dict = {};
    // Define __aq_parent to inform parent window
    root_gadget.__aq_parent =
      TmpConstructor.prototype.__aq_parent = function aq_parent(method_name,
                                                                argument_list,
                                                                time_out) {
        var channel_call_id;
        return new RSVP.Promise(
          function waitForChannelAcquire(resolve, reject) {
            function errorWrap(value) {
              return rejectErrorType(value, reject);
            }

            channel_call_id = embedded_channel.call({
              method: "acquire",
              params: [
                method_name,
                Array.prototype.slice.call(argument_list, 0)
              ],
              success: resolve,
              error: errorWrap,
              timeout: time_out
            });
          },
          function cancelChannelCall(msg) {
            embedded_channel.notify({
              method: "cancelAcquiredMethodCall",
              params: [
                channel_call_id,
                msg
              ]
            });
          }
        );
      };

    // bind calls to renderJS method on the instance
    embedded_channel.bind("methodCall",
                          function methodCall(trans, v, transaction_id) {
        local_transaction_dict[transaction_id] =
          root_gadget[v[0]].apply(root_gadget, v[1])
            .push(function handleMethodCallSuccess() {
            trans.complete.apply(trans, arguments);
            // drop the promise reference, to allow garbage collection
            delete local_transaction_dict[transaction_id];
          })
          .push(undefined, function handleMethodCallError(e) {
            var error_type = convertObjectToErrorType(e),
              message;
            if (e instanceof Error) {
              if (error_type !== unhandled_error_type) {
                message = e.message;
              } else {
                message = e.toString();
              }
            } else {
              message = e;
            }
            try {
              trans.error({
                type: error_type,
                msg: message
              });
            } catch (new_error) {
              trans.error({
                type: convertObjectToErrorType(new_error),
                msg: new_error.toString()
              });
            }
            // drop the promise reference, to allow garbage collection
            delete local_transaction_dict[transaction_id];
          });
        trans.delayReturn(true);
      });

    embedded_channel.bind("cancelMethodCall",
                          function cancelMethodCall(trans, v) {
        if (local_transaction_dict.hasOwnProperty(v[0])) {
          local_transaction_dict[v[0]].cancel(v[1]);
          // drop the promise reference, to allow garbage collection
          delete local_transaction_dict[v[0]];
        }
      });

  }

  function bootstrap(url) {
    // Create the loading gadget
    var wait_for_gadget_loaded = createLoadingGadget(url),
      TmpConstructor,
      root_gadget,
      embedded_channel,
      declare_method_list_waiting;

    // Wait for the loading gadget to be created
    return new RSVP.Queue(wait_for_gadget_loaded)
      .push(function handleLoadingGadget(result_list) {
        TmpConstructor = result_list[0];
        root_gadget = result_list[1];
        embedded_channel = result_list[2];
        declare_method_list_waiting = result_list[3];
        // Wait for all the gadget dependencies to be loaded
        return all_dependency_loaded_deferred.promise;
      })
      .push(function waitForDeclareMethodList() {
        // Wait for all methods to be correctly declared
        return RSVP.all(declare_method_list_waiting);
      })
      .push(function waitForMutationObserver(result_list) {
        if (embedded_channel !== undefined) {
          finishAqParentConfiguration(TmpConstructor, root_gadget,
                                      embedded_channel);
        }
        // Check all DOM modifications to correctly start/stop services
        return configureMutationObserver(TmpConstructor, url, root_gadget);
      })
      .push(function waitForReadyList() {
        clearGadgetInternalParameters(root_gadget);
        TmpConstructor.__ready_list.unshift(loadSubGadgetDOMDeclaration);
        // Trigger all ready functions
        return triggerReadyList(TmpConstructor, root_gadget);
      })
      .push(function notifyReady() {
        if (embedded_channel !== undefined) {
          embedded_channel.notify({method: "ready"});
        }
      })
      .push(undefined, function handleBootstrapError(e) {
        letsCrash(e);
        if (embedded_channel !== undefined) {
          embedded_channel.notify({method: "failed", params: e.toString()});
        }
        throw e;
      });
  }

  bootstrap(
    removeHash(window.location.href)
  );

}(document, window, RSVP, DOMParser, Channel, MutationObserver, Node,
  FileReader, Blob, navigator, Event, URL));
