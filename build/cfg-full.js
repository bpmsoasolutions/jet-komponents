module.exports = {
    baseUrl: 'src',
    paths: {
        'almond': '../bower_components/almond/almond',
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
        'signals': '../bower_components/js-signals/dist/signals'
    },
    out: 'dist/jetKomponents.full.min.js',
    include: ['almond', 'ojs/ojcore', 'knockout', 'ojs/ojknockout', 'ojs/ojrouter', 'ojs/ojmodule', 'ojs/ojoffcanvas', 'ojs/ojnavigationlist', 'ojs/ojbutton', 'ojs/ojchart', 'ojs/ojinputtext', 'ojs/ojslider', 'ojs/ojselectcombobox', 'ojs/ojswitch', 'ojs/ojradioset','ojs/ojcheckboxset', 'ojs/ojgauge','ojs/ojmenu','ojs/ojdiagram', 'ojs/ojlegend','ojs/ojnbox', 'ojs/ojpictochart', 'jetKomponents'],
    optimize: 'uglify2',
    generateSourceMaps: false,
    wrap: {
        startFile: 'src/_start.js',
        endFile: 'src/_end.js'
    },
    preserveLicenseComments: false
};