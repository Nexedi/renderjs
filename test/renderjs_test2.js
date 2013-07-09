/*global window, document, QUnit, jQuery, renderJS, RenderJSGadget, sinon */
/*jslint indent: 2, maxerr: 3, maxlen: 79 */
"use strict";

(function (document, $, renderJS, QUnit, sinon) {
  var test = QUnit.test,
    stop = QUnit.stop,
    start = QUnit.start,
    ok = QUnit.ok,
    equal = QUnit.equal,
    expect = QUnit.expect,
    throws = QUnit.throws,
    deepEqual = QUnit.deepEqual;

  /////////////////////////////////////////////////////////////////
  // parseGadgetHTML
  /////////////////////////////////////////////////////////////////
  module("renderJS.parseGadgetHTML");
  test('Not valid HTML string', function () {
    // Check that parseGadgetHTML throws an error if the string is
    // not a valid xml
    throws(function () {
      renderJS.parseGadgetHTML("<ht");
    });
  });

  test('Not string', function () {
    // Check that parseGadgetHTML throws an error if the parameter is not a
    // string
    throws(function () {
      renderJS.parseGadgetHTML({});
    });
  });

  test('Default result value', function () {
    // Check default value returned by parseGadgetHTML
    deepEqual(renderJS.parseGadgetHTML(""), {
      title: "",
      interface_list: [],
      required_css_list: [],
      required_js_list: [],
      html: "",
    });
  });

  test('Extract title', function () {
    // Check that parseGadgetHTML correctly extract the title
    var settings,
      html = "<html>" +
        "<head>" +
        "<title>Great title</title>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.title, 'Great title', 'Title extracted');
  });

  test('Extract only one title', function () {
    // Check that parseGadgetHTML correctly extract the first title
    var settings,
      html = "<html>" +
        "<head>" +
        "<title>Great title</title>" +
        "<title>Great title 2</title>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.title, 'Great title', 'First title extracted');
  });

  test('Extract title only from head', function () {
    // Check that parseGadgetHTML only extract title from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<title>Great title</title>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.title, '', 'Title not found');
  });

  test('Extract body', function () {
    // Check that parseGadgetHTML correctly extract the body
    var settings,
      html = "<html>" +
        "<body>" +
        "<p>Foo</p>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.html, "<p>Foo</p>", "HTML extracted");
  });

  test('Extract only one body', function () {
    // Check that parseGadgetHTML correctly extract the first title
    var settings,
      html = "<html>" +
        "<body>" +
        "<p>Foo</p>" +
        "</body><body>" +
        "<p>Bar</p>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.html, '<p>Foo</p>', 'First body extracted');
  });

  test('Extract body only from html', function () {
    // Check that parseGadgetHTML only extract title from html
    var settings,
      html = "<html>" +
        "<head><body><p>Bar</p></body></head>" +
        "</html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.html, "", "Body not found");
  });

  test('Extract CSS', function () {
    // Check that parseGadgetHTML correctly extract the CSS
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.required_css_list,
              ['../lib/qunit/qunit.css'],
              "CSS extracted");
  });

  test('Extract CSS order', function () {
    // Check that parseGadgetHTML correctly keep CSS order
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit2.css' " +
        "type='text/css'/>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.required_css_list,
              ['../lib/qunit/qunit.css', '../lib/qunit/qunit2.css'],
              "CSS order kept");
  });

  test('Extract CSS only from head', function () {
    // Check that parseGadgetHTML only extract css from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<link rel='stylesheet' href='../lib/qunit/qunit.css' " +
        "type='text/css'/>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.required_css_list, [], "CSS not found");
  });

  test('Extract interface', function () {
    // Check that parseGadgetHTML correctly extract the interface
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.interface_list,
              ['./interface/renderable'],
              "interface extracted");
  });

  test('Extract interface order', function () {
    // Check that parseGadgetHTML correctly keep interface order
    var settings,
      html = "<html>" +
        "<head>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/field'/>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.interface_list,
              ['./interface/renderable',
               './interface/field'],
              "interface order kept");
  });

  test('Extract interface only from head', function () {
    // Check that parseGadgetHTML only extract interface from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<link rel='http://www.renderjs.org/rel/interface'" +
        "      href='./interface/renderable'/>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.interface_list, [], "interface not found");
  });

  test('Extract JS', function () {
    // Check that parseGadgetHTML correctly extract the JS
    var settings,
      html = "<html>" +
        "<head>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.required_js_list,
              ['../lib/qunit/qunit.js'],
              "JS extracted");
  });

  test('Extract JS order', function () {
    // Check that parseGadgetHTML correctly keep JS order
    var settings,
      html = "<html>" +
        "<head>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "<script src='../lib/qunit/qunit2.js' " +
        "type='text/javascript'></script>" +
        "</head></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.required_js_list,
              ['../lib/qunit/qunit.js', '../lib/qunit/qunit2.js'],
              "JS order kept");
  });

  test('Extract JS only from head', function () {
    // Check that parseGadgetHTML only extract js from head
    var settings,
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    deepEqual(settings.required_js_list, [], "JS not found");
  });

  test('Non valid XML (HTML in fact...)', function () {
    // Check default value returned by parseGadgetHTML
    deepEqual(renderJS.parseGadgetHTML('<!doctype html><html><head>' +
      '<title>Test non valid XML</title>' +
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
      '</head><body><p>Non valid XML</p></body></html>'), {
      title: "Test non valid XML",
      interface_list: [],
      required_css_list: [],
      required_js_list: [],
      html: "<p>Non valid XML</p>",
    });
  });

  /////////////////////////////////////////////////////////////////
  // declareGadgetKlass
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareGadgetKlass");
  test('Ajax error reject the promise', function () {
    // Check that declareGadgetKlass fails if ajax fails
    renderJS.clearGadgetKlassList();

    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test';
    server.autoRespond = true;
    server.autoRespondAfter = 1;

    server.respondWith("GET", url, [404, {
      "Content-Type": "text/html",
    }, "foo"]);

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function () {
        ok(false, "404 should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal("404", jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('Non HTML reject the promise', function () {
    // Check that declareGadgetKlass fails if non html is retrieved
    renderJS.clearGadgetKlassList();

    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test';
    server.autoRespond = true;
    server.autoRespondAfter = 1;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/plain",
    }, "foo"]);

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function () {
        ok(false, "text/plain should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal("200", jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('HTML parsing failure reject the promise', function () {
    // Check that declareGadgetKlass fails if the html can not be parsed
    renderJS.clearGadgetKlassList();

    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;
    server.autoRespond = true;
    server.autoRespondAfter = 1;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, ""]);

    mock = sinon.mock(renderJS, "parseGadgetHTML", function () {
      throw new Error();
    });
    mock.expects("parseGadgetHTML").once().throws();

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function () {
        ok(false, "text/plain should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal("200", jqXHR.status);
      })
      .always(function () {
        mock.verify();
        start();
        mock.restore();
      });
  });

  test('Klass creation', function () {
    // Check that declareGadgetKlass returns a subclass of RenderJSGadget
    // and contains all extracted properties on the prototype
    renderJS.clearGadgetKlassList();

    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;
    server.autoRespond = true;
    server.autoRespondAfter = 1;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, "foo"]);

    mock = sinon.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("foo").returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function (Klass) {
        var instance;

        equal(Klass.prototype.path, url);
        equal(Klass.prototype.foo, 'bar');

        instance = new Klass();
        ok(instance instanceof RenderJSGadget);
        ok(instance instanceof Klass);
        ok(Klass !== RenderJSGadget);
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        mock.verify();
        start();
        mock.restore();
      });
  });

  test('Klass is not reloaded if called twice', function () {
    // Check that declareGadgetKlass does not reload the gadget
    // if it has already been loaded
    renderJS.clearGadgetKlassList();

    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;
    server.autoRespond = true;
    server.autoRespondAfter = 1;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, "foo"]);

    mock = sinon.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("foo").returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function (Klass1) {
        var spy;

        mock.restore();
        server.restore();
        spy = sinon.spy($, "ajax");

        renderJS.declareGadgetKlass(url)
          .done(function (Klass2) {

            equal(Klass1, Klass2);
            ok(!spy.called);
          })
          .fail(function (jqXHR, textStatus) {
            ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
          })
          .always(function () {
            start();
            spy.restore();
          });

      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // declareJS
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareJS");
  test('Ajax error reject the promise', function () {
    // Check that declareJS fails if ajax fails
    renderJS.clearGadgetKlassList();

    var url = 'foo://bar';

    stop();
    renderJS.declareJS(url)
      .done(function () {
        ok(false, "404 should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal("404", jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('Non JS reject the promise', function () {
    // Check that declareJS fails if mime type is wrong
    renderJS.clearGadgetKlassList();

    var url = "data:image/png;base64," +
         window.btoa("= = =");

    stop();
    renderJS.declareJS(url)
      .done(function (value, textStatus, jqXHR) {
        ok(true, "Non JS mime type should load");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('JS cleanly loaded', function () {
    // Check that declareJS is fetched and loaded
    renderJS.clearGadgetKlassList();

    var url = "data:application/javascript;base64," +
         window.btoa("$('#qunit-fixture').text('JS fetched and loaded');");

    stop();
    renderJS.declareJS(url)
      .done(function () {
        equal($("#qunit-fixture").text(), "JS fetched and loaded");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('JS with errors cleanly loaded', function () {
    // Check that declareJS is fetched and loaded even if JS contains an error
    renderJS.clearGadgetKlassList();

    var url = "data:application/javascript;base64," +
         window.btoa("throw new Error('foo');");

    stop();
    renderJS.declareJS(url)
      .done(function () {
        ok(true, "JS with error cleanly loaded");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('JS is not fetched twice', function () {
    // Check that declareJS does not load the JS twice
    renderJS.clearGadgetKlassList();

    var url = "data:application/javascript;base64," +
         window.btoa("$('#qunit-fixture').text('JS not fetched twice');");

    stop();
    renderJS.declareJS(url)
      .done(function () {
        equal($("#qunit-fixture").text(), "JS not fetched twice");
        $("#qunit-fixture").text("");
        renderJS.declareJS(url)
          .done(function () {
            equal($("#qunit-fixture").text(), "");
          })
          .fail(function (jqXHR, textStatus) {
            ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
          })
          .always(function () {
            start();
          });
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // declareCSS
  /////////////////////////////////////////////////////////////////
  module("renderJS.declareCSS");
  test('Ajax error reject the promise', function () {
    // Check that declareCSS fails if ajax fails
    renderJS.clearGadgetKlassList();

    var url = 'foo://bar';

    stop();
    renderJS.declareCSS(url)
      .done(function () {
        ok(false, "404 should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal("404", jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('Non CSS reject the promise', function () {
    // Check that declareCSS fails if mime type is wrong
    renderJS.clearGadgetKlassList();

    var url = "data:image/png;base64," +
         window.btoa("= = =");

    stop();
    renderJS.declareCSS(url)
      .done(function (value, textStatus, jqXHR) {
        ok(true, "Non CSS mime type should load");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('CSS cleanly loaded', function () {
    // Check that declareCSS is fetched and loaded
    renderJS.clearGadgetKlassList();

    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: red;}");

    stop();
    renderJS.declareCSS(url)
      .done(function () {
        var found = false;
        $('head').find('link[rel=stylesheet]').each(function (i, style) {
          if (style.href === url) {
            found = true;
          }
        });
        ok(found, "CSS in the head");
        equal($("#qunit-fixture").css("background-color"), "rgb(255, 0, 0)");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('CSS with errors cleanly loaded', function () {
    // Check that declareCSS is fetched and
    // loaded even if CSS contains an error
    renderJS.clearGadgetKlassList();

    var url = "data:application/javascript;base64," +
         window.btoa("throw new Error('foo');");

    stop();
    renderJS.declareCSS(url)
      .done(function () {
        ok(true, "CSS with error cleanly loaded");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        start();
      });
  });

  test('CSS is not fetched twice', function () {
    // Check that declareCSS does not load the CSS twice
    renderJS.clearGadgetKlassList();

    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: blue;}");

    stop();
    renderJS.declareCSS(url)
      .done(function () {
        equal($("#qunit-fixture").css("background-color"), "rgb(0, 0, 255)");
        $('head').find('link[rel=stylesheet]').each(function (i, style) {
          if (style.href === url) {
            $(style).remove();
          }
        });
        ok($("#qunit-fixture").css("background-color") !== "rgb(0, 0, 255)");

        renderJS.declareCSS(url)
          .done(function () {
            var found = false;
            $('head').find('link[rel=stylesheet]').each(function (i, style) {
              if (style.href === url) {
                found = true;
              }
            });
            ok($("#qunit-fixture").css("background-color") !==
               "rgb(0, 0, 255)", $("#qunit-fixture").css("background-color"));
            ok(!found);
          })
          .fail(function (jqXHR, textStatus) {
            ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
          })
          .always(function () {
            start();
          });
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // clearGadgetKlassList
  /////////////////////////////////////////////////////////////////
  module("renderJS.clearGadgetKlassList");
  test('clearGadgetKlassList leads to gadget reload', function () {
    // Check that declareGadgetKlass reload the gadget
    // after clearGadgetKlassList is called
    renderJS.clearGadgetKlassList();

    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;
    server.autoRespond = true;
    server.autoRespondAfter = 1;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, "foo"]);

    mock = sinon.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("foo").returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function (Klass1) {

        mock.restore();
        renderJS.clearGadgetKlassList();
        mock = sinon.mock(renderJS, "parseGadgetHTML");
        mock.expects("parseGadgetHTML").once().withArgs("foo").returns(
          {foo: 'bar'}
        );

        renderJS.declareGadgetKlass(url)
          .done(function (Klass2) {
            mock.verify();
            ok(Klass1 !== Klass2);
          })
          .fail(function (jqXHR, textStatus) {
            ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
          })
          .always(function () {
            start();
            server.restore();
          });

      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getInterfaceList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getInterfaceList");
  test('returns interface_list', function () {
    // Check that getInterfaceList return a Promise
    var gadget = new RenderJSGadget();
    gadget.interface_list = "foo";
    stop();
    gadget.getInterfaceList()
      .done(function (result) {
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
      .done(function (result) {
        deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getRequiredCSSList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getRequiredCSSList");
  test('returns interface_list', function () {
    // Check that getRequiredCSSList return a Promise
    var gadget = new RenderJSGadget();
    gadget.required_css_list = "foo";
    stop();
    gadget.getRequiredCSSList()
      .done(function (result) {
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
      .done(function (result) {
        deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getRequiredJSList
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getRequiredJSList");
  test('returns interface_list', function () {
    // Check that getRequiredJSList return a Promise
    var gadget = new RenderJSGadget();
    gadget.required_js_list = "foo";
    stop();
    gadget.getRequiredJSList()
      .done(function (result) {
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
      .done(function (result) {
        deepEqual(result, []);
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getPath
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getPath");
  test('returns path', function () {
    // Check that getPath return a Promise
    var gadget = new RenderJSGadget();
    gadget.path = "foo";
    stop();
    gadget.getPath()
      .done(function (result) {
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
      .done(function (result) {
        equal(result, "");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getTitle
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getTitle");
  test('returns title', function () {
    // Check that getTitle return a Promise
    var gadget = new RenderJSGadget();
    gadget.title = "foo";
    stop();
    gadget.getTitle()
      .done(function (result) {
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
      .done(function (result) {
        equal(result, "");
      })
      .always(function () {
        start();
      });
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.getHTML
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.getHTML");
  test('returns html', function () {
    // Check that getHTML return a Promise
    var gadget = new RenderJSGadget();
    gadget.html = "foo";
    stop();
    gadget.getHTML()
      .done(function (result) {
        equal(result, "foo");
      })
      .always(function () {
        start();
      });
  });

  test('default value', function () {
    // Check that getHTML return a Promise
    var gadget = new RenderJSGadget();
    stop();
    gadget.getHTML()
      .done(function (result) {
        equal(result, "");
      })
      .always(function () {
        start();
      });
  });

}(document, jQuery, renderJS, QUnit, sinon));
