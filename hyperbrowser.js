/*global window, XMLHttpRequest */
/**
 * BrowserHttpRequest is a XMLHttpRequest wrapper to
 * provide a new custom protocol used to map browser API
 *
 * Based on BrowserHttpRequest
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 *
 * Copyright 2013, Romain Courteaud
 */
"use strict";
(function (window, XMLHttpRequest) {

  var unsafeHeaders = {
    "Accept-Charset": true,
    "Accept-Encoding": true,
    "Connection": true,
    "Content-Length": true,
    "Cookie": true,
    "Cookie2": true,
    "Content-Transfer-Encoding": true,
    "Date": true,
    "Expect": true,
    "Host": true,
    "Keep-Alive": true,
    "Referer": true,
    "TE": true,
    "Trailer": true,
    "Transfer-Encoding": true,
    "Upgrade": true,
    "User-Agent": true,
    "Via": true
  };

  function BrowserHttpRequest() {
    this.readyState = BrowserHttpRequest.UNSENT;
    this.requestHeaders = {};
    this.requestBody = null;
    this.status = 0;
    this.statusText = "";
//
//     var xhr = this;
//
//     ["loadstart", "load", "abort", "loadend"].forEach(function (eventName) {
//         xhr.addEventListener(eventName, function (event) {
//             var listener = xhr["on" + eventName];
//
//             if (listener && typeof listener == "function") {
//                 listener(event);
//             }
//         });
//     });
//
  }

  function verifyState(xhr) {
    if (xhr.readyState !== BrowserHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR");
    }

    if (xhr.sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }
  }

//   // filtering to enable a white-list version of Sinon FakeXhr,
//   // where whitelisted requests are passed through to real XHR
//   function each(collection, callback) {
//       if (!collection) return;
//       for (var i = 0, l = collection.length; i < l; i += 1) {
//           callback(collection[i]);
//       }
//   }
//   function some(collection, callback) {
//       for (var index = 0; index < collection.length; index++) {
//           if(callback(collection[index]) === true) return true;
//       };
//       return false;
//   }
//
//   BrowserHttpRequest.filters = [];
//   BrowserHttpRequest.addFilter = function(fn) {
//       this.filters.push(fn)
//   };

  function verifyRequestSent(xhr) {
    if (xhr.readyState === BrowserHttpRequest.DONE) {
      throw new Error("Request done");
    }
  }

  function verifyHeadersReceived(xhr) {
    if (xhr.async && xhr.readyState !==
                BrowserHttpRequest.HEADERS_RECEIVED) {
      throw new Error("No headers received");
    }
  }

  BrowserHttpRequest.prototype.async = true;

  //////////////////////////////////////////////////
  // Client side
  //////////////////////////////////////////////////
  BrowserHttpRequest.prototype.open = function (
    method,
    url,
    async,
    username,
    password
  ) {
    this.method = method;
    this.url = url;
    this.async = typeof async === "boolean" ? async : true;
    this.username = username;
    this.password = password;
    this.responseText = null;
    this.responseXML = null;
    this.requestHeaders = {};
    this.sendFlag = false;
    this.readyStateChange(BrowserHttpRequest.OPENED);
  };

  BrowserHttpRequest.prototype.readyStateChange = function (state) {
    this.readyState = state;

    if (typeof this.onreadystatechange === "function") {
      try {
        this.onreadystatechange();
      } catch (e) {
        return;
//        sinon.logError("Fake XHR onreadystatechange handler", e);
      }
    }

//    this.dispatchEvent(new sinon.Event("readystatechange"));
//
//    switch (this.readyState) {
//        case BrowserHttpRequest.DONE:
//            this.dispatchEvent(new sinon.Event(
//              "load", false, false, this));
//            this.dispatchEvent(new sinon.Event(
//              "loadend", false, false, this));
//            break;
//    }
  };

  BrowserHttpRequest.prototype.setRequestHeader = function (header, value) {
    verifyState(this);

    if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
      throw new Error("Refused to set unsafe header \"" + header + "\"");
    }

    if (this.requestHeaders[header]) {
      this.requestHeaders[header] += "," + value;
    } else {
      this.requestHeaders[header] = value;
    }
  };

  BrowserHttpRequest.prototype.send = function (data) {
    // Currently treats ALL data as a DOMString (i.e. no Document)
    verifyState(this);

    if (!/^(get|head)$/i.test(this.method)) {
      if (this.requestHeaders["Content-Type"]) {
        var value = this.requestHeaders["Content-Type"].split(";");
        this.requestHeaders["Content-Type"] = value[0] + ";charset=utf-8";
      } else {
        this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
      }

      this.requestBody = data;
    }

    this.errorFlag = false;
    this.sendFlag = this.async;
//    this.readyState = BrowserHttpRequest.OPENED;
    this.readyStateChange(BrowserHttpRequest.OPENED);

    if (typeof this.onSend === "function") {
      // XXX Make it asynchronous? (using setTimeout)
      this.onSend(this);
    }

    if (typeof this.dispatch === "function") {
      // XXX Make it asynchronous? (using setTimeout)
      this.dispatch();
    }

//    this.dispatchEvent(new sinon.Event(
//      "loadstart", false, false, this));
  };

  BrowserHttpRequest.prototype.getResponseHeader = function (header) {
    var h;
    if (this.readyState < BrowserHttpRequest.HEADERS_RECEIVED) {
      return null;
    }

//    if (/^Set-Cookie2?$/i.test(header)) {
//      return null;
//    }

    header = header.toLowerCase();

    for (h in this.responseHeaders) {
      if (this.responseHeaders.hasOwnProperty(h)) {
        if (h.toLowerCase() === header) {
          return this.responseHeaders[h];
        }
      }
    }

    return null;
  };

  BrowserHttpRequest.prototype.getAllResponseHeaders = function () {
    if (this.readyState < BrowserHttpRequest.HEADERS_RECEIVED) {
      return "";
    }

    var headers = "",
      header;

    for (header in this.responseHeaders) {
      if (this.responseHeaders.hasOwnProperty(header) &&
          !/^Set-Cookie2?$/i.test(header)) {
        headers += header + ": " +
          this.responseHeaders[header] + "\r\n";
      }
    }

    return headers;
  };

  //////////////////////////////////////////////////
  // Server side
  //////////////////////////////////////////////////
  BrowserHttpRequest.prototype.setResponseHeaders = function (headers) {
    var header;
    this.responseHeaders = {};

    for (header in headers) {
      if (headers.hasOwnProperty(header)) {
        this.responseHeaders[header] = headers[header];
      }
    }

    if (this.async) {
      this.readyStateChange(BrowserHttpRequest.HEADERS_RECEIVED);
    } else {
      this.readyState = BrowserHttpRequest.HEADERS_RECEIVED;
    }
  };

  BrowserHttpRequest.prototype.setResponseBody = function (body) {
    verifyRequestSent(this);
    verifyHeadersReceived(this);

    var chunkSize = this.chunkSize || 10,
      index = 0,
      type;
    this.responseText = "";

    do {
      if (this.async) {
        this.readyStateChange(BrowserHttpRequest.LOADING);
      }

      this.responseText += body.substring(index, index + chunkSize);
      index += chunkSize;
    } while (index < body.length);

    type = this.getResponseHeader("Content-Type");

//    if (this.responseText &&
//        (!type || /(text\/xml)|
//          (application\/xml)|(\+xml)/.test(type))) {
//        try {
//            this.responseXML =
//              BrowserHttpRequest.parseXML(this.responseText);
//        } catch (e) {
//            // Unable to parse XML - no biggie
//        }
//    }

    if (this.async) {
      this.readyStateChange(BrowserHttpRequest.DONE);
    } else {
      this.readyState = BrowserHttpRequest.DONE;
    }
  };

  BrowserHttpRequest.prototype.respond = function (status, headers, body) {
    this.setResponseHeaders(headers || {});
    this.status = typeof status === "number" ? status : 200;
    this.statusText = BrowserHttpRequest.statusCodes[this.status];
    this.setResponseBody(body || "");
    if (typeof this.onload === "function") {
      this.onload();
    }
  };

  BrowserHttpRequest.prototype.abort = function () {
    this.aborted = true;
    this.responseText = null;
    this.errorFlag = true;
    this.requestHeaders = {};

    if (this.readyState >
          BrowserHttpRequest.UNSENT && this.sendFlag) {
      this.readyStateChange(BrowserHttpRequest.DONE);
      this.sendFlag = false;
    }

    this.readyState = BrowserHttpRequest.UNSENT;

//    this.dispatchEvent(new sinon.Event("abort", false, false, this));
    if (typeof this.onerror === "function") {
      this.onerror();
    }
  };

//   sinon.extend(BrowserHttpRequest.prototype, sinon.EventTarget, {
//
//       // Helps testing


  BrowserHttpRequest.UNSENT = 0;
  BrowserHttpRequest.OPENED = 1;
  BrowserHttpRequest.HEADERS_RECEIVED = 2;
  BrowserHttpRequest.LOADING = 3;
  BrowserHttpRequest.DONE = 4;

  BrowserHttpRequest.statusCodes = {
    100: "Continue",
    101: "Switching Protocols",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    300: "Multiple Choice",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported"
  };

  window.BrowserHttpRequest = BrowserHttpRequest;

}(window, XMLHttpRequest));
