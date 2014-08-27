var projectConfig = {
    source: "./src/",
    target: "./dist/"
};

module.exports = function (grunt) {

    // Example task registration
    grunt.registerTask('example', 'Log some stuff.', function () {
        grunt.log.write('Logging some stuff...').ok();
    });

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        projectConfig: projectConfig,
        clean: {
            coverage: {
                src: ["coverage/"]
            }
        },
        gitinfo: {
            commands: {
                "branch.name": ['rev-parse', '--abbrev-ref', 'HEAD'],
                "commit.id": ['rev-parse', '--short', 'HEAD'],
                "commit.time": ['log', '--format=%ai', '-n1', 'HEAD'],
                "commit.author": ['log', '--format=%aN', '-n1', 'HEAD']
            }
        },
        concat: {
            options: {
                separator: '',
                stripBanners: true
            }
        },
        uglify: {
            options: {
                preserveComments: false,
                mangle: false
            }
        },
        coveralls: {
            options: {
                force:true
            },
            ci: {
                src: 'coverage/**/lcov.info'
            }
        },
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            single: {
                singleRun: true
            },
            continuous: {
                singleRun: false
            },
            ci: {
                singleRun: true,
                reporters: ['dots', 'coverage'],

                preprocessors: {
                    "src/**/*js": "coverage"
                },
                coverageReporter: {
                    type: "lcov",
                    dir: "coverage/"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-gitinfo');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-coveralls');

    /** Task Registration **/
    grunt.registerTask('default', ['build']);

    grunt.registerTask('build', ['gitinfo']);

    grunt.registerTask('dev', ['gitinfo', 'karma:continuous']);

    grunt.registerTask('test-single', ['gitinfo', 'karma:single']);

    /** Continuous Integration **/
    grunt.registerTask('ci', ['gitinfo', 'clean:coverage', 'karma:ci', 'coveralls:ci']);
};