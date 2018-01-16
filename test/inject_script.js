(function (document) {
  "use strict";

  // can't use RSVP here because its not loaded (neccessarily)
  window.inject_script = function (src, resolve) {
    // inject RSVP
    var script = document.createElement("script");
    script.onload = function () {
      resolve();
    };
    script.src = src;
    document.head.appendChild(script);
  };

}(document));