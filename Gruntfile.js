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
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            single: {
                singleRun: true
            },
            continuous: {
                singleRun:false
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-gitinfo');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['build']);

    grunt.registerTask('build', ['gitinfo']);

    grunt.registerTask('test', ['gitinfo', 'karma:continuous']);

    /** Continuous Integration **/
    grunt.registerTask('ci', ['gitinfo', 'karma:single']);
};