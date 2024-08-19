const express = require("express");
const cors = require("cors"); // Import cors module
const email = require("../backend/controller/email");
const data = require("../backend/controller/fetch-data");
const schedule = require("node-schedule");
const db = require("./database/database");

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const rule = new schedule.RecurrenceRule();
rule.date = -1; // Last day of the month
rule.hour = 23; // 11 PM
rule.minute = 0; // 0 minutes
rule.tz = "Asia/Makassar"; // WITA timezone

schedule.scheduleJob(rule, async () => {
  try {
    await email.sendEmailForCurrentMonth();
    console.log(
      `Email sent successfully on the 13th of ${moment()
        .tz("Asia/Makassar")
        .format("MMMM YYYY")}`
    );
  } catch (error) {
    console.error("Error sending email:", error);
  }
});

app.get("/average-data", data.averageData);
app.get("/detailed-data", data.detailedData);
app.get("/data-by-date", data.dataByDate);
app.post("/send-alert-email", email.sendAlertEmail);
app.get("/inject", data.injectRandomLocID);
app.post("/delete", data.deleteLocationData);
app.get("/average-location", data.averageDataByLocation);
app.get("/location", data.getLocationData);
app.get("/date-location", data.dateByLocation);
app.get("/detailed-location", data.detailDataByLocation);


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
































app.get("/test-email", (req, res) => {
  email.sendEmailForCurrentMonth(res, req, 5, 2024); // Example: Testing with June 2024
});

// inject dummy data
// Function to generate random temperature below 30 and humidity
function generateRandomTemperature() {
  const temp = Math.random() * 10 + 20; // Generates temperature between 20 and 30
  return parseFloat(temp.toFixed(2)); // Rounds to two decimal places, e.g., 22.00
}

function generateRandomHumidity() {
  const humidity = Math.random() * 50 + 30; // Generates humidity between 30 and 80
  return parseFloat(humidity.toFixed(2)); // Rounds to two decimal places, e.g., 30.00
}


// Route to inject dummy data
app.get('/dummy', (req, res) => {
  // First, get the last id_record from the database
  db.query('SELECT IFNULL(MAX(id_record), 0) AS last_id FROM stg_incremental_load_rpi', (err, results) => {
    if (err) {
      console.error('Error fetching last id_record:', err);
      res.status(500).send('Error fetching last id_record');
      return;
    }

    let lastId = results[0].last_id;

    const timeStamps = ['07:00:00', '10:00:00', '13:00:00', '16:00:00', '19:00:00', '22:00:00'];
    const locations = [1, 2, 3, 4];
    const currentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format

    // Insert data for each location and each time stamp
    locations.forEach(location => {
      timeStamps.forEach(timeStamp => {
        const temperature = generateRandomTemperature();
        const humidity = generateRandomHumidity();
        lastId++;

        const query = `
          INSERT INTO stg_incremental_load_rpi (id_record, temperature, humidity, date_stamp, time_stamp, location)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [lastId, temperature, humidity, currentDate, timeStamp, location];

        db.query(query, values, (err) => {
          if (err) {
            console.error('Error inserting dummy data:', err);
          }
        });
      });
    });

    res.send('Dummy data injection completed.');
  });
});

