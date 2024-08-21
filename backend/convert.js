const fs = require('fs');
const path = require('path');

// Path to your image file
const imagePath = path.join(__dirname, '../assets/pepito-logo.png');

// Read the image file and convert it to base64
fs.readFile(imagePath, (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Convert to Base64 string
  const base64Image = data.toString('base64');
  console.log('Base64 String:', base64Image);
});
