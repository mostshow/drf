
var  colors = require('colors');
var  P = require('bluebird');
var  path = require('path');
var  fs = require("fs");
var  _ = require('lodash');
var  glob = P.promisifyAll(require('glob'));
var  tar = require('tar-pack');
var  fse = require("fs-extra");
var  local = path.join.bind(path, __dirname);
var  basePath = path.join.bind(path, process.cwd());
var  exec = require('child_process').exec;
var  zip = require('./zip');
var  uuidV4 = require('uuid/v4');
var  moment = require('moment');
var  platformName = ['UNIX', 'DOS'].indexOf(process.platform) !== -1 ? process.platform :'UNIX';
// var  refTime = 3*24*60*60*1000

colors.setTheme({ prompt: 'grey', info: 'green', data: 'grey', warn: 'yellow', debug: 'blue', error: 'red' });

module.exports = function(source,dest,options,callback){
    var oldFile = [];
    var bakdir = options.bakdir || 'backup';
    var source = source.replace(/\/$/,'');
    var dest = dest.replace(/\/$/,'');
    var del = options.del ;
    var dirName = dest&&dest.split('.').shift();//+uuidV4();
    var compress = options.compress || 'zip';
    var compressConf = { zip:'zip', gz:'gz' }
    var cback = callback;
    fse.ensureDirSync(basePath(source))
    console.log('start !'.info)
    if(options.deldiff){
        fse.readFile(source+'/diff.config', 'utf8', (err, data)=> {
            if(err){
                cback(err);
                return null;
            }
            var files = [];
            var oldFile = data.split(',');
            console.log(oldFile)
            // var nowTime = new Date().getTime();
            // var lastTime = oldFile.pop();
            // var relativeTime = nowTime-lastTime
            // if(relativeTime < refTime || _.isEmpty(oldFile)){
            //     console.log(relativeTime)
            //     console.log('delete failure'.info)
            //     console.log("task done!".info);
            //     return;
            // }
            oldFile.forEach(($item)=>{
                files.push(fse.remove($item));
            })
            oldFile.push(fse.remove(source));
            exec(files);
        })
    }else if(options.unpack){
        unpack()
    }else{
        pack();
    }
    function findFile(source,dest){
        var o = basePath(source+'/**/*');
        var d = basePath(dest+'/**/*');
        var destDir = dest.split('/').pop()+'/';
        var sourceDir = source.split('/').pop();
        var files = [];
        P.props({
            o : glob.sync(o, {nodir: true}),
            d : glob.sync(d, {nodir: true})
        }).then(r=>{
            console.log('get directory success!'.info)
            r.d = r.d.map($item=>$item.replace(destDir,''))
            console.log('delete diff.config'.info)
            fse.removeSync(basePath(source+'/diff.config'));
            console.log('delete done'.info)
            //添加时间
            // r.o.push(new Date().getTime())
            oldFile = _.difference(r.o,r.d);
            console.log('contrast success'.info)
            console.log('differences:'.warn)
            console.log(oldFile.join(',').data)
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
            if(del){
                oldFile.forEach(function($item){
                    files.push(fse.remove($item));
                })
            }else{
                files.push(fse.outputFile(basePath(source+'/diff.config'),oldFile))
            }
            exec(files);
        }).catch(e=>{
            cback(e)
        })
    }
    function exec(files){
        Promise.all(files).then(() => {
            console.log('delete done'.info)
            console.log("task done!");
        }).catch(e=>{
            cback(e)
        });
    }
    function pack(){
        var behave = options.pack?'-pack':'-bak-';
        if(behave == '-bak-'&& !fs.existsSync(basePath(bakdir))){
            console.log('Creating backup !'.info)
            fse.mkdirsSync(basePath(bakdir));
        }
        bakdir = bakdir.replace(/\/?$/,'/');
        var destDir =(behave =='-bak-'?basePath(bakdir+source+behave+getVersion()+'.zip'):basePath(source+behave)+'.zip') ;
        zip.c(destDir,source,(e)=>{
            if (e) {
                cback(e)
                return;
            }
            console.log('zip success!'.info)
            !options.pack&&unpack();
        })
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
    function getVersion(){
        if(options.bakname){
             return options.bakname;
        }
        var curTime = moment();
        var  timeArr = [];
        timeArr.push(curTime.get('year'));
        timeArr.push(curTime.get('month')+1);
        timeArr.push(curTime.get('date'));
        timeArr.push(curTime.get('hour'));
        timeArr.push(curTime.get('minute'));
        timeArr.push(curTime.get('second'));
        // timeArr.push(curTime.get('millisecond'));
        return timeArr.join('-');
    }
}





