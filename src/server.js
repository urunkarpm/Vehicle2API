import { initDb } from './db.js';
import { seedDatabase } from './models.js';
import { createApp } from './app.js';

// ponytail: SQLite single-file DB -> Upgrade to PostgreSQL/MySQL if concurrent writes > 10,000 req/sec.

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || 'vehicle2api.db';

const db = initDb(DB_PATH);
seedDatabase(db);

const app = createApp(db);

const server = app.listen(PORT, () => {
    console.log(`Vehicle2API server listening on port ${PORT}`);
});

export { app, server, db };
