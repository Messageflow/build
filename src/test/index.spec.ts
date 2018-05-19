// @ts-check

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpBabel from 'gulp-babel';
import gulpTslint from 'gulp-tslint';
import gulpTs, { createProject } from 'gulp-typescript';
import { Linter } from 'tslint';

/** Import other modules */
import {
  builder,
  linterConfig,
  runClean,
  runCopy,
  runDefault,
  runLint,
  runTypeScript,
  runWatch,
  toArrayGlobs,
  toProdPath,
} from '../';

/**
 * NOTE: Limitation in ts-jest
 * {@link https://goo.gl/t8tdqD|Known Limitations for hoisting}
 *
 */
jest.mock('del');
jest.mock('gulp');
jest.mock('gulp-babel');
jest.mock('gulp-tslint');
jest.mock('gulp-typescript');
jest.mock('tslint');

describe('@messageflow/build', () => {
  function mockFn() {
    function pipeFn(cb) {
      if (typeof cb === 'function') {
        cb();
      }

      return this;
    }

    (gulp as any).src = jest.fn(() => {
      return {
        pipe: pipeFn,
      };
    });
    (gulp as any).lastRun = jest.fn(() => {
      return 'gulp.lastRun';
    });
    (gulp as any).watch = jest.fn((src, fn) => {
      return fn(src);
    });
    (gulp as any).series = jest.fn((...tks) => {
      return tks.map((tk) => {
        return typeof tk === 'function'
          ? tk()
          : tk;
      });
    });
    (gulp as any).parallel = jest.fn((...tks) => {
      return tks.map(tk => tk());
    });

    (gulpBabel as any).mockImplementation(() => jest.fn(() => {
      return {
        pipe: pipeFn,
      };
    }));

    (gulpTslint as any).mockImplementation(() => jest.fn(() => {
      return {
        pipe: pipeFn,
      };
    }));

    (Linter as any).createProgram = jest.fn((tsconfig) => {
      return tsconfig;
    });

    (gulpTs as any).createProject = jest.fn((tsconfig) => {
      return () => tsconfig;
    });
  }

  describe('ok', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      mockFn();
    });

    test('[function runClean] works', async () => {
      const tmpPath = `/.tmp/tmp-dir/${Math.random().toString(16).slice(-7)}/tmp-file.tmp`;

      await runClean(tmpPath)();

      expect(del).toHaveBeenCalledTimes(1);
      expect(del).toHaveBeenCalledWith(tmpPath);
    });

    test('[function runCopy] works', () => {
      const srcPath = 'src';
      const copyPaths = [
        `${srcPath}/**/*.*`,
        `!${srcPath}/**/*.ts*`,
        `${srcPath}/**/*.d.ts`,
      ];
      const distPath = 'dist';

      runCopy({ copyPaths, distPath })();

      expect(gulp.src).toHaveBeenCalledTimes(1);
      expect(gulp.dest).toHaveBeenCalledTimes(1);
      expect(gulp.src).toHaveBeenCalledWith([
        `${srcPath}/**/*.*`,
        `!${srcPath}/**/*.ts*`,
        `${srcPath}/**/*.d.ts`,
      ], { since: 'gulp.lastRun' });
      expect(gulp.dest).toHaveBeenCalledWith(distPath);
    });

    test('[function runLint] works', () => {
      const srcPath = 'src';
      const ignoreGlobs = [
        '!**/demo*/**/*.ts*',
        '!**/test*/**/*.ts*',
      ];
      const tslintConfig = '/.tmp/tslint.json';
      const tsconfig = '/.tmp/tsconfig.json';

      runLint({
        srcPath,
        ignoreGlobs,
        tsconfig,
        tslintConfig,
      })();

      expect(gulp.src).toHaveBeenCalledTimes(1);
      expect(gulpTslint).toHaveBeenCalledTimes(1);
      expect(Linter.createProgram).toHaveBeenCalledTimes(1);
      expect(gulpTslint.report).toHaveBeenCalledTimes(1);
      expect(gulp.src).toHaveBeenCalledWith([
        `${srcPath}/**/*.ts*`,
        '!**/*.d.ts',
        '!**/demo*/**/*.ts*',
        '!**/test*/**/*.ts*',
      ], { since: 'gulp.lastRun' });
      expect(gulpTslint).toHaveBeenCalledWith({
        configuration: tslintConfig,
        formatter: 'stylish',
        program: tsconfig,
      });
      expect(gulpTslint.report).toHaveBeenCalledWith();
    });

    test('[function runTypeScript] works', () => {
      const srcPath = 'src';
      const distPath = 'dist';
      const ignoreGlobs = [
        '!**/demo*/**/*.ts*',
        '!**/test*/**/*.ts*',
      ];
      const tsconfig = './tsconfig.json';

      runTypeScript({
        srcPath,
        distPath,
        ignoreGlobs,
        tsconfig,
        isProd: false,
      })();

      expect(gulp.src).toHaveBeenCalledTimes(1);
      expect(gulpTs.createProject).toHaveBeenCalledTimes(1);
      expect(gulp.dest).toHaveBeenCalledTimes(1);
      expect(gulp.src).toHaveBeenCalledWith([
        `${srcPath}/**/*.ts*`,
        '!**/demo*/**/*.ts*',
        '!**/test*/**/*.ts*',
      ], { since: 'gulp.lastRun' });
      expect(gulpTs.createProject).toHaveBeenCalledWith(tsconfig);
      expect(gulp.dest).toHaveBeenCalledWith(distPath);
    });

    test('[function runWatch] works', () => {
      const src = ['src/**/*.*'];
      const defaultTask = jest.fn(n => n);

      const d = runWatch({
        defaultTask,
        srcPath: 'src',
      })();

      expect(gulp.watch).toHaveBeenCalledTimes(1);
      expect(defaultTask).toHaveBeenCalledTimes(1);
      expect(gulp.watch).toHaveBeenCalledWith(src, defaultTask);
      expect(defaultTask).toHaveBeenCalledWith(src);
      expect(d).toEqual(src);
    });

    test('[function runDefault] works', () => {
      const cleanTask = jest.fn(() => 'clean');
      const copyTask = jest.fn(() => 'copy');
      const lintTask = jest.fn(() => 'lint');
      const tsTask = jest.fn(() => 'ts');

      const d = runDefault({
        cleanTask,
        copyTask,
        lintTask,
        tsTask,
      });

      expect(gulp.series).toHaveBeenCalledTimes(1);
      expect(gulp.parallel).toHaveBeenCalledTimes(1);
      expect(gulp.series).toHaveBeenCalledWith(...[
        cleanTask,
        lintTask,
        [copyTask(), tsTask()],
      ]);
      expect(gulp.parallel).toHaveBeenCalledWith(...[copyTask, tsTask]);
      expect(d).toEqual(['clean', 'lint', ['copy', 'ts']]);
    });

    test('[function builder] works', () => {
      const src = 'src';
      const dist = 'dist';
      const tsconfig = './tsconfig.json';
      const tslintConfig = './tslint.json';

      const d = builder({
        src,
        dist,
        tsconfig,
        tslintConfig,
        isProd: true,
        rootPath: '.',
      });
      // @ts-ignore
      const nullSrc = builder({ src: null });
      // @ts-ignore
      const nullDist = builder({ dist: null });
      // @ts-ignore
      const nullIgnores = builder({ ignoreGlobs: null });
      // @ts-ignore
      const nullIsProd = builder({ isProd: null });
      // @ts-ignore
      const nullRootPath = builder({ rootPath: null });
      // @ts-ignore
      const nullTsconfig = builder({ tsconfig: null });
      // @ts-ignore
      const nullTslintConfig = builder({ tslintConfig: null });
      const allBuilders = [
        d,
        nullSrc,
        nullDist,
        nullIgnores,
        nullIsProd,
        nullRootPath,
        nullTsconfig,
        nullTslintConfig,
      ];

      expect(gulp.src).toHaveBeenCalledTimes(
        allBuilders.length * 7
      );
      expect(gulp.src).toHaveBeenLastCalledWith([
        `${src}/**/*.ts*`,
        // '!**/*.d.ts',
      ], { since: 'gulp.lastRun' });
      // expect(allBuilders)
      //   .toEqual(
      //     Array.from(
      //       Array(allBuilders.length),
      //       () => {
      //         return {
      //           clean: expect.any(Function),
      //           copy: expect.any(Function),
      //           lint: expect.any(Function),
      //           ts: expect.any(Function),
      //           watch: expect.any(Function),
      //           default: expect.any(Array),
      //         };
      //       }
      //     )
      //   );
    });

    test('[function builder] works with opts[ignoreGlobs] string', () => {
      const d = builder({
        ignoreGlobs: '!**/demo*/**/*.ts*, !**/test*/**/*.ts*',
        isProd: true, // isProd is needed to ignore files/ folders
      });

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(gulp.src).toHaveBeenCalledWith([
        'src/**/*.ts*',
        '!**/*.d.ts',
        '!**/demo*/**/*.ts*',
        '!**/test*/**/*.ts*',
      ], { since: 'gulp.lastRun' });
      // expect(d).toEqual({
      //   clean: expect.any(Function),
      //   copy: expect.any(Function),
      //   lint: expect.any(Function),
      //   ts: expect.any(Function),
      //   watch: expect.any(Function),
      //   default: expect.any(Array),
      // });
    });

    test('[function builder] works with opts[ignoreGlobs] array', () => {
      const d = builder({
        ignoreGlobs: [
          '!**/demo*/**/*.ts*',
          '!**/test*/**/*.ts*',
        ],
        isProd: true, // isProd is needed to ignore files/ folders
      });

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(gulp.src).toHaveBeenCalledWith([
        'src/**/*.ts*',
        '!**/*.d.ts',
        '!**/demo*/**/*.ts*',
        '!**/test*/**/*.ts*',
      ], { since: 'gulp.lastRun' });
      // expect(d).toEqual({
      //   clean: expect.any(Function),
      //   copy: expect.any(Function),
      //   lint: expect.any(Function),
      //   ts: expect.any(Function),
      //   watch: expect.any(Function),
      //   default: expect.any(Array),
      // });
    });

    test('[function builder] works with null', () => {
      // @ts-ignore
      const d = builder(null);

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(gulp.src).toHaveBeenCalledWith([
        'src/**/*.ts*',
        '!**/*.d.ts',
      ], { since: 'gulp.lastRun' });
      // expect(d).toEqual({
      //   clean: expect.any(Function),
      //   copy: expect.any(Function),
      //   lint: expect.any(Function),
      //   ts: expect.any(Function),
      //   watch: expect.any(Function),
      //   default: expect.any(Array),
      // });
    });

    test('[function builder] works with undefined params', () => {
      const d = builder(undefined);

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(gulp.src).toHaveBeenCalledWith([
        'src/**/*.ts*',
        '!**/*.d.ts',
      ], { since: 'gulp.lastRun' });
      // expect(d).toEqual({
      //   clean: expect.any(Function),
      //   copy: expect.any(Function),
      //   lint: expect.any(Function),
      //   ts: expect.any(Function),
      //   watch: expect.any(Function),
      //   default: expect.any(Array),
      // });
    });

    test('[function builder] works with defined opts[cleanGlobs]', () => {
      const d = builder({
        cleanGlobs: ['./*.js', './*.d.ts', '!./gulpfile.js', '!./json.d.ts'],
      });

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(del).toHaveBeenCalledTimes(2);
      expect(gulp.src).toHaveBeenCalledWith([
        'src/**/*.ts*',
        '!**/*.d.ts',
      ], { since: 'gulp.lastRun' });
      expect(del).toHaveBeenCalledWith([
        './*.js',
        './*.d.ts',
        '!./gulpfile.js',
        '!./json.d.ts',
      ]);
      // expect(d).toEqual({
      //   clean: expect.any(Function),
      //   copy: expect.any(Function),
      //   lint: expect.any(Function),
      //   ts: expect.any(Function),
      //   watch: expect.any(Function),
      //   default: expect.any(Array),
      // });
    });

    test('[function builder] works with opts[isProd]=true', () => {
      builder({ isProd: true });

      expect(createProject).toHaveBeenCalledTimes(3);
      expect(createProject).toHaveBeenCalledWith('./tsconfig.json');
    });

    test('[function builder] works with defined opts[babelConfig]', () => {
      const babelConfig = {
        presets: [
          ['@babel/preset-env', {
            target: { node: 'current' },
          }],
        ],
      };

      builder({ babelConfig, isProd: true });

      expect(gulpBabel).toHaveBeenCalledTimes(3);
      expect(gulpBabel).toHaveBeenCalledWith(babelConfig);
    });

    test('[function builder] works with opts[copyGlobs] array', () => {
      const copyGlobs = ['**/src/**/*.*', '!**/src/**.ts*', '**/src/**/*.d.ts'];
      builder({ copyGlobs });

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(gulp.src).toHaveBeenCalledWith(copyGlobs, { since: 'gulp.lastRun' });
    });

    test('[function builder] works with opts[copyGlobs] string', () => {
      const copyGlobs = '**/src/**/*.*, !**/src/**.ts*, **/src/**/*.d.ts';
      builder({ copyGlobs });

      expect(gulp.src).toHaveBeenCalledTimes(7);
      expect(gulp.src).toHaveBeenCalledWith(copyGlobs, { since: 'gulp.lastRun' });
    });

    test('[function toProdPath] works', () => {
      expect(toProdPath('./babelrc.json')).toEqual('./babelrc.prod.json');
    });

    test('[function builder] works with opts[esModules] set to false', () => {
      builder({ esModules: false });

      expect(gulpBabel).toHaveBeenLastCalledWith(
        {
          presets: [
            ['@babel/preset-env', {
              modules: 'commonjs',
              shippedProposals: true,
              spec: true,
              targets: { node: 'current' },
              useBuiltIns: 'usage',
            }],
            ['minify', {
              mangle: { keepFnName: true },
              removeConsole: false,
              removeDebugger: true,
              replace: false,
            }]
          ],
        }
      );
    });

  });

  describe('error', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      mockFn();
    });

    test('[function runCopy] throws', () => {
      // @ts-ignore
      expect(() => runCopy(undefined)())
        .toThrowError(
          'Cannot destructure property `copyPaths` of \'undefined\' or \'null\''
        );
    });

    test('[function toProdPath] throws', () => {
      // @ts-ignore
      expect(() => toProdPath(null))
        .toThrowError(
          'Cannot read property \'replace\' of null'
        );
    });

    test('[function linterConfig] throws', () => {
      // @ts-ignore
      expect(() => linterConfig(null))
        .toThrowError(
          'Cannot destructure property `tslintConfig` of \'undefined\' or \'null\''
        );
    });

    test('[function toArrayGlobs] throws', () => {
      try {
        // @ts-ignore
        toArrayGlobs(null, 'options[ignoreGlobs]')
      } catch (e) {
        expect(e).toEqual(
          new TypeError('Param `options[ignoreGlobs]` is not a string')
        );
      }
    });

  });

});
