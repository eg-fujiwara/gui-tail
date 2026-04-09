# GUI Tail

Windows向けのGUI tailコマンド。ファイルをリアルタイムに監視し、追記された行を表示する。

## 必要環境

- [Rust](https://rustup.rs/) (1.77.2+)
- [Node.js](https://nodejs.org/) (18+)
- npm

## 開発ビルド

```bash
# 依存インストール
npm install
```

```bash
# 開発サーバー起動（ホットリロード付き）
npx tauri dev
```

## リリースビルド

```bash
# 最適化された実行ファイルを生成
npx tauri build
```

生成物は `src-tauri/target/release/bundle/` に出力される。

- `nsis/` - インストーラー (.exe)
- `msi/` - MSIパッケージ
