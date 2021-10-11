var p = require('./package.json'),
		gulp = require('gulp'),
		gutil = require('gulp-util'),
		sass =  require('gulp-sass'),
    uglify = require('gulp-uglify'),
    minify = require('gulp-minify-css')
    watch = require('gulp-watch'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    rename = require('gulp-rename'),
    prefix = require('gulp-autoprefixer'),
    livereload = require('gulp-livereload');
    contentful = require('contentful')
 
gulp.task('scripts', function() {
   gulp.src([     
        './node_modules/parsleyjs/dist/parsley.min.js',
        './node_modules/select2/dist/js/select2.min.js',
        './node_modules/moment/min/moment.min.js',
        './vendors/jquery.easy-autocomplete.min.js',
        './include/js/vendor/*.js', 
        './include/js/modules/*.js',
        './include/js/*.js'
      ])
      .pipe(concat('site.js'))
      .pipe(gulp.dest(p.jsDestination))
      .pipe(uglify())
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest(p.jsDestination))      
});
 
gulp.task('styles', function () {
 	gulp.src('./include/scss/main.scss')
  	.pipe(sass())
    .on('error', swallowError)
    .pipe(prefix('last 3 versions'))  	
    .pipe(gulp.dest(p.cssDestination))
    .pipe(minify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(p.cssDestination))
    .pipe(livereload());    
    
});

gulp.task('default', function() {
   
  livereload.listen();
  
  gulp.start('scripts', 'styles');

  gulp.watch('./include/js/**', function(event) {
      gulp.start('scripts');
  })
  
  gulp.watch('./include/js/modules/**', function(event) {
      gulp.start('scripts');
  })  

  gulp.watch('./include/scss/**', function(event) {
      gulp.start('styles');
  })
  
  gulp.watch('./include/scss/modules/**', function(event) {
      gulp.start('styles');
  })  
  
  gulp.watch('./include/scss/pages/**', function(event) {
      gulp.start('styles');
  })    
  
  gulp.watch('./include/scss/plugins/**', function(event) {
      gulp.start('styles');
  })    

})

function swallowError (error) {

  // If you want details of the error in the console
  gutil.log(error.message);

  this.emit('end')
}