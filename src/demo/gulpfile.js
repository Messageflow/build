const gulp = require('gulp');
const builder = require('../..').builder({ ignores: [], isProd: true, esModules: false, mjs: true });

gulp.task('ts', builder.ts);
// gulp.task('default', builder.default);
gulp.task('default', builder.oss);
