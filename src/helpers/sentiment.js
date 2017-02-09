const unirest = require('unirest')

var sentiment = {}

sentiment.init = function() {
    return unirest.post('http://sentiment.vivekn.com/api/text/')
        .header('X-Mashape-Key', process.env.SENTIMENT_KEY)
        .header('Content-Type', 'application/x-www-form-urlencoded')
        .header('Accept', 'application/json')
}

module.exports = sentiment
