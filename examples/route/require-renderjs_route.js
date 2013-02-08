// JavaScript file that is used to load RenderJs depenencies
require.config({
  baseUrl: "../..",
  paths: {
    route: "examples/route/route",
    url: "examples/route/url",
    jquery: "lib/jquery/jquery"
  },
});

require([ "require-renderjs", "jquery", "route", "url" ], function(domReady) {
          var body = $("body"),
            initialize_route;

          initialize_route = function () {
            // Home route. Redirect to sub app /color/
            body
              .route("add", "", 1)
              .done(function () {
                // Default route. Redirect to color subapp
                $.url.redirect('/color/');
              });

            // add gadget based application
            body
              .route("add", "/gadget", 1)
              .done(function () {
                // Default route. Redirect to color subapp
                //$.url.redirect('/color/');
                console.log("add gadget");
              });

            // /color app. Create subroutes and initialize DOM
            body
              .route("add", "/color<path:params>", 1)
              .done(function () {
                var i, j, k, increment = 150, page, container;
                // Container for the selected color
                page = "<p>Page generated at " + new Date() + "<\/p>";
                page += "<a href='" + $.url.generateUrl("unknown") + "'>Wrong global route<a>";
                page += "<ul style='list-style: none;'>";
                for (i = 0; i < 256; i += increment) {
                  for (j = 0; j < 256; j += increment) {
                    for (k = 0; k < 256; k += increment) {
                      page += "<li><a style='text-decoration: none; display: block; width: 2em; " +
                        "background-color:rgb(" + i + "," + j + "," + k + ");' " +
                        "href='" + $.url.generateUrl("/color/" + i + "/" + j + "/" + k + "/") + "'" +
                        ">&nbsp;<\/a><\/li>";
                    }
                  }
                }
                page += "<li style='text-align: center;'><a style='text-decoration: none; display: block; width: 2em;' href='" +
                  $.url.generateUrl("/color/X/X/X") + "'>XXX<a><\/li>";
                page += "<\/ul>";
                page += "<div style='display: block;'><\/div>";
                $(this).html(page);

                // Create sub routed in the container
                container = $(this).find("div");
                container
                  .route("add", "/color/", 2)
                  .done(function () {
                    $(this).text("Please select a color");
                  });
                container
                  .route("add", "/color/<int:red>/<int:green>/<int:blue>/", 2)
                  .done(function (red, green, blue) {
                    $(this).html(
                      "<div style='background-color:rgb(" + red + "," + green + "," + blue + ");'>&nbsp;<\/div>" +
                        "<p>Color (" + red + "," + green + "," + blue + ") selected at " + new Date() + "<\/p>"
                    );
                  });
                container
                  .route("go", $.url.getPath(), 2)
                  .fail(function () {
                    $(this).html("Unknown color (" + $.url.getPath() + ")");
                  });
              });
          };

          initialize_route.apply(body, []);

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
                initialize_route.apply(this, []);
              });
          });
});
