# にゃんこゲーム

猫テーマのスイカゲーム風ブラウザゲーム。同じ種類の猫同士をくっつけて、より大きな猫を作ろう!

## 遊び方

- タップ/クリックで猫を落とす
- 同じ種類の猫同士がくっつくと、一段階大きな猫に進化
- 猫がデッドラインを超えるとゲームオーバー

## 技術スタック

- TypeScript + Vite
- Matter.js (物理エンジン)
- HTML5 Canvas (描画)
- Web Audio API (サウンド)
- Firebase Firestore / Cloud Storage (スコアボード)

## 開発

```bash
npm install
npm run dev
```

## ビルド・デプロイ

```bash
npm run build
```

GitHub Pagesへ自動デプロイ（`main`ブランチへのpush時）。

## Firebaseセキュリティルール

スコアボード機能にはFirebaseの設定が必要です。以下のルールをFirebaseコンソールで設定してください。

### Firestore ルール

[`firebase/firestore.rules`](firebase/firestore.rules) の内容をFirebaseコンソール > Firestore Database > ルール に貼り付けてください。

- `scores` コレクション: 全員読み取り可、作成のみ可（更新・削除不可）
- バリデーション: nickname 1-12文字（string）、score（number）

### Cloud Storage ルール

[`firebase/storage.rules`](firebase/storage.rules) の内容をFirebaseコンソール > Storage > ルール に貼り付けてください。

- `screenshots/` パス: 全員読み取り可、作成のみ可（更新・削除不可）
- バリデーション: JPEG形式、200KB以下
