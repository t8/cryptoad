const {
  promises: { access },
  constants: { F_OK: FILE_LOC_OK }
} = require("fs");

async function fileExists(path) {
  try {
    await access(path, FILE_LOC_OK);
    return true;
  } catch {
    return false;
  }
}

module.exports = fileExists;