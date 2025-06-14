/**
 * シフト管理機能を管理するモジュール
 */

const Shift = {
    /**
     * 現在表示中の年月
     */
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    
    /**
     * 表示モード（month/week）
     */
    viewMode: 'month',
    
    /**
     * 選択中の日付（シフト編集用）
     */
    selectedDate: null,
    
    /**
     * シフトデータキャッシュ
     */
    shiftsCache: {},
    
    /**
     * 初期化処理
     * @returns {Promise}
     */
    init: function() {
        return new Promise((resolve) => {
            // シフト関連のイベントハンドラを設定
            this.setupEventListeners();
            
            resolve();
        });
    },
    
    /**
     * シフトモジュールの開始（ログイン後に呼び出される）
     */
    start: function() {
        // 現在の年月で表示
        this.refreshCalendar();
    },
    
    /**
     * シフト関連のイベントハンドラ設定
     */
    setupEventListeners: function() {
        // 前月ボタン
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.refreshCalendar();
        });
        
        // 翌月ボタン
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.refreshCalendar();
        });
        
        // 月間表示ボタン
        document.getElementById('monthViewBtn').addEventListener('click', () => {
            this.viewMode = 'month';
            document.getElementById('monthViewBtn').classList.add('active');
            document.getElementById('weekViewBtn').classList.remove('active');
            this.refreshCalendar();
        });
        
        // 週間表示ボタン
        document.getElementById('weekViewBtn').addEventListener('click', () => {
            this.viewMode = 'week';
            document.getElementById('weekViewBtn').classList.add('active');
            document.getElementById('monthViewBtn').classList.remove('active');
            this.refreshCalendar();
        });
        
        // シフト保存ボタン
        document.getElementById('saveShiftBtn').addEventListener('click', () => {
            this.saveShift();
        });
        
        // シフトキャンセルボタン
        document.getElementById('cancelShiftBtn').addEventListener('click', () => {
            this.hideShiftForm();
        });
    },
    
    /**
     * カレンダーの再描画
     */
    refreshCalendar: function() {
        // 月表示を更新
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        document.getElementById('currentMonth').textContent = `${this.currentYear}年${monthNames[this.currentMonth]}`;
        
        // シフトデータの取得
        this.loadShifts().then(() => {
            // 表示モードに応じてカレンダーを描画
            if (this.viewMode === 'month') {
                this.renderMonthCalendar();
            } else {
                this.renderWeekCalendar();
            }
        });
    },
    
    /**
     * シフトデータの読み込み
     * @returns {Promise}
     */
    loadShifts: function() {
        if (!Auth.currentUser) return Promise.resolve();
        
        const cacheKey = `${this.currentYear}-${this.currentMonth}`;
        
        // キャッシュに既にデータがある場合はそれを使用
        if (this.shiftsCache[cacheKey]) {
            return Promise.resolve(this.shiftsCache[cacheKey]);
        }
        
        // データベースからシフトデータを取得
        return Database.getMonthlyShifts(Auth.currentUser.uid, this.currentYear, this.currentMonth)
            .then(shifts => {
                // シフトデータを日付ごとに整理
                const shiftsByDate = {};
                shifts.forEach(shift => {
                    shiftsByDate[shift.date] = shift;
                });
                
                // キャッシュに保存
                this.shiftsCache[cacheKey] = shiftsByDate;
                
                return shiftsByDate;
            });
    },
    
    /**
     * 月間カレンダーの描画
     */
    renderMonthCalendar: function() {
        const calendarView = document.getElementById('calendarView');
        calendarView.innerHTML = '';
        
        // テーブル作成
        const table = document.createElement('table');
        table.className = 'month-calendar';
        
        // 曜日の行
        const headerRow = document.createElement('tr');
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        
        weekdays.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        
        table.appendChild(headerRow);
        
        // カレンダーデータの生成
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        
        const startDay = firstDay.getDay(); // 月の最初の日の曜日（0:日曜, 1:月曜, ...）
        const endDate = lastDay.getDate(); // 月の最終日
        
        // 行を生成
        let date = 1;
        for (let i = 0; i < 6; i++) { // 最大6週間
            if (date > endDate) break;
            
            const row = document.createElement('tr');
            
            // 各セルを生成
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if ((i === 0 && j < startDay) || date > endDate) {
                    // 当月外のセル
                    cell.innerHTML = '&nbsp;';
                } else {
                    // 当月内のセル
                    const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    const isToday = this.isToday(this.currentYear, this.currentMonth, date);
                    const isWeekend = j === 0 || j === 6; // 日曜または土曜
                    
                    // 日付セルの内容を構築
                    cell.innerHTML = `
                        <div class="calendar-date" data-date="${dateStr}">
                            <div class="date-header">
                                <span class="date-number ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">${date}</span>
                            </div>
                            <div class="date-content" id="shift-${dateStr}">
                                <!-- シフト情報はJSで動的に追加 -->
                            </div>
                        </div>
                    `;
                    
                    // シフト情報があれば表示
                    const shiftData = this.getShiftForDate(dateStr);
                    if (shiftData) {
                        this.renderShiftInCell(dateStr, shiftData);
                    }
                    
                    // クリックイベント（シフト登録/編集）
                    cell.addEventListener('click', () => {
                        this.showShiftForm(dateStr, shiftData);
                    });
                    
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            table.appendChild(row);
        }
        
        calendarView.appendChild(table);
    },
    
    /**
     * 週間カレンダーの描画
     */
    renderWeekCalendar: function() {
        const calendarView = document.getElementById('calendarView');
        calendarView.innerHTML = '';
        
        // 現在の週の範囲を計算
        const today = new Date(this.currentYear, this.currentMonth, 15); // 月の中旬を基準
        const dayOfWeek = today.getDay();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek); // 週の開始日（日曜日）
        
        // テーブル作成
        const table = document.createElement('table');
        table.className = 'week-calendar';
        
        // 曜日の行
        const headerRow = document.createElement('tr');
        const firstCell = document.createElement('th');
        firstCell.textContent = '時間';
        headerRow.appendChild(firstCell);
        
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekDates = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            weekDates.push(date);
            
            const th = document.createElement('th');
            th.textContent = `${weekdays[i]} (${date.getDate()})`;
            if (i === 0 || i === 6) {
                th.classList.add('weekend');
            }
            if (this.isToday(date.getFullYear(), date.getMonth(), date.getDate())) {
                th.classList.add('today');
            }
            headerRow.appendChild(th);
        }
        
        table.appendChild(headerRow);
        
        // 時間帯の行（例：早番/遅番）
        const shifts = ['早番', '遅番'];
        
        shifts.forEach(shiftType => {
            const row = document.createElement('tr');
            
            // 時間帯のセル
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.textContent = shiftType;
            row.appendChild(timeCell);
            
            // 各曜日のセル
            weekDates.forEach((date, index) => {
                const dateStr = this.formatDate(date);
                const cell = document.createElement('td');
                
                const shiftData = this.getShiftForDate(dateStr);
                
                if (shiftData && shiftData.status === shiftType) {
                    // 該当するシフトがある場合
                    cell.innerHTML = `
                        <div class="shift-status ${shiftData.status}">${shiftData.status}</div>
                        ${shiftData.comment ? `<div class="shift-comment">${Utils.escapeHTML(shiftData.comment)}</div>` : ''}
                    `;
                }
                
                // クリックイベント（シフト登録/編集）
                cell.addEventListener('click', () => {
                    this.showShiftForm(dateStr, shiftData);
                });
                
                row.appendChild(cell);
            });
            
            table.appendChild(row);
        });
        
        calendarView.appendChild(table);
    },
    
    /**
     * セル内にシフト情報を表示
     * @param {string} dateStr - 日付文字列（YYYY-MM-DD形式）
     * @param {Object} shiftData - シフトデータ
     */
    renderShiftInCell: function(dateStr, shiftData) {
        const shiftCell = document.getElementById(`shift-${dateStr}`);
        if (!shiftCell) return;
        
        shiftCell.innerHTML = `
            <div class="shift-status ${shiftData.status}">${shiftData.status}</div>
            ${shiftData.comment ? `<div class="shift-comment">${Utils.escapeHTML(shiftData.comment)}</div>` : ''}
        `;
    },
    
    /**
     * 特定の日付のシフト情報を取得
     * @param {string} dateStr - 日付文字列（YYYY-MM-DD形式）
     * @returns {Object|null} - シフトデータ
     */
    getShiftForDate: function(dateStr) {
        const cacheKey = `${this.currentYear}-${this.currentMonth}`;
        if (this.shiftsCache[cacheKey] && this.shiftsCache[cacheKey][dateStr]) {
            return this.shiftsCache[cacheKey][dateStr];
        }
        return null;
    },
    
    /**
     * シフト登録/編集フォームを表示
     * @param {string} dateStr - 日付文字列（YYYY-MM-DD形式）
     * @param {Object} shiftData - 既存のシフトデータ（新規の場合はnull）
     */
    showShiftForm: function(dateStr, shiftData) {
        // ログインチェック
        if (!Auth.currentUser) {
            Utils.showNotification('シフトを登録するにはログインしてください', 'error');
            return;
        }
        
        // 選択日付を保存
        this.selectedDate = dateStr;
        
        // フォーム要素の取得
        const shiftForm = document.getElementById('shiftForm');
        const shiftDate = document.getElementById('shiftDate');
        const shiftStatus = document.getElementById('shiftStatus');
        const shiftComment = document.getElementById('shiftComment');
        
        // フォームに値をセット
        shiftDate.value = dateStr;
        
        if (shiftData) {
            // 既存データの場合
            shiftStatus.value = shiftData.status;
            shiftComment.value = shiftData.comment || '';
        } else {
            // 新規の場合
            shiftStatus.value = '早番'; // デフォルト値
            shiftComment.value = '';
        }
        
        // フォームを表示
        shiftForm.style.display = 'block';
        
        // オーバーレイを作成
        if (!document.querySelector('.overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
            
            // オーバーレイのクリックでフォームを閉じる
            overlay.addEventListener('click', () => {
                this.hideShiftForm();
            });
        }
    },
    
    /**
     * シフト登録/編集フォームを非表示
     */
    hideShiftForm: function() {
        document.getElementById('shiftForm').style.display = 'none';
        
        // オーバーレイを削除
        const overlay = document.querySelector('.overlay');
        if (overlay) {
            overlay.remove();
        }
    },
    
    /**
     * シフトの保存
     */
    saveShift: function() {
        // ログインチェック
        if (!Auth.currentUser) {
            Utils.showNotification('シフトを登録するにはログインしてください', 'error');
            return;
        }
        
        // 選択日付のチェック
        if (!this.selectedDate) {
            Utils.showNotification('日付が選択されていません', 'error');
            return;
        }
        
        // フォームから値を取得
        const status = document.getElementById('shiftStatus').value;
        const comment = document.getElementById('shiftComment').value.trim();
        
        // データベースに保存
        Database.saveShift(Auth.currentUser.uid, this.selectedDate, status, comment)
            .then(() => {
                Utils.showNotification('シフトを保存しました', 'success');
                
                // キャッシュを更新
                const date = new Date(this.selectedDate);
                const year = date.getFullYear();
                const month = date.getMonth();
                const cacheKey = `${year}-${month}`;
                
                if (!this.shiftsCache[cacheKey]) {
                    this.shiftsCache[cacheKey] = {};
                }
                
                this.shiftsCache[cacheKey][this.selectedDate] = {
                    userId: Auth.currentUser.uid,
                    date: this.selectedDate,
                    status,
                    comment
                };
                
                // カレンダーを更新
                if (this.viewMode === 'month') {
                    this.renderShiftInCell(this.selectedDate, this.shiftsCache[cacheKey][this.selectedDate]);
                } else {
                    this.renderWeekCalendar();
                }
                
                // フォームを閉じる
                this.hideShiftForm();
            })
            .catch(error => {
                Utils.showNotification(`シフト保存エラー: ${error.message}`, 'error');
            });
    },
    
    /**
     * 今日の日付かどうかをチェック
     * @param {number} year - 年
     * @param {number} month - 月（0-11）
     * @param {number} day - 日
     * @returns {boolean} - 今日の日付の場合はtrue
     */
    isToday: function(year, month, day) {
        const today = new Date();
        return (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
        );
    },
    
    /**
     * 日付をYYYY-MM-DD形式に変換
     * @param {Date} date - 日付オブジェクト
     * @returns {string} - YYYY-MM-DD形式の文字列
     */
    formatDate: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// グローバルスコープで利用できるようにする
window.Shift = Shift; 