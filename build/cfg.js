module.exports = {
    baseUrl: 'src',
    paths: {
        'knockout': '../bower_components/knockout/dist/knockout.debug',
        'jquery': '../bower_components/jquery/dist/jquery',
        'jqueryui-amd': '../bower_components/jquery-ui/ui',
        'promise': '../bower_components/es6-promise/promise',
        'hammerjs': '../bower_components/hammerjs/hammer',
        'ojdnd': '../bower_components/oraclejet/dist/js/libs/dnd-polyfill/dnd-polyfill-1.0.0',
        'ojs': '../bower_components/oraclejet/dist/js/libs/oj/debug',
        'ojL10n': '../bower_components/oraclejet/dist/js/libs/oj/ojL10n',
        'ojtranslations': '../bower_components/oraclejet/dist/js/libs/oj/resources',
        'knockout-amd-helpers': '../bower_components/knockout/dist/',
        'text': '../bower_components/text/text',
        'signals': '../bower_components/js-signals/dist/signals',
        'requirejs': '../node_modules/requirejs/require'
    },
    out: 'jet-komponents.js',
    include: ['requirejs', 'jet-komponents'],
    preserveLicenseComments: false,
    generateSourceMaps: false
};