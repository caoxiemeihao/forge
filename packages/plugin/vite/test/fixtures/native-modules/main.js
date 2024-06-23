/* eslint-disable */
import path from 'node:path';

import BetterSqlite3 from 'better-sqlite3';
import * as fsevents from 'fsevents';
import sqlite3 from 'sqlite3';

export { fsevents, initSqlite3, initBetterSqlite3 };

function initSqlite3() {
  const sqlite3DB = path.join(__dirname, 'sqlite3.db');

  return new Promise((resolve) => {
    const db = new (sqlite3.verbose().Database)(sqlite3DB, (error) => {
      resolve({
        database: db,
        error,
      });
    });
  });
}

function initBetterSqlite3() {
  const betterSqlite3DB = path.join(__dirname, 'better-sqlite3.db');

  return new Promise((resolve) => {
    const db = new BetterSqlite3(betterSqlite3DB);
    db.pragma('cache_size = 32000');
    resolve({
      database: db,
      error: db.pragma('cache_size', { simple: true }) === 32000 ? null : new Error('better-sqlite3 initialize failed'),
    });
  });
}
