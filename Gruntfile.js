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
        jshint: {
            options: {
                //eqeqeq: true, // 如果是true，则要求在所有的比较时使用===和!==
                curly: true, // 如果是true，则要求在if/while的模块时使用TAB结构
                eqnull: true, // 如果是true，则允许使用== null
                noempty: true, // 如果是true，则不允许使用空函数
                undef: true, // 如果是ture，则所有的局部变量必须先声明之后才能使用
                //strict: true, // 如果是true，则需要使用strict的用法
                white: true, // 如果是true，则需要严格使用空格用法
                sub: true, // 如果是true，则允许使用各种写法获取属性(一般使用.来获取一个对象的属性值)
                //browser: true,
                "jquery": true,
                globalstrict: false,
                esnext: true
            },
            client: {
                options: {
                    globals: {
                        angular: false,
                        isEmpty: false,
                        console: false,
                        document: false
                    }
                },
                files: {
                    src: ['multi-select.js']
                }
            },
            test: {
                options: {
                    globals: {
                        angular: false,
			describe: false,
			beforeEach: false,
			module: false,
			inject: false,
			afterEach: false,
			it: false,
			xit: false,
			expect: false
                    }
                },
                files: {
                    src: ['test/testSpec/*.js']
                }
            }
        },
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
