var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

io.on('connection', function (socket) {
    console.log("a user connected");

    socket.on('login', function (username) {
        console.log("username : " + username);
    });

    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
        console.log('chat message', msg.content);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});