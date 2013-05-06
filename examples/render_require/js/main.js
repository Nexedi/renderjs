/*jslint browser: true, indent : 2, nomen : true, sloppy : true */
/*global require: false */
(function () {
  "use strict";

  require.config({
      paths: {
        app:   '../js/app'
      // requirejs plugin paths
      , text:         '../js/text'
      , css:           '../js/plugins/require-css/css'
      , normalize:     '../js/plugins/require-css/normalize'
      // libs/plugin modules
      , jquery:       '../js/libs/jquery/jquery'
      , renderjs:     '../js/plugins/renderjs/renderjs'

      // page modules
      , index:         '../modules/index/index'
    }
    , shim: {
        'renderjs':      { deps: ['jquery'], exports: 'RenderJs' }
    }
    , map: {
      '*': {
        'css': '../js/plugins/require-css/css'
      }
    }
  });

// initialize application through app.js
require(['require', 'jquery', 'renderjs', 'text'],
  function(require, $, App, RenderJs){
    App.init();
  }
);
}());