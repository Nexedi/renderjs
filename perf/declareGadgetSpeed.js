/*jslint nomen: true*/
(function (window, rJS) {
  "use strict";

  rJS(window)
    /*
    .declareService(function () {
      var list = [],
        i;
      for (i = 0; i < 10000; i += 1) {
        // list.push(document.createElement('div'));
        list.push(new RSVP.Queue());
      }
      this._list = list;
      console.log('lala3');
      return RSVP.all(list);
    });
    */

    .declareService(function () {
      var gadget = this,
        count = 1000,
        total = 1 * count,
        now;
      return this.declareGadget('sub2.html')
        .push(function () {
          var promise_list = [],
            i;
          now = new Date();
          for (i = 0; i < count; i += 1) {
            promise_list.push(gadget.declareGadget('sub2.html'));
          }
          gadget.element.textContent = 'Creating ' + total + ' gadgets...';
          return RSVP.all(promise_list);
        })
        .push(function () {
          var stop = new Date(),
            diff = stop.getTime() - now.getTime(),
            duration =  Math.abs(diff / 1000);
          gadget.element.textContent = total + ' gadgets created in ' + duration + 's (' + diff / total + 'ms)';
        });
    });

}(window, rJS));
