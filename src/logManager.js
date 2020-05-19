// File to manage logging data points for analysis

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const dJSON = require('dirty-json');

let logPath = path.resolve(__dirname);
let dataPoints;

if (process.env.TRAIN) {
    // Log to log_training.json
    logPath += '/tradingLogs/log_train.json';
} else {
    // Log to log_shrimpy.json
    logPath += '/tradingLogs/log_shrimpy.json';
}

function logValue(value, actionTaken) {
    // Verifying file exists and creating it if not
    fs.access(logPath, fs.F_OK, (err) => {
        if (err) {
            // Need to create log file
            fs.writeFile(logPath, '[]', function (err) {
                if (err) throw err;
            });
        }
    });

    // Opening file and getting previous data to add to
    fs.readFile(logPath, (err, data) => {
        if (err) throw err;
        dataPoints = JSON.parse(data.toString());
        if (dataPoints === undefined) {
            dataPoints = [];
        }
        //console.log(dataPoints);

        // Adding the new data point and overriding the previous log file with the updated data
        dataPoints.push(
            {
                portfolioValue: value,
                action: actionTaken,
                time: new Date().toJSON()
            });
        fs.writeFile(logPath, JSON.stringify(dataPoints), (err) => {
            if (err) throw err;
        });
    });
}

function getMostRecentValue() {
    fs.readFile(logPath, (err, data) => {
        if (err) throw err;
        //dataPoints = JSON.parse(data);
        var dP = dJSON.parse(data);
        return dP[dP.length - 1].portfolioValue;
    });
}

function clearLog() {
    fs.writeFile(logPath, '[]', function (err) {
        if (err) throw err;
    });
}

module.exports = {
    logValue,
    getMostRecentValue,
    clearLog
};