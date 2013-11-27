(function (document, renderJS, QUnit, sinon) {
  "use strict";
  var test = QUnit.test,
    stop = QUnit.stop,
    start = QUnit.start,
    ok = QUnit.ok,
    equal = QUnit.equal,
    throws = QUnit.throws,
    deepEqual = QUnit.deepEqual,
    module = QUnit.module,
    root_gadget_klass = renderJS(window),
    root_gadget_defer = RSVP.defer();

  // Keep track of the root gadget
  renderJS(window).ready(function (g) {
    root_gadget_defer.resolve(g);
  });


  QUnit.config.testTimeout = 1000;
//   QUnit.config.reorder = false;
//   sinon.log = function (message) {
//     console.log(message);
//   };

  function parseGadgetHTML(html) {
    return renderJS.parseGadgetHTMLDocument(
      (new DOMParser()).parseFromString(html, "text/html")
    );
  }

  /////////////////////////////////////////////////////////////////
  // parseGadgetHTMLDocument
  /////////////////////////////////////////////////////////////////
  module("renderJS.parseGadgetHTMLDocument", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('Not valid HTML string', function () {
    // Check that parseGadgetHTMLDocument returns the default value
    // if the string is not a valid xml
    deepEqual(parseGadgetHTML(""), {
      title: "",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
    });
  });

  test('Not HTML Document', function () {
    // Check that parseGadgetHTMLDocument throws an error if the parameter is
    // not a HTMLDocument
    throws(function () {
      renderJS.parseGadgetHTMLDocument({});
    });
  });

  test('Default result value', function () {
    // Check default value returned by parseGadgetHTMLDocument
    deepEqual(renderJS.parseGadgetHTMLDocument(
      document.implementation.createHTMLDocument("")
    ), {
      title: "",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
    });
  });

  test('Extract title', function () {
    // Check that parseGadgetHTMLDocument correctly extract the title
    var settings,
      html = "<html>" +
        "<head>" +
        "<title>Great title</title>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    equal(settings.title, 'Great title', 'Title extracted');
  });

  test('Extract only one title', function () {
    // Check that parseGadgetHTMLDocument correctly extract the first title
    var settings,
      html = "<html>" +
        "<head>" +
        "<title>Great title</title>" +
        "<title>Great title 2</title>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    equal(settings.title, 'Great title', 'First title extracted');
  });

//   test('Extract title only from head', function () {
//     // Check that parseGadgetHTML only extract title from head
//     var settings,
//       html = "<html>" +
//         "<body>" +
//         "<title>Great title</title>" +
//         "</body></html>";
// 
//     settings = parseGadgetHTML(html);
//     equal(settings.title, '', 'Title not found');
//   });

  // XXX innerHTML is not extracted anymore
//   test('Extract body', function () {
//     // Check that parseGadgetHTML correctly extract the body
//     var settings,
//       html = "<html>" +
//         "<body>" +
//         "<p>Foo</p>" +
//         "</body></html>";
// 
//     settings = renderJS.parseGadgetHTML(html);
//     equal(settings.html, "<p>Foo</p>", "HTML extracted");
//   });
// 
//   test('Extract all body', function () {
//     // Check that parseGadgetHTML correctly extracts all bodies
//     var settings,
//       html = "<html>" +
//         "<body>" +
//         "<p>Foo</p>" +
//         "</body><body>" +
//         "<p>Bar</p>" +
//         "</body></html>";
// 
//     settings = renderJS.parseGadgetHTML(html);
//     equal(settings.html, '<p>Foo</p><p>Bar</p>', 'All bodies extracted');
//   });
// 
//   test('Extract body only from html', function () {
//     // Check that parseGadgetHTML also extract body from head
//     var settings,
//       html = "<html>" +
//         "<head><body><p>Bar</p></body></head>" +
//         "</html>";
// 
//     settings = renderJS.parseGadgetHTML(html);
//     equal(settings.html, "<p>Bar</p>", "Body not found");
//   });

  test('Extract CSS', function () {
    // Check that parseGadgetHTMLDocument correctly extract the CSS
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.required_css_list,
              ['../lib/qunit/qunit.css'],
              "CSS extracted");
  });

  test('Extract CSS order', function () {
    // Check that parseGadgetHTMLDocument correctly keep CSS order
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit2.css' " +
        "type='text/css'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.required_css_list,
              ['../lib/qunit/qunit.css', '../lib/qunit/qunit2.css'],
              "CSS order kept");
  });

  test('Extract CSS only from head', function () {
    // Check that parseGadgetHTMLDocument only extract css from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</body></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.required_css_list, [], "CSS not found");
  });

  test('Extract interface', function () {
    // Check that parseGadgetHTMLDocument correctly extract the interface
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.interface_list,
              ['./interface/renderable'],
              "interface extracted");
  });

  test('Extract interface order', function () {
    // Check that parseGadgetHTMLDocument correctly keep interface order
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/field'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.interface_list,
              ['./interface/renderable',
               './interface/field'],
              "interface order kept");
  });

  test('Extract interface only from head', function () {
    // Check that parseGadgetHTMLDocument only extract interface from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</body></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.interface_list, [], "interface not found");
  });

  test('Extract JS', function () {
    // Check that parseGadgetHTMLDocument correctly extract the JS
    var settings,
      html = "<html>" +
        "<head>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.required_js_list,
              ['../lib/qunit/qunit.js'],
              "JS extracted");
  });

  test('Extract JS order', function () {
    // Check that parseGadgetHTMLDocument correctly keep JS order
    var settings,
      html = "<html>" +
        "<head>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "<script src='../lib/qunit/qunit2.js' " +
        "type='text/javascript'></script>" +
        "</head></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.required_js_list,
              ['../lib/qunit/qunit.js', '../lib/qunit/qunit2.js'],
              "JS order kept");
  });

  test('Extract JS only from head', function () {
    // Check that parseGadgetHTMLDocument only extract js from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    settings = parseGadgetHTML(html);
    deepEqual(settings.required_js_list, [], "JS not found");
  });

  test('Non valid XML (HTML in fact...)', function () {
    // Check default value returned by parseGadgetHTMLDocument
    deepEqual(parseGadgetHTML('<!doctype html><html><head>' +
      '<title>Test non valid XML</title>' +
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
      '</head><body><p>Non valid XML</p></body></html>'), {
      title: "Test non valid XML",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
//       html: "<p>Non valid XML</p>",
    });
  });

  /////////////////////////////////////////////////////////////////
  // declareGadgetKlass
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareGadgetKlass", {
    setup: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    teardown: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('Ajax error reject the promise', function () {
    // Check that declareGadgetKlass fails if ajax fails
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [404, {
      "Content-Type": "text/html"
    }, "foo"]);

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function () {
        ok(false, "404 should fail");
      })
      .fail(function (xhr) {
        equal(xhr.status, 404);
        equal(xhr.url, url);
      })
      .always(function () {
        start();
      });
  });

  test('Non HTML reject the promise', function () {
    // Check that declareGadgetKlass fails if non html is retrieved
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/plain"
    }, "foo"]);

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function () {
        ok(false, "text/plain should fail");
      })
      .fail(function (jqXHR) {
        equal(jqXHR.status, 200);
        equal(jqXHR.getResponseHeader("Content-Type"), "text/plain");
      })
      .always(function () {
        start();
      });
  });

  test('HTML parsing failure reject the promise', function () {
    // Check that declareGadgetKlass fails if the html can not be parsed
    var url = 'https://example.org/files/qunittest/test',
      mock;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, ""]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument", function () {
      throw new Error("foo");
    });
    mock.expects("parseGadgetHTMLDocument").once().throws();

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function () {
        ok(false, "Non parsable HTML should fail");
      })
      .fail(function (e) {
        ok(e instanceof Error);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Klass creation', function () {
    // Check that declareGadgetKlass returns a subclass of RenderJSGadget
    // and contains all extracted properties on the prototype
    var url = 'https://example.org/files/qunittest/test',
      mock;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "foo"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        var instance;

        equal(Klass.prototype.path, url);
        equal(Klass.prototype.foo, 'bar');
        equal(Klass.template_element.nodeType, 9);

        instance = new Klass();
        ok(instance instanceof RenderJSGadget);
        ok(instance instanceof Klass);
        ok(Klass !== RenderJSGadget);
      })
      .fail(function (e) {
        ok(false, JSON.stringify(e));
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Klass is not reloaded if called twice', function () {
    // Check that declareGadgetKlass does not reload the gadget
    // if it has already been loaded
    var url = 'https://example.org/files/qunittest/test',
      klass1,
      mock;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "foo"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function (Klass1) {
        klass1 = Klass1;
        return renderJS.declareGadgetKlass(url);
      })
      .then(function (Klass2) {
        equal(klass1, Klass2);
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR.status);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Content type parameter are supported', function () {
    // Check that declareGadgetKlass does not fail if the page content type
    // contains a parameter
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html; charset=utf-8"
    }, "<html></html>"]);

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        var instance;

        equal(Klass.prototype.path, url);

        instance = new Klass();
        ok(instance instanceof RenderJSGadget);
        ok(instance instanceof Klass);
        ok(Klass !== RenderJSGadget);
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // declareJS
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareJS", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('Download error reject the promise', function () {
    // Check that declareJS fails if ajax fails
    var url = 'http://0.0.0.0/bar';

    stop();
    renderJS.declareJS(url)
      .then(function () {
        ok(false, "404 should fail");
      })
      .fail(function (e) {
        equal(e.type, "error");
        equal(e.target.getAttribute("src"), url);
      })
      .always(function () {
        start();
      });
  });

  test('Ajax error reject the promise twice', function () {
    // Check that failed declareJS is not cached
    var url = 'http://0.0.0.0/bar2';

    stop();
    renderJS.declareJS(url)
      .then(function () {
        return renderJS.declareJS(url);
      })
      .then(function () {
        ok(false, "404 should fail");
      })
      .fail(function (e) {
        equal(e.type, "error");
        equal(e.target.getAttribute("src"), url);
      })
      .always(function () {
        start();
      });
  });

  test('Non JS reject the promise', function () {
    // Check that declareJS fails if mime type is wrong
    var url = "data:image/png;base64," +
         window.btoa("= = ="),
      previousonerror = window.onerror;

    stop();
    window.onerror = undefined;
    renderJS.declareJS(url)
      .then(function (value, textStatus, jqXHR) {
        ok(ok, "Non JS mime type should load");
      })
      .fail(function (jqXHR) {
        ok(false, jqXHR);
      })
      .always(function () {
        window.onerror = previousonerror;
        start();
      });
  });

  test('JS cleanly loaded', function () {
    // Check that declareJS is fetched and loaded
    var url = "data:application/javascript;base64," +
         window.btoa("document.getElementById('qunit-fixture').textContent " +
                     "= 'JS fetched and loaded';");

    stop();
    renderJS.declareJS(url)
      .then(function () {
        equal(
          document.getElementById("qunit-fixture").textContent,
          "JS fetched and loaded"
        );
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  test('JS with errors cleanly loaded', function () {
    // Check that declareJS is fetched and loaded even if JS contains an error
    var url = "data:application/javascript;base64," +
         window.btoa("= var var var a a a"),
      previousonerror = window.onerror;

    stop();
    window.onerror = undefined;
    renderJS.declareJS(url)
      .then(function (aaa) {
        ok(true, "JS with error cleanly loaded");
      })
      .fail(function (jqXHR) {
        ok(false, jqXHR);
      })
      .always(function () {
        window.onerror = previousonerror;
        start();
      });
  });

  test('JS is not fetched twice', function () {
    // Check that declareJS does not load the JS twice
    var url = "data:application/javascript;base64," +
         window.btoa("document.getElementById('qunit-fixture').textContent " +
                     "= 'JS not fetched twice';");

    stop();
    renderJS.declareJS(url)
      .then(function () {
        equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
        document.getElementById("qunit-fixture").textContent = "";
        return renderJS.declareJS(url);
      })
      .then(function () {
        equal(document.getElementById("qunit-fixture").textContent, "");
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // declareCSS
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareCSS", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('Ajax error resolve the promise', function () {
    // Check that declareCSS is resolved if ajax fails
    var url = 'foo//://bar';

    stop();
    renderJS.declareCSS(url)
      .then(function () {
        ok(false, "404 should fail");
      })
      .fail(function (e) {
        equal(e.type, "error");
        equal(e.target.getAttribute("href"), url);
      })
      .always(function () {
        start();
      });
  });

  test('Non CSS reject the promise', function () {
    // Check that declareCSS is resolved if mime type is wrong
    var url = "data:image/png;base64," +
         window.btoa("= = =");

    stop();
    renderJS.declareCSS(url)
      .then(function (value, textStatus, jqXHR) {
        // Chrome accept the css
        ok(true, "Non CSS mime type should load");
      })
      .fail(function (e) {
        equal(e.type, "error");
        equal(e.target.getAttribute("href"), url);
      })
      .always(function () {
        start();
      });
  });

  test('CSS cleanly loaded', function () {
    // Check that declareCSS is fetched and loaded
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: red;}");

    stop();
    renderJS.declareCSS(url)
      .then(function () {
        var result = document.querySelectorAll("link[href='" + url + "']");
        ok(result.length > 0, "CSS in the head");
        equal(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor,
          "rgb(255, 0, 0)"
        );
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('CSS with errors cleanly loaded', function () {
    // Check that declareCSS is fetched and
    // loaded even if CSS contains an error
    var url = "data:application/javascript;base64," +
         window.btoa("throw new Error('foo');");

    stop();
    renderJS.declareCSS(url)
      .then(function () {
        // Chrome does not consider this as error
        ok(true, "CSS with error cleanly loaded");
      })
      .fail(function (jqXHR) {
        ok(true, jqXHR);
      })
      .always(function () {
        start();
      });
  });

  test('CSS is not fetched twice', function () {
    // Check that declareCSS does not load the CSS twice
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: blue;}");

    stop();
    renderJS.declareCSS(url)
      .then(function () {
        equal(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor,
          "rgb(0, 0, 255)"
        );
        var element = document.querySelectorAll("link[href='" + url + "']")[0];
        element.parentNode.removeChild(element);
        ok(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor !== "rgb(0, 0, 255)"
        );

        return renderJS.declareCSS(url);
      })
      .then(function () {
        var element_list =
          document.querySelectorAll("link[href='" + url + "']");
        equal(element_list.length, 0);
        ok(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor !== "rgb(0, 0, 255)"
        );
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // clearGadgetKlassList
  /////////////////////////////////////////////////////////////////
  module("renderJS.clearGadgetKlassList", {
    setup: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    teardown: function () {
      this.server.restore();
      delete this.server;
    }
  });

  test('clearGadgetKlassList leads to gadget reload', function () {
    // Check that declareGadgetKlass reload the gadget
    // after clearGadgetKlassList is called
    var url = 'https://example.org/files/qunittest/test',
      klass1,
      mock;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "foo"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").twice().returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function (Klass1) {
        klass1 = Klass1;

        renderJS.clearGadgetKlassList();

        return renderJS.declareGadgetKlass(url);
      })
      .then(function (Klass2) {
        ok(klass1 !== Klass2);
      })
      .fail(function (jqXHR) {
        ok(false, jqXHR);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('clearGadgetKlassList leads to JS reload', function () {
    // Check that declareJS reload the JS
    // after clearGadgetKlassList is called
    var url = "data:application/javascript;base64," +
         window.btoa("document.getElementById('qunit-fixture').textContent " +
                     "= 'JS not fetched twice';");

    stop();
    renderJS.declareJS(url)
      .then(function () {
        renderJS.clearGadgetKlassList();
        equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
        document.getElementById("qunit-fixture").textContent = "";
        return renderJS.declareJS(url);
      })
      .then(function () {
        equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  test('clearGadgetKlassList leads to CSS reload', function () {
    // Check that declareCSS reload the CSS
    // after clearGadgetKlassList is called
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: blue;}"),
      count = document.querySelectorAll("link[rel=stylesheet]").length;

    stop();
    renderJS.declareCSS(url)
      .then(function () {
        renderJS.clearGadgetKlassList();
        equal(
          document.querySelectorAll("link[rel=stylesheet]").length,
          count + 1
        );
        return renderJS.declareCSS(url);
      })
      .then(function () {
        equal(
          document.querySelectorAll("link[rel=stylesheet]").length,
          count + 2
        );
      })
      .fail(function (jqXHR) {
        ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget");

  test('should be a constructor', function () {
    var gadget = new RenderJSGadget();
    equal(
      Object.getPrototypeOf(gadget),
      RenderJSGadget.prototype,
      '[[Prototype]] equals RenderJSGadget.prototype'
    );
    equal(
      gadget.constructor,
      RenderJSGadget,
      'constructor property of instances is set correctly'
    );
    equal(
      RenderJSGadget.prototype.constructor,
      RenderJSGadget,
      'constructor property of prototype is set correctly'
    );
  });

  test('should not accept parameter', function () {
    equal(RenderJSGadget.length, 0);
  });

  test('should work without new', function () {
    var gadgetKlass = RenderJSGadget,
      gadget = gadgetKlass();
    equal(
      gadget.constructor,
      RenderJSGadget,
      'constructor property of instances is set correctly'
    );
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getInterfaceList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getInterfaceList", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns interface_list', function () {
    // Check that getInterfaceList return a Promise
    var gadget = new RenderJSGadget();
    gadget.interface_list = "foo";
    stop();
    gadget.getInterfaceList()
      .then(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function () {
    // Check that getInterfaceList return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getInterfaceList()
      .then(function (result) {
        deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getRequiredCSSList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getRequiredCSSList", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns interface_list', function () {
    // Check that getRequiredCSSList return a Promise
    var gadget = new RenderJSGadget();
    gadget.required_css_list = "foo";
    stop();
    gadget.getRequiredCSSList()
      .then(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function () {
    // Check that getRequiredCSSList return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getRequiredCSSList()
      .then(function (result) {
        deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getRequiredJSList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getRequiredJSList", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns interface_list', function () {
    // Check that getRequiredJSList return a Promise
    var gadget = new RenderJSGadget();
    gadget.required_js_list = "foo";
    stop();
    gadget.getRequiredJSList()
      .then(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function () {
    // Check that getRequiredJSList return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getRequiredJSList()
      .then(function (result) {
        deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getPath
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getPath", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns path', function () {
    // Check that getPath return a Promise
    var gadget = new RenderJSGadget();
    gadget.path = "foo";
    stop();
    gadget.getPath()
      .then(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function () {
    // Check that getPath return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getPath()
      .then(function (result) {
        equal(result, "");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getTitle
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getTitle", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns title', function () {
    // Check that getTitle return a Promise
    var gadget = new RenderJSGadget();
    gadget.title = "foo";
    stop();
    gadget.getTitle()
      .then(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function () {
    // Check that getTitle return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getTitle()
      .then(function (result) {
        equal(result, "");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getElement
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getElement", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns element property', function () {
    // Check that getElement return a Promise
    var gadget = new RenderJSGadget();
    gadget.element = "foo";
    stop();
    gadget.getElement()
      .then(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('throw an error if no element is defined', function () {
    // Check that getElement return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getElement()
      .then(function () {
        ok(false, "getElement should fail");
      })
      .fail(function (e) {
        ok(e instanceof Error);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareMethod
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareMethod", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('is chainable', function () {
    // Check that declareMethod is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();
    equal(gadget.testFoo, undefined);
    result = Klass.declareMethod('testFoo', function () {
      return;
    });
    // declareMethod is chainable
    equal(result, Klass);
  });

  test('creates methods on the prototype', function () {
    // Check that declareMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, called;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();
    equal(gadget.testFoo, undefined);
    Klass.declareMethod('testFoo', function (value) {
      called = value;
    });
    // Method is added on the instance class prototype
    equal(RenderJSGadget.prototype.testFoo, undefined);
    ok(gadget.testFoo !== undefined);
    ok(Klass.prototype.testFoo !== undefined);
    equal(Klass.prototype.testFoo, gadget.testFoo);

    stop();
    // method can be called
    gadget.testFoo("Bar")
      .then(function (param) {
        equal(called, "Bar");
      })
      .fail(function () {
        ok(false, "Should propagate the parameters");
      })
      .always(function () {
        start();
      });
  });

  test('returns a promise when synchronous function', function () {
    // Check that declareMethod returns a promise when defining
    // a synchronous function

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();
    Klass.declareMethod('testFoo', function (value) {
      return value;
    });

    // method can be called
    stop();
    gadget.testFoo("Bar")
      .then(function (param) {
        equal(param, "Bar");
      })
      .fail(function () {
        ok(false, "Should not fail when synchronous");
      })
      .always(function () {
        start();
      });
  });

  test('returns the callback promise if it exists', function () {
    // Check that declareMethod returns the promise created by the callback

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();
    Klass.declareMethod('testFoo', function (value) {
      return RSVP.reject(value);
    });

    // method can be called
    stop();
    gadget.testFoo("Bar")
      .then(function () {
        ok(false, "Callback promise is rejected");
      })
      .fail(function (param) {
        equal(param, "Bar");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.ready
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.ready", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('is chainable', function () {
    // Check that ready is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.ready_list = [];
    Klass.ready = RenderJSGadget.ready;

    result = Klass.ready(function () {
      return;
    });
    // ready is chainable
    equal(result, Klass);
  });

  test('store callback in the ready_list property', function () {
    // Check that ready is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    },
      callback = function () {return; };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.ready_list = [];
    Klass.ready = RenderJSGadget.ready;

    Klass.ready(callback);
    // ready is chainable
    deepEqual(Klass.ready_list, [callback]);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSIframeGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSIframeGadget");

  test('should be a constructor', function () {
    var gadget = new RenderJSIframeGadget();
    equal(
      Object.getPrototypeOf(gadget),
      RenderJSIframeGadget.prototype,
      '[[Prototype]] equals RenderJSIframeGadget.prototype'
    );
    equal(
      gadget.constructor,
      RenderJSIframeGadget,
      'constructor property of instances is set correctly'
    );
    equal(
      RenderJSIframeGadget.prototype.constructor,
      RenderJSIframeGadget,
      'constructor property of prototype is set correctly'
    );
  });

  test('should not accept parameter', function () {
    equal(RenderJSIframeGadget.length, 0);
  });

  test('should work without new', function () {
    var gadgetKlass = RenderJSIframeGadget,
      gadget = gadgetKlass();
    equal(
      gadget.constructor,
      RenderJSIframeGadget,
      'constructor property of instances is set correctly'
    );
    ok(gadget instanceof RenderJSGadget);
    ok(gadget instanceof RenderJSIframeGadget);
    ok(RenderJSIframeGadget !== RenderJSGadget);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSEmbeddedGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSEmbeddedGadget");

  test('should be a constructor', function () {
    var gadget = new RenderJSEmbeddedGadget();
    equal(
      Object.getPrototypeOf(gadget),
      RenderJSEmbeddedGadget.prototype,
      '[[Prototype]] equals RenderJSEmbeddedGadget.prototype'
    );
    equal(
      gadget.constructor,
      RenderJSEmbeddedGadget,
      'constructor property of instances is set correctly'
    );
    equal(
      RenderJSEmbeddedGadget.prototype.constructor,
      RenderJSEmbeddedGadget,
      'constructor property of prototype is set correctly'
    );
  });

  test('should not accept parameter', function () {
    equal(RenderJSEmbeddedGadget.length, 0);
  });

  test('should work without new', function () {
    var gadgetKlass = RenderJSEmbeddedGadget,
      gadget = gadgetKlass();
    equal(
      gadget.constructor,
      RenderJSEmbeddedGadget,
      'constructor property of instances is set correctly'
    );
    ok(gadget instanceof RenderJSGadget);
    ok(gadget instanceof RenderJSEmbeddedGadget);
    ok(RenderJSEmbeddedGadget !== RenderJSGadget);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (public)
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.declareGadget", {
    setup: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    teardown: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('returns a Promise', function () {
    // Check that declareGadget return a Promise
    var gadget = new RenderJSGadget(),
      url = 'https://example.org/files/qunittest/test',
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, html]);

    stop();
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function () {
        ok(true);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('provide a gadget instance as callback parameter', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = 'https://example.org/files/qunittest/test',
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, html]);

    stop();
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function (new_gadget) {
        equal(new_gadget.path, url);
        ok(new_gadget instanceof RenderJSGadget);
      })
      .always(function () {
        start();
      });
  });

  test('no parameter', function () {
    // Check that missing url reject the declaration
    var gadget = new RenderJSGadget();
    stop();
    gadget.declareGadget()
      .fail(function () {
        ok(true);
      })
      .always(function () {
        start();
      });
  });

  test('load dependency before returning gadget', function () {
    // Check that dependencies are loaded before gadget creation
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test2.html',
      js1_url = "data:application/javascript;base64," +
         window.btoa(
          "document.getElementById('qunit-fixture').getElementsByTagName" +
            "('div')[0].textContent = 'youhou';"
        ),
      js2_url = "data:application/javascript;base64," +
         window.btoa(
          "document.getElementById('qunit-fixture').getElementsByTagName" +
            "('div')[0].textContent = 'youhou2';"
        ),
      css1_url = "data:text/css;base64," +
         window.btoa(""),
      css2_url = css1_url,
      html = "<html>" +
        "<head>" +
        "<title>Foo title</title>" +
        "<script src='" + js1_url + "' type='text/javascript'></script>" +
        "<script src='" + js2_url + "' type='text/javascript'></script>" +
        "<link rel='stylesheet' href='" + css1_url + "' type='text/css'/>" +
        "<link rel='stylesheet' href='" + css2_url + "' type='text/css'/>" +
        "</head><body><p>Bar content</p></body></html>",
      spy_js,
      spy_css;

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, html]);

    spy_js = sinon.spy(renderJS, "declareJS");
    spy_css = sinon.spy(renderJS, "declareCSS");

//     mock = sinon.mock(renderJS, "parseGadgetHTML");
//     mock.expects("parseGadgetHTML").once().withArgs(html).returns({
//       required_js_list: [js1_url, js2_url],
//       required_css_list: [css1_url, css2_url],
//       html: "<p>Bar content</p>",
//     });

    document.getElementById('qunit-fixture').innerHTML =
      "<div></div><div>bar</div>";
    stop();
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        equal(document.getElementById('qunit-fixture').innerHTML,
              "<div>youhou2</div><div>bar</div>");
        equal(new_gadget.element.outerHTML,
              "<div><p>Bar content</p></div>");
        ok(spy_js.calledTwice, "JS count " + spy_js.callCount);
        equal(spy_js.firstCall.args[0], js1_url, "First JS call");
        equal(spy_js.secondCall.args[0], js2_url, "Second JS call");
        ok(spy_css.calledTwice, "CSS count " + spy_css.callCount);
        equal(spy_css.firstCall.args[0], css1_url, "First CSS call");
        equal(spy_css.secondCall.args[0], css2_url, "Second CSS call");
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
        spy_js.restore();
        spy_css.restore();
      });
  });

//   test('load dependency in the right order', function () {
//     // Check that JS dependencies are loaded in the right order
//     // Can be reproduce with real loading (http): 
//     // * enormous 1 js
//     // * second small js which require the 1 one to be loaded
//     // How to mock the loading time?
//   });

  test('Fail if klass can not be loaded', function () {
    // Check that gadget is not created if klass is can not be loaded
    var gadget = new RenderJSGadget(),
      html_url = 'http://example.org/files/qunittest/test3.html';

    this.server.respondWith("GET", html_url, [404, {
      "Content-Type": "text/html"
    }, ""]);

    stop();
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        ok(false);
      })
      .fail(function (jqXHR) {
        equal(jqXHR.status, 404);
      })
      .always(function () {
        start();
      });
  });

  test('Fail if js can not be loaded', function () {
    // Check that dependencies are loaded before gadget creation
    var gadget = new RenderJSGadget(),
      html_url = 'http://example.org/files/qunittest/test5.html',
      js1_url = 'http://0.0.0.0/test.js',
      mock;

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns({
      required_js_list: [js1_url]
    });

    stop();
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        ok(false);
      })
      .fail(function (e) {
        ok(true);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Do not load gadget dependency twice', function () {
    // Check that dependencies are not reloaded if 2 gadgets are created
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test254.html',
      js1_url = "data:application/javascript;base64," +
         window.btoa(
          "document.getElementById('qunit-fixture').getElementsByTagName" +
            "('div')[0].textContent += 'youhou';"
        ),
      mock;

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns({
      required_js_list: [js1_url]
    });

    stop();
    document.getElementById('qunit-fixture').innerHTML =
      "<div></div><div></div>";
    gadget.declareGadget(html_url)
      .fail(function (e) {
        ok(false, "1 + " + e.toString());
      })
      .then(function () {
        equal(document.getElementById('qunit-fixture').innerHTML,
              "<div>youhou</div><div></div>");
        return gadget.declareGadget(html_url);
      })
      .then(function (new_gadget) {
        equal(document.getElementById('qunit-fixture').innerHTML,
              "<div>youhou</div><div></div>");
      })
      .fail(function (e) {
        ok(false, "2 + " + e.toString());
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Load 2 concurrent gadgets in parallel', function () {
    // Check that dependencies are loaded once if 2 gadgets are created
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test987.html',
      mock;

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns({});

    stop();
    RSVP.all([
      gadget.declareGadget(html_url),
      gadget.declareGadget(html_url)
    ])
      .then(function () {
        ok(true);
      })
      .always(function () {
        // Check that only one request has been done.
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('One failing gadget does not prevent the others to load', function () {
    // Check that dependencies are loaded once if 2 gadgets are created
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test12345.html',
      html_url2 = 'https://example.org/files/qunittest/test12346.html',
      mock;

    this.server.respondWith("GET", html_url, [404, {
      "Content-Type": "text/html"
    }, "error"]);
    this.server.respondWith("GET", html_url2, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns({});

    stop();
    gadget.declareGadget(html_url)
      .then(function () {
        ok(false);
      })
      .fail(function () {
        return gadget.declareGadget(html_url2);
      })
      .then(function () {
        ok(true);
      })
      .always(function () {
        // Check that only one request has been done.
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Wait for ready callback before returning', function () {

    // Subclass RenderJSGadget to not pollute its namespace
    var called = false,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.ready(function () {
          return RSVP.delay(50).then(function () {
            // Modify the value after 50ms
            called = true;
          });
        });
        return gadget.declareGadget(html_url);
      })
      .then(function () {
        ok(called);
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Can take a DOM element options', function () {

    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    document.getElementById('qunit-fixture').textContent = "";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')}
        );
      })
      .then(function () {
        equal(
          document.getElementById('qunit-fixture').innerHTML,
          '<p>foo</p>'
        );
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (iframe)
  /////////////////////////////////////////////////////////////////
  test('Require the element options', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(html_url, {sandbox: 'iframe'});
      })
      .then(function () {
        ok(false);
      })
      .fail(function (e) {
        ok(e instanceof Error);
        equal(
          e.message,
          "DOM element is required to create Iframe Gadget " + html_url
        );
      })
      .always(function () {
        start();
      });
  });

  test('Require a DOM element as option', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(html_url, {
          sandbox: 'iframe',
          element: document.createElement("div")
        });
      })
      .then(function () {
        ok(false);
      })
      .fail(function (e) {
        ok(e instanceof Error);
        equal(
          e.message,
          "The parent element is not attached to the DOM for " + html_url
        );
      })
      .always(function () {
        start();
      });
  });

  test('provide an iframed gadget as callback parameter', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded.html";

    document.getElementById("qunit-fixture").textContent = "";

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        equal(new_gadget.path, url);
        ok(new_gadget instanceof RenderJSIframeGadget);
        equal(
          new_gadget.element.innerHTML,
          '<iframe src="' + url + '"></iframe>'
        );
        ok(new_gadget.chan !== undefined);
      })
      .always(function () {
        start();
      });
  });

  test('checking working iframe gadget', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded.html";

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        return new RSVP.Queue()

          // Check that ready function are called
          .push(function () {
            return new_gadget.wasReadyCalled();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Custom method accept parameter
          // and return value
          .push(function () {
            return new_gadget.setContent("foobar");
          })
          .push(function (result) {
            return new_gadget.getContent();
          })
          .push(function (result) {
            equal(result, "foobar");
          })

          // Method are propagated
          .push(function () {
            return new_gadget.triggerError();
          })
          .push(function () {
            ok(false, "triggerError should fail");
          }, function (e) {
            equal(e, "Error: Manually triggered embedded error");
          });
      })
      .fail(function () {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget bootstrap
  /////////////////////////////////////////////////////////////////

  module("RenderJSGadget bootstrap");
//   module("RenderJSGadget bootstrap", {
//     setup: function () {
//       renderJS.clearGadgetKlassList();
//     }
//   });

  test('Check that the root gadget is cleanly implemented', function () {
    stop();
    root_gadget_defer.promise
      .then(function (root_gadget) {
        // Check instance
        equal(root_gadget.path, window.location.href);
        equal(root_gadget.title, document.title);
        deepEqual(root_gadget.interface_list, []);
        deepEqual(root_gadget.required_css_list,
                  ["../node_modules/grunt-contrib-qunit/test/libs/qunit.css"]);
        deepEqual(root_gadget.required_js_list, [
          "../node_modules/rsvp/dist/rsvp-2.0.4.js",
          "../node_modules/grunt-contrib-qunit/test/libs/qunit.js",
          "../node_modules/sinon/pkg/sinon.js",
          "../lib/jschannel/jschannel.js",
          "../dist/renderjs-latest.js",
          "renderjs_test.js"
        ]);
        equal(root_gadget.element.outerHTML, document.body.outerHTML);
        // Check klass
        equal(root_gadget.constructor.prototype.path, window.location.href);
        equal(root_gadget.constructor.prototype.title, document.title);
        deepEqual(root_gadget.constructor.prototype.interface_list, []);
        deepEqual(root_gadget.constructor.prototype.required_css_list,
                  ["../node_modules/grunt-contrib-qunit/test/libs/qunit.css"]);
        deepEqual(root_gadget.constructor.prototype.required_js_list, [
          "../node_modules/rsvp/dist/rsvp-2.0.4.js",
          "../node_modules/grunt-contrib-qunit/test/libs/qunit.js",
          "../node_modules/sinon/pkg/sinon.js",
          "../lib/jschannel/jschannel.js",
          "../dist/renderjs-latest.js",
          "renderjs_test.js"
        ]);
        var html = root_gadget.constructor.template_element.outerHTML;
        ok(/^<div>\s*<h1 id="qunit-header">/.test(html), html);
        ok(root_gadget instanceof RenderJSGadget);
        ok(root_gadget_klass, root_gadget.constructor);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

}(document, renderJS, QUnit, sinon));
