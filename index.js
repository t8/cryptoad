// File to manage trading intervals and execute trades

require('dotenv').config();
const fs = require('fs');
const trainingManager = require('./src/trainingManager');
const shrimpyManager = require('./src/shrimpyManager');
const logManager = require('./src/logManager');

let interval = parseFloat(process.env.IMAX);
let entryAmount,                            // Value of the currency when the bot started in USD
    totalGains,                             // Total amount the portfolio increased/decreased while bot was online
    fee,                                    // Fee for trading in the given exchange
    oldValue,                               // f(x)|t-i     --> Tracker for the value at time (t) - interval (i)
    newValue,                               // f(x)|t       --> Tracker for the current value of the portfolio
    oldValueROT,                            // f'(x)|t-i    --> Previous rate of change of the value of the portfolio
    newValueROT,                            // f'(x)|t      --> Current rate of change of the value of the portfolio
    valueROTROT = Number;                   // f''(x)       --> Rate of change of the rate of change of the value
let stabilized = false;                     // Boolean value to prevent the bot from re-stabilizing if portfolio is already stable

function initialize() {
    if (process.env.TRAIN) {
        // Generate entry data
        entryAmount = 5000;
        fee = 0.005;
    } else {
        // Get entry data
    }
    oldValue = entryAmount;
    oldValueROT = 0;
    setTimeout(loop, interval * 1000);
    console.log("Initialized");
}

async function loop() {
    if (!stabilized) {
        newValue = await getCurrentPrice();
    }
    newValueROT = (newValue - oldValue) / interval * 1000;
    valueROTROT = (newValueROT - oldValueROT) / interval * 1000;
    // console.log("Old value: " + oldValue);
    // console.log("Old valueROT: " + oldValueROT);
    // console.log("New value: " + newValue);
    // console.log("New valueROT: " + newValueROT);
    // console.log("New valueROTROT: " + valueROTROT);

    if (valueROTROT < 0) {
        // Decrease the interval to check more rapidly --> Approaching the top of the "curve"
        if (interval > parseFloat(process.env.IMIN)) {
            interval -= parseFloat(process.env.ISTEP);
        }
    }

    // (measured - true) / true --> Percent error, or in this case, percent change
    var percentChange = ((newValue - (newValue * fee)) - oldValue) / oldValue;
    var actionTaken = "nothing";
    if (percentChange >= 0) {
        // TRADE
        console.log("CHOOSING TO TRADE");

        await trade();
        interval = parseFloat(process.env.IMAX);
        actionTaken = "trade";
        stabilized = false;
    } else if (newValueROT < 0 && percentChange < parseFloat(process.env.STOP_LOSS_PERCENTAGE)) {
        // STABILIZE and wait until next interval to buy back
        console.log("CHOOSING TO STABILIZE");

        await stabilize();
        interval = parseFloat(process.env.IMAX);
        actionTaken = "stabilize";
        stabilized = true;
    } else {
        console.log("NO ACTION TAKEN");
    }
    await logManager.logValue(newValue, actionTaken);

    totalGains += newValue - oldValue;
    oldValue = newValue;
    oldValueROT = newValueROT;
    setTimeout(loop, interval * 1000);
}

async function trade() {
    if (process.env.TRAIN) {
        // Trade in simulator
        let newTrainingValues = trainingManager.trade(newValue);
        newValue = newTrainingValues.newValue;
        newValueROT = newTrainingValues.newROT;
    } else {
        // Trade in Shrimpy
    }
}

async function stabilize() {
    if (process.env.TRAIN) {
        // Stabilize in simulator
        newValue = trainingManager.stabilize(newValue);
        newValueROT = 0;
    } else {
        // Stabilize in Shrimpy
    }
}

async function getCurrentPrice() {
    if (process.env.TRAIN) {
        // Generate a value
        var max = oldValue + (oldValue * .05);
        var min = oldValue - (oldValue * .05);
        return Math.random() * (max - min) + min;
    } else {
        // Get value from Shrimpy
        return null;
    }
}

initialize();