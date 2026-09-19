import { test } from 'node:test';
import assert from 'node:assert';
import { initDb } from '../src/db.js';

test('initDb creates required tables and schema', () => {
    const db = initDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    assert.ok(tables.includes('countries'));
    assert.ok(tables.includes('manufacturers'));
    assert.ok(tables.includes('models'));
    assert.ok(tables.includes('trims'));
    db.close();
});
