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
  grunt.loadNpmTasks('grunt-contrib-concat');
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
            'XMLHttpRequest',
            'MutationObserver',
            'Blob',
            'FileReader',
            'Node',
            'navigator',
            'Event',
            'URL'
          ]
        }
      },
      test: {
        src: ['test/embedded.js', 'test/renderjs_test.js',
              'test/embedded.js', 'test/inject_script.js',
              'test/mutex_test.js', 'test/not_declared_gadget.js',
              'test/trigger_rjsready_event_on_ready_gadget.js'],
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
            '__RenderJSGadget',
            'sinon',
            'RSVP',
            'DOMParser',
            'URI',
            'URL',
            '__RenderJSIframeGadget',
            '__RenderJSEmbeddedGadget',
            'FileReader',
            'Blob',
            'Event',
            'MutationObserver'
          ]
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['<%= curl.jschannel.dest %>',
              '<%= curl.domparser.dest %>',
              'lib/iefix/*.js',
              'renderjs.js'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },

    uglify: {
      renderjs: {
        src: "<%= concat.dist.dest %>",
        dest: "dist/<%= pkg.name %>-<%= pkg.version %>.min.js"
      }
    },

    copy: {
      latest: {
        files: [{
          src: '<%= uglify.renderjs.src %>',
          dest: "dist/<%= pkg.name %>-latest.js"
        }, {
          src: '<%= uglify.renderjs.dest %>',
          dest: "dist/<%= pkg.name %>-latest.min.js"
        }]
      }
    },

    watch: {
      src: {
        files: [
          '<%= jslint.client.src %>',
          '<%= jslint.config.src %>',
          '<%= jslint.test.src %>',
          ['lib/**'],
          ['test/*.html', 'test/*.js']
        ],
        tasks: ['default'],
        options: {
          livereload: LIVERELOAD_PORT
        }
      }
    },

    curl: {
      domparser: {
        src: 'https://gist.github.com/eligrey/1129031/raw/' +
          'e26369ee7939db745087beb98b4bb4bbcf460cf3/html-domparser.js',
        dest: 'lib/domparser/domparser.js'
      },
      jschannel: {
        src: 'http://mozilla.github.io/jschannel/src/jschannel.js',
        dest: 'lib/jschannel/jschannel.js'
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
  grunt.registerTask('server', ['connect:client', 'watch']);
  grunt.registerTask('build', ['concat', 'uglify', 'copy']);

};
