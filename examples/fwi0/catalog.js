(function (window, $, rJS) {
  "use strict";

  var gk = rJS(window),
    io_dict = {
      "path" :      "./io.html",
      "title" :     "IO",
      "interface" : "http://www.renderjs.org/interface/io"
    },
    editor_1_dict = {
      "path" :      "./editor.html",
      "title" :     "Text Editor Gadget",
      "interface" : "http://www.renderjs.org/interface/editor"
    },
    blog_1_dict = {
      "path" :      "./blog.html",
      "title" :     "Blog",
      "interface" : "http://www.renderjs.org/interface/blog"
    },
    index_1_dict = {
      "path" :      "./index_list.html",
      "title" :     "Index",
      "interface" : "http://www.renderjs.org/interface/index"
    },
    property_1_dict = {
      "path" :      "./property.html",
      "title" :     "Property",
      "interface" : "http://www.renderjs.org/interface/property"
    },
    catalog_list = [
      {
        "path" :      "./officejs.html",
        "title" :     "Office JS",
        "interface" : "http://www.renderjs.org/interface/officejs"
      }
    ];

  catalog_list.push(io_dict);
  catalog_list.push(editor_1_dict);
  catalog_list.push(property_1_dict);
  catalog_list.push(blog_1_dict);
  catalog_list.push(index_1_dict);

  gk.declareMethod('allDocs', function (filter) {
    var deferred = $.Deferred();
    if (filter === undefined) {
      deferred.resolve(catalog_list);
    } else if (filter.query ===
        'interface: "http://www.renderjs.org/interface/io"') {
      deferred.resolve([io_dict]);
    } else if (filter.query ===
        'interface: "http://www.renderjs.org/interface/blog"') {
      deferred.resolve([blog_1_dict]);
    } else if (filter.query ===
        'interface: "http://www.renderjs.org/interface/index"') {
      deferred.resolve([index_1_dict]);
    } else if (filter.query ===
        'interface: "http://www.renderjs.org/interface/property"') {
      deferred.resolve([property_1_dict]);
    } else if (filter.query ===
        'interface: "http://www.renderjs.org/interface/editor"') {
      deferred.resolve([editor_1_dict]);
    } else {
      deferred.reject("Unsupported filter");
    }
    return deferred.promise();
  });

}(window, jQuery, rJS));
