//'use strict';

module.exports = function (grunt) {
    // show elapsed time at the end
    //require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    grunt.file.defaultEncoding = 'utf8';

    var reloadPort = 35729, files;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ngAnnotate: {
            options: {
                singleQuotes: true,
            },
            buildMultiSelector: {
                files: [
                    {
                        expand: true,
                        src: ['multi-select.js'],
                        ext: '.annotated.js', // Dest filepaths will have this extension.
                        extDot: 'last',       // Extensions in filenames begin after the last dot
                    },
                ],
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            buildMultiSelector: {
                options: {
                    sourceMap: true,
                    sourceMapName: 'dist/multi-select.map'
                }, files: {
                    'dist/multi-select.min.js': ['multi-select.annotated.js']
                }
            }
        },
        cssmin: {
            options: {
                report: 'min',
                sourceMap: false
            },
            build: {
                files: {
                    'dist/multi-select.min.css': ['multi-select.css']
                }
            }
        }
    });


    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-cssmin');


    grunt.registerTask('build', ['ngAnnotate', 'uglify', 'cssmin:build']);

    grunt.registerTask('default', ['build']);
};
