(function (window, $, jIO, rJS, RSVP) {
  "use strict";

  var gk = rJS(window);

  gk.declareMethod('configureIO', function (config) {
    this.jio = jIO.createJIO(config);
  })
    .declareMethod('getIOList', function () {
      var gadget = this;
      // Should use index storage
      return gadget.jio.allDocs({
        "include_docs": true
      }).then(function (response) {
        return response.data.rows;
      });
    })
    .declareMethod('getIO', function (key) {
      var gadget = this;
      return gadget.jio.get({
        "_id": key,
      }).then(function (response) {
        return response.data;
      });
    })

    .declareMethod('setIO', function (document) {
      var gadget = this;
      return gadget.jio.put(document);
    })

    .declareMethod('configureDataSourceCallback',
		   function (form, form_callback) {
      var g = this;
      $(g.element).find('a').unbind('click').click(function () {
	RSVP.all([
          form_callback.apply(form),
	])
	  .then(function (result_list) {
	    var document = result_list[0];
            return g.setIO(document);
        });
      });
    });

}(window, jQuery, jIO, rJS, RSVP));
