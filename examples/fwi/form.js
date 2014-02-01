/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$, RSVP) {
  /**
   * Web site configurations
   */
  var gk = rJS(window),
  that,
  editor_context,
  property_context,
  current_document,
  editor,
  property;

  gk.declareMethod('setContent', function (value) {
    current_document = value;
    return RSVP.all([
      editor.setContent(value.text_content),
      property.setContent(value)
    ])
  })
    .declareMethod('getContent', function () {
      return RSVP.all([
        editor.getContent(),
	property.getContent()
      ])
	.then(function (result_list) {
	  var document = result_list[1];
	  document.text_content = result_list[0];
          return document;
        });
    })

    .declareMethod('setForm', function () {
      return that.declareGadget('./property.html')
	.then(function(gadget){
	  console.log('prepared property');
	  property = gadget;
	  console.log(property);
	  property_context = $('.property_a_safe').last();
	  editor_context = $('.editor_a').last();
	  console.log('property:');
	  console.log(property);
	  property_context[0].appendChild(property.element);
	})
	.fail(function(error){
	  console.log(error);
	})
    })

    .declareMethod('setEditor', function (editor_path) {
      var g = this;
      editor_context.empty();
      return g.declareGadget(
	editor_path,
	{element: editor_context[0], sandbox: 'iframe'}
      )
	.then(function(gadget){
	  editor = gadget;
	  $(editor.element).trigger('create');
	  if (current_document){
	    return editor.setContent(current_document.text_content); 
	  }
	})
      ;
    });

  gk.ready(function (g) {
    console.log('prepare form');
    that = g;
  });
}(window, rJS, jQuery, RSVP));