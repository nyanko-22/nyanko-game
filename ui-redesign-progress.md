# にゃんこゲーム UI リデザイン - 進捗状況

## 概要
Stitchデザインモックアップに基づくUI全面刷新。
Canvas描画 → ハイブリッド(ゲームプレイ=Canvas、UI画面=HTML/CSS)に移行。

## Stitchデザイン参照先
- パステル背景: `projects/4191252558749516095/screens/1b6c6241b3c64694af05c298c987dbe1`
- ダーク背景: `projects/4191252558749516095/screens/712cb78fd2524f5fa360e62804d8414c`
- ホーム画面: `projects/4191252558749516095/screens/cfd72c90b65b4da882b60c21409f73f6`
- 設定画面: `projects/4191252558749516095/screens/fa654d4e2ed949c5941d0d83a63455e2`
- ランキング: `projects/4191252558749516095/screens/c8aca3f1c69a4588a52d60c637c123fe`

## ユーザー決定事項
- **UI方針**: ハイブリッド (HTML/CSS + Canvas)
- **テーマ**: 両テーマ実装 (パステル + ダーク、デフォルト: パステル)
- **設定画面**: Account Info / Privacy Policy / Support は表示のみ（非機能）

---

## 進捗

### Phase 1: 基盤構築 -- COMPLETED
作成・変更済みファイル:
- `src/theme.ts` -- テーマ状態管理 (getTheme, setTheme, onThemeChange, initTheme)
- `src/theme.css` -- CSS変数定義 (パステル/ダーク両テーマ、Canvas用トークン含む)
- `src/style.css` -- 大幅拡張 (グラスモーフィズム, ボタン, トグル, レイアウト等 ~300行)
- `index.html` -- Google Fonts追加, #game-wrapper + #overlay-container + #hud-container構造
- `src/screens/shared.ts` -- DOM管理ユーティリティ (createScreen, showScreen, hideScreen, el, materialIcon)
- `src/main.ts` -- initTheme()追加
- `src/game.ts` -- canvas マウント先を #game-wrapper に変更

### Phase 2: 設定画面をHTML化 -- COMPLETED
作成・変更済みファイル:
- `src/screens/settings.ts` -- 新規作成完了
  - フルスクリーンHTML設定画面
  - BGM/SEトグルスイッチ
  - テーマ切替カード (Pastel Pattern / Dark Cosmic、ACTIVEバッジ)
  - リスタート、スクリーンショットボタン
  - Account Info / Privacy Policy / Support (表示のみ)
- `src/game.ts` -- 変更完了
  - `openSettings()` 関数追加 (showSettingsScreen/hideSettingsScreen連携)
  - `setupSettingsInput()` 全削除
  - `isInSettingsButton`, `isInCloseButton`, `hitSlider`, `hitButton`, `updateSliderValue` 全削除
  - `draggingSlider` 変数削除
  - `render()` 呼び出しから settingsOpen, bgmVol, seVol パラメータ除去
  - sound.tsからのgetBgmVolume/getSeVolume/setBgmVolume/setSeVolumeのimport削除
  - suppressDrop import削除
- `src/renderer.ts` -- 変更完了
  - `drawSettingsPanel()`, `drawSettingsButton()`, `drawSlider()`, `drawButton()` 全削除
  - `SETTINGS_BUTTON`, `SETTINGS_LAYOUT` エクスポート削除
  - `render()` シグネチャから settingsOpen, bgmVol, seVol パラメータ削除

注意: `openSettings()` は export されているが、まだUIからの呼び出し元がない。
Phase 3 (ホーム画面) または Phase 6 (HUD) で設定ボタンを配置して接続する。

### Phase 3: ホーム画面をHTML化 -- COMPLETED
- `src/screens/home.ts` 新規作成
- `src/game.ts` から drawTitleScreen 関連削除、openHomeScreen() 追加
- `src/renderer.ts` から `drawTitleScreen()`, `TITLE_LAYOUT` 削除

### Phase 4: ゲームオーバー + ニックネーム画面をHTML化 -- COMPLETED
- `src/screens/gameover.ts` 新規作成
- `src/screens/nickname.ts` 新規作成
- 旧 `src/nickname.ts` 削除
- `src/renderer.ts` から drawGameOverScreen / drawNicknameScreen / NICKNAME_LAYOUT 削除

### Phase 5: ランキング画面をHTML化 -- COMPLETED
- `src/screens/ranking.ts` 新規作成 (RankingRenderData型もここに移動)
- `src/game.ts` から `setupRankingInput()` 全削除
- `src/renderer.ts` から drawRankingScreen / drawRankingButtons / drawScreenshotModal / RANKING_LAYOUT 削除

### Phase 6: インゲームHUD -- COMPLETED
- `src/screens/hud.ts` 新規作成
- `src/renderer.ts` からスコア/NEXT描画削除、render()シグネチャ簡素化
- `src/game.ts` で showHud/hideHud/updateHud 連携

### Phase 7: ポリッシュ & 背景パターン -- COMPLETED
- 背景SVG作成 (`public/bg-pastel.svg`, `public/bg-dark.svg`)
- 画面遷移アニメーション (translateY + opacity)
- グラスモーフィズム・ボタンホバー微調整

---

## 再開時の手順
1. このファイルで進捗を確認
2. Phase 3 (ホーム画面HTML化) から着手
3. 各Phase完了ごとに `npm run build` でビルド確認
4. プランの詳細は `.claude/plans/ancient-chasing-ladybug.md` にもある

## 現在のファイル構成
```
src/
  main.ts              -- エントリーポイント (theme初期化追加済み)
  game.ts              -- ゲームループ & 状態管理 (設定関連削除済み)
  renderer.ts          -- Canvas描画 (設定描画削除済み)
  constants.ts         -- ゲーム定数
  theme.ts             -- NEW: テーマ状態管理
  theme.css            -- NEW: CSS変数定義
  style.css            -- 大幅拡張済み
  screens/
    shared.ts          -- NEW: DOM管理ユーティリティ
    settings.ts        -- NEW: HTML設定画面
  cats.ts              -- 猫オブジェクト生成 (未変更)
  physics.ts           -- Matter.js物理 (未変更)
  input.ts             -- 入力処理 (未変更)
  score.ts             -- スコア管理 (未変更)
  sound.ts             -- 音声管理 (未変更)
  firebase.ts          -- Firebase連携 (未変更)
  ranking.ts           -- ランキングデータ (未変更、Phase 5でリネーム予定)
  nickname.ts          -- ニックネーム入力 (未変更、Phase 4で削除予定)
```
