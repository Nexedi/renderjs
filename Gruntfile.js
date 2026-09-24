/*
 * Copyright 2013, Nexedi SA
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
/*global require */
module.exports = function (grunt) {
  "use strict";

  grunt.loadNpmTasks("grunt-jslint");
  // grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  // grunt.loadNpmTasks('grunt-curl');

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
              'test/inject_script.js',
              'test/embedded_crashing_service.js',
              'test/embedded_fails.js',
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
            'nise',
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
          src: '<%= concat.dist.dest %>',
          dest: "dist/<%= pkg.name %>-latest.js"
/*
        }, {
          src: '<%= uglify.renderjs.dest %>',
          dest: "dist/<%= pkg.name %>-latest.min.js"
*/
        }]
      }
    },

    // XXX this is not executed automatically
    // (because the plugin was badly audited)
    // curl the urls manually if needed
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
    }

  });

  grunt.registerTask('default', ['all']);
  grunt.registerTask('all', ['lint', 'build']);
  grunt.registerTask('lint', ['jslint']);
  grunt.registerTask('test', ['qunit']);
  grunt.registerTask('build', ['concat', 'copy']);

};
