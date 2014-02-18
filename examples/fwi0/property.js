/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$) {
    /**
     * Web site configurations
     */
    var gk = rJS(window);

    /* Initialize Page List */
    gk.declareMethod('setContent', function (document) {
      var field,
      form_field;
      for (field in document) {
	if (document.hasOwnProperty(field)) {
	  form_field = $('#' + field);
	  if (form_field) {
	    form_field.attr('value', document[field]);
	  }
	}
      }
    });

    gk.declareMethod('getContent', function (value) {
      var result = {},
      property_value_list = $('#document-property').serializeArray(),
      i;
      for (i = 0; i < property_value_list.length; i += 1 ) {
	result[property_value_list[i].name] = property_value_list[i].value;
      }
      return result
    });
}(window, rJS, jQuery));