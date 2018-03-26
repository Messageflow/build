// @ts-check

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpBabelMinify from 'gulp-babel-minify';
import gulpFilter from 'gulp-filter';
import gulpTslint from 'gulp-tslint';
import gulpTs from 'gulp-typescript';
import tslint, { Linter } from 'tslint';

/** Setting up */
const srcPath = 'src';
const distPath = '.';
const ignores = ['demo', 'test*'];
const isProd = process.env.NODE_ENV === 'production';
const tslintConfig = `./tslint${isProd ? '.prod' : ''}.json`;
const tsconfig = './tsconfig.json';

gulp.task('clean', () => {
  return del([
    '*.js',
    '*.d.ts',
  ]);
});

gulp.task('lint', function lint() {
  return gulp.src([
    `${srcPath}/**/*.ts*`,
    '!**/*.d.ts',
    ...ignores.map(n => `!${n}/**/*.ts*`),
  ], {
    since: gulp.lastRun(lint),
  })
    .pipe(gulpTslint({
      configuration: tslintConfig,
      formatter: 'stylish',
      program: Linter.createProgram(tsconfig),
    }))
    .pipe(gulpTslint.report());
});

gulp.task('ts', function babel() {
  const filterFn = gulpFilter([
    '**',
    '!**/*.d.ts',
  ], { restore: true });
  const src = [
    `${srcPath}/**/*.ts*`,
    '!**/*.d.ts',
    ...ignores.map(n => `!${n}/**/*.ts*`),
  ];

  return isProd
    ? gulp.src(src, { since: gulp.lastRun(babel) })
        .pipe(gulpTs.createProject(tsconfig)())
        .pipe(filterFn)
        .pipe(gulpBabelMinify({
          mangle: { keepFnName: true },
          removeConsole: false,
          removeDebugger: true,
        }))
        .pipe(filterFn.restore)
        .pipe(gulp.dest(distPath))
    : gulp.src(src)
        .pipe(gulpTs.createProject(tsconfig)())
        .pipe(gulp.dest(distPath));
});

gulp.task('default', gulp.series(...[
  'clean',
  'lint',
  'ts',
]));
