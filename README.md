# Wikipedia Theme Crawler

Electronベースのデスクトップアプリケーションで、Wikipediaのコンテンツをテーマ別にクローリングし、ローカルファイルとして保存します。

## 特徴

- 🎯 **テーマ別収集**: カテゴリ、キーワード検索、リンク追跡、手動リストなど複数の収集モード
- 🌍 **多言語対応**: 日本語、英語など複数のWikipedia言語版に対応
- 📝 **複数形式対応**: Markdown、HTML、JSON形式での保存
- 🖼️ **画像ダウンロード**: オプションで記事の画像も保存可能
- ⚡ **レート制限**: Wikipedia APIのガイドラインに準拠した礼儀正しいクローリング
- 📊 **進捗可視化**: リアルタイムの進捗バーと状態表示

## インストール

### 必要な環境

- Node.js v16以上
- npm または yarn

### セットアップ

```bash
# 依存関係のインストール
npm install

# アプリケーションの起動
npm start

# 開発モード（DevTools有効）
npm run dev
```

## 使い方

1. **言語を選択**: 日本語(ja)、英語(en)など
2. **収集モードを選択**:
   - **カテゴリ**: Wikipedia のカテゴリから記事を収集
   - **キーワード検索**: 検索結果から記事を収集
   - **リンク追跡**: 特定記事から関連記事を辿って収集
   - **手動リスト**: 記事タイトルのリストから収集
3. **クエリを入力**: モードに応じた検索条件を入力
4. **設定を調整**:
   - 最大記事数（1-1000）
   - 保存形式（Markdown/HTML/JSON）
   - 画像ダウンロードの有無
5. **テーマ名を入力**: 保存先のフォルダ名
6. **出力ディレクトリを選択**: ファイルの保存先
7. **開始ボタンをクリック**: クローリング開始

## 収集モードの詳細

### カテゴリモード
```
入力例: 日本の歴史
説明: 指定したカテゴリに属する記事を収集
```

### キーワード検索モード
```
入力例: 量子力学
説明: Wikipedia内を検索し、該当する記事を収集
```

### リンク追跡モード
```
入力例: 東京
リンク深度: 1-3
説明: 指定した記事から関連記事へのリンクを辿って収集
```

### 手動リストモード
```
入力例:
東京
大阪
京都
説明: 指定した記事タイトルのリストから収集
```

## 出力ファイル構造

```
output_directory/
└── theme_name/
    ├── metadata.json          # クロール情報のメタデータ
    ├── INDEX.md               # 記事一覧
    ├── article_1.md           # 記事ファイル
    ├── article_2.md
    └── images/                # 画像（オプション）
        ├── article_1.jpg
        └── article_2.jpg
```

## ビルド

```bash
# すべてのプラットフォーム向けにビルド
npm run build

# macOS向け
npm run build:mac

# Windows向け
npm run build:win

# Linux向け
npm run build:linux
```

ビルドされたアプリケーションは `dist/` ディレクトリに生成されます。

## 技術スタック

- **Electron**: デスクトップアプリケーションフレームワーク
- **Wikipedia API**: MediaWiki APIを使用
- **Axios**: HTTPクライアント
- **Turndown**: HTMLからMarkdownへの変換

## レート制限とマナー

このアプリケーションはWikipediaのAPIガイドラインに従い、以下の配慮をしています:

- リクエスト間に200msの遅延を挿入
- 適切なUser-Agentヘッダー
- 効率的なAPI利用（不要なリクエストを避ける）

大量のデータを収集する場合は、Wikipedia Dumpsの使用も検討してください:
https://dumps.wikimedia.org/

## ライセンス

MIT License

## 免責事項

このツールは教育・研究目的で作成されています。Wikipediaのコンテンツを利用する際は、[Wikipedia の利用規約](https://foundation.wikimedia.org/wiki/Terms_of_Use/ja)および[CC BY-SA 3.0ライセンス](https://creativecommons.org/licenses/by-sa/3.0/deed.ja)に従ってください。
