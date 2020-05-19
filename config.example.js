const config = {
  // Shrimpy configuration.
  shrimpy: {
    key: "12326758a39a720e15d064cab3c1f0a9332d107de453bd41926bb3acd565059e",
    secret: "6991cf4c9b518293429db0df6085d1731074bed8abccd7f0279a52fac5b0c1a8a2f6d28e11a50fbb1c6575d1407e637f9ad7c73fbddfa87c5d418fd58971f829",
    exchange: "coinbasepro"
  },
  checkFrequencies: {
    min: 1,
    max: 5,
    // Step size to make when mutating the frequency.
    step: 0.5,
  },
  // Whether or not the bot is in training mode.
  training: true,
  // Speed > value - Wether or not to prioritise speed over value.
  speedGtValue: true,
  // Percentage decrease in the hour to activate a stop-loss.
  stopLossPercentage: -0.015,
};

module.exports = config;
