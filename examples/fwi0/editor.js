(function (window, rJS) {
  "use strict";


  var gk = rJS(window);

  gk.declareMethod('setContent', function (value) {
    console.log(this);
    this.element.getElementsByTagName('textarea')[0].value =
      value;
  })
    .declareMethod('getContent', function () {
      return this.element.getElementsByTagName('textarea')[0].value;
    });

}(window, rJS));
