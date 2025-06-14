/**
 * アプリケーション全体で使用するユーティリティ関数を提供するモジュール
 */

const Utils = {
    /**
     * 通知メッセージを表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知タイプ（success/error/info/warning）
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showNotification: function(message, type = 'info', duration = 3000) {
        const notificationArea = document.getElementById('notificationArea');
        
        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 通知エリアに追加
        notificationArea.appendChild(notification);
        
        // 指定時間後に自動的に消える
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, duration);
    },
    
    /**
     * HTMLエスケープ処理
     * @param {string} str - エスケープする文字列
     * @returns {string} - エスケープされた文字列
     */
    escapeHTML: function(str) {
        if (!str) return '';
        
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    
    /**
     * 日時のフォーマット
     * @param {Date} date - 日付オブジェクト
     * @returns {string} - フォーマットされた日時文字列
     */
    formatDateTime: function(date) {
        if (!date) return '';
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // 今日、昨日の場合は日付の代わりにそれを表示
        let prefix = '';
        if (dateDay.getTime() === today.getTime()) {
            prefix = '今日 ';
        } else if (dateDay.getTime() === yesterday.getTime()) {
            prefix = '昨日 ';
        } else {
            // それ以外は日付を表示
            prefix = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} `;
        }
        
        // 時刻のフォーマット
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${prefix}${hours}:${minutes}`;
    },
    
    /**
     * 日付のフォーマット（YYYY-MM-DD）
     * @param {Date} date - 日付オブジェクト
     * @returns {string} - YYYY-MM-DD形式の文字列
     */
    formatDate: function(date) {
        if (!date) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },
    
    /**
     * 文字列を指定の長さで切り詰める
     * @param {string} str - 元の文字列
     * @param {number} maxLength - 最大長
     * @returns {string} - 切り詰められた文字列
     */
    truncateText: function(str, maxLength = 100) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        
        return str.substring(0, maxLength) + '...';
    },
    
    /**
     * URL検出して自動リンク化
     * @param {string} text - 処理する文字列
     * @returns {string} - リンク化された文字列
     */
    autoLink: function(text) {
        if (!text) return '';
        
        // URLを検出して<a>タグに変換
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, url => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    },
    
    /**
     * ローカルストレージにデータを保存
     * @param {string} key - キー
     * @param {*} value - 値
     */
    saveToLocalStorage: function(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error('ローカルストレージへの保存に失敗しました:', error);
        }
    },
    
    /**
     * ローカルストレージからデータを取得
     * @param {string} key - キー
     * @param {*} defaultValue - デフォルト値
     * @returns {*} - 取得した値
     */
    getFromLocalStorage: function(key, defaultValue = null) {
        try {
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) {
                return defaultValue;
            }
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('ローカルストレージからの取得に失敗しました:', error);
            return defaultValue;
        }
    },
    
    /**
     * ディープコピーを作成
     * @param {*} obj - コピー対象
     * @returns {*} - コピーされたオブジェクト
     */
    deepCopy: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * ランダムなIDを生成
     * @param {number} length - IDの長さ
     * @returns {string} - 生成されたID
     */
    generateId: function(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    },
    
    /**
     * 指定された要素の位置までスクロール
     * @param {HTMLElement} element - スクロール先の要素
     * @param {number} offset - オフセット値（px）
     * @param {number} duration - アニメーション時間（ミリ秒）
     */
    scrollToElement: function(element, offset = 0, duration = 500) {
        if (!element) return;
        
        const start = window.pageYOffset;
        const elementTop = element.getBoundingClientRect().top;
        const targetPosition = start + elementTop - offset;
        const startTime = performance.now();
        
        function scrollStep(timestamp) {
            const currentTime = timestamp - startTime;
            const progress = Math.min(currentTime / duration, 1);
            
            // イージング関数（緩やかに減速）
            const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            
            window.scrollTo(0, start + (targetPosition - start) * easeInOutQuad(progress));
            
            if (currentTime < duration) {
                window.requestAnimationFrame(scrollStep);
            }
        }
        
        window.requestAnimationFrame(scrollStep);
    }
};

// グローバルスコープで利用できるようにする
window.Utils = Utils; 