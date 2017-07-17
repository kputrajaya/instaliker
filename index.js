var config = require('./config');
var logger = require('./logger')(config.action.username);
var casper = require('casper').create(config.casper);

var run = function () {
  var baseUrl = 'https://www.instagram.com';
  var likedCount = 0;
  var commentedCount = 0;

  casper.start(baseUrl, function () {
    logger.debug('Start: Homepage');
    casper.waitForText('Log in');
  });

  casper.then(function () {
    casper.clickLabel('Log in', 'a');
    casper.fill('form', {
      username: config.action.username,
      password: config.action.password
    }, true);

    logger.debug('Start: Logging in');
    casper.waitForSelector('html.logged-in');
  });

  casper.then(function () {
    casper.each(config.action.hashtags, function (self, hashtag) {
      casper.thenOpen(baseUrl + '/explore/tags/' + hashtag.tag + '/', function () {
        logger.debug('Hashtag: ' + hashtag.tag);
        casper.waitForSelector('a[href^="/p/"]');

        casper.then(function () {
          var posts = casper.getElementsInfo('a[href^="/p/"]');
          casper.each(posts, function (self, post) {
            if (hashtag.like) {
              if (logger.getLiked().indexOf(post.attributes.href) >= 0) {
                // already liked, based on log
                logger.debug('Skipped: ' + post.attributes.href);
              } else {
                // open page then like
                casper.thenOpen(baseUrl + post.attributes.href, function () {
                  logger.debug('Opened: ' + post.attributes.href);
                  logger.addLiked(post.attributes.href);

                  casper.wait(300, function () {
                    if (!casper.exists('.coreSpriteHeartOpen')) return;

                    casper.click('.coreSpriteHeartOpen');
                    logger.debug('Liked: ' + post.attributes.href);
                    likedCount++;
                  });
                });
              }
            }
            if (hashtag.comment) {
              // comment
            }
          });
        });
      });
    });
  });

  casper.then(function () {
    logger.debug('Finish: Liked ' + likedCount + ', commented ' + commentedCount);
  });

  casper.run();
};

if (
  config.action &&
  config.action.username &&
  config.action.password &&
  config.action.hashtags
) {
  logger.checkLiked();
  run();
} else {
  logger.debug('Arguments not complete');
  casper.exit();
}
