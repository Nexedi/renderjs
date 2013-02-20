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
              // we use interactionGadget which will call proper gadgets' function
            };
            gadget.gadget_two = function (){
              // we use interactionGadget which will call proper gadgets' function
            };

            // we have to re-bind interaction gadget as main-route API implemantation changed
            $("div[data-gadget-connection]").each(function (index, element) {
              RenderJs.InteractionGadget.bind($(element));
            });

            $.url.onhashchange(function () {
              RenderJs.RouteGadget.go($.url.getPath(),
                                      function () {
                                        // Method to display error to the user
                                        gadget = RenderJs.GadgetIndex.getGadgetById("portal-status-message");
                                        gadget.showMessage(
                                          "<p>Oups, seems the route '<b>" + $.url.getPath() + "<\/b>' doesn't exist!<\/p>" +
                                            "<a href='" + $.url.generateUrl("") + "'>Go back to home<\/a>");
                                        // All routes have been deleted by fail.
                                        // So recreate the default routes using RouteGadget
                                        $("div[data-gadget-route]").each(function (index, element) {
                                          RenderJs.RouteGadget.route($(element));
                                        });
                                      });
            });
          });
});
