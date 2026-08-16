const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../BACKEND/.env') });
const app = require('../BACKEND/src/app');

module.exports = app;
