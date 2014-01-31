/*global console */
(function (window, $, rJS, RSVP) {
  "use strict";

  function attachIOToEditor(all_param) {
    var editor = all_param[0],
    io = all_param[1],
    id = all_param[2],
    property = all_param[3],
    jio_config = {
      "type": "dropbox",
      "access_token": "v43SQLCEoi8AAAAAAAAAAVixCoMfDelgGj3NRPfEnqscAuNGp2LhoS8-GiAaDD4C"
    };
    $(io.element).trigger('create');
    $(property.element).trigger('create');
    $(editor.element).trigger('create');
      return io.configureIO(jio_config)
      .then(function () {
        return io.configureDataSourceCallback(editor, editor.getContent, property, property.getContent ,'48c3ca06-78b9-2f4c-80db-d5cb2417de45');
      })
      .then(function () {
        return io.getIO('48c3ca06-78b9-2f4c-80db-d5cb2417de45').fail(function (error) {
          if (error.status === 404) {
            return "";
          }
          throw error;
        });
      })
      .then(function (document) {
        return RSVP.all([editor.setContent(document.text_content), property.setContent(document)]);
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
    $(io.element).trigger('create');
    $(blog.element).trigger('create');
      return io.configureIO(jio_config)
      .then(function () {
        return io.configureDataSourceCallback(blog,blog.displayHTML, '48c3ca06-78b9-2f4c-80db-d5cb2417de45');
      })
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

  function createLoadNewEditorCallback(g, editor_path, e_c, io_path, i_c, property_path, p_c) {
    return function () {
      e_c.empty();
      p_c.empty();
      $('.editor_a_safe').attr("style","");
      $('.property_a_safe').attr("style","");
      return RSVP.all([
        g.declareGadget(editor_path, {element: e_c[0], sandbox: 'iframe'}),
        g.declareGadget(io_path),
        "officejs",
        g.declareGadget(property_path)
      ])
        .then(function (all_param) {
          i_c.empty();
          i_c[0].appendChild(all_param[1].element);
          p_c[0].appendChild(all_param[3].element);
          return attachIOToEditor(all_param);
        })
        .fail(handleError);
    };
  }

  function createLoadNewBlogCallback(g, blog_path, e_c, io_path, i_c) {
    return function () {
      e_c.empty();
      $('.editor_a_safe').attr("style","display:none");
      $('.property_a_safe').attr("style","display:none");
      return RSVP.all([
        g.declareGadget(blog_path, {element: e_c[0], sandbox: 'iframe'}),
        g.declareGadget(io_path),
        "officejs"
      ])
        .then(function (all_param) {
          i_c.empty();
          i_c[0].appendChild(all_param[1].element);
          return attachIOToBlog(all_param);
        })
        .fail(handleError);
    };
  }

  rJS(window).ready(function (g) {
    var editor_a_context = $(g.element).find(".editor_a").last(),
      io_a_context = $(g.element).find(".editor_a_safe").last(),
      io_blog_a_context = $(g.element).find(".editor_a_safe").last(),
    blog_a_context = $(g.element).find(".editor_a").last(),
    property_a_context = $(g.element).find(".property_a_safe").last()
    ;

    // First, load the catalog gadget
    g.declareGadget('./catalog.html')
      .then(function (catalog) {
        // Fetch the list of editor and io gadgets
        // This is done in 2 different queries to the catalog
	console.log('catalog ready');
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
          )
        ]);
      })
      .then(function (all_list) {
        var panel_context = $(g.element).find(".bare_panel"),
        editor_list = all_list[0],
        io_list = all_list[1],
	blog_list = all_list[2],
	property_list = all_list[3],
        editor_definition,
	blog_definition,
	property_definition,
        i;
        // Load 1 editor and 1 IO and plug them
        editor_a_context.empty();
	$('.editor_a_safe').attr("style","display:none");
	$('.property_a_safe').attr("style","display:none");
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
            io_blog_a_context[0].appendChild(all_param[1].element);
            return attachIOToBlog(all_param);
          })
          .then(function () {
            // Fill the panel
	    property_definition = property_list[0];
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
		  g, editor_definition.path,
                  editor_a_context, io_list[0].path, io_a_context,
		  property_definition.path, property_a_context)
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