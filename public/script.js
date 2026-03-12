const socket = io();
const peer = new Peer();

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const statusText = document.getElementById('status');
const setupArea = document.getElementById('setup-area');
const videoArea = document.getElementById('video-area');
const remoteVideo = document.getElementById('remote-video');

let myPeerId = null;
let localStream = null; // 自分の映像ストリームを保存しておく

// PeerID取得完了
peer.on('open', (id) => {
    myPeerId = id;
    statusText.innerText = "ステータス: 準備完了";
});

// --- 親（配信者：スマホ/PC）の処理 ---
btnCreate.addEventListener('click', async () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    
    if (!myPeerId) return alert("通信準備中です...");
    if (!word || !pin) return alert("ワードとPINを入力してください");

    try {
        // 【重要】ボタンを押した直後に画面共有の許可を取る（スマホ対策）
        statusText.innerText = "ステータス: 共有する画面を選択してください...";
        localStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true 
        });

        // 共有が許可されたら、サーバーに部屋作成を知らせる
        socket.emit('create-room', { word, pin, peerId: myPeerId });
        
        statusText.innerText = "ステータス: 配信準備完了！子が参加するのを待っています...";
        btnCreate.disabled = true;
        btnJoin.disabled = true;

        // 配信側も自分の映像を確認したい場合は以下をコメントアウト解除
        // videoArea.classList.remove('hidden');
        // remoteVideo.srcObject = localStream;

    } catch (err) {
        console.error(err);
        statusText.innerText = "エラー: 画面共有が許可されませんでした。";
    }
});

// 子が入室してきた時の通知を受け取る（親側）
socket.on('start-sharing', (childPeerId) => {
    if (localStream) {
        statusText.innerText = "ステータス: 子が入室しました。映像を送信中...";
        // すでに取得済みのストリームを子に送る
        peer.call(childPeerId, localStream);
    }
});

// --- 子（閲覧者：PC/スマホ）の処理 ---
btnJoin.addEventListener('click', () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    if (!myPeerId) return alert("準備中...");
    
    socket.emit('join-room', { word, pin, peerId: myPeerId });
    statusText.innerText = "ステータス: 入室リクエスト送信済み...";
});

// 映像を受信した時（子側）
peer.on('call', (call) => {
    call.answer(); // 応答
    call.on('stream', (stream) => {
        remoteVideo.srcObject = stream;
        setupArea.classList.add('hidden');
        videoArea.classList.remove('hidden');
        statusText.innerText = "ステータス: 受信中";
    });
});