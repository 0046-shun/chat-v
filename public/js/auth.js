/**
 * Firebase Authenticationを使用した認証機能を管理するモジュール
 */

// 認証インスタンスの取得
const auth = firebase.auth();

// アバターカテゴリ
// フリー素材のアバター画像配列


const avatarCategories = {
    'アドベンチャー': [
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Cleo',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna'
    ],
    'ピクセルアート': [
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=Milo',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=Coco',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pepper',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=Peanut',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=Muffin'
    ],
    'アニメ風': [
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Oliver',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Nova',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Mia'
    ],
    '抽象パターン': [
        'https://robohash.org/Alice?set=set3',
        'https://robohash.org/Bob?set=set3'
    ]
};

// フラットなアバターリスト（従来のコードとの互換性のため）
const freeAvatars = Object.values(avatarCategories).flat();

// デフォルトのアバター画像
const defaultAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=default';

/**
 * 認証モジュール
 */
const Auth = {
    /**
     * 現在ログイン中のユーザー情報
     */
    currentUser: null,
    
    /**
     * 初期化処理
     * @returns {Promise}
     */
    init: function() {
        return new Promise((resolve) => {
            // 認証状態の変更を監視
            auth.onAuthStateChanged(user => {
                if (user) {
                    // ユーザーがログインしている場合
                    this.currentUser = user;
                    
                    // ユーザーデータをFirebaseに保存
                    Database.saveUserData(user.uid, {
                        displayName: user.displayName || '名前未設定',
                        email: user.email,
                        photoURL: user.photoURL || defaultAvatar
                    });
                    
                    // UIの更新
                    this.updateUI(true);
                } else {
                    // ユーザーがログアウトしている場合
                    this.currentUser = null;
                    
                    // UIの更新
                    this.updateUI(false);
                }
                resolve(user);
            });
            
            // 認証関連のイベントハンドラを設定
            this.setupEventListeners();
        });
    },
    
    /**
     * UI更新処理
     * @param {boolean} isLoggedIn - ログイン状態
     */
    updateUI: function(isLoggedIn) {
        const authArea = document.getElementById('authArea');
        const chatArea = document.getElementById('chatArea');
        const shiftArea = document.getElementById('shiftArea');
        const userDisplayName = document.getElementById('userDisplayName');
        const userAvatar = document.getElementById('userAvatar').querySelector('img');
        const logoutBtn = document.getElementById('logoutBtn');
        const editProfileBtn = document.getElementById('editProfileBtn');
        
        if (isLoggedIn && this.currentUser) {
            // ログイン状態の場合
            authArea.style.display = 'none';
            
            // チャットかシフト管理のどちらかを表示（デフォルトはチャット）
            if (localStorage.getItem('activeTab') === 'shift') {
                chatArea.style.display = 'none';
                shiftArea.style.display = 'block';
                document.getElementById('shiftBtn').classList.add('active');
                document.getElementById('chatBtn').classList.remove('active');
            } else {
                chatArea.style.display = 'block';
                shiftArea.style.display = 'none';
                document.getElementById('chatBtn').classList.add('active');
                document.getElementById('shiftBtn').classList.remove('active');
            }
            
            // ユーザー情報を表示
            userDisplayName.textContent = this.currentUser.displayName || '名前未設定';
            userAvatar.src = this.currentUser.photoURL || defaultAvatar;
            logoutBtn.style.display = 'block';
            editProfileBtn.style.display = 'block';
            
        } else {
            // ログアウト状態の場合
            authArea.style.display = 'block';
            chatArea.style.display = 'none';
            shiftArea.style.display = 'none';
            userDisplayName.textContent = 'ゲスト';
            userAvatar.src = defaultAvatar;
            logoutBtn.style.display = 'none';
            editProfileBtn.style.display = 'none';
            
            // ログインフォームを表示
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('forgotPasswordForm').style.display = 'none';
        }
    },
    
    /**
     * 認証関連のイベントハンドラ設定
     */
    setupEventListeners: function() {
        // ログインボタン
        document.getElementById('loginBtn').addEventListener('click', () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                Utils.showNotification('メールアドレスとパスワードを入力してください', 'error');
                return;
            }
            
            this.login(email, password)
                .catch(error => {
                    Utils.showNotification(`ログインエラー: ${error.message}`, 'error');
                });
        });
        
        // 新規登録ボタン
        document.getElementById('registerBtn').addEventListener('click', () => {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
            
            if (!name || !email || !password) {
                Utils.showNotification('すべての項目を入力してください', 'error');
                return;
            }
            
            if (password !== passwordConfirm) {
                Utils.showNotification('パスワードが一致しません', 'error');
                return;
            }
            
            this.register(email, password, name)
                .catch(error => {
                    Utils.showNotification(`登録エラー: ${error.message}`, 'error');
                });
        });
        
        // パスワードリセットボタン
        document.getElementById('resetPasswordBtn').addEventListener('click', () => {
            const email = document.getElementById('resetEmail').value;
            
            if (!email) {
                Utils.showNotification('メールアドレスを入力してください', 'error');
                return;
            }
            
            this.resetPassword(email)
                .then(() => {
                    Utils.showNotification('パスワードリセットのメールを送信しました', 'success');
                    // ログインフォームに戻る
                    document.getElementById('loginForm').style.display = 'block';
                    document.getElementById('forgotPasswordForm').style.display = 'none';
                })
                .catch(error => {
                    Utils.showNotification(`パスワードリセットエラー: ${error.message}`, 'error');
                });
        });
        
        // ログアウトボタン
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout()
                .catch(error => {
                    Utils.showNotification(`ログアウトエラー: ${error.message}`, 'error');
                });
        });
        
        // プロフィール編集ボタン
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.openProfileModal();
        });
        
        // プロフィール保存ボタン
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfile();
        });
        
        // プロフィールモーダルを閉じる
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeProfileModal();
            });
        }
        
        // アバターオプションのクリックイベント
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // 選択状態を更新
                avatarOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // プレビューを更新
                const avatarSrc = option.getAttribute('data-avatar');
                document.getElementById('profileAvatarPreview').src = avatarSrc;
            });
        });
        
        // 認証タブの切り替え
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.getAttribute('data-tab');
                
                // タブのアクティブ状態を切り替え
                document.querySelectorAll('.auth-tab').forEach(t => {
                    t.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // フォームの表示を切り替え
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('forgotPasswordForm').style.display = 'none';
                
                if (tabType === 'login') {
                    document.getElementById('loginForm').style.display = 'block';
                } else if (tabType === 'register') {
                    document.getElementById('registerForm').style.display = 'block';
                }
            });
        });
        
        // パスワードを忘れたリンク
        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('forgotPasswordForm').style.display = 'block';
        });
        
        // ログインに戻るリンク
        document.getElementById('backToLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('forgotPasswordForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });
    },
    
    /**
     * プロフィール編集モーダルを開く
     */
    openProfileModal: function() {
        if (!this.currentUser) return;
        
        // 現在のユーザー情報を表示
        const profileDisplayName = document.getElementById('profileDisplayName');
        const profileAvatarPreview = document.getElementById('profileAvatarPreview');
        
        profileDisplayName.value = this.currentUser.displayName || '';
        profileAvatarPreview.src = this.currentUser.photoURL || defaultAvatar;
        
        // アバターオプションの表示を更新
        this.updateAvatarOptions();
        
        // アバターオプションから現在のアバターを選択状態にする
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-avatar') === this.currentUser.photoURL) {
                option.classList.add('selected');
            }
        });
        
        // モーダルを表示
        const modal = document.getElementById('profileModal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    },
    
    /**
     * アバターオプションを更新
     */
    updateAvatarOptions: function() {
        const avatarGrid = document.querySelector('.avatar-grid');
        if (!avatarGrid) return;
        
        // 既存のオプションをクリア
        avatarGrid.innerHTML = '';
        
        // フリー素材のアバターを追加
        freeAvatars.forEach((avatarUrl, index) => {
            const avatarOption = document.createElement('div');
            avatarOption.className = 'avatar-option';
            avatarOption.setAttribute('data-avatar', avatarUrl);
            avatarOption.innerHTML = `<img src="${avatarUrl}" alt="アバター${index + 1}">`;
            
            // クリックイベントを追加
            avatarOption.addEventListener('click', () => {
                // 選択状態を更新
                document.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                avatarOption.classList.add('selected');
                
                // プレビューを更新
                document.getElementById('profileAvatarPreview').src = avatarUrl;
            });
            
            avatarGrid.appendChild(avatarOption);
        });
    },
    
    /**
     * プロフィール編集モーダルを閉じる
     */
    closeProfileModal: function() {
        const modal = document.getElementById('profileModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    },
    
    /**
     * プロフィールを保存
     */
    saveProfile: function() {
        if (!this.currentUser) return;
        
        const displayName = document.getElementById('profileDisplayName').value;
        const photoURL = document.getElementById('profileAvatarPreview').src;
        
        if (!displayName) {
            Utils.showNotification('表示名を入力してください', 'error');
            return;
        }
        
        // プロフィール更新
        this.updateProfile({
            displayName,
            photoURL
        }).then(() => {
            this.closeProfileModal();
        }).catch(error => {
            Utils.showNotification(`プロフィール更新エラー: ${error.message}`, 'error');
        });
    },
    
    /**
     * ログイン処理
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise}
     */
    login: function(email, password) {
        return auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                Utils.showNotification('ログインしました', 'success');
            });
    },
    
    /**
     * 新規登録処理
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @param {string} displayName - 表示名
     * @returns {Promise}
     */
    register: function(email, password, displayName) {
        let userId;
        const randomAvatar = freeAvatars[Math.floor(Math.random() * freeAvatars.length)];
        
        return auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                userId = userCredential.user.uid;
                // ユーザープロフィールの更新
                return userCredential.user.updateProfile({
                    displayName: displayName,
                    photoURL: randomAvatar
                });
            })
            .then(() => {
                // Firebaseデータベースにもユーザー情報を保存
                return Database.saveUserData(userId, {
                    displayName: displayName,
                    email: email,
                    photoURL: randomAvatar,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .then(() => {
                Utils.showNotification('アカウントを作成しました', 'success');
                
                // ユーザーオブジェクトを更新（UIに反映させるため）
                const user = firebase.auth().currentUser;
                if (user) {
                    this.currentUser = user;
                    this.updateUI(true);
                }
            });
    },
    
    /**
     * ログアウト処理
     * @returns {Promise}
     */
    logout: function() {
        return auth.signOut()
            .then(() => {
                Utils.showNotification('ログアウトしました', 'info');
            });
    },
    
    /**
     * パスワードリセットメールの送信
     * @param {string} email - メールアドレス
     * @returns {Promise}
     */
    resetPassword: function(email) {
        return auth.sendPasswordResetEmail(email);
    },
    
    /**
     * ユーザープロフィールの更新
     * @param {Object} profileData - プロフィールデータ
     * @returns {Promise}
     */
    updateProfile: function(profileData) {
        if (!this.currentUser) {
            return Promise.reject(new Error('ユーザーがログインしていません'));
        }
        
        return this.currentUser.updateProfile(profileData)
            .then(() => {
                // Firebaseデータベースのユーザー情報も更新
                return Database.saveUserData(this.currentUser.uid, profileData);
            })
            .then(() => {
                // UIを更新
                const userDisplayName = document.getElementById('userDisplayName');
                const userAvatar = document.getElementById('userAvatar').querySelector('img');
                
                userDisplayName.textContent = profileData.displayName || '名前未設定';
                userAvatar.src = profileData.photoURL || defaultAvatar;
                
                Utils.showNotification('プロフィールを更新しました', 'success');
            });
    }
};

// グローバルスコープで利用できるようにする
window.Auth = Auth; 