# 使い方ガイドのスクリーンショット

このフォルダに PNG/JPG を置くと、使い方ガイド（`/guide`）の各ステップに表示されます。
ファイルが無い間は「スクリーンショット準備中」のプレースホルダが表示されます。

想定ファイル名（ファイル名をこの通りにすれば自動で該当ステップに表示されます）:

## LINE公式アカウント接続 (connection) ※掲載済み
- connection-01.png … LINEヤフー Business ID ログイン画面
- connection-02.png … チャネルの種類で Messaging API を選択
- connection-03.png … Messaging API設定（Channel ID / Channel secret）
- connection-04.png … Messaging API設定タブを開く
- connection-05.png … チャネルアクセストークン（長期）の発行ボタン
- connection-06.png … 発行されたトークン
- connection-07.png … 本ツールの「チャネルを追加」
- connection-08.png … チャネル登録フォーム
- connection-09.png … 接続テストボタン
- connection-10.png … 接続成功の表示

## Webhook設定 (webhook) ※掲載済み
- webhook-01.png … 本ツールでチャネル専用 Webhook URL をコピー
- webhook-02.png … LINE Developers の Messaging API設定タブを開く
- webhook-03.png … Webhook URL の「編集」をクリック
- webhook-04.png … URL を貼り付けて「更新」
- webhook-05.png … 公式アカウントマネージャーの「設定」を開く
- webhook-06.png … 「応答設定」を開く
- webhook-07.png … 応答機能（Webhook ON / 応答メッセージ OFF）
- webhook-08.png … 友だち追加用QRコードで実機確認

## LIFF設定 (liff) ※掲載済み
- liff-01.png … 新規チャネル作成
- liff-02.png … チャネルの種類で LINEログインを選択
- liff-03.png … アプリタイプ「ウェブアプリ」
- liff-04.png … LIFF タブを開く
- liff-05.png … LIFFアプリを「追加」
- liff-06.png … サイズ Full
- liff-07.png … エンドポイントURL（…/liff/qr）
- liff-08.png … Scope（openid / profile）
- liff-09.png … 友だち追加オプション On (Normal) → 追加
- liff-10.png … LIFFアプリ一覧の LIFF ID をコピー
- liff-11.png … 本ツールで対象チャネルの編集を開く
- liff-12.png … LIFF ID を貼り付けて保存

## QR・流入計測 (qr) ※掲載済み
- qr-01.png … QRコードアクションを開く
- qr-02.png … 新規作成
- qr-03.png … 新規作成モーダル（管理名・稼働対象）
- qr-04.png … 読み込み時アクションの設定
- qr-05.png … QRコードを表示
- qr-06.png … アクションURL・QRコードの表示/ダウンロード
- qr-07.png … データ詳細を開く
- qr-08.png … 数値情報での流入計測

別のファイル名・追加したいステップがあれば、`resources/js/Pages/Guide/Index.tsx` の
各ステップの `image.src` / `images` を編集してください。
1ステップに複数枚並べたい場合は `images: [{ src, caption }, ...]` を使います。
