/*
 * Checks if import script can be run by checking if...
 * a) folder contains valid data
 * b) all images (in /data) are accounted for & can be attached
 *
 * usage: node validateData.js [directoryName]
 * */

var fs = require('fs');
var _ = require('underscore');

var dirName = process.argv[2] || 'Grid\ Diary';

main(dirName);

function main(dirName) {
  var hasValidData = checkStats(dirName);
  var hasValidImages = checkImages(dirName, hasValidData);

  if (hasValidData && hasValidImages) {
    console.log(`Success: The data matches. It is safe to run the import script.`);
  } else {
    console.log(`Error: The GridDiary data you have doesn't match.`);
  }
}

function checkStats(dir) {
  var diaryFiles = fs.readdirSync(`${dir}/GDLogs`);
  var imageFiles = fs.readdirSync(`${dir}/GDLogs/data`);
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

  var imageRegistry = makeImageRegistry(dir);
  var dateRegistry = makeDateRegistry(dir);

  var eventFiles = loadEventFiles(dir);

  for (var i = 0; i < eventFiles.length; i++) {
    var buf = fs.readFileSync(eventFiles[i]);

    if (!buf) continue;

    var attachments = JSON.parse(buf).changesByEntity.GDNAttachment;

    for (var j = 0; j < attachments.length; j++) {
      var obj = attachments[j];
      var props = _.indexBy(obj.properties, 'propertyName');
      var imgName = obj.dataFiles && obj.dataFiles[0];

      if (imgName) {
        // Check physical file exists for this image
        if (imageRegistry[imgName] === undefined) {
          console.warn(`Image ${imgName} not found in /GDLogs/data`);
          errorCount ++;
        } else {
          imageRegistry[imgName] = true;
        }
        // Check there exists a diary entry to attach this image
        if (props.createDate && props.createDate.value) {
          var epochDate = Math.floor(props.createDate.value[1]);
          var numericDate = new Date(epochDate).toISODate().substring(0, 10);
          if (!dateRegistry[numericDate]) {
            console.warn(`No Journal of date ${numericDate} for image ${imgName}`);
            errorCount ++;
          }
        }
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

// {[String imageName]: Boolean inMetadata }
function makeImageRegistry(dir) {
  var imageFiles = fs.readdirSync(`${dir}/GDLogs/data`);

  // If there are no images, this is valid
  if (imageFiles && imageFiles.length === 0) {
    return true;
  }

  return _.object(imageFiles, _.times(imageFiles.length, _.constant(false)));
}

// {[String date]: Boolean true}
function makeDateRegistry(dir) {
  var dates = (fs.readdirSync(`${dir}`) || []).map(date => {
    var capturedDate = date.match(/^Diary - (.*).txt/);
    if (capturedDate && capturedDate[1]) {
      return new Date(capturedDate[1]).toISODate().substring(0, 10);
    } else {
      return undefined;
    }
  }).filter(date => date);

  return _.object(dates, _.times(dates.length, _.constant(true)));
}

function loadEventFiles(dir) {
  var eventFiles = fs.readdirSync(`${dir}/GDLogs/events`);
  var baselineFiles = fs.readdirSync(`${dir}/GDLogs/baselines`);

  var files  = [];

  files = files.concat((eventFiles || []).map(file => `${dir}/GDLogs/events/${file}`));
  files = files.concat((baselineFiles || []).map(file => `${dir}/GDLogs/baselines/${file}`));

  return files;
}
