var fs = require('fs');
var _ = require('underscore');

function getImageNames(dir) {
  return fs.readdirSync(`${dir}/GDLogs/data`) || [];
}


function getNumericDate(date) {
  if (!date) {
    return null;
  }
  var capturedDate = date.match(/^Diary - (.*).txt/);
  if (capturedDate && capturedDate[1]) {
    return new Date(capturedDate[1]).toISOString().substring(0, 10);
  } else {
    return null;
  }
}

function getDiaryDates(dir) {
  return getFileNames(dir).map(getNumericDate).filter(date => date);
}

function getFileNames(dir) {
  return fs.readdirSync(`${dir}`) || [];
}

function makeRegistry(arr, constant) {
  return _.object(arr, _.times(arr.length, _.constant(constant)));
}

function loadEventFiles(dir) {
  var eventFiles = fs.readdirSync(`${dir}/GDLogs/events`);
  var baselineFiles = fs.readdirSync(`${dir}/GDLogs/baselines`);

  var files = [];

  files = files.concat((eventFiles || []).map(file => `${dir}/GDLogs/events/${file}`));
  files = files.concat((baselineFiles || []).map(file => `${dir}/GDLogs/baselines/${file}`));

  return files;
}

function computeAttachmentsAndDates(dir) {
  var eventFiles = loadEventFiles(dir);
  var results = [];

  for (var i = 0; i < eventFiles.length; i++) {
    var buf = fs.readFileSync(eventFiles[i]);
    if (!buf) continue;
    var attachments = JSON.parse(buf).changesByEntity.GDNAttachment;
    for (var j = 0; j < attachments.length; j++) {
      var obj = attachments[j];
      var props = _.indexBy(obj.properties, 'propertyName');
      var imgName = obj.dataFiles && obj.dataFiles[0];
      if (imgName) {
        var numericDate = '';
        if (props.whichGrid && props.whichGrid.relatedIdentifier) {
          numericDate = (_.first(props.whichGrid.relatedIdentifier.split(' ')[0].split('-'), 3)).join('-')
        } else if (props.createDate && props.createDate.value) {
          var epochDate = Math.floor(props.createDate.value[1]);
          numericDate = new Date(epochDate).toISOString().substring(0, 10);
        }
        results.push([imgName, numericDate])
      }
    }
  }

  return results;
}

module.exports.makeRegistry = makeRegistry;
module.exports.getFileNames = getFileNames;
module.exports.getImageNames = getImageNames;
module.exports.getDiaryDates = getDiaryDates;
module.exports.getNumericDate = getNumericDate;
module.exports.computeAttachmentsAndDates = computeAttachmentsAndDates;
