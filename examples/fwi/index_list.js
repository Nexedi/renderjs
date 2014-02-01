/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$, RSVP) {
  /**
   * Web site configurations
   */
  var gk = rJS(window);

  /* Initialize Page List */
  gk.declareMethod('setDocumentList', function (document_list, editor, editor_callback, property, property_callback) {
    var i,
    document,
    index_list_panel = $('#index_list');
    for (i = 0; i < document_list.length; i += 1) {
      document = $.extend({}, document_list[i].doc);
      index_list_panel.append(
	"<li><a href=#>"
	  + document.title 
	  + "</a></li>");
      index_list_panel.find('a').last().click(function(){
	RSVP.all([
	  editor_callback.apply(editor,[document.text_content]),
	  property_callback.apply(property, [document])
	])}
      );
    }
  });
}(window, rJS, jQuery, RSVP));