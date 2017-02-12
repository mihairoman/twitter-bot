// Dependencies =========================
var Twit = require('twit');
var ura = require('unique-random-array');
var config = require('./config');
var querries = require('./helpers/querries');
var sentiment = require('./helpers/sentiment');

var Twitter = new Twit(config);
// STREAM API for interacting with a USER =======
// set up a user stream
var stream = Twitter.stream('user');

// RANDOM QUERY STRING  =========================
var qs = ura(querries.queryString);
var qsSq = ura(querries.queryStringSubQuery);
var rt = ura(querries.resultType);
var rs = ura(querries.responseString);

module.exports = (function() {

    var paramBls = function() {
        var ret = '',
            arr = querries.blockedStrings,
            i = 0,
            n = arr.length;
        for (i; i < n; i++) {
            ret += ' -' + arr[i];
        }
        return ret;
    };

    // function to generate a random tweet tweet
    var ranDom = function(arr) {
        var index = Math.floor(Math.random() * arr.length);
        return arr[index];
    };

    var retweet = function() {
        var paramQS = qs();
        paramQS += qsSq();
        var paramRT = rt(),
            params = {
                q: paramQS + paramBls(),
                result_type: paramRT,
                lang: 'en'
            };

        Twitter.get('search/tweets', params, function(err, data) {
            if (!err) {
                // grab ID of tweet to retweet
                try {
                    // run sentiment check ==========
                    var retweetId = data.statuses[0].id_str;
                    var retweetText = data.statuses[0].text;

                    // setup http call
                    var httpCall = sentiment.init();

                    httpCall.send('txt=' + retweetText).end(function(result) {
                        var sentim = result.body.result.sentiment;
                        var confidence = parseFloat(result.body.result.confidence);
                        if (sentim === 'Negative' && confidence >= 75) {
                            return;
                        }
                    })
                } catch (e) {
                    return;
                }
                // Tell TWITTER to retweet
                Twitter.post('statuses/retweet/:id', {
                    id: retweetId
                }, function(err, response) {
                    if (response) {
                        console.log('RETWEETED!', ' Query String:', paramQS)
                    }
                    // if there was an error while tweeting
                    if (err) {
                        console.error('RETWEET ERROR! Duplication maybe...:', err, 'Query String:', paramQS)
                    }
                })
            } else {
                console.error('Something went wrong while SEARCHING...')
            }
        });
    };

    var favoriteTweet = function() {
        var paramQS = qs();
        paramQS += qsSq();
        var paramRT = rt();
        var params = {
            q: paramQS + paramBls(),
            result_type: paramRT,
            lang: 'en'
        }

        // find the tweet
        Twitter.get('search/tweets', params, function(err, data) {
            // find tweets
            var tweet = data.statuses,
                randomTweet = ranDom(tweet); // pick a random tweet

            // if random tweet exists
            if (typeof randomTweet !== 'undefined') {
                // run sentiment check ==========
                // setup http call
                var httpCall = sentiment.init(),
                    favoriteText = randomTweet['text'];

                httpCall.send('txt=' + favoriteText).end(function(result) {
                    var sentim = result.body.result.sentiment,
                        confidence = parseFloat(result.body.result.confidence);
                    // if sentiment is Negative and the confidence is above 75%
                    if (sentim === 'Negative' && confidence >= 75) {
                        return;
                    }
                });

                // Tell TWITTER to 'favorite'
                Twitter.post('favorites/create', {
                    id: randomTweet.id_str
                }, function(err, response) {
                    // if there was an error while 'favorite'
                    if (err) {
                        console.error('CANNOT BE FAVORITE... Error: ', err, ' Query String: ' + paramQS);
                    } else {
                        console.log('FAVORITED... Success!!!', ' Query String: ' + paramQS);
                    }
                });
            }
        });
    };

    var followed = function(event) {
        console.log('Follow Event now RUNNING');
        // get USER's twitter handle (screen name)
        var screenName = event.source.screen_name;

        // CREATE RANDOM RESPONSE  ============================
        var responseString = rs(),
            find = 'screenName',
            regex = new RegExp(find, 'g');
        responseString = responseString.replace(regex, screenName);
        // function that replies back to every USER who followed for the first time
        tweetNow(responseString);
    };

    var tweetNow = function(tweetTxt) {
        var tweet = {
            status: tweetTxt
        }

        var n = tweetTxt.search(/@config.twitter_user/i)

        if (n !== -1) {
            console.log('TWEET SELF! Skipped!!');
        } else {
            Twitter.post('statuses/update', tweet, function(err, data, response) {
                if (err) {
                    console.error('Cannot Reply to Follower. ERROR!: ' + err);
                } else {
                    console.log('Reply to follower. SUCCESS!');
                }
            });
        }
    };

    return {
        init: function(retweetFrequency, favoriteFrequency) {
            stream.on('follow', followed);
            retweet();
            setInterval(retweet, 1000 * 60 * retweetFrequency);
            favoriteTweet();
            setInterval(favoriteTweet, 1000 * 60 * favoriteFrequency);
        }
    }
})();
