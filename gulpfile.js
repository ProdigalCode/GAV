var gulp = require('gulp');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');
var livereload = require('gulp-livereload');

// Basic usage
gulp.task('scripts', function() {
    // Single entry point to browserify
    gulp.src('scripts/main.js')
        .pipe(browserify({
          debug : true
        }).on('error', gutil.log))
        .pipe(gulp.dest('./build'))
        .pipe(livereload());
});

gulp.task('watch', function() {
  gulp.watch(['scripts/**/*.js', 'scripts/**/*.html'], ['scripts']);
});

gulp.task('connect', function() {
  connect.server({
    port: 8000
  });
});

gulp.task('default', ['scripts', 'watch', 'connect']);