var http = require('http'),
    twitterBot = require('./src/bot'),
    hostname = '0.0.0.0',
    port = (process.env.PORT || 3000);

var server = http.createServer(function(req, res) {
    console.log(req.headers);

    res.writeHead(200, {
        Location: 'https://twitter.com/just_bot_things'
    });
    res.end();
});

setInterval(function() {
    http.get("http://just-a-bot.herokuapp.com");
}, 300000); // every 5 minutes

server.listen(port, hostname, function() {
    //init with retweet frequency and favorite tweets frequency (in minutes)
    twitterBot.init(180, 180);
    console.log(`Server running at http://${hostname}:${port}/ `);
});
