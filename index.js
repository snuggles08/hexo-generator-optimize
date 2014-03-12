var uglify = require('uglify-js'),
    imagemin = require('imagemin'),
    cleanCSS = require('clean-css'),
    async = require('async'),
    zlib = require('zlib');

var fs = require('fs'),
    path = require('path'),
    util = require('util');

// File types for Minify.
var supportedResources = {
    'js': function(content, opts) { return uglify.minify(content, { fromString: true }).code },
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

// Perform file content minification overwriting the original content
var compress = function(filename, opts) {
    var fileExt = path.extname(filename||'').replace(".","");

    // Compress Images
    if(fileExt == 'png' || fileExt == 'jpg' ||  fileExt == 'jpeg') {
        imagemin(filename, filename , function(error){
            if ( error ) throw err;
            console.log("[info] Compressed");
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
      if (err) return callback(err);
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