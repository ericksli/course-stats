/**
 * Created by Eric on 10/10/2015.
 */

var fs = require("fs");
var path = require("path");
var _ = require("lodash");

var rootPath = 'data';
var academicYear = '1516';
var semester = 'A';

var courseData = {};
var outputFile;
var firstRecord = true;

outputFile = fs.openSync('output/log.json', 'w');
fs.writeSync(outputFile, '{"results":[\n');

var dataFiles = fs.readdirSync(rootPath);
dataFiles.forEach(function (dataFile) {
    var dir = path.join(rootPath, dataFile);
    var stat = fs.statSync(dir);
    if (stat.isDirectory()) {
        var groupFiles = fs.readdirSync(dir);
        groupFiles.forEach(function (groupFile) {
            if (path.extname(groupFile) === '.json') {
                var jsonStr = fs.readFileSync(path.join(dir, groupFile), 'utf-8');
                var courses = JSON.parse(jsonStr);
                var timestampRes = /^(\d+)-(\d+)-(\d+)_(\d+)-(\d+)-(\d+)/.exec(groupFile);
                var timestamp = new Date(~~timestampRes[1], ~~timestampRes[2] - 1, ~~timestampRes[3], ~~timestampRes[4], ~~timestampRes[5], ~~timestampRes[6]);
                courses.forEach(function (course) {
                    courseData[course.code] = _.pick(course, ['credit', 'department', 'levels', 'title']);
                    var data = _.extend(_.pick(course, ['code', 'availableSeats', 'capacity', 'waitlistAvailable', 'webEnabled']), {
                        capturedAt: {
                            "__type": "Date",
                            "iso": timestamp
                        },
                        academicYear: academicYear,
                        semester: semester
                    });
                    var line;
                    if (firstRecord) {
                        line = JSON.stringify(data);
                        firstRecord = false;
                    } else {
                        line = ',\n' + JSON.stringify(data);
                    }
                    fs.writeSync(outputFile, line);
                })
            }
        })
    }
});
fs.writeSync(outputFile, ']}');
fs.closeSync(outputFile);


var exportCourseData = {};
exportCourseData.results = [];
_.forIn(courseData, function (value, key) {
    exportCourseData.results.push(_.extend({code: key}, value));
});
fs.writeFileSync('output/courses.json', JSON.stringify(exportCourseData));
