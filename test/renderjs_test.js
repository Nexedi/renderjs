/*
 * Copyright 2012, Nexedi SA
 *
 * This program is free software: you can Use, Study, Modify and Redistribute
 * it under the terms of the GNU General Public License version 3, or (at your
 * option) any later version, as published by the Free Software Foundation.
 *
 * You can also Link and Combine this program with other software covered by
 * the terms of any of the Free Software licenses or any of the Open Source
 * Initiative approved licenses and Convey the resulting work. Corresponding
 * source of such a combination shall include the source code for all other
 * software used.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See COPYING file for full licensing terms.
 * See https://www.nexedi.com/licensing for rationale and options.
 */

/*jslint nomen: true*/
(function (document, renderJS, QUnit, sinon, nise, URI, URL, Event,
           MutationObserver, RSVP) {
  "use strict";
  var test = QUnit.test,
    module = QUnit.module,
    start,
    root_gadget_klass = renderJS(window),
    root_gadget_defer = RSVP.defer(),
    RenderJSGadget = __RenderJSGadget,
    RenderJSEmbeddedGadget = __RenderJSEmbeddedGadget,
    RenderJSIframeGadget = __RenderJSIframeGadget;

  sinon.fakeServer = nise.fakeServer;

  // Keep track of the root gadget
  renderJS(window)
    .ready(function (g) {
      root_gadget_defer.resolve([g, this]);
    })
    .declareMethod('fakeRootMethod1')
    .declareMethod('fakeRootMethod2')
    .declareJob('fakeRootJob1')
    .declareJob('fakeRootJob2')
    .declareAcquiredMethod('fakeRootAcquiredMethod1', 'fakeParentMethod1');

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
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('Not valid HTML string', function (assert) {
    // Check that parseGadgetHTMLDocument returns the default value
    // if the string is not a valid xml
    assert.deepEqual(parseGadgetHTML("", "http://example.org"), {
      path: "http://example.org",
      title: "",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
    });
  });

  test('Not HTML Document', function (assert) {
    // Check that parseGadgetHTMLDocument throws an error if the parameter is
    // not a HTMLDocument
    assert.throws(function () {
      renderJS.parseGadgetHTMLDocument({}, "http://example.org/gadget.html");
    });
  });

  test("Base url not set with absolute url", function (assert) {
    // Check that parseGadgetHTMLDocument throws an error if the base url is
    // not set with absolute url
    assert.throws(function () {
      parseGadgetHTML("");
    });
    assert.throws(function () {
      parseGadgetHTML("", "./path/to/a/gadget");
    });
  });

  test('Default result value', function (assert) {
    // Check default value returned by parseGadgetHTMLDocument
    assert.deepEqual(renderJS.parseGadgetHTMLDocument(
      document.implementation.createHTMLDocument(""),
      "http://example.org"
    ), {
      path: "http://example.org",
      title: "",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
    });
  });

  test('Extract title', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the title
    var settings,
      html = "<html>" +
        "<head>" +
        "<title>Great title</title>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org");
    assert.equal(settings.title, 'Great title', 'Title extracted');
  });

  test('Extract only one title', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the first title
    var settings,
      html = "<html>" +
        "<head>" +
        "<title>Great title</title>" +
        "<title>Great title 2</title>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org");
    assert.equal(settings.title, 'Great title', 'First title extracted');
  });

//   test('Extract title only from head', function (assert) {
//     // Check that parseGadgetHTML only extract title from head
//     var settings,
//       html = "<html>" +
//         "<body>" +
//         "<title>Great title</title>" +
//         "</body></html>";
//
//     settings = parseGadgetHTML(html);
//     assert.equal(settings.title, '', 'Title not found');
//   });

  test('Extract base url', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the title
    var settings,
      html = "<html>" +
        "<head>" +
        "<base href='./bar/bar2/'></base>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org");
    assert.equal(settings.path, 'http://example.org/bar/bar2/',
                 'Base extracted');
  });

  test('Extract only one base url', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the first title
    var settings,
      html = "<html>" +
        "<head>" +
        "<base href='./bar/bar2/'></base>" +
        "<base href='./bar3/bar4/'></base>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org");
    assert.equal(settings.path, 'http://example.org/bar/bar2/',
                 'Base extracted');
  });

  // XXX innerHTML is not extracted anymore
//   test('Extract body', function (assert) {
//     // Check that parseGadgetHTML correctly extract the body
//     var settings,
//       html = "<html>" +
//         "<body>" +
//         "<p>Foo</p>" +
//         "</body></html>";
//
//     settings = renderJS.parseGadgetHTML(html);
//     assert.equal(settings.html, "<p>Foo</p>", "HTML extracted");
//   });
//
//   test('Extract all body', function (assert) {
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
//     assert.equal(settings.html, '<p>Foo</p><p>Bar</p>',
//                  'All bodies extracted');
//   });
//
//   test('Extract body only from html', function (assert) {
//     // Check that parseGadgetHTML also extract body from head
//     var settings,
//       html = "<html>" +
//         "<head><body><p>Bar</p></body></head>" +
//         "</html>";
//
//     settings = renderJS.parseGadgetHTML(html);
//     assert.equal(settings.html, "<p>Bar</p>", "Body not found");
//   });

  test('Extract CSS', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the CSS
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_css_list,
              ['http://example.org/lib/qunit/qunit.css'],
              "CSS extracted");
  });

  test('Extract CSS after base tag', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the CSS
    var settings,
      html = "<html>" +
        "<head>" +
        "<base href='./bar/bar2/'></base>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_css_list,
              ['http://example.org/foo/bar/lib/qunit/qunit.css'],
              "CSS extracted");
  });

  test('Extract CSS before base tag', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the CSS
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "<base href='./bar/bar2/'></base>" +
        "type='text/css'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_css_list,
              ['http://example.org/lib/qunit/qunit.css'],
              "CSS extracted");
  });

  test('Extract CSS order', function (assert) {
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
    assert.deepEqual(settings.required_css_list,
              ['http://example.org/lib/qunit/qunit.css',
               'http://example.org/lib/qunit/qunit2.css'],
              "CSS order kept");
  });

  test('Extract CSS only from head', function (assert) {
    // Check that parseGadgetHTMLDocument only extract css from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</body></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_css_list, [], "CSS not found");
  });

  test('Extract interface', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the interface
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.interface_list,
              ['http://example.org/foo/interface/renderable'],
              "interface extracted");
  });

  test('Extract interface after base tag', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the interface
    var settings,
      html = "<html>" +
        "<head>" +
        "<base href='./bar/bar2/'></base>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.interface_list,
              ['http://example.org/foo/bar/bar2/interface/renderable'],
              "interface extracted");
  });

  test('Extract interface before base tag', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the interface
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "<base href='./bar/bar2/'></base>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.interface_list,
              ['http://example.org/foo/interface/renderable'],
              "interface extracted");
  });

  test('Extract interface order', function (assert) {
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
    assert.deepEqual(settings.interface_list,
              ['http://example.org/foo/interface/renderable',
               'http://example.org/foo/interface/field'],
              "interface order kept");
  });

  test('Extract interface only from head', function (assert) {
    // Check that parseGadgetHTMLDocument only extract interface from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</body></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.interface_list, [], "interface not found");
  });

  test('Extract JS', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the JS
    var settings,
      html = "<html>" +
        "<head>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_js_list,
              ['http://example.org/lib/qunit/qunit.js'],
              "JS extracted");
  });

  test('Extract JS after base tag', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the JS
    var settings,
      html = "<html>" +
        "<head>" +
        "<base href='./bar/bar2/'></base>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_js_list,
              ['http://example.org/foo/bar/lib/qunit/qunit.js'],
              "JS extracted");
  });

  test('Extract JS before base tag', function (assert) {
    // Check that parseGadgetHTMLDocument correctly extract the JS
    var settings,
      html = "<html>" +
        "<head>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "<base href='./bar/bar2/'></base>" +
        "</head></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_js_list,
              ['http://example.org/lib/qunit/qunit.js'],
              "JS extracted");
  });

  test('Extract JS order', function (assert) {
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
    assert.deepEqual(settings.required_js_list,
              ['http://example.org/lib/qunit/qunit.js',
               'http://example.org/lib/qunit/qunit2.js'],
              "JS order kept");
  });

  test('Extract JS only from head', function (assert) {
    // Check that parseGadgetHTMLDocument only extract js from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    settings = parseGadgetHTML(html, "http://example.org/foo/");
    assert.deepEqual(settings.required_js_list, [], "JS not found");
  });

  test('Non valid XML (HTML in fact...)', function (assert) {
    // Check default value returned by parseGadgetHTMLDocument
    assert.deepEqual(parseGadgetHTML('<!doctype html><html><head>' +
      '<title>Test non valid XML</title>' +
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
      '</head><body><p>Non valid XML</p></body></html>',
      'http://example.org/foo/'), {
      path: "http://example.org/foo/",
      title: "Test non valid XML",
      interface_list: [],
      required_css_list: [],
      required_js_list: []
//       html: "<p>Non valid XML</p>",
    });
  });

  test('Extract JS even if type="text/javascript" not set', function (assert) {
    var settings,
      html = "<html><head>" +
        "<script src='../lib/qunit/qunit.js'></script" +
        "</head></html>";
    settings = parseGadgetHTML(html, "http://example.org/foo");
    assert.deepEqual(settings.required_js_list,
              ["http://example.org/lib/qunit/qunit.js"]);
  });

  /////////////////////////////////////////////////////////////////
  //cancel when declare gadget
  /////////////////////////////////////////////////////////////////

  module("cancel when declare gadget", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('cancel gadget initialization', function (assert) {
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

    start = assert.async();
    assert.expect(2);
    gadget.__sub_gadget_dict = {};
    cancel_queue = gadget.declareGadget(url);
    return new RSVP.Queue()
      .push(function () {
        return cancel_queue;
      })
      .push(undefined, function (err) {
        assert.ok(err instanceof RSVP.CancellationError);
        //let cancel_gadget.js load
        return RSVP.delay(100);
      })
      .push(function () {
        return gadget.declareGadget(url);
      })
      .push(function (instance) {
        assert.ok(instance.render !== undefined);
      })
      .always(function () {
        start();
      });
  });




  /////////////////////////////////////////////////////////////////
  // declareGadgetKlass
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareGadgetKlass", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('Ajax error reject the promise', function (assert) {
    // Check that declareGadgetKlass fails if ajax fails
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [404, {
      "Content-Type": "text/html"
    }, "foo"]);

    start = assert.async();
    assert.expect(2);
    renderJS.declareGadgetKlass(url)
      .then(function () {
        assert.ok(false, "404 should fail");
      })
      .fail(function (xhr) {
        assert.equal(xhr.status, 404);
        assert.equal(xhr.url, url);
      })
      .always(function () {
        start();
      });
  });

  test('Non HTML reject the promise', function (assert) {
    // Check that declareGadgetKlass fails if non html is retrieved
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/plain"
    }, "foo"]);

    start = assert.async();
    assert.expect(2);
    renderJS.declareGadgetKlass(url)
      .then(function () {
        assert.ok(false, "text/plain should fail");
      })
      .fail(function (jqXHR) {
        assert.equal(jqXHR.status, 200);
        assert.equal(jqXHR.getResponseHeader("Content-Type"), "text/plain");
      })
      .always(function () {
        start();
      });
  });

  test('HTML parsing failure reject the promise', function (assert) {
    // Check that declareGadgetKlass fails if the html can not be parsed
    var url = 'https://example.org/files/qunittest/test',
      mock;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, ""]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument", function (assert) {
      throw new Error("foo");
    });
    mock.expects("parseGadgetHTMLDocument").once().throws();

    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(url)
      .then(function () {
        assert.ok(false, "Non parsable HTML should fail");
      })
      .fail(function (e) {
        assert.ok(e instanceof Error);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test("should call parseGadgetHTMLDocument with url", function (assert) {
    var url = "http://example.org/foo/gadget", spy;

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "foo"]);

    spy = sinon.spy(renderJS, "parseGadgetHTMLDocument");

    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(url)
      .then(function () {
        assert.equal(spy.args[0][1], url);
      })
      .always(function () {
        spy.restore();
        start();
      });
  });

  test('Klass creation', function (assert) {
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

    start = assert.async();
    assert.expect(8);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        var instance;

        assert.equal(Klass.prototype.__path, url);
        assert.deepEqual(Klass.prototype.__acquired_method_dict, {});
        assert.equal(Klass.prototype.__foo, 'bar');
        assert.equal(Klass.__template_element.nodeType, 9);
        assert.deepEqual(Klass.__ready_list, [],
                         'Ready list is empty by default');

        instance = new Klass();
        assert.ok(instance instanceof RenderJSGadget);
        assert.ok(instance instanceof Klass);
        assert.ok(Klass !== RenderJSGadget);
      })
      .fail(function (e) {
        assert.ok(false, JSON.stringify(e));
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Convert body relative url', function (assert) {
    // Check that declareGadgetKlass converts all relative url
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div href='a' src='b' srcset='c'></div></body></html>"]);

    start = assert.async();
    assert.expect(4);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        var div;
        assert.equal(Klass.__template_element.nodeType, 9);
        div = Klass.__template_element.body.querySelector('div');
        assert.equal(
          div.getAttribute('href'),
          'https://example.org/files/qunittest/a'
        );
        assert.equal(
          div.getAttribute('src'),
          'https://example.org/files/qunittest/b'
        );
        assert.equal(
          div.getAttribute('srcset'),
          'https://example.org/files/qunittest/c'
        );
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Convert body relative url with base', function (assert) {
    // Check that declareGadgetKlass converts all relative url
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html"
    }, "<html><head><base href='../'></base></head>" +
       "<body><div href='a' src='b' srcset='c'></div></body></html>"]);

    start = assert.async();
    assert.expect(4);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        var div;
        assert.equal(Klass.__template_element.nodeType, 9);
        div = Klass.__template_element.body.querySelector('div');
        assert.equal(
          div.getAttribute('href'),
          'https://example.org/files/a'
        );
        assert.equal(
          div.getAttribute('src'),
          'https://example.org/files/b'
        );
        assert.equal(
          div.getAttribute('srcset'),
          'https://example.org/files/c'
        );
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Klass is not reloaded if called twice', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass1) {
        klass1 = Klass1;
        return renderJS.declareGadgetKlass(url);
      })
      .then(function (Klass2) {
        assert.equal(klass1, Klass2);
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR.status);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Content type parameter are supported', function (assert) {
    // Check that declareGadgetKlass does not fail if the page content type
    // contains a parameter
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html; charset=utf-8"
    }, "<html></html>"]);

    start = assert.async();
    assert.expect(5);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        var instance;

        assert.equal(Klass.prototype.__path, url);
        assert.deepEqual(Klass.prototype.__acquired_method_dict, {});

        instance = new Klass();
        assert.ok(instance instanceof RenderJSGadget);
        assert.ok(instance instanceof Klass);
        assert.ok(Klass !== RenderJSGadget);
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('Ready list length is one if HTML sub gadget', function (assert) {
    var url = 'https://example.org/files/qunittest/test';

    this.server.respondWith("GET", url, [200, {
      "Content-Type": "text/html; charset=utf-8"
    }, "<html><body><div data-gadget-url='foo'></div></body></html>"]);

    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass) {
        assert.equal(Klass.__ready_list.length, 1);
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // declareJS
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareJS", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('Download error reject the promise', function (assert) {
    // Check that declareJS fails if ajax fails
    var url = 'http://0.0.0.0/bar';

    start = assert.async();
    assert.expect(2);
    renderJS.declareJS(url, document.head)
      .then(function () {
        assert.ok(false, "404 should fail");
      })
      .fail(function (e) {
        assert.equal(e.type, "error");
        assert.equal(e.target.getAttribute("src"), url);
      })
      .always(function () {
        start();
      });
  });

  test('Ajax error reject the promise twice', function (assert) {
    // Check that failed declareJS is not cached
    var url = 'http://0.0.0.0/bar2';

    start = assert.async();
    assert.expect(2);
    renderJS.declareJS(url, document.head)
      .then(function () {
        return renderJS.declareJS(url);
      })
      .then(function () {
        assert.ok(false, "404 should fail");
      })
      .fail(function (e) {
        assert.equal(e.type, "error");
        assert.equal(e.target.getAttribute("src"), url);
      })
      .always(function () {
        start();
      });
  });

  test('Non JS reject the promise', function (assert) {
    // Check that declareJS fails if mime type is wrong
    var url = "data:image/png;base64," +
         window.btoa("= = ="),
      previousonerror = window.onerror;

    start = assert.async();
    assert.expect(1);
    window.onerror = undefined;
    renderJS.declareJS(url, document.head)
      .then(function (value, textStatus, jqXHR) {
        assert.ok(true, "Non JS mime type should load");
      })
      .fail(function (jqXHR) {
        // Chrome does not consider this as error
        assert.ok(true, jqXHR);
      })
      .always(function () {
        window.onerror = previousonerror;
        start();
      });
  });

  test('JS cleanly loaded', function (assert) {
    // Check that declareJS is fetched and loaded
    var url = "data:application/javascript;base64," +
         window.btoa("document.getElementById('qunit-fixture').textContent " +
                     "= 'JS fetched and loaded';");

    start = assert.async();
    assert.expect(1);
    renderJS.declareJS(url, document.head)
      .then(function () {
        assert.equal(
          document.getElementById("qunit-fixture").textContent,
          "JS fetched and loaded"
        );
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  test('JS with errors cleanly loaded', function (assert) {
    // Check that declareJS is fetched and loaded even if JS contains an error
    var url = "data:application/javascript;base64," +
         window.btoa("= var var var a a a"),
      previousonerror = window.onerror;

    start = assert.async();
    assert.expect(1);
    window.onerror = undefined;
    renderJS.declareJS(url, document.head)
      .then(function (aaa) {
        assert.ok(true, "JS with error cleanly loaded");
      })
      .fail(function (jqXHR) {
        assert.ok(false, jqXHR);
      })
      .always(function () {
        window.onerror = previousonerror;
        start();
      });
  });

  test('JS is not fetched twice', function (assert) {
    // Check that declareJS does not load the JS twice
    var url = "data:application/javascript;base64," +
         window.btoa("document.getElementById('qunit-fixture').textContent " +
                     "= 'JS not fetched twice';");

    start = assert.async();
    assert.expect(2);
    renderJS.declareJS(url, document.head)
      .then(function () {
        assert.equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
        document.getElementById("qunit-fixture").textContent = "";
        return renderJS.declareJS(url, document.head);
      })
      .then(function () {
        assert.equal(document.getElementById("qunit-fixture").textContent, "");
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // declareCSS
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareCSS", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('Ajax error resolve the promise', function (assert) {
    // Check that declareCSS is resolved if ajax fails
    var url = 'foo//://bar';

    start = assert.async();
    assert.expect(2);
    renderJS.declareCSS(url, document.head)
      .then(function () {
        // IE accept the css
        assert.ok(true, "404 should fail");
      })
      .fail(function (e) {
        assert.equal(e.type, "error");
        assert.equal(e.target.getAttribute("href"), url);
      })
      .always(function () {
        start();
      });
  });

  test('Non CSS reject the promise', function (assert) {
    // Check that declareCSS is resolved if mime type is wrong
    var url = "data:image/png;base64," +
         window.btoa("= = =");

    start = assert.async();
    assert.expect(1);
    renderJS.declareCSS(url, document.head)
      .then(function (value, textStatus, jqXHR) {
        // Chrome accept the css
        assert.ok(true, "Non CSS mime type should load");
      })
      .fail(function (e) {
        assert.equal(e.target.getAttribute("href"), url);
      })
      .always(function () {
        start();
      });
  });

  test('CSS cleanly loaded', function (assert) {
    // Check that declareCSS is fetched and loaded
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: red;}");

    start = assert.async();
    assert.expect(2);
    renderJS.declareCSS(url, document.head)
      .then(function () {
        var result = document.querySelectorAll("link[href='" + url + "']");
        assert.ok(result.length > 0, "CSS in the head");
        assert.equal(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor,
          "rgb(255, 0, 0)"
        );
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('CSS with errors cleanly loaded', function (assert) {
    // Check that declareCSS is fetched and
    // loaded even if CSS contains an error
    var url = "data:application/javascript;base64," +
         window.btoa("throw new Error('foo');");

    start = assert.async();
    assert.expect(1);
    renderJS.declareCSS(url, document.head)
      .then(function () {
        // Chrome does not consider this as error
        assert.ok(true, "CSS with error cleanly loaded");
      })
      .fail(function (jqXHR) {
        assert.ok(true, jqXHR);
      })
      .always(function () {
        start();
      });
  });

  test('CSS is not fetched twice', function (assert) {
    // Check that declareCSS does not load the CSS twice
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: blue;}");

    start = assert.async();
    assert.expect(4);
    renderJS.declareCSS(url, document.head)
      .then(function () {
        assert.equal(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor,
          "rgb(0, 0, 255)"
        );
        var element = document.querySelectorAll("link[href='" + url + "']")[0];
        element.parentNode.removeChild(element);
        assert.ok(
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
        assert.equal(element_list.length, 0);
        assert.ok(
          window.getComputedStyle(
            document.getElementById("qunit-fixture"),
            null
          ).backgroundColor !== "rgb(0, 0, 255)"
        );
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // clearGadgetKlassList
  /////////////////////////////////////////////////////////////////
  module("renderJS.clearGadgetKlassList", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });

  test('clearGadgetKlassList leads to gadget reload', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(url)
      .then(function (Klass1) {
        klass1 = Klass1;

        renderJS.clearGadgetKlassList();

        return renderJS.declareGadgetKlass(url);
      })
      .then(function (Klass2) {
        assert.ok(klass1 !== Klass2);
      })
      .fail(function (jqXHR) {
        assert.ok(false, jqXHR);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('clearGadgetKlassList leads to JS reload', function (assert) {
    // Check that declareJS reload the JS
    // after clearGadgetKlassList is called
    var url = "data:application/javascript;base64," +
         window.btoa("document.getElementById('qunit-fixture').textContent " +
                     "= 'JS not fetched twice';");

    start = assert.async();
    assert.expect(2);
    renderJS.declareJS(url, document.head)
      .then(function () {
        renderJS.clearGadgetKlassList();
        assert.equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
        document.getElementById("qunit-fixture").textContent = "";
        return renderJS.declareJS(url, document.head);
      })
      .then(function () {
        assert.equal(
          document.getElementById("qunit-fixture").textContent,
          "JS not fetched twice"
        );
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  test('clearGadgetKlassList leads to CSS reload', function (assert) {
    // Check that declareCSS reload the CSS
    // after clearGadgetKlassList is called
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: blue;}"),
      count = document.querySelectorAll("link[rel=stylesheet]").length;

    start = assert.async();
    assert.expect(2);
    renderJS.declareCSS(url, document.head)
      .then(function () {
        renderJS.clearGadgetKlassList();
        assert.equal(
          document.querySelectorAll("link[rel=stylesheet]").length,
          count + 1
        );
        return renderJS.declareCSS(url, document.head);
      })
      .then(function () {
        assert.equal(
          document.querySelectorAll("link[rel=stylesheet]").length,
          count + 2
        );
      })
      .fail(function (jqXHR) {
        assert.ok(false, "Failed to load " + jqXHR);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget");

  test('should be a constructor', function (assert) {
    var gadget = new RenderJSGadget();
    assert.equal(
      Object.getPrototypeOf(gadget),
      RenderJSGadget.prototype,
      '[[Prototype]] equals RenderJSGadget.prototype'
    );
    assert.equal(
      gadget.constructor,
      RenderJSGadget,
      'constructor property of instances is set correctly'
    );
    assert.equal(
      RenderJSGadget.prototype.constructor,
      RenderJSGadget,
      'constructor property of prototype is set correctly'
    );
  });

  test('should not accept parameter', function (assert) {
    assert.equal(RenderJSGadget.length, 0);
  });

  test('should work without new', function (assert) {
    var gadgetKlass = RenderJSGadget,
      gadget = gadgetKlass();
    assert.equal(
      gadget.constructor,
      RenderJSGadget,
      'constructor property of instances is set correctly'
    );
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getInterfaceList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getInterfaceList", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns interface_list', function (assert) {
    // Check that getInterfaceList return a Promise
    var gadget = new RenderJSGadget();
    gadget.__interface_list = "foo";
    start = assert.async();
    assert.expect(1);
    gadget.getInterfaceList()
      .then(function (result) {
        assert.equal(result, "foo");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('default value', function (assert) {
    // Check that getInterfaceList return a Promise
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(1);
    gadget.getInterfaceList()
      .then(function (result) {
        assert.deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getMethodList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getMethodList", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns method', function (assert) {
    // Check that getMethodList return a Promise
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;

    gadget = new Klass();
    Klass.__method_type_dict = {
      getFoo: 'type_foo',
      getBar: 'type_bar',
      getBar2: 'type_bar'
    };
    start = assert.async();
    assert.expect(4);
    gadget.getMethodList()
      .then(function (method_list) {
        assert.deepEqual(method_list, ['getFoo', 'getBar', 'getBar2']);
      })

      .then(function (method_list) {
        return gadget.getMethodList('type_bar');
      })
      .then(function (method_list) {
        assert.deepEqual(method_list, ['getBar', 'getBar2']);
      })

      .then(function (method_list) {
        return gadget.getMethodList('type_foo');
      })
      .then(function (method_list) {
        assert.deepEqual(method_list, ['getFoo']);
      })

      .then(function (method_list) {
        return gadget.getMethodList('type_foobar');
      })
      .then(function (method_list) {
        assert.deepEqual(method_list, []);
      })

      .always(function () {
        start();
      });
  });

  test('default value', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;

    gadget = new Klass();

    start = assert.async();
    assert.expect(1);
    gadget.getMethodList()
      .then(function (result) {
        assert.deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getRequiredCSSList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getRequiredCSSList", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns interface_list', function (assert) {
    // Check that getRequiredCSSList return a Promise
    var gadget = new RenderJSGadget();
    gadget.__required_css_list = "foo";
    start = assert.async();
    assert.expect(1);
    gadget.getRequiredCSSList()
      .then(function (result) {
        assert.equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function (assert) {
    // Check that getRequiredCSSList return a Promise
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(1);
    gadget.getRequiredCSSList()
      .then(function (result) {
        assert.deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getRequiredJSList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getRequiredJSList", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns interface_list', function (assert) {
    // Check that getRequiredJSList return a Promise
    var gadget = new RenderJSGadget();
    gadget.__required_js_list = "foo";
    start = assert.async();
    assert.expect(1);
    gadget.getRequiredJSList()
      .then(function (result) {
        assert.equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function (assert) {
    // Check that getRequiredJSList return a Promise
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(1);
    gadget.getRequiredJSList()
      .then(function (result) {
        assert.deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getPath
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getPath", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns path', function (assert) {
    // Check that getPath return a Promise
    var gadget = new RenderJSGadget();
    gadget.__path = "foo";
    start = assert.async();
    assert.expect(1);
    gadget.getPath()
      .then(function (result) {
        assert.equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function (assert) {
    // Check that getPath return a Promise
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(1);
    gadget.getPath()
      .then(function (result) {
        assert.equal(result, "");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getTitle
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getTitle", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns title', function (assert) {
    // Check that getTitle return a Promise
    var gadget = new RenderJSGadget();
    gadget.__title = "foo";
    start = assert.async();
    assert.expect(1);
    gadget.getTitle()
      .then(function (result) {
        assert.equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function (assert) {
    // Check that getTitle return a Promise
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(1);
    gadget.getTitle()
      .then(function (result) {
        assert.equal(result, "");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getElement
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getElement", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns element property', function (assert) {
    // Check that getElement return a Promise
    var gadget = new RenderJSGadget();
    gadget.element = "foo";
    start = assert.async();
    assert.expect(1);
    gadget.getElement()
      .then(function (result) {
        assert.equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('throw an error if no element is defined', function (assert) {
    // Check that getElement return a Promise
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(2);
    gadget.getElement()
      .then(function () {
        assert.ok(false, "getElement should fail");
      })
      .fail(function (e) {
        assert.ok(e instanceof Error, e);
        assert.equal(e.message, "No element defined");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.changeState
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.changeState", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('update state with changed keys', function (assert) {
    var gadget = new RenderJSGadget();
    gadget.state = {foo: 'bar', bar: 'foo'};
    start = assert.async();
    assert.expect(1);
    gadget.changeState({bar: 'barbar'})
      .then(function () {
        assert.deepEqual(gadget.state, {foo: 'bar', bar: 'barbar'});
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('trigger onStateChange if changed keys', function (assert) {
    var gadget = new RenderJSGadget(),
      callback_called = false;
    gadget.state = {foo: 'bar', bar: 'foo'};
    gadget.__state_change_callback = function (modification_dict) {
      assert.deepEqual(gadget.state, {foo: 'bar', bar: 'barbar'});
      assert.deepEqual(modification_dict, {bar: 'barbar'});
      assert.equal(this, gadget);
      return RSVP.Queue()
        .push(function () {
          callback_called = true;
        });
    };
    start = assert.async();
    assert.expect(4);
    gadget.changeState({bar: 'barbar'})
      .then(function () {
        assert.ok(callback_called);
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('do not trigger onStateChange if no changed keys', function (assert) {
    var gadget = new RenderJSGadget(),
      callback_called = false;
    gadget.state = {foo: 'bar', bar: 'foo'};
    gadget.__state_change_callback = function () {
      callback_called = true;
    };
    start = assert.async();
    assert.expect(1);
    gadget.changeState({bar: 'foo'})
      .then(function () {
        assert.ok(!callback_called);
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('do not trigger onStateChange if no changed keys twice',
       function (assert) {
      var gadget = new RenderJSGadget(),
        callback_called = false;
      gadget.state = {};
      gadget.__state_change_callback = function () {
        callback_called = true;
      };
      start = assert.async();
      assert.expect(2);
      gadget.changeState({})
        .then(function () {
          assert.ok(!callback_called);
          return gadget.changeState({});
        })
        .then(function () {
          assert.ok(!callback_called);
        })
        .fail(function (error) {
          assert.ok(false, error);
        })
        .always(function () {
          start();
        });
    });

  test('trigger onStateChange when previous is resolved', function (assert) {
    var gadget = new RenderJSGadget(),
      callback_count = 0;
    gadget.state = {};
    gadget.__state_change_callback = function (modification_dict) {
      if (callback_count === 0) {
        callback_count += 1;
        assert.deepEqual(modification_dict, {first: true});
        return new RSVP.Queue()
          .push(function () {
            return RSVP.delay();
          })
          .push(function () {
            assert.deepEqual(gadget.state, {first: true});
            callback_count += 1;
          });
      }
      if (callback_count === 2) {
        assert.deepEqual(modification_dict, {second: true});
        assert.deepEqual(gadget.state, {first: true, second: true});
        callback_count += 1;
      } else {
        throw new Error('Unexpected callback_count ' + callback_count);
      }
    };
    start = assert.async();
    assert.expect(6);
    return new RSVP.all([
      gadget.changeState({first: true}),
      gadget.changeState({second: true})
    ])
      .then(function () {
        assert.equal(callback_count, 3);
        assert.deepEqual(gadget.state, {first: true, second: true});
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('trigger onStateChange when previous is rejected', function (assert) {
    var gadget = new RenderJSGadget(),
      callback_count = 0;
    gadget.state = {};
    gadget.__state_change_callback = function (modification_dict) {
      if (callback_count === 0) {
        callback_count += 1;
        assert.deepEqual(modification_dict, {first: true});
        return new RSVP.Queue()
          .push(function () {
            return RSVP.delay();
          })
          .push(function () {
            assert.deepEqual(gadget.state, {first: true});
            callback_count += 1;
            throw new Error('manually reject first callback');
          });
      }
      if (callback_count === 2) {
        assert.deepEqual(modification_dict, {first: true, second: true});
        assert.deepEqual(gadget.state, {first: true, second: true});
        callback_count += 1;
      } else {
        throw new Error('Unexpected callback_count ' + callback_count);
      }
    };
    start = assert.async();
    assert.expect(7);
    return new RSVP.all([
      gadget.changeState({first: true})
        .fail(function (error) {
          assert.equal(error.message, 'manually reject first callback');
        }),
      gadget.changeState({second: true})
    ])
      .then(function () {
        assert.equal(callback_count, 3);
        assert.deepEqual(gadget.state, {first: true, second: true});
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('accumulate modification_dict on onStateChange error',
       function (assert) {
      var gadget = new RenderJSGadget();
      gadget.state = {a: 'b', foo: 'bar', bar: 'foo'};
      gadget.__state_change_callback = function (modification_dict) {
        assert.deepEqual(modification_dict, {bar: 'barbar'});
        throw new Error('failure in onStateChange');
      };
      start = assert.async();
      assert.expect(13);
      gadget.changeState({bar: 'barbar'})
        .then(function () {
          assert.ok(false, 'Expecting an error');
        })
        .fail(function (error) {
          assert.equal(error.message, 'failure in onStateChange');
          assert.deepEqual(gadget.state, {a: 'b', foo: 'bar', bar: 'barbar'});

          gadget.__state_change_callback = function (modification_dict) {
            assert.deepEqual(modification_dict,
                             {bar: 'barbar', foo: 'foofoo'});
            throw new Error('failure2 in onStateChange');
          };
          return gadget.changeState({foo: 'foofoo'});
        })
        .fail(function (error) {
          assert.equal(error.message, 'failure2 in onStateChange');
          assert.deepEqual(gadget.state, {a: 'b', foo: 'foofoo',
                                          bar: 'barbar'});

          gadget.__state_change_callback = function (modification_dict) {
            assert.deepEqual(modification_dict, {bar: 'barbar', foo: 'f'});
            throw new Error('failure3 in onStateChange');
          };
          return gadget.changeState({foo: 'f'});
        })
        .fail(function (error) {
          assert.equal(error.message, 'failure3 in onStateChange');
          assert.deepEqual(gadget.state, {a: 'b', foo: 'f', bar: 'barbar'});

          gadget.__state_change_callback = function (modification_dict) {
            assert.deepEqual(modification_dict,
                            {a: 'c', bar: 'barbar', foo: 'f'});
          };
          return gadget.changeState({a: 'c'});
        })
        .then(function () {
          assert.deepEqual(gadget.state, {a: 'c', foo: 'f', bar: 'barbar'});


          gadget.__state_change_callback = function (modification_dict) {
            assert.deepEqual(modification_dict, {a: 'd'});
          };
          return gadget.changeState({a: 'd'});
        })
        .then(function () {
          assert.deepEqual(gadget.state, {a: 'd', foo: 'f', bar: 'barbar'});
        })
        .always(function () {
          start();
        });
    });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareAcquiredMethod
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareAcquiredMethod", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('is chainable', function (assert) {
    // Check that declareAcquiredMethod is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

    gadget = new Klass();
    assert.equal(gadget.testFoo, undefined);
    result = Klass.declareAcquiredMethod('testFoo', 'testBar');
    // declareAcquiredMethod is chainable
    assert.equal(result, Klass);
  });

  test('creates methods on the prototype', function (assert) {
    // Check that declareAcquiredMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareAcquiredMethod = RenderJSGadget.declareAcquiredMethod;

    gadget = new Klass();
    assert.equal(gadget.testFoo, undefined);
    Klass.declareAcquiredMethod('testFoo', 'testBar');
    // Method is added on the instance class prototype
    assert.equal(RenderJSGadget.prototype.testFoo, undefined);
    assert.ok(gadget.testFoo !== undefined);
    assert.ok(Klass.prototype.testFoo !== undefined);
    assert.equal(Klass.prototype.testFoo, gadget.testFoo);

  });

  test('returns __aq_parent result if acquired_method does not exists',
    function (assert) {
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
        assert.equal(this, gadget, "Context should be kept");
        assert.equal(method_name, original_method_name,
                     "Method name should be kept");
        assert.deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        return "FOO";
      };

      start = assert.async();
      assert.expect(5);
      gadget.checkIfAqDynamicIsUndefined("foobar", "barfoo")
        .then(function (result) {
          assert.equal(result, "FOO");
          assert.equal(__aq_parent_called, true);
        })
        .always(function () {
          start();
        });
    });

  test('fails if __aq_parent throws an error', function (assert) {
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

    start = assert.async();
    assert.expect(2);
    gadget.checkIfAqParentThrowsError()
      .fail(function (error) {
        assert.equal(error, original_error);
        assert.equal(error.message, "Custom error for the test");
      })
      .always(function () {
        start();
      });
  });

  test('fails if __aq_parent is not defined', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    gadget.checkIfAqParentIsUndefined()
      .fail(function (error) {
        assert.ok(error instanceof TypeError);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.allowPublicAcquisition
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.allowPublicAcquiredMethod", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('is chainable', function (assert) {
    // Check that allowPublicAcquisition is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.prototype.__acquired_method_dict = {};
    Klass.allowPublicAcquisition = RenderJSGadget.allowPublicAcquisition;

    result = Klass.allowPublicAcquisition('testFoo', function (assert) {
      return;
    });
    // allowPublicAcquisition is chainable
    assert.equal(result, Klass);
  });

  test('creates methods on the prototype', function (assert) {
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
    assert.deepEqual(
      Klass.prototype.__acquired_method_dict,
      {'testFoo': testFoo}
    );
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.__aq_parent
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.__aq_parent", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('__aq_parent does not exist by default', function (assert) {
    var gadget = new RenderJSGadget();
    assert.equal(gadget.__aq_parent, undefined);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJS.getAbsoluteURL
  /////////////////////////////////////////////////////////////////

  module("RenderJS.getAbsoluteURL");

  test('make a relative url absolute with an absolute base url',
       function (assert) {
      var url = "../foo/bar",
        base_url = "http://example.org/some/path/";

      assert.equal(renderJS.getAbsoluteURL(url, base_url),
            "http://example.org/some/foo/bar");
    });

  test('do not translate absolute url', function (assert) {
    var url = "http://example.net/foo/bar",
      base_url = "http://example.org/some/path/";

    assert.equal(renderJS.getAbsoluteURL(url, base_url), url);
  });

  test('do not translate data url', function (assert) {
    var first_url = "data:application/javascript;base64,something()",
      second_url = "http://example.org/some/path/";

    assert.equal(renderJS.getAbsoluteURL(first_url, second_url), first_url);
  });

  test('return undefined if relative url not passed', function (assert) {
    assert.equal(renderJS.getAbsoluteURL(), undefined);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareMethod
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareMethod", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('is chainable', function (assert) {
    // Check that declareMethod is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();
    assert.equal(gadget.testFoo, undefined);
    result = Klass.declareMethod('testFoo', function (assert) {
      return;
    });
    // declareMethod is chainable
    assert.equal(result, Klass);
  });

  test('creates methods on the prototype', function (assert) {
    // Check that declareMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, called;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();
    assert.equal(gadget.testFoo, undefined);
    Klass.declareMethod('testFoo', function (value) {
      called = value;
    });
    // Method is added on the instance class prototype
    assert.equal(RenderJSGadget.prototype.testFoo, undefined);
    assert.ok(gadget.testFoo !== undefined);
    assert.ok(Klass.prototype.testFoo !== undefined);
    assert.equal(Klass.prototype.testFoo, gadget.testFoo);

    start = assert.async();
    assert.expect(6);
    // method can be called
    gadget.testFoo("Bar")
      .then(function (param) {
        assert.equal(called, "Bar");
      })
      .fail(function () {
        assert.ok(false, "Should propagate the parameters");
      })
      .always(function () {
        start();
      });
  });

  test('returns a promise when synchronous function', function (assert) {
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
    start = assert.async();
    assert.expect(1);
    gadget.testFoo("Bar")
      .then(function (param) {
        assert.equal(param, "Bar");
      })
      .fail(function () {
        assert.ok(false, "Should not fail when synchronous");
      })
      .always(function () {
        start();
      });
  });

  test('returns the callback promise if it exists', function (assert) {
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
    start = assert.async();
    assert.expect(1);
    gadget.testFoo("Bar")
      .then(function () {
        assert.ok(false, "Callback promise is rejected");
      })
      .fail(function (param) {
        assert.equal(param, "Bar");
      })
      .always(function () {
        start();
      });
  });

  test('mutex prevent concurrent execution', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget,
      counter = 0;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();

    function assertCounter(value) {
      assert.equal(counter, value);
      counter += 1;
    }

    Klass.declareMethod('testFoo', function (expected_counter) {
      assertCounter(expected_counter);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(expected_counter + 1);
          return counter;
        });
    }, {mutex: 'foo'});

    // method can be called
    start = assert.async();
    assert.expect(10);
    return new RSVP.Queue()
      .push(function () {
        return RSVP.all([
          gadget.testFoo(0),
          gadget.testFoo(2),
          gadget.testFoo(4)
        ]);
      })
      .push(function (result_list) {
        assert.equal(result_list[0], 2);
        assert.equal(result_list[1], 4);
        assert.equal(result_list[2], 6);
        assertCounter(6);
      })
      .always(function () {
        start();
      });
  });

  test('mutex first cancellation stop execution', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget,
      counter = 0;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();

    function assertCounter(value) {
      assert.equal(counter, value);
      counter += 1;
    }

    Klass.declareMethod('testFoo', function (expected_counter) {
      assertCounter(expected_counter);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(expected_counter + 1);
          assert.ok(false, 'Should not reach that code');
        });
    }, {mutex: 'foo'});

    // method can be called
    start = assert.async();
    assert.expect(2);

    return new RSVP.Queue()
      .push(function () {
        // Immediately cancel the first call
        gadget.testFoo(0).cancel();
        return RSVP.delay(200);
      })
      .push(function () {
        assertCounter(1);
      })
      .always(function () {
        start();
      });
  });

  test('not mutex first cancellation stop execution', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget,
      counter = 0;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareMethod = RenderJSGadget.declareMethod;

    gadget = new Klass();

    function assertCounter(value) {
      assert.equal(counter, value);
      counter += 1;
    }

    Klass.declareMethod('testFoo', function (expected_counter) {
      assertCounter(expected_counter);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(expected_counter + 1);
          assert.ok(false, 'Should not reach that code');
        });
    });

    // method can be called
    start = assert.async();
    assert.expect(2);

    return new RSVP.Queue()
      .push(function () {
        // Immediately cancel the first call
        gadget.testFoo(0).cancel();
        return RSVP.delay(200);
      })
      .push(function () {
        assertCounter(1);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.ready
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.ready", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('is chainable', function (assert) {
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
    assert.equal(result, Klass);
  });

  test('store callback in the ready_list property', function (assert) {
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
    assert.deepEqual(Klass.__ready_list, [callback]);
  });


  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.setState
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.setState", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('is chainable', function (assert) {
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
    assert.equal(result, Klass);
  });

  test('create __json_state property on prototype', function (assert) {
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
    assert.equal(Klass.prototype.__json_state, JSON.stringify({foo: 'bar'}));
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.onStateChange
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.onStateChange", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('is chainable', function (assert) {
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
    assert.equal(result, Klass);
  });

  test('create callback in the __state_change_callback property',
       function (assert) {
      // Subclass RenderJSGadget to not pollute its namespace
      var Klass = function () {
        RenderJSGadget.call(this);
      },
        callback = {};
      Klass.prototype = new RenderJSGadget();
      Klass.prototype.constructor = Klass;
      Klass.onStateChange = RenderJSGadget.onStateChange;

      Klass.onStateChange(callback);
      assert.equal(Klass.prototype.__state_change_callback, callback);
    });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareService
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareService", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('is chainable', function (assert) {
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
    assert.equal(result, Klass);
  });

  test('store callback in the service_list property', function (assert) {
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
    assert.deepEqual(Klass.__service_list, [callback]);
  });

  /////////////////////////////////////////////////////////////////
  // Service status
  /////////////////////////////////////////////////////////////////
  function declareServiceToCheck(klass, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.declareService(function () {
      return RSVP.Promise(function () {
        service_status.start_count += 1;
        service_status.status = "started";
      }, function (assert) {
        service_status.stop_count += 1;
        service_status.status = "stopped";
      });
    });
  }

  test('service untouched when gadget never in DOM', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var service1 = {},
      service2 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test500.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    start = assert.async();
    assert.expect(6);
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
        assert.equal(service1.start_count, 0);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, undefined);
        assert.equal(service2.start_count, 0);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, undefined);
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started when gadget created in DOM', function (assert) {
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
    start = assert.async();
    assert.expect(6);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, "started");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started after ready is finished', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test5011.html',
      defer = RSVP.defer();
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        Klass.declareService(function () {
          defer.reject('Triggered before ready');
        });
        Klass.ready(function () {
          return RSVP.delay(500)
            .then(function () {
              defer.resolve('Triggered before service');
            });
        });
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function () {
        return defer.promise;
      })
      .then(function (result) {
        assert.equal(result, 'Triggered before service');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started when gadget element added in DOM', function (assert) {
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
    start = assert.async();
    assert.expect(6);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, "started");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('service started when gadget parent element added in DOM',
       function (assert) {
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
      start = assert.async();
      assert.expect(6);
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
          assert.equal(service1.start_count, 1);
          assert.equal(service1.stop_count, 0);
          assert.equal(service1.status, "started");
          assert.equal(service2.start_count, 1);
          assert.equal(service2.stop_count, 0);
          assert.equal(service2.status, "started");
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('service stopped when gadget element removed from DOM',
       function (assert) {
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
      start = assert.async();
      assert.expect(6);
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
          assert.equal(service1.start_count, 1);
          assert.equal(service1.stop_count, 1);
          assert.equal(service1.status, "stopped");
          assert.equal(service2.start_count, 1);
          assert.equal(service2.stop_count, 1);
          assert.equal(service2.status, "stopped");
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('service stopped when gadget parent element removed from DOM',
      function (assert) {
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
      start = assert.async();
      assert.expect(6);
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
          assert.equal(service1.start_count, 1);
          assert.equal(service1.stop_count, 1);
          assert.equal(service1.status, "stopped");
          assert.equal(service2.start_count, 1);
          assert.equal(service2.stop_count, 1);
          assert.equal(service2.status, "stopped");
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('service can be restarted', function (assert) {
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
    start = assert.async();
    assert.expect(6);
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
        assert.equal(service1.start_count, 2);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "started");
        assert.equal(service2.start_count, 2);
        assert.equal(service2.stop_count, 1);
        assert.equal(service2.status, "started");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // Service error handling
  /////////////////////////////////////////////////////////////////
  test('Service error are reported to parent gadget',
       function (assert) {
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
      ParentKlass.allowPublicAcquisition =
        RenderJSGadget.allowPublicAcquisition;

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
      start = assert.async();
      assert.expect(2);
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
          assert.ok(catched_error instanceof Error);
          assert.equal(
            catched_error.message,
            "My service crashed!"
          );
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('Service error from iframe are reported to parent gadget',
       function (assert) {
      // Subclass RenderJSGadget to not pollute its namespace
      var ParentKlass = function () {
        RenderJSGadget.call(this);
      },
        gadget,
        defer = RSVP.defer();
      ParentKlass.prototype = new RenderJSGadget();
      ParentKlass.prototype.constructor = ParentKlass;
      ParentKlass.prototype.__acquired_method_dict = {};
      ParentKlass.allowPublicAcquisition =
        RenderJSGadget.allowPublicAcquisition;

      ParentKlass.allowPublicAcquisition('reportServiceError',
                                        function (argument_list) {
          defer.resolve(argument_list[0]);
        });

      gadget = new ParentKlass();
      gadget.__sub_gadget_dict = {};

      document.getElementById('qunit-fixture').innerHTML = "<div></div>";
      start = assert.async();
      assert.expect(3);

      return gadget.declareGadget(
        'embedded_crashing_service.html',
        {element: document.getElementById('qunit-fixture')
                          .querySelector("div"),
          sandbox: 'iframe'}
      )
        .then(function () {
          return defer.promise;
        })
        .then(function (catched_error) {
          assert.ok(catched_error instanceof Object);
          assert.ok(!(catched_error instanceof Error));
          assert.equal(
            catched_error.message,
            "Cannot read property 'bar' of undefined"
          );
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('Service error stops the other services', function (assert) {
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
    start = assert.async();
    assert.expect(3);
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
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 1);
        assert.equal(service2.status, "stopped");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });


  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.onEvent
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.onEvent", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('is chainable', function (assert) {
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
    assert.equal(result, Klass);
  });

  test('create callback in the service_list property', function (assert) {
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
    assert.equal(Klass.__service_list.length, 1);
  });

  function declareEventToCheck(klass, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.onEvent('bar', function (assert) {
      return new RSVP.Promise(function () {
        service_status.start_count += 1;
        service_status.status = "started";
      }, function (assert) {
        service_status.stop_count += 1;
        service_status.status = "stopped";
      });
    });
  }

  test('callback is triggered on event', function (assert) {
    var service1 = {},
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test599.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    start = assert.async();
    assert.expect(9);
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
        assert.equal(service1.start_count, 0);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, undefined);

        var event = new Event("bar");
        document.getElementById('qunit-fixture').querySelector("div")
                                                .dispatchEvent(event);
        return RSVP.delay(50);
      })
      .then(function () {
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");

        var event = new Event("bar");
        document.getElementById('qunit-fixture').querySelector("div")
                                                .dispatchEvent(event);
        return RSVP.delay(50);
      })
      .then(function () {
        assert.equal(service1.start_count, 2);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "started");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('check cancellation message after trigger event twice',
       function (assert) {
      var called = false,
        gadget = new RenderJSGadget(),
        html_url = 'https://example.org/files/qunittest/test600.html';
      gadget.__sub_gadget_dict = {};

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body></body></html>"]);

      document.getElementById('qunit-fixture').innerHTML = "<div></div>";
      start = assert.async();
      assert.expect(1);
      renderJS.declareGadgetKlass(html_url)
        .then(function (Klass) {
          Klass.onEvent('bar', function () {
            return new RSVP.Promise(function () {
              return;
            }, function (error) {
              if (called) {
                return;
              }

              called = true;
              assert.equal(error, "Cancelling previous event (bar)");
            });
          });
          return gadget.declareGadget(
            html_url,
            {element: document.getElementById('qunit-fixture')
                              .querySelector("div")}
          );
        })
        .then(function () {
          var event = new Event("bar");
          document.getElementById('qunit-fixture').querySelector("div")
                                                  .dispatchEvent(event);
          document.getElementById('qunit-fixture').querySelector("div")
                                                  .dispatchEvent(event);
        })
        .always(function () {
          start();
        });
    });

  test('check message after delete gadget', function (assert) {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test601.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    start = assert.async();
    assert.expect(2);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        Klass.declareJob("runJob1", function () {
          return new RSVP.Promise(function () {
            return RSVP.delay(20);
          }, function (error) {
            assert.equal(
              error,
              "Deleting Gadget Monitor " +
                "(https://example.org/files/qunittest/test601.html)"
            );
          });
        });
        Klass.onEvent('bar', function () {
          return new RSVP.Promise(function () {
            return;
          }, function (error) {
            assert.equal(
              error,
              "Deleting Gadget Monitor " +
                "(https://example.org/files/qunittest/test601.html)"
            );
          });
        });
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (g) {
        var event = new Event("bar");
        document.getElementById('qunit-fixture').querySelector("div")
                                                .dispatchEvent(event);
        g.runJob1();
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .innerHTML = "";
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.onLoop
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.onLoop", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('is chainable', function (assert) {
    // Check that onLoop is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.onLoop = RenderJSGadget.onLoop;

    result = Klass.onLoop(function () {
      return;
    });
    // onLoop is chainable
    assert.equal(result, Klass);
  });

  test('create callback in the service_list property', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    },
      callback = function () {return; };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.onLoop = RenderJSGadget.onLoop;

    Klass.onLoop(callback);
    assert.equal(Klass.__service_list.length, 1);
  });

  function declareTimeoutToCheck(klass, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.onLoop(function (evt) {
      service_status.start_count += 1;
      service_status.this = this;
      return new RSVP.Queue()
        .push(function () {
          service_status.status = "started";
          service_status.defer = RSVP.defer();
          return service_status.defer.promise;
        })
        .push(function () {
          service_status.stop_count += 1;
          service_status.status = "stopped";
        });
    });
  }

  test('callback is triggered on timeout', function (assert) {
    var service1 = {},
      gadget = new RenderJSGadget(),
      sub_gadget,
      html_url = 'https://example.org/files/qunittest/test599.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    start = assert.async();
    assert.expect(11);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        declareTimeoutToCheck(Klass, service1);
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (g) {
        sub_gadget = g;
        return RSVP.delay(50);
      })
      .then(function () {
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");
        assert.equal(service1.this, sub_gadget);
        service1.defer.resolve();
        return RSVP.delay(50);
      })
      .then(function () {
        assert.equal(service1.start_count, 2);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "started");
        assert.equal(service1.this, sub_gadget);
        return RSVP.delay(50);
      })
      .then(function () {
        assert.equal(service1.start_count, 2);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "started");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadgetKlass.declareJob
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadgetKlass.declareJob", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });

  test('is chainable', function (assert) {
    // Check that declareJob is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.__service_list = [];
    Klass.declareJob = RenderJSGadget.declareJob;

    result = Klass.declareJob('runServiceMethod', function (assert) {
      return;
    });
    // onEvent is chainable
    assert.equal(result, Klass);
  });


  test('creates methods on the prototype', function (assert) {
    // Check that declareMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.declareJob = RenderJSGadget.declareJob;

    gadget = new Klass();
    assert.equal(gadget.testFoo, undefined);
    Klass.declareJob('testFoo', function (assert) {
      return;
    });
    // Method is added on the instance class prototype
    assert.equal(RenderJSGadget.prototype.testFoo, undefined);
    assert.ok(gadget.testFoo !== undefined);
    assert.ok(Klass.prototype.testFoo !== undefined);
    assert.equal(Klass.prototype.testFoo, gadget.testFoo);
  });

  /////////////////////////////////////////////////////////////////
  // Service status
  /////////////////////////////////////////////////////////////////
  function declareJobToCheck(klass, name, service_status) {
    service_status.start_count = 0;
    service_status.stop_count = 0;
    service_status.status = undefined;

    klass.declareJob(name, function (parameter) {
      return new RSVP.Promise(function () {
        service_status.start_count += 1;
        service_status.parameter = parameter;
        service_status.status = "started";
      }, function (assert) {
        service_status.stop_count += 1;
        service_status.status = "stopped";
      });
    });
  }

  test('job untouched when gadget not in DOM', function (assert) {
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

    start = assert.async();
    assert.expect(8);
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
        assert.equal(service1.start_count, 0);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, undefined);
        assert.equal(service1.parameter, undefined);
        assert.equal(service2.start_count, 0);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, undefined);
        assert.equal(service2.parameter, undefined);
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job triggered when gadget in DOM', function (assert) {
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
    start = assert.async();
    assert.expect(8);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");
        assert.equal(service1.parameter, 'foo');
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, "started");
        assert.equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job called twice propage error message', function (assert) {
    var g,
      gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test502.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    start = assert.async();
    assert.expect(1);

    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        Klass.declareJob("runJob1", function (parameter) {
          return new RSVP.Promise(function () {
            return RSVP.delay(20);
          }, function (error) {
            if (parameter === "first") {
              assert.equal(error, "runJob1 : Cancelling previous job");
            }
          });
        });
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (result) {
        g = result;
        g.runJob1("first");
        g.runJob1("second");
      })
      .always(function () {
        start();
      });
  });

  test('cancel jobs with custom message', function (assert) {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test502.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    document.getElementById('qunit-fixture').innerHTML = "<div></div>";
    start = assert.async();
    assert.expect(2);

    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url,
          {element: document.getElementById('qunit-fixture')
                            .querySelector("div")}
        );
      })
      .then(function (result) {
        var all,
          msg = "Cancel RSVP.all";

        all = RSVP.all([
          RSVP.Promise(function () {
            return;
          }, function (error) {
            assert.equal(error, msg);
          }),
          RSVP.Promise(function () {
            return;
          }, function (error) {
            assert.equal(error, msg);
          })
        ]);
        all.cancel("Cancel RSVP.all");
      })
      .always(function () {
        start();
      });
  });

  test('job triggered when gadget element added in DOM', function (assert) {
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
    start = assert.async();
    assert.expect(8);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");
        assert.equal(service1.parameter, 'foo');
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, "started");
        assert.equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job stopped when gadget element removed from DOM', function (assert) {
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
    start = assert.async();
    assert.expect(8);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "stopped");
        assert.equal(service1.parameter, 'foo');
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 1);
        assert.equal(service2.status, "stopped");
        assert.equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job can not be restarted', function (assert) {
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
    start = assert.async();
    assert.expect(8);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "stopped");
        assert.equal(service1.parameter, 'foo');
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 1);
        assert.equal(service2.status, "stopped");
        assert.equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job can be triggered multiple times', function (assert) {
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
    start = assert.async();
    assert.expect(8);
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
        assert.equal(service1.start_count, 2);
        assert.equal(service1.stop_count, 1);
        assert.equal(service1.status, "started");
        assert.equal(service1.parameter, 'foo2');
        assert.equal(service2.start_count, 1);
        assert.equal(service2.stop_count, 0);
        assert.equal(service2.status, "started");
        assert.equal(service2.parameter, 'bar');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('job is local to a gadget instance', function (assert) {
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
    start = assert.async();
    assert.expect(4);
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
        assert.equal(service1.start_count, 1);
        assert.equal(service1.stop_count, 0);
        assert.equal(service1.status, "started");
        assert.equal(service1.parameter, 'foo');
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // Job error handling
  /////////////////////////////////////////////////////////////////
  test('Job error are reported to parent gadget', function (assert) {
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
    start = assert.async();
    assert.expect(2);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {

        Klass.declareJob('crashJob', function (assert) {
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
        assert.ok(catched_error instanceof Error);
        assert.equal(
          catched_error.message,
          "My service crashed!"
        );
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Job error are reported after added to the DOM', function (assert) {
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
    start = assert.async();
    assert.expect(3);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {

        Klass.declareJob('crashJob', function (assert) {
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
        assert.equal(catched_error, undefined);
      })
      .then(function () {
        document
          .getElementById('qunit-fixture')
          .querySelector("div")
          .appendChild(g.element);
        return RSVP.delay(50);
      })
      .then(function () {
        assert.ok(catched_error instanceof Error);
        assert.equal(
          catched_error.message,
          "My service crashed!"
        );
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSIframeGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSIframeGadget");

  test('should be a constructor', function (assert) {
    var gadget = new RenderJSIframeGadget();
    assert.equal(
      Object.getPrototypeOf(gadget),
      RenderJSIframeGadget.prototype,
      '[[Prototype]] equals RenderJSIframeGadget.prototype'
    );
    assert.equal(
      gadget.constructor,
      RenderJSIframeGadget,
      'constructor property of instances is set correctly'
    );
    assert.equal(
      RenderJSIframeGadget.prototype.constructor,
      RenderJSIframeGadget,
      'constructor property of prototype is set correctly'
    );
  });

  test('should not accept parameter', function (assert) {
    assert.equal(RenderJSIframeGadget.length, 0);
  });

  test('should work without new', function (assert) {
    var gadgetKlass = RenderJSIframeGadget,
      gadget = gadgetKlass();
    assert.equal(
      gadget.constructor,
      RenderJSIframeGadget,
      'constructor property of instances is set correctly'
    );
    assert.ok(gadget instanceof RenderJSGadget);
    assert.ok(gadget instanceof RenderJSIframeGadget);
    assert.ok(RenderJSIframeGadget !== RenderJSGadget);
    assert.ok(gadget.__aq_parent === undefined);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSEmbeddedGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSEmbeddedGadget");

  test('should be a constructor', function (assert) {
    var gadget = new RenderJSEmbeddedGadget();
    assert.equal(
      Object.getPrototypeOf(gadget),
      RenderJSEmbeddedGadget.prototype,
      '[[Prototype]] equals RenderJSEmbeddedGadget.prototype'
    );
    assert.equal(
      gadget.constructor,
      RenderJSEmbeddedGadget,
      'constructor property of instances is set correctly'
    );
    assert.equal(
      RenderJSEmbeddedGadget.prototype.constructor,
      RenderJSEmbeddedGadget,
      'constructor property of prototype is set correctly'
    );
  });

  test('should not accept parameter', function (assert) {
    assert.equal(RenderJSEmbeddedGadget.length, 0);
  });

  test('should work without new', function (assert) {
    var gadgetKlass = RenderJSEmbeddedGadget,
      gadget = gadgetKlass();
    assert.equal(
      gadget.constructor,
      RenderJSEmbeddedGadget,
      'constructor property of instances is set correctly'
    );
    assert.ok(gadget instanceof RenderJSGadget);
    assert.ok(gadget instanceof RenderJSEmbeddedGadget);
    assert.ok(RenderJSEmbeddedGadget !== RenderJSGadget);
    assert.ok(gadget.__aq_parent === undefined);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (public)
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.declareGadget", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
      this.server = sinon.fakeServer.create();

      this.server.autoRespond = true;
      this.server.autoRespondAfter = 5;
    },
    afterEach: function () {
      this.server.restore();
      delete this.server;
    }
  });
  test('returns a Promise', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function () {
        assert.ok(true);
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('provide a gadget instance as callback parameter', function (assert) {
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

    start = assert.async();
    assert.expect(3);
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function (new_gadget) {
        assert.equal(new_gadget.__path, url);
        assert.deepEqual(new_gadget.__acquired_method_dict, {});
        assert.ok(new_gadget instanceof RenderJSGadget);
      })
      .always(function () {
        start();
      });
  });

  test('Initialize sub_gadget_dict private property', function (assert) {
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

    start = assert.async();
    assert.expect(2);
    gadget.declareGadget(url)//, document.getElementById('qunit-fixture'))
      .then(function (new_gadget) {
        assert.ok(new_gadget.hasOwnProperty("__sub_gadget_dict"));
        assert.deepEqual(new_gadget.__sub_gadget_dict, {});
      })
      .always(function () {
        start();
      });
  });

  test('no parameter', function (assert) {
    // Check that missing url reject the declaration
    var gadget = new RenderJSGadget();
    start = assert.async();
    assert.expect(1);
    gadget.declareGadget()
      .fail(function () {
        assert.ok(true);
      })
      .always(function () {
        start();
      });
  });

  test('load dependency before returning gadget', function (assert) {
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
    start = assert.async();
    assert.expect(12);
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        assert.equal(document.getElementById('qunit-fixture').innerHTML,
              "<div>youhou2</div><div>bar</div>");
        assert.equal(new_gadget.element.innerHTML,
              "<p>Bar content</p>");
        assert.equal(new_gadget.element.tagName,
              "DIV");
        assert.equal(new_gadget.element.getAttribute("data-gadget-url"),
              html_url);
        assert.equal(new_gadget.element.getAttribute("data-gadget-sandbox"),
              "public");
        assert.notEqual(new_gadget.element.getAttribute("data-gadget-scope"),
              null);
        assert.ok(spy_js.calledTwice, "JS count " + spy_js.callCount);
        assert.equal(spy_js.firstCall.args[0], js1_url, "First JS call");
        assert.equal(spy_js.secondCall.args[0], js2_url, "Second JS call");
        assert.ok(spy_css.calledTwice, "CSS count " + spy_css.callCount);
        assert.equal(spy_css.firstCall.args[0], css1_url, "First CSS call");
        assert.equal(spy_css.secondCall.args[0], css2_url, "Second CSS call");
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
        spy_js.restore();
        spy_css.restore();
      });
  });

  test('load dependency in the right order', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        assert.equal(
          window.test_js1.test_js2.test_js3.test_js4.test_js5.test_js6,
          'foo'
        );
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
      });

  });

  test('Fail if klass can not be loaded', function (assert) {
    // Check that gadget is not created if klass is can not be loaded
    var gadget = new RenderJSGadget(),
      html_url = 'http://example.org/files/qunittest/test3.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [404, {
      "Content-Type": "text/html"
    }, ""]);

    start = assert.async();
    assert.expect(1);
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (jqXHR) {
        assert.equal(jqXHR.status, 404);
      })
      .always(function () {
        start();
      });
  });

  test('Fail if js can not be loaded', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    gadget.declareGadget(html_url)
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (e) {
        assert.ok(true);
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Do not load gadget dependency twice', function (assert) {
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

    start = assert.async();
    assert.expect(2);
    document.getElementById('qunit-fixture').innerHTML =
      "<div></div><div></div>";
    gadget.declareGadget(html_url)
      .fail(function (e) {
        assert.ok(false, "1 + " + e.toString());
      })
      .then(function () {
        assert.equal(document.getElementById('qunit-fixture').innerHTML,
              "<div>youhou</div><div></div>");
        return gadget.declareGadget(html_url);
      })
      .then(function (new_gadget) {
        assert.equal(document.getElementById('qunit-fixture').innerHTML,
              "<div>youhou</div><div></div>");
      })
      .fail(function (e) {
        assert.ok(false, "2 + " + e.toString());
      })
      .always(function () {
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('Load 2 concurrent gadgets in parallel', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    RSVP.all([
      gadget.declareGadget(html_url),
      gadget.declareGadget(html_url)
    ])
      .then(function () {
        assert.ok(true);
      })
      .always(function () {
        // Check that only one request has been done.
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('One failing gadget can not be reloaded', function (assert) {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98709.html',
      error;
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [404, {
      "Content-Type": "text/html"
    }, "raw html"]);

    start = assert.async();
    assert.expect(2);

    gadget.declareGadget(html_url)
      .fail(function (e) {
        error = e;
        assert.ok(true, 'first gadget should fail');
        return gadget.declareGadget(html_url);
      })
      .fail(function (e) {
        assert.equal(e, error, 'second gadget should fail the same way');
      })
      .always(function () {
        // Check that only one request has been done.
        start();
      });
  });

  test('Load 2 concurrent failing gadgets in parallel', function (assert) {
    // Check that dependencies are loaded once if 2 gadgets are created
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test9871.html',
      load1,
      load2,
      error,
      mock;
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [404, {
      "Content-Type": "text/html"
    }, "raw html"]);

    mock = sinon.mock(renderJS, "parseGadgetHTMLDocument");
    mock.expects("parseGadgetHTMLDocument").once().returns({});

    start = assert.async();
    load1 = gadget.declareGadget(html_url);
    load2 = gadget.declareGadget(html_url);

    assert.expect(2);

    load1
      .fail(function (e) {
        error = e;
        assert.ok(true, 'load1 should fail');
        return load2;
      })
      .fail(function (e) {
        assert.equal(e, error, 'load2 must fail like load1');
      })
      .always(function () {
        // Check that only one request has been done.
        start();
        mock.verify();
        mock.restore();
      });
  });

  test('One failing gadget does not prevent the others to load',
       function (assert) {
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

      start = assert.async();
      assert.expect(1);
      gadget.declareGadget(html_url)
        .then(function () {
          assert.ok(false);
        })
        .fail(function () {
          return gadget.declareGadget(html_url2);
        })
        .then(function () {
          assert.ok(true);
        })
        .always(function () {
          // Check that only one request has been done.
          start();
          mock.verify();
          mock.restore();
        });
    });

  test('Wait for ready callback before returning', function (assert) {

    // Subclass RenderJSGadget to not pollute its namespace
    var called = false,
      gadget = new RenderJSGadget(),
      ready_gadget,
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    start = assert.async();
    assert.expect(6);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.ready(function (g) {
          assert.deepEqual(gadget.__sub_gadget_dict, {});
          assert.equal(g, this, "Context should be the gadget instance");
          ready_gadget = g;
          return RSVP.delay(50).then(function () {
            // Modify the value after 50ms
            called = true;
            assert.deepEqual(gadget.__sub_gadget_dict, {});
          });
        });
        return gadget.declareGadget(html_url, {scope: 'sub'});
      })
      .then(function (result) {
        assert.equal(result, ready_gadget,
                     "Context should be the gadget instance");
        assert.ok(called);
        assert.deepEqual(gadget.__sub_gadget_dict, {'sub': result});
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('getDeclareGadget can be called in ready', function (assert) {

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

    start = assert.async();
    assert.expect(1);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.ready(function (g) {
          return g.declareGadget(html_url2);
        });
        return gadget.declareGadget(html_url);
      })
      .then(function () {
        assert.ok(true);
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Set a default state', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      gadget1,
      gadget2,
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    start = assert.async();
    assert.expect(5);
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
        assert.ok(gadget1.hasOwnProperty('state'));
        assert.deepEqual(gadget1.state, {});
        assert.ok(gadget2.hasOwnProperty('state'));
        assert.deepEqual(gadget2.state, {});
        // Instance should have a copy of the init state
        assert.ok(gadget1.state !== gadget2.state);
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Set the gadget state defined by setState', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      init_state = {foo: 'bar'},
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body></body></html>"]);

    start = assert.async();
    assert.expect(3);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        // Create a ready function
        Klass.setState(init_state);
        return gadget.declareGadget(html_url);
      })
      .then(function (result) {
        assert.ok(result.hasOwnProperty('state'));
        assert.deepEqual(result.state, {foo: 'bar'});
        // Instance should have a copy of the init state
        assert.ok(result.state !== init_state);
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Can take a DOM element options', function (assert) {

    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html',
      previous_fixture = document.getElementById('qunit-fixture');
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    previous_fixture.innerHTML = "<div>bar</div>";
    start = assert.async();
    assert.expect(3);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url,
          {element: previous_fixture}
        );
      })
      .then(function (g) {
        assert.notEqual(document.getElementById('qunit-fixture'),
                        previous_fixture);
        assert.equal(document.getElementById('qunit-fixture'), g.element);
        assert.equal(
          document.getElementById('qunit-fixture').innerHTML,
          '<p>foo</p>'
        );
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Can take a scope options', function (assert) {

    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    document.getElementById('qunit-fixture').textContent = "";
    start = assert.async();
    assert.expect(3);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url,
          {scope: "foo"}
        );
      })
      .then(function (child_gadget) {
        assert.ok(gadget.__sub_gadget_dict.hasOwnProperty("foo"));
        assert.equal(gadget.__sub_gadget_dict.foo, child_gadget);
        assert.equal(child_gadget.element.getAttribute("data-gadget-scope"),
              "foo");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('Generate a random scope if none is provided', function (assert) {

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
    start = assert.async();
    assert.expect(9);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(
          html_url
        );
      })
      .then(function (child_gadget) {
        scope1 = child_gadget.element.getAttribute("data-gadget-scope");
        assert.equal(scope1.indexOf('RJS_'), 0, scope1);
        assert.ok(gadget.__sub_gadget_dict.hasOwnProperty(scope1));
        assert.equal(gadget.__sub_gadget_dict[scope1], child_gadget);
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
        assert.equal(scope2.indexOf('RJS_'), 0);
        assert.ok(gadget.__sub_gadget_dict.hasOwnProperty(scope1));
        assert.ok(gadget.__sub_gadget_dict.hasOwnProperty(scope2));
        assert.equal(gadget.__sub_gadget_dict[scope2], child_gadget);
        assert.notEqual(scope1, scope2);
        assert.equal(scope2, 'RJS_' + (scope_index + 2));
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent returns acquired_method result if available',
       function (assert) {
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
          assert.equal(this, gadget, "Context should be kept");
          assert.deepEqual(argument_list, original_argument_list,
                "Argument list should be kept"
            );
          assert.equal(child_scope.indexOf('RJS_'), 0,
                "Random child scope is generated");
          return "FOO";
        };

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body></body></html>"]);

      start = assert.async();
      assert.expect(5);
      gadget.declareGadget(html_url)
        .then(function (new_gadget) {
          return new_gadget.__aq_parent(
            original_method_name,
            original_argument_list
          );
        })
        .then(function (result) {
          assert.equal(result, "FOO");
          assert.equal(aq_dynamic_called, true);
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('__aq_parent propagate child_scope to acquired_method',
       function (assert) {
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
          assert.equal(this, gadget, "Context should be kept");
          assert.deepEqual(argument_list, original_argument_list,
                "Argument list should be kept"
            );
          assert.equal(child_scope, "bar", "Child scope should be provided");
        };

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body></body></html>"]);

      start = assert.async();
      assert.expect(4);
      gadget.declareGadget(html_url, {scope: "bar"})
        .then(function (new_gadget) {
          return new_gadget.__aq_parent(
            original_method_name,
            original_argument_list
          );
        })
        .then(function (result) {
          assert.equal(aq_dynamic_called, true);
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('__aq_parent doesnt propagate unknown gadget child_scope',
       function (assert) {
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
          assert.equal(this, gadget, "Context should be kept");
          assert.deepEqual(argument_list, original_argument_list,
                "Argument list should be kept"
            );
          assert.equal(child_scope, undefined,
                       "Child scope should be unknown");
        };

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body></body></html>"]);

      start = assert.async();
      assert.expect(4);
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
          assert.equal(aq_dynamic_called, true);
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('__aq_parent fails if aquired_method throws an error',
       function (assert) {
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

      start = assert.async();
      assert.expect(2);
      gadget.declareGadget(html_url)
        .then(function (new_gadget) {
          return new_gadget.__aq_parent("foo", []);
        })
        .fail(function (error) {
          assert.equal(error, original_error);
          assert.equal(error.message, "Custom error for the test");
        })
        .always(function () {
          start();
        });
    });

  test('returns __aq_parent result if acquired_method raises AcquisitionError',
    function (assert) {
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
          assert.equal(i, 0, "aquired_method called first");
          i += 1;
          throw new renderJS.AcquisitionError("please call __aq_parent!");
        };

      gadget.__aq_parent = function (method_name, argument_list) {
        __aq_parent_called = true;
        assert.equal(i, 1, "__aq_parent called after acquired_method");
        assert.equal(this, gadget, "Context should be kept");
        assert.equal(method_name, original_method_name,
                     "Method name should be kept");
        assert.deepEqual(argument_list, original_argument_list,
              "Argument list should be kept"
          );
        return "FOO";
      };

      start = assert.async();
      assert.expect(8);
      gadget.declareGadget(html_url)
        .then(function (new_gadget) {
          return new_gadget.__aq_parent(original_method_name,
                                        original_argument_list);
        })
        .then(function (result) {
          assert.equal(result, "FOO");
          assert.equal(aq_dynamic_called, true);
          assert.equal(__aq_parent_called, true);
        })
        .always(function () {
          start();
        });
    });

  test('path must be absolute to parent path if relative', function (assert) {
    var parent_gadget = new RenderJSGadget(),
      gadget_path = "./some/path/to/a/gadget",
      parent_path = "http://something.org",
      absolute_path = "http://something.org/some/path/to/a/gadget";

    parent_gadget.__sub_gadget_dict = {};
    parent_gadget.__path = parent_path;
    this.server.respondWith("GET", absolute_path, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    start = assert.async();
    assert.expect(1);
    parent_gadget.declareGadget(gadget_path)
      .then(function (gadget) {
        assert.equal(gadget.__path, absolute_path);
      })
      .fail(function (e) {
        assert.ok(false);
      })
      .always(start);
  });

  test('can declareGadget without scope in HTML directly', function (assert) {
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

    start = assert.async();
    assert.expect(9);
    gadget.declareGadget(html_url)
      .then(function (g) {
        assert.equal(spy.callCount, 2);
        assert.equal(spy.firstCall.args[1], html_url);
        assert.equal(spy.secondCall.args[1], html_url2);

        var key_list = Object.keys(g.__sub_gadget_dict);
        assert.equal(key_list.length, 1, "One child");
        scope = key_list[0];
        assert.equal(scope.indexOf('RJS_'), 0, scope);

        // Second gadget is a child
        return g.getDeclaredGadget(scope);
      })
      .then(function (g2) {
        assert.equal(g2.__path, html_url2);
        // The gadget element is the one defined in HTML
        assert.equal(g2.element.getAttribute("data-foo"), "bar");
        assert.equal(g2.element.getAttribute("data-gadget-scope"), scope);

        // The gadget is public by default
        assert.equal(g2.element.innerHTML, "raw html");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
        spy.restore();
      });
  });


  test('can declareGadget with scope in HTML directly', function (assert) {
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

    start = assert.async();
    assert.expect(6);
    gadget.declareGadget(html_url)
      .then(function (g) {
        assert.equal(spy.callCount, 2);
        assert.equal(spy.firstCall.args[1], html_url);
        assert.equal(spy.secondCall.args[1], html_url2);
        // Second gadget is a child
        return g.getDeclaredGadget("bar");
      })
      .then(function (g2) {
        assert.equal(g2.__path, html_url2);
        // The gadget element is the one defined in HTML
        assert.equal(g2.element.getAttribute("data-foo"), "bar");
        // The gadget is public by default
        assert.equal(g2.element.innerHTML, "raw html");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
        spy.restore();
      });
  });

  test('can declareGadget relativeurl in HTML', function (assert) {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test12345.html',
      html_relative_url2 = 'test12346.html',
      html_url2 = 'https://example.org/files/qunittest/test12346.html',
      spy;
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div data-foo='bar' " +
       "data-gadget-scope='bar' data-gadget-url='" + html_relative_url2 +
       "'></div></body></html>"]);
    this.server.respondWith("GET", html_url2, [200, {
      "Content-Type": "text/html"
    }, "raw html"]);

    spy = sinon.spy(renderJS, "parseGadgetHTMLDocument");

    start = assert.async();
    assert.expect(6);
    gadget.declareGadget(html_url)
      .then(function (g) {
        assert.equal(spy.callCount, 2);
        assert.equal(spy.firstCall.args[1], html_url);
        assert.equal(spy.secondCall.args[1], html_url2);
        // Second gadget is a child
        return g.getDeclaredGadget("bar");
      })
      .then(function (g2) {
        assert.equal(g2.__path, html_url2);
        // The gadget element is the one defined in HTML
        assert.equal(g2.element.getAttribute("data-foo"), "bar");
        // The gadget is public by default
        assert.equal(g2.element.innerHTML, "raw html");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
        spy.restore();
      });
  });

  test('can declareGadget relativeurl in HTML with base tag',
       function (assert) {
      var gadget = new RenderJSGadget(),
        html_url = 'https://example.org/files/qunittest/test12345.html',
        html_relative_url2 = 'test12346.html',
        html_url2 = 'https://example.org/files/qunittest/foo/test12346.html',
        spy;
      gadget.__sub_gadget_dict = {};

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><head><base href='./foo/'></head><body><div data-foo='bar' " +
        "data-gadget-scope='bar' data-gadget-url='" + html_relative_url2 +
        "'></div></body></html>"]);
      this.server.respondWith("GET", html_url2, [200, {
        "Content-Type": "text/html"
      }, "raw html"]);

      spy = sinon.spy(renderJS, "parseGadgetHTMLDocument");

      start = assert.async();
      assert.expect(6);
      gadget.declareGadget(html_url)
        .then(function (g) {
          assert.equal(spy.callCount, 2);
          assert.equal(spy.firstCall.args[1], html_url);
          assert.equal(spy.secondCall.args[1], html_url2);
          // Second gadget is a child
          return g.getDeclaredGadget("bar");
        })
        .then(function (g2) {
          assert.equal(g2.__path, html_url2);
          // The gadget element is the one defined in HTML
          assert.equal(g2.element.getAttribute("data-foo"), "bar");
          // The gadget is public by default
          assert.equal(g2.element.innerHTML, "raw html");
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
          spy.restore();
        });
    });

  test('can declareGadget a sandboxed gadget in HTML directly',
       function (assert) {
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

      start = assert.async();
      assert.expect(3);
      gadget.declareGadget(html_url, {
        element: document.getElementById('qunit-fixture')
      })
        .then(function (g) {
          return g.getDeclaredGadget("bar");
        })
        .then(function (g2) {
          assert.equal(g2.__path, html_url2);
          // The gadget element is the one defined in HTML
          assert.equal(g2.element.getAttribute("data-foo"), "bar");
          // The gadget is inside an iframe
          assert.equal(g2.element.innerHTML,
                '<iframe src="' + html_url2 + '"></iframe>');
        })
        .fail(function (e) {
          assert.ok(false, e);
        })
        .always(function () {
          start();
        });
    });

  test('fail if declareGadget with scope in HTML fail', function (assert) {
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test12345.html',
      html_url2 = 'https://example.org/files/qunittest/test12346.html';
    gadget.__sub_gadget_dict = {};
    gadget.__aq_parent = function (method_name, argument_list) {
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><div data-foo='bar' " +
       "data-gadget-scope='bar' data-gadget-url='" + html_url2 +
       "'></div></body></html>"]);
    this.server.respondWith("GET", html_url2, [403, {
      "Content-Type": "text/html"
    }, "raw html"]);

    start = assert.async();
    assert.expect(2);
    gadget.declareGadget(html_url)
      .then(function () {
        assert.ok(false);
      })
      .fail(function (e) {
        assert.equal(e.status, 403);
        assert.equal(e.url, html_url2);
      })
      .always(start);
  });

  test('can catch if declareGadget with scope in HTML fail',
       function (assert) {
      // Subclass RenderJSGadget to not pollute its namespace
      var ParentKlass = function () {
        RenderJSGadget.call(this);
      },
        gadget,
        error_context,
        // catched_error,
        html_url = 'https://example.org/files/qunittest/test12345.html',
        html_url2 = 'https://example.org/files/qunittest/test12346.html';
      ParentKlass.prototype = new RenderJSGadget();
      ParentKlass.prototype.constructor = ParentKlass;
      ParentKlass.prototype.__acquired_method_dict = {};
      ParentKlass.allowPublicAcquisition =
        RenderJSGadget.allowPublicAcquisition;

      gadget = new ParentKlass();
      gadget.__sub_gadget_dict = {};

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body><div data-foo='bar' " +
        "data-gadget-scope='foo' data-gadget-url='" + html_url2 +
        "'></div></body></html>"]);
      this.server.respondWith("GET", html_url2, [403, {
        "Content-Type": "text/html"
      }, "raw html"]);

      start = assert.async();
      assert.expect(5);
      renderJS.declareGadgetKlass(html_url)
        .then(function (Klass) {
          Klass.allowPublicAcquisition('reportGadgetDeclarationError',
                                      function (argument_list, scope) {
              var catched_error = argument_list[0];
              error_context = this;
              assert.equal(catched_error.status, 403);
              assert.equal(catched_error.url, html_url2);
              assert.equal(scope, 'foo');
            });
          return gadget.declareGadget(html_url);
        })
        .then(function (result) {
          assert.deepEqual(result, error_context);
          assert.ok(true, 'Error correctly catched');
        })
        .fail(function (e) {
          assert.ok(false, "Error should have been catched");
        })
        .always(start);
    });

  test('can catch if declareGadget without scope in HTML fail',
       function (assert) {
      // Subclass RenderJSGadget to not pollute its namespace
      var ParentKlass = function () {
        RenderJSGadget.call(this);
      },
        gadget,
        error_context,
        // catched_error,
        html_url = 'https://example.org/files/qunittest/test1234598.html',
        html_url2 = 'https://example.org/files/qunittest/test1234698.html';
      ParentKlass.prototype = new RenderJSGadget();
      ParentKlass.prototype.constructor = ParentKlass;
      ParentKlass.prototype.__acquired_method_dict = {};
      ParentKlass.allowPublicAcquisition =
        RenderJSGadget.allowPublicAcquisition;

      gadget = new ParentKlass();
      gadget.__sub_gadget_dict = {};

      this.server.respondWith("GET", html_url, [200, {
        "Content-Type": "text/html"
      }, "<html><body><div data-foo='bar' " +
        "data-gadget-url='" + html_url2 +
        "'></div></body></html>"]);
      this.server.respondWith("GET", html_url2, [403, {
        "Content-Type": "text/html"
      }, "raw html"]);

      start = assert.async();
      assert.expect(5);
      renderJS.declareGadgetKlass(html_url)
        .then(function (Klass) {
          Klass.allowPublicAcquisition('reportGadgetDeclarationError',
                                      function (argument_list, scope) {
              var catched_error = argument_list[0];
              error_context = this;
              assert.equal(catched_error.status, 403);
              assert.equal(catched_error.url, html_url2);
              assert.equal(scope, null);
            });
          return gadget.declareGadget(html_url);
        })
        .then(function (result) {
          assert.deepEqual(result, error_context);
          assert.ok(true, 'Error correctly catched');
        })
        .fail(function (e) {
          assert.ok(false, "Error should have been catched");
        })
        .always(start);
    });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (iframe)
  /////////////////////////////////////////////////////////////////
  test('Require the element options', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html';
    gadget.__sub_gadget_dict = {};

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    start = assert.async();
    assert.expect(2);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(html_url, {sandbox: 'iframe'});
      })
      .then(function () {
        assert.ok(false);
      })
      .fail(function (e) {
        assert.ok(e instanceof Error);
        assert.equal(
          e.message,
          "DOM element is required to create Iframe Gadget " + html_url
        );
      })
      .always(function () {
        start();
      });
  });

  test('Require a DOM element as option', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      html_url = 'https://example.org/files/qunittest/test98.html',
      parent_element = document.createElement("div"),
      gadget_element = document.createElement("div");
    gadget.__sub_gadget_dict = {};
    parent_element.appendChild(gadget_element);

    this.server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html"
    }, "<html><body><p>foo</p></body></html>"]);

    start = assert.async();
    assert.expect(2);
    renderJS.declareGadgetKlass(html_url)
      .then(function (Klass) {
        return gadget.declareGadget(html_url, {
          sandbox: 'iframe',
          element: gadget_element
        });
      })
      .then(function () {
        assert.ok(false);
      })
      .fail(function (e) {
        assert.ok(e instanceof Error);
        assert.equal(
          e.message,
          "The parent element is not attached to the DOM for " + html_url
        );
      })
      .always(function () {
        start();
      });
  });

  test('Can take a scope options', function (assert) {
    // Subclass RenderJSGadget to not pollute its namespace
    var gadget = new RenderJSGadget(),
      url = "./embedded.html";

    gadget.__sub_gadget_dict = {};

    document.getElementById("qunit-fixture").textContent = "";

    start = assert.async();
    assert.expect(4);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture'),
      scope: "foo"
    })
      .then(function (child_gadget) {
        assert.ok(gadget.__sub_gadget_dict.hasOwnProperty("foo"));
        assert.equal(gadget.__sub_gadget_dict.foo, child_gadget);
        assert.equal(child_gadget.element.getAttribute("data-gadget-scope"),
              "foo");
        assert.equal(child_gadget.element.getAttribute("data-gadget-sandbox"),
              "iframe");
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('provide an iframed gadget as callback parameter', function (assert) {
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

    start = assert.async();
    assert.expect(1);
    parent_gadget.declareGadget(gadget_path, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.equal(new_gadget.__path, absolute_path);
        assert.equal(Object.keys(new_gadget.__acquired_method_dict).length, 1);
        assert.ok(new_gadget instanceof RenderJSIframeGadget);
        assert.equal(
          new_gadget.element.innerHTML,
          '<iframe src="' + absolute_path + '"></iframe>'
        );
        assert.ok(new_gadget.__chan !== undefined);
      })
      .always(function () {
        start();
      });
  });

  test('Initialize sub_gadget_dict private property', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded.html";

    document.getElementById("qunit-fixture").textContent = "";

    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(2);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.ok(new_gadget.hasOwnProperty("__sub_gadget_dict"));
        assert.deepEqual(new_gadget.__sub_gadget_dict, {});
      })
      .always(function () {
        start();
      });
  });

  test('checking working iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      acquired_method_cancel_called = false,
      acquire_called = false,
      url = "./embedded.html",
      new_gadget;

    gadget.__aq_parent = function (method_name, argument_list) {
      acquire_called = true;
      assert.equal(this, gadget, "Context should be kept");
      if (method_name === "acquireMethodRequested") {
        assert.equal(method_name, "acquireMethodRequested",
          "Method name should be kept");
        assert.deepEqual(argument_list, ["param1", "param2"],
              "Argument list should be kept"
          );
        return "result correctly fetched from parent";
      }
      if (method_name === "acquireCancellationError") {
        throw new RSVP.CancellationError('Explicit cancellation');
      }
      if (method_name === "acquiredStringError") {
        throw "String Error";
      }
      if (method_name === "acquiredManualCancellationError") {
        return new RSVP.Promise(function () {
          return;
        }, function (assert) {
          acquired_method_cancel_called = true;
        });
      }
      if (method_name === "isAcquiredMethodCancelCalled") {
        return acquired_method_cancel_called;
      }
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(46);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture'),
      scope: 'foobar'
    })
      .then(function (sub_gadget) {
        new_gadget = sub_gadget;
        return new RSVP.Queue()

          // Method returns an RSVP.Queue
          .push(function () {
            var result = new_gadget.wasReadyCalled();
            assert.ok(
              result instanceof RSVP.Queue,
              "iframe method should return Queue"
            );
            return result;
          })
/*
          // Check that ready function are called
          .push(function () {
            return new_gadget.wasReadyCalled();
          })
*/
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that state is initialized
          .push(function () {
            return new_gadget.wasStateInitialized();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that state handler is initialized
          .push(function () {
            return new_gadget.wasStateHandlerDeclared();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that state change was not triggered
          .push(function () {
            return new_gadget.wasStateChangeHandled();
          })
          .push(function (result) {
            assert.equal(result, false);
          })

          // Check that change state
          .push(function () {
            return new_gadget.triggerStateChange();
          })
          .push(function () {
            return new_gadget.wasStateChangeHandled();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that job was not started
          .push(function () {
            return new_gadget.wasJobStarted();
          })
          .push(function (result) {
            assert.equal(result, false);
          })

          // Check that job can be triggered
          .push(function () {
            return new_gadget.triggerJob();
          })
          .push(function () {
            return new_gadget.wasJobStarted();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that service are started
          .push(function () {
            return new_gadget.wasServiceStarted();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that event are started
          .push(function () {
            return new_gadget.wasEventStarted();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that service error can be reported
          .push(function () {
            return new_gadget.canReportServiceError();
          })
          .push(function (result) {
            assert.equal(result, true);
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
            assert.equal(result, "foobar");
          })

          // Method are propagated
          .push(function () {
            return new_gadget.triggerError();
          })
          .push(function () {
            assert.ok(false, "triggerError should fail");
          }, function (e) {
            assert.ok(e instanceof renderJS.IframeSerializationError);
            assert.equal(
              e.toString(),
              "IframeSerializationError: Error: " +
                "Manually triggered embedded error"
            );
          })
          .push(function () {
            return new_gadget.triggerStringError();
          })
          .push(function () {
            assert.ok(false, "triggerStringError should fail");
          }, function (e) {
            assert.ok(e instanceof renderJS.IframeSerializationError);
            assert.equal(
              e.toString(),
              "IframeSerializationError: " +
                "Manually triggered embedded error as string"
            );
          })

          // sub_gadget_dict private property is created
          .push(function () {
            return new_gadget.isSubGadgetDictInitialize();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // acquired_method_dict is created on prototype
          .push(function () {
            return new_gadget.isAcquisitionDictInitialize();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // service_list is created on prototype
          .push(function () {
            return new_gadget.isServiceListInitialize();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // acquire check correctly returns result
          .push(function () {
            return new_gadget.callOKAcquire("param1", "param2");
          })
          .push(function (result) {
            assert.ok(acquire_called);
            assert.equal(result, "result correctly fetched from parent");
          })

          // acquire correctly returns error
          .push(function () {
            return new_gadget.callErrorAcquire(
              "acquireMethodRequestedWithAcquisitionError",
              ["param1", "param2"]
            );
          })
          .push(function (result) {
            assert.ok(false, result);
          })
          .push(undefined, function (error) {
            assert.ok(
              error instanceof renderJS.AcquisitionError,
              JSON.stringify(error)
            );
            assert.equal(
              error.toString(),
              "AcquisitionError: Can not handle " +
                "acquireMethodRequestedWithAcquisitionError",
              error
            );
          })

          // cancel is correctly propagated by declareMethod
          .push(function () {
            var method_to_cancel = new_gadget.triggerMethodToCancel();
            return new RSVP.Queue(RSVP.delay(400))
              .push(function () {
                return RSVP.all([
                  method_to_cancel,
                  method_to_cancel.cancel("cancel from triggerMethodToCancel")
                ]);
              });
          })
          .push(undefined, function (error) {
            assert.ok(error instanceof RSVP.CancellationError, error);
            assert.equal(
              error.toString(),
              "cancel: cancel from triggerMethodToCancel"
            );
            return new_gadget.wasMethodCancelCalled();
          })
          .push(function (result) {
            assert.ok(result, 'Embedded method not cancelled ' + result);
          })

          // cancel is correctly propagated by acquiredMethod
          .push(function () {
            return new_gadget.triggerAcquiredMethodToCancel();
          })
          .push(undefined, function (error) {
            assert.ok(error instanceof RSVP.CancellationError,
                      JSON.stringify(error));
            assert.equal(
              error.toString(),
              "cancel: Explicit cancellation"
            );
            return new_gadget.wasAcquiredMethodCancelCalled();
          })
          .push(function (result) {
            assert.ok(result,
                      'Embedded acquired method not cancelled ' + result);
          })
          // cancellation of a acquiredMethod call
          .push(function () {
            var method_to_cancel =
              new_gadget.acquirePromiseToCancel();
            return new RSVP.Queue(RSVP.delay(400))
              .push(function () {
                return RSVP.all([
                  method_to_cancel,
                  method_to_cancel.cancel("cancel from acquirePromiseToCancel")
                ]);
              });
          })
          .push(undefined, function (error) {
            assert.ok(error instanceof RSVP.CancellationError,
                      JSON.stringify(error));
            assert.equal(
              error.toString(),
              "cancel: cancel from acquirePromiseToCancel"
            );
            return new_gadget.wasAcquiredMethodCancelCalledFromParent();
          })
          .push(function (result) {
            assert.ok(result,
                      'Embedded acquired method not cancelled ' + result);
          })
          .push(function () {
            return new_gadget.triggerAcquiredStringError();
          })
          .push(undefined, function (error) {
            assert.ok(
              error instanceof renderJS.IframeSerializationError,
              JSON.stringify(error)
            );
            assert.equal(
              error.toString(),
              "IframeSerializationError: String Error"
            );
          })

          // returning not transferrable object fails
          .push(function () {
            return new_gadget.returnNotTransferrable();
          })
          .push(undefined, function (error) {
            assert.ok(
              error instanceof renderJS.IframeSerializationError,
              JSON.stringify(error)
            );
            assert.equal(
              error.toString(),
              "IframeSerializationError: TypeError: cyclic object value"
            );
          })

          // throw not transferrable object fails
          .push(function () {
            return new_gadget.throwNotTransferrable();
          })
          .push(undefined, function (error) {
            assert.ok(
              error instanceof renderJS.IframeSerializationError,
              JSON.stringify(error)
            );
            assert.equal(
              error.toString(),
              "IframeSerializationError: TypeError: cyclic object value"
            );
          });
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('checking working delayed communication iframe gadget',
       function (assert) {
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
        assert.equal(this, gadget, "Context should be kept");
        if (method_name === "acquireMethodRequested") {
          assert.equal(method_name, "acquireMethodRequested",
            "Method name should be kept");
          assert.deepEqual(argument_list, ["param1", "param2"],
                "Argument list should be kept"
            );
          return "result correctly fetched from parent";
        }
        throw new renderJS.AcquisitionError("Can not handle " + method_name);
      };

      gadget.__sub_gadget_dict = {};

      start = assert.async();
      assert.expect(19);
      gadget.declareGadget(url, {
        sandbox: 'iframe',
        element: document.getElementById('qunit-fixture')
      })
        .then(function (new_gadget) {
          return new RSVP.Queue()

            // Method returns an RSVP.Queue
            .push(function () {
              var result = new_gadget.wasReadyCalled();
              assert.ok(
                result instanceof RSVP.Queue,
                "iframe method should return Queue"
              );
            })

            // Check that ready function are called
            .push(function () {
              return new_gadget.wasReadyCalled();
            })
            .push(function (result) {
              assert.equal(result, true);
            })

            // Check that service are started
            .push(function () {
              return new_gadget.wasServiceStarted();
            })
            .push(function (result) {
              assert.equal(result, true);
            })

            // Check that service error can be reported
            .push(function () {
              return new_gadget.canReportServiceError();
            })
            .push(function (result) {
              assert.equal(result, true);
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
              assert.equal(result, "foobar");
            })

            // Method are propagated
            .push(function () {
              return new_gadget.triggerError();
            })
            .push(function () {
              assert.ok(false, "triggerError should fail");
            }, function (e) {
              assert.ok(e instanceof renderJS.IframeSerializationError);
              assert.equal(
                e.toString(),
                "IframeSerializationError: Error: " +
                  "Manually triggered embedded error"
              );
            })

            // sub_gadget_dict private property is created
            .push(function () {
              return new_gadget.isSubGadgetDictInitialize();
            })
            .push(function (result) {
              assert.equal(result, true);
            })

            // acquired_method_dict is created on prototype
            .push(function () {
              return new_gadget.isAcquisitionDictInitialize();
            })
            .push(function (result) {
              assert.equal(result, true);
            })

            // service_list is created on prototype
            .push(function () {
              return new_gadget.isServiceListInitialize();
            })
            .push(function (result) {
              assert.equal(result, true);
            })

            // acquire check correctly returns result
            .push(function () {
              return new_gadget.callOKAcquire("param1", "param2");
            })
            .push(function (result) {
              assert.ok(acquire_called);
              assert.equal(result, "result correctly fetched from parent");
            })

            // acquire correctly returns error
            .push(function () {
              return new_gadget.callErrorAcquire(
                "acquireMethodRequestedWithAcquisitionError",
                ["param1", "param2"]
              );
            })
            .push(function (result) {
              assert.ok(false, result);
            })
            .push(undefined, function (error) {
              assert.ok(error instanceof renderJS.AcquisitionError);
              assert.equal(
                error.toString(),
                "AcquisitionError: Can not handle " +
                  "acquireMethodRequestedWithAcquisitionError",
                error
              );
              assert.equal(
                error.name,
                "AcquisitionError",
                error
              );
            });
        })
        .fail(function (error) {
          assert.ok(false, error);
        })
        .always(function () {
          start();
          window.removeEventListener("message", readyMessageDelay);
        });
    });

  test('checking working heavy iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      acquire_called = false,
      url = "./embedded_heavy.html";

    gadget.__aq_parent = function (method_name, argument_list) {
      acquire_called = true;
      assert.equal(this, gadget, "Context should be kept");
      if (method_name === "acquireMethodRequested") {
        assert.equal(method_name, "acquireMethodRequested",
          "Method name should be kept");
        assert.deepEqual(argument_list, ["param1", "param2"],
              "Argument list should be kept"
          );
        return "result correctly fetched from parent";
      }
      throw new renderJS.AcquisitionError("Can not handle " + method_name);
    };

    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(19);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        return new RSVP.Queue()

          // Method returns an RSVP.Queue
          .push(function () {
            var result = new_gadget.wasReadyCalled();
            assert.ok(
              result instanceof RSVP.Queue,
              "iframe method should return Queue"
            );
          })

          // Check that ready function are called
          .push(function () {
            return new_gadget.wasReadyCalled();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that service are started
          .push(function () {
            return new_gadget.wasServiceStarted();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // Check that service error can be reported
          .push(function () {
            return new_gadget.canReportServiceError();
          })
          .push(function (result) {
            assert.equal(result, true);
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
            assert.equal(result, "foobar");
          })

          // Method are propagated
          .push(function () {
            return new_gadget.triggerError();
          })
          .push(function () {
            assert.ok(false, "triggerError should fail");
          }, function (e) {
            assert.ok(e instanceof renderJS.IframeSerializationError);
            assert.equal(
              e.toString(),
              "IframeSerializationError: Error: " +
                "Manually triggered embedded error"
            );
          })

          // sub_gadget_dict private property is created
          .push(function () {
            return new_gadget.isSubGadgetDictInitialize();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // acquired_method_dict is created on prototype
          .push(function () {
            return new_gadget.isAcquisitionDictInitialize();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // service_list is created on prototype
          .push(function () {
            return new_gadget.isServiceListInitialize();
          })
          .push(function (result) {
            assert.equal(result, true);
          })

          // acquire check correctly returns result
          .push(function () {
            return new_gadget.callOKAcquire("param1", "param2");
          })
          .push(function (result) {
            assert.ok(acquire_called);
            assert.equal(result, "result correctly fetched from parent");
          })

          // acquire correctly returns error
          .push(function () {
            return new_gadget.callErrorAcquire(
              "acquireMethodRequestedWithAcquisitionError",
              ["param1", "param2"]
            );
          })
          .push(function (result) {
            assert.ok(false, result);
          })
          .push(undefined, function (error) {
            assert.ok(error instanceof renderJS.AcquisitionError, error);
            assert.equal(
              error.toString(),
              "AcquisitionError: Can not handle " +
                "acquireMethodRequestedWithAcquisitionError",
              error
            );
            assert.equal(
              error.name,
              "AcquisitionError",
              error
            );
          });
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('checking failing iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded_fail.html";
    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(1);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (error) {
        assert.equal(error, "Error: Manually rejected");
      })
      .always(function () {
        start();
      });
  });

  test('checking wrong HTML iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded_empty.html";
    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(2);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (error) {
        assert.ok(error instanceof Error);
        assert.equal(error.message,
                     "Timeout while loading: ./embedded_empty.html");
      })
      .always(function () {
        start();
      });
  });

  test('checking 404 html iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded_404.html";
    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(2);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (error) {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Timeout while loading: ./embedded_404.html"
        );
      })
      .always(function () {
        start();
      });
  });

  /*
  test('checking 404 js iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded_404_js.html";
    gadget.__sub_gadget_dict = {};

    start = assert.async();
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (error) {
        assert.deepEqual(error, {});
      })
      .always(function () {
        start();
      });
  });
  */

  test('checking non renderjs iframe gadget', function (assert) {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      url = "./embedded_non_renderjs.html";
    gadget.__sub_gadget_dict = {};

    start = assert.async();
    assert.expect(2);
    gadget.declareGadget(url, {
      sandbox: 'iframe',
      element: document.getElementById('qunit-fixture')
    })
      .then(function (new_gadget) {
        assert.ok(false);
      })
      .fail(function (error) {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Timeout while loading: ./embedded_non_renderjs.html"
        );
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget (dataurl)
  /////////////////////////////////////////////////////////////////
  test('dataurl provide an iframed gadget as callback parameter',
       function (assert) {
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

      start = assert.async();
      assert.expect(3);
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
          assert.equal(new_gadget.__path, data_url);
          assert.ok(new_gadget instanceof RenderJSIframeGadget);
          assert.equal(
            new_gadget.element.innerHTML,
            '<iframe src="' + data_url + '"></iframe>'
          );
        })
        .fail(function (error) {
          assert.ok(false, error);
        })
        .always(function () {
          start();
        });
    });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getDeclaredGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getDeclaredGadget", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns value from sub_gadget_dict attribute', function (assert) {
    // Check that getDeclaredGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {foo: "bar"};
    start = assert.async();
    assert.expect(1);
    gadget.getDeclaredGadget("foo")
      .then(function (result) {
        assert.equal(result, "bar");
      })
      .always(function () {
        start();
      });
  });

  test('throw an error if scope is unknown', function (assert) {
    // Check that getDeclaredGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {};
    start = assert.async();
    assert.expect(2);
    gadget.getDeclaredGadget("foo")
      .then(function () {
        assert.ok(false, "getDeclaredGadget should fail");
      })
      .fail(function (e) {
        assert.ok(e instanceof rJS.ScopeError);
        assert.equal(e.message, "Gadget scope 'foo' is not known.");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.dropGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.dropGadget", {
    beforeEach: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns value from sub_gadget_dict attribute', function (assert) {
    // Check that dropGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {foo: "bar"};
    start = assert.async();
    assert.expect(2);
    gadget.dropGadget("foo")
      .then(function (result) {
        assert.equal(result, undefined);
        assert.equal(JSON.stringify(gadget.__sub_gadget_dict), "{}");
      })
      .always(function () {
        start();
      });
  });

  test('throw an error if scope is unknown', function (assert) {
    // Check that dropGadget return a Promise
    var gadget = new RenderJSGadget();
    gadget.__sub_gadget_dict = {};
    start = assert.async();
    assert.expect(2);
    gadget.dropGadget("foo")
      .then(function () {
        assert.ok(false, "dropGadget should fail");
      })
      .fail(function (e) {
        assert.ok(e instanceof rJS.ScopeError);
        assert.equal(e.message, "Gadget scope 'foo' is not known.");
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
//     beforeEach: function () {
//       renderJS.clearGadgetKlassList();
//     }
//   });

  test('Check that the root gadget is cleanly implemented', function (assert) {
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

    start = assert.async();
    assert.expect(28);
    root_gadget_defer.promise
      .then(function (root_gadget_list) {
        var root_gadget = root_gadget_list[0],
          html;
        // Check instance
        assert.equal(root_gadget_list[0], root_gadget_list[1],
              "Context should be the gadget instance");
        assert.equal(root_gadget.__path,
              root_gadget_path_without_hash);
        assert.equal(typeof root_gadget.__acquired_method_dict, 'object');
        assert.equal(root_gadget.__title, document.title);
        assert.deepEqual(root_gadget.__interface_list, []);
        assert.deepEqual(root_gadget.__required_css_list,
          [URI("../node_modules/qunit/qunit/qunit.css")
            .absoluteTo(parent_path).toString()]);
        assert.deepEqual(root_gadget.__required_js_list, [
          URI("../node_modules/rsvp/dist/rsvp-2.0.4.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/qunit/qunit/qunit.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/sinon/pkg/sinon.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/nise/nise.js")
            .absoluteTo(parent_path).toString(),
          URI("../node_modules/urijs/src/URI.js")
            .absoluteTo(parent_path).toString(),
          URI("../dist/renderjs-latest.js")
            .absoluteTo(parent_path).toString(),
          URI("renderjs_test.js")
            .absoluteTo(parent_path).toString(),
          URI("mutex_test.js")
            .absoluteTo(parent_path).toString()
        ]);
        assert.equal(root_gadget.element.outerHTML, document.body.outerHTML);
        // Check klass
        assert.equal(root_gadget.constructor.prototype.__path,
              root_gadget_path_without_hash);
        assert.equal(root_gadget.constructor.prototype.__title,
                     document.title);
        assert.deepEqual(root_gadget.constructor.prototype.__interface_list,
                         []);
        assert.deepEqual(root_gadget.constructor.prototype.__required_css_list,
          [URI("../node_modules/qunit/qunit/qunit.css")
            .absoluteTo(parent_path).toString()]);
        assert.deepEqual(
          root_gadget.constructor.prototype.__required_js_list,
          [
            URI("../node_modules/rsvp/dist/rsvp-2.0.4.js")
              .absoluteTo(parent_path).toString(),
            URI("../node_modules/qunit/qunit/qunit.js")
              .absoluteTo(parent_path).toString(),
            URI("../node_modules/sinon/pkg/sinon.js")
              .absoluteTo(parent_path).toString(),
            URI("../node_modules/nise/nise.js")
              .absoluteTo(parent_path).toString(),
            URI("../node_modules/urijs/src/URI.js")
              .absoluteTo(parent_path).toString(),
            URI("../dist/renderjs-latest.js")
              .absoluteTo(parent_path).toString(),
            URI("renderjs_test.js")
              .absoluteTo(parent_path).toString(),
            URI("mutex_test.js")
              .absoluteTo(parent_path).toString()
          ]
        );
        html = root_gadget.constructor.__template_element.outerHTML;
        assert.ok(/^<div>\s*<div id="qunit">/.test(html), html);
        html = root_gadget.constructor.__template_element
                          .querySelector('#check-relative-url');
        // relative url are not modified on the root gadget
        assert.equal(html.getAttribute('href'), 'one');
        assert.equal(html.getAttribute('src'), 'two');
        assert.equal(html.getAttribute('srcset'), 'three');
        assert.ok(root_gadget instanceof RenderJSGadget);
        assert.ok(root_gadget_klass, root_gadget.constructor);
        assert.ok(root_gadget.__aq_parent !== undefined);
        assert.ok(root_gadget.hasOwnProperty("__sub_gadget_dict"));
        assert.deepEqual(root_gadget.__sub_gadget_dict, {});
        assert.deepEqual(root_gadget_klass.__service_list, []);
        assert.deepEqual(root_gadget.__job_list, []);

        return new RSVP.Queue()
          .push(function () {
            return root_gadget.declareGadget("./embedded.html", {
              sandbox: 'iframe',
              element: document.querySelector('#qunit-fixture')
            });
          })
          .push(function () {
            return RSVP.all([
              root_gadget.getMethodList(),
              root_gadget.getMethodList('method'),
              root_gadget.getMethodList('job'),
              root_gadget.getMethodList('acquired_method')
            ]);
          })
          .push(function (result_list) {
            assert.deepEqual(result_list[0], [
              'fakeRootMethod1', 'fakeRootMethod2',
              'fakeRootJob1', 'fakeRootJob2',
              'fakeRootAcquiredMethod1']);
            assert.deepEqual(result_list[1],
                             ['fakeRootMethod1', 'fakeRootMethod2']);
            assert.deepEqual(result_list[2],
                             ['fakeRootJob1', 'fakeRootJob2']);
            assert.deepEqual(result_list[3],
                             ['fakeRootAcquiredMethod1']);
          })
          .fail(function (e) {
            assert.ok(false, e);
          });
      })
      .fail(function (e) {
        assert.ok(false, e);
      })
      .always(function () {
        start();
      });
  });

  test('__aq_parent fails on the root gadget', function (assert) {
    start = assert.async();
    assert.expect(2);
    root_gadget_defer.promise
      .then(function (root_gadget_list) {
        return root_gadget_list[0].__aq_parent("foo", "bar");
      })
      .fail(function (error) {
        assert.ok(error instanceof renderJS.AcquisitionError);
        assert.equal(error.message, "No gadget provides foo");
      })
      .always(function () {
        start();
      });
  });

  test('check working of parent gadget in iframe', function (assert) {
    var fixture = document.getElementById("qunit-fixture");
    fixture.innerHTML =
      "<iframe id=renderjsIframe src='./not_declared_gadget.html'></iframe>";
    start = assert.async();
    assert.expect(2);
    return RSVP.delay(1500)
      .then(function () {
        var iframe = document.getElementById('renderjsIframe'),
          acquisition_div = iframe.contentWindow.
            document.querySelector('.acquisitionError'),
          klass_div = iframe.contentWindow.document.querySelector('.klass');
        assert.equal(acquisition_div.innerHTML,
              "AcquisitionError: No gadget provides willFail");
        assert.equal(klass_div.innerHTML,
              "klass = embedded");
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('check page unload', function (assert) {
    var fixture = document.getElementById("qunit-fixture"),
      iframe,
      loop_queue;

    fixture.innerHTML =
      "<iframe id=renderjsIframe src='./unload_gadget.html'></iframe>";
    iframe = document.getElementById('renderjsIframe');
    start = assert.async();
    assert.expect(1);

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
      if (iframe_text.indexOf('Page changed') !== -1) {
        // Final page
        assert.ok(true, iframe_text);
      } else if (iframe_text.indexOf('Next page') === -1) {
        // Not the original text content. Probably the error message.
        assert.ok(false, iframe_text);
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
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('check page error', function (assert) {
    var fixture = document.getElementById("qunit-fixture"),
      iframe;

    fixture.innerHTML =
      "<iframe id=renderjsIframe src='./error_gadget.html'></iframe>";
    iframe = document.getElementById('renderjsIframe');
    start = assert.async();
    assert.expect(3);

    return new RSVP.Promise(function (resolve, reject) {
      iframe.addEventListener("load", function (evt) {
        resolve(evt.target.result);
      });
    })
      .then(function () {
        return RSVP.delay(1100);
      })
      .then(function () {
        var iframe_body = iframe.contentWindow.document.body,
          iframe_text = iframe_body.textContent;
        assert.ok(iframe_text.indexOf('SyntaxError') !== -1, iframe_text);
        assert.ok(iframe_text.indexOf('getFoo') !== -1, iframe_text);
        assert.ok(iframe_text.indexOf('error_gadget.html') !== -1,
                  iframe_text);
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

  test('check manual bootstrap', function (assert) {
    var fixture = document.getElementById("qunit-fixture"),
      iframe;
    // The iframe for an isolated renderjs-free environment
    // to test the manual inject
    fixture.innerHTML = "<iframe id=renderjsIsolatedIframe " +
      "src='./inject_script.html'></iframe>";
    iframe = document.getElementById("renderjsIsolatedIframe");
    start = assert.async();
    assert.expect(3);

    return new RSVP.Promise(function (resolve, reject) {
      iframe.addEventListener("load", function (e) {
        resolve(e.target.result);
      });
    })
      .then(function () {
        assert.ok(
          !iframe.contentWindow.hasOwnProperty("renderJS"),
          "RJS NOT available before inject"
        );
        return new RSVP.Promise(function (resolve, reject) {
          iframe.contentWindow.inject_script(
            "../node_modules/rsvp/dist/rsvp-2.0.4.js",
            resolve
          );
        });
      })
      .then(function () {
        return new RSVP.Promise(function (resolve, reject) {
          iframe.contentWindow.inject_script(
            "../dist/renderjs-latest.js",
            resolve
          );
        });
      })
      .then(function () {
        assert.ok(
          iframe.contentWindow.hasOwnProperty("renderJS"),
          "RJS available after inject"
        );
      })
      .then(function () {
        // create parentGadget in iframe, then initialize RJS
        var parentDiv = iframe.contentDocument.createElement("div");
        parentDiv.setAttribute(
          "data-gadget-url",
          "./trigger_rjsready_event_on_ready_gadget.html"
        );
        iframe.contentDocument.body.appendChild(parentDiv);
        return new RSVP.Promise(function (resolve, reject) {
          // listen for an event fired in the ready function of the parent
          // gadget
          parentDiv.parentNode.addEventListener("rjsready", function (e) {
            resolve();
          });
          // if no event is fired within 500ms, just resolve and fail later
          window.setTimeout(function () {
            reject("Timeout, RenderJS is not Ready");
          }, 3000);
          iframe.contentWindow.rJS.manualBootstrap();
        });
      })
      .then(function () {
        assert.ok(true, "RJS correctly bootstrapped and parent is ready");
      })
      .fail(function (error) {
        assert.ok(false, error);
      })
      .always(function () {
        start();
      });
  });

}(document, renderJS, QUnit, sinon, nise, URI, URL, Event,
  MutationObserver, RSVP));
