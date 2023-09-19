#!/usr/bin/env node
const program = require("caporal");
const debounce = require("lodash.debounce");
const chokidar = require("chokidar");
const fs = require("fs");
const chalk = require("chalk");
// use only one of the multiple child_process functions
// spawn does not allow shell execution of multiple programs or | pipes
// but by passing in relevant arguments,
// spawn can behave exactly like the other 3 child_process functions
const { spawn } = require("child_process");
program
  .version("0.0.1")
  .argument("[filename]", "Name of the file to execute")
  // just destructure the filename. args not needed in program logic
  .action(async ({ filename }) => {
    // default to index.js if not provided as program argument
    const name = filename || "index.js";
    try {
      await fs.promises.access(name);
    } catch (err) {
      throw new Error(`Could not access the file ${name}`);
    }
    let subProcess;
    // define a 100ms delay
    const start = debounce(() => {
      if (subProcess) {
        subProcess.kill();
        console.log(chalk.red("killing existing process.."));
      }
      console.log(chalk.blue(">>>starting a fresh process.."));
      // spawn a 'node' command that targets filename
      // inherit (connect) stdin,stdout & stderror channels
      // from the spawned child process to the main programs stdin/stdout/stderror
      subProcess = spawn("node", [name], { stdio: "inherit" });
    }, 100);

    chokidar
      .watch(".")
      .on("add", start) // pass the debounced function as reference to relevant events
      .on("change", start)
      .on("unlink", start);
  });
// initialize
program.parse(process.argv);
