// @ts-check

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpBabel from 'gulp-babel';
import filter from 'gulp-filter';
import gulpTslint from 'gulp-tslint';
import ts from 'gulp-typescript';
import path from 'path';
import tslint from 'tslint';

export function filterFileTypes() {
  return filter([
    '**',
    '!**/*.d.ts',
  ], { restore: true });
}

export function toProdPath(path) {
  return path.replace(/^(.+)(\.json)$/, '$1.prod$2');
}

export function joinPath(rootPath, srcPath, isProd) {
  return path.join(
    rootPath,
    isProd
      ? toProdPath(srcPath)
      : srcPath
  );
}

export function linterConfig({
  rootPath,
  isProd,
  tslintConfig,
  tsconfig,
}) {
  return gulpTslint({
    configuration: tslintConfig,
    formatter: 'stylish',
    program: tslint.Linter.createProgram(tsconfig),
  });
}

export function runClean(src) {
  return function clean() {
    return del([src]);
  };
}

export function runCopy({
  src,
  dist,
}) {
  return function copy() {
    return gulp.src([
      `${src}/**/*.*`,
      `!${src}/**/*.ts*`,
    ], {
      since: gulp.lastRun(copy),
    })
      .pipe(gulp.dest(dist));
  };
}

export function runLint({
  src,
  ignores,
  rootPath,
  isProd,
  tsconfig,
  tslintConfig,
}) {
  return function lint() {
    return gulp.src([
      `${src}/**/*.ts*`,
      '!**/*.d.ts',
      ...ignores.map(n => `!${n}/**/*.ts*`),
    ], {
      since: gulp.lastRun(lint),
    })
      .pipe(linterConfig({
        rootPath,
        isProd,
        tsconfig,
        tslintConfig,
      }))
      .pipe(gulpTslint.report());
  }
}

export function runBabel({
  src,
  ignores,
  tsconfig,
  rootPath,
  babelrc,
  isProd,
  dist,
}) {
  return function babel() {
    const filter = filterFileTypes();

    return gulp.src([
      `${src}/**/*.ts*`,
      '!**/*.d.ts',
      ...ignores.map(n => `!${n}/**/*.ts*`),
    ], {
      since: gulp.lastRun(babel),
    })
      .pipe(ts.createProject(tsconfig)())
      .pipe(filter)
      .pipe(gulpBabel({
        filename: joinPath(
          rootPath,
          babelrc == null ? './.babelrc.json' : babelrc,
          isProd
        ),
      }))
      .pipe(filter.restore)
      .pipe(gulp.dest(dist));
  };
}

export function runWatch({
  src,
  defaultTask,
}) {
  return function watch() {
    return gulp.watch([
      `${src}/**/*.*`,
    ], defaultTask);
  };
}

export function runDefault({
  cleanTask,
  lintTask,
  copyTask,
  babelTask,
}) {
  return gulp.series(...[
    cleanTask,
    lintTask,
    gulp.parallel(...[
      copyTask,
      babelTask,
    ]),
  ]);
}

export function builder({
  src,
  dist,
  ignores,

  isProd,
  rootPath,
  babelrc,
  tsconfig,
  tslintConfig,
} = {}) {
  const nSrc = src == null ? 'src' : src;
  const nDist = dist == null ? 'dist' : dist;
  const nIgnores = ignores == null
    ? ['demo', 'test*'].map(n => `${src}/${n}`)
    : ignores;
  const nIsProd = isProd == null
    ? process.env.NODE_ENV === 'production'
    : isProd;
  const nRootPath = rootPath == null
    ? '.'
    : rootPath;
  const nBabelRc = babelrc == null
    ? './.babelrc.json'
    : babelrc;
  const nTsconfig = joinPath(
    nRootPath,
    tsconfig == null ? './tsconfig.json' : tsconfig,
    nIsProd
  );
  const nTslintConfig = joinPath(
    nRootPath,
    tslintConfig == null ? './tslint.json' : tslintConfig,
    nIsProd
  );

  const clean = runClean(nDist);
  const copy = runCopy({
    src: nSrc,
    dist: nDist,
  });
  const lint = runLint({
    ignores: nIgnores,
    isProd: nIsProd,
    rootPath: nRootPath,
    src: nSrc,
    tsconfig: nTsconfig,
    tslintConfig: nTslintConfig,
  });
  const babel = runBabel({
    babelrc: nBabelRc,
    dist: nDist,
    ignores: nIgnores,
    isProd: nIsProd,
    rootPath: nRootPath,
    src: nSrc,
    tsconfig: nTsconfig,
  });
  const defaultTask = runDefault({
    babelTask: babel,
    cleanTask: clean,
    copyTask: copy,
    lintTask: lint,
  })

  return {
    clean,
    copy,
    lint,
    babel,
    watch: runWatch({
      defaultTask,
      src: nSrc,
    }),
    default: defaultTask,
  };
}

export default builder;
