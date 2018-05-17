// @ts-check

export type Omit<T, U> = Pick<T, Exclude<keyof T, U>>;
export declare interface RunDefaultOssParams extends Omit<RunDefaultParams, 'tsTask'> {
  ossTask: () => any;
}
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
  ignoreGlobs: string[];
  isProd: boolean;
  babelConfig?: any;
  tsconfig: string;
  esModules?: boolean;
}
export declare interface RunLintParams {
  srcPath: string;
  ignoreGlobs: string[];
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
  cleanGlobs?: string | string[];
  copyGlobs?: string | string[];
  ignoreGlobs?: string | string[];

  isProd?: boolean;
  rootPath?: string;
  babelConfig?: any;
  tsconfig?: string;
  tslintConfig?: string;

  esModules?: boolean;
}

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpBabel from 'gulp-babel';
import filter from 'gulp-filter';
import gulpIf from 'gulp-if';
import gulpRename from 'gulp-rename';
import gulpTslint from 'gulp-tslint';
import gulpTs from 'gulp-typescript';
import path from 'path';
import { Linter } from 'tslint';

export const DEFAULT_IGNORE_GLOBS = [
  '!**/demo*/**/*.ts*',
  '!**/test*/**/*.ts*',
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
export const DEFAULT_ESM_BABEL_CONFIG = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      spec: true,
      modules: true,
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

export function toArrayGlobs(globs: string, name: string) {
  if (typeof globs !== 'string' || !globs.length) {
    throw new TypeError(`Param \`${name}\` is not a string`);
  }

  return globs.split(/\s*,\s*/gi);
}

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
  ignoreGlobs,
  tsconfig,
  tslintConfig,
}: RunLintParams) {
  return function lint() {
    return gulp.src([
      `${srcPath}/**/*.ts*`,
      '!**/*.d.ts',
      ...(
        Array.isArray(ignoreGlobs) && ignoreGlobs.length > 0
          ? ignoreGlobs
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
  ignoreGlobs,
  isProd,
  babelConfig,
  tsconfig,
  esModules,
}: RunTypeScriptParams) {
  return function ts() {
    const filterFn = filter([
      '**',
      '!**/*.d.ts',
    ], { restore: true });
    const src = [
      `${srcPath}/**/*.ts*`,
      ...(
        Array.isArray(ignoreGlobs) && ignoreGlobs.length > 0
          ? ignoreGlobs
          : []
      ),
    ];
    const cfg = babelConfig == null
      ? DEFAULT_BABEL_CONFIG
      : babelConfig;

    /** NOTE: Set modules=true for ESM */
    if (esModules) {
      cfg.presets[0][1].modules = true;
    }

    return gulp.src(src, { since: gulp.lastRun(ts) })
      .pipe(gulpTs.createProject(tsconfig)())
      .pipe(gulpIf(isProd, filterFn))
      .pipe(gulpIf(isProd, gulpBabel(cfg)))
      .pipe(gulpIf(isProd, filterFn.restore))
      .pipe(gulp.dest(distPath));
  };
}

export function runOss({
  srcPath,
  distPath,
  ignoreGlobs,
  isProd,
  babelConfig,
  tsconfig,
}: Omit<RunTypeScriptParams, 'esModules'>) {
  return function oss() {
    const src = [
      `${srcPath}/**/*.ts*`,
      ...(
        Array.isArray(ignoreGlobs) && ignoreGlobs.length > 0
        ? ignoreGlobs
        : []
      ),
    ];
    const filterFn = filter([
      '**',
      '!**/*.d.ts',
    ], { restore: true });
    const cfg = babelConfig == null
      ? DEFAULT_BABEL_CONFIG
      : babelConfig;
    const compileFn = esm => gulp.src(src, { since: gulp.lastRun(oss) })
      .pipe(gulpTs.createProject(tsconfig)())
      .pipe(gulpIf(isProd, filterFn))
      .pipe(gulpIf(isProd, gulpBabel(cfg)))
      .pipe(gulpIf(isProd, filterFn.restore))
      .pipe(gulpIf(esm, gulpRename({ extname: '.mjs' })))
      .pipe(gulp.dest(distPath));

    return gulp.parallel(...[
      compileFn(true),
      compileFn(false),
    ]);
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

export function runDefaultOss({
  cleanTask,
  lintTask,
  copyTask,
  ossTask,
}: RunDefaultOssParams) {
  return gulp.series(...[
    cleanTask,
    lintTask,
    gulp.parallel(...[
      copyTask,
      ossTask,
    ]),
  ]);
}

export function builder(options = {} as BuilderParams) {
  const {
    src,
    dist,
    cleanGlobs,
    copyGlobs,
    ignoreGlobs,

    isProd,
    rootPath,
    babelConfig,
    tsconfig,
    tslintConfig,

    esModules = false,
  } = options || {} as BuilderParams;
  const srcPath = src == null ? 'src' : src;
  const distPath = dist == null ? 'dist' : dist;
  const nIgnores = ignoreGlobs == null
    ? DEFAULT_IGNORE_GLOBS
    : (
      Array.isArray(ignoreGlobs)
        ? ignoreGlobs
        : toArrayGlobs(ignoreGlobs, 'options[ignoreGlobs]')
    );
  const copyPaths = copyGlobs == null
    ? [
      `${srcPath}/**/*.*`,
      `!${srcPath}/**/*.ts*`,
      `${srcPath}/**/*.d.ts`,
    ]
    : copyGlobs;
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
    ignoreGlobs: isProd ? nIgnores : [],
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
    ignoreGlobs: isProd ? nIgnores : [],
    tsconfig: resolvedTsconfig,
    isProd: isProdFlag,
    esModules: typeof esModules === 'boolean' && esModules
      ? true
      : false,
  });
  const oss = runOss({
    srcPath,
    distPath,
    babelConfig,
    ignoreGlobs: isProd ? nIgnores : [],
    tsconfig: resolvedTsconfig,
    isProd: isProdFlag,
  });
  const defaultTask = runDefault({
    tsTask: ts,
    cleanTask: clean,
    copyTask: copy,
    lintTask: lint,
  });
  const defaultOssTask = runDefaultOss({
    ossTask: oss,
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
    oss: defaultOssTask,
  };
}

export default builder;
