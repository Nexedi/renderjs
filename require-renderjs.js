// JavaScript file that is used to load RenderJs depenencies

require(["../../lib/jquery/jquery.js",
         "../../renderjs.js"],
        function (domReady) {
          // Place code to be executed when libraries are loaded
          // impliticly call RenderJs bootstrap
          RenderJs.init();
        });


