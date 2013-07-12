/*global window, jQuery, rJS */
"use strict";
(function (window, $, rJS) {

  function attachIOToEditor(editor, io, id) {
    editor.context.trigger('create');
    io.context.trigger('create');

    io.configureIO(id).done(function () {
      io.configureDataSourceCallback(editor, editor.getContent);
      io.getIO().done(function (data) {
        editor.setContent(data);
      });
    });
  }

  rJS(window).ready(function () {
    var g = rJS(this),
      catalog_context = g.context.find(".catalog_location").last(),
      editor_a_context = g.context.find(".editor_a").last(),
      io_a_context = g.context.find(".editor_a_safe").last();
//       editor_b_context = g.context.find(".editor_b").last(),
//       io_b_context = g.context.find(".editor_b_safe").last();
    ;

    // First, load the catalog gadget
    g.declareGadget('./catalog.html', catalog_context).done(function (catalog) {
      // Fetch the list of editor and io gadgets
      // This is done in 2 different queries to the catalog
      $.when(
            catalog.allDocs(
              {query: 'interface: "http://www.renderjs.org/interface/editor"'}),
            catalog.allDocs(
              {query: 'interface: "http://www.renderjs.org/interface/io"'}))
       .done(function (editor_list, io_list) {
         var panel_context = g.context.find(".bare_panel");

         // Load 1 editor and 1 IO and plug them
         $.when(
           g.declareGadget(editor_list[0].path, editor_a_context),
           g.declareGadget(io_list[0].path, io_a_context),
           "officejs").done(attachIOToEditor);


         // Fill the panel
         $.each(editor_list, function(i, editor_definition) {
           panel_context.append(
             '<a href="#" data-role="button" data-icon="edit" ' +
             'data-iconpos="left">' + editor_definition.title + '</a>');
           panel_context.find('a').last().click(function () {
             $.when(
               g.declareGadget(editor_definition.path, editor_a_context),
               g.declareGadget(io_list[0].path, io_a_context),
               "officejs").done(attachIOToEditor);
           });
         });
         panel_context.trigger('create');
       });

    });

//     $.when(
//       g.declareGadget('./jqteditor.html', editor_a_context),
//       g.declareGadget('./io.html', io_a_context),
//       "officejs_a").done(attachIOToEditor);

//     $.when(
//       g.declareGadget('./editor.html', editor_b_context),
//       g.declareGadget('./io.html', io_b_context),
//       "officejs_b").done(attachIOToEditor);

  });
}(window, $, rJS))
