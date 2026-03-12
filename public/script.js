const socket = io();
const peer = new Peer(); // PeerJSサーバーへ接続

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const statusText = document.getElementById('status');
const setupArea = document.getElementById('setup-area');
const videoArea = document.getElementById('video-area');
const remoteVideo = document.getElementById('remote-video');

let myPeerId = null;

// PeerID取得完了時
peer.on('open', (id) => {
    myPeerId = id;
    statusText.innerText = "ステータス: 準備完了";
});

// --- 親（配信者）の処理 ---
btnCreate.addEventListener('click', () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    if (!word || !pin) return alert("ワードとPINを入力してください");

    // サーバーに部屋作成を通知
    socket.emit('create-room', { word, pin, peerId: myPeerId });
    statusText.innerText = "ステータス: 入室待ち...";
    btnCreate.disabled = true;
});

// 子が入室してきたら画面共有を開始（親側で発火）
socket.on('start-sharing', async (childPeerId) => {
    try {
        statusText.innerText = "ステータス: 画面取得中...";
        // Android/PC共通の画面取得API
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { cursor: "always" },
            audio: true 
        });
        
        // 子に発信
        peer.call(childPeerId, stream);
        statusText.innerText = "ステータス: 配信中";
        setupArea.classList.add('hidden');
    } catch (err) {
        console.error(err);
        statusText.innerText = "ステータス: 共有キャンセル";
    }
});

// --- 子（閲覧者）の処理 ---
btnJoin.addEventListener('click', () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    
    socket.emit('join-room', { word, pin, peerId: myPeerId });
});

// 映像を受信した時（子側で発火）
peer.on('call', (call) => {
    call.answer(); // 応答する
    call.on('stream', (stream) => {
        remoteVideo.srcObject = stream;
        setupArea.classList.add('hidden');
        videoArea.classList.remove('hidden');
        statusText.innerText = "ステータス: 受信中";
    });
});

socket.on('error-msg', (msg) => alert(msg));