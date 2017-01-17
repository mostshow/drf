
const spawn = require('child_process').spawn;


module.exports = function ({},callback){
    const cb = callback;
    const zip = spawn('zip', ['-m']);
    zip.stdout.on('data', function (data) {
        console.log('standard output:\n' + data);
    });

    zip.stderr.on('data', function (data) {
        console.log('standard error output:\n' + data);
    });

    zip.on('close', function (code, signal) {
        console.log('child process eixt ,exit:' + code);
    });
}

// exec('zip -r -q '+destDir+ ' '+source, (e, stdout, stderr) => {
//     if (e) {
//         cback(e)
//         return;
//     }
//     console.log('zip success!'.info)
//     !options.pack&&unpack();
// });
//
// exec('unzip -o  '+basePath(dest)+" -d "+ basePath(dirName) , (e, stdout, stderr) => {
//     if (e) {
//         cback(e)
//         return;
//     }
//     console.log('unzip success!'.info)
//     findFile(source,dirName);
// });
