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





app.get('/check-alerts', async (req, res) => {
  const threshold = 30; // Temperature threshold for alert
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start date and end date are required" });
  }

  try {
    // Query to get temperature and humidity data along with location names
    const query = `
      SELECT 
        l.locName as locationName,
        s.location,
        s.time_stamp,
        s.temperature,
        s.humidity
      FROM 
        stg_incremental_load_rpi s
      JOIN 
        location l ON s.location = l.locID
      WHERE 
        s.date_stamp BETWEEN ? AND ?
        AND HOUR(s.time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22)
      ORDER BY 
        s.location, s.date_stamp, s.time_stamp;
    `;

    db.query(query, [startDate, endDate], (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Error retrieving data");
        return;
      }

      if (results.length === 0) {
        res.status(404).send("No data found for the specified time range");
        return;
      }

      // Filter locations with temperature exceeding the threshold
      const alerts = results.filter(row => parseFloat(row.temperature) > threshold);

      if (alerts.length > 0) {
        res.status(200).json(alerts);
      } else {
        res.status(200).json({ message: 'No alerts triggered.' });
      }
    });
  } catch (err) {
    console.error("Error checking alerts:", err);
    res.status(500).send("Error checking alerts");
  }
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

