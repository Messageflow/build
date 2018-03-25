// @ts-check

/** Import project dependencies */
import gulp from 'gulp';
import builder from './builder';

const build = builder();

['clean','copy','lint','babel','watch','default'].map(n => gulp.task(n, build[n]));
