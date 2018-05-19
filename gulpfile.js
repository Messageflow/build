// @ts-check

/** Import project dependencies */
const del = require('del');
const gulp = require('gulp');
const gulpBabel = require('gulp-babel');
const gulpFilter = require('gulp-filter');
const gulpIf = require('gulp-if');
const gulpRename = require('gulp-rename');
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
const compile = (esm) => {
  const filterFn = gulpFilter([
    '**',
    '!**/*.d.ts',
  ], { restore: true });
  const src = [
    `${srcPath}/**/*.ts*`,
    '!**/*.d.ts',
    ...ignores.map(n => `!${n}/**/*.ts*`),
  ];

  return gulp.src(src, { since: gulp.lastRun(compile) })
    .pipe(gulpTs.createProject(tsconfig)())
    .pipe(filterFn)
    // @ts-ignore
    .pipe(gulpBabel({
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          spec: true,
          modules: esm ? false : 'commonjs',
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
    .pipe(gulpIf(esm, gulpRename({ extname: '.mjs' })))
    .pipe(filterFn.restore)
    .pipe(gulp.dest(distPath));
}

gulp.task('clean', () => {
  return del([
    './*.@(mj|j)s',
    './*.d.ts',
    '!./gulpfile.js',
    '!./json.d.ts',
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

gulp.task('esm', function esm() { return compile(true); });
gulp.task('js', function js() { return compile(false); });

gulp.task('default', gulp.series(...[
  'clean',
  'lint',
  gulp.parallel('esm', 'js'),
]));
