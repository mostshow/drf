const fs = require("fs");
const JSZip = require("jszip");
const path = require('path');
const colors = require('colors');
const fse = require("fs-extra");
colors.setTheme({ prompt: 'grey', info: 'green', data: 'grey', warn: 'yellow', debug: 'blue', error: 'red' });
function c(zipfile,source,callback){
    try {
        const zip = new JSZip();
        console.log('Creating %s...', zipfile);
        if(fs.existsSync(source)) {
            addFile(source,zip);
        } else {
            console.error('Error: file %s not found.', source);
            process.exit(2);
        }
        console.log("Deflating...".info)
        zip.generateAsync({type:"nodebuffer"}).then(function (content) {
            fs.writeFile(zipfile, content, function(err){
                if(err){
                    console.log(err);
                    process.exit(2);
                }
                console.log("%s written.".warn,zipfile);
                callback&&callback();
            });
        });
        // zip.generateNodeStream({type:'nodebuffer',streamFiles:true}).pipe(
        //     fs.createWriteStream(zipfile)
        // ).on('finish', function (e) {
        //     if(e){
        //         console.log(e);
        //         process.exit(2);
        //     }
        //     console.log("%s written.".warn,zipfile);
        //     callback&&callback();
        // })
    } catch (e) {
        callback&&callback(e);
        console.log(e);
        process.exit(2);
    }
}
function x(zipfile,destination,callback){
    try {

        fs.readFile(zipfile, function(err, data) {
            if (err) throw err;
            JSZip.loadAsync(data).then(function (zip) {
                Object.keys(zip.files).forEach(function(filepath) {
                    destination = destination ||'.'
                    file = zip.files[filepath];
                    filepath = destination + path.sep + filepath
                    if(file.dir) {
                        console.log('  Creating'.info, filepath);
                        if(!fs.existsSync(filepath)){
                            mkdirRecursively(filepath);
                        }
                    } else {
                        console.log('  Inflating'.info, filepath);
                        fs.writeFileSync(filepath, file._data.compressedContent||'');
                    }
                });
                callback&&callback();
            }).catch(e=>{
                console.err(e)
                callback&&callback();
                process.exit(2);
            })
        });
    } catch (e) {
        callback&&callback(e);
        console.log(e);
        process.exit(2);
    }
}
function addFile(filepath,zip) {
    if(fs.lstatSync(filepath).isDirectory()) {
        console.log("  Adding folder".info, filepath);
        zip.folder(filepath);
        var directory = fs.readdirSync(filepath);
        directory.forEach(function(subfilepath) {
            addFile(path.join(filepath,subfilepath),zip);
        });
    } else {
        console.log(filepath)
        console.log("  Adding file".info, filepath)
        zip.file(filepath, fs.readFileSync(filepath, 'binary'));
    }
}

function mkdirRecursively(folderpath) {
    try {
        fse.mkdirsSync(folderpath);
        return true;
    } catch(e) {
        if (e.errno == 34) {
            mkdirRecursively(path.dirname(folderpath));
            mkdirRecursively(folderpath);
        } else if (e.errno == 47) {
            return true;
        } else {
            console.error("Error: Unable to create folder %s (errno: %s)", folderpath, e.errno)
            process.exit(2);
        }
    }
};
module.exports.c = c;
module.exports.x = x;
