/*global document, jQuery */
"use strict";
(function (document, $) {

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

          // merge again once working!
          browserAPI = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href:''},
              scope: {href: value._links.scope.href},
              call: {href:'browser://call/{method}/{scope}/{interaction}'}
            }}));

          previewAPI = "data://application/hal+json;base64," +
            window.btoa(JSON.stringify({
            _links: {
              self: {href:''},
              scope: {href: value._links.scope.href},
              call: {href:'browser://call/{method}/{scope}/{interaction}'}
            }}));

          $("body").addGadget({
            "src": 'filebrowser.html?file=' + browserAPI,
            "iframe": "true"
          });

          $("body").addGadget({
            "src": value._links.target.href + '?file=' + previewAPI,
            "iframe": "true"
          });
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
