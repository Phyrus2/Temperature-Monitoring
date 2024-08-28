const express = require("express");
const cron = require("node-cron");
const cors = require("cors"); // Import cors module
const email = require("../backend/controller/email");
const data = require("../backend/controller/fetch-data");
const schedule = require("node-schedule");

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
      `Email sent successfully of ${moment()
        .tz("Asia/Makassar")
        .format("MMMM YYYY")}`
    );
  } catch (error) {
    console.error("Error sending email:", error);
  }
});

app.get("/test-email", (req, res) => {
  email.sendEmailForCurrentMonth(res, req, 5, 2024); // Example: Testing with June 2024
});
app.get("/average-data", data.averageData);
app.get("/detailed-data", data.detailedData);
app.get("/data-by-date", data.dataByDate);
app.post("/send-alert-email", email.sendAlertEmail);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
