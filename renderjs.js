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

/*jslint indent: 2, maxlen: 80, nomen: true */
/*global window: true, $: true, undefined: true, console: true,
  document: true, require: true*/
(function ($, window) {
  "use strict";
  var priv = {},
    that = {};

    // ==================  utility methods ==================

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

  // => keep track of service requesters to reply to
  priv.trackRequest = function (id, respondTo) {
    if (priv.serviceTracker === undefined) {
      priv.serviceTracker = [];
    }
    priv.serviceTracker.push({"id": id, "respondTo": respondTo});
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

  // => mapping URL query-string (configuration
  priv.mapUrlString = function (spec) {
    var key, obj, parsedJSON, config = {};
    if (spec !== undefined && spec !== "") {
      obj = spec.slice(1).split("=");
      key = obj[0];
      switch (key) {
      case "string":
      case "url":
        config.root = priv.decodeURI(obj[1]);
        break;
      case "json":
        parsedJSON = JSON.parse(priv.decodeURI(obj[1]));
        config.root = parsedJSON.root || window.location.pathname;
        config.src = priv.decodeURIArray(parsedJSON.src) || [];
        break;
      case "hal":
        parsedJSON = JSON.parse(priv.decodeURI(obj[1]));
        config.root = parsedJSON._links.self || window.location.pathname;
        config.src = priv.decodeURIArray(parsedJSON.src) || [];
        break;
      case "data":
        break;
      default:
        // no allowable-type - ignore config-parameter!
        config.root = window.location.href;
        config.src = [];
        break;
      }
    } else {
      config = {"root": window.location.href};
    }
    return config;
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
        "src": options.src,
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
    // we must not push "root" into the array to make reduce work
    if (node.id !== "root") {
      selector.push(node.id);
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
    window.addEventListener("message", priv.serviceHandler, false);
  };

  // => manages all interactions (listens to incoming postMessages)
  // need a switch, because only one "message" listener can be set
  priv.serviceHandler = function (event) {
    var route = event.data.type.split("/"),
      trackingId;

    // authenticate all message senders

    // route
    switch (route[0]) {
    case "service":
      priv.registerNewService(event);
      break;
    case "request":
      trackingId = priv.generateUuid();
      // track this request, so we know where to send the response
      priv.trackRequest(trackingId, event.originalTarget);
      // request the service
      priv.requestServiceFromGadget(event, trackingId);
      break;
    case "tree":
      if (route[1] === "update") {
        priv.addGadgetToTree(event.data.options, that.gadgetTree);
      }
      break;
    case "run":
      priv.runService(event);
      break;
    case "result":
      priv.sendServiceReply(event);
      break;
    case "reply":
      priv.returnResult(event.data.result);
      break;
    }
  };

  // => return the result to the function call
  priv.returnResult = function (result) {
    // need a way to return this result to the calling function
    console.log(result);
    return result;
  };
  // => sends a response message after a service has been run
  priv.sendServiceReply = function (event) {
    var targetWindow = priv.retrieveCallingWindow(event.data.trackingId);
    targetWindow.postMessage({
      "type": "reply",
      "result": event.data.result
    }, window.location.href.split("?")[0]);
  };

  // => run a service and post the result
  priv.runService = function (event) {
    var result = window[event.data.service].apply(this, event.data.parameters);
    window.top.postMessage({
      "type": "result",
      "result": result,
      "trackingId" : event.data.trackingId
    }, window.location.href.split("?")[0]);
  };

  // => request a service provided by a gadget
  priv.requestServiceFromGadget = function (event, trackingId) {
    var callService = priv.findServiceInMap(
      event.data.service,
      event.data.type.split("/")[1]
    ),
      selector,
      targetWindow;

    if (callService) {
      // services are stored by URL (not id), so we need to find the service
      // in our gadget tree by using the URL provided by the service... 
      // and return an id path, so we can create a selector
      selector = priv.constructSelectorForService(
        callService.src,
        that.gadgetTree,
        []
      );

      // for plain nested gadgets (no iFrame/sandbox) this will return
      // only an empty array
      // for iFrames/sandbox, selector will be an array of ids from
      // which we have to construct our window element to postMessage to
      // http://bit.ly/12m3wJD
      // http://mzl.la/17EeDiN
      if (selector.length === 0) {
        targetWindow = window;
      } else {
        targetWindow = selector.reduce(function(tgt, o) {
          return tgt && tgt.getElementById(o).contentWindow;
        }, document);
      }
      // and request the service
      targetWindow.postMessage({
        "type": "run",
        "trackingId": trackingId,
        "service": event.data.service,
        "parameters": event.data.parameters
      }, window.location.href);
    }
  };

  // => check whether a service is available
  priv.findServiceInMap = function (requestedService, scope) {
    // scope... use for ???
    var i, service;
    for (i = 0; i < that.gadgetService.map.length; i += 1) {
      service = that.gadgetService.map[i];
      if (service.service === requestedService.service) {
        return service;
      }
    }
    return null;
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
      that.gadgetService.map.push(event.data);
    }
  };

  // => register gadget in index and tree
  priv.registerGadget = function (data, options) {
    // create index
    if (that.gadgetIndex === undefined) {
      priv.createGadgetIndex();
    }

    // create tree
    if (that.gadgetTree === undefined) {
      priv.createGadgetTree();
    }

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
      i,
      j;

    try {
      services = root.querySelectorAll('[data-service], link[type^=service]');

      for (i = 0; i < services.length; i += 1) {
        service = JSON.parse(priv.getAttribute(services[i], 'service'));
        for (j = 0; j < service.length; j += 1) {
          options = {
            "rel": service[j].rel,
            "type": service[j].type,
            "src": service[j].src || window.location.href.split("?")[0]
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
          "wrapper": gadget,
          "directory": spec
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
      element;

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
            if (element.getAttribute("type").split("/")[0] === "service") {
              $(element).addService({
                "src": element.getAttribute("src") ||
                  window.location.href.split("?")[0],
                "type": element.getAttribute("type"),
                "rel": element.getAttribute("rel")
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
        $(newHTML).prependTo(options.parent);
      }
      if (callback) {
        callback();
      }
      // find recursive gadgets
      $(newParentElement).findGadget();
      // find recursive services
      $(newParentElement).findService();
    } else {
      // IFRAME handler
      newHTML = document.createElement("iframe");
      newHTML.setAttribute(
        "src",
        options.src + "?base=" + priv.encodeURI(options.directory.root)
      );
      newHTML.setAttribute("frameborder", 0);
      newHTML.setAttribute("seamless", "seamless");
      newHTML.setAttribute("id", options.id);

      // append or replace
      if (options.wrapper) {
        newParentElement = options.parent[0] || options.parent;
        $(options.wrapper).replaceWith(newHTML);
      } else if (options.replaceParent) {
        newParentElement = options.parent.parent()[0];
        options.parent.replaceWith(newHTML);
      } else {
        newParentElement = options.parent;
        $(newHTML).prependTo(options.parent);
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
    var spec = priv.mapUrlString(window.location.search);

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

  // => publish a service to this instance (and root instance)
  that.addService = $.fn.addService = function (options) {
    var adressArray = window.location.href.split("?"), targetUrl;
    options.src = options.src || adressArray[0];

    // posts to URL passed (need for CORS?)
    // otherwise window.top.location.href) would also work
    if (adressArray.length === 1) {
      targetUrl = priv.decodeURI(adressArray[0]);
    } else {
      targetUrl = priv.decodeURI(adressArray[1].split("=")[1]);
    }
    window.top.postMessage(options, targetUrl);
  };

  // => request a service to be run
  that.requestService = $.fn.requestService = function (options) {
    // set type
    if (options.type === undefined) {
      options.type = "request/any";
    }
    window.top.postMessage(options, window.location.href);
  };

  // => load gadget 
  that.addGadget = $.fn.addGadget = function (options) {
    var adressArray = window.location.href.split("?");

    // set parent
    if (this[0] === document || this[0] === window) {
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
    // set directory (root)
    // if no ?-param is available, we can only set to href
    if (options.directory === undefined) {
      if (adressArray.length > 1) {
        options.directory = {
          "root": priv.decodeURI(adressArray[1].split("=")[1])
        };
      } else {
        options.directory = {
          "root": that.gadgetService ?
              that.gadgetService.root :
              window.location.href
        };
      }
    }
    // set offline
    // set cors

    // LOADING
    // module
    if (options.module && require !== undefined) {
      require([priv.extractModuleName(options.src)], function (response) {
        priv.appendGadget(response, options);
      });
    // iFrame
    } else if (options.iframe) {
      priv.appendGadget(undefined, options);
    // via Ajax (default)
    } else {
      $.ajax({
        url: options.src,
        // not sure this is helpful or not
        cache: true,
        method: options.method || "GET",
        success: function (data) {
          priv.appendGadget(data, options);
        },
        error: function (error, status, message) {
          console.log(error);
          console.log(status);
          console.log(message);
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
}(jQuery, window));
