/*jslint indent: 2 */
/*global EventEmitter, RSVP, jIO */
(function (window, rJS,$) {
    /**
     * Web site configurations
     */
    var gk = rJS(window);

    var loadAndDisplayIndexView = function () {
	var i, length, rows, row, page_list_html = "<ul>";
	rows = this.page_list.data.rows;
	length = rows.length;
	for (i = 0; i < length; i += 1) {
	    page_list_html += "<li><a href=\"#" + rows[i].doc.title.replace(/"/g, "\\\"") +
		"\">" + rows[i].doc.title + "</a></li>";
	}
	page_list_html += "</ul>";
	place.index.dom.innerHTML = page_list_html;
    };

    var loadAndDisplayContentPage = function (value) {
	var i; //,
	//rows = this.page_list.data.rows,
	//length = rows.length;
	//for (i = 0; i < length; i += 1) {
	//if (rows[i].doc.title === page_title) {
	//	// show page
	$("#content").empty().append(value);
	//place.content.dom.innerHTML = rows[i].doc.text_content;
	//	return;
	//    }
	//}
	//place.content.dom.innerHTML = "<p>404</p>";
    };

    /* Initialize Page List */
    gk.declareMethod('setPageList', function (page_list) {
	this.page_list = page_list;
    });

    gk.declareMethod('displayHTML', function (value) {
	this.value = value;
	loadAndDisplayContentPage(value);
    });

    /**
     * Run the web site runtime
     */
    gk.ready(function (g) {
	console.log('run-blog');
    });

}(window, rJS, jQuery));