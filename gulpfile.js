// Node modules
var fs = require('fs'),
    es = require('event-stream'),
    path = require('path'),

    gulp = require('gulp'),
    rjs = require('gulp-requirejs-bundler'),
    del = require('del'),
    babel = require('gulp-babel'),
    objectAssign = require('object-assign'),
    rjs = require('gulp-requirejs-bundler'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),

    //Ts
    sourcemaps = require('gulp-sourcemaps'),
    ts = require('gulp-typescript'),
    tsProject = ts.createProject('./tsconfig.json'),

    packageJson = require('./package.json');

var local_project = '/Users/dbr/htdocs/bss/-OracleJet/todo-app-jet-redux/src/bower_modules/jet-komponents/dist';

var banner = ["/**",
    " *    _     _      _                                 _",
    " *   |_|___| |_   | |_ ___ _____ ___ ___ ___ ___ ___| |_ ___",
    " *   | | -_|  _|  | '_| . |     | . | . |   | -_|   |  _|_ -|",
    " *  _| |___|_|    |_,_|___|_|_|_|  _|___|_|_|___|_|_|_| |___|",
    " * |___|                        |_|",
    " *",
    " * <%= pkg.name %> - <%= pkg.description %>",
    " * @version v<%= pkg.version %>",
    " * @link <%= pkg.homepage %>",
    " * @license <%= pkg.license %>, <%= pkg.licenseUrl %>",
    " *",
    " * Using RequireJS 2.2.0 Copyright jQuery Foundation and other contributors.",
    " * Released under MIT license, http://github.com/requirejs/requirejs/LICENSE",
    " */",
    ""].join("\n");

gulp.task('clean:dist', function(cb) {
    del('./dist/**/*')
        .then(function () {
            cb();
        });
});

gulp.task('clean:temp', function(cb) {
    del('./temp/**/*')
        .then(function () {
            cb();
        });
});
gulp.task('babel', ['clean'], function() {
     return gulp.src('./src/**')
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject))
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./temp'))
})

gulp.task('deploy-locally', ['rjs'], function () {
    del.sync(local_project + '/*', {force:true});
    return gulp.src('./dist/**/*')
        .pipe(gulp.dest(local_project));
});


gulp.task('rjs', ['babel'], function() {
    var config = objectAssign({}, require('./build/cfg.js'), { baseUrl: 'temp' });
    return rjs(config)
        .pipe(header(banner, { pkg : packageJson } ))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('rjs-min', ['babel'], function() {
    var config = objectAssign({}, require('./build/cfg-min.js'), { baseUrl: 'temp' });
    return rjs(config)
        .pipe(uglify({ preserveComments: 'none' }))
        .pipe(header(banner, { pkg : packageJson } ))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.js', './build/**/*.js'], ['deploy-locally']);
});


gulp.task('clean', ['clean:dist', 'clean:temp']);
gulp.task('default', ['deploy-locally', 'watch']);
gulp.task('build:deploy', ['clean', 'rjs', 'rjs-min', 'deploy-locally']);
gulp.task('build:dev', ['rjs']);
gulp.task('build:full', ['rjs', 'rjs-min']);
