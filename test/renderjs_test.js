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
  module("renderJS.parseGadgetHTML", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('Not valid HTML string', function () {
    // Check that parseGadgetHTML returns the default value if the string is
    // not a valid xml
    deepEqual(renderJS.parseGadgetHTML(""), {
      title: "",
      interface_list: [],
      required_css_list: [],
      required_js_list: [],
      html: "",
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

  test('Extract all body', function () {
    // Check that parseGadgetHTML correctly extracts all bodies
    var settings,
      html = "<html>" +
        "<body>" +
        "<p>Foo</p>" +
        "</body><body>" +
        "<p>Bar</p>" +
        "</body></html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.html, '<p>Foo</p><p>Bar</p>', 'All bodies extracted');
  });

  test('Extract body only from html', function () {
    // Check that parseGadgetHTML also extract body from head
    var settings,
      html = "<html>" +
        "<head><body><p>Bar</p></body></head>" +
        "</html>";

    settings = renderJS.parseGadgetHTML(html);
    equal(settings.html, "<p>Bar</p>", "Body not found");
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
  module("renderJS.declareGadgetKlass", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('Ajax error reject the promise', function () {
    // Check that declareGadgetKlass fails if ajax fails
    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test';

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
    server.respond();
  });

  test('Non HTML reject the promise', function () {
    // Check that declareGadgetKlass fails if non html is retrieved
    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test';

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/plain",
    }, "foo"]);

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function () {
        ok(false, "text/plain should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal(jqXHR.status, "200");
        equal(textStatus, "Unexpected content type");
        equal(jqXHR.getResponseHeader("Content-Type"), "text/plain");
      })
      .always(function () {
        start();
      });
    server.respond();
  });

  test('HTML parsing failure reject the promise', function () {
    // Check that declareGadgetKlass fails if the html can not be parsed
    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, ""]);

    mock = this.mock(renderJS, "parseGadgetHTML", function () {
      throw new Error();
    });
    mock.expects("parseGadgetHTML").once().throws();

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function () {
        ok(false, "Non parsable HTML should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal("200", jqXHR.status);
        equal(textStatus, "HTML Parsing failed");
      })
      .always(function () {
        mock.verify();
        start();
      });
    server.respond();
  });

  test('Klass creation', function () {
    // Check that declareGadgetKlass returns a subclass of RenderJSGadget
    // and contains all extracted properties on the prototype
    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, "foo"]);

    mock = this.mock(renderJS, "parseGadgetHTML");
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
      });
    server.respond();
  });

  test('Klass is not reloaded if called twice', function () {
    // Check that declareGadgetKlass does not reload the gadget
    // if it has already been loaded
    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, "foo"]);

    mock = this.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("foo").returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function (Klass1) {
        renderJS.declareGadgetKlass(url)
          .done(function (Klass2) {
            equal(Klass1, Klass2);
          })
          .fail(function (jqXHR, textStatus) {
            ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
          })
          .always(function () {
            start();
            mock.verify();
          });

      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
        start();
      });
    server.respond();
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
    var url = 'foo://bar';

    stop();
    renderJS.declareJS(url)
      .done(function () {
        ok(false, "404 should fail");
      })
      .fail(function (jqXHR, textStatus) {
        equal(jqXHR.status, "404");
      })
      .always(function () {
        start();
      });
  });

  test('Ajax error reject the promise twice', function () {
    // Check that failed declareJS is not cached
    var url = 'foo://bar';

    stop();
    renderJS.declareJS(url)
      .always(function () {
        renderJS.declareJS(url)
          .done(function () {
            ok(false, "404 should fail");
          })
          .fail(function (jqXHR, textStatus) {
            equal(jqXHR.status, "404");
          })
          .always(function () {
            start();
          });
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
      .done(function (value, textStatus, jqXHR) {
        ok(ok, "Non JS mime type should load");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        window.onerror = previousonerror;
        start();
      });
  });

  test('JS cleanly loaded', function () {
    // Check that declareJS is fetched and loaded
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
    var url = "data:application/javascript;base64," +
         window.btoa("= var var var a a a"),
      previousonerror = window.onerror;

    stop();
    window.onerror = undefined;
    renderJS.declareJS(url)
      .done(function (aaa) {
        ok(true, "JS with error cleanly loaded");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
      })
      .always(function () {
        window.onerror = previousonerror;
        start();
      });
  });

  test('JS is not fetched twice', function () {
    // Check that declareJS does not load the JS twice
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
  module("renderJS.declareCSS", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('Ajax error resolve the promise', function () {
    // Check that declareCSS is resolved if ajax fails
    var url = 'foo://bar';

    expect(1);
    stop();
    renderJS.declareCSS(url)
      .done(function () {
        ok(true, "404 should fail");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false);
      })
      .always(function () {
        start();
      });
  });

  test('Non CSS resolve the promise', function () {
    // Check that declareCSS is resolved if mime type is wrong
    var url = "data:image/png;base64," +
         window.btoa("= = =");

    stop();
    renderJS.declareCSS(url)
      .done(function (value, textStatus, jqXHR) {
        ok(true, "Non CSS mime type should load");
      })
      .fail(function (jqXHR, textStatus) {
        ok(false);
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
  module("renderJS.clearGadgetKlassList", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });

  test('clearGadgetKlassList leads to gadget reload', function () {
    // Check that declareGadgetKlass reload the gadget
    // after clearGadgetKlassList is called
    var server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      mock;

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, "foo"]);

    mock = this.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").twice().withArgs("foo").returns(
      {foo: 'bar'}
    );

    stop();
    renderJS.declareGadgetKlass(url)
      .done(function (Klass1) {

        renderJS.clearGadgetKlassList();

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
          });

      })
      .fail(function (jqXHR, textStatus) {
        ok(false, "Failed to load " + textStatus + " " + jqXHR.status);
        start();
      });
    server.respond();
  });

  test('clearGadgetKlassList leads to JS reload', function () {
    // Check that declareJS reload the JS
    // after clearGadgetKlassList is called
    var url = "data:application/javascript;base64," +
         window.btoa("$('#qunit-fixture').text('JS not fetched twice');");

    stop();
    renderJS.declareJS(url)
      .done(function () {
        renderJS.clearGadgetKlassList();
        equal($("#qunit-fixture").text(), "JS not fetched twice");
        $("#qunit-fixture").text("");
        renderJS.declareJS(url)
          .done(function () {
            equal($("#qunit-fixture").text(), "JS not fetched twice");
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

  test('clearGadgetKlassList leads to CSS reload', function () {
    // Check that declareCSS reload the CSS
    // after clearGadgetKlassList is called
    var url = "data:text/css;base64," +
         window.btoa("#qunit-fixture {background-color: blue;}"),
      count = $('head').find('link[rel=stylesheet]').length;

    stop();
    renderJS.declareCSS(url)
      .done(function () {
        renderJS.clearGadgetKlassList();
        equal($('head').find('link[rel=stylesheet]').length, count + 1);
        renderJS.declareCSS(url)
          .done(function () {
            equal($('head').find('link[rel=stylesheet]').length, count + 2);
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
  module("RenderJSGadget.getHTML", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
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
      var a;
    });
    // declareMethod is chainable
    equal(result, Klass);
  });

  test('creates methods on the prototype', function () {
    // Check that declareMethod create a callable on the prototype

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, called, result;
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

    // method can be called
    gadget.testFoo("Bar");
    equal(called, "Bar");
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
      .done(function (param) {
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
      var dfr = $.Deferred();
      setTimeout(function () {
        dfr.reject(value);
      });
      return dfr.promise();
    });

    // method can be called
    stop();
    gadget.testFoo("Bar")
      .done(function () {
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
    }, gadget, result;
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.ready_list = [];
    Klass.ready = RenderJSGadget.ready;

    gadget = new Klass();
    result = Klass.ready(function () {
      var a;
    });
    // ready is chainable
    equal(result, Klass);
  });

  test('store callback in the ready_list property', function () {
    // Check that ready is chainable

    // Subclass RenderJSGadget to not pollute its namespace
    var Klass = function () {
      RenderJSGadget.call(this);
    }, gadget, result,
      callback = function () {var a; };
    Klass.prototype = new RenderJSGadget();
    Klass.prototype.constructor = Klass;
    Klass.ready_list = [];
    Klass.ready = RenderJSGadget.ready;

    gadget = new Klass();
    Klass.ready(callback);
    // ready is chainable
    deepEqual(Klass.ready_list, [callback]);
  });

  /////////////////////////////////////////////////////////////////
  // RenderJSGadget.declareGadget
  /////////////////////////////////////////////////////////////////
  module("RenderJSGadget.declareGadget", {
    setup: function () {
      renderJS.clearGadgetKlassList();
    }
  });
  test('returns a Promise', function () {
    // Check that declareGadget return a Promise
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, html]);

    stop();
    gadget.declareGadget(url, $('#qunit-fixture'))
      .always(function () {
        ok(true);
        start();
      });
    server.respond();
  });

  test('provide a gadget instance as callback parameter', function () {
    // Check that declare gadget returns the gadget
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      url = 'https://example.org/files/qunittest/test',
      html = "<html>" +
        "<body>" +
        "<script src='../lib/qunit/qunit.js' " +
        "type='text/javascript'></script>" +
        "</body></html>";

    server.respondWith("GET", url, [200, {
      "Content-Type": "text/html",
    }, html]);

    stop();
    gadget.declareGadget(url, $('#qunit-fixture'))
      .done(function (new_gadget) {
        equal(new_gadget.path, url);
      })
      .always(function () {
        start();
      });
    server.respond();
  });

//   test('no parameter', function () {
//     // Check that missing url reject the declaration
//     var gadget = new RenderJSGadget();
//     stop();
//     gadget.declareGadget()
//       .fail(function () {
//         ok(true);
//       })
//       .always(function () {
//         start();
//       });
//   });

  test('load dependency before returning gadget', function () {
    // Check that dependencies are loaded before gadget creation
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      html_url = 'https://example.org/files/qunittest/test2.html',
      js1_url = "data:application/javascript;base64," +
         window.btoa(
          "$('#qunit-fixture').find('div').first().text('youhou');"
        ),
      js2_url = "data:application/javascript;base64," +
         window.btoa(
          "$('#qunit-fixture').find('div').first().text('youhou2');"
        ),
      css1_url = "data:text/plain;base64," +
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
      mock,
      spy_js,
      spy_css;

    server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html",
    }, html]);

    spy_js = this.spy(renderJS, "declareJS");
    spy_css = this.spy(renderJS, "declareCSS");

    mock = this.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs(html).returns({
      required_js_list: [js1_url, js2_url],
      required_css_list: [css1_url, css2_url],
      html: "<p>Bar content</p>",
    });

    $('#qunit-fixture').html("<div></div><div></div>");
    stop();
    gadget.declareGadget(html_url, $('#qunit-fixture').find("div").last())
      .done(function (new_gadget) {
        equal($('#qunit-fixture').html(),
              "<div>youhou2</div><div><p>Bar content</p></div>");
        ok(spy_js.calledTwice, "JS count " + spy_js.callCount);
        equal(spy_js.firstCall.args[0], js1_url, "First JS call");
        equal(spy_js.secondCall.args[0], js2_url, "Second JS call");
        ok(spy_css.calledTwice, "CSS count " + spy_css.callCount);
        equal(spy_css.firstCall.args[0], css1_url, "First CSS call");
        equal(spy_css.secondCall.args[0], css2_url, "Second CSS call");
      })
      .fail(function () {
        ok(false);
      })
      .always(function () {
        start();
      });
    server.respond();
  });

  test('Fail if klass can not be loaded', function () {
    // Check that gadget is not created if klass is can not be loaded
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      html_url = 'https://example.org/files/qunittest/test3.html';

    server.respondWith("GET", html_url, [404, {
      "Content-Type": "text/html",
    }, ""]);

    stop();
    gadget.declareGadget(html_url, $('#qunit-fixture').find("div").last())
      .done(function (new_gadget) {
        ok(false);
      })
      .fail(function (jqXHR, textStatus) {
        equal("404", jqXHR.status);
      })
      .always(function () {
        start();
      });
    server.respond();
  });

  test('Fail if js can not be loaded', function () {
    // Check that dependencies are loaded before gadget creation
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      html_url = 'https://example.org/files/qunittest/test2.html',
      js1_url = 'foo://bar2',
      mock;

    server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html",
    }, "raw html"]);

    mock = this.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("raw html").returns({
      required_js_list: [js1_url]
    });

    stop();
    gadget.declareGadget(html_url, $('#qunit-fixture'))
      .done(function (new_gadget) {
        ok(false);
      })
      .fail(function (jqXHR, textStatus) {
        equal(jqXHR.status, 404);
        equal(textStatus, "error");
      })
      .always(function () {
        start();
      });
    server.respond();
  });

  test('Do not load gadget dependency twice', function () {
    // Check that dependencies are not reloaded if 2 gadgets are created
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      html_url = 'https://example.org/files/qunittest/test2.html',
      js1_url = "data:application/javascript;base64," +
         window.btoa(
          "$('#qunit-fixture').find('div').first().append('youhou');"
        ),
      mock,
      spy;

    server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html",
    }, "raw html"]);

    spy = this.spy($, "ajax");

    mock = this.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("raw html").returns({
      required_js_list: [js1_url]
    });

    stop();
    $('#qunit-fixture').html("<div></div><div></div>");
    gadget.declareGadget(html_url, $('#qunit-fixture').find("div").last())
      .always(function () {
        equal($('#qunit-fixture').html(),
              "<div>youhou</div><div></div>");
        gadget.declareGadget(html_url, $('#qunit-fixture').find("div").last())
          .done(function (new_gadget) {
            equal($('#qunit-fixture').html(),
                  "<div>youhou</div><div></div>");
            ok(spy.calledTwice, "Ajax count " + spy.callCount);
            equal(spy.firstCall.args[0], html_url, "First ajax call");
            deepEqual(spy.secondCall.args[0], {
              "cache": true,
              "dataType": "script",
              "url": js1_url,
            }, "Second ajax call");
          })
          .fail(function () {
            ok(false);
          })
          .always(function () {
            start();
          });
      });
    server.respond();
  });

  test('Load 2 concurrent gadgets in parallel', function () {
    // Check that dependencies are loaded once if 2 gadgets are created
    var gadget = new RenderJSGadget(),
      server = sinon.fakeServer.create(),
      html_url = 'https://example.org/files/qunittest/test2.html',
      mock,
      spy;

    server.respondWith("GET", html_url, [200, {
      "Content-Type": "text/html",
    }, "raw html"]);

    spy = this.spy($, "ajax");

    mock = this.mock(renderJS, "parseGadgetHTML");
    mock.expects("parseGadgetHTML").once().withArgs("raw html").returns({});

    stop();
    $.when(
      gadget.declareGadget(html_url, $('#qunit-fixture')),
      gadget.declareGadget(html_url, $('#qunit-fixture'))
    ).always(function () {
      // Check that only one request has been done.
      ok(spy.calledOnce, "Ajax count " + spy.callCount);
      equal(spy.firstCall.args[0], html_url, "First ajax call");
      start();
    });
    server.respond();
  });

}(document, jQuery, renderJS, QUnit, sinon));
