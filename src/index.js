// File to manage trading intervals and execute trades

require('dotenv').config();
const trainingManager = require('./trainingManager');
const shrimpyManager = require('./shrimpyManager');
const logManager = require('./logManager');

let interval = parseFloat(process.env.IMAX);
let entryAmount,                            // Value of the currency when the bot started in USD
    totalGains,                             // Total amount the portfolio increased/decreased while bot was online
    fee,                                    // Fee for trading in the given exchange
    oldValue,                               // f(x)|t-i     --> Tracker for the value at time (t) - interval (i)
    newValue,                               // f(x)|t       --> Tracker for the current value of the portfolio
    oldValueROT,                            // f'(x)|t-i    --> Previous rate of change of the value of the portfolio
    newValueROT,                            // f'(x)|t      --> Current rate of change of the value of the portfolio
    valueROTROT = Number;                   // f''(x)       --> Rate of change of the rate of change of the value
let stabilized,                             // Boolean value to prevent the bot from re-stabilizing if portfolio is already stable
    simulating = false;                     // Boolean value to check whether the bot is simulating

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
    setTimeout(loop, interval);
    //console.log("Initialized");
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
    let percentChange = ((newValue - (newValue * fee)) - oldValue) / oldValue;
    let actionTaken = "nothing";
    if (percentChange >= 0 || stabilized || valueROTROT > 0) {
        // Creating a random chance for the market to be at an increase while stabilized; this would encourage a trade
        if (Math.random() > 0.5 && stabilized || !stabilized) {
            // TRADE
            //console.log("CHOOSING TO TRADE");

            await trade();
            interval = parseFloat(process.env.IMAX);
            actionTaken = "trade";
            stabilized = false;
        } else {
            //console.log("NO ACTION TAKEN");
        }
    } else if (newValueROT < 0 && oldValueROT < 0 && percentChange < parseFloat(process.env.STOP_LOSS_PERCENTAGE)) {
        // STABILIZE and wait until next interval to buy back
        //console.log("CHOOSING TO STABILIZE");

        await stabilize();
        interval = parseFloat(process.env.IMAX);
        actionTaken = "stabilize";
        stabilized = true;
    } else {
        //console.log("NO ACTION TAKEN");
    }
    await logManager.logValue(newValue, actionTaken);

    totalGains += newValue - oldValue;
    oldValue = newValue;
    oldValueROT = newValueROT;

    // Only restart this process if a simulation is going on while training or not training at all
    if (process.env.TRAIN && simulating || !process.env.TRAIN) {
        setTimeout(loop, interval);
    }
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
        let max = oldValue + (oldValue * .05);
        let min = oldValue - (oldValue * .05);
        return Math.random() * (max - min) + min;
    } else {
        // Get value from Shrimpy
        return null;
    }
}

async function runSimulation() {
    let potentialStopLossPercentages = [];
    let bestSetting = {
        percentage: 0,
        performance: 0
    };
    let currentPercentage = parseFloat(process.env.STOP_LOSS_PERCENTAGE)
    for (let z = 0; z < 100; z++) {
        let newPercent = currentPercentage - (0.01 * z);
        console.log("New percent: " + newPercent)
        process.env.STOP_LOSS_PERCENTAGE = newPercent;
        simulating = true;
        initialize();
        await new Promise(resolve => setTimeout(resolve, 5 * 60)); // 5 minutes of simulating for each stop-loss percentage
        simulating = false;
        potentialStopLossPercentages.push({
            percentage: newPercent,
            performance: logManager.getMostRecentValue()
        });
        //console.log(potentialStopLossPercentages);
        //logManager.clearLog();
    }
    for (let z = 0; z < 100; z++) {
        if (potentialStopLossPercentages[z].performance > bestSetting.performance) {
            bestSetting = potentialStopLossPercentages[z];
        }
    }
    console.log(bestSetting);
}

if (process.env.TRAIN) {
    runSimulation();
} else {
    initialize();
}