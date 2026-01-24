// core/config.js
// This file always loads the user's config from the USER repo

const path = require('path');

const userConfigPath = process.env.USER_CONFIG
  ? process.env.USER_CONFIG
  : path.join(__dirname, '../config');

try {
  module.exports = require(userConfigPath);
  console.log('✅ User config loaded from:', userConfigPath);
} catch (err) {
  console.error('❌ Failed to load user config!');
  console.error('Expected path:', userConfigPath);
  console.error(err);
  process.exit(1);
}
