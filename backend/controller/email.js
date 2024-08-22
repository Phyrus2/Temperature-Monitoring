const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const fs = require("fs"); // Import the fs module
const db = require("../database/database");
require('dotenv').config();

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS, // Replace with actual password
  },
  logger: true,
  debug: true,
});

async function generatePdf(
  humidityData,
  temperatureData,
  labelsData,
  tableData,
  month,
  year,
  location
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  const floatHumidityData = humidityData.map((value) => parseFloat(value));
  const floatTemperatureData = temperatureData.map((value) =>
    parseFloat(value)
  );
  const stringLabels = labelsData.map((date) => new Date(date).toISOString());

  const times = [
    "07:00:00",
    "10:00:00",
    "13:00:00",
    "16:00:00",
    "19:00:00",
    "22:00:00",
  ];

  const groupedData = tableData.reduce((acc, curr) => {
    const date = new Date(curr.date).toLocaleDateString();
    const time = curr.time;

    if (!acc[date]) {
      acc[date] = {};
      times.forEach((timeSlot) => {
        acc[date][timeSlot] = { temperature: "-", humidity: "-" };
      });
    }

    let nearestTimeSlot = times.reduce((prev, currSlot) => {
      const prevDiff = Math.abs(
        new Date(`1970-01-01T${prev}Z`).getTime() -
          new Date(`1970-01-01T${time}Z`).getTime()
      );
      const currDiff = Math.abs(
        new Date(`1970-01-01T${currSlot}Z`).getTime() -
          new Date(`1970-01-01T${time}Z`).getTime()
      );
      return currDiff < prevDiff ? currSlot : prev;
    });

    if (nearestTimeSlot) {
      acc[date][nearestTimeSlot] = {
        temperature: curr.temperature !== null ? curr.temperature : "-",
        humidity: curr.humidity !== null ? curr.humidity : "-",
      };
    }

    return acc;
  }, {});

  let tableHtml = `
      <div class="table-container">
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark shadow-lg">
          <div class="px-4 py-6 md:px-6 xl:px-7.5 bg-yellow-200">
            <h4 class="text-xl font-bold text-black dark:text-white justify-center items-center flex">Data List</h4>
          </div>
  
          <div class="grid grid-cols-7 border-t border-stroke dark:border-strokedark px-4 py-4.5 md:px-6 2xl:px-7.5">
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark text-sm">
              <p class="font-medium"></p>
            </div>
            <div class="col-span-6 flex items-center justify-center border-stroke dark:border-strokedark text-sm">
              <p class="font-medium">Temperature/Humidity</p>
            </div>
          </div>
  
          <div class="grid grid-cols-7 border-t border-stroke dark:border-strokedark px-4 py-4.5 md:px-6 2xl:px-7.5 text-sm">
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
              <p class="font-medium">Date</p>
            </div>
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
              <p class="font-medium">07:00</p>
            </div>
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
              <p class="font-medium">10:00</p>
            </div>
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
              <p class="font-medium">13:00</p>
            </div>
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
              <p class="font-medium">16:00</p>
            </div>
            <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
              <p class="font-medium">19:00</p>
            </div>
            <div class="col-span-1 flex items-center justify-center">
              <p class="font-medium">22:00</p>
            </div>
          </div>
  
          <div id="data-table-body">`;

  Object.keys(groupedData).forEach((date) => {
    tableHtml += `
        <div class="grid grid-cols-7 border-t border-stroke dark:border-strokedark px-4 py-4.5 md:px-6 2xl:px-7.5 text-xs">
          <div class="col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark">
            ${date}
          </div>`;
    times.forEach((time, index) => {
      const dataEntry = groupedData[date][time];
      tableHtml += `
          <div class="col-span-1 flex items-center justify-center ${
            index !== times.length - 1
              ? "border-r border-stroke dark:border-strokedark"
              : ""
          }">
            ${dataEntry.temperature}/${dataEntry.humidity}
          </div>`;
    });
    tableHtml += `</div>`;
  });

  tableHtml += `
          </div>
        </div>
      </div>`;

      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Data Report</title>
          <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
          <style>
            .container {
              width: 100%;
              max-width: 100%;
            }
          </style>
        </head>
        <body class="font-sans">
          <div class="container p-0">
            <h1 class="text-4xl font-bold text-center">TEMPERATURE & HUMIDITY SERVER MONITORING</h1>
            <h2 class="text-center text-xl uppercase">PERIOD: ${month} ${year}</h2>
            <h2 class="text-left mb-2 ml-10 text-md uppercase">LOCATION: ${location}</h2>
      
            <div class="flex">
              <div class=" w-1/2 ml-10">
                ${tableHtml}
              </div>
      
              <div class="flex flex-col w-1/2 mr-10">
                <!-- Temperature Chart -->
                <div class="chart-container flex-grow rounded-sm border border-stroke bg-white px-5 pt-7.5 shadow-lg dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                  <div class="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                    <div class="flex w-full flex-wrap gap-3 sm:gap-5">
                      <div class="flex min-w-47.5"></div>
                    </div>
                  </div>
                  <div>
                    <div id="temperatureChart" class="-ml-5" style="width: 100%; height: 100%;"></div>
                  </div>
                </div>
      
                <!-- Humidity Chart -->
                <div class="chart-container flex-grow rounded-sm border border-stroke bg-white px-5 pt-7.5 shadow-lg dark:border-strokedark dark:bg-boxdark sm:px-7.5">
                  <div class="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                    <div class="flex w-full flex-wrap gap-3 sm:gap-5">
                      <div class="flex min-w-47.5"></div>
                    </div>
                  </div>
                  <div>
                    <div id="humidityChart" class="-ml-5" style="width: 100%; height: 100%;"></div>
                  </div>
                </div>
              </div>
            </div>
           <div class="text-sm text-gray-700 text-center mt-5">
              X-axis: Date | Y-axis: Temperature (°C) / Humidity (%)
          </div>
          </div>
        </body>
        </html>
      `);
      
      

  await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/apexcharts" });

  await page.evaluate(
    (humidityData, temperatureData, labels) => {
      const createChart = (
        selector,
        seriesName,
        data,
        color,
        annotationText,
        gradient
      ) => {
        // Ensure labels array contains only dates in "dd/MM/yyyy" format
        const formattedLabels = labels.map((label) => {
          const date = new Date(label);
          return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            
          });
        });
      
        const options = {
          series: [
            {
              name: seriesName,
              data: data,
            },
          ],
          colors: [color],
          chart: {
            fontFamily: "Satoshi, sans-serif",
            type: "area",
            toolbar: {
              show: false,
            },
            width: "500px",
            height: "auto",
            animations: {
              enabled: false,
            },
          },
          xaxis: {
            type: "category",
            categories: formattedLabels,
            labels: {
              show: true,
              rotate: -45,
              style: {
                fontWeight: "normal",
                fontSize: "10px",
              },
            },
            axisBorder: {
              show: false,
            },
            axisTicks: {
              show: false,
            },
          },
          yaxis: {
            title: {
              style: {
                fontSize: "0px",
              },
            },
            min: Math.min(...data) - 2, // Adjust min value to avoid extra space
          },
          stroke: {
            width: 2,
            curve: "smooth",
            colors: [color],
            dropShadow: {
              enabled: true,
              top: 0,
              left: 0,
              blur: 50,
              opacity: 1,
              color: gradient,
            },
          },
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.2,
              gradientToColors: [gradient],
              inverseColors: false,
              opacityFrom: 0.4,
              opacityTo: 0.2,
              stops: [0, 90, 100],
            },
          },
          responsive: [
            {
              breakpoint: 1024,
              options: {
                chart: {
                  height: 300,
                },
              },
            },
            {
              breakpoint: 1366,
              options: {
                chart: {
                  height: 350,
                },
              },
            },
          ],
          markers: {
            size: 4,
            colors: "#fff",
            strokeColors: [color],
            strokeWidth: 3,
            strokeOpacity: 0.9,
            strokeDashArray: 0,
            fillOpacity: 1,
            hover: {
              size: undefined,
              sizeOffset: 5,
            },
          },
          dataLabels: {
            enabled: false,
          },
          tooltip: {
            x: {
              format: "dd", // Tooltip format
            },
          },
          grid: {
            padding: {
              bottom: 0, // Remove extra space only at the bottom
            },
            xaxis: {
              lines: {
                show: true,
              },
            },
            yaxis: {
              lines: {
                show: true,
              },
            },
          },
          annotations: {
            position: "back",
            xaxis: [
              {
                x: formattedLabels[Math.floor(formattedLabels.length / 2)],
                borderColor: "transparent",
                label: {
                  text: annotationText,
                  style: {
                    color: color,
                    fontSize: "14px",
                    fontWeight: "bold",
                    background: "transparent",
                  },
                  offsetX: 0,
                  offsetY: -20,
                  orientation: "horizontal",
                },
              },
            ],
          },
        };
      
        const chart = new ApexCharts(document.querySelector(selector), options);
        chart.render();
      };
      
      
      
      
      
      

      createChart(
        "#humidityChart",
        "Humidity",
        humidityData,
        "rgba(0, 128, 0, 0.5)",
        "Humidity",
        "#008000"
      );
      createChart(
        "#temperatureChart",
        "Temperature",
        temperatureData,
        "rgba(255, 0, 0, 0.5)",
        "Temperature",
        "#FF0000"
      );
    },
    floatHumidityData,
    floatTemperatureData,
    stringLabels
  );

  await page.pdf({
    path: `../assets/Monthly Reports/${location}_Monthly_Report.pdf`,
    format: "A4",
    landscape: true,
    printBackground: true,
  });

  await browser.close();
}

// const sendEmailForPreviousMonth = async (res, req, testMonth, testYear) => {
//   const now = new Date();
//   const currentMonth = testMonth || now.getMonth() + 1; // Use testMonth if provided, else current month
//   const currentYear = testYear || now.getFullYear(); // Use testYear if provided, else current year
//   let previousMonth;
//   let year;

//   if (currentMonth === 1) {
//     // If current month is January, previous month is December of last year
//     previousMonth = 12;
//     year = currentYear - 1;
//   } else {
//     // Previous month is current month - 1
//     previousMonth = currentMonth - 1;
//     year = currentYear;
//   }

//   const avgSql = `
//       SELECT 
//         DATE(date_stamp) as date,
//         AVG(temperature) as avg_temperature,
//         AVG(humidity) as avg_humidity
//       FROM 
//         stg_incremental_load_rpi
//       WHERE 
//         (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
//         AND MONTH(date_stamp) = ? AND YEAR(date_stamp) = ?
//       GROUP BY 
//         DATE(date_stamp);
//     `;

//   const detailSql = `
//       SELECT 
//         date_stamp as date,
//         time_stamp as time,
//         temperature,
//         humidity
//       FROM 
//         stg_incremental_load_rpi
//       WHERE 
//         (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
//         AND date_stamp BETWEEN ? AND ?
//       ORDER BY 
//         date_stamp, time_stamp;
//     `;

//   const startDate = `${year}-${previousMonth.toString().padStart(2, "0")}-01`;
//   const endDate = `${year}-${previousMonth
//     .toString()
//     .padStart(2, "0")}-${new Date(year, previousMonth, 0).getDate()}`;

//   db.query(avgSql, [previousMonth, year], async (err, avgResults) => {
//     if (err) {
//       console.error("Error fetching average data for email:", err);
//       return;
//     }
//     const formattedAvgResults = avgResults.map((row) => ({
//       date: row.date,
//       avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
//       avg_humidity: parseFloat(row.avg_humidity).toFixed(2),
//     }));

//     db.query(detailSql, [startDate, endDate], async (err, detailResults) => {
//       if (err) {
//         console.error("Error fetching detailed data for email:", err);
//         return;
//       }
//       const formattedDetailResults = detailResults.map((row) => ({
//         date: row.date,
//         time: row.time,
//         temperature: parseFloat(row.temperature).toFixed(2),
//         humidity: parseFloat(row.humidity).toFixed(2),
//       }));

//       console.log("Formatted Average Results:", formattedAvgResults);
//       console.log("Formatted Detailed Results:", formattedDetailResults);

//       try {
//         const humidityData = formattedAvgResults.map((row) => row.avg_humidity);
//         const temperatureData = formattedAvgResults.map(
//           (row) => row.avg_temperature
//         );
//         const labels = formattedAvgResults.map((row) => row.date);

//         console.log("Humidity Data:", humidityData);
//         console.log("Temperature Data:", temperatureData);
//         console.log("Labels:", labels);

//         const monthName = getMonthName(previousMonth);
//         await generatePdf(
//           humidityData,
//           temperatureData,
//           labels,
//           formattedDetailResults,
//           monthName,
//           year
//         );

//         const pdfBuffer = await fs.promises.readFile(
//           "../assets/Montly Report.pdf"
//         );

        
        
//         let mailOptions = {
//           from: '"PEPITO THCheck" <alerts@yourdomain.com>',
//           to: recipients,
//           subject: `Monthly Temperature and Humidity Report for ${getMonthName(
//             previousMonth
//           )} ${year}`,
//           html: `
//               <html>
//                 <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
//                   <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    
//                     <header style="text-align: center; margin-bottom: 20px;">
//                       <h1>Monthly Temperature and Humidity Report</h1>
//                       <h2 style="color: #555;">${getMonthName(
//                         previousMonth
//                       )} ${year}</h2>
//                     </header>
          
//                     <main>
//                       <p style="font-size: 16px; margin-bottom: 20px;">
//                         Dear Administrator,
//                       </p>
//                       <p style="font-size: 16px; margin-bottom: 20px;">
//                         Please find the attached charts and table for the monthly temperature and humidity data. The report provides detailed insights into the temperature and humidity levels recorded throughout the month.
//                       </p>
//                       <p style="font-size: 16px; margin-bottom: 20px;">
//                         We encourage you to review the data to ensure optimal conditions are maintained.
//                       </p>
//                       <p style="font-size: 16px; font-weight: bold;">
//                         Attachment: Report for ${getMonthName(
//                           previousMonth
//                         )} ${year}
//                       </p>
//                     </main>
          
//                     <footer style="margin-top: 30px; text-align: center; color: #888;">
//                       <p style="font-size: 14px;">PEPITO THCheck</p>
//                       <p style="font-size: 14px;">Monitoring & Alerts Team</p>
//                       <p style="font-size: 14px;">
//                         <a href="mailto:pepitoTHCheck@gmail.com" style="color: #0073e6; text-decoration: none;">PEPITO THCheck Support</a>
//                       </p>
//                     </footer>
          
//                   </div>
//                 </body>
//               </html>
//             `,
//           attachments: [
//             {
//               filename: `${getMonthName(previousMonth)} Report.pdf`,
//               content: pdfBuffer,
//               contentType: "application/pdf",
//             },
//           ],
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//           if (error) {
//             console.error("Error sending email:", error);
//             return;
//           }
//           console.log("Email sent: " + info.response);
//         });
//       } catch (error) {
//         console.error("Error generating PDF or sending email:", error);
//       }
//     });
//   });
// };

const sendEmailForCurrentMonth = async (req, res, testMonth, testYear) => {
  const now = new Date();
  const currentMonth = testMonth || now.getMonth() + 1;
  const currentYear = testYear || now.getFullYear();

  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`;
  const endDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${new Date(currentYear, currentMonth, 0).getDate()}`;

  const avgSql = `
    SELECT 
      DATE(date_stamp) as date,
      AVG(temperature) as avg_temperature,
      AVG(humidity) as avg_humidity,
      l.locName as location
    FROM 
      stg_incremental_load_rpi s
      JOIN location l ON s.location = l.locID
    WHERE 
      (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
      AND MONTH(date_stamp) = ? AND YEAR(date_stamp) = ?
    GROUP BY 
      DATE(date_stamp), l.locName;
  `;

  const detailSql = `
    SELECT 
      date_stamp as date,
      time_stamp as time,
      temperature,
      humidity,
      l.locName as location
    FROM 
      stg_incremental_load_rpi s
      JOIN location l ON s.location = l.locID
    WHERE 
      (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
      AND date_stamp BETWEEN ? AND ?
      AND l.locName = ?
    ORDER BY 
      date_stamp, time_stamp;
  `;

  try {
    // Fetch distinct location names
    const locations = await new Promise((resolve, reject) => {
      db.query('SELECT DISTINCT locName as location FROM location l JOIN stg_incremental_load_rpi s ON l.locID = s.location', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const attachments = await Promise.all(locations.map(async (loc) => {
      const location = loc.location;

      const avgResults = await new Promise((resolve, reject) => {
        db.query(avgSql, [currentMonth, currentYear], (err, results) => {
          if (err) reject(err);
          else resolve(results.filter(row => row.location === location));
        });
      });

      const formattedAvgResults = avgResults.map((row) => ({
        date: row.date,
        avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
        avg_humidity: parseFloat(row.avg_humidity).toFixed(2),
      }));

      const detailResults = await new Promise((resolve, reject) => {
        db.query(detailSql, [startDate, endDate, location], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const formattedDetailResults = detailResults.map((row) => ({
        date: row.date,
        time: row.time,
        temperature: parseFloat(row.temperature).toFixed(2),
        humidity: parseFloat(row.humidity).toFixed(2),
      }));

      const humidityData = formattedAvgResults.map((row) => row.avg_humidity);
      const temperatureData = formattedAvgResults.map((row) => row.avg_temperature);
      const labels = formattedAvgResults.map((row) => row.date);

      const monthName = getMonthName(currentMonth);
      await generatePdf(
        humidityData,
        temperatureData,
        labels,
        formattedDetailResults,
        monthName,
        currentYear,
        location
      );

      const pdfBuffer = await fs.promises.readFile(`../assets/Monthly Reports/${location}_Monthly_Report.pdf`);

      return {
        filename: `${location}_${getMonthName(currentMonth)}_Report.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      };
    }));
    const recipients = process.env.RECEPIENT.split(',').map(email => email.trim());
    const mailOptions = {
      from: '"PEPITO THCheck" <alerts@yourdomain.com>',
      to: recipients,
      subject: `Monthly Temperature and Humidity Reports - ${getMonthName(currentMonth)} ${currentYear}`,
      html: `
         <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="cid:logoImage" alt="PEPITO THCheck Logo" style="max-width: 150px;" />
              </div>
    
              <!-- Header -->
              <header style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px; color: #333;">Monthly Temperature and Humidity Report</h1>
                <h2 style="font-size: 20px; color: #555;">${getMonthName(currentMonth)} ${currentYear}</h2>
              </header>
      
              <!-- Main Content -->
              <main>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Dear Administrator,
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Please find the attached charts and table for the monthly temperature and humidity data. The report provides detailed insights into the temperature and humidity levels recorded throughout the month.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  We encourage you to review the data to ensure optimal conditions are maintained.
                </p>
                <p style="font-size: 16px; font-weight: bold; margin-bottom: 20px;">
                  Attachment: Report for ${getMonthName(currentMonth)} ${currentYear}
                </p>
              </main>
      
              <!-- Footer -->
              <footer style="text-align: center; margin-top: 30px; color: #888;">
                <p style="font-size: 14px;">PEPITO THCheck</p>
                <p style="font-size: 14px;">Monitoring & Alerts Team</p>
                <p style="font-size: 14px;">
                  <a href="mailto:pepitoTHCheck@gmail.com" style="color: #0073e6; text-decoration: none;">PEPITO THCheck Support</a>
                </p>
              </footer>
      
            </div>
          </body>
        </html>
      `,
      
       
      attachments: [
        ...attachments,
        {
          filename: 'pepito-logo.png', 
          path: '../assets/pepito-logo.png', 
          cid: 'logoImage' 
        }
      ]
    };


    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          reject(error);
        } else {
          console.log("Email sent: " + info.response);
          resolve(info.response);
        }
      });
    });

    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Error in processing:", error);
  }
};




function getMonthName(monthNumber) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNumber - 1];
}

const sendAlertEmail = async (req, res) => {
  const { locationDetails, date } = req.body;

  if (!locationDetails || !date) {
    return res.status(400).send("Missing location details or date");
  }

  // Convert the HTML string into plain text and handle location and temperature separately
  const formattedLocationDetails = locationDetails.split("</p>").map(detail => {
    if (!detail.trim()) return ''; // Skip empty details

    // Use regex to extract location and temperature, if available
    const locationMatch = detail.match(/<strong>Location:<\/strong>\s*([^,]+)/i);
    const temperatureMatch = detail.match(/<strong>Temperature:<\/strong>\s*([^<]+)/i);

    // Extract location and temperature, or set fallback for missing temperature
    const location = locationMatch ? `Location: ${locationMatch[1].trim()}` : "Location: Unknown";
    const temperature = temperatureMatch ? `Temperature: ${temperatureMatch[1].trim()}` : "Temperature: N/A";

    return `
      <div style="font-size: 16px; font-weight: bold; margin: 5px 0;">
        ${location}<br/>
        ${temperature}
      </div>
    `;
  }).join("");

  const mailOptions = {
    from: '"PEPITO THCheck" <alerts@yourdomain.com>',
    to: "yudamulehensem@gmail.com",
    subject: "⚠️ Urgent Temperature Alert!",
    html: `
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
            
            <!-- Logo -->
            <div style="text-align: center;">
              <img src="cid:logoImage" alt="PEPITO THCheck Logo" style="max-width: 150px;" />
            </div>
            
            <!-- Header -->
            <header style="margin-bottom: 20px;">
              <h2 style="color: #ff0000; font-size: 28px;">⚠️ Temperature Exceeds Threshold!</h2>
            </header>
    
            <!-- Main Content -->
            <main>
              ${formattedLocationDetails}
              <p style="font-size: 16px; margin-top: 20px;"><strong>Recorded At:</strong> ${date}</p>
              <p style="font-size: 16px; font-weight: bold; color: #ff0000;">Immediate action is required to address the high temperature!</p>
              <p style="font-size: 16px;">For further assistance, please contact the Temperature Monitoring team.</p>
            </main>
    
            <!-- Footer -->
            <footer style="margin-top: 30px; color: #888;">
              <p style="font-size: 12px;">PEPITO THCheck, All rights reserved.</p>
            </footer>
    
          </div>
        </body>
      </html>
      `,
      attachments: [
        
        {
          filename: 'pepito-logo.png', 
          path: '../assets/pepito-logo.png', 
          cid: 'logoImage' 
        }
      ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).send("Failed to send email");
    }
    console.log("Email sent:", info.response);
    res.send("Email sent successfully");
  });
};
















module.exports = {
  // sendEmailForPreviousMonth,
  sendEmailForCurrentMonth,
  sendAlertEmail,
};
