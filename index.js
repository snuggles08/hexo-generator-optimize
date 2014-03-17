var uglify   = require('uglify-js'),
    imagemin = require('image-min'),
    cleanCSS = require('clean-css'),
    zlib     = require('zlib');

var concat = require('concat-files');
var generate = require('./generate');

var async = require('async'),
  fs = require('graceful-fs'),
  colors = require('colors'),
  _ = require('lodash');

var fs   = require('fs'),
    path = require('path'),
    util = require('util');

// File types for Minify.
var supportedResources = {
    'js'  : function(content, opts) { return uglify.minify(content, { fromString: true }).code },
    'css' : function(content, opts) { return cleanCSS().minify(content); }
};

// Navigate a folder recursively and minify resources
var minify = function(item, opts) {
  fs.readdir(item, function(err, files) {
      if (!files) return;
      files.forEach(function(file) {
          var target = path.join(item, file);
          var stats = fs.statSync(target);
          if ( stats.isDirectory() ) {
              minify(target, opts);
          } else if (stats.isFile()) {
              compress(target, opts);
          }
      });
  });
};

// ignore files that are already minified
var alreadyPacked = function(filename) {
    return (filename.indexOf(".min") > 0 ||
                filename.indexOf(".pack") > 0);
};

// Util to check if we have a minification strategy for given file extension
var processable = function(fileExt) {
    return (Object.keys(supportedResources)
                    .indexOf(fileExt) > -1);
};

// Define Files names for concat files
var desPathJs = hexo.public_dir+"js/final.js";
var desPathCss = hexo.public_dir+"css/finalcss.css";
jsFilesArr =  new Array();
cssFilesArr = new Array();

// Get all files in public folder
var getFiles = function(dir)  {
    var files = fs.readdirSync(dir);
    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var name = dir+'/'+files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name);
        }else{
            var i = name.lastIndexOf('.');
            var ext = (i < 0) ? '' : name.substr(i);
            if(ext == '.js') {
              jsFilesArr.push(name);
            }
            if(ext == '.css') {
              cssFilesArr.push(name)
            }
        }
    }
    concatJsFiles(jsFilesArr);
    concatCssFiles(cssFilesArr);
};

// Concatenate JS Files in One File (Save in public/js folder)
var concatJsFiles = function(data) {
  concat(data , desPathJs , function() {
    console.log('doneJsFiles');
  });
};
// Concatenate CSS Files in One File (Save in public/css folder)
var concatCssFiles = function(data) {
  concat(data , desPathCss , function() {
    console.log('doneCssFiles');
  });
};

// Perform file content minification overwriting the original content
var compress = function(filename, opts) {
    var fileExt = path.extname(filename||'').replace(".","");

    // Compress Images
    if(fileExt == 'png' || fileExt == 'jpg' || fileExt == 'jpeg' || fileExt == 'gif') {
       imagemin(filename , filename, { optimizationLevel: 4 }, function (err, data) {
            console.log('Saved ' + data.diffSize);
        });
    }

    if (alreadyPacked(filename) || !processable(fileExt)) return;
    var originalContent = fs.readFileSync(filename).toString();
    var minifiedContent = supportedResources[fileExt](originalContent, opts);
    if (minifiedContent) {
        if (!opts.silent) {
            console.log("[info] Minify: " + filename.replace(hexo.public_dir, ""));
        }
        fs.unlink( filename, function ( err ) {
            if ( err ) throw err;
            fs.writeFile(filename, minifiedContent, 'utf8', function(err) {
                if (err) throw err;
            })
        });
    }
};

// Gzip Html files of public folder
var gzipHtml = function(){
   var baseDir = hexo.base_dir;
   var gzip = zlib.createGzip('level=9');
   hexo.call('generate', function(err){
      if (err) throw(err);
      var start = Date.now();
      var traverseFileSystem = function (currentPath) {
         var files = fs.readdirSync(currentPath);
         for (var i in files) {
            var currentFile = currentPath + '/' + files[i];
            var stats = fs.statSync(currentFile);
            if (stats.isFile()) {
               if(currentFile.match(/\.(html)$/)) {
                  var gzip = zlib.createGzip();
                  var inp = fs.createReadStream(currentFile);
                  var out = fs.createWriteStream(currentFile+'.gz');
                  inp.pipe(gzip).pipe(out);
                  console.log('['+'create'.green+'] '+currentFile+'.gz');
               }
            }
           else if (stats.isDirectory()) {
                  traverseFileSystem(currentFile);
                }
          }
        };
      traverseFileSystem(hexo.public_dir);
      var finish = Date.now();
      var elapsed = (finish - start) / 1000;
   });
};

// For Deploy public folder.
var deployProject = function(args, callback){

  var config = hexo.config.deploy,
    log = hexo.log,
    extend = hexo.extend,
    deployer = extend.deployer.list();

  if (!config || !config.type){
    var help = [
      'You should configure deployment settings in _config.yml first!',
      '',
      'Available Types:',
      '  ' + Object.keys(deployer).join(', '),
      '',
      'For more help, you can check the online docs: ' + 'http://hexo.io/'.underline
    ];

    console.log(help.join('\n'));
  }

  if (!Array.isArray(config)) config = [config];

  var generate = function(callback){
    if (args.g || args.generate){
      hexo.call('generate', callback);
    } else {
      fs.exists(hexo.public_dir, function(exist){
        if (exist) return callback();
        hexo.call('generate', callback);
      });
    }
  };

  var onDeployStarted = function() {
    hexo.emit('deployBefore');
  };

  var onDeployFinished = function(err) {
    hexo.emit('deployAfter', err);
    if (err) return callback(err);
  };

  generate(function(err){
    if (err) return callback(err);

    onDeployStarted();
    async.eachSeries(config, function(item, next){
      var type = item.type;
      log.i('Start deploying: ' + type);
      deployer[type](_.extend({}, item, args), function(err){
        if (err) return callback(err);

        log.i('Deploy done: ' + type);
        next();
      });
    }, onDeployFinished);
  });
};

// options for generate public folder
var generateOptions = {
  alias: 'g',
  options: [
    {name: '-d, --deploy', desc: 'Deploy after generated'},
    {name: '-w, --watch', desc: 'Watch file changes'}
  ]
};

// options for deploy public folder
var deployOptions = {
  alias: 'd',
  options: [
    {name: '--setup', desc: 'Setup without deployment'},
    {name: '-g, --generate', desc: 'Generate before deployment'}
  ]
};

// Plugin hook function.
hexo.extend.console.register('optimize', 'Hexo Generator Optimize', function(args) {

        // getFiles(hexo.public_dir);
          async.series([
            function(next) {
                hexo.call("generate", next)
            },
            function(callback) {
                generate.generateFolder(generateOptions);
                gzipHtml();
                callback(null, null);
            },
            function(callback) {
                if (fs.existsSync(hexo.public_dir)) {
                    minify(hexo.public_dir, args);
                } else {
                    throw new Error(hexo.public_dir + " NOT found.")
                }
                callback(null, null);
            },
            function(callback) {
                if(args.d == true) {
                  deployProject(deployOptions);
                  callback(null, null);
                }
            },

        ], function(err){
            if (err) {
                util.error("[error] Minify: -> " + err.message);
            }
        });
});
