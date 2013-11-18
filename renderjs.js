/*! RenderJs v0.3 */
/*global RSVP, window, document, DOMParser, Channel, XMLHttpRequest, alert */
/*jslint unparam: true, maxlen: 150 */
"use strict";

/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */
/*! @source https://gist.github.com/1129031 */
(function (DOMParser) {
  var DOMParser_proto = DOMParser.prototype,
    real_parseFromString = DOMParser_proto.parseFromString;

  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if ((new DOMParser()).parseFromString("", "text/html")) {
      // text/html parsing is natively supported
      return;
    }
  } catch (ex) {console.warn(ex); }

  DOMParser_proto.parseFromString = function (markup, type) {
    var result, doc, doc_elt, first_elt;
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      doc = document.implementation.createHTMLDocument("");
      doc_elt = doc.documentElement;

      doc_elt.innerHTML = markup;
      first_elt = doc_elt.firstElementChild;

      if (doc_elt.childElementCount === 1
          && first_elt.localName.toLowerCase() === "html") {
        doc.replaceChild(first_elt, doc_elt);
      }

      result = doc;
    } else {
      result = real_parseFromString.apply(this, arguments);
    }
    return result;
  };
}(DOMParser));

/*
 * renderJs - Generic Gadget library renderer.
 * http://www.renderjs.org/documentation
 */
(function (document, window, RSVP, DOMParser, Channel, undefined) {

  var gadget_model_dict = {},
    javascript_registration_dict = {},
    stylesheet_registration_dict = {},
    gadget_loading_klass,
    loading_gadget_promise,
    renderJS;

  function RenderJSGadget() {
    if (!(this instanceof RenderJSGadget)) {
      return new RenderJSGadget();
    }
  }
  RenderJSGadget.prototype.title = "";
  RenderJSGadget.prototype.interface_list = [];
  RenderJSGadget.prototype.path = "";
  RenderJSGadget.prototype.html = "";
  RenderJSGadget.prototype.required_css_list = [];
  RenderJSGadget.prototype.required_js_list = [];

  RenderJSGadget.ready_list = [];
  RenderJSGadget.ready = function (callback) {
    this.ready_list.push(callback);
    return this;
  };

  RenderJSGadget.declareMethod = function (name, callback) {
    this.prototype[name] = function () {
      var context = this,
        argument_list = arguments;

      return new RSVP.Queue()
        .push(function () {
          return callback.apply(context, argument_list);
        });
    };
    // Allow chain
    return this;
  };

  RenderJSGadget
    .declareMethod('getInterfaceList', function () {
      // Returns the list of gadget prototype
      return this.interface_list;
    })
    .declareMethod('getRequiredCSSList', function () {
      // Returns a list of CSS required by the gadget
      return this.required_css_list;
    })
    .declareMethod('getRequiredJSList', function () {
      // Returns a list of JS required by the gadget
      return this.required_js_list;
    })
    .declareMethod('getPath', function () {
      // Returns the path of the code of a gadget
      return this.path;
    })
    .declareMethod('getTitle', function () {
      // Returns the title of a gadget
      return this.title;
    })
    .declareMethod('getElement', function () {
      // Returns the DOM Element of a gadget
      if (this.element === undefined) {
        throw new Error("No element defined");
      }
      return this.element;
    });

  RenderJSGadget.prototype.declareGadget = function (url, options) {
    var gadget_instance,
      queue,
      previous_loading_gadget_promise = loading_gadget_promise;

    if (options === undefined) {
      options = {};
    }
    if (options.element === undefined) {
      options.element = document.createElement("div");
    }

    // Change the global variable to update the loading queue
    queue = new RSVP.Queue()
      // Wait for previous gadget loading to finish first
      .push(function () {
        return previous_loading_gadget_promise;
      })
      .push(function () {
        return renderJS.declareGadgetKlass(url);
      })
      // Get the gadget class and instanciate it
      .push(function (Klass) {
        var i,
          template_node_list = Klass.template_element.body.childNodes;
        gadget_loading_klass = Klass;
        gadget_instance = new Klass();
        gadget_instance.element = options.element;
        for (i = 0; i < template_node_list.length; i += 1) {
          gadget_instance.element.appendChild(template_node_list[i].cloneNode(true));
        }
        // Load dependencies if needed
        return RSVP.all([
          gadget_instance.getRequiredJSList(),
          gadget_instance.getRequiredCSSList()
        ]);
      })
      // Load all JS/CSS
      .push(function (all_list) {
        var parameter_list = [],
          i;
        // Load JS
        for (i = 0; i < all_list[0].length; i += 1) {
          parameter_list.push(renderJS.declareJS(all_list[0][i]));
        }
        // Load CSS
        for (i = 0; i < all_list[1].length; i += 1) {
          parameter_list.push(renderJS.declareCSS(all_list[1][i]));
        }
        return RSVP.all(parameter_list);
      })
      // Set the HTML context
      .push(function () {
        var i;
        // Drop the current loading klass info used by selector
        gadget_loading_klass = undefined;
        // Trigger calling of all ready callback
        function ready_wrapper() {
          return gadget_instance;
        }
        for (i = 0; i < gadget_instance.constructor.ready_list.length;
             i += 1) {
          // Put a timeout?
          queue.push(gadget_instance.constructor.ready_list[i]);
          // Always return the gadget instance after ready function
          queue.push(ready_wrapper);
        }
        return gadget_instance;
      })
      .push(undefined, function (e) {
        // Drop the current loading klass info used by selector
        // even in case of error
        gadget_loading_klass = undefined;
        console.warn("failed to declare " + url);
        console.warn(e);
        throw e;
      });
    loading_gadget_promise = queue;
    return loading_gadget_promise;
  };

  renderJS = function (selector) {
    var result;
    if (selector === window) {
      // window is the 'this' value when loading a javascript file
      // In this case, use the current loading gadget constructor
      result = gadget_loading_klass;
    } else if (selector instanceof RenderJSGadget) {
      result = selector;
    }
    if (result === undefined) {
      throw new Error("Unknown selector '" + selector + "'");
    }
    return result;
  };

  renderJS.declareJS = function (url) {
    // Prevent infinite recursion if loading render.js
    // more than once
    var result;
    if (javascript_registration_dict.hasOwnProperty(url)) {
      result = RSVP.resolve();
    } else {
      result = new RSVP.Promise(function (resolve, reject) {
        var newScript;
        newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.src = url;
        newScript.onload = function () {
          javascript_registration_dict[url] = null;
          resolve();
        };
        newScript.onerror = function (e) {
          reject(e);
        };
        document.head.appendChild(newScript);
      });
    }
    return result;
  };

  renderJS.declareCSS = function (url) {
    // https://github.com/furf/jquery-getCSS/blob/master/jquery.getCSS.js
    // No way to cleanly check if a css has been loaded
    // So, always resolve the promise...
    // http://requirejs.org/docs/faq-advanced.html#css
    var result;
    if (stylesheet_registration_dict.hasOwnProperty(url)) {
      result = RSVP.resolve();
    } else {
      result = new RSVP.Promise(function (resolve, reject) {
        var link;
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.onload = function () {
          stylesheet_registration_dict[url] = null;
          resolve();
        };
        link.onerror = function (e) {
          reject(e);
        };
        document.head.appendChild(link);
      });
    }
    return result;
  };

  renderJS.declareGadgetKlass = function (url) {
    var result,
      xhr;

    function parse() {
      var tmp_constructor,
        key,
        parsed_html;
      if (!gadget_model_dict.hasOwnProperty(url)) {
        // Class inheritance
        tmp_constructor = function () {
          RenderJSGadget.call(this);
        };
        tmp_constructor.ready_list = [];
        tmp_constructor.declareMethod =
          RenderJSGadget.declareMethod;
        tmp_constructor.ready =
          RenderJSGadget.ready;
        tmp_constructor.prototype = new RenderJSGadget();
        tmp_constructor.prototype.constructor = tmp_constructor;
        tmp_constructor.prototype.path = url;
        // https://developer.mozilla.org/en-US/docs/HTML_in_XMLHttpRequest
        // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
        // https://developer.mozilla.org/en-US/docs/Code_snippets/HTML_to_DOM
        tmp_constructor.template_element =
          (new DOMParser()).parseFromString(xhr.responseText, "text/html");
        parsed_html = renderJS.parseGadgetHTMLDocument(
          tmp_constructor.template_element
        );
        for (key in parsed_html) {
          if (parsed_html.hasOwnProperty(key)) {
            tmp_constructor.prototype[key] = parsed_html[key];
          }
        }

        gadget_model_dict[url] = tmp_constructor;
      }

      return gadget_model_dict[url];
    }

    function resolver(resolve, reject) {
      function handler() {
        var tmp_result;
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
              tmp_result = parse();
              resolve(tmp_result);
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

    if (gadget_model_dict.hasOwnProperty(url)) {
      // Return klass object if it already exists
      result = RSVP.resolve(gadget_model_dict[url]);
    } else {
      // Fetch the HTML page and parse it
      result = new RSVP.Promise(resolver, canceller);
    }
    return result;
  };

  // For test purpose only
  renderJS.clearGadgetKlassList = function () {
    gadget_model_dict = {};
    javascript_registration_dict = {};
    stylesheet_registration_dict = {};
  };

  renderJS.parseGadgetHTMLDocument = function (document_element) {
    var settings = {
        title: "",
        interface_list: [],
        required_css_list: [],
        required_js_list: [],
      },
      i,
      element;
    if (document_element.nodeType === 9) {
      settings.title = document_element.title;

      for (i = 0; i < document_element.head.children.length; i += 1) {
        element = document_element.head.children[i];
        if (element.href !== null) {
          // XXX Manage relative URL during extraction of URLs
          // element.href returns absolute URL in firefox but "" in chrome;
          if (element.rel === "stylesheet") {
            settings.required_css_list.push(element.getAttribute("href"));
          } else if (element.type === "text/javascript") {
            settings.required_js_list.push(element.getAttribute("src"));
          } else if (element.rel === "http://www.renderjs.org/rel/interface") {
            settings.interface_list.push(element.getAttribute("href"));
          }
        }
      }
    } else {
      throw new Error("The first parameter should be an HTMLDocument");
    }
    return settings;
  };
  window.rJS = window.renderJS = renderJS;
  window.RenderJSGadget = RenderJSGadget;

  ///////////////////////////////////////////////////
  // Bootstrap process. Register the self gadget.
  ///////////////////////////////////////////////////

  function bootstrap() {
    var url = window.location.href,
      tmp_constructor,
      root_gadget;


    // Create the gadget class for the current url
    if (gadget_model_dict.hasOwnProperty(url)) {
      throw new Error("bootstrap should not be called twice");
    }
    loading_gadget_promise = new RSVP.Promise(function (resolve, reject) {
      if (window.self === window.top) {
        // XXX Copy/Paste from declareGadgetKlass
        tmp_constructor = function () {
          RenderJSGadget.call(this);
        };
        tmp_constructor.declareMethod = RenderJSGadget.declareMethod;
        tmp_constructor.ready_list = [];
        tmp_constructor.ready = RenderJSGadget.ready;
        tmp_constructor.prototype = new RenderJSGadget();
        tmp_constructor.prototype.constructor = tmp_constructor;
        tmp_constructor.prototype.path = url;
        gadget_model_dict[url] = tmp_constructor;

        // Create the root gadget instance and put it in the loading stack
        root_gadget = new gadget_model_dict[url]();
      }

      gadget_loading_klass = tmp_constructor;

      function init() {
        // XXX HTML properties can only be set when the DOM is fully loaded
        var settings = renderJS.parseGadgetHTMLDocument(document),
          j,
          key;
        for (key in settings) {
          if (settings.hasOwnProperty(key)) {
            tmp_constructor.prototype[key] = settings[key];
          }
        }
        tmp_constructor.template_element = document.createElement("div");
        root_gadget.element = document.body;
        for (j = 0; j < root_gadget.element.childNodes.length; j += 1) {
          tmp_constructor.template_element.appendChild(
            root_gadget.element.childNodes[j].cloneNode(true)
          );
        }
        RSVP.all([root_gadget.getRequiredJSList(),
                  root_gadget.getRequiredCSSList()])
          .then(function (all_list) {
            var i,
              js_list = all_list[0],
              css_list = all_list[1],
              queue;
            for (i = 0; i < js_list.length; i += 1) {
              javascript_registration_dict[js_list[i]] = null;
            }
            for (i = 0; i < css_list.length; i += 1) {
              stylesheet_registration_dict[css_list[i]] = null;
            }
            gadget_loading_klass = undefined;
            queue = new RSVP.Queue();
            function ready_wrapper() {
              return root_gadget;
            }
            queue.push(ready_wrapper);
            for (i = 0; i < tmp_constructor.ready_list.length; i += 1) {
              // Put a timeout?
              queue.push(tmp_constructor.ready_list[i]);
              // Always return the gadget instance after ready function
              queue.push(ready_wrapper);
            }
            queue.push(resolve, function (e) {
              reject(e);
              console.warn(e);
              throw e;
            });
            return queue;
          }).fail(function (e) {
            reject(e);
          });
      }
      document.addEventListener('DOMContentLoaded', init, false);
    });

  }
  bootstrap();

}(document, window, RSVP, DOMParser, Channel));
