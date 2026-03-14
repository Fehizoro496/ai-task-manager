const http = require('http');
const config = require('./config/env');
const app = require('./app');
const { init: initSocket } = require('./socket');

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
