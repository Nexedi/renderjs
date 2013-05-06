//  1. If a gadget is defined as a module, the module name plus ".js" will be 
//     loaded, in this case    >>>> index.js <<<<
//  2. The module can have any number of dependencies, all loaded by requireJS
//     => html file = original gadget. Loaded via !text plugin, !strip extracts
//        contents of <body></body>
//     => css file = css for this gadget, loaded via require-css !css plugin
//        which also handles appending CSS to the document (vs plain insert)
//  3. Other types of dependencies could also be added (images, json...)
//  4. The advantage of using gadgets as modules is that they can be compiled
//     by the r.js optimizer, so all files listed here will be available as
//     a single module file, named index.js (uglyify, minified, HTML/CSS/JSON
//     inlined, single HTTP request, automatic caching by requireJS).
define([
      'text!../modules/index/index.html!strip'
    , 'css!../modules/index/index'
  ],
  function (source) {
    var response = {};

    // 1. CSS will be automatically added
    // 2. source = gadget HTML (content of <body>, which we pass back to renderJS
    response.data = source;

    // 3. JS to be run on the gadget (all "gadget-y" functions work)
    response.callback = function () {
      var gadget = RenderJs.getSelfGadget();
      gadget.dom.find(".styleMe").css("border","1px solid");
    };

  // return response object to renderJS
  return response;
  }
);