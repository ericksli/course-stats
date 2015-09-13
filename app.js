var fs = require("fs");
var path = require("path");
var Q = require("q");
var rootPath = 'data';

Q.longStackSupport = true;

// read root path
Q.nfcall(fs.readdir, rootPath).then(function (files) {
    // get stats of each directory/file
    var promises = [];
    files.forEach(function (file) {
        var p = path.join(rootPath, file);
        promises.push(Q.nfcall(fs.stat, p).then(function (stat) {
            return {
                dir: p,
                stat: stat
            };
        }));
    });
    return Q.all(promises);
}).then(function (results) {
    // read the directories
    var promises = [];
    var c = 0;
    results.forEach(function (result) {
        c++;
        if (result.stat.isDirectory() && c < 3) {
            console.log("dir " + result.dir);
            promises.push(Q.nfcall(fs.readdir, result.dir).then(function (files) {
                return {
                    dir: result.dir,
                    files: files
                }
            }));
        }
    });
    return Q.all(promises);
}).then(function (results) {
    // parse the json files in each directory
    var promises = [];
    results.forEach(function (result) {
        result.files.forEach(function (file) {
            if (path.extname(file) === '.json') {
                var p = path.join(result.dir, file);
                promises.push(Q.nfcall(fs.readFile, p, "utf-8").then(function (jsonStr) {
                    var filename = path.basename(file);
                    var timestamp = /^(\d+)-(\d+)-(\d+)_(\d+)-(\d+)-(\d+)/.exec(filename);
                    return {
                        timestamp: new Date(~~timestamp[1], ~~timestamp[2] - 1, ~~timestamp[3], ~~timestamp[4], ~~timestamp[5], ~~timestamp[6]),
                        courses: JSON.parse(jsonStr)
                    }
                }));
            }
        })
    });
    return Q.all(promises);
}).then(function (results) {
    // write files for each course
    var promises = [];
    results.forEach(function (data) {
        data.courses.forEach(function (course) {
            console.log(data.timestamp.toISOString() + '>> ' + course.code + ' - ' + course.title + ' > ' + course.capacity);
            var filename = 'output/' + course.code + '.txt';
            var line = data.timestamp.toISOString() + '>> ' + course.code + ' - ' + course.title + ' > ' + course.capacity + '\n';
            promises.push(Q.nfcall(fs.appendFile, filename, line));
        });
    });
    return Q.all(promises);
}).then(function () {
    console.log('all done!');
}).done();
