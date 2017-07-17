var fs = require('fs');

module.exports = function (username) {
  var logDir = 'logs/';
  var debugFilename = logDir + username + '-debug.log';
  var likedFilename = logDir + username + '-liked.log';
  var cachedLiked = false;

  return {
    debug: function (message) {
      console.log(message);
      fs.write(debugFilename, message + "\n", 'a');
    },
    getLiked: function () {
      cachedLiked = cachedLiked !== false ?
      cachedLiked :
      (fs.isReadable(likedFilename) ? fs.read(likedFilename).split("\n") : []);
      return cachedLiked;
    },
    addLiked: function (message) {
      fs.write(likedFilename, message + "\n", 'a');
    },
    checkLiked: function () {
      var fileSize = fs.isFile(likedFilename) ? fs.size(likedFilename) : 0;
      var limit = 1048576; // 1 MB

      if (fileSize > limit) {
        this.debug('Maintenance: Removing "' + likedFilename + '" due to size limit');
        fs.remove(likedFilename);
      }
    }
  };
};
