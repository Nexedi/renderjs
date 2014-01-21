(function (window, rJS) {
  "use strict";

  var gk = rJS(window);

  gk.ready(function (g) {
    return RSVP.delay(50).then(function () {
      throw new Error("Manually rejected");
    });
  });

}(window, rJS));
