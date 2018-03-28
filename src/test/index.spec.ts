// @ts-check

/** Import project dependencies */
import del from 'del';
import temp from 'tempy';

/** Import other modules */
import {
  runClean,
} from '../';

jest.mock('del');

describe('ok', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('runClean works', async () => {
    const tmpPath = temp.directory();

    await runClean(tmpPath)();

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(tmpPath);
  });
});
