/*global require */
module.exports = function (grunt) {
  "use strict";

  var LIVERELOAD_PORT, lrSnippet, livereloadMiddleware;

  // This is the default port that livereload listens on;
  // change it if you configure livereload to use another port.
  LIVERELOAD_PORT = 35729;
  // lrSnippet is just a function.
  // It's a piece of Connect middleware that injects
  // a script into the static served html.
  lrSnippet = require('connect-livereload')({ port: LIVERELOAD_PORT });
  // All the middleware necessary to serve static files.
  livereloadMiddleware = function (connect, options) {
    return [
      // Inject a livereloading script into static files.
      lrSnippet,
      // Serve static files.
      connect.static(options.base),
      // Make empty directories browsable.
      connect.directory(options.base)
    ];
  };

  grunt.loadNpmTasks("grunt-jslint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-curl');
  grunt.loadNpmTasks('grunt-open');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jslint: {
      config: {
        src: ['package.json', 'Gruntfile.js'],
        directives: {
          maxlen: 100,
          indent: 2,
          maxerr: 3,
          predef: [
            'module'
          ]
        }
      },
      client: {
        src: ['renderjs.js'],
        directives: {
          maxlen: 79,
          indent: 2,
          maxerr: 3,
          unparam: true,
          predef: [
            'RSVP',
            'window',
            'document',
            'DOMParser',
            'Channel',
            'XMLHttpRequest'
          ]
        }
      },
      test: {
        src: ['test/embedded.js', 'test/renderjs_test.js'],
        directives: {
          maxlen: 79,
          indent: 2,
          maxerr: 3,
          unparam: true,
          predef: [
            'window',
            'document',
            'QUnit',
            'renderJS',
            'rJS',
            'RenderJSGadget',
            'sinon',
            'RSVP',
            'DOMParser',
            'RenderJSIframeGadget',
            'RenderJSEmbeddedGadget'
          ]
        }
      },
      examples: {
        src: ['examples/officejs/*.js'],
        directives: {
          maxlen: 79,
          indent: 2,
          maxerr: 3,
          unparam: true,
          predef: [
            'window',
            'document',
            'rJS',
            'RSVP',
            'jQuery',
            'jIO'
          ]
        }
      }
    },

    copy: {
      renderjs: {
        src: '<%= pkg.name %>.js',
        dest: "dist/<%= pkg.name %>-<%= pkg.version %>.js"
      },
      latest: {
        files: [{
          src: '<%= pkg.name %>.js',
          dest: "dist/<%= pkg.name %>-latest.js"
        }, {
          src: '<%= uglify.stateless.dest %>',
          dest: "dist/<%= pkg.name %>-latest.min.js"
        }]
      }
    },

    uglify: {
      stateless: {
        src: "dist/<%= pkg.name %>-<%= pkg.version %>.js",
        dest: "dist/<%= pkg.name %>-<%= pkg.version %>.min.js"
      }
    },

    watch: {
      src: {
        files: [
          '<%= jslint.client.src %>',
          '<%= jslint.config.src %>',
          '<%= jslint.test.src %>',
          '<%= qunit.all %>',
          ['test/*.html', 'test/*.js']
        ],
        tasks: ['default'],
        options: {
          livereload: LIVERELOAD_PORT
        }
      },
      examples: {
        files: [
          ['examples/**']
        ],
        tasks: ['lint'],
        options: {
          livereload: LIVERELOAD_PORT
        }
      }
    },

    curl: {
      jschannel: {
        src: 'http://mozilla.github.io/jschannel/src/jschannel.js',
        dest: 'lib/jschannel/jschannel.js'
      },
      jquery: {
        src: 'http://code.jquery.com/jquery-2.0.3.js',
        dest: 'lib/jquery/jquery.js'
      },
      jio: {
        src: 'http://git.erp5.org/gitweb/jio.git/blob_plain/refs/heads/master:/jio.js',
        dest: 'lib/jio/jio.js'
      },
      md5: {
        src: 'http://git.erp5.org/gitweb/jio.git/blob_plain/HEAD:/src/md5.amd.js',
        dest: 'lib/jio/md5.js'
      },
      sha256: {
        src: 'http://git.erp5.org/gitweb/jio.git/blob_plain/HEAD:/src/sha256.amd.js',
        dest: 'lib/jio/sha256.js'
      },
      localstorage: {
        src: 'http://git.erp5.org/gitweb/jio.git/blob_plain/HEAD:/src/jio.storage/localstorage.js',
        dest: 'lib/jio/localstorage.js'
      },
      complex_queries: {
        src: 'http://git.erp5.org/gitweb/jio.git/blob_plain/HEAD:/complex_queries.js',
        dest: 'lib/jio/complex_queries.js'
      }
    },

    qunit: {
      all: ['test/index.html']
    },

    connect: {
      client: {
        options: {
          port: 9000,
          base: '.',
          directory: '.',
          middleware: livereloadMiddleware
        }
      }
    },

    open: {
      all: {
        // Gets the port from the connect configuration
        path: 'http://localhost:<%= connect.client.options.port%>/test/'
      }
    }
  });

  grunt.registerTask('default', ['all']);
  grunt.registerTask('all', ['lint', 'build']);
  grunt.registerTask('lint', ['jslint']);
  grunt.registerTask('test', ['qunit']);
  grunt.registerTask('server', ['connect:client', 'open', 'watch']);
  grunt.registerTask('build', ['copy:renderjs', 'uglify', 'copy:latest']);

};