module.exports = function (config) {
    var libraries = [
        {pattern: 'vendor/js/angular.min.js', watched: false},
        {pattern: 'vendor/js/angular-mocks.js', watched: false},
        {pattern: 'vendor/js/underscore.min.js', watched: false}
    ];

    var modules = [
        'src/*.js'
    ];

    var specs = [
        'test/**/*Specs.js'
    ];

    config.set({
        autoWatch: true,
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],

        reporters: ['dots'],
        plugins: [
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-phantomjs-launcher',
            'karma-chrome-launcher'
        ],

        files: [].concat(libraries, modules, specs)
    });
};






