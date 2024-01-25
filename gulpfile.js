/// <binding ProjectOpened='build' />
'use strict';

const gulp = require('gulp');

// CSS-related
const sass = require('gulp-dart-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');

// JS-related
const minify = require('gulp-minify');

// Utility-related
const sourcemaps = require('gulp-sourcemaps');
const connect = require('gulp-connect');
const open = require('gulp-open');

const localhost = 'http://localhost:8080/';

const roots = {
    src: './src',
    dist: './dist',
};

// Move html to dist
gulp.task('html', function (done) {
    return gulp.src([`${roots.src}/index.html`])
        .pipe(gulp.dest(`${roots.dist}`))
        .pipe(connect.reload());
});

// Creates JS sourcemaps, concatenates JS files into one file based on array above, and minifies JS
gulp.task('js', function (done) {
    return gulp.src([`${roots.src}/js/media-gallery.js`],
            { sourcemaps: true }
        )
        .pipe(minify({
            ext: {
                min: ".min.js",
            },
                preserveComments: 'some'
            
        }))
        .pipe(gulp.dest(`${roots.dist}/js`, { sourcemaps: '.' }))
        .pipe(connect.reload());
});

// Creates Main CSS sourcemaps, converts SCSS to CSS, adds prefixes, and lints CSS
gulp.task('sass', function (done) {
    const plugins = [
        autoprefixer({ grid: true })
    ];

    return gulp.src([`${roots.src}/scss/media-gallery.scss`])
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(cleanCss())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${roots.dist}/css`))
        .pipe(connect.reload());
});

// Runs a server to static HTML files and sets up watch tasks
gulp.task('server', function (done) {
    gulp.watch((`${roots.src}/**/*.html`), gulp.series('html'));
    gulp.watch((`${roots.src}/scss/**/*.scss`), gulp.series('sass', 'js'));
    gulp.watch((`${roots.src}/js/**/*`), gulp.series('sass', 'js'));

    connect.server({
        root: roots.dist,
        livereload: true
    });

    setTimeout(function () {
        return gulp.src(__filename)
            .pipe(open({ uri: localhost }));
    }, 2000);

    done();
});

gulp.task('watch', function (done) {
    gulp.watch((`${roots.src}/**/*.html`), gulp.series('html'));
    gulp.watch((`${roots.src}/scss/**/*.scss`), gulp.series('sass', 'js'));
    gulp.watch((`${roots.src}/js/**/*`), gulp.series('sass', 'js'));

    done();
});

gulp.task('build', gulp.series('sass', 'html', 'js'));

gulp.task('default', gulp.series('build', 'server'));
