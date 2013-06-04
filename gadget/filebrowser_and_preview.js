/*global document, jQuery */
// filebrowser.html?file=browser%3A%2F%2Fbrowse%2Fls%2F
"use strict";
(function (document, $) {

  var myIndexOf = function (path, contains) {
    var len = path.length;
    var wordLen = contains.length;
    for(var i = 0; i < len; i++) {
      var j = 0;
      for(j = 0; j < wordLen; j++) {
        if(path[i+j] != contains[j]) {
            break;
        }
      }
      if(j == wordLen) {
        return i;
      }
    }
    return -1;
  };

  var getParameter = function(searchString, paramName) {
    var i, val, params = searchString.split("&");

    for (i=0;i<params.length;i++) {
      val = params[i].split("=");
      if (val[0] == paramName) {
        return decodeURIComponent(val[1]);
      }
    }
    return null;
  };

  // this is our "interactor", it only knows one other iFrame
  // so we post to this one!
  var handler = function (event) {
    var frames = document.getElementsByTagName("iframe"), frame, i;
    for (i = 0; i < frames.length; i += 1) {
      frame = frames[i];
      if (myIndexOf(
        event.source.location.pathname,
        frame.getAttribute("src").split("?")[0]
      ) < 0) {
        frame.contentWindow.postMessage(event.data, "*");
        // frame.contentWindow.postMessage(event.data, window.location.href);
      }
    }
  };

  var mapUrl = function (url) {
    var searchString = url.href.split("?")[1],
      fileToDisplay, fileToDisplayData;

    if (searchString) {
      fileToDisplay = getParameter(searchString, "file");
      fileToDisplayData = "data://application/hal+json;base64," + 
        window.btoa(JSON.stringify({
        _links: {
          self: {href: 'browser://browse/ls/'},
          storage: {href: 'browser://browse/ls/'},
          display: {href: 'browser://plumb/parentwindow/'},
        }}));

      if (fileToDisplay) {

        $("body").html(
          '<iframe src="' +
          // XXX Hardcoded gadget to load
          'filebrowser.html?file=' + fileToDisplayData +
          '">' +
          '<p>Your browser does not support iframes.</p>' +
          '</iframe">');

        $("body").append(
          '<iframe src="' +
          // XXX Hardcoded gadget to load
          'preview.html' +
          '">' +
          '<p>Your browser does not support iframes.</p>' +
          '</iframe">');

      } else {
        $("body").text("No parameter found in url");
      }
    } else {
      $("body").text("No parameter found in url (2)");
    }
  };

  $(document).ready(function () {
    mapUrl(window.location);

    if (window.addEventListener){
      window.addEventListener("message", handler, false)
    } else {
      window.attachEvent("onmessage", handler)
    }
  });

}(document, jQuery));
