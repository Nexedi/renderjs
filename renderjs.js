/*! RenderJs v0.2  */
/*global $, jQuery, localStorage, jIO, window, document, DOMParser, Channel */
/*jslint evil: true, indent: 2, maxerr: 3, maxlen: 79 */
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
  } catch (ex) {}

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
(function (document, window, $, DOMParser, Channel, undefined) {

  var gadget_model_dict = {},
    javascript_registration_dict = {},
    stylesheet_registration_dict = {},
    gadget_loading_klass,
    methods,
    loading_gadget_promise,
    renderJS;

  function RenderJSGadget() {}
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
// // Register the potentially loading javascript
// var script_element = $('script').last(),
//   src = script_element.attr('src');
// if (src !== undefined) {
//   if (javascript_registration_dict[src] === undefined) {
//     // First time loading the JS file.
//     // Remember all declareMethod calls
//     javascript_registration_dict[src] = {
//       loaded: false,
//       method_list: [[name, callback]],
//     };
//     script_element.load(function () {
//       javascript_registration_dict[src].loaded = true;
//     });
//   } else if (!javascript_registration_dict[src].loaded) {
//     javascript_registration_dict[src].method_list.push([name, callback]);
//   }
// }

    this.prototype[name] = function () {
      var dfr = $.Deferred(),
        gadget = this;
      $.when(callback.apply(this, arguments))
        .done(function () {
          dfr.resolveWith(gadget, arguments);
        })
        .fail(function () {
          dfr.rejectWith(gadget, arguments);
        });
      return dfr.promise();
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
    .declareMethod('getHTML', function () {
      // Returns the HTML of a gadget
      return this.html;
    });

  // Class inheritance
  function RenderJSEmbeddedGadget() {
    RenderJSGadget.call(this);
  }
  RenderJSEmbeddedGadget.ready_list = [];
  RenderJSEmbeddedGadget.declareMethod =
    RenderJSGadget.declareMethod;
  RenderJSEmbeddedGadget.ready =
    RenderJSGadget.ready;
  RenderJSEmbeddedGadget.prototype = new RenderJSGadget();
  RenderJSEmbeddedGadget.prototype.constructor = RenderJSEmbeddedGadget;
  // XXX Declare method in same non root url gadget
  RenderJSEmbeddedGadget.declareMethod = function (name, callback) {
    RenderJSEmbeddedGadget.root_gadget.chan.notify({
      method: "declareMethod",
      params: name,
    });
    return RenderJSGadget.declareMethod.apply(this, [name, callback]);
  };

  // Class inheritance
  function RenderJSIframeGadget() {
    RenderJSGadget.call(this);
  }
  RenderJSIframeGadget.ready_list = [];
  RenderJSIframeGadget.declareMethod =
    RenderJSGadget.declareMethod;
  RenderJSIframeGadget.ready =
    RenderJSGadget.ready;
  RenderJSIframeGadget.prototype = new RenderJSGadget();
  RenderJSIframeGadget.prototype.constructor = RenderJSIframeGadget;

  RenderJSGadget.prototype.declareIframedGadget =
    function (url, jquery_context) {
      var previous_loading_gadget_promise = loading_gadget_promise,
        next_loading_gadget_deferred = $.Deferred();

      // Change the global variable to update the loading queue
      loading_gadget_promise = next_loading_gadget_deferred.promise();

      // Wait for previous gadget loading to finish first
      previous_loading_gadget_promise.always(function () {
        // Instanciate iframe
        var gadget = new RenderJSIframeGadget();
        gadget.context = jquery_context;
        // XXX Do not set this info on the instance!
        gadget.path = url;
        // XXX onload onerror
// $('iframe').load(function() {
//     RunAfterIFrameLoaded();
// });

        // Create the iframe
        if (gadget.context !== undefined) {
          $(gadget.context).html(
            // Use encodeURI to prevent XSS
            '<iframe src="' + encodeURI(url) + '"></iframe>'
          );
          gadget.chan = Channel.build({
            window: gadget.context.find('iframe').first()[0].contentWindow,
            origin: "*",
            scope: "renderJS"
          });

//           gadget.getTitle = function () {
//             var dfr = $.Deferred();
//             gadget.chan.call({
//               method: "getTitle",
//               success: function (v) {
//                 dfr.resolve(v);
//               }
//             });
//             return dfr.promise();
//           };

          gadget.chan.bind("declareMethod", function (trans, method_name) {
            console.log("Receive declaration " + method_name + " on " +
                        gadget.path);
            gadget[method_name] = function () {
              var dfr = $.Deferred();
              gadget.chan.call({
                method: "methodCall",
                params: [
                  method_name,
                  Array.prototype.slice.call(arguments, 0)],
                success: function () {
                  dfr.resolveWith(gadget, arguments);
                }
                // XXX Error callback
              });
              return dfr.promise();
            };
          });

          // Wait for the iframe to be loaded before continuing
          gadget.chan.bind("ready", function (trans) {
            console.log(gadget.path + " is ready");
            next_loading_gadget_deferred.resolve(gadget);
          });
          gadget.chan.bind("failed", function (trans) {
            next_loading_gadget_deferred.reject();
          });
        } else {
          next_loading_gadget_deferred.reject();
        }
      });

      loading_gadget_promise
        // Drop the current loading klass info used by selector
        .done(function () {
          gadget_loading_klass = undefined;
        })
        .fail(function () {
          gadget_loading_klass = undefined;
        })
        .done(function (created_gadget) {
          $.each(created_gadget.constructor.ready_list,
                 function (i, callback) {
              callback.apply(created_gadget);
            });
        });

      return loading_gadget_promise;
    };

  RenderJSGadget.prototype.declareGadget = function (url, jquery_context) {
    var previous_loading_gadget_promise = loading_gadget_promise,
      next_loading_gadget_deferred = $.Deferred();

    // Change the global variable to update the loading queue
    loading_gadget_promise = next_loading_gadget_deferred.promise();

    // Wait for previous gadget loading to finish first
    previous_loading_gadget_promise.always(function () {
      // Get the gadget class and instanciate it
      renderJS.declareGadgetKlass(url).done(function (Klass) {
        var gadget = new Klass();
        gadget.context = jquery_context;

        // Load dependencies if needed
        $.when(gadget.getRequiredJSList(), gadget.getRequiredCSSList())
          .done(function (js_list, css_list) {
            var result_list = [];
            gadget_loading_klass = Klass;
            // Load all JS and CSS
            $.each(js_list, function (i, required_url) {
              result_list.push(renderJS.declareJS(required_url));
            });
            $.each(css_list, function (i, required_url) {
              result_list.push(renderJS.declareCSS(required_url));
            });
            $.when.apply(this, result_list)
              .done(function () {
                // Dependency correctly loaded. Fire instanciation success.
                next_loading_gadget_deferred.resolve(gadget);
              }).fail(function () {
                // One error during css/js loading
                next_loading_gadget_deferred.reject();
              });

          }).fail(function () {
            // Failed to fetch dependencies information.
            next_loading_gadget_deferred.reject();
          });
      }).fail(function () {
        // Klass not correctly loaded. Reject instanciation
        next_loading_gadget_deferred.reject();
      });
    });

    loading_gadget_promise
      // Drop the current loading klass info used by selector
      .done(function () {
        gadget_loading_klass = undefined;
      })
      .fail(function () {
        gadget_loading_klass = undefined;
      })
      .done(function (created_gadget) {
        // Set the content html and call the ready list if instance is
        // correctly loaded
        if (created_gadget.context !== undefined) {
          $(created_gadget.context).html(
            created_gadget.constructor.prototype.html
          );
        }
        $.each(created_gadget.constructor.ready_list, function (i, callback) {
          callback.apply(created_gadget);
        });
      });

    return loading_gadget_promise;
  };

  methods = {
    loadGadgetFromDom: function () {
      $(this).find('[data-gadget-path]').each(function (index, value) {
        $(this).renderJS('declareGadget', $(this).attr('data-gadget-path'), {
          scope: $(this).attr('data-gadget-scope'),
        })
          .done(function (value) {
            var parsed_xml;
            // Check that context is still attached to the DOM
            // XXX Usefull?
            if ($(this).closest(document.body).length) {
              parsed_xml = $($.parseXML(value));

              // Inject the css
              // XXX Manage relative URL
              $.each(parsed_xml.find('link[rel=stylesheet]'),
                     function (i, link) {
                  $('head').append(
                    '<link rel="stylesheet" href="' +
                      $(link).attr('href') +
                      '" type="text/css" />'
                  );
                });


              // Inject the js
              // XXX Manage relative URL
              $.each(parsed_xml.find('script[type="text/javascript"]'),
                     function (i, script) {
//                   $('head').append(
//                     '<script type="text/javascript" href="' +
//                       $(script).attr('src') +
//                       '" />'
//                   );
                  // Prevent infinite recursion if loading render.js
                  // more than once
                  if ($('head').find('script[src="' + $(script).attr('src')
                                 + '"]').length === 0) {
                    var headID = document.getElementsByTagName("head")[0],
                      newScript = document.createElement('script');
                    newScript.type = 'text/javascript';
                    newScript.src = $(script).attr('src');
                    headID.appendChild(newScript);
                  }
                });

              // Inject the html
              // XXX parseXML does not support <div /> (without 2 tags)
              $(this).html(parsed_xml.find('body').clone());
              // XXX No idea why it is required to make it work
              // Probably because of parseXML
              $(this).html($(this).html())
                     .renderJS('loadGadgetFromDom');
            }
          });
      });
    },

  };

//   // Define a local copy of renderJS
//   renderJS = function (selector) {
//     // The renderJS object is actually just the init constructor 'enhanced'
//     return new renderJS.fn.init(selector, rootrenderJS);
//   };
//   renderJS.fn = renderJS.prototype = {
//     constructor: renderJS,
//     init: function (selector, rootrenderJS) {
//       var result;
//       // HANDLE: $(""), $(null), $(undefined), $(false)
//       if (!selector) {
//         console.log("no selector");
//         result = this;
// //       // HANDLE: $(DOMElement)
// //       } else if (selector.nodeType) {
// //         this.context = this[0] = selector;
// //         this.length = 1;
// //         result = this;
// //       } else if (selector === this) {
// //         result = this.constructor();
//       } else {
// //         throw new Error("Not implemented selector " + selector);
//         result = this.constructor();
//       }
//       return result;
//     },
//   };
//   // Give the init function the renderJS prototype for later instantiation
//   renderJS.fn.init.prototype = renderJS.fn;
//
//   jQuery.fn.extend({
//     attr: function (name, value) {
//       return jQuery.access(this, jQuery.attr, name, value,
//                            arguments.length > 1);
//     },
//   });

  renderJS = function (selector) {
    var result;
//     if (selector.nodeType) {
//       console.log(selector);
//     } else {
    if (selector === window) {
      // window is the this value when loading a javascript file
      // In this case, use the current loading gadget constructor
      result = gadget_loading_klass;
//     } else if ($.isFunction(selector)) {
//       console.log(selector);
    } else if (selector instanceof RenderJSGadget) {
      result = selector;
    }
    if (result === undefined) {
      console.error(selector);
      throw new Error("Unknown selector '" + selector + "'");
    }
    return result;
  };

  renderJS.declareJS = function (url) {
//     // Prevent infinite recursion if loading render.js
//     // more than once
//     if ($('head').find('script[src="' + $(script).attr('src')
//                    + '"]').length === 0) {
//       var headID = document.getElementsByTagName("head")[0],
//         newScript = document.createElement('script');
//       newScript.type = 'text/javascript';
//       newScript.src = $(script).attr('src');
//       headID.appendChild(newScript);
//     }
    var dfr,
      origin_dfr = $.Deferred(),
      head_element,
      script_element;
    if (javascript_registration_dict.hasOwnProperty(url)) {
      setTimeout(function () {
        origin_dfr.resolve();
      });
      dfr = origin_dfr.promise();
    } else {
      dfr = $.ajax({
        url: url,
        dataType: "script",
        cache: true,
      }).done(function (script, textStatus) {
        javascript_registration_dict[url] = null;
      });

    }
    return dfr;
  };

  renderJS.declareCSS = function (url) {
    // https://github.com/furf/jquery-getCSS/blob/master/jquery.getCSS.js
    // No way to cleanly check if a css has been loaded
    // So, always resolve the promise...
    // http://requirejs.org/docs/faq-advanced.html#css
    var origin_dfr = $.Deferred(),
      origin_promise = origin_dfr.promise(),
      head,
      link;
    if (stylesheet_registration_dict.hasOwnProperty(url)) {
      setTimeout(function () {
        origin_dfr.resolve();
      });
    } else {
      head = document.getElementsByTagName('head')[0];
      link = document.createElement('link');

      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;

      origin_promise.done(function () {
        stylesheet_registration_dict[url] = null;
      });

      head.appendChild(link);

      setTimeout(function () {
        origin_dfr.resolve();
      });

    }
    return origin_promise;
  };

  renderJS.declareGadgetKlass = function (url) {
    var dfr = $.Deferred(),
      parsed_html;

    if (gadget_model_dict.hasOwnProperty(url)) {
      dfr.resolve(gadget_model_dict[url]);
    } else {
      $.ajax(url)
        .done(function (value, textStatus, jqXHR) {
          var klass, tmp_constructor, key;
          if ((jqXHR.getResponseHeader("Content-Type") || "")
                === 'text/html') {

            try {
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
                parsed_html = renderJS.parseGadgetHTML(value);
                for (key in parsed_html) {
                  if (parsed_html.hasOwnProperty(key)) {
                    tmp_constructor.prototype[key] = parsed_html[key];
                  }
                }
                gadget_model_dict[url] = tmp_constructor;
              }

              dfr.resolve(gadget_model_dict[url]);
            } catch (e) {
              dfr.reject(jqXHR, "HTML Parsing failed");
            }
          } else {
            dfr.reject(jqXHR, "Unexpected content type");
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          dfr.reject(jqXHR, textStatus, errorThrown);
        });
    }
    return dfr.promise();
  };

  // For test purpose only
  renderJS.clearGadgetKlassList = function () {
    gadget_model_dict = {};
    javascript_registration_dict = {};
    stylesheet_registration_dict = {};
  };

  renderJS.parseGadgetHTML = function (html) {
    var parsed_xml,
      result,
      settings = {
        title: "",
        interface_list: [],
        html: "",
        required_css_list: [],
        required_js_list: [],
      };
    if (html.constructor === String) {

      // https://developer.mozilla.org/en-US/docs/HTML_in_XMLHttpRequest
      // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
      // https://developer.mozilla.org/en-US/docs/Code_snippets/HTML_to_DOM
      // parsed_xml = $($.parseXML(html));
      // parsed_xml = $('<div/>').html(html);
      parsed_xml = $((new DOMParser()).parseFromString(html, "text/html"));
      settings.title = parsed_xml.find('head > title').first().text();

      // XXX Manage relative URL during extraction of URLs
      $.each(parsed_xml.find('head > link[rel=stylesheet]'),
             function (i, link) {
          settings.required_css_list.push($(link).attr('href'));
        });

      $.each(parsed_xml.find('head > script[type="text/javascript"]'),
             function (i, script) {
          settings.required_js_list.push($(script).attr('src'));
        });

      $.each(parsed_xml.find(
        'head > link[rel="http://www.renderjs.org/rel/interface"]'
      ), function (i, link) {
        settings.interface_list.push($(link).attr('href'));
      });

      settings.html = parsed_xml.find('html > body').first().html();
      if (settings.html === undefined) {
        settings.html = "";
      }
      result = settings;
    } else {
      throw new Error(html + " is not a string");
    }
    return result;
  };
  window.rJS = window.renderJS = renderJS;
  window.RenderJSGadget = RenderJSGadget;

  ///////////////////////////////////////////////////
  // Bootstrap process. Register the self gadget.
  ///////////////////////////////////////////////////

  function bootstrap() {
    var url = window.location.href,
      tmp_constructor,
      root_gadget,
      loading_gadget_deferred = $.Deferred();

    // Create the gadget class for the current url
    if (gadget_model_dict.hasOwnProperty(url)) {
      throw new Error("bootstrap should not be called twice");
    }
    loading_gadget_promise = loading_gadget_deferred.promise();

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
    } else {
      // Create the root gadget instance and put it in the loading stack
      tmp_constructor = RenderJSEmbeddedGadget;
      root_gadget = new RenderJSEmbeddedGadget();
      RenderJSEmbeddedGadget.root_gadget = root_gadget;

      // Create the communication channel
      root_gadget.chan = Channel.build({
        window: window.parent,
        origin: "*",
        scope: "renderJS"
      });

      root_gadget.chan.bind("methodCall", function (trans, v) {
        root_gadget[v[0]].apply(root_gadget, v[1]).done(function (g) {
          trans.complete(g);
        });
        trans.delayReturn(true);
      });
      root_gadget.chan.notify({
        method: "declareMethod",
        params: "getInterfaceList",
      });
      root_gadget.chan.notify({
        method: "declareMethod",
        params: "getRequiredCSSList",
      });
      root_gadget.chan.notify({
        method: "declareMethod",
        params: "getRequiredJSList",
      });
      root_gadget.chan.notify({
        method: "declareMethod",
        params: "getPath",
      });
      root_gadget.chan.notify({
        method: "declareMethod",
        params: "getTitle",
      });
      root_gadget.chan.notify({
        method: "declareMethod",
        params: "getHTML",
      });

      // Surcharge declareMethod to inform parent window
      // XXX TODO

      // Inform parent window that gadget is correctly loaded
      loading_gadget_promise.done(function () {
        // XXX Wait for all previous declaration before ending ready message
        setTimeout(function () {
          root_gadget.chan.notify({method: "ready"});
        }, 100);
      }).fail(function () {
        root_gadget.chan.notify({method: "failed"});
      });
    }
    gadget_loading_klass = tmp_constructor;




    $(document).ready(function () {
      // XXX HTML properties can only be set when the DOM is fully loaded
      var settings = renderJS.parseGadgetHTML($('html')[0].outerHTML),
        promise,
        key;
      for (key in settings) {
        if (settings.hasOwnProperty(key)) {
          tmp_constructor.prototype[key] = settings[key];
        }
      }
      root_gadget.context = $('body');
      promise = $.when(root_gadget.getRequiredJSList(),
                       root_gadget.getRequiredCSSList())
        .done(function (js_list, css_list) {
          $.each(js_list, function (i, required_url) {
            javascript_registration_dict[required_url] = null;
          });
          $.each(css_list, function (i, required_url) {
            stylesheet_registration_dict[url] = null;
          });
          $.each(tmp_constructor.ready_list, function (i, callback) {
            callback.apply(root_gadget);
          });
          gadget_loading_klass = undefined;
          loading_gadget_deferred.resolve();
        }).fail(function () {
          loading_gadget_deferred.reject();
        });
    });
  }
  bootstrap();

}(document, window, jQuery, DOMParser, Channel));


///**
//* By default RenderJs will render all gadgets when page is loaded
//* still it's possible to override this and use explicit gadget rendering.
//*
//* @property RENDERJS_ENABLE_IMPLICIT_GADGET_RENDERING
//* @type {Boolean}
//* @default "true"
//*/
//var RENDERJS_ENABLE_IMPLICIT_GADGET_RENDERING = true;
//
//
///**
//* By default RenderJs will examine and bind all interaction gadgets
//* available.
//*
//* @property RENDERJS_ENABLE_IMPLICIT_INTERACTION_BIND
//* @type {Boolean}
//* @default "true"
//*/
//var RENDERJS_ENABLE_IMPLICIT_INTERACTION_BIND = true;
//
///**
//* By default RenderJs will examine and create all routes
//*
//* @property RENDERJS_ENABLE_IMPLICIT_ROUTE_CREATE
//* @type {Boolean}
//* @default "true"
//*/
//var RENDERJS_ENABLE_IMPLICIT_ROUTE_CREATE = true;
//
///**
//Provides the base RenderJs class
//
//@module RenderJs
//**/
//var RenderJs = (function () {
//    // a variable indicating if current gadget loading is over or not
//    var is_ready = false, current_gadget;
//
//    function setSelfGadget(gadget) {
//      /*
//       * Only used internally to set current gadget being executed.
//       */
//      current_gadget = gadget;
//    }
//
//    return {
//
//      init: function () {
//        /*
//         * Do all initialization
//         */
//        if (RENDERJS_ENABLE_IMPLICIT_GADGET_RENDERING) {
//          RenderJs.bootstrap($('body'));
//        }
//        var root_gadget = RenderJs.GadgetIndex.getRootGadget();
//        if (RENDERJS_ENABLE_IMPLICIT_INTERACTION_BIND ||
//            RENDERJS_ENABLE_IMPLICIT_ROUTE_CREATE) {
//          // We might have a page without gadgets.
//          // Be careful, right now we can be in this case because
//          // asynchronous gadget loading is not finished
//          if (root_gadget !== undefined) {
//            RenderJs.bindReady(
//              function () {
//                if (RENDERJS_ENABLE_IMPLICIT_INTERACTION_BIND) {
//                  // examine all Intaction Gadgets and bind accordingly
//                  RenderJs.InteractionGadget.init();
//                }
//                if (RENDERJS_ENABLE_IMPLICIT_ROUTE_CREATE) {
//                  // create all routes between gadgets
//                  RenderJs.RouteGadget.init();
//                }
//              }
//            );
//          }
//        }
//      },
//
//      bootstrap: function (root) {
//        /*
//         * Load all gadgets for this DOM element
//         * (including recursively contained ones)
//         */
//        var gadget_id, is_gadget;
//        gadget_id = root.attr("id");
//        is_gadget = root.attr("data-gadget") !== undefined;
//        // this will make RenderJs fire "ready" event when all
//        // gadgets are loaded.
//        RenderJs.setReady(false);
//        if (is_gadget && gadget_id !== undefined) {
//          // bootstart root gadget only if it is indeed a gadget
//          RenderJs.loadGadget(root);
//        }
//        RenderJs.loadRecursiveGadget(root);
//      },
//
//      loadRecursiveGadget: function (root) {
//        /*
//         * Load all contained gadgets inside passed DOM element.
//         */
//        var gadget_list, gadget, gadget_id, gadget_js;
//        gadget_list = root.find("[data-gadget]");
//
//        // register all gadget in advance so checkAndTriggerReady
//        // can have accurate information for list of all gadgets
//        gadget_list.each(function () {
//          gadget = $(this);
//          gadget_id = gadget.attr("id");
//          gadget_js = new RenderJs.Gadget(gadget_id, gadget);
//          RenderJs.GadgetIndex.registerGadget(gadget_js);
//        });
//
//        // Load chilren
//        gadget_list.each(function () {
//          RenderJs.loadGadget($(this));
//        });
//      },
//
//      setGadgetAndRecurse: function (gadget, data) {
//        /*
//         * Set gadget data and recursively load it in case it holds another
//         * gadgets.
//         */
//        // set current gadget as being loaded so gadget instance itself
//        // knows which gadget it is
//        setSelfGadget(RenderJs.GadgetIndex.getGadgetById(gadget.attr("id")));
//        gadget.append(data);
//        // reset as no longer current gadget
//        setSelfGadget(undefined);
//        // a gadget may contain sub gadgets
//        RenderJs.loadRecursiveGadget(gadget);
//      },
//
//      getSelfGadget: function () {
//        /*
//         * Get current gadget being loaded
//         * This function must be used with care as it relies on
//         * Javascript nature of being a single threaded application.
//         * Currently current gadget is set in a global RenderJs variable
//         * before its HTML is inserted into DOM and if multiple threads
//         * were running (which is not the case currently)
//         * this could lead to reace conditions and unreliable getSelfGadget
//         * results.
//         * Additionally this function is available only at gadget's script
//         * load time - i.e. it can't be used in after that calls.
//         * In this case gagdget can save this value internally.
//         */
//        return current_gadget;
//      },
//
//      loadGadget: function (gadget) {
//        /*
//         * Load gadget's SPECs from URL
//         */
//        var url, gadget_id, gadget_property, cacheable, cache_id,
//          i, gadget_index, gadget_index_id,
//          app_cache, data, gadget_js, is_update_gadget_data_running;
//
//        url = gadget.attr("data-gadget");
//        gadget_id = gadget.attr("id");
//        gadget_js = RenderJs.GadgetIndex.getGadgetById(gadget_id);
//        gadget_index = RenderJs.GadgetIndex.getGadgetList();
//
//        if (gadget_js === undefined) {
//          // register gadget in javascript namespace
//          //if not already registered
//          gadget_js = new RenderJs.Gadget(gadget_id, gadget);
//          RenderJs.GadgetIndex.registerGadget(gadget_js);
//        }
//        if (gadget_js.isReady()) {
//          // avoid loading again gadget which was loaded before in same page
//          return;
//        }
//
//        // update Gadget's instance with contents of "data-gadget-property"
//        gadget_property = gadget.attr("data-gadget-property");
//        if (gadget_property !== undefined) {
//          gadget_property = $.parseJSON(gadget_property);
//          $.each(gadget_property, function (key, value) {
//            gadget_js[key] = value;
//          });
//        }
//
//        if (url !== undefined && url !== "") {
//          cacheable = gadget.attr("data-gadget-cacheable");
//          cache_id = gadget.attr("data-gadget-cache-id");
//          if (cacheable !== undefined && cache_id !== undefined) {
//            cacheable = Boolean(parseInt(cacheable, 10));
//          }
//          //cacheable = false ; // to develop faster
//          if (cacheable) {
//            // get from cache if possible, use last part from URL as
//            // cache_key
//            app_cache = RenderJs.Cache.get(cache_id, undefined);
//            if (app_cache === undefined || app_cache === null) {
//              // not in cache so we pull from network and cache
//              $.ajax({
//                url: url,
//                yourCustomData: {
//                  "gadget_id": gadget_id,
//                  "cache_id": cache_id
//                },
//                success: function (data) {
//                  cache_id = this.yourCustomData.cache_id;
//                  gadget_id = this.yourCustomData.gadget_id;
//                  RenderJs.Cache.set(cache_id, data);
//                  RenderJs.GadgetIndex.getGadgetById(gadget_id).
//                      setReady();
//                  RenderJs.setGadgetAndRecurse(gadget, data);
//                  RenderJs.checkAndTriggerReady();
//                  RenderJs.updateGadgetData(gadget);
//                }
//              });
//            } else {
//              // get from cache
//              data = app_cache;
//              gadget_js.setReady();
//              this.setGadgetAndRecurse(gadget, data);
//              this.checkAndTriggerReady();
//              RenderJs.updateGadgetData(gadget);
//            }
//          } else {
//            // not to be cached
//            $.ajax({
//              url: url,
//              yourCustomData: {"gadget_id": gadget_id},
//              success: function (data) {
//                gadget_id = this.yourCustomData.gadget_id;
//                RenderJs.GadgetIndex.getGadgetById(gadget_id).
//                    setReady();
//                RenderJs.setGadgetAndRecurse(gadget, data);
//                RenderJs.checkAndTriggerReady();
//                RenderJs.updateGadgetData(gadget);
//              }
//            });
//          }
//        } else {
//          // gadget is an inline (InteractorGadget or one using
//          // data-gadget-source / data-gadget-handler) so no need
//          // to load it from network
//          is_update_gadget_data_running = RenderJs.updateGadgetData(gadget);
//          if (!is_update_gadget_data_running) {
//            // no update is running so gadget is basically ready
//            // if update is running then it should take care and set status
//            gadget_js.setReady();
//          }
//          RenderJs.checkAndTriggerReady();
//        }
//      },
//
//      isReady: function () {
//        /*
//         * Get rendering status
//         */
//        return is_ready;
//      },
//
//      setReady: function (value) {
//        /*
//         * Update rendering status
//         */
//        is_ready = value;
//      },
//
//      bindReady: function (ready_function) {
//        /*
//         * Bind a function on ready gadget loading.
//         */
//        $("body").one("ready", ready_function);
//      },
//
//      checkAndTriggerReady: function () {
//        /*
//         * Trigger "ready" event only if all gadgets were marked as "ready"
//         */
//        var is_gadget_list_loaded;
//        is_gadget_list_loaded = RenderJs.GadgetIndex.isGadgetListLoaded();
//        if (is_gadget_list_loaded) {
//          if (!RenderJs.isReady()) {
//            // backwards compatability with already written code
//            RenderJs.GadgetIndex.getRootGadget().getDom().
//                trigger("ready");
//            // trigger ready on root body element
//            $("body").trigger("ready");
//            // this set will make sure we fire this event only once
//            RenderJs.setReady(true);
//          }
//        }
//        return is_gadget_list_loaded;
//      },
//
//      updateGadgetData: function (gadget) {
//        /*
//         * Gadget can be updated from "data-gadget-source" (i.e. a json)
//         * and "data-gadget-handler" attributes (i.e. a namespace Javascript)
//         */
//        var data_source, data_handler;
//        data_source = gadget.attr("data-gadget-source");
//        data_handler = gadget.attr("data-gadget-handler");
//        // acquire data and pass it to method handler
//        if (data_source !== undefined && data_source !== "") {
//          $.ajax({
//            url: data_source,
//            dataType: "json",
//            yourCustomData: {"data_handler": data_handler,
//                             "gadget_id": gadget.attr("id")},
//            success: function (result) {
//              var data_handler, gadget_id;
//              data_handler = this.yourCustomData.data_handler;
//              gadget_id = this.yourCustomData.gadget_id;
//              if (data_handler !== undefined) {
//                // eval is not nice to use
//                eval(data_handler + "(result)");
//                gadget = RenderJs.GadgetIndex.getGadgetById(gadget_id);
//                // mark gadget as loaded and fire a check
//                // to see if all gadgets are loaded
//                gadget.setReady();
//                RenderJs.checkAndTriggerReady();
//              }
//            }
//          });
//          // asynchronous update happens and respective thread will update
//          // status
//          return true;
//        }
//        return false;
//      },
//
//      addGadget: function (dom_id, gadget_id, gadget, gadget_data_handler,
//                          gadget_data_source, bootstrap) {
//        /*
//         * add new gadget and render it
//         */
//        var html_string, tab_container, tab_gadget;
//        tab_container = $('#' + dom_id);
//        tab_container.empty();
//        html_string = [
//          '<div  id="' + gadget_id + '"',
//          'data-gadget="' + gadget + '"',
//          'data-gadget-handler="' + gadget_data_handler + '" ',
//          'data-gadget-source="' + gadget_data_source + '"></div>'
//        ].join('\n');
//
//        tab_container.append(html_string);
//        tab_gadget = tab_container.find('#' + gadget_id);
//
//        // render new gadget
//        if (bootstrap !== false) {
//          RenderJs.bootstrap(tab_container);
//        }
//
//        return tab_gadget;
//      },
//
//      Cache: (function () {
//        /*
//         * Generic cache implementation that can fall back to local
//         * namespace storage if no "modern" storage like localStorage
//         * is available
//         */
//        return {
//          ROOT_CACHE_ID: 'APP_CACHE',
//
//          getCacheId: function (cache_id) {
//            /*
//             * We should have a way to 'purge' localStorage by setting a
//             * ROOT_CACHE_ID in all browser instances
//             */
//            return this.ROOT_CACHE_ID + cache_id;
//          },
//
//          hasLocalStorage: function () {
//            /*
//             * Feature test if localStorage is supported
//             */
//            var mod;
//            mod = 'localstorage_test_12345678';
//            try {
//              localStorage.setItem(mod, mod);
//              localStorage.removeItem(mod);
//              return true;
//            } catch (e) {
//              return false;
//            }
//          },
//
//          get: function (cache_id, default_value) {
//            /* Get cache key value */
//            cache_id = this.getCacheId(cache_id);
//            if (this.hasLocalStorage()) {
//              return this.LocalStorageCachePlugin.
//                get(cache_id, default_value);
//            }
//            //fallback to javscript namespace cache
//            return this.NameSpaceStorageCachePlugin.
//                get(cache_id, default_value);
//          },
//
//          set: function (cache_id, data) {
//            /* Set cache key value */
//            cache_id = this.getCacheId(cache_id);
//            if (this.hasLocalStorage()) {
//              this.LocalStorageCachePlugin.set(cache_id, data);
//            } else {
//              this.NameSpaceStorageCachePlugin.set(cache_id, data);
//            }
//          },
//
//          LocalStorageCachePlugin: (function () {
//            /*
//             * This plugin saves using HTML5 localStorage.
//             */
//            return {
//              get: function (cache_id, default_value) {
//                /* Get cache key value */
//                if (localStorage.getItem(cache_id) !== null) {
//                  return JSON.parse(localStorage.getItem(cache_id));
//                }
//                return default_value;
//              },
//
//              set: function (cache_id, data) {
//                /* Set cache key value */
//                localStorage.setItem(cache_id, JSON.stringify(data));
//              }
//            };
//          }()),
//
//          NameSpaceStorageCachePlugin: (function () {
//            /*
//             * This plugin saves within current page namespace.
//             */
//            var namespace = {};
//
//            return {
//              get: function (cache_id, default_value) {
//                /* Get cache key value */
//                return namespace[cache_id];
//              },
//
//              set: function (cache_id, data) {
//                /* Set cache key value */
//                namespace[cache_id] = data;
//              }
//            };
//          }())
//        };
//      }()),
//
//      Gadget: function (gadget_id, dom) {
//        /*
//         * Javascript Gadget representation
//         */
//        this.id = gadget_id;
//        this.dom = dom;
//        this.is_ready = false;
//      },
//
//      TabbularGadget: (function () {
//        /*
//         * Generic tabular gadget
//         */
//        var gadget_list = [];
//        return {
//          toggleVisibility: function (visible_dom) {
//            /*
//             * Set tab as active visually and mark as not active rest.
//             */
//            $(".selected").addClass("not_selected");
//            $(".selected").removeClass("selected");
//            visible_dom.addClass("selected");
//            visible_dom.removeClass("not_selected");
//          },
//
//          addNewTabGadget: function (dom_id, gadget_id, gadget,
//                                     gadget_data_handler,
//                                    gadget_data_source, bootstrap) {
//            /*
//             * add new gadget and render it
//             */
//            var tab_gadget;
//            tab_gadget = RenderJs.addGadget(
//              dom_id,
//              gadget_id,
//              gadget,
//              gadget_data_handler,
//              gadget_data_source,
//              bootstrap
//            );
//
//            // we should unregister all gadgets part of this TabbularGadget
//            $.each(gadget_list,
//                 function (index, gadget_id) {
//                var gadget = RenderJs.GadgetIndex.getGadgetById(gadget_id);
//                gadget.remove();
//                // update list of root gadgets inside TabbularGadget
//                gadget_list.splice($.inArray(gadget_id, gadget_list), 1);
//              }
//              );
//            // add it as root gadget
//            gadget_list.push(tab_gadget.attr("id"));
//          }
//        };
//      }()),
//
//      GadgetIndex: (function () {
//        /*
//         * Generic gadget index placeholder
//         */
//        var gadget_list = [];
//
//        return {
//
//          getGadgetIdListFromDom: function (dom) {
//            /*
//             * Get list of all gadget's ID from DOM
//             */
//            var gadget_id_list = [];
//            $.each(dom.find('[data-gadget]'),
//                 function (index, value) {
//                gadget_id_list.push($(value).attr("id"));
//              }
//              );
//            return gadget_id_list;
//          },
//
//          setGadgetList: function (gadget_list_value) {
//            /*
//             * Set list of registered gadgets
//             */
//            gadget_list = gadget_list_value;
//          },
//
//          getGadgetList: function () {
//            /*
//             * Return list of registered gadgets
//             */
//            return gadget_list;
//          },
//
//          registerGadget: function (gadget) {
//            /*
//             * Register gadget
//             */
//            if (RenderJs.GadgetIndex.getGadgetById(gadget.id) ===
//                                                       undefined) {
//              // register only if not already added
//              gadget_list.push(gadget);
//            }
//          },
//
//          unregisterGadget: function (gadget) {
//            /*
//             * Unregister gadget
//             */
//            var index = $.inArray(gadget, gadget_list);
//            if (index !== -1) {
//              gadget_list.splice(index, 1);
//            }
//          },
//
//          getGadgetById: function (gadget_id) {
//            /*
//             * Get gadget javascript representation by its Id
//             */
//            var gadget;
//            gadget = undefined;
//            $(RenderJs.GadgetIndex.getGadgetList()).each(
//              function (index, value) {
//                if (value.getId() === gadget_id) {
//                  gadget = value;
//                }
//              }
//            );
//            return gadget;
//          },
//
//          getRootGadget: function () {
//            /*
//             * Return root gadget (always first one in list)
//             */
//            return this.getGadgetList()[0];
//          },
//
//          isGadgetListLoaded: function () {
//            /*
//             * Return True if all gadgets were loaded from network or
//             * cache
//             */
//            var result;
//            result = true;
//            $(this.getGadgetList()).each(
//              function (index, value) {
//                if (value.isReady() === false) {
//                  result = false;
//                }
//              }
//            );
//            return result;
//          }
//        };
//      }()),
//
//      GadgetCatalog : (function () {
//        /*
//         * Gadget catalog provides API to get
//         * list of gadgets from a repository
//         */
//        var cache_id = "setGadgetIndexUrlList";
//
//        function updateGadgetIndexFromURL(url) {
//          // split to base and document url
//          var url_list = url.split('/'),
//            document_url = url_list[url_list.length - 1],
//            d = url_list.splice($.inArray(document_url, url_list), 1),
//            base_url = url_list.join('/'),
//            web_dav = jIO.newJio({
//              "type": "dav",
//              "username": "",
//              "password": "",
//              "url": base_url
//            });
//          web_dav.get(document_url,
//                function (err, response) {
//              RenderJs.Cache.set(url, response);
//            });
//        }
//
//        return {
//          updateGadgetIndex: function () {
//            /*
//             * Update gadget index from all configured remote repositories.
//             */
//            $.each(RenderJs.GadgetCatalog.getGadgetIndexUrlList(),
//                 function (index, value) {
//                updateGadgetIndexFromURL(value);
//              });
//          },
//
//          setGadgetIndexUrlList: function (url_list) {
//            /*
//             * Set list of Gadget Index repositories.
//             */
//            // store in Cache (html5 storage)
//            RenderJs.Cache.set(cache_id, url_list);
//          },
//
//          getGadgetIndexUrlList: function () {
//            /*
//             * Get list of Gadget Index repositories.
//             */
//            // get from Cache (html5 storage)
//            return RenderJs.Cache.get(cache_id, undefined);
//          },
//
//          getGadgetListThatProvide: function (service) {
//            /*
//             * Return list of all gadgets that providen a given service.
//             * Read this list from data structure created in HTML5 local
//             * storage by updateGadgetIndexFromURL
//             */
//            // get from Cache stored index and itterate over it
//            // to find matching ones
//            var gadget_list = [];
//            $.each(RenderJs.GadgetCatalog.getGadgetIndexUrlList(),
//                 function (index, url) {
//                // get repos from cache
//                var cached_repo = RenderJs.Cache.get(url);
//                $.each(cached_repo.gadget_list,
//                    function (index, gadget) {
//                    if ($.inArray(service, gadget.service_list) > -1) {
//                      // gadget provides a service, add to list
//                      gadget_list.push(gadget);
//                    }
//                  }
//                    );
//              });
//            return gadget_list;
//          },
//
//          registerServiceList: function (gadget, service_list) {
//          /*
//           * Register a service provided by a gadget.
//           */
//          }
//        };
//      }()),
//
//      InteractionGadget : (function () {
//        /*
//         * Basic gadget interaction gadget implementation.
//         */
//        return {
//
//          init: function (force) {
//            /*
//            * Inspect DOM and initialize this gadget
//            */
//            var dom_list, gadget_id;
//            if (force === 1) {
//              // we explicitly want to re-init elements even if already this
//              // is done before
//              dom_list = $("div[data-gadget-connection]");
//            } else {
//              // XXX: improve and save 'bound' on javascript representation
//              // of a gadget not DOM
//              dom_list = $("div[data-gadget-connection]")
//                     .filter(function () {
//                  return $(this).data("bound") !== true;
//                })
//                     .data('bound', true);
//            }
//            dom_list.each(function (index, element) {
//              RenderJs.InteractionGadget.bind($(element));
//            });
//          },
//
//          bind: function (gadget_dom) {
//            /*
//             * Bind event between gadgets.
//             */
//            var gadget_id, gadget_connection_list,
//              createMethodInteraction = function (
//                original_source_method_id,
//                source_gadget_id,
//                source_method_id,
//                destination_gadget_id,
//                destination_method_id
//              ) {
//                var interaction = function () {
//                  // execute source method
//                  RenderJs.GadgetIndex.getGadgetById(
//                    source_gadget_id
//                  )[original_source_method_id].
//                    apply(null, arguments);
//                  // call trigger so bind can be asynchronously called
//                  RenderJs.GadgetIndex.getGadgetById(
//                    destination_gadget_id
//                  ).dom.trigger(source_method_id);
//                };
//                return interaction;
//              },
//              createTriggerInteraction = function (
//                destination_gadget_id,
//                destination_method_id
//              ) {
//                var interaction = function () {
//                  RenderJs.GadgetIndex.getGadgetById(
//                    destination_gadget_id
//                  )[destination_method_id].
//                    apply(null, arguments);
//                };
//                return interaction;
//              };
//            gadget_id = gadget_dom.attr("id");
//            gadget_connection_list =
//                               gadget_dom.attr("data-gadget-connection");
//            gadget_connection_list = $.parseJSON(gadget_connection_list);
//            $.each(gadget_connection_list, function (key, value) {
//              var source,
//                source_gadget_id,
//                source_method_id,
//                source_gadget,
//                destination,
//                destination_gadget_id,
//                destination_method_id,
//                destination_gadget,
//                original_source_method_id;
//              source = value.source.split(".");
//              source_gadget_id = source[0];
//              source_method_id = source[1];
//              source_gadget = RenderJs.GadgetIndex.
//                getGadgetById(source_gadget_id);
//
//              destination = value.destination.split(".");
//              destination_gadget_id = destination[0];
//              destination_method_id = destination[1];
//              destination_gadget = RenderJs.GadgetIndex.
//                getGadgetById(destination_gadget_id);
//
//              if (source_gadget.hasOwnProperty(source_method_id)) {
//                // direct javascript use case
//                original_source_method_id = "original_" +
//                  source_method_id;
//                source_gadget[original_source_method_id] =
//                  source_gadget[source_method_id];
//                source_gadget[source_method_id] =
//                  createMethodInteraction(
//                    original_source_method_id,
//                    source_gadget_id,
//                    source_method_id,
//                    destination_gadget_id,
//                    destination_method_id
//                  );
//                // we use html custom events for asyncronous method call so
//                // bind destination_gadget to respective event
//                destination_gadget.dom.bind(
//                  source_method_id,
//                  createTriggerInteraction(
//                    destination_gadget_id,
//                    destination_method_id
//                  )
//                );
//              } else {
//                // this is a custom event attached to HTML gadget
//                // representation
//                source_gadget.dom.bind(
//                  source_method_id,
//                  createTriggerInteraction(
//                    destination_gadget_id,
//                    destination_method_id
//                  )
//                );
//              }
//            });
//          }
//        };
//      }()),
//
//      RouteGadget : (function () {
//        /*
//         * A gadget that defines possible routes (i.e. URL changes)
//         * between gadgets.
//         */
//        var route_list = [];
//        return {
//
//          init: function () {
//            /*
//             * Inspect DOM and initialize this gadget
//             */
//            $("div[data-gadget-route]").each(function (index, element) {
//              RenderJs.RouteGadget.route($(element));
//            });
//          },
//
//          route: function (gadget_dom) {
//            /*
//             * Create routes between gadgets.
//             */
//            var body = $("body"),
//              handler_func,
//              priority,
//              gadget_route_list = gadget_dom.attr("data-gadget-route");
//            gadget_route_list = $.parseJSON(gadget_route_list);
//            $.each(gadget_route_list, function (key, gadget_route) {
//              handler_func = function () {
//                var gadget_id = gadget_route.destination.split('.')[0],
//                  method_id = gadget_route.destination.split('.')[1],
//                  gadget = RenderJs.GadgetIndex.getGadgetById(gadget_id);
//                // set gadget value so getSelfGadget can work
//                setSelfGadget(gadget);
//                gadget[method_id].apply(null, arguments);
//                // reset as no longer needed
//                setSelfGadget(undefined);
//              };
//              // add route itself
//              priority = gadget_route.priority;
//              if (priority === undefined) {
//                // default is 1 -i.e.first level
//                priority = 1;
//              }
//              RenderJs.RouteGadget.add(gadget_route.source,
//                                       handler_func, priority);
//            });
//          },
//
//          add: function (path, handler_func, priority) {
//            /*
//             * Add a route between path (hashable) and a handler function
//             * (part of Gadget's API).
//             */
//            var body = $("body");
//            body
//              .route("add", path, 1)
//              .done(handler_func);
//            // save locally
//            route_list.push({"path": path,
//                     "handler_func": handler_func,
//                     "priority": priority});
//          },
//
//          go: function (path, handler_func, priority) {
//            /*
//             * Go a route.
//             */
//            var body = $("body");
//            body
//              .route("go", path, priority)
//              .fail(handler_func);
//          },
//
//          remove: function (path) {
//            /*
//             * Remove a route.
//             */
//
//            // XXX: implement remove a route when route.js supports it
//          },
//
//          getRouteList: function () {
//            /*
//             * Get list of all router
//             */
//            return route_list;
//          }
//        };
//      }())
//    };
//  }());
//
//// Define Gadget prototype
//RenderJs.Gadget.prototype.getId = function () {
//  return this.id;
//};
//
//RenderJs.Gadget.prototype.getDom = function () {
//  return this.dom;
//};
//
//RenderJs.Gadget.prototype.isReady = function () {
//  /*
//  * Return True if remote gadget is loaded into DOM.
//  */
//  return this.is_ready;
//};
//
//RenderJs.Gadget.prototype.setReady = function () {
//  /*
//  * Return True if remote gadget is loaded into DOM.
//  */
//  this.is_ready = true;
//};
//
//RenderJs.Gadget.prototype.remove = function () {
//  /*
//  * Remove gadget (including its DOM element).
//  */
//  var gadget;
//  // unregister root from GadgetIndex
//  RenderJs.GadgetIndex.unregisterGadget(this);
//  // gadget might contain sub gadgets so before remove entire
//  // DOM we must unregister them from GadgetIndex
//  this.getDom().find("[data-gadget]").each(function () {
//    gadget = RenderJs.GadgetIndex.getGadgetById($(this).attr("id"));
//    RenderJs.GadgetIndex.unregisterGadget(gadget);
//  });
//  // remove root's entire DOM element
//  $(this.getDom()).remove();
//};
