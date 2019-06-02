/*
 * Checks if import script can be run by checking if...
 * a) folder contains valid data
 * b) all images (in /data) are accounted for & can be attached
 *
 * usage: node validateData.js [directoryName]
 * */

var fs = require('fs');
var _ = require('underscore');
var {
  getImageNames, getFileNames, getDiaryDates, makeRegistry, computeAttachmentsAndDates
} = require('./utils.js');

var dirName = process.argv[2] || 'Grid\ Diary';

main(dirName);

function main(dirName) {
  var hasValidData = checkStats(dirName);
  var hasValidImages = checkImages(dirName, hasValidData);

  if (hasValidData && hasValidImages) {
    console.log(`Success: Data matches. It's safe to run the import script.`);
  } else {
    console.log(`Error: The data you have isn't compatible with this script.`);
    console.log(`Are you sure you entered the correct directory name?`);
  }
}

function checkStats(dir) {
  var diaryFiles = getFileNames(dir);
  var imageFiles = getImageNames(dir);
  var baselineFiles = fs.readdirSync(`${dir}/GDLogs/baselines`);
  var eventFiles = fs.readdirSync(`${dir}/GDLogs/events`);

  console.log(`Stats: ${(diaryFiles || []).length} Diaries, `
    + `${(imageFiles || []).length} Images, `
    + `${(baselineFiles || []).length + (eventFiles || []).length} Metadata`);

  var isOKToContinue = diaryFiles !== null
    && !(baselineFiles === null && eventFiles === null)
    && diaryFiles.length > 0
    && (baselineFiles.length + eventFiles.length) > 0;

  return isOKToContinue;
}

function checkImages(dir, hasValidData) {
  if (!hasValidData) return false;

  var errorCount = 0;

  var imageRegistry = makeRegistry(getImageNames(dir), false);
  var dateRegistry = makeRegistry(getDiaryDates(dir), true);

  var attachmentAndDates = computeAttachmentsAndDates(dir);
  for (var i = 0 ; i < attachmentAndDates.length; i++) {
    var imgName = attachmentAndDates[i][0];
    var numericDate = attachmentAndDates[i][1];

    if (imgName) {
      // Check physical file exists for this image
      if (imageRegistry[imgName] === undefined) {
        console.warn(`Image ${imgName} not found in /GDLogs/data`);
        errorCount ++;
      } else {
        imageRegistry[imgName] = true;
      }

      // Check there exists a diary entry to attach this image
      if (!numericDate || !dateRegistry[numericDate]) {
        console.warn(`No diary dated ${numericDate} for image ${imgName}`);
        errorCount ++;
      }
    }
  }

  // Check all images have an associated metadata file
  for (image in imageRegistry) {
    if (imageRegistry[image] === false) {
      console.warn(`Image ${image} not found in metadata files`);
      errorCount ++;
    }
  }

  console.log(`There are ${errorCount} warnings.`);

  return errorCount === 0;
}
