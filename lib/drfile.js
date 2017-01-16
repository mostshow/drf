
const colors = require('colors');
const P = require('bluebird');
const path = require('path');
const fs = require("fs");
const _ = require('lodash');
const glob = P.promisifyAll(require('glob'));
const tar = require('tar-pack');
const fse = require("fs-extra");
const local = path.join.bind(path, __dirname);
const basePath = path.join.bind(path, process.cwd());
const exec = require('child_process').exec;
const zip = require('./zip');
const uuidV4 = require('uuid/v4');
const moment = require('moment');

colors.setTheme({ prompt: 'grey', info: 'green', data: 'grey', warn: 'yellow', debug: 'blue', error: 'red' });

module.exports = function(source,dest,options,callback){
    var oldFile = [];
    var bakdir = options.bakdir || 'backup';
    var source = source.replace(/\/$/,'');
    var dest = dest.replace(/\/$/,'');
    const dirName = dest&&dest.split('.').shift();//+uuidV4();
    const compress = options.compress || 'zip';
    const compressConf = { zip:'zip', gz:'gz' }

    const cback = callback;
    console.log('start !'.info)
    pack();
    function findFile(source,dest){
        const o = basePath(source+'/**/*');
        const d = basePath(dest+'/**/*');
        const destDir = dest.split('/').pop()+'/';
        const sourceDir = source.split('/').pop();
        var files = [];
        P.props({
            o : glob.sync(o, {nodir: true}),
            d : glob.sync(d, {nodir: true})
        }).then(r=>{
            console.log('get directory success!'.info)
            r.d = r.d.map($item=>$item.replace(destDir,''))
            oldFile = _.difference(r.o,r.d);
            console.log('contrast success'.info)
            console.log('differences:'.warn)
            console.log(oldFile.join(',').data)
            // files.push(fse.copy(basePath(destDir+sourceDir),basePath(source)));
            console.log('copy start'.info)
            try {
                fse.copySync(basePath(destDir+sourceDir),basePath(source))
                console.log('copy done'.info)
            } catch (err) {
                console.error(err)
                process.exit(1);
            }
            console.log('delete start'.info)
            files.push(fse.remove(basePath(destDir)));
            files.push(fse.remove(basePath(destDir.replace(/\/?$/,'')+'.zip')));
            oldFile.forEach(function($item){
                files.push(fse.remove($item));
            })
            Promise.all(files).then(function(e) {
                if(e){
                    cbck(e);
                }else{
                    console.log('delete done'.info)
                    console.log("task done!");
                }
            });
        }).catch(e=>{
            cback(e)
        })
    }
    function pack(){
        const behave = options.pack?'*pack*':'*bak*';
        if(behave == '*bak*'&& !fs.existsSync(basePath(bakdir))){
            console.log('Creating backup !'.info)
            fse.mkdirsSync(basePath(bakdir));
        }
        bakdir = bakdir.replace(/\/?$/,'/');
        const destDir =(behave =='*bak*'?basePath(bakdir+source+behave+getTimeVersion()+'.zip'):basePath(source+behave+getTimeVersion()+'.zip')) ;
        zip.c(destDir,source,(e)=>{
            if (e) {
                cback(e)
                return;
            }
            console.log('zip success!'.info)
            !options.pack&&unpack();
        })
        // exec('zip -r -q '+destDir+ ' '+source, (e, stdout, stderr) => {
        //     if (e) {
        //         cback(e)
        //         return;
        //     }
        //     console.log('zip success!'.info)
        //     !options.pack&&unpack();
        // });
    }
    function unpack(){
        if(compress == compressConf.zip){

            zip.x(basePath(dest),basePath(dirName),(e)=>{
                if (e) {
                    cback(e)
                    return;
                }
                console.log('unzip success!'.info)
                findFile(source,dirName);
            })
            // exec('unzip -o  '+basePath(dest)+" -d "+ basePath(dirName) , (e, stdout, stderr) => {
            //     if (e) {
            //         cback(e)
            //         return;
            //     }
            //     console.log('unzip success!'.info)
            //     findFile(source,dirName);
            // });
        }else if(compress == compressConf.gz){
            return;
            // fs.createReadStream(basePath(dest)).pipe(tar.unpack(basePath(dirName),function(err){
            //      if(err) cback(err)
            //      // else findFile();
            // }))
        }else{
            findFile(source,dirName);
        }
    }
    function getTimeVersion(){
        const curTime = moment();
        const timeArr = [];
        timeArr.push(curTime.get('year'));
        timeArr.push(curTime.get('month')+1);
        timeArr.push(curTime.get('date'));
        timeArr.push(curTime.get('hour'));
        timeArr.push(curTime.get('minute'));
        timeArr.push(curTime.get('second'));
        timeArr.push(curTime.get('millisecond'));
        return timeArr.join('-');
    }
}




