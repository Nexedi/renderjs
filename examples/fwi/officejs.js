/*global console */
(function (window, $, rJS, RSVP) {
  "use strict";

  function attachIOToForm(all_param, editor_path) {
    var form = all_param[0],
    io = all_param[1],
    index = all_param[2],
    jio_config = {
      "type": "dropbox",
      "access_token": "v43SQLCEoi8AAAAAAAAAAVixCoMfDelgGj3NRPfEnqscAuNGp2LhoS8-GiAaDD4C"
    };
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
	  index.setDocumentList(
	    document_list,
	    form, form.setContent,
	    io, io.getIO),
	  io.configureDataSourceCallback(
	    form, form.getContent)
	]);
      });
  }

  function attachIOToBlog(all_param) {
    var blog = all_param[0],
      io = all_param[1],
      id = all_param[2],
      jio_config = {
          "type": "dropbox",
          "access_token": "v43SQLCEoi8AAAAAAAAAAVixCoMfDelgGj3NRPfEnqscAuNGp2LhoS8-GiAaDD4C"
      };
    $(blog.element).trigger('create');
      return io.configureIO(jio_config)
      .then(function () {
        return io.getIO('48c3ca06-78b9-2f4c-80db-d5cb2417de45').fail(function (error) {
          if (error.status === 404) {
            return "";
          }
          throw error;
        });
      })
      .then(function (document) {
        return blog.displayHTML(document.text_content);
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

  function createLoadNewEditorCallback(g, form_path, f_c, editor_path, io_path, i_c, index_path,  index_c) {
    return function () {
      f_c.empty();
      index_c.empty().attr("style","");
      return RSVP.all([
        g.declareGadget(form_path),
        g.declareGadget(io_path),
	g.declareGadget(index_path)
      ])
        .then(function (all_param) {
          i_c.empty();
          f_c[0].appendChild(all_param[0].element);
          i_c[0].appendChild(all_param[1].element);
          index_c[0].appendChild(all_param[2].element);
          return all_param[0].setForm()
	    .then( function (){
	      attachIOToForm(all_param, editor_path);
	    })
        })
        .fail(handleError);
    };
  }

  function createLoadNewBlogCallback(g, blog_path, e_c, io_path, i_c) {
    return function () {
      e_c.empty();
      i_c.empty();
      $('.sidebar').empty();
      return RSVP.all([
        g.declareGadget(blog_path, {element: e_c[0], sandbox: 'iframe'}),
        g.declareGadget(io_path),
        "officejs"
      ])
        .then(function (all_param) {
          return attachIOToBlog(all_param);
        })
        .fail(handleError);
    };
  }

  rJS(window).ready(function (g) {
    var io_a_context = $(g.element).find(".form_a_safe").last(),
      io_blog_a_context = $(g.element).find(".form_a_safe").last(),
    blog_a_context = $(g.element).find(".form_a").last(),
    form_a_context = $(g.element).find(".form_a").last(),
    index_a_context = $(g.element).find(".sidebar").last()
    ;
    // First, load the catalog gadget
    g.declareGadget('./catalog.html')
      .then(function (catalog) {
        // Fetch the list of editor and io gadgets
        // This is done in 2 different queries to the catalog
        return RSVP.all([
          catalog.allDocs(
            {query: 'interface: "http://www.renderjs.org/interface/editor"'}
          ),
          catalog.allDocs(
            {query: 'interface: "http://www.renderjs.org/interface/io"'}
          ),
          catalog.allDocs(
            {query: 'interface: "http://www.renderjs.org/interface/blog"'}
          ),
          catalog.allDocs(
            {query: 'interface: "http://www.renderjs.org/interface/property"'}
          ),
          catalog.allDocs(
            {query: 'interface: "http://www.renderjs.org/interface/index"'}
          )
        ]);
      })
      .then(function (all_list) {
        var panel_context = $(g.element).find(".bare_panel"),
        form_path = './form.html',
	editor_list = all_list[0],
        io_list = all_list[1],
	blog_list = all_list[2],
	index_list = all_list[4],
        editor_definition,
	blog_definition,
	index_definition = index_list[0].path,
        i;
        // Load 1 editor and 1 IO and plug them
        return RSVP.all([
          g.declareGadget(
            blog_list[0].path,
            {element: blog_a_context[0], sandbox: 'iframe'}
          ),
          g.declareGadget(io_list[0].path),// io_a_context),
          "officejs"
        ])
          .then(function (all_param) {
            io_blog_a_context.empty();
            return attachIOToBlog(all_param);
          })
          .then(function () {
            // Fill the panel
            for (i = 0; i < blog_list.length; i += 1) {
              blog_definition = blog_list[i];
              panel_context.append(
                '<a href="#" data-role="button" data-icon="edit" ' +
                  'data-iconpos="left">' + blog_definition.title + '</a>'
              );
              panel_context.find('a').last().click(
                createLoadNewBlogCallback(g, blog_definition.path,
                  blog_a_context, io_list[0].path, io_blog_a_context)
              );
            }
            for (i = 0; i < editor_list.length; i += 1) {
              editor_definition = editor_list[i];
              panel_context.append(
                '<a href="#" data-role="button" data-icon="edit" ' +
                  'data-iconpos="left">' + editor_definition.title + '</a>'
              );
              panel_context.find('a').last().click(
                createLoadNewEditorCallback(
		  g, form_path,
                  form_a_context, editor_definition.path,
		  io_list[0].path, io_a_context,
		  index_definition, index_a_context
		)
              );
            }
            panel_context.trigger('create');
          });


      })

      .fail(handleError);
//     $.when(
//       g.declareGadget('./jqteditor.html', editor_a_context),
//       g.declareGadget('./io.html', io_a_context),
//       "officejs_a").done(attachIOToEditor);

//     $.when(
//       g.declareGadget('./editor.html', editor_b_context),
//       g.declareGadget('./io.html', io_b_context),
//       "officejs_b").done(attachIOToEditor);

  });
}(window, jQuery, rJS, RSVP));
