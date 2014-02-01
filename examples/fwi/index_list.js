/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$, RSVP) {
  /**
   * Web site configurations
   */
  var gk = rJS(window);

  /* Initialize Page List */
  gk.declareMethod('setDocumentList',
		   function (document_list,
			     form, form_callback,
			     io, io_callback) {
    var i,
    document,
    index_list_panel = $('#index_list');
    for (i = 0; i < document_list.length; i += 1) {
      document = $.extend({}, document_list[i].doc);
      index_list_panel.append(
	"<li><a href='#"
	  + document._id + "'>"
	  + document.title 
	  + "</a></li>");
      index_list_panel.find('a').last().click(function(){
	var current_id = this.hash.substr(1);
	return io_callback.apply(io, [current_id])
	  .then( function (data) {
	    form_callback.apply(form, [data])
	  })
      });
    }
  });
}(window, rJS, jQuery, RSVP));