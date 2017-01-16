
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

