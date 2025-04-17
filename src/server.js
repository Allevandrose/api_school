const http = require('http');
const app = require('./app');
const setupSocketIO = require('./config/socket'); // Remove {} here

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = setupSocketIO(server);

// Attach socket.io to all requests
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});