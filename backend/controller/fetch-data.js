const db = require("../database/database");

const averageData = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required" });
  }

  const query = `
          SELECT 
              date_stamp as date,
              AVG(temperature) as avg_temperature,
              AVG(humidity) as avg_humidity
          FROM 
              stg_incremental_load_rpi
          WHERE 
              (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
              AND date_stamp BETWEEN ? AND ?
          GROUP BY 
              date_stamp;
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

    const formattedResults = results.map((row) => ({
      date: row.date,
      avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
      avg_humidity: parseFloat(row.avg_humidity).toFixed(2),
    }));

    res.json(formattedResults);
  });
};

const detailedData = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required" });
  }

  // SQL query to fetch data based on the hour
  const query = `
          SELECT 
              date_stamp as date,
              time_stamp as time,
              temperature,
              humidity
          FROM 
              stg_incremental_load_rpi
          WHERE 
              (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
              AND date_stamp BETWEEN ? AND ?
          ORDER BY 
              date_stamp, time_stamp;
      `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Error retrieving data");
    }

    if (results.length === 0) {
      return res.status(404).send("No data found for the specified time range");
    }

    // Format results
    const formattedResults = results.map((row) => ({
      date: row.date,
      time: row.time,
      temperature: parseFloat(row.temperature).toFixed(2),
      humidity: parseFloat(row.humidity).toFixed(2),
    }));

    // Send response
    res.json(formattedResults);
  });
};

const dataByDate = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    res.status(400).send("Date parameter is required");
    return;
  }

  const query = `
          SELECT 
              time_stamp,
              temperature,
              humidity
          FROM 
              stg_incremental_load_rpi
          WHERE 
              date_stamp = ?
          ORDER BY 
              time_stamp
      `;

  db.query(query, [date], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Error retrieving data");
      return;
    }

    if (results.length === 0) {
      res.status(404).send("No data found for the specified date");
      return;
    }

    const formattedResults = results.map((row) => ({
      time_stamp: row.time_stamp,
      temperature: parseFloat(row.temperature).toFixed(2),
      humidity: parseFloat(row.humidity).toFixed(2),
    }));

    res.json(formattedResults);
  });
};

const deleteLocationData = (req, res) => {
  // Query to set the location column to NULL for all rows
  const query = `
    UPDATE stg_incremental_load_rpi
    SET location = NULL;
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error deleting location data:", err);
      res.status(500).send("Error deleting location data");
      return;
    }
    console.log(`Cleared location data from ${result.affectedRows} rows`);
    res.status(200).send(`${result.affectedRows} rows updated to clear location data`);
  });
};

const injectRandomLocID = (req, res) => {
  // Step 1: Retrieve all distinct dates
  const distinctDatesQuery = `
    SELECT DISTINCT date_stamp
    FROM stg_incremental_load_rpi
    WHERE location IS NULL OR location = '';
  `;

  db.query(distinctDatesQuery, (err, dates) => {
    if (err) {
      console.error("Error retrieving distinct dates:", err);
      res.status(500).send("Error retrieving distinct dates");
      return;
    }

    if (dates.length === 0) {
      res.status(404).send("No rows found to update");
      return;
    }

    // Step 2: Generate random location numbers for each date
    const updatePromises = dates.map(dateObj => {
      const randomLocation = Math.floor(Math.random() * 4) + 1;
      const updateQuery = `
        UPDATE stg_incremental_load_rpi
        SET location = ?
        WHERE date_stamp = ? AND (location IS NULL OR location = '');
      `;
      return new Promise((resolve, reject) => {
        db.query(updateQuery, [randomLocation, dateObj.date_stamp], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.affectedRows);
          }
        });
      });
    });

    // Step 3: Execute all updates and respond
    Promise.all(updatePromises)
      .then(results => {
        const totalUpdatedRows = results.reduce((sum, num) => sum + num, 0);
        console.log(`Updated ${totalUpdatedRows} rows with random values based on date`);
        res.status(200).send(`${totalUpdatedRows} rows updated with random values based on date`);
      })
      .catch(err => {
        console.error("Error updating location column:", err);
        res.status(500).send("Error updating location column");
      });
  });
};


const averageDataByLocation = async (req, res) => {
  const { startDate, endDate, location } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required" });
  }

  if (!location) {
    return res
      .status(400)
      .json({ error: "Location is required" });
  }

  const query = `
          SELECT 
              date_stamp as date,
              AVG(temperature) as avg_temperature,
              AVG(humidity) as avg_humidity
          FROM 
              stg_incremental_load_rpi
          WHERE 
              location = ?
              AND HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22)
              AND date_stamp BETWEEN ? AND ?
          GROUP BY 
              date_stamp;
      `;

  db.query(query, [location, startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Error retrieving data");
      return;
    }

    if (results.length === 0) {
      res.status(404).send("No data found for the specified time range");
      return;
    }

    const formattedResults = results.map((row) => ({
      date: row.date,
      avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
      avg_humidity: parseFloat(row.avg_humidity).toFixed(2),
    }));

    res.json(formattedResults);
  });
};

const dateByLocation = async (req, res) => {
  const { date, location } = req.query;

  // Check if both date and location parameters are provided
  if (!date || !location) {
    res.status(400).send("Date and location parameters are required");
    return;
  }

  const query = `
          SELECT 
              time_stamp,
              temperature,
              humidity
          FROM 
              stg_incremental_load_rpi
          WHERE 
              date_stamp = ? AND location = ?
          ORDER BY 
              time_stamp
      `;

  db.query(query, [date, location], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Error retrieving data");
      return;
    }

    if (results.length === 0) {
      res.status(404).send("No data found for the specified date and location");
      return;
    }

    const formattedResults = results.map((row) => ({
      time_stamp: row.time_stamp,
      temperature: parseFloat(row.temperature).toFixed(2),
      humidity: parseFloat(row.humidity).toFixed(2),
    }));

    res.json(formattedResults);
  });
};



const getLocationData = async (req, res)=> {
  const sql = 'SELECT locID, locName FROM location';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching location data:', err);
      return callback(err, null);
    }
    res.json( results);
  });
}



module.exports = {
  averageData,
  detailedData,
  dataByDate,
  injectRandomLocID,
  deleteLocationData,
  averageDataByLocation,
  getLocationData,
  dateByLocation,
};
