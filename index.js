var casper = require('casper').create({
    pageSettings: {loadImages: false},
    waitTimeout: 30000
});
var username = casper.cli.get('u');
var password = casper.cli.get('p');
var hashtags = casper.cli.args;
var logger = require('./logger')(username);

var run = function () {
    var baseUrl = 'https://www.instagram.com';
    var likedCount = 0;

    casper.start(baseUrl, function () {
        logger.debug('Start: Homepage');
        casper.waitForText('Log in');
    });

    casper.then(function () {
        casper.clickLabel('Log in', 'a');
        casper.fill('form', {
            username: username,
            password: password
        }, true);

        logger.debug('Start: Logging in');
        casper.waitForSelector('html.logged-in');
    });

    casper.then(function () {
        casper.each(hashtags, function (self, hashtag) {
            casper.thenOpen(baseUrl + '/explore/tags/' + hashtag + '/', function () {
                logger.debug('Hashtag: ' + hashtag);
                casper.waitForSelector('a[href^="/p/"]');

                casper.then(function () {
                    var posts = casper.getElementsInfo('a[href^="/p/"]');
                    casper.each(posts, function (self, post) {
                        // liked, based on log
                        if (logger.getLiked().indexOf(post.attributes.href) >= 0) {
                            logger.debug('Skipped: ' + post.attributes.href);
                            logger.addLiked(post.attributes.href);
                            return;
                        }

                        // open page then like
                        casper.thenOpen(baseUrl + post.attributes.href, function () {
                            logger.debug('Opened: ' + post.attributes.href);
                            logger.addLiked(post.attributes.href);

                            casper.wait(500, function () {
                                if (!casper.exists('.coreSpriteHeartOpen')) return;

                                casper.click('.coreSpriteHeartOpen');
                                logger.debug('Liked: ' + post.attributes.href);
                                likedCount++;
                            });
                        });
                    });
                });
            });
        });
    });

    casper.then(function () {
        logger.debug('Finish: Liked ' + likedCount + ' post(s)');
    });

    casper.run();
};

if (username && password && hashtags) {
    logger.checkLiked();
    run();
} else {
    logger.debug('Arguments not complete');
    casper.exit();
}
