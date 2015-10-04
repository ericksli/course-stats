/**
 * Created by Eric on 10/4/2015.
 */

var credentials = require('./parseCredentials.json');
var fs = require("fs");
var path = require("path");
var Q = require("q");
var Parse = require('parse/node').Parse;

var rootPath = 'data';
var academicYear = '1516';
var semester = 'A';

Q.longStackSupport = true;
Parse.initialize(credentials.appId, credentials.jsKey);

var AddDropLog = Parse.Object.extend('AddDropLog');


// read root path
Q.nfcall(fs.readdir, rootPath).then(function (files) {
    // get stats of each directory/file
    var promise = Q();
    files.forEach(function (file) {
        var p = path.join(rootPath, file);
        promise = promise.then(function () {
            return Q.nfcall(fs.stat, p).then(function (stat) {
                return {
                    dir: p,
                    stat: stat
                };
            })
        }).then(function (result) {
            // read the directory
            if (result.stat.isDirectory()) {
                console.log("1 " + result.dir);
                return Q.nfcall(fs.readdir, result.dir).then(function (files) {
                    return {
                        dir: result.dir,
                        files: files
                    }
                });
            }
        }).then(function (result) {
            // parse the json files in the directory
            if (result === undefined) {
                return [];
            }
            console.log("2");
            var jsonFiles = [];
            result.files.forEach(function (file) {
                if (path.extname(file) === '.json') {
                    var p = path.join(result.dir, file);
                    jsonFiles.push(p);
                }
            });
            return jsonFiles;
        }).then(function (files) {
            // read json file
            console.log("3");
            var promise = Q();
            files.forEach(function (file) {
                promise = promise.then(Q.nfcall(fs.readFile, file, "utf-8").then(function (jsonStr) {
                    // parse the file name to obtain timestamp and convert json string to JS object
                    console.log("4 " + file);
                    var filename = path.basename(file);
                    var timestamp = /^(\d+)-(\d+)-(\d+)_(\d+)-(\d+)-(\d+)/.exec(filename);
                    return {
                        timestamp: new Date(~~timestamp[1], ~~timestamp[2] - 1, ~~timestamp[3], ~~timestamp[4], ~~timestamp[5], ~~timestamp[6]),
                        courses: JSON.parse(jsonStr)
                    }
                }).then(function (result) {
                    // write file
                    console.log("5", result.timestamp, result.courses[0].code);
                    var promise = Q();
                    result.courses.forEach(function (course) {
                        var filename = 'output/' + course.code + '.txt';
                        var line = result.timestamp.toISOString() + '>> ' + course.code + ' - ' + course.title + ' > ' + course.capacity + '\n';
                        promise = promise.then(Q.nfcall(fs.appendFile, filename, line));
                    });
                    return promise;
                }));
            });
            return promise;
        });
    });
    return promise;
}).done();
