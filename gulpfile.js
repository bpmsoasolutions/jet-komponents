// Node modules
var fs = require('fs'),
    es = require('event-stream'),
    path = require('path'),

    gulp = require('gulp'),
    rjs = require('gulp-requirejs-bundler'),
    del = require('del'),
    babelCore = require('babel-core'),
    babel = require('gulp-babel'),
    objectAssign = require('object-assign'),
    rjs = require('gulp-requirejs-bundler');

var local_project = '/Users/dbr/htdocs/bss/oracle-jet/Frontend/js/libs/jet-komponents/dist';

var transpilationConfig = {
        root: 'src',
        babelConfig: {
            modules: 'amd',
            sourceMaps: 'inline'
        },
        skip:[]
    },
    babelIgnoreRegexes = transpilationConfig.skip.map(function(item) {
        return babelCore.util.regexify(item);
    });

function babelTranspile(pathname, callback) {
    if (babelIgnoreRegexes.some(function (re) { return re.test(pathname); })) return callback();
    var src  = path.join(transpilationConfig.root, pathname);
    var opts = objectAssign({ sourceFileName: '/source/' + pathname }, transpilationConfig.babelConfig);
    babelCore.transformFile(src, opts, callback);
}

function requireTask(name, file) {
    return gulp.task(name, ['babel'], function(cb) {
        var config = objectAssign({}, require(file), { baseUrl: 'temp' });
        rjs(config)
            .pipe(gulp.dest('./dist/'));
        cb()
    });
}




gulp.task('clean', function(cb) {
    del('./dist/**/*')
        .then(del('./temp/**/*'))
        .then(function () {
            cb();
        });
});

gulp.task('babel', ['clean'], function() {
    return gulp.src('./src/**')
        .pipe(es.map(function(data, cb) {
            if (!data.isNull()) {
                babelTranspile(data.relative, function(err, res) {
                    if (res) {
                        data.contents = new Buffer(res.code);
                    }
                    cb(err, data);
                });
            } else {
                cb(null, data);
            }
        }))
        .pipe(gulp.dest('./temp'));
});

requireTask('rjs', './build/cfg.js');
requireTask('rjs-min', './build/cfg-min.js');
requireTask('rjs-full', './build/cfg-full.js');

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.js', './build/**/*.js'], ['deploy-locally']);
});

gulp.task('deploy-locally', ['rjs'], function () {
    del.sync(local_project + '/*', {force:true});
    return gulp.src('./dist/**/*')
        .pipe(gulp.dest(local_project));
});



gulp.task('default', ['deploy-locally', 'watch'], function (cb) {
    cb();
    console.log('\nFinished "dist" synced.\n');
});

gulp.task('build-dep', ['clean', 'rjs', 'rjs-min', 'rjs-full', 'deploy-locally']);
gulp.task('build', ['rjs', 'rjs-min', 'rjs-full'], function (cb) {
    cb();
    console.log('\nFinished build "dist" synced.\n');
});