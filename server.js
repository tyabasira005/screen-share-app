const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const rooms = {}; // 部屋データ保持

io.on('connection', (socket) => {
    // 部屋作成
    socket.on('create-room', ({ word, pin, peerId }) => {
        rooms[word] = { pin, hostPeerId: peerId };
        socket.join(word);
        console.log(`部屋作成: ${word}`);
    });

    // 入室
    socket.on('join-room', ({ word, pin, peerId }) => {
        const room = rooms[word];
        if (room && room.pin === pin) {
            // 親に対して「このPeerIDの子に送って」と通知
            io.to(word).emit('start-sharing', peerId);
            console.log(`入室成功: ${word}`);
        } else {
            socket.emit('error-msg', 'ワードまたはPINが正しくありません');
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));