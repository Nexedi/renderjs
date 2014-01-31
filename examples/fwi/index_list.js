/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$) {
  /**
   * Web site configurations
   */
  var gk = rJS(window);

  /* Initialize Page List */
  gk.declareMethod('setDocumentList', function (document_list) {
    var i,
    document,
    index_list_panel = $('#index_list');
    for (i = 0; i < document_list.length; i += 1) {
      document = document_list[i].doc;
      index_list_panel.append(
	"<li><a href=#>"
	  + document.title 
	  + "</a></li>");
      //panel_context.find('a').last().click(
      //  createLoadNewBlogCallback(
      //    g, blog_definition.path,
      //    blog_a_context, io_list[0].path, io_blog_a_context)
      //    );
    }
  });
}(window, rJS, jQuery));