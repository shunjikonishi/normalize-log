const fs = require('fs');
const readline = require('readline');

const filename = process.argv[2];

const rs = fs.ReadStream(filename);
const rl = readline.createInterface({'input': rs, 'output': {}});

function skipLog(log) {
  if (!log || log === "pong" || log.indexOf("ping") >= 0) {
    return true;
  }
  return false;
}
rl.on("line", (line) => {
  const array = line.split("\t");
  if (array[4] !== "localhost-1") {
    return;
  }
  try {
    const array2 = array[9].split("\\t");
    const log = JSON.parse(array2.slice(2).join("\\t")).log;
    if (skipLog(log)) {
      return;
    }
    console.log(array[1] + " " + array[5] + " " + log);
  } catch (e) {
    console.log("Error!!! " + line);
    throw e;
  }
});
rl.resume();
