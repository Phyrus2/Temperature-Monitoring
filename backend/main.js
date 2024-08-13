const express = require("express");
const cron = require("node-cron");
const cors = require("cors"); // Import cors module
const email = require("../backend/controller/email");
const data = require("../backend/controller/fetch-data");

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

cron.schedule(
  "26 10 1 1 *",
  async () => {
    try {
      email.sendPreviousEmail;
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  },
  {
    timezone: "Asia/Makassar", // Adjust to WITA timezone
  }
);

// app.get("/test-email", async (req, res) => {
//   try {
//     email.sendPreviousEmail; // Call email sending function
//     res.send("Email sent successfully");
//   } catch (error) {
//     console.error("Error in test email endpoint:", error);
//     res.status(500).send("Failed to send email");
//   }
// });


app.get("/test-email", (req, res) => {
    email.sendEmailForPreviousMonth(res, req, 5, 2024); // Example: Testing with June 2024
  });
app.get("/average-data",data.averageData);
app.get("/detailed-data",data.detailedData);
app.get("/data-by-date", data.dataByDate);
app.post("/send-alert-email",email.sendAlertEmail);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
