"use strict";

const fs = require('fs');
const readline = require('readline');

const fileMap = {};

function getFile(name) {
  if (!fileMap[name]) {
    fileMap[name] = fs.openSync(name + ".txt", "w");
  }
  return fileMap[name];
}

function closeAll() {
  Object.keys(fileMap).forEach(key => {
    fs.closeSync(fileMap[key]);
  });
}

function PapertrailLog(line) {
  const array = line.split("\t");
  this.id            = array[0];
  this.generated_at  = array[1];
  this.received_at   = array[2];
  this.source_id     = array[3];
  this.source_name   = array[4];
  this.source_ip     = array[5];
  this.facility_name = array[6];
  this.severity_name = array[7];
  this.program       = array[8];
  this.message       = array[9];
}

function FluentdLog(message) {
  const array = message.split("\\t");
  this.timestamp = array[0];
  this.name = array[1];
  try {
    let str = array.slice(2).join("\\t");
    if (str.charAt(str.length - 1) !== "}") {
      str += '"}';
    }
    this.json = JSON.parse(str);
  } catch (e) {
    console.log("Error!!! " + message);
    throw e;
  }
  //log, container_id, container_name, source, host
}

function processFile(filename, done) {
  const rs = fs.ReadStream(filename);
  const rl = readline.createInterface({'input': rs, 'output': {}});
  rl.on("line", (line) => {
    const pl = new PapertrailLog(line);
    if (pl.source_name !== "localhost-1") {
      return;
    }
    const fl = new FluentdLog(pl.message);
    const fd = getFile(pl.source_ip);

    const data = `${filename}\t${pl.generated_at}\t${pl.received_at}\t${fl.timestamp}\t${fl.json.log}\n`
    fs.writeSync(fd, data);
  });
  rl.on("close", () => {
    done(filename)
  });
  rl.resume();
}


//const filename = process.argv[2];
//processFile(filename);
//closeAll();

function onEnd(filename) {
  if (filename === "2016-05-10.tsv") {
    closeAll();
    return;
  }
  const num = parseInt(filename.substring(8, 10)) + 1;
  const filename2 = "2016-05-" + (num < 10 ? "0" : "") + num + ".tsv";
  processFile(filename2, onEnd);
}
processFile("2016-05-01.tsv", onEnd);
