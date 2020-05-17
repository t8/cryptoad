// File to train the model and update optimized values

const fee = 0.005;

function trade(amount) {
    var newAmount, newROT;
    var potentialBestROT = -10000;
    var potentialTrades = [];           // Represents the ROT for each different currency on the exchange

    // Populating potential trades with random values between -10 and 10
    for (let i = 0; i < 20; i++) {
        potentialTrades.push(Math.random() * (10 - (-10)) + (-10));
    }

    // Looping through potential trades and picking best ROT to trade to
    for (let x = 0; x < potentialTrades.length; x++) {
        if (potentialTrades[x] > potentialBestROT) {
            potentialBestROT = potentialTrades[x];
        }
    }

    // Setting new values after picking best trade and "trading"
    newAmount = amount - (amount * fee);
    newROT = potentialBestROT;

    return {
        newValue: newAmount,
        newROT: newROT
    };
}

function stabilize(amount) {
    return amount - (amount * fee);
}

module.exports = {
    trade,
    stabilize
};