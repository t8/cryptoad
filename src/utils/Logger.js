const {
  createWriteStream,
  createReadStream,
  promises: { mkdir, writeFile },
} = require("fs");
const { createInterface } = require("readline");
const { join } = require("path");

const fileExists = require("./fileExists");

const LOGS_DIR_PATH = join(__dirname, "..", "..", "logs");

exports.kFileBusy = Symbol.for("cryptopad.logger.fileBusy");

class Logger {
  constructor(training) {
    this._path = join(
      LOGS_DIR_PATH,
      `${training ? "training" : "shrimpy"}.json`,
    );

    this._stream = null;
    this._lastLine = null;
    this._fileBusy = false;
    this._queue = [];

    this._init();
  }

  log(portfolio, action) {
    const data = {
      portfolio,
      action,
      time: new Date().toJSON(),
    };

    if (this._fileBusy) {
      this._queue.push(data);
    } else {
      this._writeJson(data);
    }
  }

  getLastLine() {
    return new Promise((resolve, reject) => {
      if (this._lastLine) resolve(this._lastLine);
      if (this._fileBusy) resolve(exports.kFileBusy);
      this._fileBusy = true;
      this._stream?.end(err => {
        if (err) reject(err);
        let lastLineFound = null;
        const reader = createReadStream(this._path);
        const rl = createInterface(reader);
        rl.on("line", line => {
          lastLineFound = line;
        });

        rl.once("end", () => {
          this._init().catch(reject);
          this._queue.forEach(item => this._writeJson(item));
          this._fileBusy = false;
          resolve(JSON.parse(lastLineFound));
        });
      });
    });
  }

  emptyLog() {
    return new Promise((resolve, reject) => {
      if (this._fileBusy) resolve(exports.kFileBusy);
      this._fileBusy = true;
      this._stream?.end(err => {
        if (err) reject(err);
        writeFile(this._path, "")
          .then(() => {
            this._init();
            this._queue.forEach(item => this._writeJson(item));
            this._fileBusy = false;
          })
          .catch(reject);
      });
    });
  }

  async _init() {
    try {
      const logsDirExists = await fileExists(LOGS_DIR_PATH);
      if (!logsDirExists) await mkdir(LOGS_DIR_PATH);
      this._stream = createWriteStream(this._path, { flags: "a+" });
    } catch (err) {
      console.error("An error occurred while opening the log file!");
      console.error(err);
      process.exit(1);
    }
  }

  async _writeJson(data) {
    try {
      const string = JSON.stringify(data);
      this._lastLine = data;
      return await this._write(`${string}\n`);
    } catch (err) {
      console.error("An error occurred while writing a log!");
      console.error(err, data);
      process.exit(1);
    }
  }

  _write(chunk) {
    return new Promise((resolve, reject) => {
      if (!this._stream) reject(new Error("The stream has not been initialised!"));
      this._stream.write(chunk, err => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

module.exports = Logger;
