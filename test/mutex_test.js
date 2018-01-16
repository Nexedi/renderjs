(function (Mutex, QUnit) {
  "use strict";
  var test = QUnit.test,
    stop = QUnit.stop,
    start = QUnit.start,
    ok = QUnit.ok,
    expect = QUnit.expect,
    equal = QUnit.equal,
    module = QUnit.module;

  /////////////////////////////////////////////////////////////////
  // parseGadgetHTMLDocument
  /////////////////////////////////////////////////////////////////
  module("renderJS.Mutex");

  test('constructor', function () {
    equal(Mutex.length, 0);
    var mutex = new Mutex();
    equal(Object.getPrototypeOf(mutex), Mutex.prototype);
    equal(mutex.constructor, Mutex);
    equal(Mutex.prototype.constructor, Mutex);
  });

  test('lockAndRun execute callback', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(6);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      assertCounter(0);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(100);
        })
        .push(function () {
          assertCounter(1);
          return 'callback1 result';
        });
    }
    function callback2() {
      assertCounter(3);
    }
    return new RSVP.Queue()
      .push(function () {
        return mutex.lockAndRun(callback1);
      })
      .push(function (result) {
        equal(result, 'callback1 result');
        assertCounter(2);
        return mutex.lockAndRun(callback2);
      })
      .push(function () {
        assertCounter(4);
      })
      .always(function () {
        start();
      });
  });

  test('lockAndRun handle exception', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(5);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      assertCounter(0);
      throw new Error('Error in callback1');
    }
    function callback2() {
      assertCounter(2);
    }
    return new RSVP.Queue()
      .push(function () {
        return mutex.lockAndRun(callback1);
      })
      .push(undefined, function (error) {
        equal(error.message, 'Error in callback1');
        assertCounter(1);
        return mutex.lockAndRun(callback2);
      })
      .push(function () {
        assertCounter(3);
      })
      .always(function () {
        start();
      });
  });

  test('lockAndRun prevent concurrent execution', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(9);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      assertCounter(0);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(1);
          return 'callback1 result';
        });
    }
    function callback2() {
      assertCounter(2);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(3);
          return 'callback2 result';
        });
    }
    function callback3() {
      assertCounter(4);
      return 'callback3 result';
    }
    return new RSVP.Queue()
      .push(function () {
        return RSVP.all([
          mutex.lockAndRun(callback1),
          mutex.lockAndRun(callback2),
          mutex.lockAndRun(callback3)
        ]);
      })
      .push(function (result_list) {
        equal(result_list[0], 'callback1 result');
        equal(result_list[1], 'callback2 result');
        equal(result_list[2], 'callback3 result');
        assertCounter(5);
      })
      .always(function () {
        start();
      });
  });

  test('lockAndRun handle concurrent exception', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(4);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      assertCounter(0);
      throw new Error('error in callback1');
    }
    function callback2() {
      assertCounter(1);
      throw new Error('error in callback2');
    }
    function callback3() {
      assertCounter(2);
      return 'callback3 result';
    }
    return new RSVP.Queue()
      .push(function () {
        return RSVP.all([
          mutex.lockAndRun(callback1),
          mutex.lockAndRun(callback2),
          mutex.lockAndRun(callback3)
        ]);
      })
      .push(undefined, function (error) {
        equal(error.message, 'error in callback1');
        assertCounter(2);
      })
      .always(function () {
        start();
      });
  });

  test('lockAndRun cancel does not prevent next execution', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(6);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      ok(false, 'Should not reach that code');
    }
    function callback2() {
      assertCounter(1);
      return 'callback2 result';
    }
    return new RSVP.Queue()
      .push(function () {
        var promise1 = mutex.lockAndRun(callback1);
        return RSVP.all([
          promise1
            .then(function () {
              ok(false, 'Should not reach that code');
            }, function (error) {
              assertCounter(0);
              equal(error.message, 'Default Message');
              return 'handler1 result';
            }),
          mutex.lockAndRun(callback2),
          promise1.cancel('cancel callback1')
        ]);
      })
      .push(function (result_list) {
        equal(result_list[0], 'handler1 result');
        equal(result_list[1], 'callback2 result');
        assertCounter(2);
      })
      .always(function () {
        start();
      });
  });


  test('lockAndRun cancel does not cancel previous execution', function () {
    var mutex = new Mutex(),
      counter = 0,
      defer = RSVP.defer();
    stop();
    expect(8);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback2() {
      ok(false, 'Should not reach that code');
    }
    function callback1() {
      return new RSVP.Queue()
        .push(function () {
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(0);
          defer.resolve();
          return RSVP.delay(50);
        })
        .push(function () {
          assertCounter(3);
          return 'callback1 result';
        });
    }
    return new RSVP.Queue()
      .push(function () {
        var promise1 = mutex.lockAndRun(callback1),
          promise2 = mutex.lockAndRun(callback2);
        return RSVP.all([
          promise1,
          promise2
            .then(function () {
              ok(false, 'Should not reach that code');
            }, function (error) {
              assertCounter(2);
              equal(error.message, 'Default Message');
              return 'handler2 result';
            }),
          defer.promise
            .then(function () {
              assertCounter(1);
              promise2.cancel('cancel callback2');
            })
        ]);
      })
      .push(function (result_list) {
        equal(result_list[0], 'callback1 result');
        equal(result_list[1], 'handler2 result');
        assertCounter(4);
      })
      .always(function () {
        start();
      });
  });

  test('lockAndRun only wait for the callback', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(4);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      assertCounter(0);
      return 'callback1 result';
    }
    function callback2() {
      assertCounter(1);
      return 'callback2 result';
    }
    return new RSVP.Queue()
      .push(function () {
        return RSVP.any([
          mutex.lockAndRun(callback1)
            .push(function () {
              return RSVP.delay(10000);
            }),
          mutex.lockAndRun(callback2)
        ]);
      })
      .push(function (result) {
        equal(result, 'callback2 result');
        assertCounter(2);
      })
      .always(function () {
        start();
      });
  });

  test('lockAndRun only wait for the error callback', function () {
    var mutex = new Mutex(),
      counter = 0;
    stop();
    expect(4);
    function assertCounter(value) {
      equal(counter, value);
      counter += 1;
    }
    function callback1() {
      assertCounter(0);
      throw new Error('callback1 error');
    }
    function callback2() {
      assertCounter(1);
      return 'callback2 result';
    }
    return new RSVP.Queue()
      .push(function () {
        return RSVP.any([
          mutex.lockAndRun(callback1)
            .push(undefined, function () {
              return RSVP.delay(10000);
            }),
          mutex.lockAndRun(callback2)
        ]);
      })
      .push(function (result) {
        equal(result, 'callback2 result');
        assertCounter(2);
      })
      .always(function () {
        start();
      });
  });

}(renderJS.Mutex, QUnit));