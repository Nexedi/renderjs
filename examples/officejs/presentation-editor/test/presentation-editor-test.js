/*global window, document, QUnit, jQuery, RenderJSGadget*/

(function ($, QUnit, RenderJSGadget) {
  "use strict";

  QUnit.config.testTimeout = 10000;
  
  var asyncTest = QUnit.asyncTest,
    start = QUnit.start,
    equal = QUnit.equal,
    presentationEditorURL = '../index.html';

  function ifr$(selector) {
    return $('iframe').contents().find(selector);
  }
  
  asyncTest("[Presentation editor] set title slide (iframed)", 1, function () {
    var g = new RenderJSGadget(),
      gadgetContext = document.getElementById('qunit-fixture');

    g.declareGadget(presentationEditorURL,
                    {sandbox: "iframe", element: gadgetContext})
      .then(function (gadget){
        var content = "<section><h1>TestTitle</h1></section>";
        return gadget.setContent(content);
      })
      .then(function (){
        var expected = ifr$("#slide-list section h1")[0].textContent;
        equal(expected, "TestTitle");
      })
      .always(start);
  });
  
}(jQuery, QUnit, RenderJSGadget));
