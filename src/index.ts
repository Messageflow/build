// @ts-check

export declare interface RunDefaultParams {
  cleanTask: () => Promise<string[]>;
  lintTask: () => any;
  copyTask: () => any;
  tsTask: () => any;
}
export declare interface RunWatchParams {
  srcPath: string;
  defaultTask: TaskFunction;
}
export declare interface RunTypeScriptParams {
  srcPath: string;
  distPath: string;
  ignores: string[];
  isProd: boolean;
  tsconfig: string;
}
export declare interface RunLintParams {
  srcPath: string;
  ignores: string[];
  tsconfig: string;
  tslintConfig: string;
}
export declare interface RunCopyParams {
  srcPath: string;
  distPath: string;
}
export declare interface LinterConfigParams {
  tslintConfig: string;
  tsconfig: string;
}
export declare interface BuilderParams {
  src?: string;
  dist?: string;
  ignores?: string | string[];

  isProd?: boolean;
  rootPath?: string;
  tsconfig?: string;
  tslintConfig?: string;
}

/** Import typings */
import { FSWatcher } from 'fs';
import { TaskFunction } from 'undertaker';

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpBabelMinify from 'gulp-babel-minify';
import filter from 'gulp-filter';
import gulpTslint from 'gulp-tslint';
import gulpTs from 'gulp-typescript';
import path from 'path';
import { Linter } from 'tslint';

export function filterFileTypes() {
  return filter([
    '**',
    '!**/*.d.ts',
  ], { restore: true });
}

export function toProdPath(srcPath: string) {
  return srcPath.replace(/^(.+)(\.json)$/, '$1.prod$2');
}

export function joinPath(
  rootPath: string,
  srcPath: string,
  isProd: boolean
) {
  return path.join(
    rootPath,
    isProd
      ? toProdPath(srcPath)
      : srcPath
  );
}

export function linterConfig({
  tslintConfig,
  tsconfig,
}: LinterConfigParams) {
  return gulpTslint({
    configuration: tslintConfig,
    formatter: 'stylish',
    program: Linter.createProgram(tsconfig),
  });
}

export function runClean(srcPath: string) {
  return function clean() {
    return del(srcPath);
  };
}

export function runCopy({
  srcPath,
  distPath,
}: RunCopyParams) {
  return function copy() {
    return gulp.src([
      `${srcPath}/**/*.*`,
      `!${srcPath}/**/*.ts*`,
    ], {
      since: gulp.lastRun(copy),
    })
      .pipe(gulp.dest(distPath));
  };
}

export function runLint({
  srcPath,
  ignores,
  tsconfig,
  tslintConfig,
}: RunLintParams) {
  return function lint() {
    return gulp.src([
      `${srcPath}/**/*.ts*`,
      '!**/*.d.ts',
      ...ignores.map(n => `!${n}/**/*.ts*`),
    ], {
      since: gulp.lastRun(lint),
    })
      .pipe(linterConfig({
        tsconfig,
        tslintConfig,
      }))
      .pipe(gulpTslint.report());
  };
}

export function runTypeScript({
  srcPath,
  distPath,
  ignores,
  isProd,
  tsconfig,
}: RunTypeScriptParams) {
  return function babel() {
    const filterFn = filterFileTypes();
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
  };
}

export function runWatch({
  srcPath,
  defaultTask,
}: RunWatchParams) {
  return function watch(): FSWatcher {
    return gulp.watch([
      `${srcPath}/**/*.*`,
    ], defaultTask);
  };
}

export function runDefault({
  cleanTask,
  lintTask,
  copyTask,
  tsTask,
}: RunDefaultParams): TaskFunction {
  return gulp.series(...[
    cleanTask,
    lintTask,
    gulp.parallel(...[
      copyTask,
      tsTask,
    ]),
  ]);
}

export function builder({
  src,
  dist,
  ignores,

  isProd,
  rootPath,
  tsconfig,
  tslintConfig,
}: BuilderParams = {} as BuilderParams) {
  const srcPath = src == null ? 'src' : src;
  const distPath = dist == null ? 'dist' : dist;
  const nIgnores = ignores == null
    ? ['demo*', 'test*']
    : (Array.isArray(ignores) ? ignores : [ignores]);
  const isProdFlag = isProd == null
    ? process.env.NODE_ENV === 'production'
    : isProd;
  const nRootPath = rootPath == null
    ? '.'
    : rootPath;
  const resolvedTsconfig = joinPath(
    nRootPath,
    tsconfig == null ? './tsconfig.json' : tsconfig,
    isProdFlag
  );

  const clean = runClean(distPath);
  const copy = runCopy({
    srcPath,
    distPath,
  });
  const lint = runLint({
    srcPath,
    ignores: nIgnores,
    tsconfig: resolvedTsconfig,
    tslintConfig: joinPath(
      nRootPath,
      tslintConfig == null ? './tslint.json' : tslintConfig,
      isProdFlag
    ),
  });
  const ts = runTypeScript({
    srcPath,
    distPath,
    ignores: nIgnores,
    tsconfig: resolvedTsconfig,
    isProd: isProdFlag,
  });
  const defaultTask = runDefault({
    tsTask: ts,
    cleanTask: clean,
    copyTask: copy,
    lintTask: lint,
  });

  return {
    clean,
    copy,
    lint,
    ts,
    watch: runWatch({
      defaultTask,
      srcPath,
    }),
    default: defaultTask,
  };
}

export default builder;
