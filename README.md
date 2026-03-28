# にゃんこゲーム

猫テーマのスイカゲーム風ブラウザゲーム。同じ種類の猫同士をくっつけて、より大きな猫を作ろう!

**公開URL:** https://nyanko-22.github.io/nyanko-game/
**リポジトリ:** https://github.com/nyanko-22/nyanko-game

## 遊び方

- タップ/クリックで猫を落とす
- 同じ種類の猫同士がくっつくと、一段階大きな猫に進化
- 全11段階: 子猫 → ミケ猫 → シャム猫 → スコティッシュ → ペルシャ → メインクーン → ベンガル → ラグドール → サバンナ → ライオン → 猫神様
- 猫がデッドラインを超えるとゲームオーバー
- ゲームオーバー後、ニックネームを入力してスコアをオンラインランキングに登録

## 技術スタック

- **TypeScript + Vite** — ビルド・開発環境
- **Matter.js** — 2D物理エンジン（猫の落下・衝突・合体）
- **HTML5 Canvas** — 全描画（猫の顔、UI、ランキング画面など全てプロシージャル描画）
- **Web Audio API** — BGM・効果音（AudioContext, GainNodeでBGM/SE分離）
- **Firebase Firestore** — スコアデータ保存
- **Firebase Cloud Storage** — ゲームオーバー時のスクリーンショット画像保存
- **GitHub Pages** — ホスティング（GitHub Actionsで自動デプロイ）

## プロジェクト構成

```
src/
  main.ts          - エントリポイント
  game.ts          - ゲームループ・状態管理（title/playing/gameover/nickname/ranking）
  renderer.ts      - Canvas2D描画（猫の顔、UI、設定パネル、ランキング画面など）
  physics.ts       - Matter.js物理エンジン管理・衝突判定・合体処理
  cats.ts          - 猫のMatter.jsボディ生成
  input.ts         - マウス/タッチ入力管理
  sound.ts         - Web Audio APIによるBGM・効果音再生
  score.ts         - スコア管理・localStorage永続化
  constants.ts     - ゲーム定数（猫レベル定義、画面サイズ等）
  firebase.ts      - Firebase初期化・スコア送信・ランキング取得
  nickname.ts      - ニックネーム入力UI（DOMオーバーレイ）
  ranking.ts       - ランキングデータ管理・サムネイルキャッシュ
  style.css        - 基本スタイル・ニックネーム入力スタイル

public/sounds/     - 音声ファイル（MP3）
firebase/          - Firebaseセキュリティルール
.github/workflows/ - GitHub Actions デプロイ設定
```

## ゲーム状態フロー

```
[title] → タップ → [playing] → デッドライン超過 → [gameover]
  ↑                                                    ↓ タップ
  ├── ランキングボタン → [ranking] ← ────── [nickname] ←┘
  │                        ↓ 戻る        (ニックネーム入力→Firebase送信)
  └────────────────────────┘
                           ↓ もう一度
                        [playing]
```

## サウンド構成

| 種類 | ファイル | 用途 |
|------|----------|------|
| 汎用合体音 | meow1,2,5,6,7,8,9,10,11.mp3 | 合体時ランダム再生 |
| レベル専用合体音 | merge_lv0.mp3 | 子猫（Lv0）合体時 |
| | merge_lv1.mp3 | ミケ猫（Lv1）合体時 |
| | merge_lv10.mp3 | 猫神様（Lv10）合体時 |
| ゲームオーバー | gameover1,2.mp3 | ランダム再生 |
| BGM | bgm.mp3 | プレイ中ループ再生 |

## 設定機能

ゲーム画面右下の歯車アイコンから:
- BGM音量スライダー
- SE音量スライダー
- やり直し（ゲームリスタート）
- スクリーンショット（PNGダウンロード）

音量設定はlocalStorageに保存され次回起動時に復元。

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動（HMR対応）
npm run build    # プロダクションビルド（dist/に出力）
npm run preview  # ビルド結果のプレビュー
```

## デプロイ

`main`ブランチへpushすると、GitHub Actionsが自動でビルド・GitHub Pagesにデプロイ。

ワークフロー: `.github/workflows/deploy.yml`

## Firebase設定

### プロジェクト情報

- プロジェクトID: `nyankogame-78531`
- Spark（無料）プラン

### セキュリティルール

スコアボード機能にはFirebaseコンソールでのルール設定が必要。

**Firestore ルール** — [`firebase/firestore.rules`](firebase/firestore.rules)
- `scores` コレクション: 全員読み取り可、作成のみ可（更新・削除不可）
- バリデーション: nickname 1-12文字（string）、score（number）

**Cloud Storage ルール** — [`firebase/storage.rules`](firebase/storage.rules)
- `screenshots/` パス: 全員読み取り可、作成のみ可（更新・削除不可）
- バリデーション: JPEG形式、200KB以下

### Firestoreデータモデル

**Collection: `scores`**

| Field | Type | Description |
|---|---|---|
| nickname | string | プレイヤー名 (1-12文字) |
| score | number | 最終スコア |
| screenshotUrl | string | Storage上の画像URL |
| timestamp | timestamp | サーバータイムスタンプ |

## 設計メモ

- **猫の描画**: 全てCanvas2Dでプロシージャル描画。品種ごとに色・模様・特徴を分けている（ミケ猫のパッチ、シャム猫の顔マスク、スコティッシュの折れ耳、ライオンのたてがみ、猫神様の王冠など）
- **合体処理**: Matter.jsの`collisionStart`イベントで合体キューに追加し、`afterUpdate`で実際の合体を実行（衝突中にボディを操作するとクラッシュするため）
- **音声再生**: ブラウザのAutoplay Policy対策として、初回ユーザー操作時に`AudioContext.resume()`を呼ぶ。BGMは非同期ロード完了前に再生要求された場合、`bgmPending`フラグで遅延再生
- **ドロップ操作の排他制御**: 設定パネルやランキング画面のタップが猫ドロップに伝播しないよう、`suppressDrop()`で後続の`click`/`touchend`を抑制
- **スクリーンショット**: ゲームオーバー時に`canvas.toBlob()`でJPEG取得→リサイズ圧縮（360x640, quality 0.7）→Firebase Storageにアップロード
