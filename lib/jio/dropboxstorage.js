/*
 * Copyright 2013, Nexedi SA
 * Released under the LGPL license.
 * http://www.gnu.org/licenses/lgpl.html
 */
/**
 * JIO Dropbox Storage. Type = "dropbox".
 * Dropbox "database" storage.
 */
/*global FormData, btoa, Blob, CryptoJS */
/*jslint nomen: true, unparam: true, bitwise: true */
(function (dependencies, module) {
  "use strict";
  if (typeof define === 'function' && define.amd) {
    return define(dependencies, module);
  }
  //   if (typeof exports === 'object') {
  //     return module(exports, require('jio'), require('complex_queries'));
  //   }
  module(jIO);
}([
  'jio'
], function (jIO) {
  "use strict";
  var UPLOAD_URL = "https://api-content.dropbox.com/1/";
  //     DEADLINE = 1451491200;

  /**
   * The JIO DropboxStorage extension
   *
   * @class DropboxStorage
   * @constructor
   */
  function DropboxStorage(spec) {
    if (typeof spec.access_token !== 'string' && !spec.access_token) {
      throw new TypeError("Access Token' must be a string " +
        "which contains more than one character.");
    }
    this._access_token = spec.access_token;
  }

  DropboxStorage.prototype._put = function (key, blob) {
    var data = new FormData();
    data.append(
      "file",
      // new Blob([JSON.stringify(doc)], {type: "application/json"}),
      // new Blob([doc], {type: "application/json"}),
      blob,
      //       new Blob([], {type: "application/octet-stream"}),
      key
    );

    return jIO.util.ajax({
      "type": "POST",
      "url": UPLOAD_URL + 'files/sandbox/?access_token=' + this._access_token,
      "data": data
      //     }).then(function (doc) {
      //       if (doc !== null) {
      //         command.success({"data": doc});
      //       } else {
      //         command.error(
      //           "not_found",
      //           "missing",
      //           "Cannot find document"
      //         );
      //       }
    });

  };

  /**
   * Create a document.
   *
   * @method post
   * @param  {Object} command The JIO command
   * @param  {Object} metadata The metadata to store
   */
  DropboxStorage.prototype.post = function (command, metadata) {
    var doc = jIO.util.deepClone(metadata),
      doc_id = metadata._id;
    if (!doc_id) {
      doc_id = jIO.util.generateUuid();
      doc._id = doc_id;
    }
    return this._put(
      doc_id,
      new Blob([JSON.stringify(doc)], {
        type: "application/json"
      })
    ).then(function (doc) {
      if (doc !== null) {
        command.success({
          "id": doc_id
        });
      } else {
        command.error(
          "not_found",
          "missing",
          "Cannot find document"
        );
      }
    }, function (event) {
      command.error(
        event.target.status,
        event.target.statusText,
        "Unable to post doc"
      );
    });
  };

  /**
   * Update/create a document.
   *
   * @method put
   * @param  {Object} command The JIO command
   * @param  {Object} metadata The metadata to store
   */
  DropboxStorage.prototype.put = function (command, metadata) {
    return this._put(
      metadata._id,
      new Blob([JSON.stringify(metadata)], {
        type: "application/json"
      })
    ).then(function (doc) {
      if (doc !== null) {
        command.success({
          "data": doc
        });
      } else {
        command.error(
          "not_found",
          "missing",
          "Cannot find document"
        );
      }
    }, function (event) {
      command.error(
        event.target.status,
        event.target.statusText,
        "Unable to put doc"
      );
    });
  };

  DropboxStorage.prototype._get = function (key) {
    var download_url = 'https://api-content.dropbox.com/1/files/sandbox/' + key + '?access_token=' + this._access_token;

    return jIO.util.ajax({
      "type": "GET",
      "url": download_url
      //       "dataType": "blob"
    });
  };

  /**
   * Get a document or attachment
   * @method get
   * @param  {object} command The JIO command
   **/
  DropboxStorage.prototype.get = function (command, param) {
    return this._get(param._id)
      .then(function (doc) {
        if (doc.target.responseText !== undefined) {
          command.success({
            "data": JSON.parse(doc.target.responseText)
          });
        } else {
          command.error(
            "not_found",
            "missing",
            "Cannot find document"
          );
        }
      }, function (event) {
        command.error(
          event.target.status,
          event.target.statusText,
          "Unable to get doc"
        );
      });
  };

  /**
   * Get an attachment
   *
   * @method getAttachment
   * @param  {Object} command The JIO command
   * @param  {Object} param The given parameters
   * @param  {Object} options The command options
   */
  DropboxStorage.prototype.getAttachment = function (command, param) {
    return this._get(param._id + "." + param._attachment)
      .then(function (doc) {
        if (doc.target.response) {
          command.success({
            "data": doc.target.response
          });
        } else {
          // XXX Handle error
          command.error(
            "not_found",
            "missing",
            "Cannot find document"
          );
        }
      }, function (event) {
        command.error(
          event.target.status,
          event.target.statusText,
          "Unable to get attachment"
        );
      });
  };

  /**
   * Add an attachment to a document
   *
   * @method putAttachment
   * @param  {Object} command The JIO command
   * @param  {Object} param The given parameters
   * @param  {Object} options The command options
   */
  DropboxStorage.prototype.putAttachment = function (command, param) {
    return this._put(
      param._id + "." + param._attachment,
      param._blob
    ).then(function (doc) {
      if (doc !== null) {
        command.success({
          "data": doc
        });
      } else {
        command.error(
          "not_found",
          "missing",
          "Cannot find document"
        );
      }
    }, function (event) {
      command.error(
        event.target.status,
        event.target.statusText,
        "Unable to put attachment"
      );
    });

  };


  DropboxStorage.prototype.allDocs = function (command, param, options) {
    var list_url = 'https://api.dropbox.com/1/metadata/sandbox/' + "?list=true" + '&access_token=' + this._access_token,
      my_storage = this;
    jIO.util.ajax({
      "type": "POST",
      "url": list_url
    }).then(function (response) {
      var data = JSON.parse(response.target.responseText),
        count = data.contents.length,
        result = [],
        promise_list = [],
        item,
        i,
        item_id;
      for (i = 0; i < count; i += 1) {
        item = data.contents[i];
        // Note: the '/' at the begining of the path is stripped
        item_id = item.path[0] === '/' ? item.path.substr(1) : item.path;
        if (options.include_docs === true) {
          promise_list.push(my_storage._get(item_id));
        }
        result.push({
          id: item_id,
          key: item_id,
          doc: {},
          value: {}
        });
      }
      return RSVP.all(promise_list)
        .then(function (response_list) {
          for (i = 0; i < response_list.length; i += 1) {
            result[i].doc = JSON.parse(response_list[i].target.response);
          }
          command.success({
            "data": {
              "rows": result,
              "total_rows": count
            }
          });
        })
        .fail(function (error) {
          command.error(
            "error",
            "did not work as expected",
            "Unable to call allDocs"
          );
        });
    }).fail(function (error) {
      command.error(
        "error",
        "did not work as expected",
        "Unable to call allDocs"
      );
    });

  };


  DropboxStorage.prototype._remove = function (key) {
    var DELETE_HOST = "https://api.dropbox.com/1",
      DELETE_PREFIX = "/fileops/delete",
      DELETE_PARAMETERS = "?root=sandbox&path=" + key + "&access_token=" + this._access_token,
      delete_url = DELETE_HOST + DELETE_PREFIX + DELETE_PARAMETERS;

    return jIO.util.ajax({
      "type": "POST",
      "url": delete_url
    });
  };

  /**
   * Remove a document
   *
   * @method remove
   * @param  {Object} command The JIO command
   * @param  {Object} param The given parameters
   */
  DropboxStorage.prototype.remove = function (command, param) {
    return this._remove(param._id)
      .then(
        command.success
      )
      .fail(function (error) {
        command.error(
          "not_found",
          "missing",
          "Unable to delete doc"
        );
      });
  };

  /**
   * Remove a document Attachment
   *
   * @method remove
   * @param  {Object} command The JIO command
   * @param  {Object} param The given parameters
   */
  DropboxStorage.prototype.removeAttachment = function (command, param) {
    return this._remove(param._id + '.' + param._attachment)
      .then(command.success)
      .fail(function (error) {
        command.error(
          "not_found",
          "missing",
          "Unable to delete document Attachment"
        );
      });
  };


  jIO.addStorage('dropbox', DropboxStorage);
}));