import { state } from "./config.js";

const drawTemperatureChart = (data, isSingleDay) => {
  const temperatures = data.map((row) =>
    parseFloat(row.temperature || row.avg_temperature)
  );
  const labels = data.map((row) =>
    isSingleDay
      ? row.time_stamp.slice(0, 5)
      : new Date(row.date).toLocaleDateString()
  );

  const temperatureChartOptions = {
    series: [
      {
        name: "Temperature",
        data: temperatures,
      },
    ],
    colors: ["rgba(255, 0, 0, 0.5)"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "area", // change to area to ensure the fill shows properly
      toolbar: {
        show: false,
      },
      width: "100%",
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.2,
        gradientToColors: ["#FF0000"], // end color of the gradient to red
        inverseColors: false,
        opacityFrom: 0.4, // starting opacity of the fill
        opacityTo: 0.2, // ending opacity of the fill
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
    stroke: {
      width: 2,
      curve: "smooth",
      colors: ["rgba(255, 0, 0, 0.6)"], // Ensure the stroke color matches the series color
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 50, // increased blur for more prominent shadow
        opacity: 1, // increased opacity for darker shadow
        color: "#FF0000", // Change shadow color to red
      },
    },
    markers: {
      size: 4,
      colors: "#fff",

      strokeColors: ["rgba(255, 0, 0, 0.6)"], // Change marker stroke color to red
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: labels,
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
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      padding: {
        bottom: -10, // Remove extra space only at the bottom
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
  };

  if (state.temperatureChart) {
    state.temperatureChart.updateOptions(temperatureChartOptions);
  } else {
    const temperatureChartSelector =
      document.querySelector("#chartTemperature");
    if (temperatureChartSelector) {
      state.temperatureChart = new ApexCharts(
        temperatureChartSelector,
        temperatureChartOptions
      );
      state.temperatureChart.render();
    }
  }
};

const drawHumidityChart = (data, isSingleDay) => {
  const humidity = data.map((row) =>
    parseFloat(row.humidity || row.avg_humidity)
  );
  const labels = data.map((row) =>
    isSingleDay
      ? row.time_stamp.slice(0, 5)
      : new Date(row.date).toLocaleDateString()
  );

  const humidityChartOptions = {
    series: [
      {
        name: "Humidity",
        data: humidity,
      },
    ],
    colors: ["rgba(0, 128, 0, 0.5)"], // Warna garis hijau dengan opacity 50%
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "area", // Mengubah tipe grafik menjadi area
      toolbar: {
        show: false,
      },
      width: "100%",
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.2,
        gradientToColors: ["#008000"], // Warna akhir gradasi hijau
        inverseColors: false,
        opacityFrom: 0.4, // Opasitas awal dari fill
        opacityTo: 0.2, // Opasitas akhir dari fill
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
    stroke: {
      width: 2,
      curve: "smooth",
      colors: ["rgba(0, 128, 0, 0.6)"], // Warna garis dengan opacity 60%
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 50, // Blur yang lebih tinggi untuk shadow lebih menonjol
        opacity: 1, // Opasitas yang lebih tinggi untuk shadow lebih gelap
        color: "#008000", // Warna shadow hijau
      },
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: ["rgba(0, 128, 0, 0.6)"], // Warna stroke marker hijau dengan opacity 60%
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: labels,
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
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      padding: {
        bottom: -10, // Remove extra space only at the bottom
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
  };

  if (state.humidityChart) {
    state.humidityChart.updateOptions(humidityChartOptions);
  } else {
    const humidityChartSelector = document.querySelector("#chartHumidity");
    if (humidityChartSelector) {
      state.humidityChart = new ApexCharts(
        humidityChartSelector,
        humidityChartOptions
      );
      state.humidityChart.render();
    }
  }
};

function renderDetailedTable(data) {
  const tableBody = document.getElementById("data-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  // Define the times that should appear in the table
  const times = [
    "07:00:00",
    "10:00:00",
    "13:00:00",
    "16:00:00",
    "19:00:00",
    "22:00:00",
  ];

  // Helper function to get time in HH:00:00 format
  const formatTime = (time) => time.split(":").slice(0, 2).join(":") + ":00";

  // Group the data by date and time range
  const groupedData = data.reduce((acc, curr) => {
    const date = new Date(curr.date).toLocaleDateString();
    const timeFormatted = formatTime(curr.time);
    const hour = parseInt(curr.time.split(":")[0], 10);

    // Initialize the data structure if it doesn't exist
    if (!acc[date]) {
      acc[date] = {
        "07:00:00": { temperature: "-", humidity: "-" },
        "10:00:00": { temperature: "-", humidity: "-" },
        "13:00:00": { temperature: "-", humidity: "-" },
        "16:00:00": { temperature: "-", humidity: "-" },
        "19:00:00": { temperature: "-", humidity: "-" },
        "22:00:00": { temperature: "-", humidity: "-" },
      };
    }

    // Check if the time is within the range of the nearest hour slots
    times.forEach((time) => {
      const timeHour = parseInt(time.split(":")[0], 10);
      if (hour >= timeHour - 1 && hour <= timeHour + 1) {
        acc[date][time] = {
          temperature: curr.temperature,
          humidity: curr.humidity,
        };
      }
    });

    return acc;
  }, {});

  // Create a row for each date
  Object.keys(groupedData).forEach((date) => {
    const divRow = document.createElement("div");
    divRow.className =
      "grid grid-cols-7 border-t border-stroke dark:border-strokedark px-4 py-4.5 md:px-6 2xl:px-7.5";

    // Create and append the date column with right border
    const dateDiv = document.createElement("div");
    dateDiv.className =
      "col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark";
    dateDiv.textContent = date;
    divRow.appendChild(dateDiv);

    // Create and append the time slots with right border, except the last one
    times.forEach((time, index) => {
      const timeDiv = document.createElement("div");
      // Add a right border to all columns except the last one
      timeDiv.className = `col-span-1 flex items-center justify-center ${
        index !== times.length - 1 ? "border-r" : ""
      } border-stroke dark:border-strokedark`;
      const dataEntry = groupedData[date][time];
      timeDiv.textContent = `${dataEntry.temperature}/${dataEntry.humidity}`;
      divRow.appendChild(timeDiv);
    });

    tableBody.appendChild(divRow);
  });
}

export { drawTemperatureChart, drawHumidityChart, renderDetailedTable };
