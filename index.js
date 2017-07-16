var casper = require('casper').create({
    pageSettings: {
        loadImages: false
    },
    waitTimeout: 30000
});
var fs = require('fs');

var username = casper.cli.get(0);
var password = casper.cli.get(1);
var hashtags = casper.cli.args.slice(2);

var baseUrl = 'https://www.instagram.com';
var logDir = 'logs';
var likedLogName = logDir + '/' + username + '-liked.txt';
var likedLog = fs.isReadable(likedLogName) ? fs.read(likedLogName).split("\n") : [];
var likedCount = 0;

casper.start(baseUrl, function () {
    casper.echo('Start: Homepage');
    casper.waitForText('Log in');
});

casper.then(function () {
    casper.clickLabel('Log in', 'a');
    casper.fill('form', {
        username: username,
        password: password
    }, true);

    casper.echo('Start: Logging in');
    casper.waitForSelector('html.logged-in');
});

casper.then(function () {
    casper.each(hashtags, function (self, hashtag) {
        casper.thenOpen(baseUrl + '/explore/tags/' + hashtag + '/', function () {
            casper.echo('Hashtag: ' + hashtag);
            casper.waitForSelector('a[href^="/p/"]');

            casper.then(function () {
                var posts = casper.getElementsInfo('a[href^="/p/"]');
                casper.each(posts, function (self, post) {
                    // liked, based on log
                    if (likedLog.indexOf(post.attributes.href) >= 0) {
                        casper.echo('Skipped: ' + post.attributes.href);
                        fs.write(likedLogName, post.attributes.href + "\n", 'a');
                        return;
                    }

                    // open page then like
                    casper.thenOpen(baseUrl + post.attributes.href, function () {
                        casper.echo('Opened: ' + post.attributes.href);
                        fs.write(likedLogName, post.attributes.href + "\n", 'a');

                        casper.wait(500, function () {
                            if (!casper.exists('.coreSpriteHeartOpen')) return;

                            casper.click('.coreSpriteHeartOpen');
                            casper.echo('Liked: ' + post.attributes.href);
                            likedCount++;
                        });
                    });
                });
            });
        });
    });
});

casper.then(function () {
    casper.echo('Total liked: ' + likedCount);
});

casper.run();
