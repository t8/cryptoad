require("./utils/configExists")();

const { training } = require("../config");
const { promises: { readFile, writeFile } } = require("fs");
const { join } = require("path");

async function processData() {
  const path = join(
    __dirname,
    "..",
    "logs",
    `${training ? "training" : "shrimpy"}.json`,
  );

  const destPath = join(__dirname, "..", "consumableData.json");

  const data = await readFile(path, { encoding: "utf8" });

  await writeFile(destPath, JSON.stringify(data.split("\n").flatMap(d => d !== "" ? JSON.parse(d) : [])), { flag: "w", encoding: "utf-8" });
}

processData();
