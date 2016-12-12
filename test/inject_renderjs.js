/*jslint nomen: true*/

function test_iframe_append () {
  var tele = document.createTextNode(" . doing the loading . ");
  document.body.appendChild(tele);
}

// can't use RSVP here because its not loaded (neccessarily)
function test_inject_lib(libsrc, resolve) {
  // inject RSVP
  var script = document.createElement("script");
  script.onload = function() {
    resolve();
  };
  script.src = libsrc;
  document.body.appendChild(script);
}
