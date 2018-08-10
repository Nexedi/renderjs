/*
 * Copyright 2014, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */
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
    .declareAcquiredMethod('willFail', 'willFail')
    .declareService(function () {
      var context = this;
      return RSVP.all([
        context.checkAcquisitionError(),
        context.checkKlass()
      ]);
    })
    .declareMethod('checkAcquisitionError', function () {
      var g = this;
      return g.willFail()
        .push(undefined, function (e) {
          g.props.element.querySelector('.acquisitionError')
            .innerHTML = e;
        });
    })
    .declareMethod('checkKlass', function () {
      var g = this;
      g.props.element.querySelector('.klass')
        .innerHTML = "klass" +
        ((g instanceof window.__RenderJSEmbeddedGadget) ?
            " = embedded" : " != embedded");
    });
}(window, rJS));
