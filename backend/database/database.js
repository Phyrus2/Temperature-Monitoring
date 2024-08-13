// database.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_rpi",
  connectTimeout: 60000, // Increase database connection timeout
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Database connected!");
});

module.exports = db;
