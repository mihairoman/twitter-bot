var http = require('http'),
    twitterBot = require('./src/bot'),
    hostname = '0.0.0.0',
    port = (process.env.PORT || 3000);

var server = http.createServer(function(req, res) {
    //init with retweet frequency and favorite tweets frequency (in minutes)
    twitterBot.init(60, 60);
});

server.listen(port, hostname, function() {
    console.log(`Server running at http://${hostname}:${port}/ `);
});
