// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "../..",
  paths: {
    route: "lib/route/route",
    url: "lib/route/url",
    jquery: "lib/jquery/jquery"
  },
});

require([ "require-renderjs", "jquery", "route", "url" ], function(domReady) {
          var body = $("body");
          // XXX: we should use Renderjs's bindReady
          setTimeout(
            function () {

              // render color picker application
              RenderJs.GadgetIndex.getGadgetById("gadget-color-picker").render();

              // Trigger route change
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
            }, 1000);
});
