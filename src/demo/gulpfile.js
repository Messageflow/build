const gulp = require('gulp');
const builder = require('../..').builder({ ignores: [], isProd: true });

gulp.task('ts', builder.ts);
gulp.task('default', builder.default);
