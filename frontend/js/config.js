// config.js

// Global variables
export let chart;
export let errorDisplayed = false; // Flag to track if an error has been displayed
export let lastValidStartDate= null;
export let lastValidEndDate= null;
export let hasError = false;
export let emailSent = false; // Flag to ensure the email is only sent once
export let temperatureChart, humidityChart;
export let userInteracted = false;
export let lastTemperature = null;
export let alertInterval = null;
export let audioReady = false;

export let lastAlertTimestamp = null;

export const state = {
    chart: null,
    errorDisplayed: false,
    lastValidStartDate: null,
    lastValidEndDate: null,
    hasError: false,
    emailSent: false,
    temperatureChart: null,
    humidityChart: null,
    userInteracted: false,
    lastTemperature: null,
    alertInterval: null,
    audioReady: false,
    audio: document.getElementById('alert-sound'),
    lastAlertTimestamp: null,
};

