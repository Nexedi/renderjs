/*jslint browser: true, indent : 2, nomen : true, sloppy : true */
/*global require: false */
(function () {
  "use strict";

  require.config({
    paths: {
        controller:   'controller'
      , overrides:    'overrides'
      , jquery:       '../../../lib/jquery/jquery'
      , jqm:          'jqm'
      , 'jquery.json':'../../../lib/json/jquery.json.min'
      , renderjs:     '../../../renderjs'
    }
    , shim: {
        'overrides':     { deps: ['jquery'] }
      , 'jqm':           { deps: ['jquery'], exports: 'mobile' }
      , 'jquery.json':   { deps: ['jquery'] }
      , 'renderjs':      { deps: ['jquery', 'jquery.json'] }
    }
  });

  require(['controller', 'overrides', 'jquery', 'jqm',  'jquery.json', 'renderjs'], 
    function (Controller) {
      Controller.start();
    });
}());