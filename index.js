var uglify   = require('uglify-js'),
    imagemin = require('image-min'),
    cleanCSS = require('clean-css'),
    async    = require('async'),
    zlib     = require('zlib');

var concat = require('concat-files');

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

var desPathJs = hexo.public_dir+"js/final.js";
var desPathCss = hexo.public_dir+"css/finalcss.css";
jsFilesArr =  new Array();
cssFilesArr = new Array();
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

// Plugin hook function.
hexo.extend.console.register('optimize', 'Hexo Generator Optimize', function(args) {

      getFiles(hexo.public_dir);
      async.series([
          function(next) {
              hexo.call("generate", next)
          },
          function() {
              if (fs.existsSync(hexo.public_dir)) {
                  minify(hexo.public_dir, args);
              } else {
                  throw new Error(hexo.public_dir + " NOT found.")
              }
          }

      ], function(err){
          if (err) {
              util.error("[error] Minify: -> " + err.message);
          }
      });
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
        traverseFileSystem(baseDir+'public');
        var finish = Date.now();
        var elapsed = (finish - start) / 1000;
     });
});