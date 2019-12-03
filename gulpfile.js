const gulp = require('gulp');
const ts = require('gulp-typescript');
const merge = require('merge2');
 

gulp.task('default', function() {
    const tsResult = gulp.src(['src/**/*.ts'])
        .pipe(ts({
            declaration: true,
            target: 'esnext',
            module: 'CommonJS',
            noImplicitAny: true
        }));
    const tsResultClient = gulp.src(['src/**/*.ts'])
        .pipe(ts({
            declaration: true,
            target: 'esnext',
            noImplicitAny: true,
            // FIX: according to https://github.com/facebook/jest/issues/8218
            moduleResolution: 'node'
        }));
 

    return merge([
        tsResult.dts.pipe(gulp.dest('release/definitions')),
        tsResult.js.pipe(gulp.dest('release/js')),
        tsResultClient.js.pipe(gulp.dest('release/client')),
        tsResultClient.dts.pipe(gulp.dest('release/client'))
    ]);
});