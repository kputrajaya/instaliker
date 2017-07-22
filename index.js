var config = require('./config');
var fs = require('fs');
var webpage = require('webpage');
var casper = require('casper').create(config.casper);

var run = function () {
  var username = casper.cli.get(0);
  var action = config.actions[username];
  if (!action) {
    console.log('User is not configured');
    casper.exit();
    return;
  }

  var baseUrl = 'https://www.instagram.com';
  var logFile = 'logs/' + username + '-liked.log';

  var util = {
    getLiked: function () {
      var fileSize = fs.isFile(logFile) ? fs.size(logFile) : 0;
      var limit = 1048576; // 1 MB
      if (fileSize > limit) {
        this.debug('Maintenance: Removing "' + logFile + '" due to size limit');
        fs.remove(logFile);
      }

      return fs.isReadable(logFile) ? fs.read(logFile).split("\n") : [];
    },
    addLiked: function (message) {
      fs.write(logFile, message + "\n", 'a');
    },
    getPosts: function (hashtags, callback) {
      var posts = [];
      var countdown = hashtags.length;
      var regex = /"code": "([\w-_]+)"/g;
      var matches;

      hashtags.forEach(function (hashtag) {
        var page = webpage.create();
        page.open(baseUrl + '/explore/tags/' + hashtag, function (status) {
          while (!!(matches = regex.exec(page.content))) {
            posts.push(matches[1]);
          }

          if (--countdown === 0) {
            callback(posts);
          }
        });
      });
    },
    random: function (delay) {
      var min = delay[0];
      var max = delay[1];
      return Math.round(Math.random() * (max - min)) + min;
    }
  };

  util.getPosts(action.hashtags, function (posts) {
    // filter posts
    var liked = util.getLiked();
    var filteredPosts = [];
    console.log('Fetched: ' + posts.length + ' posts');
    posts.forEach(function (post) {
      if (liked.indexOf(post) === -1) {
        filteredPosts.push(post);
      }
    });
    console.log('Filtered: ' + filteredPosts.length + ' posts');

    // open homepage
    casper.start(baseUrl, function () {
      console.log('Start: Homepage');
      casper.waitForText('Log in');
    });

    // log in
    casper.then(function () {
      console.log('Start: Logging in');
      casper.clickLabel('Log in', 'a');
      casper.fill('form', {username: username, password: action.password}, true);
      casper.waitForSelector('html.logged-in');
    });

    // open and like posts
    casper.then(function () {
      casper.each(filteredPosts, function (self, post) {
        casper.wait(util.random(config.delay), function () {
          casper.thenOpen(baseUrl + '/p/' + post + '/', function () {
            console.log('Opened: ' + post);
            util.addLiked(post);

            casper.wait(500, function () {
              if (casper.exists('.coreSpriteHeartOpen')) {
                casper.click('.coreSpriteHeartOpen');
                console.log('Liked: ' + post);
              }
            });
          });
        });
      });
    });

    casper.run();
  });
};

run();
