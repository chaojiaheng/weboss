/*
 * 工程脚本
 * webpack-production执行结束之后执行
 * 将webpack生成的文件拷贝到cdnFile中
 */
var fs = require('fs-extra');
var read = require('fs-readdir-recursive');
var path = require('path');
var pkgInfo = require('./package.json');
var version = pkgInfo.version;

var copyInstructions = [
  {
    label: 'Copy webpack created files',
    source: '../../public/' + version,
    destination: '../../cdnfile/' + version,
  }
];

copyInstructions.map(function(instruction) {
  var source = instruction.source;
  var destination = instruction.destination;

  // 先删除cdnFile文件夹中已存在的同名目录
  fs.removeSync(destination);

  var files = read(source);

  files.forEach(file => {
    var sourcePath = source + '/' + file;
    var destinationPath = destination + '/' + file;

    fs.copy(
      path.resolve(sourcePath),
      path.resolve(destinationPath),
      function(err) {
        if (err) {
          return console.error(err);
        }
      }
    );
  });
});