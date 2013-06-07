/*global document, jQuery */
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

  var generateUuid = function () {
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

  var handler = function (event) {
    // prevent registrations to renderJs from triggering here
    var type = event.data.type,
      service,
      scope,
      request;

    if (type === undefined) {
      $.ajax({
        method: "GET",
        url: event.data,
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("request failed: " + errorThrown);
        },
        success: function (value, textStatus, jqXHR) {
          // we now have the URL to handle and the method
          // to request. We need to POST this, because
          // we can't access renderJS.gadgetService from here...
          // when optimizing all the secondary ajax calls should be removed
          // question also is, whether we need POST at all, if we could
          // pass everything through the URL?
          scope = value._links.self.href.split("/").slice(0,-1).pop();
          service = {
            "service" : value._links.self.href.split(/[/]+/).pop(),
            "parameters" : [value._links.request.href],
            "scope" : scope
          }
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

//       var frames = document.getElementsByTagName("iframe"), frame, i;
//       for (i = 0; i < frames.length; i += 1) {
//         frame = frames[i];
//         if (myIndexOf(
//           event.source.location.pathname,
//           frame.getAttribute("src").split("?")[0]
//         ) < 0) {
//           frame.contentWindow.postMessage(event.data, "*");
//         }
//       }
    }
  };

  var mapUrl = function (searchString) {
    var fileToDisplay = getParameter(searchString, "file"),
      browserAPI,
      previewAPI;

    if (fileToDisplay) {
      $.ajax({
        method: 'GET',
        // XXX Hardcoded
        url: fileToDisplay,
        context: $('body'),
        error: function (jqXHR, textStatus, errorThrown) {
          $(this).text(errorThrown);
        },
        success: function (value, textStatus, jqXHR) {
          var access;
          // detour to request, while working on the 2nd preview window
          if (value._links.target.href === "preview_by_postmessage.html") {
            access = "request";
          } else {
            access = "plumb";
          }

          // merge again once working!
          browserAPI = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href: value._links.scope.href},
              scope: {href: value._links.scope.href},
              display: {href: 'browser://' + access + '/parentwindow/'},
              // pass API-url so child can call parent
              call: {href:'browser://call/{method}/{scope}/{interaction}'}
            }}));

          previewAPI = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href:''},
              scope: {href: value._links.scope.href},
              display: {href: ''},
              call: {href:'browser://call/{method}/{scope}/{interaction}'}
            }}));

          $("body").html(
            '<iframe src="' +
            // XXX Hardcoded gadget to load
            'filebrowser.html?file=' + browserAPI +
            '" id="' + generateUuid() +
            '">' +
            '<p>Your browser does not support iframes.</p>' +
            '</iframe">');

          $("body").append(
            '<iframe src="' +
            // XXX Hardcoded gadget to load
            value._links.target.href + '?file=' + previewAPI +
            '" id="' + generateUuid() +
            '">' +
            '<p>Your browser does not support iframes.</p>' +
            '</iframe">');
        }
      });
    } else {
      $("body").text("No parameter found in url");
    }
  };

  $(document).ready(function () {
    var search = window.location.search;
    if (search) {
      mapUrl(search.slice(1));
    } else {
      $("body").text("No parameter found in url");
    }

    if (window.addEventListener){
      window.addEventListener("message", handler, false)
    } else {
      window.attachEvent("onmessage", handler)
    }
  });

}(document, jQuery));
