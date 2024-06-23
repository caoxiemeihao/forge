/* eslint-disable @typescript-eslint/no-var-requires */
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { expect } from 'chai';

const execPromise = promisify(exec);
const nativeRoot = path.join(__dirname, '../../fixtures/native-modules');

describe('plugin-vite:config/plugins/natives', () => {
  before(async () => {
    await execPromise('yarn install', { cwd: nativeRoot });
    await execPromise('yarn build', { cwd: nativeRoot });
  });

  it('sqlite3 should initialized correctly', async () => {
    const sqlite3 = await require(path.join(nativeRoot, 'dist/main.js')).initSqlite3();
    expect(sqlite3.error).null;
    expect(sqlite3.database && typeof sqlite3.database).eq('object');
  });

  it('better-sqlite3 should initialized correctly', async () => {
    const betterSqlite3 = await require(path.join(nativeRoot, 'dist/main.js')).initBetterSqlite3();
    expect(betterSqlite3.error).null;
    expect(betterSqlite3.database && typeof betterSqlite3.database).eq('object');
  });

  it('fsevents should loaded correctly', async () => {
    const fsevents = require(path.join(nativeRoot, 'dist/main.js')).fsevents;
    const fseventsExports = ['watch', 'getInfo', 'constants'];
    expect(
      Object.getOwnPropertyNames(fsevents)
        .filter((name) => name !== 'default')
        .reverse()
    ).deep.equal(fseventsExports);
  });
});
