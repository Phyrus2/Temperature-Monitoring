// cleanupLogs.js
const fs = require('fs');
const path = require('path');

// Define the log directory and file names
const logDir = path.join(__dirname, 'logs');

// Define the maximum age for logs (in milliseconds) - 7 days
const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

// Function to delete old log files
function deleteOldLogs() {
  fs.readdir(logDir, (err, files) => {
    if (err) {
      console.error(`Error reading log directory: ${err.message}`);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(logDir, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for file ${file}: ${err.message}`);
          return;
        }

        const fileAge = Date.now() - stats.mtimeMs;

        // Check if file is older than maxAge
        if (fileAge > maxAge) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error(`Error deleting file ${file}: ${err.message}`);
            } else {
              console.log(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
}

// Export the function to use it in other files
module.exports = deleteOldLogs;
