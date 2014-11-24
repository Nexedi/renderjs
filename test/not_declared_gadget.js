/*jslint nomen: true*/
(function (window, rJS) {
  "use strict";
  var gk = rJS(window);
  gk.ready(function (g) {
    g.props = {};
    return g.getElement()
      .push(function (element) {
        g.props.element = element;
      });
  })
    .declareAcquiredMethod('getTopURL', 'getTopURL')
    .declareAcquiredMethod('willFail', 'willFail')
    .declareService(function () {
      var context = this;
      return RSVP.all([
        context.checkTopUrl(),
        context.checkAcquisitionError(),
        context.checkKlass()
      ]);
    })
    .declareMethod('checkTopUrl', function () {
      var g = this;
      return g.getTopURL()
        .push(function (top_url) {
          g.props.element.querySelector('.getTopUrl')
            .innerHTML = top_url; 
        });
    })
    .declareMethod('checkAcquisitionError', function () {
      var g = this;
      return g.willFail()
        .push(undefined , function (e) {
          g.props.element.querySelector('.acquisitionError')
            .innerHTML = e; 
        });
    })
    .declareMethod('checkKlass', function () {
      var g = this;
      g.props.element.querySelector('.klass')
        .innerHTML = "klass" +
        ((g instanceof window.__RenderJSEmbeddedGadget)? " = embedded" : " != embedded");
    });
}(window, rJS));