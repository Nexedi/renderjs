/*jslint nomen: true*/
(function (document, renderJS, QUnit, sinon, URI, URL, Event,
           MutationObserver) {
  "use strict";
  var test = QUnit.test,
    stop = QUnit.stop,
    start = QUnit.start,
    ok = QUnit.ok,
    expect = QUnit.expect,
    equal = QUnit.equal,
    throws = QUnit.throws,
    deepEqual = QUnit.deepEqual,
    module = QUnit.module,
    notEqual = QUnit.notEqual,
    root_gadget_klass = renderJS(window),
    root_gadget_defer = RSVP.defer(),
    RenderJSGadget = __RenderJSGadget,
    RenderJSEmbeddedGadget = __RenderJSEmbeddedGadget,
    RenderJSIframeGadget = __RenderJSIframeGadget;

  // Keep track of the root gadget
  renderJS(window).ready(function (g) {
    root_gadget_defer.resolve([g, this]);
  });


  QUnit.config.testTimeout = 10000;
//   QUnit.config.reorder = false;
//   sinon.log = function (message) {
//     console.log(message);
//   };

  function parseGadgetHTML(html, url) {
    return renderJS.parseGadgetHTMLDocument(
      (new DOMParser()).parseFromString(html, "text/html"),
      url
    );
  }

  function readBlobAsDataURL(blob) {
    var fr = new FileReader();
    return new RSVP.Promise(function (resolve, reject) {
      fr.addEventListener("load", function (evt) {
        resolve(evt.target.result);
      });
      fr.addEventListener("error", reject);
      fr.readAsDataURL(blob);
    }, function () {
      fr.abort();
    });
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
    deepEqual(parseGadgetHTML("", "http://example.org"), {
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
      renderJS.parseGadgetHTMLDocument({}, "http://example.org/gadget.html");
    });
  });

  test("Base url not set with absolute url", function () {
    // Check that parseGadgetHTMLDocument throws an error if the base url is
    // not set with absolute url
    throws(function () {
      parseGadgetHTML("");
    });
    throws(function () {
      parseGadgetHTML("", "./path/to/a/gadget");
    });
  });

  test('Default result value', function () {
    // Check default value returned by parseGadgetHTMLDocument
    deepEqual(renderJS.parseGadgetHTMLDocument(
      document.implementation.createHTMLDocument(""),
      "http://example.org"
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

    settings = parseGadgetHTML(html, "http://example.org");
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

    settings = parseGadgetHTML(html, "http://example.org");
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.required_css_list,
              ['http://example.org/lib/qunit/qunit.css'],
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.required_css_list,
              ['http://example.org/lib/qunit/qunit.css',
               'http://example.org/lib/qunit/qunit2.css'],
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.interface_list,
              ['http://example.org/foo/interface/renderable'],
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.interface_list,
              ['http://example.org/foo/interface/renderable',
               'http://example.org/foo/interface/field'],
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.required_js_list,
              ['http://example.org/lib/qunit/qunit.js'],
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.required_js_list,
              ['http://example.org/lib/qunit/qunit.js',
               'http://example.org/lib/qunit/qunit2.js'],
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

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    deepEqual(settings.required_js_list, [], "JS not found");
  });

  test('Non valid XML (HTML in fact...)', function () {
    // Check default value returned by parseGadgetHTMLDocument
    deepEqual(parseGadgetHTML('<!doctype html><html><head>' +
      '<title>Test non valid XML</title>' +
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
      '</head><body><p>Non valid XML</p></body></html>',
      'http://example.org/foo/'), {
      title: "Test non valid XML",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
//       html: "<p>Non valid XML</p>",
    });
  });

  test('Extract JS even if type="text/javascript" not set', function () {
    var settings,
      html = "<html><head>" +
        "<script src='../lib/qunit/qunit.js'></script" +
        "</head></html>";
    settings = parseGadgetHTML(html, "http://example.org/foo");
    deepEqual(settings.required_js_list,
              ["http://example.org/lib/qunit/qunit.js"]);
  });

  /////////////////////////////////////////////////////////////////
  //cancel when declare gadget
  /////////////////////////////////////////////////////////////////

  module("cancel when declare gadget", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('cancel gadget initialization', function () {
    var gadget = new RenderJSGadget(),
      url = renderJS.getAbsoluteURL('./cancel_gadget.html',
                                    window.location.href),

      cancel_queue,
      observer = new MutationObserver(function (mutations) {
        if (mutations[0].addedNodes[0].src.indexOf('cancel_gadget.js')
            !== -1) {
          //cancel when load cancel_gadget.js
          cancel_queue.cancel();
          observer.disconnect();
        }
      });
    observer.observe(document.head, {
      attributes: true,
      childList: true,
      characterData: true
    });

    stop();
    gadget.__sub_gadget_dict = {};
    cancel_queue = gadget.declareGadget(url);
    return new RSVP.Queue()
      .push(function () {
        return cancel_queue;
      })
      .push(undefined, function (err) {
        ok(err instanceof RSVP.CancellationError);
        //let cancel_gadget.js load
        return RSVP.delay(100);
      })
      .push(function () {
        return gadget.declareGadget(url);
      })
      .push(function (instance) {
        ok(instance.render !== undefined);
      })
      .always(function () {
        start();
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

  test("should call parseGadgetHTMLDocument with url", function () {
    var url = "http://example.org/foo/gadget", spy;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "foo"]);

    spy = sinon.spy(renderJS, "parseGadgetHTMLDocument");

    stop();
    renderJS.declareGadgetKlass(url)
      .then(function () {
        equal(spy.args[0][1], url);
      })
      .always(function () {
        spy.restore();
        start();
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

        equal(Klass.prototype.__path, url);
        deepEqual(Klass.prototype.__acquired_method_dict, {});
        equal(Klass.prototype.__foo, 'bar');
        equal(Klass.__template_element.nodeType, 9);

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

        equal(Klass.prototype.__path, url);
        deepEqual(Klass.prototype.__acquired_method_dict, {});

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
    renderJS.declareJS(url, document.head)
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
    renderJS.declareJS(url, document.head)
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
    renderJS.declareJS(url, document.head)
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
    renderJS.declareJS(url, document.head)
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
    renderJS.declareJS(url, document.head)
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
    renderJS.declareJS(url, document.head)
      .then(function () {
        equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
        document.getElementById("qunit-fixture").textContent = "";
        return renderJS.declareJS(url, document.head);
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
    renderJS.declareCSS(url, document.head)
      .then(function () {
        // IE accept the css
        ok(true, "404 should fail");
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
    renderJS.declareCSS(url, document.head)
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
    renderJS.declareCSS(url, document.head)
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
    renderJS.declareCSS(url, document.head)
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
    renderJS.declareCSS(url, document.head)
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

        return renderJS.declareCSS(url, document.head);
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
    renderJS.declareJS(url, document.head)
      .then(function () {
        renderJS.clearGadgetKlassList();
        equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
        document.getElementById("qunit-fixture").textContent = "";
        return renderJS.declareJS(url, document.head);
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
    renderJS.declareCSS(url, document.head)
      .then(function () {
        renderJS.clearGadgetKlassList();
        equal(
          document.querySelectorAll("link[rel=stylesheet]").length,
          count + 1
        );
        return renderJS.declareCSS(url, document.head);
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
    gadget.__interface_list = "foo";
    stop();
    gadget.getInterfaceList()
      .then(function (result) {
        equal(result, "foo");
      })
      .fail(function (e) {
        ok(false, e);
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
    gadget.__required_css_list = "foo";
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
    gadget.__required_js_list = "foo";
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
    gadget.__path = "foo";
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
    gadget.__title = "foo";
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
        ok(e instanceof Error, e);
        equal(e.message, "No element defined");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.changeState
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.changeState", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('update state with changed keys', function () {
    var gadget = new RenderJSGadget();
    gadget.state = {foo: 'bar', bar: 'foo'};
    stop();
    gadget.changeState({bar: 'barbar'})
      .then(function () {
        deepEqual(gadget.state, {foo: 'bar', bar: 'barbar'});
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('trigger onStateChange if changed keys', function () {
    var gadget = new RenderJSGadget(),
      callback_called = false;
    gadget.state = {foo: 'bar', bar: 'foo'};
    gadget.__state_change_callback = function (modification_dict) {
      deepEqual(gadget.state, {foo: 'bar', bar: 'barbar'});
      deepEqual(modification_dict, {bar: 'barbar'});
      equal(this, gadget);
      return RSVP.Queue()
        .push(function () {
          callback_called = true;
        });
    };
    stop();
    gadget.changeState({bar: 'barbar'})
      .then(function () {
        ok(callback_called);
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('do not trigger onStateChange if no changed keys', function () {
    var gadget = new RenderJSGadget(),
      callback_called = false;
    gadget.state = {foo: 'bar', bar: 'foo'};
    gadget.__state_change_callback = function () {
      callback_called = true;
    };
    stop();
    gadget.changeState({bar: 'foo'})
      .then(function () {
        ok(!callback_called);
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('accumulate modification_dict on onStateChange error', function () {
    var gadget = new RenderJSGadget();
    expect(13);
    gadget.state = {a: 'b', foo: 'bar', bar: 'foo'};
    gadget.__state_change_callback = function (modification_dict) {
      deepEqual(modification_dict, {bar: 'barbar'});
      throw new Error('failure in onStateChange');
    };
    stop();
    gadget.changeState({bar: 'barbar'})
      .then(function () {
        ok(false, 'Expecting an error');
      })
      .fail(function (error) {
        equal(error.message, 'failure in onStateChange');
        deepEqual(gadget.state, {a: 'b', foo: 'bar', bar: 'barbar'});

        gadget.__state_change_callback = function (modification_dict) {
          deepEqual(modification_dict, {bar: 'barbar', foo: 'foofoo'});
          throw new Error('failure2 in onStateChange');
        };
        return gadget.changeState({foo: 'foofoo'});
      })
      .fail(function (error) {
        equal(error.message, 'failure2 in onStateChange');
        deepEqual(gadget.state, {a: 'b', foo: 'foofoo', bar: 'barbar'});

        gadget.__state_change_callback = function (modification_dict) {
          deepEqual(modification_dict, {bar: 'barbar', foo: 'f'});
          throw new Error('failure3 in onStateChange');
        };
        return gadget.changeState({foo: 'f'});
      })
      .fail(function (error) {
        equal(error.message, 'failure3 in onStateChange');
        deepEqual(gadget.state, {a: 'b', foo: 'f', bar: 'barbar'});

        gadget.__state_change_callback = function (modification_dict) {
          deepEqual(modification_dict, {a: 'c', bar: 'barbar', foo: 'f'});
        };
        return gadget.changeState({a: 'c'});
      })
      .then(function () {
        deepEqual(gadget.state, {a: 'c', foo: 'f', bar: 'barbar'});


        gadget.__state_change_callback = function (modification_dict) {
          deepEqual(modification_dict, {a: 'd'});
        };
        return gadget.changeState({a: 'd'});
      })
      .then(function () {
        deepEqual(gadget.state, {a: 'd', foo: 'f', bar: 'barbar'});
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareAcquiredMethod
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareAcquiredMethod", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('is chainable', function () {
    // Check that declareAcquiredMethod is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

    gadget = new Klass();
    equal(gadget.testFoo, undefined);
    result = Klass.declareAcquiredMethod('testFoo', 'testBar');
    // declareAcquiredMethod is chainable
    equal(result, Klass);
  });

  test('creates methods on the prototype', function () {
    // Check that declareAcquiredMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

    gadget = new Klass();
    equal(gadget.testFoo, undefined);
    Klass.declareAcquiredMethod('testFoo', 'testBar');
    // Method is added on the instance class prototype
    equal(RenderJSGadget.prototype.testFoo, undefined);
    ok(gadget.testFoo !== undefined);
    ok(Klass.prototype.testFoo !== undefined);
    equal(Klass.prototype.testFoo, gadget.testFoo);

  });

  test('returns __aq_parent result if acquired_method does not exists',
    function () {
      // Subclass RenderJSGadget to not pollute its namespace
      var Klass = function () {
        RenderJSGadget.call(this);
      }, gadget,
        __aq_parent_called = false,
        original_method_name = "foo",
        original_argument_list = ["foobar", "barfoo"];
      Klass.prototype = new RenderJSGadget();
      Klass.prototype.constructor = Klass;
      Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

      Klass.declareAcquiredMethod("checkIfAqDynamicIsUndefined",
                                 original_method_name);

      gadget = new Klass();


      gadget.__aq_parent = function (method_name, argument_list) {
        __aq_parent_called = true;
        equal(this, gadget, "Context should be kept");
        equal(method_name, original_method_name, "Method name should be kept");
        deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        return "FOO";
      };

      stop();
      gadget.checkIfAqDynamicIsUndefined("foobar", "barfoo")
        .then(function (result) {
          equal(result, "FOO");
          equal(__aq_parent_called, true);
        })
        .always(function () {
          start();
        });
    });

  test('fails if __aq_parent throws an error', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget,
      original_error = new Error("Custom error for the test");
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

    Klass.declareAcquiredMethod("checkIfAqParentThrowsError",
                               "foo");

    gadget = new Klass();

    gadget.__aq_parent = function () {
      throw original_error;
    };

    stop();
    gadget.checkIfAqParentThrowsError()
      .fail(function (error) {
        equal(error, original_error);
        equal(error.message, "Custom error for the test");
      })
      .always(function () {
        start();
      });
  });

  test('fails if __aq_parent is not defined', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

    Klass.declareAcquiredMethod("checkIfAqParentIsUndefined",
                               "foo");

    gadget = new Klass();

    stop();
    gadget.checkIfAqParentIsUndefined()
      .fail(function (error) {
        ok(error instanceof TypeError);
        ok((error.message ===
              "gadget.__aq_parent is not a function") ||
           (error.message ===
              "undefined is not a function") ||
           (error.message.indexOf("__aq_parent") !== -1), error);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.allowPublicAcquisition
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.allowPublicAcquiredMethod", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('is chainable', function () {
    // Check that allowPublicAcquisition is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.prototype.__acquired_method_dict = {};
    Klass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    result = Klass.allowPublicAcquisition('testFoo', function () {
      return;
    });
    // allowPublicAcquisition is chainable
    equal(result, Klass);
  });

  test('creates methods on the prototype', function () {
    // Check that allowPublicAcquisition create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.prototype.__acquired_method_dict = {};
    Klass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    function testFoo() {
      return "OK";
    }
    Klass.allowPublicAcquisition('testFoo', testFoo);
    deepEqual(
      Klass.prototype.__acquired_method_dict,
      {'testFoo': testFoo}
    );
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.__aq_parent
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.__aq_parent", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('__aq_parent does not exist by default', function () {
    var gadget = new RenderJSGadget();
    equal(gadget.__aq_parent, undefined);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJS.getAbsoluteURL
  /////////////////////////////////////////////////////////////////

  module("RenderJS.getAbsoluteURL");

  test('make a relative url absolute with an absolute base url', function () {
    var url = "../foo/bar",
      base_url = "http://example.org/some/path/";

    equal(renderJS.getAbsoluteURL(url, base_url),
          "http://example.org/some/foo/bar");
  });

  test('do not translate absolute url', function () {
    var url = "http://example.net/foo/bar",
      base_url = "http://example.org/some/path/";

    equal(renderJS.getAbsoluteURL(url, base_url), url);
  });

  test('do not translate data url', function () {
    var first_url = "data:application/javascript;base64,something()",
      second_url = "http://example.org/some/path/";

    equal(renderJS.getAbsoluteURL(first_url, second_url), first_url);
  });

  test('return undefined if relative url not passed', function () {
    equal(renderJS.getAbsoluteURL(), undefined);
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
    Klass.__ready_list = [];
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
    Klass.__ready_list = [];
    Klass.ready = RenderJSGadget.ready;

    Klass.ready(callback);
    // ready is chainable
    deepEqual(Klass.__ready_list, [callback]);
  });


  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.setState
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.setState", {
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
  test('is chainable', function () {
    // Check that setState is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__ready_list = [];
    Klass.ready = RenderJSGadget.ready;
    Klass.setState = RenderJSGadget.setState;

    result = Klass.setState({});
    equal(result, Klass);
  });

  test('create callback in the ready_list property', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__ready_list = [];
    Klass.ready = RenderJSGadget.ready;
    Klass.setState = RenderJSGadget.setState;

    Klass.setState({foo: 'bar'});
    equal(Klass.__ready_list.length, 1);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.onStateChange
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.onStateChange", {
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
  test('is chainable', function () {
    // Check that onStateChange is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__ready_list = [];
    Klass.onStateChange = RenderJSGadget.onStateChange;

    result = Klass.onStateChange();
    equal(result, Klass);
  });

  test('create callback in the __state_change_callback property', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    },
      callback = {};
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.onStateChange = RenderJSGadget.onStateChange;

    Klass.onStateChange(callback);
    equal(Klass.prototype.__state_change_callback, callback);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareService
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareService", {
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
  test('is chainable', function () {
    // Check that declareService is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.declareService = RenderJSGadget.declareService;

    result = Klass.declareService(function () {
      return;
    });
    // declareService is chainable
    equal(result, Klass);
  });

  test('store callback in the service_list property', function () {
    // Check that declareService is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    },
      callback = function () {return; };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.declareService = RenderJSGadget.declareService;

    Klass.declareService(callback);
    // declareService is chainable
    deepEqual(Klass.__service_list, [callback]);
  });

  /////////////////////////////////////////////////////////////////
  // Service status
  /////////////////////////////////////////////////////////////////
  function declareServiceToCheck(klass, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.declareService(function () {
      service_status.start_count += 1;
      return new RSVP.Queue()
        .push(function () {
          service_status.status = "started";
          return RSVP.defer().promise;
        })
        .push(undefined, function (error) {
          service_status.stop_count += 1;
          if (error instanceof RSVP.CancellationError) {
            service_status.status = "stopped";
          } else {
            service_status.status = "error";
          }
          throw error;
        });
    });
  }

  test('service untouched when gadget never in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test500.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareServiceToCheck(Klass, service1);
        declareServiceToCheck(Klass, service2);
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (g) {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 0);
        equal(service1.stop_count, 0);
        equal(service1.status, undefined);
        equal(service2.start_count, 0);
        equal(service2.stop_count, 0);
        equal(service2.status, undefined);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started when gadget created in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test501.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareServiceToCheck(Klass, service1);
        declareServiceToCheck(Klass, service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (g) {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");
        equal(service2.start_count, 1);
        equal(service2.stop_count, 0);
        equal(service2.status, "started");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started when gadget element added in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test502.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareServiceToCheck(Klass, service1);
        declareServiceToCheck(Klass, service2);
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (g) {
        document
          .getElementById('qunit-fixture')
          .querySelector("div")
          .appendChild(g.element);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");
        equal(service2.start_count, 1);
        equal(service2.stop_count, 0);
        equal(service2.status, "started");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started when gadget parent element added in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      parent_element = document.createElement("div"),
      html_url = 'https://example.org/files/qunittest/test503.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareServiceToCheck(Klass, service1);
        declareServiceToCheck(Klass, service2);
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (g) {
        parent_element.appendChild(g.element);
        document
          .getElementById('qunit-fixture')
          .appendChild(parent_element);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");
        equal(service2.start_count, 1);
        equal(service2.stop_count, 0);
        equal(service2.status, "started");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service stopped when gadget element removed from DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test504.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareServiceToCheck(Klass, service1);
        declareServiceToCheck(Klass, service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .innerHTML = "";
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 1);
        equal(service1.status, "stopped");
        equal(service2.start_count, 1);
        equal(service2.stop_count, 1);
        equal(service2.status, "stopped");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service stopped when gadget parent element removed from DOM',
      function () {
      // Subclass RenderJSGadget to not pollute its namespace
      var service1 = {},
        service2 = {},
        gadget = new RenderJSGadget(),
        parent_element = document.createElement("div"),
        html_url = 'https://example.org/files/qunittest/test505.html';
      gadget.__sub_gadget_dict = {};

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body></body></html>"]);

      document.getElementById('qunit-fixture').innerHTML = "";
      stop();
      renderJS.declareGadgetKlass(html_url)
        .then(function (Klass) {
          declareServiceToCheck(Klass, service1);
          declareServiceToCheck(Klass, service2);
          return gadget.declareGadget(
            html_url
          );
        })
        .then(function (g) {
          parent_element.appendChild(g.element);
          document
            .getElementById('qunit-fixture')
            .appendChild(parent_element);
          return RSVP.delay(50);
        })
        .then(function () {
          document
            .getElementById('qunit-fixture')
            .innerHTML = "";
          return RSVP.delay(50);
        })
        .then(function () {
          equal(service1.start_count, 1);
          equal(service1.stop_count, 1);
          equal(service1.status, "stopped");
          equal(service2.start_count, 1);
          equal(service2.stop_count, 1);
          equal(service2.status, "stopped");
        })
        .fail(function (e) {
          ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('service can be restarted', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      created_gadget,
      html_url = 'https://example.org/files/qunittest/test506.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareServiceToCheck(Klass, service1);
        declareServiceToCheck(Klass, service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (g) {
        created_gadget = g;
        return RSVP.delay(50);
      })
      .then(function () {
        document.getElementById('qunit-fixture').innerHTML = "";
        return RSVP.delay(50);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .appendChild(created_gadget.element);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 2);
        equal(service1.stop_count, 1);
        equal(service1.status, "started");
        equal(service2.start_count, 2);
        equal(service2.stop_count, 1);
        equal(service2.status, "started");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // Service error handling
  /////////////////////////////////////////////////////////////////
  test('Service error are reported to parent gadget', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var ParentKlass = function () {
      RenderJSGadget.call(this);
    },
      gadget,
      catched_error,
      html_url = 'https://example.org/files/qunittest/test508.html';
    ParentKlass.prototype = new RenderJSGadget();
    ParentKlass.prototype.constructor = ParentKlass;
    ParentKlass.prototype.__acquired_method_dict = {};
    ParentKlass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    ParentKlass.allowPublicAcquisition('reportServiceError',
                                       function (argument_list) {
        catched_error = argument_list[0];
        return;
      });

    gadget = new ParentKlass();
    gadget.__sub_gadget_dict = {};

    // Subclass RenderJSGadget to not pollute its namespace

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {

        Klass.declareService(function () {
          throw new Error("My service crashed!");
        });

        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        ok(catched_error instanceof Error);
        equal(
          catched_error.message,
          "My service crashed!"
        );
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Service error stops the other services', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var ParentKlass = function () {
      RenderJSGadget.call(this);
    },
      gadget,
      service2 = {},
      html_url = 'https://example.org/files/qunittest/test509.html';
    ParentKlass.prototype = new RenderJSGadget();
    ParentKlass.prototype.constructor = ParentKlass;
    ParentKlass.prototype.__acquired_method_dict = {};
    ParentKlass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    ParentKlass.allowPublicAcquisition('reportServiceError',
                                       function (argument_list) {
        return;
      });

    gadget = new ParentKlass();
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {

        declareServiceToCheck(Klass, service2);
        Klass.declareService(function () {
          throw new Error("My service crashed!");
        });

        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service2.start_count, 1);
        equal(service2.stop_count, 1);
        equal(service2.status, "stopped");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });


  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.onEvent
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.onEvent", {
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
  test('is chainable', function () {
    // Check that declareService is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.onEvent = RenderJSGadget.onEvent;

    result = Klass.onEvent(function () {
      return;
    });
    // onEvent is chainable
    equal(result, Klass);
  });

  test('create callback in the service_list property', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    },
      callback = function () {return; };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.onEvent = RenderJSGadget.onEvent;

    Klass.onEvent('foo', callback);
    equal(Klass.__service_list.length, 1);
  });

  function declareEventToCheck(klass, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.onEvent('bar', function (evt) {
      service_status.start_count += 1;
      return new RSVP.Queue()
        .push(function () {
          service_status.status = "started";
          return RSVP.defer().promise;
        })
        .push(undefined, function (error) {
          service_status.stop_count += 1;
          if (error instanceof RSVP.CancellationError) {
            service_status.status = "stopped";
          } else {
            service_status.status = "error";
          }
          throw error;
        });
    });
  }

  test('callback is triggered on event', function () {
    var service1 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test599.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareEventToCheck(Klass, service1);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (g) {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 0);
        equal(service1.stop_count, 0);
        equal(service1.status, undefined);

        var event = new Event("bar");
        document.getElementById('qunit-fixture').querySelector("div")
                                                .dispatchEvent(event);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");

        var event = new Event("bar");
        document.getElementById('qunit-fixture').querySelector("div")
                                                .dispatchEvent(event);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 2);
        equal(service1.stop_count, 1);
        equal(service1.status, "started");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareJob
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareJob", {
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

  test('is chainable', function () {
    // Check that declareJob is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.declareJob = RenderJSGadget.declareJob;

    result = Klass.declareJob('runServiceMethod', function () {
      return;
    });
    // onEvent is chainable
    equal(result, Klass);
  });


  test('creates methods on the prototype', function () {
    // Check that declareMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareJob = RenderJSGadget.declareJob;

    gadget = new Klass();
    equal(gadget.testFoo, undefined);
    Klass.declareJob('testFoo', function () {
      return;
    });
    // Method is added on the instance class prototype
    equal(RenderJSGadget.prototype.testFoo, undefined);
    ok(gadget.testFoo !== undefined);
    ok(Klass.prototype.testFoo !== undefined);
    equal(Klass.prototype.testFoo, gadget.testFoo);
  });

  /////////////////////////////////////////////////////////////////
  // Service status
  /////////////////////////////////////////////////////////////////
  function declareJobToCheck(klass, name, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.declareJob(name, function (parameter) {
      service_status.start_count += 1;
      service_status.parameter = parameter;
      return new RSVP.Queue()
        .push(function () {
          service_status.status = "started";
          return RSVP.defer().promise;
        })
        .push(undefined, function (error) {
          service_status.stop_count += 1;
          if (error instanceof RSVP.CancellationError) {
            service_status.status = "stopped";
          } else {
            service_status.status = "error";
          }
          throw error;
        });
    });
  }

  test('job untouched when gadget not in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test500.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        declareJobToCheck(Klass, 'runJob2', service2);
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (result) {
        g = result;
        return RSVP.all([
          g.runJob1('foo'),
          g.runJob2('bar')
        ]);
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 0);
        equal(service1.stop_count, 0);
        equal(service1.status, undefined);
        equal(service1.parameter, undefined);
        equal(service2.start_count, 0);
        equal(service2.stop_count, 0);
        equal(service2.status, undefined);
        equal(service2.parameter, undefined);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job triggered when gadget in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test501.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        declareJobToCheck(Klass, 'runJob2', service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (result) {
        g = result;
        return RSVP.all([
          g.runJob1('foo'),
          g.runJob2('bar')
        ]);
      })
      .then(function (g) {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");
        equal(service1.parameter, 'foo');
        equal(service2.start_count, 1);
        equal(service2.stop_count, 0);
        equal(service2.status, "started");
        equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job triggered when gadget element added in DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test502.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        declareJobToCheck(Klass, 'runJob2', service2);
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (result) {
        g = result;
        return RSVP.all([
          g.runJob1('foo'),
          g.runJob2('bar')
        ]);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .querySelector("div")
          .appendChild(g.element);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");
        equal(service1.parameter, 'foo');
        equal(service2.start_count, 1);
        equal(service2.stop_count, 0);
        equal(service2.status, "started");
        equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job stopped when gadget element removed from DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test504.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        declareJobToCheck(Klass, 'runJob2', service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (result) {
        g = result;
        return RSVP.all([
          g.runJob1('foo'),
          g.runJob2('bar')
        ]);
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .innerHTML = "";
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 1);
        equal(service1.status, "stopped");
        equal(service1.parameter, 'foo');
        equal(service2.start_count, 1);
        equal(service2.stop_count, 1);
        equal(service2.status, "stopped");
        equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job can not be restarted', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      created_gadget,
      html_url = 'https://example.org/files/qunittest/test506.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        declareJobToCheck(Klass, 'runJob2', service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (result) {
        created_gadget = result;
        return RSVP.all([
          created_gadget.runJob1('foo'),
          created_gadget.runJob2('bar')
        ]);
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        document.getElementById('qunit-fixture').innerHTML = "";
        return RSVP.delay(50);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .appendChild(created_gadget.element);
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 1);
        equal(service1.status, "stopped");
        equal(service1.parameter, 'foo');
        equal(service2.start_count, 1);
        equal(service2.stop_count, 1);
        equal(service2.status, "stopped");
        equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job can be triggered multiple times', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test501.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        declareJobToCheck(Klass, 'runJob2', service2);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (result) {
        g = result;
        return RSVP.all([
          g.runJob1('foo'),
          g.runJob2('bar')
        ]);
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        g.runJob1('foo2');
        return RSVP.delay(50);
      })
      .then(function () {
        // First job should be cancelled
        equal(service1.start_count, 2);
        equal(service1.stop_count, 1);
        equal(service1.status, "started");
        equal(service1.parameter, 'foo2');
        equal(service2.start_count, 1);
        equal(service2.stop_count, 0);
        equal(service2.status, "started");
        equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job is local to a gadget instance', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test501.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML =
      "<div></div><span></span>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareJobToCheck(Klass, 'runJob1', service1);
        return RSVP.all([
          gadget.declareGadget(
            html_url,
            {element: document.getElementById('qunit-fixture')
                              .querySelector("span")}
          ),
          gadget.declareGadget(
            html_url,
            {element: document.getElementById('qunit-fixture')
                              .querySelector("div")}
          )
        ]);
      })
      .then(function (result_list) {
        g = result_list[1];
        return g.runJob1('foo');
      })
      .then(function (g) {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(service1.start_count, 1);
        equal(service1.stop_count, 0);
        equal(service1.status, "started");
        equal(service1.parameter, 'foo');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // Job error handling
  /////////////////////////////////////////////////////////////////
  test('Job error are reported to parent gadget', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var ParentKlass = function () {
      RenderJSGadget.call(this);
    },
      gadget,
      catched_error,
      html_url = 'https://example.org/files/qunittest/test508.html';
    ParentKlass.prototype = new RenderJSGadget();
    ParentKlass.prototype.constructor = ParentKlass;
    ParentKlass.prototype.__acquired_method_dict = {};
    ParentKlass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    ParentKlass.allowPublicAcquisition('reportServiceError',
                                       function (argument_list) {
        catched_error = argument_list[0];
        return;
      });

    gadget = new ParentKlass();
    gadget.__sub_gadget_dict = {};

    // Subclass RenderJSGadget to not pollute its namespace

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {

        Klass.declareJob('crashJob', function () {
          throw new Error("My service crashed!");
        });

        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (g) {
        return g.crashJob('foo');
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        ok(catched_error instanceof Error);
        equal(
          catched_error.message,
          "My service crashed!"
        );
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Job error are reported after added to the DOM', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var ParentKlass = function () {
      RenderJSGadget.call(this);
    },
      gadget,
      g,
      catched_error,
      html_url = 'https://example.org/files/qunittest/test508.html';
    ParentKlass.prototype = new RenderJSGadget();
    ParentKlass.prototype.constructor = ParentKlass;
    ParentKlass.prototype.__acquired_method_dict = {};
    ParentKlass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    ParentKlass.allowPublicAcquisition('reportServiceError',
                                       function (argument_list) {
        catched_error = argument_list[0];
        return;
      });

    gadget = new ParentKlass();
    gadget.__sub_gadget_dict = {};

    // Subclass RenderJSGadget to not pollute its namespace

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {

        Klass.declareJob('crashJob', function () {
          throw new Error("My service crashed!");
        });

        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (result) {
        g = result;
        return g.crashJob('foo');
      })
      .then(function () {
        return RSVP.delay(50);
      })
      .then(function () {
        equal(catched_error, undefined);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .querySelector("div")
          .appendChild(g.element);
        return RSVP.delay(50);
      })
      .then(function () {
        ok(catched_error instanceof Error);
        equal(
          catched_error.message,
          "My service crashed!"
        );
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
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
    ok(gadget.__aq_parent === undefined);
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
    ok(gadget.__aq_parent === undefined);
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
    gadget.__sub_gadget_dict = {};

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
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, html]);

    stop();
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function (new_gadget) {
        equal(new_gadget.__path, url);
        deepEqual(new_gadget.__acquired_method_dict, {});
        ok(new_gadget instanceof RenderJSGadget);
      })
      .always(function () {
        start();
      });
  });

  test('Initialize sub_gadget_dict private property', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = 'https://example.org/files/qunittest/test',
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, html]);

    stop();
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function (new_gadget) {
        ok(new_gadget.hasOwnProperty("__sub_gadget_dict"));
        deepEqual(new_gadget.__sub_gadget_dict, {});
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
    gadget.__sub_gadget_dict = {};

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
        equal(new_gadget.element.innerHTML,
              "<p>Bar content</p>");
        equal(new_gadget.element.tagName,
              "DIV");
        equal(new_gadget.element.getAttribute("data-gadget-url"),
              html_url);
        equal(new_gadget.element.getAttribute("data-gadget-sandbox"),
              "public");
        notEqual(new_gadget.element.getAttribute("data-gadget-scope"),
              null);
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

  test('load dependency in the right order', function () {
    // Check that JS dependencies are loaded in the right order
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test22.html',
      js1_url = "data:application/javascript;base64," +
         window.btoa(
          "test_js1 = {};"
        ),
      js2_url = "data:application/javascript;base64," +
         window.btoa(
          "test_js1.test_js2 = {}"
        ),
      js3_url = "data:application/javascript;base64," +
         window.btoa(
          "test_js1.test_js2.test_js3 = {}"
        ),
      js4_url = "data:application/javascript;base64," +
         window.btoa(
          "test_js1.test_js2.test_js3.test_js4 = {}"
        ),
      js5_url = "data:application/javascript;base64," +
         window.btoa(
          "test_js1.test_js2.test_js3.test_js4.test_js5 = {}"
        ),
      js6_url = "data:application/javascript;base64," +
         window.btoa(
          "test_js1.test_js2.test_js3.test_js4.test_js5.test_js6 = 'foo'"
        ),
      html = "<html>" +
        "<head>" +
        "<title>Foo title</title>" +
        "<script src='" + js1_url + "' type='text/javascript'></script>" +
        "<script src='" + js2_url + "' type='text/javascript'></script>" +
        "<script src='" + js3_url + "' type='text/javascript'></script>" +
        "<script src='" + js4_url + "' type='text/javascript'></script>" +
        "<script src='" + js5_url + "' type='text/javascript'></script>" +
        "<script src='" + js6_url + "' type='text/javascript'></script>" +
        "</head><body><p>Bar content</p></body></html>";
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, html]);

    stop();
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        equal(window.test_js1.test_js2.test_js3.test_js4.test_js5.test_js6,
              'foo');
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
      });

  });

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
    gadget.__sub_gadget_dict = {};

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
    gadget.__sub_gadget_dict = {};

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
    gadget.__sub_gadget_dict = {};

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
      ready_gadget,
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.ready(function (g) {
          equal(g, this, "Context should be the gadget instance");
          ready_gadget = g;
          return RSVP.delay(50).then(function () {
            // Modify the value after 50ms
            called = true;
          });
        });
        return gadget.declareGadget(html_url);
      })
      .then(function (result) {
        equal(result, ready_gadget, "Context should be the gadget instance");
        ok(called);
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('getDeclareGadget can be called in ready', function () {

    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html',
      html_url2 = 'https://example.org/files/qunittest/test989.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);
    this.server.respondWith("GET", html_url2, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.ready(function (g) {
          return g.declareGadget(html_url2);
        });
        return gadget.declareGadget(html_url);
      })
      .then(function () {
        ok(true);
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Set a default state', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      gadget1,
      gadget2,
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(html_url);
      })
      .then(function (result) {
        gadget1 = result;
        return gadget.declareGadget(html_url);
      })
      .then(function (result) {
        gadget2 = result;
        ok(gadget1.hasOwnProperty('state'));
        deepEqual(gadget1.state, {});
        ok(gadget2.hasOwnProperty('state'));
        deepEqual(gadget2.state, {});
        // Instance should have a copy of the init state
        ok(gadget1.state !== gadget2.state);
      })
      .fail(function (e) {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Set the gadget state defined by setState', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      init_state = {foo: 'bar'},
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.setState(init_state);
        return gadget.declareGadget(html_url);
      })
      .then(function (result) {
        ok(result.hasOwnProperty('state'));
        deepEqual(result.state, {foo: 'bar'});
        // Instance should have a copy of the init state
        ok(result.state !== init_state);
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
    gadget.__sub_gadget_dict = {};

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

  test('Can take a scope options', function () {

    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    document.getElementById('qunit-fixture').textContent = "";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url,
          {scope: "foo"}
        );
      })
      .then(function (child_gadget) {
        ok(gadget.__sub_gadget_dict.hasOwnProperty("foo"));
        equal(gadget.__sub_gadget_dict.foo, child_gadget);
        equal(child_gadget.element.getAttribute("data-gadget-scope"),
              "foo");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Generate a random scope if none is provided', function () {

    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html',
      scope1,
      scope_index;
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    document.getElementById('qunit-fixture').textContent = "";
    stop();
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (child_gadget) {
        scope1 = child_gadget.element.getAttribute("data-gadget-scope");
        equal(scope1.indexOf('RJS_'), 0, scope1);
        ok(gadget.__sub_gadget_dict.hasOwnProperty(scope1));
        equal(gadget.__sub_gadget_dict[scope1], child_gadget);
      })
      .then(function () {
        // Create a gadget with a fixed scope to ensure
        // scope generation does not erase existing scope
        scope_index = parseInt(scope1.substr('RJS_'.length), 10);
        return gadget.declareGadget(
          html_url,
          {scope: 'RJS_' + (scope_index + 1)}
        );
      })
      .then(function () {
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (child_gadget) {
        var scope2 = child_gadget.element.getAttribute("data-gadget-scope");
        equal(scope2.indexOf('RJS_'), 0);
        ok(gadget.__sub_gadget_dict.hasOwnProperty(scope1));
        ok(gadget.__sub_gadget_dict.hasOwnProperty(scope2));
        equal(gadget.__sub_gadget_dict[scope2], child_gadget);
        notEqual(scope1, scope2);
        equal(scope2, 'RJS_' + (scope_index + 2));
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent returns acquired_method result if available', function () {
    var gadget = new RenderJSGadget(),
      aq_dynamic_called = false,
      original_method_name = "foo",
      original_argument_list = ["foobar", "barfoo"],
      html_url = 'http://example.org/files/qunittest/test353.html';

    gadget.__sub_gadget_dict = {};
    gadget.__acquired_method_dict = {};
    gadget.__acquired_method_dict[original_method_name] =
      function (argument_list, child_scope) {
        aq_dynamic_called = true;
        equal(this, gadget, "Context should be kept");
        deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        equal(child_scope.indexOf('RJS_'), 0,
              "Random child scope is generated");
        return "FOO";
      };

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        return new_gadget.__aq_parent(
          original_method_name,
          original_argument_list
        );
      })
      .then(function (result) {
        equal(result, "FOO");
        equal(aq_dynamic_called, true);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent propagate child_scope to acquired_method', function () {
    var gadget = new RenderJSGadget(),
      aq_dynamic_called = false,
      original_method_name = "foo",
      original_argument_list = ["foobar", "barfoo"],
      html_url = 'http://example.org/files/qunittest/test353.html';

    gadget.__acquired_method_dict = {};
    gadget.__sub_gadget_dict = {};
    gadget.__acquired_method_dict[original_method_name] =
      function (argument_list, child_scope) {
        aq_dynamic_called = true;
        equal(this, gadget, "Context should be kept");
        deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        equal(child_scope, "bar", "Child scope should be provided");
      };

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    gadget.declareGadget(html_url, {scope: "bar"})
      .then(function (new_gadget) {
        return new_gadget.__aq_parent(
          original_method_name,
          original_argument_list
        );
      })
      .then(function (result) {
        equal(aq_dynamic_called, true);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent doesnt propagate unknown gadget child_scope', function () {
    var gadget = new RenderJSGadget(),
      aq_dynamic_called = false,
      original_method_name = "foo",
      original_argument_list = ["foobar", "barfoo"],
      html_url = 'http://example.org/files/qunittest/test353.html',
      new_gadget;

    gadget.__acquired_method_dict = {};
    gadget.__sub_gadget_dict = {};
    gadget.__acquired_method_dict[original_method_name] =
      function (argument_list, child_scope) {
        aq_dynamic_called = true;
        equal(this, gadget, "Context should be kept");
        deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        equal(child_scope, undefined, "Child scope should be unknown");
      };

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    gadget.declareGadget(html_url, {scope: "bar"})
      .then(function (result) {
        new_gadget = result;
        return gadget.dropGadget("bar");
      })
      .then(function () {
        return new_gadget.__aq_parent(
          original_method_name,
          original_argument_list
        );
      })
      .then(function (result) {
        equal(aq_dynamic_called, true);
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent fails if aquired_method throws an error', function () {
    var gadget = new RenderJSGadget(),
      original_error = new Error("Custom error for the test"),
      html_url = 'http://example.org/files/qunittest/test353.html';

    gadget.__sub_gadget_dict = {};
    gadget.__acquired_method_dict = {};
    gadget.__acquired_method_dict.foo = function () {
      throw original_error;
    };

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    stop();
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        return new_gadget.__aq_parent("foo", []);
      })
      .fail(function (error) {
        equal(error, original_error);
        equal(error.message, "Custom error for the test");
      })
      .always(function () {
        start();
      });
  });

  test('returns __aq_parent result if acquired_method raises AcquisitionError',
    function () {
      var gadget = new RenderJSGadget(),
        i = 0,
        aq_dynamic_called = false,
        __aq_parent_called = false,
        original_method_name = "foo",
        original_argument_list = ["foobar", "barfoo"],
        html_url = 'http://example.org/files/qunittest/test353.html';

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body></body></html>"]);

      gadget.__sub_gadget_dict = {};
      gadget.__acquired_method_dict = {};
      gadget.__acquired_method_dict[original_method_name] =
        function () {
          aq_dynamic_called = true;
          equal(i, 0, "aquired_method called first");
          i += 1;
          throw new renderJS.AcquisitionError("please call __aq_parent!");
        };

      gadget.__aq_parent = function (method_name, argument_list) {
        __aq_parent_called = true;
        equal(i, 1, "__aq_parent called after acquired_method");
        equal(this, gadget, "Context should be kept");
        equal(method_name, original_method_name, "Method name should be kept");
        deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        return "FOO";
      };

      stop();
      gadget.declareGadget(html_url)
        .then(function (new_gadget) {
          return new_gadget.__aq_parent(original_method_name,
                                        original_argument_list);
        })
        .then(function (result) {
          equal(result, "FOO");
          equal(aq_dynamic_called, true);
          equal(__aq_parent_called, true);
        })
        .always(function () {
          start();
        });
    });

  test('path must be absolute to parent path if relative', function () {
    var parent_gadget = new RenderJSGadget(),
      gadget_path = "./some/path/to/a/gadget",
      parent_path = "http://something.org",
      absolute_path = "http://something.org/some/path/to/a/gadget";

    parent_gadget.__sub_gadget_dict = {};
    parent_gadget.__path = parent_path;
    this.server.respondWith("GET", absolute_path, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    stop();
    parent_gadget.declareGadget(gadget_path)
      .then(function (gadget) {
        equal(gadget.__path, absolute_path);
      })
      .fail(function (e) {
        ok(false);
      })
      .always(start);
  });

  test('can declareGadget without scope in HTML directly', function () {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test12345.html',
      html_url2 = 'https://example.org/files/qunittest/test12346.html',
      spy,
      scope;
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div data-foo='bar' " +
       "data-gadget-url='" + html_url2 +
       "'></div></body></html>"]);
    this.server.respondWith("GET", html_url2, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    spy = sinon.spy(renderJS, "parseGadgetHTMLDocument");

    stop();
    gadget.declareGadget(html_url)
      .then(function (g) {
        equal(spy.callCount, 2);
        equal(spy.firstCall.args[1], html_url);
        equal(spy.secondCall.args[1], html_url2);

        var key_list = Object.keys(g.__sub_gadget_dict);
        equal(key_list.length, 1, "One child");
        scope = key_list[0];
        equal(scope.indexOf('RJS_'), 0, scope);

        // Second gadget is a child
        return g.getDeclaredGadget(scope);
      })
      .then(function (g2) {
        equal(g2.__path, html_url2);
        // The gadget element is the one defined in HTML
        equal(g2.element.getAttribute("data-foo"), "bar");
        equal(g2.element.getAttribute("data-gadget-scope"), scope);

        // The gadget is public by default
        equal(g2.element.innerHTML, "raw html");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
        spy.restore();
      });
  });


  test('can declareGadget with scope in HTML directly', function () {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test12345.html',
      html_url2 = 'https://example.org/files/qunittest/test12346.html',
      spy;
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div data-foo='bar' " +
       "data-gadget-scope='bar' data-gadget-url='" + html_url2 +
       "'></div></body></html>"]);
    this.server.respondWith("GET", html_url2, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    spy = sinon.spy(renderJS, "parseGadgetHTMLDocument");

    stop();
    gadget.declareGadget(html_url)
      .then(function (g) {
        equal(spy.callCount, 2);
        equal(spy.firstCall.args[1], html_url);
        equal(spy.secondCall.args[1], html_url2);
        // Second gadget is a child
        return g.getDeclaredGadget("bar");
      })
      .then(function (g2) {
        equal(g2.__path, html_url2);
        // The gadget element is the one defined in HTML
        equal(g2.element.getAttribute("data-foo"), "bar");
        // The gadget is public by default
        equal(g2.element.innerHTML, "raw html");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
        spy.restore();
      });
  });

  test('can declareGadget a sandboxed gadget in HTML directly', function () {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test123456.html',
      html_url2 = renderJS.getAbsoluteURL('./embedded.html',
                                          window.location.href);

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div data-foo='bar' " +
       "data-gadget-sandbox='iframe' " +
       "data-gadget-scope='bar' data-gadget-url='" + html_url2 +
       "'></div></body></html>"]);

    gadget.__sub_gadget_dict = {};
    gadget.__aq_parent = function (method_name, argument_list) {
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    document.getElementById("qunit-fixture").textContent = "";

    stop();
    gadget.declareGadget(html_url, {
      element: document.getElementById('qunit-fixture')
    })
      .then(function (g) {
        return g.getDeclaredGadget("bar");
      })
      .then(function (g2) {
        equal(g2.__path, html_url2);
        // The gadget element is the one defined in HTML
        equal(g2.element.getAttribute("data-foo"), "bar");
        // The gadget is inside an iframe
        equal(g2.element.innerHTML,
              '<iframe src="' + html_url2 + '"></iframe>');
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('fail if declareGadget with scope in HTML fail', function () {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test12345.html',
      html_url2 = 'https://example.org/files/qunittest/test12346.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div data-foo='bar' " +
       "data-gadget-scope='bar' data-gadget-url='" + html_url2 +
       "'></div></body></html>"]);
    this.server.respondWith("GET", html_url2, [403, {
      "Content-Type": "text/html"
    }, "raw html"]);

    stop();
    gadget.declareGadget(html_url)
      .then(function () {
        ok(false);
      })
      .fail(function (e) {
        equal(e.status, 403);
        equal(e.url, html_url2);
      })
      .always(start);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (iframe)
  /////////////////////////////////////////////////////////////////
  test('Require the element options', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

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

  test('Can take a scope options', function () {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      url = "./embedded.html";

    gadget.__sub_gadget_dict = {};

    document.getElementById("qunit-fixture").textContent = "";

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture'),
      scope: "foo"
    })
      .then(function (child_gadget) {
        ok(gadget.__sub_gadget_dict.hasOwnProperty("foo"));
        equal(gadget.__sub_gadget_dict.foo, child_gadget);
        equal(child_gadget.element.getAttribute("data-gadget-scope"),
              "foo");
        equal(child_gadget.element.getAttribute("data-gadget-sandbox"),
              "iframe");
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('provide an iframed gadget as callback parameter', function () {
    // Check that declare gadget returns the gadget
    var parent_gadget = new RenderJSGadget(),
      parsed = URI.parse(window.location.href),
      parent_path = URI.build({protocol: parsed.protocol,
                               hostname: parsed.hostname,
                               port: parsed.port,
                               path: parsed.path}).toString(),
      gadget_path = "./embedded.html",
      absolute_path = parent_path + "embedded.html";

    document.getElementById("qunit-fixture").textContent = "";
    parent_gadget.__sub_gadget_dict = {};
    parent_gadget.__path = parent_path;

    stop();
    parent_gadget.declareGadget(gadget_path, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        equal(new_gadget.__path, absolute_path);
        equal(Object.keys(new_gadget.__acquired_method_dict).length, 1);
        ok(new_gadget instanceof RenderJSIframeGadget);
        equal(
          new_gadget.element.innerHTML,
          '<iframe src="' + absolute_path + '"></iframe>'
        );
        ok(new_gadget.__chan !== undefined);
      })
      .always(function () {
        start();
      });
  });

  test('Initialize sub_gadget_dict private property', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded.html";

    document.getElementById("qunit-fixture").textContent = "";

    gadget.__sub_gadget_dict = {};

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        ok(new_gadget.hasOwnProperty("__sub_gadget_dict"));
        deepEqual(new_gadget.__sub_gadget_dict, {});
      })
      .always(function () {
        start();
      });
  });

  test('checking working iframe gadget', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      acquire_called = false,
      url = "./embedded.html";

    gadget.__aq_parent = function (method_name, argument_list) {
      acquire_called = true;
      equal(this, gadget, "Context should be kept");
      if (method_name === "acquireMethodRequested") {
        equal(method_name, "acquireMethodRequested",
          "Method name should be kept");
        deepEqual(argument_list, ["param1", "param2"],
              "Argument list should be kept"
          );
        return "result correctly fetched from parent";
      }
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    gadget.__sub_gadget_dict = {};

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        return new RSVP.Queue()

          // Method returns an RSVP.Queue
          .push(function () {
            var result = new_gadget.wasReadyCalled();
            ok(
              result instanceof RSVP.Queue,
              "iframe method should return Queue"
            );
          })

          // Check that ready function are called
          .push(function () {
            return new_gadget.wasReadyCalled();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that state is initialized
          .push(function () {
            return new_gadget.wasStateInitialized();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that state handler is initialized
          .push(function () {
            return new_gadget.wasStateHandlerDeclared();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that state change was not triggered
          .push(function () {
            return new_gadget.wasStateChangeHandled();
          })
          .push(function (result) {
            equal(result, false);
          })

          // Check that change state
          .push(function () {
            return new_gadget.triggerStateChange();
          })
          .push(function () {
            return new_gadget.wasStateChangeHandled();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that job was not started
          .push(function () {
            return new_gadget.wasJobStarted();
          })
          .push(function (result) {
            equal(result, false);
          })

          // Check that job can be triggered
          .push(function () {
            return new_gadget.triggerJob();
          })
          .push(function () {
            return new_gadget.wasJobStarted();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that service are started
          .push(function () {
            return new_gadget.wasServiceStarted();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that event are started
          .push(function () {
            return new_gadget.wasEventStarted();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that service error can be reported
          .push(function () {
            return new_gadget.canReportServiceError();
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
          })

          // sub_gadget_dict private property is created
          .push(function () {
            return new_gadget.isSubGadgetDictInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // acquired_method_dict is created on prototype
          .push(function () {
            return new_gadget.isAcquisitionDictInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // service_list is created on prototype
          .push(function () {
            return new_gadget.isServiceListInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // acquire check correctly returns result
          .push(function () {
            return new_gadget.callOKAcquire("param1", "param2");
          })
          .push(function (result) {
            ok(acquire_called);
            equal(result, "result correctly fetched from parent");
          })

          // acquire correctly returns error
          .push(function () {
            return new_gadget.callErrorAcquire(
              "acquireMethodRequestedWithAcquisitionError",
              ["param1", "param2"]
            );
          })
          .push(function (result) {
            ok(false, result);
          })
          .push(undefined, function (error) {
            equal(
              error,
              "AcquisitionError: Can not handle " +
                "acquireMethodRequestedWithAcquisitionError",
              error
            );
          });
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('checking working delayed communication iframe gadget', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      acquire_called = false,
      url = "./embedded.html";

    function readyMessageDelay(e) {
      var now,
        then,
        i = 0;
      if (e.data.indexOf('{"method":"renderJS::__ready"') === 0) {
        now = Date.now();
        then = now + 150;
        while (Date.now() < then) {
          i += 1;
        }
      }
      return i;
    }

    window.addEventListener('message', readyMessageDelay, false);

    gadget.__aq_parent = function (method_name, argument_list) {
      acquire_called = true;
      equal(this, gadget, "Context should be kept");
      if (method_name === "acquireMethodRequested") {
        equal(method_name, "acquireMethodRequested",
          "Method name should be kept");
        deepEqual(argument_list, ["param1", "param2"],
              "Argument list should be kept"
          );
        return "result correctly fetched from parent";
      }
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    gadget.__sub_gadget_dict = {};

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        return new RSVP.Queue()

          // Method returns an RSVP.Queue
          .push(function () {
            var result = new_gadget.wasReadyCalled();
            ok(
              result instanceof RSVP.Queue,
              "iframe method should return Queue"
            );
          })

          // Check that ready function are called
          .push(function () {
            return new_gadget.wasReadyCalled();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that service are started
          .push(function () {
            return new_gadget.wasServiceStarted();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that service error can be reported
          .push(function () {
            return new_gadget.canReportServiceError();
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
          })

          // sub_gadget_dict private property is created
          .push(function () {
            return new_gadget.isSubGadgetDictInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // acquired_method_dict is created on prototype
          .push(function () {
            return new_gadget.isAcquisitionDictInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // service_list is created on prototype
          .push(function () {
            return new_gadget.isServiceListInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // acquire check correctly returns result
          .push(function () {
            return new_gadget.callOKAcquire("param1", "param2");
          })
          .push(function (result) {
            ok(acquire_called);
            equal(result, "result correctly fetched from parent");
          })

          // acquire correctly returns error
          .push(function () {
            return new_gadget.callErrorAcquire(
              "acquireMethodRequestedWithAcquisitionError",
              ["param1", "param2"]
            );
          })
          .push(function (result) {
            ok(false, result);
          })
          .push(undefined, function (error) {
            equal(
              error,
              "AcquisitionError: Can not handle " +
                "acquireMethodRequestedWithAcquisitionError",
              error
            );
          });
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
        window.removeEventListener("message", readyMessageDelay);
      });
  });

  test('checking working heavy iframe gadget', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      acquire_called = false,
      url = "./embedded_heavy.html";

    gadget.__aq_parent = function (method_name, argument_list) {
      acquire_called = true;
      equal(this, gadget, "Context should be kept");
      if (method_name === "acquireMethodRequested") {
        equal(method_name, "acquireMethodRequested",
          "Method name should be kept");
        deepEqual(argument_list, ["param1", "param2"],
              "Argument list should be kept"
          );
        return "result correctly fetched from parent";
      }
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    gadget.__sub_gadget_dict = {};

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        return new RSVP.Queue()

          // Method returns an RSVP.Queue
          .push(function () {
            var result = new_gadget.wasReadyCalled();
            ok(
              result instanceof RSVP.Queue,
              "iframe method should return Queue"
            );
          })

          // Check that ready function are called
          .push(function () {
            return new_gadget.wasReadyCalled();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that service are started
          .push(function () {
            return new_gadget.wasServiceStarted();
          })
          .push(function (result) {
            equal(result, true);
          })

          // Check that service error can be reported
          .push(function () {
            return new_gadget.canReportServiceError();
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
          })

          // sub_gadget_dict private property is created
          .push(function () {
            return new_gadget.isSubGadgetDictInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // acquired_method_dict is created on prototype
          .push(function () {
            return new_gadget.isAcquisitionDictInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // service_list is created on prototype
          .push(function () {
            return new_gadget.isServiceListInitialize();
          })
          .push(function (result) {
            equal(result, true);
          })

          // acquire check correctly returns result
          .push(function () {
            return new_gadget.callOKAcquire("param1", "param2");
          })
          .push(function (result) {
            ok(acquire_called);
            equal(result, "result correctly fetched from parent");
          })

          // acquire correctly returns error
          .push(function () {
            return new_gadget.callErrorAcquire(
              "acquireMethodRequestedWithAcquisitionError",
              ["param1", "param2"]
            );
          })
          .push(function (result) {
            ok(false, result);
          })
          .push(undefined, function (error) {
            equal(
              error,
              "AcquisitionError: Can not handle " +
                "acquireMethodRequestedWithAcquisitionError",
              error
            );
          });
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('checking failing iframe gadget', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded_fail.html";

    stop();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        ok(false);
      })
      .fail(function (error) {
        equal(error, "Error: Manually rejected");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (dataurl)
  /////////////////////////////////////////////////////////////////
  test('dataurl provide an iframed gadget as callback parameter', function () {
    // Check that declare gadget returns the gadget
    var parent_gadget = new RenderJSGadget(),
      parsed = URI.parse(window.location.href),
      parent_path = URI.build({protocol: parsed.protocol,
                               hostname: parsed.hostname,
                               port: parsed.port,
                               path: parsed.path}).toString(),
      // absolute_path = parent_path + "mixed_embedded.html",
      absolute_path = "https://example.org/mixed_embedded.html",
      iframe_html_prefix = '<html><head>',
      iframe_html_suffix = '<script src="' +
        new URL('../node_modules/rsvp/dist/rsvp-2.0.4.js',
                window.location).href +
        '" ' +
        'type="text/javascript"></script>' +
        '<script src="' + new URL('../dist/renderjs-latest.js',
                                  window.location).href + '" ' +
        'type="text/javascript"></script>' +
        '</head><body><p>my mixed foo</p></body></html>',
      iframe_html = iframe_html_prefix + iframe_html_suffix,
      data_url_html = iframe_html_prefix +
        '<base href="' + absolute_path + '">' +
        iframe_html_suffix,
      data_url;

    this.server.respondWith(
      "GET",
      absolute_path,
      [200, {
        "Content-Type": "text/html"
      }, iframe_html]
    );

    document.getElementById("qunit-fixture").textContent = "";
    parent_gadget.__sub_gadget_dict = {};
    parent_gadget.__path = parent_path;

    stop();
    return new RSVP.Queue()
      .then(function () {
        return readBlobAsDataURL(new Blob([data_url_html],
                                 {type: "text/html;charset=UTF-8"}));
      })
      .then(function (result) {
        data_url = result;
        return parent_gadget.declareGadget(absolute_path, {
          sandbox: 'dataurl',
          element: document.getElementById('qunit-fixture')
        });
      })
      .then(function (new_gadget) {
        equal(new_gadget.__path, data_url);
        ok(new_gadget instanceof RenderJSIframeGadget);
        equal(
          new_gadget.element.innerHTML,
          '<iframe src="' + data_url + '"></iframe>'
        );
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getDeclaredGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getDeclaredGadget", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns value from sub_gadget_dict attribute', function () {
    // Check that getDeclaredGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {foo: "bar"};
    stop();
    gadget.getDeclaredGadget("foo")
      .then(function (result) {
        equal(result, "bar");
      })
      .always(function () {
        start();
      });
  });

  test('throw an error if scope is unknown', function () {
    // Check that getDeclaredGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {};
    stop();
    gadget.getDeclaredGadget("foo")
      .then(function () {
        ok(false, "getDeclaredGadget should fail");
      })
      .fail(function (e) {
        ok(e instanceof Error);
        equal(e.message, "Gadget scope 'foo' is not known.");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.dropGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.dropGadget", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns value from sub_gadget_dict attribute', function () {
    // Check that dropGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {foo: "bar"};
    stop();
    gadget.dropGadget("foo")
      .then(function (result) {
        equal(result, undefined);
        equal(JSON.stringify(gadget.__sub_gadget_dict), "{}");
      })
      .always(function () {
        start();
      });
  });

  test('throw an error if scope is unknown', function () {
    // Check that dropGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {};
    stop();
    gadget.dropGadget("foo")
      .then(function () {
        ok(false, "dropGadget should fail");
      })
      .fail(function (e) {
        ok(e instanceof Error);
        equal(e.message, "Gadget scope 'foo' is not known.");
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
    var parsed = URI.parse(window.location.href),
      parent_path = URI.build({protocol: parsed.protocol,
                               hostname: parsed.hostname,
                               port: parsed.port,
                               path: parsed.path}).toString(),
      root_gadget_path_without_hash,
      hash_index;

    window.location.hash = 'testHash';
    hash_index = window.location.href.indexOf('#');
    if (hash_index > 0) {
      root_gadget_path_without_hash =
        window.location.href.substring(0, hash_index);
    } else {
      root_gadget_path_without_hash = window.location.href;
    }

    stop();
    root_gadget_defer.promise
      .then(function (root_gadget_list) {
        var root_gadget = root_gadget_list[0],
          html;
        // Check instance
        equal(root_gadget_list[0], root_gadget_list[1],
              "Context should be the gadget instance");
        equal(root_gadget.__path,
              root_gadget_path_without_hash);
        equal(typeof root_gadget.__acquired_method_dict, 'object');
        equal(root_gadget.__title, document.title);
        deepEqual(root_gadget.__interface_list, []);
        deepEqual(root_gadget.__required_css_list,
          [URI("../node_modules/grunt-contrib-qunit/test/libs/qunit.css")
            .absoluteTo(parent_path).toString()]);
        deepEqual(root_gadget.__required_js_list, [
          URI("../node_modules/rsvp/dist/rsvp-2.0.4.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/grunt-contrib-qunit/test/libs/qunit.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/sinon/pkg/sinon.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/URIjs/src/URI.js")
            .absoluteTo(parent_path).toString(),
          URI("../dist/renderjs-latest.js")
            .absoluteTo(parent_path).toString(),
          URI("renderjs_test.js")
            .absoluteTo(parent_path).toString()
        ]);
        equal(root_gadget.element.outerHTML, document.body.outerHTML);
        // Check klass
        equal(root_gadget.constructor.prototype.__path,
              root_gadget_path_without_hash);
        equal(root_gadget.constructor.prototype.__title, document.title);
        deepEqual(root_gadget.constructor.prototype.__interface_list, []);
        deepEqual(root_gadget.constructor.prototype.__required_css_list,
          [URI("../node_modules/grunt-contrib-qunit/test/libs/qunit.css")
            .absoluteTo(parent_path).toString()]);
        deepEqual(root_gadget.constructor.prototype.__required_js_list, [
          URI("../node_modules/rsvp/dist/rsvp-2.0.4.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/grunt-contrib-qunit/test/libs/qunit.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/sinon/pkg/sinon.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/URIjs/src/URI.js")
            .absoluteTo(parent_path).toString(),
          URI("../dist/renderjs-latest.js")
            .absoluteTo(parent_path).toString(),
          URI("renderjs_test.js")
            .absoluteTo(parent_path).toString()
        ]);
        html = root_gadget.constructor.__template_element.outerHTML;
        ok(/^<div>\s*<h1 id="qunit-header">/.test(html), html);
        ok(root_gadget instanceof RenderJSGadget);
        ok(root_gadget_klass, root_gadget.constructor);
        ok(root_gadget.__aq_parent !== undefined);
        ok(root_gadget.hasOwnProperty("__sub_gadget_dict"));
        deepEqual(root_gadget.__sub_gadget_dict, {});
        deepEqual(root_gadget_klass.__service_list, []);
        deepEqual(root_gadget.__job_list, []);
        return new RSVP.Queue()
          .push(function () {
            return root_gadget.declareGadget("./embedded.html", {
              sandbox: 'iframe',
              element: document.querySelector('#qunit-fixture')
            })
              .fail(function (e) {
                ok(false, e);
              });
          });
      })
      .fail(function (e) {
        ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent fails on the root gadget', function () {
    stop();
    root_gadget_defer.promise
      .then(function (root_gadget_list) {
        return root_gadget_list[0].__aq_parent("foo", "bar");
      })
      .fail(function (error) {
        ok(error instanceof renderJS.AcquisitionError);
        equal(error.message, "No gadget provides foo");
      })
      .always(function () {
        start();
      });
  });

  test('check working of parent gadget in iframe', function () {
    var fixture = document.getElementById("qunit-fixture");
    fixture.innerHTML =
      "<iframe id=renderjsIframe src='./not_declared_gadget.html'></iframe>";
    stop();
    return RSVP.delay(900)
      .then(function () {
        var iframe = document.getElementById('renderjsIframe'),
          acquisition_div = iframe.contentWindow.
            document.querySelector('.acquisitionError'),
          klass_div = iframe.contentWindow.document.querySelector('.klass');
        equal(acquisition_div.innerHTML,
              "AcquisitionError: No gadget provides willFail");
        equal(klass_div.innerHTML,
              "klass = embedded");
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('check page unload', function () {
    var fixture = document.getElementById("qunit-fixture"),
      iframe,
      loop_queue;

    fixture.innerHTML =
      "<iframe id=renderjsIframe src='./unload_gadget.html'></iframe>";
    iframe = document.getElementById('renderjsIframe');
    stop();

    function waitForPageChanged() {
      var iframe_body = iframe.contentWindow.document.body,
        iframe_text;

      if (iframe_body === null) {
        loop_queue
          .push(function () {
            return RSVP.delay();
          })
          .push(function () {
            waitForPageChanged();
          });
        return;
      }
      iframe_text = iframe_body.textContent;
      /*global console*/
      // console.log(iframe_text);
      if (iframe_text.indexOf('Page changed') !== -1) {
        // Final page
        ok(true, iframe_text);
      } else if (iframe_text.indexOf('Next page') === -1) {
        // Not the original text content. Probably the error message.
        ok(false, iframe_text);
      } else {
        loop_queue
          .push(function () {
            return RSVP.delay();
          })
          .push(function () {
            waitForPageChanged();
          });
      }
    }
    return new RSVP.Promise(function (resolve, reject) {
      iframe.addEventListener("load", function (evt) {
        resolve(evt.target.result);
      });
      iframe.addEventListener("error", reject);
    })
      .then(function () {
        iframe.contentWindow.document.querySelector('a').click();

        loop_queue = new RSVP.Queue();
        waitForPageChanged();
        return loop_queue;
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('check page error', function () {
    var fixture = document.getElementById("qunit-fixture"),
      iframe;

    fixture.innerHTML =
      "<iframe id=renderjsIframe src='./error_gadget.html'></iframe>";
    iframe = document.getElementById('renderjsIframe');
    stop();

    return new RSVP.Promise(function (resolve, reject) {
      iframe.addEventListener("load", function (evt) {
        resolve(evt.target.result);
      });
    })
      .then(function () {
        var iframe_body = iframe.contentWindow.document.body,
          iframe_text = iframe_body.textContent;
        ok(iframe_text.indexOf('SyntaxError') !== -1, iframe_text);
        ok(iframe_text.indexOf('getFoo') !== -1, iframe_text);
        ok(iframe_text.indexOf('error_gadget.html') !== -1, iframe_text);
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('check manual bootstrap', function () {
    var fixture = document.getElementById("qunit-fixture"),
      rjsReadyCalled = false,
      iframe;
    fixture.innerHTML = "<iframe id=renderjsIsolatedIframe " +
      "src='./inject_renderjs.html'></iframe>";
    iframe = document.getElementById("renderjsIsolatedIframe");
    stop();

    return new RSVP.Promise(function (resolve, reject) {
      iframe.addEventListener("load", function (e) {
        resolve(e.target.result);
      });
    })
      .then(function () {
        ok(
          !iframe.contentWindow.hasOwnProperty("renderJS"),
          "RJS NOT available before inject"
        );
        return new RSVP.Promise(function (resolve, reject) {
          iframe.contentWindow.test_inject_lib(
            "../node_modules/rsvp/dist/rsvp-2.0.4.js",
            resolve
          );
        });
      })
      .then(function () {
        return new RSVP.Promise(function (resolve, reject) {
          iframe.contentWindow.test_inject_lib(
            "../dist/renderjs-latest.js",
            resolve
          );
        });
      })
      .then(function () {
        ok(
          iframe.contentWindow.hasOwnProperty("renderJS"),
          "RJS available after inject"
        );
      })
      .then(function () {
        // create parentGadget in iframe, then initialize RJS
        var parentDiv = iframe.contentDocument.createElement("div");
        parentDiv.setAttribute(
          "data-gadget-url",
          "./inject_parentgadget.html"
        );
        iframe.contentDocument.body.appendChild(parentDiv);
        return new RSVP.Promise(function (resolve, reject) {
          // listen for an event fired in the ready function of the parent
          // gadget
          parentDiv.addEventListener("rjsready", function (e) {
            rjsReadyCalled = true;
            resolve();
          });
          // if no event is fired within 500ms, just resolve and fail later
          window.setTimeout(function () {
            resolve();
          }, 500);
          iframe.contentWindow.rJS.manualBootstrap();
        });
      })
      .then(function () {
        ok(rjsReadyCalled, "RJS correctly bootstrapped and parent is ready");
      })
      .fail(function (error) {
        ok(false, error);
      })
      .always(function () {
        start();
      });
  });

}(document, renderJS, QUnit, sinon, URI, URL, Event,
  MutationObserver));
