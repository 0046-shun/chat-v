# チャットシステム v0

シフト管理機能を含むリアルタイムチャットシステム

## 概要

このアプリケーションは、Webブラウザベースの個人向けリアルタイムグループチャットシステムです。Firebase Authenticationを使用したユーザー認証、Firebase Realtime Databaseを使用したメッセージとシフトデータの保存、Firebase Hostingによる静的ファイルのホスティングを提供します。

### 主な機能

- ユーザー認証（登録・ログイン・ログアウト・パスワードリセット）
- リアルタイムチャット
  - テキストメッセージの送受信
  - スタンプ/絵文字の送信
  - 既読表示
  - メッセージの編集/削除
  - メンション機能（@ユーザー名）
- シフト管理
  - シフトカレンダー表示（月間/週間）
  - シフトステータス管理（早番/遅番/振替/特休/社外）
  - シフトコメント機能

## 技術スタック

- フロントエンド
  - HTML5
  - CSS3 (Flexbox/Grid, メディアクエリ, CSS Variables)
  - Vanilla JavaScript (ES6+, モジュールパターン)
- バックエンド/インフラ
  - Firebase
    - Authentication
    - Realtime Database
    - Hosting

## セットアップ方法

### 前提条件

- Node.js と npm がインストールされていること
- Firebase アカウントを持っていること
- Firebase CLI がインストールされていること

### インストール手順

1. リポジトリをクローン
```
git clone <リポジトリURL>
cd chat-v0
```

2. Firebase プロジェクトを作成
   - [Firebase Console](https://console.firebase.google.com/) にアクセス
   - 「プロジェクトを追加」をクリック
   - プロジェクト名を入力（例: chat-v0）
   - 指示に従ってプロジェクトを作成

3. Firebase プロジェクトの設定を取得
   - Firebase Console でプロジェクトの「プロジェクトの設定」を開く
   - 「マイアプリ」セクションで「ウェブ」アイコンをクリック
   - アプリのニックネームを入力し、「アプリを登録」をクリック
   - 表示された Firebase 設定情報をコピー

4. Firebase 設定を適用
   - `public/js/database.js` ファイルを開く
   - `firebaseConfig` オブジェクトの内容を、手順3でコピーした設定情報に置き換える

5. Firebase Realtime Database を有効化
   - Firebase Console で「Realtime Database」を選択
   - 「データベースの作成」をクリック
   - 初期設定は「テストモード」を選択（後で本番環境用のルールに変更）

6. Firebase Authentication を有効化
   - Firebase Console で「Authentication」を選択
   - 「ログイン方法を設定」をクリック
   - 「メール/パスワード」を有効化

7. Firebase にデプロイ
```
firebase login
firebase init
firebase deploy
```

## 利用方法

1. ウェブブラウザでアプリケーションにアクセス（ローカル開発の場合は `firebase serve` コマンドを実行後、http://localhost:5000 にアクセス）
2. 新規ユーザー登録またはログイン
3. チャット機能またはシフト管理機能を利用

## ブラウザ対応

- Chrome 最新版
- Firefox 最新版
- Safari 最新版
- Edge 最新版

## 制約事項

- ファイル共有機能なし
- チャットメッセージの保存期間は30日間
- 通知機能はメンション時のみ
- Webブラウザのみの対応

## ライセンス

[MIT License](LICENSE) 