/*
 * Certain files are duplicate. For example:
 *    Diary - December 20, 2016.txt
 *    Diary - December 20, 2016 (1).txt
 * This file reads all .txt files and checks their duplicates
 * and determines if duplicates are similar.
 *
 * Usage: node checkduplicates.js [directoryName]
 * */

var fs = require('fs');

var dirName = process.argv[2] || 'Grid\ Diary';

fs.readdir(dirName, (err, files) => {
  if (err) {
    console.log(dirName);
    console.error(err.toString());
  } else {
    checkDuplicates(files, dirName);
  }
});

function checkDuplicates(files, dirName) {
  console.log(`Checking ${files.length} files`);
  files.forEach(fileName => {
    var isDuplicate = fileName.match(/^Diary.*\ \(\d\).txt$/);
    if (isDuplicate) {
      var duplicateSuffix = /\ \(\d\).txt$/;
      var originalFileName = fileName.replace(duplicateSuffix, '.txt');

      var p1 = new Promise((resolve, reject) => {
        fs.readFile(dirName + '/' + originalFileName, (err, data) => {
          err ? reject(err) : resolve(data);
        })
      });

      var p2 = new Promise((resolve, reject) => {
        fs.readFile(dirName + '/' + fileName, (err, data) => {
          err ? reject(err) : resolve(data);
        })
      });

      if (fileName === "Diary - September 9, 2016 (1).txt") {
        console.log("NOTICE");
      }

      Promise.all([p1, p2])
        .then(buffers => {
          isBuffersEqual = buffers[0].equals(buffers[1]);
          if (isBuffersEqual) {
            console.log('✅');
          } else {
            console.warn(`❗️ ${fileName} is unique`);
          }
        })
        .catch(error => {
          // Likely, one of the files could not be opened
          console.error(error.toString());
        });
    }
  })
  return false;
}
