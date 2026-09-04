# run-tec.jp 実測分析(2026-09-05)

計測方法:Chrome MCPで https://run-tec.jp/ を開き、ページ内に同一オリジンのiframe(幅1440px/390px)を注入して各レイアウトを`getComputedStyle`で実測。メディアクエリはiframe幅に反応するため、DevToolsのレスポンシブモードと同等の値が取れる。アニメーションはCSSOM(styleSheets)から@keyframes定義とセレクタを直接抽出。すべて実測値であり推測値は含まない。
※制約:Chrome拡張のウィンドウ幅が850pxに固定されるため「実ウィンドウのリサイズ」ではなくiframe法を採用。SPハンバーガー開閉のみ実ウィンドウ(850px・タブレット表示)で目視+スクリーンショット確認。

サイト実装:WordPress + Elementor。アクセント色はピンク #E91E8C(→ 当サイトには持ち込まない。配色はCLAUDE.md規定を維持)。

---

## 1. ヘッダー

### PC(1440px)
| 項目 | 実測値 |
|---|---|
| 高さ | **93px**(固定。スクロールで変化しない) |
| position | fixed(top:0) |
| 背景 | rgba(255,255,255,0.95) + **backdrop-filter: blur(20px)** |
| 影 | なし(スクロール後もなし) |
| スクロール変化 | **高さ・背景・影とも一切変化なし**(y=0〜800で全プロパティ同値、クラス付与もなし)。transition: background-color 0.3s は定義されているが発火しない |
| 左右padding | 50px |
| **スクロール進捗バー** | ヘッダー上端に **h=3px・position:fixed** のバー。`linear-gradient(90deg, #E91E8C, #FF6B6B)`。**width 0.1s linear** でスクロール量に追従(このサイトの「ヘッダーの動き」の正体はこれ) |

### ロゴ「RUNTEC.」
- H1テキストロゴ(画像ではない)。**Inter 700 / 20px / letter-spacing 1px** / #0A0A0D
- ピリオドはテキストの一部(色・サイズの差別化なし)。SPでも20px/700で不変

### ナビ(PC)
- font: システムフォントスタック(-apple-system…)/ **16px / weight 400 / letter-spacing normal**
- 表記はすべて英大文字(HOME / NEWS / ABOUT US / SERVICES / PRODUCT / FAQ)※CSSのtext-transformではなく元テキストが大文字
- 現在ページ=ピンク #E91E8C、他は #0A0A0D。padding 13px 20px
- hover:色変化のみ(transform系のhoverルールは実使用なし。検出されたscale系はElementor組込ライブラリの未使用ルール)

### Contactボタン(PC)
- **ピル型 border-radius:30px** / bg #E91E8C / 白文字 12px・500 / padding 12px 24px / transition 0.3s
- hover:背景の明度変化(#CC3366系へ)

### SP(390px)
| 項目 | 実測値 |
|---|---|
| ヘッダー高さ | **56px** / 背景・blurはPCと同じ / padding-left 12px |
| ロゴ | 20px / 700(PCと同じ) |
| ハンバーガー | 36×36px・SVG2枚(開/閉アイコン切替) |
| 開閉挙動 | **Elementor標準の白ドロップダウンパネル**がヘッダー下に展開(リスト項目16px/400・padding 13px 20px・現在ページはグレー地)。カスタム演出なし・特筆すべきduration/easingなし(実測でtransition定義なし) |

---

## 2. モーション

### スクロール出現(サイトの中核パターン)
- 仕組み:全対象に初期クラス `anim-ready`(opacity:0)→ **IntersectionObserver threshold:0.15** で `anim-fadeUp` 等を付与 → CSSアニメーション実行(forwards)
- 出現対象は**ページ全体で13要素のみ**(セクション見出し・カード群単位。1要素ずつ細かく動かさない)
- keyframes実測値:

| クラス | 内容 | duration / easing |
|---|---|---|
| fadeUp | opacity 0→1 + **translateY(40px)→0** | **0.8s cubic-bezier(0.4, 0, 0.2, 1)** |
| fadeLeft / fadeRight | opacity + translateX(∓40px)→0 | 0.8s 同上 |
| scaleIn | opacity + scale(0.85)→1 | 0.8s 同上 |
| insightCardFadeIn | カード用フェード | 0.6s ease |

- **時差(stagger):JS設定で delay: 0 / 150 / 300 ms** の3段(同時に入る要素グループに適用)

### ページロード時のスプラッシュ(#runtec-splash)
1. ロゴ:`splashFadeIn` **0.8s cubic-bezier(0.4,0,0.2,1)** — opacity 0→1 と同時に **letter-spacing 40px→20px**(字間が締まりながら現れる)
2. ライン:`splashLine` 0.6s・delay 0.4s — width 0→120px(線が引かれる)
3. サブテキスト:`splashSubIn` 0.6s・delay 0.6s
→ 完了後にスプラッシュ非表示(display:none)。ヒーロー自体には出現アニメなし(スプラッシュが「幕」の役割)

### ヒーロー
- 背景はスライドショー+**Ken Burns**(`kb1`: scale 1→1.15 + translate(-2%,-1%))
- 見出し・サブ・CTAに個別の出現アニメなし(スプラッシュ明け=表示済み)

### hover(カード・ボタン)
| 対象 | 実測値 |
|---|---|
| .rt-tilt(汎用カード) | **translateY(-2px)** + box-shadow 0 8px 24px rgba(233,30,140,.2) |
| .media-card | **translateY(-6px)** + box-shadow 0 12px 32px rgba(0,0,0,.2) |
| 記事カード | box-shadow + ボーダー色変化のみ |
| ボタン | 色・明度変化のみ(transformなし) |

### 常時アニメ(装飾)
- `rtFloat`:ふわふわ上下 ±12px・5s infinite / `rtGlow`:3s明滅 — 装飾要素のみに限定使用

### 動く/動かないの使い分け(観察)
- 動く:セクション先頭ブロックの出現(13箇所)・進捗バー・ヒーローKen Burns・カードhover
- 動かない:ヘッダー(完全固定)・ナビ・本文テキスト・フッター。**「出現1回+hover」以外は動かさない**設計

---

## 3. タイポグラフィ

### 英字ディスプレイ(Inter)
| 用途 | 実測値 |
|---|---|
| ヒーローEN見出し | **Inter 800 / 64px / letter-spacing -2px / line-height 1.05 / uppercase**(白) |
| ロゴ | Inter 700 / 20px / ls 1px |
| セクションラベル | **Inter 600 / 13px / letter-spacing 4px(≒0.31em)/ uppercase / ピンク**(小さめ変種:11px/500/ls 3px) |

### 日本語(Noto Sans JP)
| 用途 | 実測値 |
|---|---|
| 大見出し | **Noto Sans JP 800 / 48px / letter-spacing -1〜-0.5px / line-height 1.2** |
| SP大見出し | 28px / 500 |
| 本文 | **14px / weight 300 / line-height 2.2 / rgba(10,10,13,0.5)**(薄めグレー) |
| ヒーローサブ | 14px / lh 2.0 / rgba(255,255,255,0.6) |

### 2段構成の寸法関係(ABOUT USセクション実測)
```
[ラベル] Inter 600 13px / ls 4px / ピンク
   ↓ gap 20px
[日本語大見出し] Noto Sans JP 800 48px
```
- **ジャンプ率:ラベル13px → 見出し48px = 約3.7倍 / 本文14px → 見出し48px = 約3.4倍**
- 見出しはweight 800で太いが、本文をweight 300+50%グレーまで軽くして差を最大化している(コントラストは「サイズ」と「濃度」の両輪)

---

## 4. 当サイトへの持ち込み判断メモ(詳細はSTEP 2提案)
- 持ち込む:進捗バー(朝日グラデで)/ blur 20px / 出現40px・0.8s・stagger 150ms / ラベル13px・ls 0.3em+gap 20px+ジャンプ率 / hoverリフト
- 持ち込まない:ピンク配色 / ピル型ボタン(CLAUDE.md禁止)/ スプラッシュ(CV導線の障壁・要相談)/ 常時ふわふわ(禁止事項) / 本文weight 300(銀行審査向け可読性を優先)
