/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$) {
    /**
     * Web site configurations
     */
    var gk = rJS(window);

    /* Initialize Page List */
    gk.declareMethod('setContent', function (value) {
	this.value = value;
	$("#post-content").empty().append(value.text_content);
    });

    /**
     * Run the web site runtime
     */
    gk.ready(function (g) {
	console.log('run-blog');
    });

}(window, rJS, jQuery));