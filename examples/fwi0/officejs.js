/*global console */
(function (window, $, rJS, RSVP) {
  "use strict";
  var jio_config = {
    "type": "local",
    "username": "taboule",
    "application_name": "renderjs"
  };
  function attachIOToForm(all_param, io, editor_path) {
    var form = all_param[0];
    $(io.element).trigger('create');
    $(form.element).trigger('create');
    return form.setEditor(editor_path)
      .then(function () {
	return io.configureIO(jio_config)
      })
      .then(function () {
        return io.getIOList().fail(function (error) {
          if (error.status === 404) {
            return "";
          }
          throw error;
        });
      })
      .then(function (document_list) {
        return RSVP.all([
	  form.setContent(document_list[0].doc),
	  io.configureDataSourceCallback(
	    form, form.getContent)
	]);
      });
  }


  function handleError(rejectedReason) {
    var word_list;
    console.warn(rejectedReason);
    if (rejectedReason instanceof Error) {
      word_list = rejectedReason.toString();
    } else {
      word_list = JSON.stringify(rejectedReason);
    }
    // XXX Escape text
    document.getElementsByTagName('body')[0].innerHTML = word_list;
    throw rejectedReason;
  }

  function createLoadNewEditorCallback(g, form_path, f_c, editor_path, io, io_context) {
    return function () {
      f_c.empty();
      return RSVP.all([
        g.declareGadget(form_path),
      ])
        .then(function (all_param) {
          io_context[0].appendChild(io.element);
          f_c[0].appendChild(all_param[0].element);
          return all_param[0].setForm()
	    .then( function (){
	      attachIOToForm(all_param, io, editor_path);
	    })
        })
        .fail(handleError);
    };
  }

  rJS(window).ready(function (g) {
    var io_a_context = $(g.element).find(".form_a_safe").last(),
    io_blog_a_context = $(g.element).find(".form_a_safe").last(),
    blog_a_context = $(g.element).find(".form_a").last(),
    form_a_context = $(g.element).find(".form_a").last(),
    io
    ;
    // First, load the catalog gadget
    g.declareGadget('./io.html')
      .then(function (gadget) {
        io = gadget;
        io_blog_a_context.empty();
        return io.configureIO(jio_config)
      })
      .then(function () {
        return io.getIOList().fail(function (error) {
          if (error.status === 404) {
            return "";
          }
          throw error;
        });
      })
    // If no initial page, set-up one
      .then(function (initial_document_list) {
        console.log(initial_document_list);
        if ( initial_document_list.length === 0 ){
          return io.setIO({
            '_id': 'main.html',
            'text_content': '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><script src="http://softinst48446.host.vifib.net/fwi/node_modules/rsvp/dist/rsvp-2.0.4.js" type="text/javascript"></script><script src="http://softinst48446.host.vifib.net/fwi/dist/renderjs-latest.js" type="text/javascript"></script><script type="text/javascript">(function (window, rJS) {"use strict";  var gk = rJS(window);}(window, rJS));</script></head><body></body></html>',
            'reference': 'main.html',
            'title': 'My Main Page'
          }).then(function () {
            return io.getIOList();
          })
        }
        return initial_document_list;
      })
    // Set up page
      .then(function (document_list) {
        var doc = document_list[0].doc,
        data_uri = 'data:text/html;base64,';
        data_uri += window.btoa(unescape(encodeURIComponent(doc.text_content)))
        console.log('Getting ready');
        console.log(data_uri);
        return g.declareGadget(
	  data_uri,
	  {element: blog_a_context[0], sandbox: 'iframe'}
        )
      })
    // Prepare freedom button
      .then(function () {
        // Fill the panel
        var panel_context = $(g.element).find(".bare_panel");
        console.log('prepare panel');
        panel_context.append(
          '<a href="#" data-role="button" data-icon="edit" ' +
            'data-iconpos="left">Editor</a>'
        );
        panel_context.find('a').last().click(
          createLoadNewEditorCallback(
	    g, './form.html',
            form_a_context, './aceeditor.html',
	    io, io_a_context
	  )
        );
        panel_context.trigger('create');
      })
      .fail(handleError);

  });
}(window, jQuery, rJS, RSVP));
