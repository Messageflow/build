// @ts-check

/** Import project dependencies */
import del from 'del';
import gulp from 'gulp';
import gulpTslint from 'gulp-tslint';
import { Linter } from 'tslint';

/** Import other modules */
import {
  runClean,
  runCopy,
  runLint,
} from '../';

/**
 * NOTE: Limitation in ts-jest
 * {@link https://goo.gl/t8tdqD|Known Limitations for hoisting}
 *
 */
jest.mock('del');
jest.mock('gulp');
jest.mock('gulp-tslint');
jest.mock('tslint');

describe('ok', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (gulp as any).src = jest.fn(() => {
      return {
        pipe: () => {
          return {
            pipe: dest => dest,
          };
        },
      };
    });
    (gulp as any).lastRun = jest.fn(() => {
      return 'gulp.lastRun';
    });
    (gulpTslint as any).mockImplementation(() => jest.fn((tsconfig) => {
      return {
        pipe: () => {
          return { pipe: dest => dest };
        },
      };
    }));
    (Linter as any).createProgram = jest.fn((tsconfig) => {
      return tsconfig;
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
