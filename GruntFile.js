module.exports = (grunt) => {
  grunt.initConfig({
    browserify: {
      client: {
        options: {
          transform: [[
            'babelify', {
              presets: [
                ['env', {
                  targets: {
                    browsers: ['> 1%'],
                    uglify: true,
                  },
                }],
              ],
            },
          ]],
          // browserifyOptions: { fullPaths: true },
        },
        files: {
          './build/bundleClient.js': ['./src/client/client.js'],
        },
      },
      teacher: {
        options: {
          transform: [[
            'babelify', {
              presets: [
                ['env', {
                  targets: {
                    browsers: ['> 1%'],
                    uglify: true,
                  },
                }],
              ],
            },
          ]],
          // browserifyOptions: { fullPaths: true },
        },
        files: {
          './build/bundleTeacher.js': ['./src/client/teacher.js'],
        },
      },
      debug: {
        options: {
          transform: [[
            'babelify', {
              presets: [
                ['env', {
                  targets: {
                    browsers: ['> 1%'],
                    uglify: true,
                  },
                }],
              ],
            },
          ]],
          // browserifyOptions: { fullPaths: true },
        },
        files: {
          './build/bundleDebug.js': ['./src/client/debug.js'],
        },
      },
    },
    uglify: {
      options: {
      },
      build: {
        files: {
          './public/bundleClient.min.js': './build/bundleClient.js',
          './public/bundleTeacher.min.js': './build/bundleTeacher.js',
          './public/bundleDebug.min.js': './build/bundleDebug.js',
        },
      },
    },
    copy: {
      fakeUglify: {
        expand: true,
        src: './build/*.js',
        rename(dest, src) {
          return src.replace('build', 'public').replace('.js', '.min.js');
        },
      },
    },
    cssmin: {
      options: {
        keepSpecialComments: true,
        rebase: true,
      },
      target: {
        files: {
          './public/style.min.css': [
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/css/bootstrap-theme.min.css',
            'node_modules/jstree/dist/themes/default/style.min.css',
            'node_modules/font-awesome/css/font-awesome.min.css',
            'style.css',
          ],
        },
      },
    },
    watch: {
      scriptsClient: {
        files: ['./src/client/client.js', './src/client/lib/**/*.js'],
        tasks: ['browserify:client', 'copy'],
      },
      scriptsTeacher: {
        files: ['./src/client/teacher.js', './src/client/lib-teacher/**/*.js'],
        tasks: ['browserify:teacher', 'copy'],
      },
      scriptsDebug: {
        files: ['./src/client/debug.js', './src/client/lib-debug/**/*.js'],
        tasks: ['browserify:debug', 'copy'],
      },
      options: {
        livereload: {
          liveCSS: false,
          compress: false,
        },
      },
      css: {
        files: ['style.css'],
        tasks: ['cssmin'],
      },
      configFiles: {
        files: ['GruntFile.js', 'views/*'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('build', ['browserify', 'uglify', 'cssmin']);
};
