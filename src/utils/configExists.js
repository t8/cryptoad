const fileExists = require("./fileExists");
const { join } = require("path");

function configExists() {
  fileExists(join(__dirname, "..", "..", "config.js"))
    .catch(err => {
      console.error("An error occurred while verifying the config file location!");
      console.error(err);
      process.exit(1);
    })
    .then(exists => {
      if (!exists) {
        console.error("Please fill out and then rename the config.example.js to config.js");
        process.exit();
      }
    });
}

module.exports = configExists;
