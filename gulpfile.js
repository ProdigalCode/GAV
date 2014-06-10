var gulp = require('gulp');

// plugins
var jshint = require('gulp-jshint');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');
var livereload = require('gulp-livereload');
var map = require('map-stream');
var uglify = require('gulp-uglify');

// Basic usage
gulp.task('scripts', function() {
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


var hasErrors = false;
var errorReporter = function () {
  return map(function (file, cb) {
    if (!file.jshint.success) {
      hasErrors = true;
    }
    cb(null, file);
  });
};

gulp.task('lint', function() {
  return gulp.src('./scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(errorReporter())
    .on('end', function() {
      if (hasErrors) {
        process.exit(1);
      }
    });
});

gulp.task('build', function() {
  return gulp.src('scripts/main.js')
      .pipe(browserify().on('error', gutil.log))
      .pipe(uglify())
      .pipe(gulp.dest('./build'));
});

gulp.task('default', ['scripts', 'watch', 'connect']);