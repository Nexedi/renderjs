/*global window, rJS, StatelessJS, RSVP, alert, console, XMLHttpRequest */
/*jslint maxlen:120, nomen: true */
(function(location, rJS, $) {
    "use strict";
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;
    function generateUuid() {
        function S4() {
            return ("0000" + Math.floor(Math.random() * 65536).toString(16)).slice(-4);
        }
        return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
    }
    var app = StatelessJS.App(), root_gadget, // XXX Hardcoded gadget
    // editor_gadget_url = "http://git.erp5.org/gitweb/officejs.git/blob_plain/" +
    //   "refs/heads/jqs:/src/gadget/bootstrap-wysiwyg.html",
    // editor_gadget_url = "http://192.168.242.82:8001/src/gadget/jqs.html",
    editor_gadget_url = "http://git.erp5.org/gitweb/renderjs.git/blob_plain/" + "refs/heads/presentation:/examples/officejs/presentation-editor/index.html?js=1", display_gadget_url = "http://git.erp5.org/gitweb/renderjs.git/blob_plain/" + "refs/heads/presentation:/examples/officejs/presentation-viewer/index.html?js=1", // XXX Hardcoded storage
    jio_storage = jIO.createJIO({
        type: "local",
        username: editor_gadget_url,
        application_name: editor_gadget_url
    });
    ///////////////////////////////////////////////
    // Default view
    ///////////////////////////////////////////////
    app.add_url_rule("default", "#", function() {
        location.replace(app.url_for("display_list", "GET"));
    });
    ///////////////////////////////////////////////
    // Display erp5 site
    ///////////////////////////////////////////////
    app.add_url_rule("display_list", "#/filelist/", function() {
        return RSVP.Queue().push(function() {
            return jio_storage.allDocs();
        }).push(function(response) {
            var element = document.getElementById("mainarticle"), list, entry, link, data = response.data, i;
            // XXX Clear content
            document.getElementById("mainarticle").innerHTML = "";
            if (data.total_rows === 0) {
                element.textContent = "No results found.";
            } else {
                list = document.createElement("ul");
                list.setAttribute("data-role", "listview");
                for (i = 0; i < data.total_rows; i += 1) {
                    entry = document.createElement("li");
                    link = document.createElement("a");
                    link.textContent = data.rows[i].id;
                    link.href = app.url_for("edit_file", "GET", {
                        id: data.rows[i].id
                    });
                    entry.appendChild(link);
                    list.appendChild(entry);
                }
                element.appendChild(list);
                $(element).enhanceWithin();
            }
        });
    });
    app.add_url_rule("view_file", "#/view/{id}", function(options) {
        var id = options.id, gadget;
        return new RSVP.Queue().push(function() {
            // XXX Clear content
            document.getElementById("mainarticle").innerHTML = "";
            return RSVP.all([ // Load the content
            jio_storage.get({
                _id: id
            }), // Load the gadget
            root_gadget.declareGadget(display_gadget_url, {
                sandbox: "iframe",
                element: document.getElementById("mainarticle")
            }) ]);
        }).push(function(result_list) {
            var doc = result_list[0];
            gadget = result_list[1];
            // XXX Howto make it fullscreen?
            gadget.element.getElementsByTagName("iframe")[0].style.height = window.innerHeight - 150 + "px";
            if (doc.data.content !== "") {
                return gadget.setContent(doc.data.content);
            }
        }).push(function() {
            var display_link = document.createElement("a");
            display_link.href = app.url_for("edit_file", "GET", {
                id: id
            });
            display_link.innerHTML = "Edit";
            document.getElementById("mainarticle").appendChild(display_link);
            $(document.getElementById("mainarticle")).enhanceWithin();
        });
    });
    app.add_url_rule("edit_file", "#/edit/{id}", function(options) {
        var id = options.id, gadget;
        return new RSVP.Queue().push(function() {
            // XXX Clear content
            document.getElementById("mainarticle").innerHTML = "";
            return RSVP.all([ // Load the content
            jio_storage.get({
                _id: id
            }), // Load the gadget
            root_gadget.declareGadget(editor_gadget_url, {
                sandbox: "iframe",
                element: document.getElementById("mainarticle")
            }) ]);
        }).push(function(result_list) {
            var doc = result_list[0];
            gadget = result_list[1];
            // XXX Howto make it fullscreen?
            gadget.element.getElementsByTagName("iframe")[0].style.height = window.innerHeight - 150 + "px";
            if (doc.data.content !== "") {
                return gadget.setContent(doc.data.content);
            }
        }).push(function() {
            var form1 = document.createElement("form"), form2 = document.createElement("form"), display_link = document.createElement("a");
            form1.id = "save";
            form2.id = "delete";
            // XXX Add save button
            form1.innerHTML = "<input data-role='button' data-inline='true' type='submit' value='Save' />";
            form2.innerHTML = "<input data-role='button' data-inline='true' type='submit' value='Delete' />";
            display_link.href = app.url_for("view_file", "GET", {
                id: id
            });
            display_link.innerHTML = "Display";
            document.getElementById("mainarticle").appendChild(form1);
            document.getElementById("mainarticle").appendChild(form2);
            document.getElementById("mainarticle").appendChild(display_link);
            $(document.getElementById("mainarticle")).enhanceWithin();
            return RSVP.all([ StatelessJS.loopEventListener(document.getElementById("save"), "submit", true, function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                return gadget.getContent().then(function(content) {
                    return jio_storage.put({
                        _id: id,
                        content: content
                    });
                });
            }), // XXX No need to loop
            StatelessJS.loopEventListener(document.getElementById("delete"), "submit", true, function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                return jio_storage.remove({
                    _id: id
                }).then(function() {
                    location.replace(app.url_for("display_list", "GET"));
                });
            }) ]);
        });
    });
    app.add_url_rule("new_file", "#/new/", function() {
        var new_id = generateUuid();
        document.getElementById("mainarticle").focus();
        return new RSVP.Queue().push(function() {
            return jio_storage.post({
                _id: new_id,
                // XXX
                content: ""
            });
        }).push(function() {
            location.replace(app.url_for("edit_file", "GET", {
                id: new_id
            }));
        });
    });
    rJS(window).ready(function(gadget) {
        root_gadget = gadget;
        // XXX Make it autoreload
        document.getElementById("newdoc").href = app.url_for("new_file", "GET");
        // XXX Remove focus from newfile link
        // http://perishablepress.com/
        //   unobtrusive-javascript-remove-link-focus-dotted-border-outlines/
        var i;
        for (i in document.links) {
            if (document.links.hasOwnProperty(i)) {
                document.links[i].onfocus = document.links[i].blur;
            }
        }
        StatelessJS.run(app).fail(function(e) {
            if (e.constructor === XMLHttpRequest) {
                console.warn(e);
                e = {
                    readyState: e.readyState,
                    status: e.status,
                    statusText: e.statusText,
                    response_headers: e.getAllResponseHeaders()
                };
            }
            if (e.constructor === Array || e.constructor === String || e.constructor === Object) {
                try {
                    e = JSON.stringify(e);
                } catch (exception) {
                    console.log(exception);
                }
            }
            console.warn(e);
            document.getElementsByTagName("body")[0].textContent = e;
        });
    });
})(window.location, rJS, jQuery);