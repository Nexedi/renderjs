/*global Aloha */
(function (window, rJS, Aloha,$) {
    "use strict";
    var gk = rJS(window);

    gk.declareMethod('setContent', function (value) {
	$('#editor').empty().append(value);
    })
	.declareMethod('getContent', function () {
	    return $('#editor').html();
	});

    gk.ready(function (g) {
        Aloha.ready( function() {
            Aloha.jQuery('#editor').aloha();
        });
    });

}(window, rJS, Aloha, jQuery));