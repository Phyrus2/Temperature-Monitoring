// logger.js
const fs = require('fs');
const path = require('path');

// Create a write stream (in append mode)
const logFile = fs.createWriteStream(path.join(__dirname, 'logs', 'combined.log'), { flags: 'a' });
const errorFile = fs.createWriteStream(path.join(__dirname, 'logs', 'error.log'), { flags: 'a' });

// Override console.log to also log to a file
const originalLog = console.log;
console.log = function (message, ...optionalParams) {
  logFile.write(new Date().toISOString() + ' - ' + message + '\n');
  originalLog.apply(console, [message, ...optionalParams]);
};

// Override console.error to also log to a file
const originalError = console.error;
console.error = function (message, ...optionalParams) {
  errorFile.write(new Date().toISOString() + ' - ' + message + '\n');
  originalError.apply(console, [message, ...optionalParams]);
};
