/**
 * Firebaseの初期化と基本的なデータベース操作を行うモジュール
 */

// Firebaseの設定
const firebaseConfig = {
    apiKey: "AIzaSyDGg47qd2a-TXjzEwRBOjZsHVolav7pj4Y",
    authDomain: "chat-v0-653b5.firebaseapp.com",
    databaseURL: "https://chat-v0-653b5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-v0-653b5",
    storageBucket: "chat-v0-653b5.firebasestorage.app",
    messagingSenderId: "683279592541",
    appId: "1:683279592541:web:2b8862e297fb3902b5b1b4",
    measurementId: "G-RDX525JCJ2"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// データベース参照の取得
const db = firebase.database();

/**
 * データベースモジュール
 */
const Database = {
    /**
     * メッセージの送信
     * @param {string} senderId - 送信者のUID
     * @param {string} content - メッセージ内容
     * @param {string} type - メッセージタイプ（text/stamp）
     * @returns {Promise<string>} - メッセージID
     */
    sendMessage: function(senderId, content, type = 'text') {
        const messagesRef = db.ref('messages');
        const newMessageRef = messagesRef.push();
        
        return newMessageRef.set({
            senderId,
            content,
            type,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            readBy: {}
        }).then(() => newMessageRef.key);
    },
    
    /**
     * メッセージの取得
     * @param {number} limit - 取得するメッセージの最大数
     * @returns {Promise<Array>} - メッセージの配列
     */
    getMessages: function(limit = 50) {
        return db.ref('messages')
            .orderByChild('createdAt')
            .limitToLast(limit)
            .once('value')
            .then(snapshot => {
                const messages = [];
                snapshot.forEach(childSnapshot => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                // クライアント側でも明示的にソート（古い→新しい順）
                return messages.sort((a, b) => a.createdAt - b.createdAt);
            });
    },
    
    /**
     * リアルタイムでのメッセージ監視
     * @param {Function} callback - 新しいメッセージを受け取るコールバック関数
     * @returns {Function} - リスナーの解除関数
     */
    onNewMessage: function(callback) {
        const messagesRef = db.ref('messages');
        const listener = messagesRef.orderByChild('createdAt').limitToLast(1).on('child_added', snapshot => {
            const message = {
                id: snapshot.key,
                ...snapshot.val()
            };
            callback(message);
        });
        
        // リスナーの解除関数を返す
        return () => messagesRef.off('child_added', listener);
    },
    
    /**
     * メッセージを既読にする
     * @param {string} messageId - メッセージID
     * @param {string} userId - ユーザーID
     * @returns {Promise}
     */
    markMessageAsRead: function(messageId, userId) {
        return db.ref(`messages/${messageId}/readBy/${userId}`).set(true);
    },
    
    /**
     * メッセージの既読状態をリアルタイムで監視
     * @param {string} messageId - メッセージID
     * @param {Function} callback - コールバック関数
     * @returns {Function} - リスナーの解除関数
     */
    onMessageReadStatusChange: function(messageId, callback) {
        const readByRef = db.ref(`messages/${messageId}/readBy`);
        const listener = readByRef.on('value', (snapshot) => {
            const readBy = snapshot.val() || {};
            callback(readBy);
        });
        
        // リスナーの解除関数を返す
        return () => readByRef.off('value', listener);
    },
    
    /**
     * メッセージの編集
     * @param {string} messageId - メッセージID
     * @param {string} content - 新しいメッセージ内容
     * @returns {Promise}
     */
    editMessage: function(messageId, content) {
        return db.ref(`messages/${messageId}`).update({
            content,
            edited: true
        });
    },
    
    /**
     * メッセージの削除
     * @param {string} messageId - メッセージID
     * @returns {Promise}
     */
    deleteMessage: function(messageId) {
        return db.ref(`messages/${messageId}`).remove();
    },
    
    /**
     * ユーザー情報の保存
     * @param {string} uid - ユーザーID
     * @param {Object} userData - ユーザー情報
     * @returns {Promise}
     */
    saveUserData: function(uid, userData) {
        return db.ref(`users/${uid}`).update({
            ...userData,
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });
    },
    
    /**
     * ユーザー情報の取得
     * @param {string} uid - ユーザーID
     * @returns {Promise<Object>} - ユーザー情報
     */
    getUserData: function(uid) {
        return db.ref(`users/${uid}`).once('value')
            .then(snapshot => snapshot.val());
    },
    
    /**
     * 全ユーザーの取得
     * @returns {Promise<Array>} - ユーザー情報の配列
     */
    getAllUsers: function() {
        return db.ref('users').once('value')
            .then(snapshot => {
                const users = [];
                snapshot.forEach(childSnapshot => {
                    users.push({
                        uid: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                return users;
            });
    },
    
    /**
     * シフトの保存
     * @param {string} userId - ユーザーID
     * @param {string} date - 日付（YYYY-MM-DD形式）
     * @param {string} status - シフトステータス（早番/遅番/振替/特休/社外）
     * @param {string} comment - コメント
     * @returns {Promise<string>} - シフトID
     */
    saveShift: function(userId, date, status, comment = '') {
        const shiftsRef = db.ref('shifts');
        // 既存のシフトを確認
        return shiftsRef
            .orderByChild('userId_date')
            .equalTo(`${userId}_${date}`)
            .once('value')
            .then(snapshot => {
                let shiftRef;
                
                if (snapshot.exists()) {
                    // 既存のシフトを更新
                    let shiftId = null;
                    snapshot.forEach(childSnapshot => {
                        shiftId = childSnapshot.key;
                        return true; // ループを抜ける
                    });
                    shiftRef = shiftsRef.child(shiftId);
                } else {
                    // 新しいシフトを作成
                    shiftRef = shiftsRef.push();
                }
                
                return shiftRef.set({
                    userId,
                    date,
                    status,
                    comment,
                    userId_date: `${userId}_${date}`, // 複合インデックス
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                }).then(() => shiftRef.key);
            });
    },
    
    /**
     * 特定の月のシフト情報を取得
     * @param {string} userId - ユーザーID（省略時は全ユーザー）
     * @param {number} year - 年
     * @param {number} month - 月（0-11）
     * @returns {Promise<Array>} - シフト情報の配列
     */
    getMonthlyShifts: function(userId = null, year, month) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);
        
        let query = db.ref('shifts').orderByChild('date');
        
        if (userId) {
            // 特定ユーザーのシフトを取得
            query = db.ref('shifts')
                .orderByChild('userId_date')
                .startAt(`${userId}_${startDateStr}`)
                .endAt(`${userId}_${endDateStr}\uf8ff`);
        } else {
            // 全ユーザーのシフトを取得
            query = query.startAt(startDateStr).endAt(endDateStr);
        }
        
        return query.once('value').then(snapshot => {
            const shifts = [];
            snapshot.forEach(childSnapshot => {
                shifts.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return shifts;
        });
    },
    
    /**
     * 通知の作成
     * @param {string} userId - 通知先ユーザーID
     * @param {string} senderId - 送信者ユーザーID
     * @param {string} messageId - メッセージID
     * @param {string} type - 通知タイプ
     * @returns {Promise<string>} - 通知ID
     */
    createNotification: function(userId, senderId, messageId, type) {
        const notificationsRef = db.ref('notifications');
        const newNotificationRef = notificationsRef.push();
        
        return newNotificationRef.set({
            userId,
            senderId,
            messageId,
            type,
            isRead: false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => newNotificationRef.key);
    },
    
    /**
     * ユーザーの未読通知を取得
     * @param {string} userId - ユーザーID
     * @returns {Promise<Array>} - 通知の配列
     */
    getUnreadNotifications: function(userId) {
        return db.ref('notifications')
            .orderByChild('userId')
            .equalTo(userId)
            .once('value')
            .then(snapshot => {
                const notifications = [];
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    if (!notification.isRead) {
                        notifications.push({
                            id: childSnapshot.key,
                            ...notification
                        });
                    }
                });
                return notifications;
            });
    },
    
    /**
     * 通知を既読にする
     * @param {string} notificationId - 通知ID
     * @returns {Promise}
     */
    markNotificationAsRead: function(notificationId) {
        return db.ref(`notifications/${notificationId}`).update({
            isRead: true
        });
    }
};

/**
 * 日付をYYYY-MM-DD形式に変換するヘルパー関数
 * @param {Date} date - 日付オブジェクト
 * @returns {string} - YYYY-MM-DD形式の文字列
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
} 