// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "../..",
  paths: {
    route: "lib/route/route",
    url: "lib/route/url",
    jquery: "lib/jquery/jquery",
    renderjs: "renderjs",
  },
  shim: {
    url: [ "renderjs" ]
  }
});

require([ "renderjs", "require-renderjs", "jquery", "route", "url" ], function(domReady) {
          RenderJs.bindReady(function (){

            // XXX: try to encapsulate this in router gadget
            gadget = RenderJs.GadgetIndex.getGadgetById("main-router");
            gadget.gadget_one = function (){
              console.log("gadget-one");
              // we use interactionGadget which will call proper gadgets' function
            };
            gadget = RenderJs.GadgetIndex.getGadgetById("main-router");
            gadget.gadget_two = function (){
              console.log("gadget-two");
              // we use interactionGadget which will call proper gadgets' function
            };

            // XXX: fid why interaction gadget is not initialized proeprly yet
            RenderJs.InteractionGadget.bind($("#main-interactor"))

            var body = $("body");
            RenderJs.GadgetIndex.getGadgetById("gadget-color-picker").render();
            $.url.onhashchange(function () {
                body
                  .route("go", $.url.getPath())
                  .fail(function () {
                    // Method to display error to the user
                    $(this).html(
                      "<p>Oups, seems the route '<b>" + $.url.getPath() + "<\/b>' doesn't exist!<\/p>" +
                        "<a href='" + $.url.generateUrl("") + "'>Go back to home<\/a>"
                    );
                    // All routes have been deleted by fail.
                    // Recreate the default one.
                    //initialize_route.apply(this, []);
                    RenderJs.GadgetIndex.getGadgetById("gadget-color-picker").render();
                  });
            });
          });
});
