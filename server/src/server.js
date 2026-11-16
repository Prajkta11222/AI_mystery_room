import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

let dbRetryTimer = null;
async function initDatabase() {
  try {
    await connectDatabase();
    if (dbRetryTimer) {
      clearInterval(dbRetryTimer);
      dbRetryTimer = null;
    }
  } catch (error) {
    console.error('Initial database connection warning:', error.message);
    if (!dbRetryTimer) {
      dbRetryTimer = setInterval(async () => {
        try {
          await connectDatabase();
          clearInterval(dbRetryTimer);
          dbRetryTimer = null;
          console.info('Database connected successfully on retry.');
        } catch {}
      }, 10_000);
      if (dbRetryTimer.unref) dbRetryTimer.unref();
    }
  }
}

await initDatabase();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`AI Mystery Room API listening on ${env.port}`);
});
