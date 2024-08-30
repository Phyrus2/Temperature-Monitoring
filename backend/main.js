const express = require("express");
const cron = require("node-cron");
const cors = require("cors"); // Import cors module
const email = require("../backend/controller/email");
const data = require("../backend/controller/fetch-data");
const schedule = require("node-schedule");
require('./logger'); // This will override console.log and console.error
const deleteLog = require("./deleteLog")

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());


setInterval(deleteLog, 86400000);

const rule = new schedule.RecurrenceRule();
rule.date = -1; // Last day of the month
rule.hour = 23; // 11 PM
rule.minute = 0; // 0 minutes
rule.tz = "Asia/Makassar"; // WITA timezone

schedule.scheduleJob(rule, async () => {
  try {
    await email.sendEmailForCurrentMonth();
    console.log(
      `Email sent successfully of ${moment()
        .tz("Asia/Makassar")
        .format("MMMM YYYY")}`
    );
  } catch (error) {
    console.error("Error sending email:", error);
  }
});

app.get("/test-email", (req, res) => {
  email.sendEmailForCurrentMonth(res, req, 5, 2024)
    .then(() => {
      console.log("Email sent successfully.");
      res.status(200).send("Email sent successfully.");
    })
    .catch(error => {
      console.error("Error sending email:", error);
      res.status(500).send("Error sending email.");
    });
});

app.get("/average-data", data.averageData);
app.get("/detailed-data", data.detailedData);
app.get("/data-by-date", data.dataByDate);
app.post("/send-alert-email", email.sendAlertEmail);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
