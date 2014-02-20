module.exports = function(grunt) {
  "use strict";
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jslint: {
      client: {
        src: [
          'presentation-editor.js'
        ],
        directives: {
          browser: true,
          maxlen: 100,
          indent: 2,
          unparam: true,
          plusplus: true,
          predef: [
            'window',
            'document',
            '$',
            'html_beautify'
          ]
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-jslint');

  // Default task(s).
  grunt.registerTask('default', ['jslint']);

};
