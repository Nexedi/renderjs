// TODOS:
// -> remove wrapping elements on hardcoded gadgets
//    -> JQM needs trigger("create") on parent, easy to call on wrapper
//      -> enhance before replace?
//    -> does a sandbox need a wrapper?
// -> addGadget
//    -> add callbacks
// -> allow to load remote src files, which should only have <link> elements
//    to publish their services
// -> find a way to prevent a gadget from reloading a plugin that's already
//    active on the page
// -> for browser history, we would have to change the URL with a hash


// DISCUSSION POINTS:
// (1)
// (2) If not used for interactions or routing, what's the purpose of
//     gadgetIndex?
// (3) Do we dumb-store in the index or perform some sort of validation
//     before adding a gadget to an index?
// (4)
// (5) Should findGadget() = find recursive gadgets, also work with a single
//     gadget id, like findGadget({"id":"1ewnel73"}), I guess not as we
//     are using random uuids internally only
// (6)
// (7)
// (8)
// (9) When hard-coding services (see content.html), the "url" parameter can
//     be omitted which would default to current iFrame (window) or root?
// (10)
// (11)is passing the root URL through the URL a security vulnerablity?
// (12)should findGadget and findService be API methods? They will scan the
//     DOM for services/gadgets, but this should actually be done (and is done)
//     automatically
// (13)we need to use an id to identify <frames> on a page, currently set as
//     uuid by renderJs. We could also use data-id or remove the id and try
//     to match by src (url), but this will be worse in terms of performance
// (14)what do to about service parameters. A service that requires parameters
//     a and b passed to return c should somewhere also specify this. Do we
//     need a service JSON/HAL API? or where should this information be made
//     availabel

// Info:
// iframe communication:
// http://bit.ly/11gjl1e
// http://bit.ly/1434ZSV

// custom URI schemes:
// http://bit.ly/11tn2MJ

// validate URL:
// http://bit.ly/2Ol4gj

// deferred explanation:
// http://bit.ly/WH2TRI
// http://bit.ly/zm0Csi

// URI-templates:
// https://code.google.com/p/uri-templates/

/*jslint indent: 2, maxlen: 80, nomen: true */
/*global window: true, $: true, undefined: true, console: true,
  document: true, require: true*/
(function ($, window) {
  "use strict";
  var priv = {},
    that = {};

  // ==================  utility methods ==================

  // extend $.deferred to allow multiple calls and resolves
  // thx router.js
  $.extend({
    StatelessDeferred: function () {
      var doneList = $.Callbacks("memory"),
        promise = {
          done: doneList.add,

          // Get a promise for this deferred
          // If obj is provided, the promise aspect is added to the object
          promise: function (obj) {
            var i,
              keys = ['done', 'promise'];
            if (obj === undefined) {
              obj = promise;
            } else {
              for (i = 0; i < keys.length; i += 1) {
                obj[keys[i]] = promise[keys[i]];
              }
            }
            return obj;
          }
        },
        deferred = promise.promise({});

      deferred.resolveWith = doneList.fireWith;
      deferred.resolve = doneList.fire;

      // All done!
      return deferred;
    }
  });

  // => cross-browser reduce (no support in ie8-, opera 12-)
  // http://mzl.la/11tnDy1
  if ('function' !== typeof Array.prototype.reduce) {
    Array.prototype.reduce = function (callback, opt_initialValue) {
      if (null === this || 'undefined' === typeof this) {
        // At the moment all modern browsers, that support strict mode, have
        // native implementation of Array.prototype.reduce. For instance, IE8
        // does not support strict mode, so this check is actually useless.
        throw new TypeError(
            'Array.prototype.reduce called on null or undefined'
        );
      }
      if ('function' !== typeof callback) {
        throw new TypeError(callback + ' is not a function');
      }
      var index = 0, length = this.length >>> 0, value, isValueSet = false;
      if (1 < arguments.length) {
        value = opt_initialValue;
        isValueSet = true;
      }
      for ( ; length > index; ++index) {
        if (!this.hasOwnProperty(index)) continue;
        if (isValueSet) {
          value = callback(value, this[index], index, this);
        } else {
          value = this[index];
          isValueSet = true;
        }
      }
      if (!isValueSet) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      return value;
    };
  }

  // => regexes used to convert Ajax response string into HTML element list
  // thx require: http://requirejs.org/docs/release/2.1.6/comments/require.js
  priv.removeJSComments = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
  priv.removeHTMLComments = /<!--[\s\S]*?-->/mg;
  priv.removeLineBreaks = /(\r\n|\n|\r)/mg;
  priv.removeWhiteSpace = /\s+/mg;
  priv.removeWhiteSpaceBetweenElements = />\s+</mg;

  // => convert all URLs to absolute URLs
  // thx JQM - http://code.jquery.com/mobile/latest/jquery.mobile.js

  // URL regexp
  //     [0]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content
  //     [1]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread
  //     [2]: http://jblas:password@mycompany.com:8080/mail/inbox
  //     [3]: http://jblas:password@mycompany.com:8080
  //     [4]: http:
  //     [5]: //
  //     [6]: jblas:password@mycompany.com:8080
  //     [7]: jblas:password
  //     [8]: jblas
  //     [9]: password
  //    [10]: mycompany.com:8080
  //    [11]: mycompany.com
  //    [12]: 8080
  //    [13]: /mail/inbox
  //    [14]: /mail/
  //    [15]: inbox
  //    [16]: ?msg=1234&type=unread
  //    [17]: #msg-content
  priv.urlParser = /^\s*(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/

  // parse a URL
  priv.parseUrl = function( url ) {
    if ( $.type( url ) === "object" ) {
      return url;
    }
    var matches = priv.urlParser.exec( url || "" ) || [];
    return {
      href:         matches[  0 ] || "",
      hrefNoHash:   matches[  1 ] || "",
      hrefNoSearch: matches[  2 ] || "",
      domain:       matches[  3 ] || "",
      protocol:     matches[  4 ] || "",
      doubleSlash:  matches[  5 ] || "",
      authority:    matches[  6 ] || "",
      username:     matches[  8 ] || "",
      password:     matches[  9 ] || "",
      host:         matches[ 10 ] || "",
      hostname:     matches[ 11 ] || "",
      port:         matches[ 12 ] || "",
      pathname:     matches[ 13 ] || "",
      directory:    matches[ 14 ] || "",
      filename:     matches[ 15 ] || "",
      search:       matches[ 16 ] || "",
      hash:         matches[ 17 ] || ""
    };
  };

  priv.isForeignUrl = function (url) {
    var host = priv.parseUrl(url).hostname,
      foreign = true;
    if (host === "" || host === window.location.hostname) {
      foreign = false;
    }
    return foreign;
  };

  // is relateive URl (check protocol)
  priv.isRelativeUrl = function (url ) {
    return priv.parseUrl( url ).protocol === "";
  };

  // get location
  priv.getLocation = function (url) {
    var uri = url ? priv.parseUrl( url ) : location,
      hash = priv.parseUrl( url || location.href ).hash;

    // mimic the browser with an empty string when the hash is empty
    hash = hash === "#" ? "" : hash;

    // Make sure to parse the url or the location object for the hash because using location.hash
    // is autodecoded in firefox, the rest of the url should be from the object (location unless
    // we're testing) to avoid the inclusion of the authority
    return uri.protocol + "//" + uri.host + uri.pathname + uri.search + hash;
  };

  // make PATH absolute
  priv.makePathAbsolute = function (relPath, absPath) {
    var absStack, relStack, i, d;

    if ( relPath && relPath.charAt( 0 ) === "/" ) {
      return relPath;
    }

    relPath = relPath || "";
    absPath = absPath ? absPath.replace( /^\/|(\/[^\/]*|[^\/]+)$/g, "" ) : "";
    absStack = absPath ? absPath.split( "/" ) : [];
    relStack = relPath.split( "/" );

    for ( i = 0; i < relStack.length; i++ ) {
      d = relStack[ i ];
      switch ( d ) {
        case ".":
          break;
        case "..":
          if ( absStack.length ) {
            absStack.pop();
          }
          break;
        default:
          absStack.push( d );
          break;
      }
    }
    return "/" + absStack.join( "/" );
  };

  // make URL absolute
  priv.makeUrlAbsolute = function (relUrl, absUrl) {
    if ( !priv.isRelativeUrl( relUrl ) ) {
      return relUrl;
    }
    if ( absUrl === undefined ) {
      absUrl = priv.parseUrl(priv.getLocation());
    }

    var relObj = priv.parseUrl( relUrl ),
      absObj = priv.parseUrl( absUrl ),
      protocol = relObj.protocol || absObj.protocol,
      doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
      authority = relObj.authority || absObj.authority,
      hasPath = relObj.pathname !== "",
      pathname = priv.makePathAbsolute( relObj.pathname || absObj.filename, absObj.pathname ),
      search = relObj.search || ( !hasPath && absObj.search ) || "",
      hash = relObj.hash;

    return protocol + doubleSlash + authority + pathname + search + hash;
  };

  // => generate unique identifier
  priv.generateUuid = function () {
    var S4 = function () {
      /* 65536 */
      var i, string = Math.floor(
        Math.random() * 0x10000
      ).toString(16);
      for (i = string.length; i < 4; i += 1) {
        string = "0" + string;
      }
      return string;
    };
    return S4() + S4();
  };

  // extract module name from path
  priv.extractModuleName = function (src) {
    var re =  /([\w\d_-]*)\.?[^\\\/]*$/i;
    return src.match(re)[1];
  };

  // => safe getAttribute for data-*
  // thx JQM - http://code.jquery.com/mobile/latest/jquery.mobile.js
  priv.getAttribute = function (element, attribute, json) {
    var value;
    value = element.getAttribute("data-" + attribute);
    return value === "true" ? true :
        value === "false" ? false :
            value === null ? (json ? "" : undefined) : value;
  };

  // => URI methods
  // decode URI
  priv.decodeURI = function (string) {
    return decodeURIComponent(string);
  };
  // encode URI
  priv.encodeURI = function (string) {
    return encodeURIComponent(string);
  };
  // decode URI array
  priv.decodeURIArray = function (array) {
    var i, newArray = [];
    for (i = 0; i < array.length; i += 1) {
      newArray.push(priv.decodeURI(array[i]));
    }
    return newArray;
  };


  // ==================  internal methods ==================

  // => keep service callbacks available until a postMessage returns response
  priv.trackCallback = function (id, callback, callbackFunction) {
    if (priv.callbackTracker === undefined) {
      priv.callbackTracker = [];
    }
    priv.callbackTracker.push({
      "id": id,
      "callback": callback,
      "callbackFunction": callbackFunction
    });
  };

  // => keep track of service requesters to reply to
  priv.trackRequest = function (id, respondTo) {
    if (priv.serviceTracker === undefined) {
      priv.serviceTracker = [];
    }
    priv.serviceTracker.push({"id": id, "respondTo": respondTo});
  };

  // => retrieve callback for a specific service call
  priv.retrieveCallback = function (id) {
    var i, callback;
    for (i = 0; i < priv.callbackTracker.length; i += 1) {
      callback = priv.callbackTracker[i];
      if (callback.id = id) {
        return [callback.callback, callback.callbackFunction];
      }
    }
  };

  // => retrieve window which called a specific service
  priv.retrieveCallingWindow = function (id) {
    var i, service, callee;
    for (i = 0; i < priv.serviceTracker.length; i += 1) {
      service = priv.serviceTracker[i];
      if (service.id === id) {
        callee = service.respondTo;
        priv.serviceTracker.splice(i, 1);
        return callee;
      }
    }
  };

  // => map internal browser:// urls
  // API browser://{command}/{method}/{scope}/{interaction}/
  priv.mapBrowserURL = function (url) {
    var api = ['command', 'method', 'scope', 'interaction'], internalRequest;
    try {
      internalRequest = url.split("/")
        .filter( String )
        .splice(1)
        .reduce( function( previous, current, index ){
          previous[ api[index] ] = current;
          return previous;
        },{});
    } catch(e) {
      console.log("internal URL could not be mapped");
    }
    return internalRequest;
  };

  // => create Index of gadgets on page (excluding gadgets in iFrame/Sandbox)
  priv.createGadgetIndex = function () {
    that.gadgetIndex = [];
  };

  // => create gadget reference tree (includes gadgets in iFrame/Sandbox)
  priv.createGadgetTree = function () {
    that.gadgetTree = {
      "id": "root",
      "src": window.location.href,
      "children": []
    };
  };

  // => add gadget to index
  priv.addGadgetToIndex = function (data, options) {
    that.gadgetIndex.unshift({
      "id": options.id,
      "options": options,
      "data": data
    });
  };

  // => add gadget to tree
  priv.addGadgetToTree = function (options, treeNode) {
    var i, newNode;

    // recursive add
    if (options.parentFrame === undefined) {
      treeNode.children.unshift({
        "id": options.id,
        "src": priv.makeUrlAbsolute(priv.decodeURI(options.src)),
        "foreign" : priv.isForeignUrl(options.src),
        "children": []
      });
    } else {
      for (i = 0; i < treeNode.children.length; i += 1) {
        newNode = treeNode.children[i];
        if (options.parentFrame === newNode.id) {
          delete options.parentFrame;
          priv.addGadgetToTree(options, newNode);
          break;
        }
        if (newNode.children.length > 0) {
          priv.addGadgetToTree(options, newNode);
        }
      }
    }

    // if we are in a renderJs instance other than the root-instance
    // (e.g. inside an iFrame) we also need to tell the root how this
    // gadget can be accessed in case we want to call it's services
    if (window.top !== window) {
      window.top.postMessage({
        // this will trigger addGagdetToTree() on root-in
        "type": "tree/update",
        "options": {
          // passing "options":options will procude a DataCloneError, so
          // this is the only way (it seems) to pass the options object.
          // beware frameElement does not work in cors, so actually
          // THIS NEEDS A FIX!
          "parentFrame": window.frameElement.getAttribute("id"),
          "id": options.id,
          "src": options.src,
          "children": []
        }
      }, window.location.href.split("?")[0]);
    }
  };

  // => loop the gadgetTree to construct a selector to call a service
  priv.constructSelectorForService = function (src, node, selector) {
    var i, result;
    selector = selector || [];
    // the error is in the gadgetTree!

    // we must not push "root" into the array to make reduce work
    if (node.id !== "root") {
      selector.push([node.id, node.foreign]);
    }
    if (node.src === src) {
      return selector;
    }

    for (i = 0; i < node.children.length; i += 1) {
      result = priv.constructSelectorForService(
        src,
        node.children[i],
        selector
      );
      if (result !== undefined) {
        return result;
      }
      selector.pop();
    }
  };

  // => interaction gadget and listener
  // if initializing config is provided in the URL, we may have an src=[]
  // of links to additional functional libraries (?), which should be
  // available here. So we should load them.
  priv.createServiceMap = function (spec) {
    that.gadgetService = {
      "root": spec.root || window.location.href,
      "directories": spec.src || [],
      "map": []
    };

    // listen for service postings to THIS renderJs instance
    if (window.addEventListener){
      window.addEventListener("message", priv.serviceHandler, false)
    } else {
      window.attachEvent("onmessage", priv.serviceHandler)
    }
  };

  // => manages all interactions (listens to incoming postMessages)
  priv.serviceHandler = function (event) {

    var type = event.data.type, route;
    if (type) {
      route = event.data.type.split("/");

      // authenticate all message senders
      // basic "authentication" is done through the switch, which requires
      // a matching type to be passed - still the incoming URL should be
      // authenticated, too, plus preferably another ticket-authentication.

      // route
      switch (route[0]) {
      case "register":
        priv.registerNewService(event);
        break;
      case "request":
        priv.requestServiceFromGadget(event);
        break;
      case "run":
        priv.runService(event);
        break;
      case "result":
        priv.sendServiceReply(event);
        break;
      case "reply":
        priv.returnResult(event);
        break;
      // not part of the request-response cylce, but if the gadgetTree
      // is global at the top, we need to inform the top about gadgets to add
      case "tree":
        if (route[1] === "update") {
          priv.addGadgetToTree(event.data.options, that.gadgetTree);
        }
        break;
      }
    } else {
      // switch to using URLs here
      // global get!
      $.ajax({
        method: "GET",
        url: event.data,
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("request failed: " + errorThrown);
        },
        success: function (value, textStatus, jqXHR) {
          // switch here!

          var scope = value._links.self.href.split("/").slice(0,-1).pop(),
          service = {
            "service" : value._links.self.href.split(/[/]+/).pop(),
            "parameters" : [value._links.request.href],
            "scope" : scope
          },
          request = 'browser://request/' + scope + '/';

          $.ajax({
            method: "POST",
            url: request,
            context: $(this),
            data: JSON.stringify(service),
            error: function (jqXHR, textStatus, errorThrown) {
              console.log("request for service failed");
            },
            //  success: function () {
            //    console.log("service requested from renderJS");
            //  }
          });
        }
      });
    }
  };

  // => return the result to the function call
  priv.returnResult = function (event) {
    var callback = priv.retrieveCallback(event.data.callback);
    // resolve the deferred, which includes the requestService callback
    callback[0].resolve(event.data.result, callback[1]);
  };

  // => sends a response message after a service has been run
  priv.sendServiceReply = function (event) {
    var targetWindow = priv.retrieveCallingWindow(event.data.trackingId);
    targetWindow.postMessage({
      "type": "reply",
      "result": event.data.result,
      "callback": event.data.callbackId,
    }, event.origin);
  };

  // => run a service and post the result
  priv.runService = function (event) {
    var result;

    // URL handling
    if (event.data.url) {
      // let's go
      $.ajax({
        url: event.data.parameters[0],
        method: 'GET',
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("could not run service/interaction: " + errorThrown);
        },
        success: function (value, textStatus, jqXHR) {
          $.ajax({
            method: 'GET',
            url: value._links.enclosure.href,
            context: $('body'),
            error: function (jqXHR, textStatus, errorThrown) {
              $(this).text(errorThrown);
            },
            success: function (value2, textStatus, jqXHR) {
              // this should be a deferred callback....
              if (value === "") {
                window.document.body.innerHTML = "file not found";
              } else {
                window.document.body.innerHTML = value2;
              }
            }
          });
        }
      });

    } else {
      result = window[event.data.service].apply(this, event.data.parameters);

      // only callback if we have to - should also be done via AJAX
      if (event.data.callbackId) {
        window.top.postMessage({
          "type": "result",
          "result": result,
          "trackingId" : event.data.trackingId,
          "callbackId": event.data.callbackId,
        }, event.origin);
      }
    }
  };

  // => construct an iFrame selector from an array of ids
  priv.assembleSelectorForService = function (selector) {
    var targetWindow;
    // for plain nested gadgets (no iFrame/sandbox) this will return
    // only an empty array
    // for iFrames/sandbox, selector will be an array of ids from
    // which we have to construct our window element like so:
    // http://bit.ly/12m3wJD
    // http://mzl.la/17EeDiN
    // final selector should look like this:
    // window.frames["3a6b8d97"].contentWindow
    //   .frames["d63aca68"].contentWindow
    //   .frames["foo"].contentWindow
    if (selector.length === 0) {
      targetWindow = window;
    } else {
      try {
        targetWindow = selector.reduce(function(tgt, o) {
          return tgt && o[1] ?
            tgt.frames[0] :
              tgt.frames[o[0]].contentWindow || tgt.frames[o[0]];
        }, window);
      } catch (error) {
        console.log(error);
      }
    }
    return targetWindow;
  };

  // => request a service provided by a gadget
  priv.requestServiceFromGadget = function (event) {
    var callService = priv.findServiceInMap(
      event.data.service,
      event.data.type.split("/")[1]
    ),
      selector,
      targetWindow,
      options,
      trackingId = priv.generateUuid();

    // track this request, so we know where to send the response
    priv.trackRequest(trackingId, event.originalTarget);

    if (callService) {
      // services are stored by URL (not id), because if inside an iFrame
      // we cannot access the frame id, because of CORS.
      // The only accessible parameter is the window.location.href URL, so
      // services need to be stored with URL.
      // in our gadget tree by using the URL provided by the service...
      // and return an id path, so we can create a selector
      selector = priv.constructSelectorForService(
        priv.decodeURI(callService.src),
        that.gadgetTree,
        []
      );

      options = {
        "type": "run",
        "trackingId": trackingId,
        "callbackId": event.data.callbackId,
        "service": event.data.service,
        "parameters": event.data.parameters,
        "url": callService.url || undefined
      }

      // we should not directly postMessage...
      if (callService.url === "") {
        targetWindow = priv.assembleSelectorForService(selector);
        targetWindow.postMessage(options, event.origin);
      } else {
        // we need the selector array to construct our targetWindow
        // because we cannot pass a window object through an ajax call...
        options.selector = selector;
        // let's go
        $.ajax({
          url: callService.url,
          method: 'POST',
          data: JSON.stringify(options),
          error: function (jqXHR, textStatus, errorThrown) {
            console.log("call to targetWindow failed: " + errorThrown);
          },
//           success: function (value, textStatus, jqXHR) {
//             console.log("call to targetWindow successful");
//           }
        });
      }
    }
  };

  // => check whether a service is available
  priv.findServiceInMap = function (requestedService, scope) {
    var i,
      service,
      passback = null;

    for (i = 0; i < that.gadgetService.map.length; i += 1) {
      service = that.gadgetService.map[i];
      if (service.rel === requestedService) {
        if (scope) {
          if (scope === service.scope) {
            passback = service;
          }
        } else {
          passback = service;
        }
      }
    }
    return passback;
  };

  // => register a new Service to the root
  priv.registerNewService = function (event) {
    var  i, check, addInteraction = true;

    // prevent duplicate entrys of same service
    for (i = 0; i < that.gadgetService.map.length; i += 1) {
      check = that.gadgetService.map[i];
      if (event.data.rel === check.rel) {
        if (event.data.src === check.src) {
          addInteraction = false;
        }
      }
    }
    if (addInteraction) {
      delete event.data.type;
      that.gadgetService.map.push(event.data);
    }
  };

  // => register gadget in index and tree
  priv.registerGadget = function (data, options) {
    // index ~ cache
    priv.addGadgetToIndex(data, options);

    // tree ~ lookup reference
    priv.addGadgetToTree(options, that.gadgetTree);
  };

  // => find hardcoded services in source HTML
  priv.findServiceInHTML = function (spec, sentRoot) {
    var root = sentRoot || document,
      services,
      service,
      options,
      src,
      i,
      j;

    try {
      services = root.querySelectorAll('[data-service], link[type^=service]');

      for (i = 0; i < services.length; i += 1) {
        service = JSON.parse(priv.getAttribute(services[i], 'service'));
        for (j = 0; j < service.length; j += 1) {
          src = service[j].src || window.location.href.split("?")[0];
          options = {
            "rel": service[j].rel,
            "type": service[j].type || "register/any",
            "src": priv.makeUrlAbsolute(priv.decodeURI(src)),
            "url": ""
          };
          $(root).addService(options);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // => find hardcoded gadgets in source HTML
  priv.findGadgetinHTML = function (spec, sentRoot) {
    var root = sentRoot || document,
      gadgets,
      gadget,
      options,
      i;

    // need to try/catch because cross domain will not permit qsa
    // > so any cross domain gadgets have to be self-sufficient
    // > have renderJs and load their own gadgets!
    try {
      gadgets = root.querySelectorAll('[data-gadget]');

      // gadget options
      for (i = 0; i < gadgets.length; i += 1) {
        gadget = gadgets[i];
        options = {
          "src" : priv.makeUrlAbsolute(priv.getAttribute(gadget, 'gadget')),
          "id": priv.generateUuid(),
          "param" : JSON.parse(
            priv.getAttribute(gadget, 'param', true) || null
          ),
          "sandbox" : priv.getAttribute(gadget, 'sandbox') || false,
          "iframe" : priv.getAttribute(gadget, 'iframe') || false,
          "wrapper": gadget
        };

        // add gadget
        $(root).addGadget(options);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // => insert a gadget into the DOM
  priv.appendGadget = function (gadgetData, options) {
    var newHTML = [],
      newParentElement,
      newRootElement,
      callback,
      cleanedString,
      content,
      i,
      element,
      src;

    // update gadgetIndex
    priv.registerGadget(gadgetData, options);

    // MODULE, DEFAULT handler
    if (gadgetData !== undefined) {
      if (typeof gadgetData === "object") {
        newHTML = gadgetData.data;
        callback = gadgetData.callback;
      } else {
        // extract relevant page elements here!
        cleanedString = gadgetData
            .replace(priv.removeJSComments, "")
            .replace(priv.removeHTMLComments, "")
            .replace(priv.removeLineBreaks, "")
            .replace(priv.removeWhiteSpace, " ")
            .replace(priv.removeWhiteSpaceBetweenElements, "><");
        // this will return a nodeList with head and body elements
        // e.g. [meta, title, link, p, div]
        content = $.parseHTML(cleanedString, true);

        for (i = 0; i < content.length; i += 1) {
          element = content[i];
          switch (element.tagName) {
          case "LINK":
            if (element.getAttribute("type").split("/")[0] === "register") {
              // need to make sure we store absolute URLs for services, too!
              src = element.getAttribute("src") ||
                window.location.href.split("?")[0];
              $(element).addService({
                "src": priv.makeUrlAbsolute(priv.decodeURI(src)),
                "type": element.getAttribute("type"),
                "rel": element.getAttribute("rel"),
                "url": ""
              });
            }
            break;
          case "META":
          case "TITLE":
            break;
          case "SCRIPT":
            // TODOS: this is bad, problem is gadgets being injected into
            // the DOM without iFrame, will also have all script tags
            // inserted, so if they share any plugins (like renderJs), they
            // will be re-requested and end up as additional instances
            // in the same scope, so renderJs.addGadget() will trigger x-times
            if (!content[i].getAttribute("src")) {
              newHTML.push(content[i]);
            }
            break;
          default:
            // create a collection to append
            newHTML.push(content[i]);
            break;
          }
        }
      }

      // append or replace (as below, remove duplicate code later)
      if (options.wrapper) {
        newParentElement = options.parent[0] || options.parent;
        $(options.wrapper).replaceWith(newHTML);
      } else if (options.replaceParent) {
        newParentElement = options.parent.parent()[0];
        options.parent.replaceWith(newHTML);
      } else {
        newParentElement = options.parent;
        $(newHTML).appendTo(options.parent);
      }
      if (callback) {
        callback();
      }
      // find recursive gadgets
      $(newParentElement).findGadget();
      // find recursive services
      $(newParentElement).findService();
    } else {
      // =============== IFRAME  ==================
      newHTML = document.createElement("iframe");
      newHTML.setAttribute("src", options.src);
      newHTML.setAttribute("frameborder", 0);
      newHTML.setAttribute("seamless", "seamless");
      newHTML.setAttribute("id", options.id);
      newHTML.innerHTML = '<p>Your browser does not support iframes.</p>'

      // append or replace
      if (options.wrapper) {
        newParentElement = options.parent[0] || options.parent;
        $(options.wrapper).replaceWith(newHTML);
      } else if (options.replaceParent) {
        newParentElement = options.parent.parent()[0];
        options.parent.replaceWith(newHTML);
      } else {
        newParentElement = options.parent;
        $(newHTML).appendTo(options.parent);
      }

      // select iframe
      newRootElement = newParentElement.querySelectorAll(
        '[id="' + options.id + '"]'
      );

      // add configuration and find recursive gadgets
      $(newRootElement[0]).load(function () {
        var newElement = $(this);

        // pass parameters to nested iFrame by setting on <iframe> body
        // if (options.param) {
        //  newElement.contents().find("body")[0].config = options.param;
        // }

        // find recursive gadgets
        newElement.findGadget();
        // find services to publish
        newElement.findService();
      });
    }
  };

  // => initialize
  priv.initialize = function () {

    // both root and iFrame try to map location.search, either for initial
    // configuration or to retrieve the root when inside an iFrame
    var spec = that.mapUrl(window.location.search);

    // create index
    priv.createGadgetIndex();

    // create tree
    priv.createGadgetTree();

    // all instances of renderJs should have an serviceMap
    priv.createServiceMap(spec);

    // trigger => find HTML gadgets in root document
    priv.findGadgetinHTML(spec);

    // trigger => find HTML coded interactions in root document
    priv.findServiceInHTML(spec);

    // expose API
    window.renderJs = that;
  };

  // ================ public API (call on renderJs and $(elem) ===========
  // => mapURL searchstring
  that.mapUrl = function (spec, internal) {
    var key,
      obj,
      parsedJSON,
      configuration = {};

    if (spec !== undefined && spec !== "") {
      obj = spec.slice(1).split("=");
      key = obj[0];

      switch (key) {
      case "string":
      case "url":
        configuration.root = priv.decodeURI(obj[1]);
        break;
      case "json":
        parsedJSON = JSON.parse(priv.decodeURI(obj[1]));
        configuration.root = parsedJSON.root || window.location.pathname;
        configuration.src = priv.decodeURIArray(parsedJSON.src) || [];
        break;
      case "hal":
        parsedJSON = JSON.parse(priv.decodeURI(obj[1]));
        configuration.root = parsedJSON._links.self || window.location.pathname;
        configuration.src = priv.decodeURIArray(parsedJSON.src) || [];
        break;
      case "file":
        $.ajax({
          method: 'GET',
          url: obj[1],
          context: $('body'),
          fail: function (jqXHR, textStatus, errorThrown) {
            configuration = {
              "errorThrown":errorThrown,
              "textStatus": textStatus,
              "jqXHR": jqXHR
            }
          },
          done: function (value, textStatus, jqXHR) {
            configuration = {
              "value":value,
              "textStatus": textStatus,
              "jqXHR": jqXHR
            }
          }
        });
        break;
      default:
        // no allowable-type - ignore configuration-parameter!
        configuration.root = window.location.href;
        configuration.src = [];
        break;
      }
    } else {
      configuration = {"root": window.location.href};
    }
    return configuration;
  };
  
  // => publish a service to this instance (and root instance)
  that.addService = $.fn.addService = function (options) {
    var addressArray = window.location.href.split("?"), targetUrl;
    options.src = priv.makeUrlAbsolute(priv.decodeURI(options.src)) || addressArray[0];

    // posts to URL passed (need for CORS?)
    // otherwise window.top.location.href) would also work
    if (addressArray.length === 1) {
      targetUrl = priv.decodeURI(addressArray[0]);
    } else {
      targetUrl = priv.decodeURI(addressArray[1].split("=")[1]);
    }
    // TODO: this should be a URL link
    window.top.postMessage(options, targetUrl);
  };

  // => request a service to be run
  that.requestService = $.fn.requestService = function (options, callbackFunction) {
    var deferred = new $.StatelessDeferred(),
      callbackId = priv.generateUuid(),
      callback = deferred;

    // store callback to be retrieved by response handler
    if (callbackFunction) {
      priv.trackCallback(callbackId, callback, callbackFunction);
      // set a deferred, so the callback can run when everything is done
      deferred.done(function(result, callbackFunction) {
        if (callbackFunction) {
          callbackFunction(result);
        }
      });
      options.callbackId = callbackId;
    }

    // set type
    if (options.type === undefined) {
      options.type = "request/any";
    }

    window.top.postMessage(options, window.location.href);
  };

  // => add a gadget
  that.addGadget = $.fn.addGadget = function (options) {
    var element = this[0];

    // check if we can remove the parent
    if (element === document || element === window || element === document.body) {
      options.parent = document.body;
      options.replaceParent = false;
    } else {
      options.parent = this;
      options.replaceParent = true;
    }

    // set uuid
    if (options.id === undefined) {
      options.id = priv.generateUuid();
    }

    // set offline

    // set cors

    // ======================== LOADING ========================
    // module/requireJs
    if (options.module && require !== undefined) {
      require([priv.extractModuleName(options.src)], function (response) {
        priv.appendGadget(response, options);
      });

    // iFrame
    } else if (options.iframe) {
      priv.appendGadget(undefined, options);

    // straight ajax (default)
    } else {
      $.ajax({
        url: options.src,
        method: options.method || "GET",
        success: function (data) {
          priv.appendGadget(data, options);
        },
        error: function (error) {
          console.log(error);
        }
      });
    }
  };

  // => find gadgets inside a newly added gadget
  that.findGadget = $.fn.findGadget = function (sentRoot) {
    var root = sentRoot || this,
      spec = {};
    if (root[0].tagName === "IFRAME") {
      // will not be possible in external iframe, because of cors!
      root = root[0].contentDocument || root[0].contentWindow.document;
    } else {
      root = root[0];
    }
    priv.findGadgetinHTML(spec, root);
  };

  // => recursive call - find services inside newly added gadget
  that.findService = $.fn.findService = function (sentRoot) {
    var root = sentRoot || this,
      spec = {};
    if (root[0].tagName === "IFRAME") {
      // will not be possible in external iframe, because of cors!
      root = root[0].contentDocument || root[0].contentWindow.document;
    } else {
      root = root[0];
    }
    priv.findServiceInHTML(spec, root);
  };

  // ==================  ENTRY =============
  // => start here
  // don't use doc.ready, but otherwise cannot load references to elements in
  // body from <SCRIPT> in <HEAD>
  $(document).ready(function() {
    // prevent renderJs reloads from different URLs!
    // this does not solve the problem of re-requesting dependencies
    // with ?timestamp=_123241231231 when injecting elements into a page
    // without iFrame
    if (window.renderJs === undefined) {
      priv.initialize();
    }
  });

  //////////////////////////////////////////////
  // Fake xhr to access local resource
  //////////////////////////////////////////////

  var default_xhr = $.ajaxSettings.xhr,
    dispatch,
    dispatch_data;

  dispatch_data = function () {
    // data:[<mediatype>][;base64],<data>
    var regexp = /^data:\/\/([\w\/+]+)?(;base64)?,([\w\W]+)/,
        mime_type, is_base_64, data;
    // window.atob(encodedData);
    if (regexp.test(this.url)) {
      mime_type = regexp.exec(this.url)[1];
      is_base_64 = regexp.exec(this.url)[2];
      data = regexp.exec(this.url)[3];
      if (is_base_64 === ';base64') {
        this.respond(200, {
          'Content-Type': mime_type,
        }, window.atob(data));
      } else {
        this.respond(200, {
          'Content-Type': mime_type,
        }, data);
      }
    } else {
      this.respond(404, {}, "");
    }
  };

  dispatch = function () {
    // XXX Local hack
    var ls_regexp = /^browser:\/\/localstorage\/([\w\W]+)/,
      browse_ls_file_regexp = /^browser:\/\/browse\/ls\/([\w\W]+)/,
      browse_ls_directory_regexp = /^browser:\/\/browse\/ls\//,
      ss_regexp = /^browser:\/\/sessionstorage\/([\w\W]+)/,
      browse_ss_file_regexp = /^browser:\/\/browse\/ss\/([\w\W]+)/,
      browse_ss_directory_regexp = /^browser:\/\/browse\/ss\//,

      call_regexp = /^browser:\/\/call\/([\w\W]+)\//,
      delegate_regexp = /^browser:\/\/delegate\/([\w\W]+)\//,
      request_regexp = /^browser:\/\/request\/([\w\W]+)\//,

      key, config, provider, param, value, targetWindow;

    // =================== cleanup ====================
    // internal API
    // {command}/{method}/{scope}/{interaction}/
    var internalRequest = priv.mapBrowserURL(this.url);

    if (internalRequest.command === "call") {
//       if (this.method === "POST") {
// 
//       } else {
//         this.respond(405, {}, "");
//       }
    } else if (internalRequest.command === "delegate") {
//       if (this.method === "POST") {
// 
//       } else {
//         this.respond(405, {}, "");
//       }
    } else if (internalRequest.command === "request") {
//       if (this.method === "POST") {
// 
//       } else {
//         this.respond(405, {}, "");
//       }
    } else {
//       this.respond(404, {}, "");
    }


    // =================== previous ====================
    // localStorage handler
    if (ls_regexp.test(this.url)) {
      key = ls_regexp.exec(this.url)[1];
      if (this.method === "POST") {
        localStorage[key] = this.requestBody;
        this.respond(200, {}, "");
      } else if (this.method === "GET") {
        this.respond(200, {
          "Content-Type": "text/plain"
        }, localStorage[key]);
      } else if (this.method === "DELETE") {
        localStorage.removeItem(key);
        this.respond(200, {}, "");
      } else {
        this.respond(405, {}, "");
      }
    } else if (browse_ls_file_regexp.test(this.url)) {
      key = browse_ls_file_regexp.exec(this.url)[1];
      this.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify({
        _links: {
          self: {href: this.url},
          enclosure: {href: 'browser://localstorage/' + key},
        }
      }));
    } else if (browse_ls_directory_regexp.test(this.url)) {
      var response = {
        _links: {
          self: {href: this.url},
          contents: [],
        }
      };

      for (var key in localStorage){
         response._links.contents.push({href: 'browser://browse/ls/' + key});
      }

      this.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(response));

    // Session storage handler
    } else if (ss_regexp.test(this.url)) {
      key = ss_regexp.exec(this.url)[1];
      if (this.method === "POST") {
        sessionStorage[key] = this.requestBody;
        this.respond(200, {}, "");
      } else if (this.method === "GET") {
        this.respond(200, {
          "Content-Type": "text/plain"
        }, sessionStorage[key]);
      } else if (this.method === "DELETE") {
        sessionStorage.removeItem(key);
        this.respond(200, {}, "");
      } else {
        this.respond(405, {}, "");
      }
    } else if (browse_ss_file_regexp.test(this.url)) {
      key = browse_ss_file_regexp.exec(this.url)[1];
      this.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify({
        _links: {
          self: {href: this.url},
          enclosure: {href: 'browser://sessionstorage/' + key},
        }
      }));
    } else if (browse_ss_directory_regexp.test(this.url)) {
      var response = {
        _links: {
          self: {href: this.url},
          contents: [],
        }
      };
      for (var key in sessionStorage){
         response._links.contents.push({href: 'browser://browse/ss/' + key});
      }
      this.respond(200, {
        'Content-Type': 'application/hal+json'
      }, JSON.stringify(response));

    // this looks up requests inside renderJs and
    // triggers the respective postMessage
    // should we use the key here or not and maybe pass the scope
    // as parameter of the service object?
    } else if (request_regexp.test(this.url)) {
      // key = request_regexp.exec(this.url)[1];
      if (this.method === "POST") {
        // if (key === "map") {
          config = JSON.parse(this.requestBody);
          var options = {
            "type":"request/" + config.scope,
            "service" : config.service,
            "parameters": config.parameters
          };
          window.postMessage(options, "*");

          this.respond(204, {}, "");
        //} else {
        //  this.respond(404, {}, "");
        //}
      } else {
        this.respond(405, {}, "");
      }

    // this handles communication from child > parent
    // using browser://call/{method}/{interaction/service}
    } else if (call_regexp.test(this.url)) {
      param = call_regexp.exec(this.url)[1].split("/")
      key = param[0];
      value = param[1];

      if (this.method === "POST") {
        if (key === "register") {
          // still inside child frame
          // add to tree, so lookup is possible when service is requested
          config = JSON.parse(this.requestBody);
//           // we don't need this here!
//           // but first get the internal router to work, so we only
//           // handle data-uris
//           window.parent.postMessage({
//             "type": "tree/update",
//             "options": {
//               "id": config.self,
//               "src": config.src,
//               "children": []
//             }
//           }, "*");

          // generate a url to be called once the service is requested
          // this is a parent > child URL, so we delegate
          // Need provider and rel here, because later we can remove
          // from data being sent along with this URL
          provider = config.self || "any";

          // update config
          config.url = 'browser://delegate/' + provider + '/' + config.rel
          config.scope = value || "any";

          // register service
          window.top.postMessage(config, "*");

          this.respond(204, {}, "");

        } else if (key === "request") {
          // inside child frame, request service to be run
          var sendToParent = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href: this.url},
              request: {href: this.requestBody}
            }}));

          window.top.postMessage(sendToParent, "*");
        } else {
          this.respond(404, {}, "");
        }
      } else {
        this.respond(405, {}, "");
      }

    // this handles communication from parent > child
    // using browser://delegate/{window_id}/{interaction/service}
    // the id is only to reconfirm, because for nested windows, we need
    // to reconstruct the complate selector
    } else if (delegate_regexp.test(this.url)) {
      // key = delegate_regexp.exec(this.url)[1];
      if (this.method === "POST") {
//      if (key === "map") {
          config = JSON.parse(this.requestBody);
          // get the target
          targetWindow = priv.assembleSelectorForService(config.selector);
          // cleanup
          delete config.selector;
          // post, this will call both the internal and on page handler!
          targetWindow.postMessage(config, "*");
          this.respond(204, {}, "");
//      } else {
//        this.respond(404, {}, "");
//      }
      } else {
        this.respond(405, {}, "");
      }
    } else {
      this.respond(404, {}, "");
    }
  };

  $.ajaxSetup({
    xhr: function () {
      var result;
      if (/^browser:\/\//.test(this.url)) {
        result = new BrowserHttpRequest();
        result.dispatch = dispatch;
      } else if (/^data:\/\//.test(this.url)) {
        result = new BrowserHttpRequest();
        result.dispatch = dispatch_data;
      } else {
        result = default_xhr();
      }
      return result;
    }
  });

}(jQuery, window));
