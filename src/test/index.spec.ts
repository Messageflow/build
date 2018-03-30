// @ts-check

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpTslint from 'gulp-tslint';
import gulpTs from 'gulp-typescript';
import { Linter } from 'tslint';

/** Import other modules */
import {
  builder,
  runClean,
  runCopy,
  runDefault,
  runLint,
  runTypeScript,
  runWatch,
} from '../';

/**
 * NOTE: Limitation in ts-jest
 * {@link https://goo.gl/t8tdqD|Known Limitations for hoisting}
 *
 */
jest.mock('del');
jest.mock('gulp');
jest.mock('gulp-tslint');
jest.mock('gulp-typescript');
jest.mock('tslint');

describe('ok', () => {
  beforeEach(() => {
    jest.resetAllMocks();

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
  });

  test('[function runClean] works', async () => {
    const tmpPath = `/.tmp/tmp-dir/${Math.random().toString(16).slice(-7)}/tmp-file.tmp`;

    await runClean(tmpPath)();

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(tmpPath);
  });

  test('[function runCopy] works', () => {
    const srcPath = 'src';
    const distPath = 'dist';

    runCopy({ srcPath, distPath })();

    expect(gulp.src).toHaveBeenCalledTimes(1);
    expect(gulp.dest).toHaveBeenCalledTimes(1);
    expect(gulp.src).toHaveBeenCalledWith([
      `${srcPath}/**/*.*`,
      `!${srcPath}/**/*.ts*`,
    ], { since: 'gulp.lastRun' });
    expect(gulp.dest).toHaveBeenCalledWith(distPath);
  });

  test('[function runLint] works', () => {
    const srcPath = 'src';
    const ignores = ['demo*', 'test*'];
    const tslintConfig = '/.tmp/tslint.json';
    const tsconfig = '/.tmp/tsconfig.json';

    runLint({
      srcPath,
      ignores,
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
      '!demo*/**/*.ts*',
      '!test*/**/*.ts*',
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
    const ignores = ['demo*', 'test*'];
    const tsconfig = './tsconfig.json';

    runTypeScript({
      srcPath,
      distPath,
      ignores,
      tsconfig,
      isProd: false,
    })();

    expect(gulp.src).toHaveBeenCalledTimes(1);
    expect(gulpTs.createProject).toHaveBeenCalledTimes(1);
    expect(gulp.dest).toHaveBeenCalledTimes(1);
    expect(gulp.src).toHaveBeenCalledWith([
      `${srcPath}/**/*.ts*`,
      '!**/*.d.ts',
      '!demo*/**/*.ts*',
      '!test*/**/*.ts*',
    ]);
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

    expect(gulp.src).toHaveBeenCalledTimes(3);
    expect(gulp.src).toHaveBeenLastCalledWith([
      `${src}/**/*.ts*`,
      '!**/*.d.ts',
      '!demo*/**/*.ts*',
      '!test*/**/*.ts*',
    ], { since: 'gulp.lastRun' });
    expect(d).toMatchObject({
      clean: expect.any(Function),
      copy: expect.any(Function),
      lint: expect.any(Function),
      ts: expect.any(Function),
      watch: expect.any(Function),
      default: expect.any(Array),
    });
  });

});

describe('error', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('runClean fails', async () => {
    try {
      await runClean(null)();
    } catch (e) {
      expect(e instanceof TypeError).toBe(true);
      expect(e.message).toEqual('2patterns must be a string or an array of strings');
    }
  });
});
