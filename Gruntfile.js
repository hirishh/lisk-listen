module.exports = function(grunt) {

  "use strict";

  var srcFiles = ['src/*.js'];
  var libFiles = ['lib/*.js'];
  var destFile = 'lisklisten.min.js';

  var viewsFiles = ['views/*.jade'];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> Copyright (c) <%= grunt.template.today("yyyy") %> Matteo Ferrari, see README.md for license info. */\n',
        sourceMap: true,
        sourceMapIncludeSources: true
      },
      build: {
        src: libFiles.concat(srcFiles),
        dest: destFile
      }
    },
    jshint: {
      all: {
        src: srcFiles.concat(['Gruntfile.js'])
      }
    },
    todos: {
      all: {
        options: {
          verbose: false
        },
        src: srcFiles
      }
    },
    move: {
      move_with_wildcard: {
        src: ['lisklisten.min.js*'],
        dest: 'public/javascript/'
      }
    },
    watch: {
      all: {
        files: srcFiles.concat(viewsFiles).concat(['Gruntfile.js']),
        tasks: ['newer:jshint:all', 'uglify', 'move'],
        options: {
          interrupt: true,
          atBegin: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-todos');
  grunt.loadNpmTasks('grunt-move');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'uglify', 'move']);
};
