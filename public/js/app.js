/**
 * アプリケーション全体の制御を行うメインモジュール
 */

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * アプリケーションの初期化
 */
async function initApp() {
    try {
        // 各モジュールの初期化
        await Promise.all([
            Auth.init(),
            Chat.init(),
            Shift.init()
        ]);
        
        // タブ切り替えのイベントリスナーを設定
        setupTabListeners();
        
        // デフォルトアバター画像を確認
        checkDefaultAvatar();
        
        console.log('アプリケーションの初期化が完了しました');
    } catch (error) {
        console.error('アプリケーションの初期化に失敗しました:', error);
        Utils.showNotification('アプリケーションの初期化に失敗しました', 'error');
    }
}

/**
 * タブ切り替えのイベントリスナー設定
 */
function setupTabListeners() {
    const chatBtn = document.getElementById('chatBtn');
    const shiftBtn = document.getElementById('shiftBtn');
    const chatArea = document.getElementById('chatArea');
    const shiftArea = document.getElementById('shiftArea');
    
    // チャットタブをクリック
    chatBtn.addEventListener('click', () => {
        if (!Auth.currentUser) return;
        
        // UI更新
        chatBtn.classList.add('active');
        shiftBtn.classList.remove('active');
        chatArea.style.display = 'block';
        shiftArea.style.display = 'none';
        
        // アクティブタブを保存
        localStorage.setItem('activeTab', 'chat');
        
        // チャットモジュールを開始
        Chat.start();
    });
    
    // シフト管理タブをクリック
    shiftBtn.addEventListener('click', () => {
        if (!Auth.currentUser) return;
        
        // UI更新
        shiftBtn.classList.add('active');
        chatBtn.classList.remove('active');
        shiftArea.style.display = 'block';
        chatArea.style.display = 'none';
        
        // アクティブタブを保存
        localStorage.setItem('activeTab', 'shift');
        
        // シフトモジュールを開始
        Shift.start();
    });
}

/**
 * デフォルトアバター画像の読み込みを確認
 */
function checkDefaultAvatar() {
    const defaultAvatar = new Image();
    defaultAvatar.src = 'assets/images/default-avatar.png';
    
    defaultAvatar.onerror = () => {
        console.warn('デフォルトアバター画像の読み込みに失敗しました。代替画像を使用します。');
        
        // 代替アバターを作成（canvasを使用）
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        
        // 背景色
        ctx.fillStyle = '#4a6da7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // テキスト
        ctx.fillStyle = 'white';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', canvas.width / 2, canvas.height / 2);
        
        // 画像としてエクスポート
        try {
            const dataUrl = canvas.toDataURL('image/png');
            
            // アバターを置き換え
            document.querySelectorAll('.avatar img[src="assets/images/default-avatar.png"]').forEach(img => {
                img.src = dataUrl;
            });
        } catch (e) {
            console.error('代替アバター画像の作成に失敗しました:', e);
        }
    };
}

/**
 * アプリケーションの状態変更ハンドラ
 * @param {Object} state - アプリケーションの状態
 */
function handleAppStateChange(state) {
    if (state.isLoggedIn) {
        // ログイン時の処理
        if (state.activeTab === 'chat') {
            Chat.start();
        } else if (state.activeTab === 'shift') {
            Shift.start();
        } else {
            // デフォルトはチャット
            Chat.start();
        }
    } else {
        // ログアウト時の処理
        Chat.stop();
    }
}

// 認証状態変更時にアプリケーションの状態変更ハンドラを呼び出す
firebase.auth().onAuthStateChanged(user => {
    const activeTab = localStorage.getItem('activeTab') || 'chat';
    
    handleAppStateChange({
        isLoggedIn: !!user,
        activeTab: activeTab
    });
}); 