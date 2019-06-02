/*
 * Import files & images in directoryName ("Grid Diary" by default) to Day One
 *
 * usage: node gridDiaryToDayOne.js [directoryName]
 * */

var { execSync } = require('child_process');
var fs = require('fs');
var _ = require('underscore');
var {
  getFileNames, getNumericDate, getDiaryDates, makeRegistry, computeAttachmentsAndDates
} = require('./utils.js');

var dirName = process.argv[2] || 'Grid\ Diary';

main(dirName);

function main(dir) {
  // {date: [photos]}
  var dateRegistry = makeRegistry(getDiaryDates(dir), false);
  var mapping = computeAttachmentsAndDates(dir);

  // Populate dateRegistry
  for (var i = 0; i < mapping.length; i++) {
    var imgName = mapping[i][0];
    var numericDate = mapping[i][1];
    if (typeof dateRegistry[numericDate] === 'object') {
      dateRegistry[numericDate].push(imgName);
    } else if (dateRegistry[numericDate] === false) {
      dateRegistry[numericDate] = [imgName];
    }
  }

  // TODO deal with dates. problem at 206
  var fileNames = getFileNames(dir);
  for (var i = 0 ; fileNames.length; i++) {
    var numericDate = getNumericDate(fileNames[i]);
    if (numericDate) {
      var formattedDate = new Date(numericDate).toISOString().replace('.000', '');
      var images = (dateRegistry[numericDate] || [])
        .map(img => `"${dir}/GDLogs/data/${img}"`)
        .join(' ');
      var imagesCommand = images ? `--photos ${images} ` : '';

      var execCommand = `cat "${(dir + '/' + fileNames[i])}" | `
        + `dayone2 new `
        + imagesCommand
        + `--isoDate ${formattedDate} `
        + `--tags "GridDiaryImport"`;

      try {
        execSync(execCommand);
      } catch(err) {
        console.error(err);
        console.log(`Terminating at ${i+1} of ${fileNames.length} entries`);
        return;
      }
    }
  }
}

// cat Grid\ Diary/Diary\ -\ April\ 1,\ 2016.txt | dayone2 new --tags "GridDiaryImport"
// Created new entry with uuid: 410ABB17707545D6AB9B2A29B94E87AC
