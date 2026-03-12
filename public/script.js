const socket = io();
const peer = new Peer();

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const statusText = document.getElementById('status');
const setupArea = document.getElementById('setup-area');
const videoArea = document.getElementById('video-area');
const remoteVideo = document.getElementById('remote-video');

let myPeerId = null;
let localStream = null;

peer.on('open', (id) => {
    myPeerId = id;
    statusText.innerText = "準備完了。ワードを入れて「部屋を作る」を押してください";
});

// --- 【親】配信を始める処理 ---
btnCreate.addEventListener('click', () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    if (!word || !pin) return alert("ワードとPINを入力してください");

    statusText.innerText = "画面共有を許可してください...";

    // Android対策：クリックした瞬間に最優先で画面取得を開始
    // 音声(audio)はエラーの元になるため必ず false
    navigator.mediaDevices.getDisplayMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
    })
    .then(stream => {
        localStream = stream;
        // 画面取得が成功したら、サーバーに部屋作成を通知
        socket.emit('create-room', { word, pin, peerId: myPeerId });
        statusText.innerText = "配信準備完了！子が参加するのを待っています...";
        btnCreate.disabled = true;
        btnJoin.disabled = true;
    })
    .catch(err => {
        console.error(err);
        statusText.innerText = "エラー: " + err.name + "。画面共有が許可されませんでした。";
    });
});

// 子が入室してきた通知を受け取る（親側）
socket.on('start-sharing', (childPeerId) => {
    if (localStream) {
        statusText.innerText = "子が接続しました。映像送信中...";
        peer.call(childPeerId, localStream);
    }
});

// --- 【子】入室する処理 ---
btnJoin.addEventListener('click', () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    if (!word || !pin) return alert("ワードとPINを入力してください");
    
    socket.emit('join-room', { word, pin, peerId: myPeerId });
    statusText.innerText = "入室確認中...";
});

// 映像を受信した時の処理（子側）
peer.on('call', (call) => {
    call.answer();
    call.on('stream', (stream) => {
        remoteVideo.srcObject = stream;
        setupArea.classList.add('hidden');
        videoArea.classList.remove('hidden');
        statusText.innerText = "受信中";
    });
});

socket.on('error-msg', (msg) => {
    alert(msg);
    statusText.innerText = msg;
});