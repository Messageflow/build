// @ts-check

/** Import project dependencies */
const del = require('del');
const gulp = require('gulp');
const gulpBabel = require('gulp-babel');
const gulpFilter = require('gulp-filter');
const gulpTslint = require('gulp-tslint').default;
const gulpTs = require('gulp-typescript');
const { Linter } = require('tslint');

/** Setting up */
const srcPath = 'src';
const distPath = '.';
const ignores = ['**/demo*', '**/test*'];
const isProd = process.env.NODE_ENV === 'production';
const tslintConfig = `./tslint${isProd ? '.prod' : ''}.json`;
const tsconfig = './tsconfig.json';

gulp.task('clean', () => {
  return del([
    '*.js',
    '*.d.ts',
    '!gulpfile.js',
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

gulp.task('ts', function compile() {
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
    ? gulp.src(src, { since: gulp.lastRun(compile) })
        .pipe(gulpTs.createProject(tsconfig)())
        .pipe(filterFn)
        // @ts-ignore
        .pipe(gulpBabel({
          presets: [
            ['@babel/preset-env', {
              targets: { node: 'current' },
              spec: true,
              modules: false,
              useBuiltIns: 'usage',
              shippedProposals: true,
            }],
            ...(
              isProd
                ? [['minify', {
                  mangle: { keepFnName: true },
                  deadcode: { keepFnName: true },
                  removeConsole: false,
                  removeDebugger: true,
                }]]
                : []
            ),
          ],
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
