import os from 'node:os';
import path from 'node:path';

import chalk from 'chalk';
import glob from 'fast-glob';
import fs from 'fs-extra';

(async () => {
  // https://github.com/electron/forge/blob/v7.2.0/packages/utils/test-utils/src/index.ts#L24
  const dirs = await glob(path.resolve(os.tmpdir(), 'electron-forge-test-*'));

  if (dirs.length) {
    for (const dir of dirs) {
      console.log('Clean up the test dir:', dir);

      // Remove the tmp files generated by run `template/**/*_spec_slow.ts`,
      // see here 👉 https://github.com/electron/forge/pull/3468#issuecomment-1920805240
      await fs.remove(dir);
    }
  } else {
    console.log(chalk.gray('There is no "electron-forge-test-*" dir that needs to be cleaned.'));
  }
})();
