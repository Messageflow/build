// @ts-check

export declare interface RunDefaultParams {
  cleanTask: () => Promise<string[]>;
  lintTask: () => any;
  copyTask: () => any;
  tsTask: () => any;
}
export declare interface RunWatchParams {
  srcPath: string;
  defaultTask: () => void; /** TaskFunction from 'undertaker' */
}
export declare interface RunTypeScriptParams {
  srcPath: string;
  distPath: string;
  ignores: string[];
  isProd: boolean;
  babelConfig?: any;
  tsconfig: string;
}
export declare interface RunLintParams {
  srcPath: string;
  ignores: string[];
  tsconfig: string;
  tslintConfig: string;
}
export declare interface RunCopyParams {
  copyPaths: string | string[];
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
  copies?: string | string[];
  cleanGlobs?: string | string[];

  isProd?: boolean;
  rootPath?: string;
  babelConfig?: any;
  tsconfig?: string;
  tslintConfig?: string;
}

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpBabel from 'gulp-babel';
import filter from 'gulp-filter';
import gulpTslint from 'gulp-tslint';
import gulpTs from 'gulp-typescript';
import path from 'path';
import { Linter } from 'tslint';

export const DEFAULT_IGNORES = [
  '**/demo*',
  '**/test*',
];
export const DEFAULT_BABEL_CONFIG = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      spec: true,
      modules: false,
      useBuiltIns: 'usage',
      shippedProposals: true,
    }],
    ['minify', {
      replace: false,
      mangle: { keepFnName: true },
      removeConsole: false,
      removeDebugger: true,
    }],
  ],
};

export function toProdPath(srcPath: string) {
  return srcPath.replace(/^(.+)(\.json)$/, '$1.prod$2');
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

export function runClean(srcPath: string | string[]) {
  return function clean() {
    return del(srcPath);
  };
}

export function runCopy({
  copyPaths,
  distPath,
}: RunCopyParams) {
  return function copy() {
    return gulp.src(copyPaths, {
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
      ...(
        Array.isArray(ignores) && ignores.length > 0
          ? ignores.map(n => `!${n}/**/*.ts*`)
          : []
      ),
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
  babelConfig,
  tsconfig,
}: RunTypeScriptParams) {
  return function ts() {
    const filterFn = filter([
      '**',
      '!**/*.d.ts',
    ], { restore: true });
    const src = [
      `${srcPath}/**/*.ts*`,
      ...ignores.map(n => `!${n}/**/*.ts*`),
    ];

    return isProd
      ? gulp.src(src, { since: gulp.lastRun(ts) })
          .pipe(gulpTs.createProject(tsconfig)())
          .pipe(filterFn)
          .pipe(gulpBabel(
            babelConfig == null
              ? DEFAULT_BABEL_CONFIG
              : babelConfig
          ))
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
  return function watch() {
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
}: RunDefaultParams) {
  return gulp.series(...[
    cleanTask,
    lintTask,
    gulp.parallel(...[
      copyTask,
      tsTask,
    ]),
  ]);
}

export function builder(options = {} as BuilderParams) {
  const {
    src,
    dist,
    ignores,
    copies,
    cleanGlobs,

    isProd,
    rootPath,
    babelConfig,
    tsconfig,
    tslintConfig,
  } = options || {} as BuilderParams;
  const srcPath = src == null ? 'src' : src;
  const distPath = dist == null ? 'dist' : dist;
  const nIgnores = ignores == null
    ? DEFAULT_IGNORES
    : (Array.isArray(ignores) ? ignores : [ignores]);
  const copyPaths = copies == null
    ? [
      `${srcPath}/**/*.*`,
      `!${srcPath}/**/*.ts*`,
      `${srcPath}/**/*.d.ts`,
    ]
    : copies;
  const isProdFlag = isProd == null ? process.env.NODE_ENV === 'production' : isProd;
  const nRootPath = rootPath == null ? '.' : rootPath;
  const resolvedTsconfig = tsconfig == null ? './tsconfig.json' : tsconfig;
  const resolvedTslintConfig = tslintConfig == null ? './tslint.json' : tslintConfig;

  const clean = runClean(cleanGlobs == null ? distPath : cleanGlobs);
  const copy = runCopy({
    copyPaths,
    distPath,
  });
  const lint = runLint({
    srcPath,
    ignores: isProd ? nIgnores : [],
    tsconfig: resolvedTsconfig,
    tslintConfig: path.join(
      nRootPath,
      isProdFlag ? toProdPath(resolvedTslintConfig) : resolvedTslintConfig
    ),
  });
  const ts = runTypeScript({
    srcPath,
    distPath,
    babelConfig,
    ignores: isProd ? nIgnores : [],
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
