/**
 * チャット機能を管理するモジュール
 */

const Chat = {
    /**
     * ユーザーキャッシュ（メッセージ表示の高速化のため）
     */
    userCache: {},
    
    /**
     * メッセージの解除リスナー（クリーンアップ用）
     */
    messageListener: null,
    
    /**
     * メンション中のユーザー
     */
    mentioningUsers: [],
    
    /**
     * 現在選択中のメンションインデックス
     */
    currentMentionIndex: -1,
    
    /**
     * 初期化処理
     * @returns {Promise}
     */
    init: function() {
        return new Promise((resolve) => {
            // チャット関連のイベントハンドラを設定
            this.setupEventListeners();
            
            // 絵文字ピッカーの初期化
            this.initEmojiPicker();
            
            resolve();
        });
    },
    
    /**
     * チャットモジュールの開始（ログイン後に呼び出される）
     */
    start: function() {
        // メッセージリストのクリア
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';
        
        // ユーザーリストを取得（メンション用）
        Database.getAllUsers().then(users => {
            if (users && users.length > 0) {
                this.userCache = users.reduce((acc, user) => {
                    if (user && user.uid) {
                        acc[user.uid] = user;
                    }
                    return acc;
                }, {});
                console.log('ユーザーキャッシュを更新しました', Object.keys(this.userCache).length);
            } else {
                console.warn('ユーザーリストが空です');
            }
        }).catch(error => {
            console.error('ユーザーリストの取得に失敗しました:', error);
        });
        
        // 過去のメッセージを取得して表示
        Database.getMessages(50).then(messages => {
            // メッセージを時系列順にソート（古い→新しい）
            messages.sort((a, b) => a.createdAt - b.createdAt);
            
            // 既存のメッセージをクリアしてから追加
            messagesList.innerHTML = '';
            
            messages.forEach(message => {
                this.displayMessage(message);
            });
            
            // 最新メッセージまでスクロール
            this.scrollToBottom();
        }).catch(error => {
            console.error('メッセージの取得に失敗しました:', error);
            Utils.showNotification('メッセージの読み込みに失敗しました。ページをリロードしてください。', 'error');
        });
        
        // 新しいメッセージをリアルタイムで監視
        if (this.messageListener) {
            this.messageListener(); // 以前のリスナーがあれば解除
        }
        this.messageListener = Database.onNewMessage(message => {
            this.displayMessage(message);
            this.scrollToBottom();
            
            // メンション通知
            this.checkForMention(message);
        });
    },
    
    /**
     * チャットモジュールの停止（ログアウト時に呼び出される）
     */
    stop: function() {
        if (this.messageListener) {
            this.messageListener(); // リスナーを解除
            this.messageListener = null;
        }
    },
    
    /**
     * チャット関連のイベントハンドラ設定
     */
    setupEventListeners: function() {
        // メッセージ送信ボタン
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter キーでのメッセージ送信（Shift + Enter で改行）
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                
                // メンションリストが表示されていて選択中の場合
                const mentionList = document.getElementById('mentionList');
                if (mentionList.style.display === 'block' && this.currentMentionIndex >= 0) {
                    this.selectMention(this.currentMentionIndex);
                    return;
                }
                
                this.sendMessage();
            } else if (e.key === 'ArrowDown' && document.getElementById('mentionList').style.display === 'block') {
                e.preventDefault();
                this.navigateMention(1);
            } else if (e.key === 'ArrowUp' && document.getElementById('mentionList').style.display === 'block') {
                e.preventDefault();
                this.navigateMention(-1);
            }
        });
        
        // メッセージ入力欄の変更検知（メンション検出用）
        document.getElementById('messageInput').addEventListener('input', (e) => {
            this.handleMentionInput(e.target.value);
        });
        
        // 絵文字ボタン
        document.getElementById('emojiBtn').addEventListener('click', () => {
            const emojiPicker = document.getElementById('emojiPicker');
            emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        });
        
        // 絵文字ピッカー以外をクリックしたら閉じる
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#emojiPicker') && !e.target.closest('#emojiBtn')) {
                document.getElementById('emojiPicker').style.display = 'none';
            }
            
            // メンションリスト以外をクリックしたら閉じる（ただし入力欄を除く）
            if (!e.target.closest('#mentionList') && !e.target.closest('#messageInput')) {
                document.getElementById('mentionList').style.display = 'none';
                this.currentMentionIndex = -1;
            }
        });
    },
    
    /**
     * 絵文字ピッカーの初期化
     */
    initEmojiPicker: function() {
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-grid';
        
        // 一般的な絵文字のリスト
        const emojis = [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
            '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
            '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
            '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
            '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
            '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '👊', '✊', '🤛'
        ];
        
        // 絵文字をピッカーに追加
        emojis.forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.addEventListener('click', () => {
                const messageInput = document.getElementById('messageInput');
                messageInput.value += emoji;
                messageInput.focus();
                emojiPicker.style.display = 'none';
            });
            emojiGrid.appendChild(emojiItem);
        });
        
        emojiPicker.appendChild(emojiGrid);
    },
    
    /**
     * メンション入力の処理
     * @param {string} inputValue - 入力されたテキスト
     */
    handleMentionInput: function(inputValue) {
        const mentionList = document.getElementById('mentionList');
        
        // @の後の文字列を抽出
        const match = inputValue.match(/@([^@\s]*)$/);
        if (match) {
            const searchTerm = match[1].toLowerCase();
            
            // ユーザーリストからフィルタリング
            const filteredUsers = Object.values(this.userCache).filter(user => {
                return user.displayName && user.displayName.toLowerCase().includes(searchTerm);
            });
            
            if (filteredUsers.length > 0) {
                this.showMentionList(filteredUsers);
                this.mentioningUsers = filteredUsers;
                this.currentMentionIndex = -1;
                return;
            }
        }
        
        // マッチしない場合はメンションリストを非表示
        mentionList.style.display = 'none';
        this.mentioningUsers = [];
        this.currentMentionIndex = -1;
    },
    
    /**
     * メンションリストの表示
     * @param {Array} users - 表示するユーザーリスト
     */
    showMentionList: function(users) {
        const mentionList = document.getElementById('mentionList');
        mentionList.innerHTML = '';
        
        users.forEach((user, index) => {
            const mentionItem = document.createElement('div');
            mentionItem.className = 'mention-item';
            mentionItem.innerHTML = `
                <div class="mention-avatar">
                    <img src="${user.photoURL || 'assets/images/default-avatar.png'}" alt="アバター">
                </div>
                <div class="mention-name">${Utils.escapeHTML(user.displayName)}</div>
            `;
            
            mentionItem.addEventListener('click', () => {
                this.selectMention(index);
            });
            
            mentionList.appendChild(mentionItem);
        });
        
        mentionList.style.display = 'block';
    },
    
    /**
     * メンションの選択
     * @param {number} index - 選択するメンションのインデックス
     */
    selectMention: function(index) {
        if (index < 0 || index >= this.mentioningUsers.length) return;
        
        const selectedUser = this.mentioningUsers[index];
        const messageInput = document.getElementById('messageInput');
        
        // @の位置を見つける
        const inputValue = messageInput.value;
        const lastAtPos = inputValue.lastIndexOf('@');
        
        if (lastAtPos !== -1) {
            // @以降を選択したユーザー名に置き換え
            messageInput.value = inputValue.substring(0, lastAtPos) + 
                                `@${selectedUser.displayName} `;
            
            // カーソルを文末に移動
            messageInput.focus();
            messageInput.selectionStart = messageInput.value.length;
            messageInput.selectionEnd = messageInput.value.length;
        }
        
        // メンションリストを閉じる
        document.getElementById('mentionList').style.display = 'none';
        this.mentioningUsers = [];
        this.currentMentionIndex = -1;
    },
    
    /**
     * メンションリストの移動
     * @param {number} direction - 移動方向（1: 下、-1: 上）
     */
    navigateMention: function(direction) {
        if (this.mentioningUsers.length === 0) return;
        
        const mentionItems = document.querySelectorAll('.mention-item');
        
        // 現在選択中の項目をリセット
        if (this.currentMentionIndex >= 0 && this.currentMentionIndex < mentionItems.length) {
            mentionItems[this.currentMentionIndex].classList.remove('active');
        }
        
        // インデックスを更新
        this.currentMentionIndex += direction;
        
        // 範囲を超えた場合の調整
        if (this.currentMentionIndex < 0) {
            this.currentMentionIndex = mentionItems.length - 1;
        } else if (this.currentMentionIndex >= mentionItems.length) {
            this.currentMentionIndex = 0;
        }
        
        // 新しい選択項目をハイライト
        mentionItems[this.currentMentionIndex].classList.add('active');
    },
    
    /**
     * メッセージ送信処理
     */
    sendMessage: function() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content || !Auth.currentUser) return;
        
        // メッセージの種類（通常のテキストかスタンプか）を判定
        const isStamp = content.length === 2 && /\p{Emoji}/u.test(content);
        const messageType = isStamp ? 'stamp' : 'text';
        
        // メッセージをデータベースに送信
        Database.sendMessage(Auth.currentUser.uid, content, messageType)
            .then(() => {
                // 入力欄をクリア
                messageInput.value = '';
            })
            .catch(error => {
                Utils.showNotification(`メッセージ送信エラー: ${error.message}`, 'error');
            });
    },
    
    /**
     * メッセージの表示
     * @param {Object} message - メッセージオブジェクト
     */
    displayMessage: async function(message) {
        // メッセージリストの要素を取得
        const messagesList = document.getElementById('messagesList');
        
        // 既に表示されているメッセージの場合は更新
        const existingMessage = document.getElementById(`message-${message.id}`);
        if (existingMessage) {
            const messageBody = existingMessage.querySelector('.message-body');
            if (messageBody) {
                if (message.type === 'text') {
                    // テキストメッセージの場合はメンションを処理
                    messageBody.innerHTML = this.processMentions(message.content);
                    // 短いテキストの場合は特別なクラスを適用
                    this.applyShortTextClass(messageBody, message.content);
                } else if (message.type === 'stamp') {
                    // スタンプの場合
                    messageBody.innerHTML = `<span class="emoji-stamp">${Utils.escapeHTML(message.content)}</span>`;
                }
            }
            return;
        }
        
        // 送信者の情報を取得（キャッシュから、なければDBから）
        let sender;
        if (this.userCache[message.senderId]) {
            sender = this.userCache[message.senderId];
        } else {
            sender = await Database.getUserData(message.senderId);
            if (sender) {
                this.userCache[message.senderId] = sender;
            } else {
                sender = {
                    displayName: '不明なユーザー',
                    photoURL: 'assets/images/default-avatar.png'
                };
            }
        }
        
        // メッセージの日時をフォーマット
        const messageDate = new Date(message.createdAt);
        const formattedTime = Utils.formatDateTime(messageDate);
        
        // 自分のメッセージかどうか
        const isSelf = Auth.currentUser && message.senderId === Auth.currentUser.uid;
        
        // メッセージ要素を作成
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSelf ? 'self' : ''}`;
        messageElement.id = `message-${message.id}`;
        
        // メッセージのHTML構造
        messageElement.innerHTML = `
            <div class="message-avatar">
                <img src="${sender.photoURL || 'assets/images/default-avatar.png'}" alt="アバター">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${Utils.escapeHTML(sender.displayName)}</span>
                    <span class="message-time">${formattedTime}</span>
                </div>
                <div class="message-body ${message.type === 'stamp' ? 'stamp' : ''}">
                    ${message.type === 'text' 
                        ? this.processMentions(message.content)
                        : `<span class="emoji-stamp">${Utils.escapeHTML(message.content)}</span>`}
                </div>
                <div class="message-read-status"></div>
            </div>
        `;
        
        // メッセージをリストに追加
        messagesList.appendChild(messageElement);
        
        // 短いテキストの場合は特別なクラスを適用
        if (message.type === 'text') {
            const messageBody = messageElement.querySelector('.message-body');
            this.applyShortTextClass(messageBody, message.content);
        }
        
        // 自分が送信していないメッセージは既読にする
        if (!isSelf && Auth.currentUser) {
            Database.markMessageAsRead(message.id, Auth.currentUser.uid);
        }
    },
    
    /**
     * メッセージ内のメンションを処理
     * @param {string} content - メッセージ内容
     * @returns {string} - HTML形式に変換されたメッセージ
     */
    processMentions: function(content) {
        // メンション（@ユーザー名）を検出して強調表示
        const escapedContent = Utils.escapeHTML(content);
        // 改行を<br>タグに変換
        const contentWithLineBreaks = escapedContent.replace(/\n/g, '<br>');
        return contentWithLineBreaks.replace(/@([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g, 
            '<span class="message-mention">@$1</span>');
    },
    
    /**
     * メンション通知のチェック
     * @param {Object} message - メッセージオブジェクト
     */
    checkForMention: function(message) {
        if (!Auth.currentUser || message.senderId === Auth.currentUser.uid || message.type !== 'text') return;
        
        const currentUserName = Auth.currentUser.displayName;
        if (!currentUserName) return;
        
        // メッセージ内に自分へのメンションがあるか確認
        const mentionRegex = new RegExp(`@${currentUserName}\\b`, 'i');
        if (mentionRegex.test(message.content)) {
            // 送信者の情報を取得
            const sender = this.userCache[message.senderId] || { displayName: '不明なユーザー' };
            
            // 通知を表示
            Utils.showNotification(`${sender.displayName}さんがあなたをメンションしました`, 'info');
            
            // 音を鳴らす（オプション）
            this.playMentionSound();
        }
    },
    
    /**
     * メンション通知音を再生
     */
    playMentionSound: function() {
        // 通知音の再生（実装例）
        try {
            const audio = new Audio('assets/sounds/mention.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error('通知音の再生に失敗しました:', error);
        }
    },
    
    /**
     * メッセージ一覧を最下部にスクロール
     */
    scrollToBottom: function() {
        const messagesList = document.getElementById('messagesList');
        messagesList.scrollTop = messagesList.scrollHeight;
    },
    
    /**
     * 短いテキストに特別なクラスを適用する
     * @param {HTMLElement} element - メッセージ本文要素
     * @param {string} content - メッセージ内容
     */
    applyShortTextClass: function(element, content) {
        // 添付UI通りの表示なので特別な処理は必要なし
    }
};

// グローバルスコープで利用できるようにする
window.Chat = Chat; 