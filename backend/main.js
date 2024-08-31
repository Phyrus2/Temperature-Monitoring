const express = require("express");
const cron = require("node-cron");
const cors = require("cors"); // Import cors module
const email = require("../backend/controller/email");
const data = require("../backend/controller/fetch-data");
const schedule = require("node-schedule");
require('./logger'); // This will override console.log and console.error
const deleteLog = require("./deleteLog");
const moment = require('moment-timezone');

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());


setInterval(deleteLog, 86400000);

const cronExpression = '48 9 L * *'; // 9:45 PM on the last day of the month (21 in UTC is 9 in WITA)

schedule.scheduleJob(cronExpression, 'Asia/Makassar', async () => {
  try {
    await email.sendEmailForCurrentMonth();
    console.log(
      `Email sent successfully for ${moment()
        .tz("Asia/Makassar")
        .format("MMMM YYYY")}`
    );
  } catch (error) {
    console.error("Error sending email:", error);
  }
});


function scheduleLastDayOfMonthJob() {
  const now = moment().tz('Asia/Makassar'); // Current time in WITA
  const lastDayOfMonth = now.clone().endOf('month'); // Last day of the current month

  // If today is the last day of the month, schedule the job
  if (now.isSame(lastDayOfMonth, 'day')) {
    const jobTime = lastDayOfMonth.clone().hour(23).minute(0); // Set time to 9:45 PM WITA

    schedule.scheduleJob(jobTime.toDate(), async () => {
      try {
        await email.sendEmailForCurrentMonth();
        console.log(
          `Email sent successfully for ${moment()
            .tz("Asia/Makassar")
            .format("MMMM YYYY")}`
        );
      } catch (error) {
        console.error("Error sending email:", error);
      }
    });

    console.log(`Scheduled job for ${jobTime.format("MMMM Do YYYY, h:mm:ss a")}`);
  } else {
    console.log('Today is not the last day of the month; job not scheduled.');
  }
}

scheduleLastDayOfMonthJob();


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
