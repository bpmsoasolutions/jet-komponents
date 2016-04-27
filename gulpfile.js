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
    gulp.task(name, function() {
        var config = objectAssign({}, require(file), { baseUrl: 'temp' });
        return rjs(config)
            .pipe(gulp.dest('./dist/'));
    });
    return name;
}

var tasks = [
    requireTask('rjs', './build/cfg.js'),
    requireTask('rjs-min', './build/cfg-min.js'),
    requireTask('rjs-full', './build/cfg-full.js')
];

// Pushes all the source files through Babel for transpilation
gulp.task('babel', function() {
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

gulp.task('watch', function() {
    gulp.watch(['./src/**/*.js', './build/**/*.js'], ['babel', 'rjs', 'deploy-locally']);
});

gulp.task('deploy-locally', function () {
    del.sync(local_project + '/*', {force:true});
    return gulp.src('./dist/**/*')
        .pipe(gulp.dest(local_project));
});

gulp.task('clean', function() {
    del.sync(['./dist/**/*', './temp/**/*']);
});

gulp.task('default', ['babel', 'rjs', 'deploy-locally', 'watch']);
gulp.task('build-dep', ['clean', 'rjs', 'rjs-min', 'rjs-full', 'deploy-locally']);
gulp.task('build', ['clean', 'rjs', 'rjs-min', 'rjs-full']);