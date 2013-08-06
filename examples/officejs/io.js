/*global window, jQuery, jIO, rJS */
"use strict";
(function (window, $, jIO, rJS) {

  var gk = rJS(window);

  gk.declareMethod('configureIO', function (key) {
    rJS(this).jio = jIO.newJio({
      "type": "local",
      "username": "couscous",
      "application_name": "renderjs"
    });
    rJS(this).jio_key = key;
  })

    .declareMethod('getIO', function () {
      var deferred = $.Deferred(),
        default_value = "",
        gadget = rJS(this);

      gadget.jio.getAttachment({
        "_id": gadget.jio_key,
        "_attachment": "body.txt"
      }, function (err, response) {
        if (err) {
          if (err.status === 404) {
            deferred.resolve(default_value);
          } else {
            deferred.reject(err);
          }
        } else {
          deferred.resolve(response || default_value);
        }
      });

      return deferred.promise();
    })

    .declareMethod('setIO', function (value) {

      var deferred = $.Deferred(),
        default_value = "",
        gadget = rJS(this);

      gadget.jio.put({"_id": gadget.jio_key},
        function (err, response) {
          if (err) {
            deferred.reject(err);
          } else {
            gadget.jio.putAttachment({
              "_id": gadget.jio_key,
              "_attachment": "body.txt",
              "_data": value,
              "_mimetype": "text/plain"
            }, function (err, response) {
              if (err) {
                deferred.reject(err);
              } else {
                deferred.resolve();
              }
            });
          }
        });
      return deferred.promise();
    })

    .declareMethod('configureDataSourceCallback', function (that, callback) {
      var g = rJS(this);
      g.context.find('a').unbind('click').click(function () {
        callback.apply(that).done(function (value) {
          g.setIO(value);
        });
      });
    });

}(window, jQuery, jIO, rJS));
