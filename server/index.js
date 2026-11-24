const app = require('./app');
const config = require('./utils/config');
const { initDb, close } = require('./db');

let server;

initDb().then(() => {
  server = app.listen(config.port, () => {
    console.log(`Shop with Vikky API listening on port ${config.port}`);
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

function shutdown() {
  if (!server) {
    close().finally(() => process.exit(0));
    return;
  }
  server.close(() => {
    close().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
