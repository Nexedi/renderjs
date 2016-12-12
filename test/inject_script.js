/*jslint nomen: true*/


// can't use RSVP here because its not loaded (neccessarily)
function inject_script(src, resolve) {
  // inject RSVP
  var script = document.createElement("script");
  script.onload = function() {
    resolve();
  };
  script.src = src;
  document.head.appendChild(script);
}
