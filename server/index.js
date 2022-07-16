const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

require('./src/discord');
require('./src/googleSheet');

const PORT = process.env.PORT || 3001;
const app = express();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

// Handle GET requests to /api route
const c4cat = require('./src/c4cat');
app.use('/api/c4cat', c4cat);

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
