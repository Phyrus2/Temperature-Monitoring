const db = require('../database/database');

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


module.exports = {
    averageData,
    detailedData,
    dataByDate,
};