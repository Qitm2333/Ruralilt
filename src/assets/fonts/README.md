# 字体文件说明

## 📁 需要的字体文件

请将以下字体文件放置在此目录中：

### 1️⃣ Avenir Next（主要字体）
- `AvenirNext-Regular.woff2`
- `AvenirNext-Regular.woff`
- `AvenirNext-Bold.woff2`
- `AvenirNext-Bold.woff`

### 2️⃣ Inter（备用字体）
- `Inter-Regular.woff2`
- `Inter-Regular.woff`
- `Inter-Bold.woff2`
- `Inter-Bold.woff`
- `Inter-Black.woff2`
- `Inter-Black.woff`

### 3️⃣ Noto Sans JP（日文字体）
- `NotoSansJP-Regular.woff2`
- `NotoSansJP-Regular.woff`
- `NotoSansJP-Bold.woff2`
- `NotoSansJP-Bold.woff`

### 4️⃣ Alibaba PuHuiTi（可选）
- `AlibabaPuHuiTi-Regular.woff2`
- `AlibabaPuHuiTi-Regular.woff`

---

## 🔍 如何获取字体文件

### ⚠️ 重要提示：TTC 格式不能直接使用
如果你找到的是 `.ttc` 格式（TrueType Collection），需要先转换成 `.woff2` 格式才能使用。

### 方法 1：从 Figma 设计稿导出
1. 在 Figma 中打开你的设计文件
2. 查看使用的字体列表
3. 从系统或 Figma 插件中导出字体文件

### 方法 2：购买/下载字体
- **Avenir Next**: 商业字体，需要购买授权
  - https://www.linotype.com/fonts/avenir-next
  - 或者从 macOS 系统中提取（Mac 自带）
  
- **Inter**: 免费开源字体
  - https://fonts.google.com/specimen/Inter
  - https://rsms.me/inter/
  
- **Noto Sans JP**: 免费开源字体
  - https://fonts.google.com/noto/specimen/Noto+Sans+JP
  
- **Alibaba PuHuiTi**: 免费字体
  - https://www.alibabafonts.com/

### 方法 3：使用字体转换工具
如果你有 `.ttf`、`.otf` 或 `.ttc` 格式的字体文件，可以使用以下工具转换为 `.woff2`:
- https://transfonter.org/
- https://cloudconvert.com/ttc-to-woff2

---

## 📝 转换步骤

### 方案 A：在线转换（推荐 - 简单快速）

**使用 CloudConvert**（支持 TTC 格式）

1. 访问 https://cloudconvert.com/ttc-to-woff2
2. 上传你的字体文件（`.ttc`、`.ttf` 或 `.otf`）
3. 选择输出格式：**WOFF2**
4. 点击 "Convert" 开始转换
5. 下载转换后的文件
6. 重命名为对应的文件名（如 `AvenirNext-Regular.woff2`）
7. 复制到此文件夹

**使用 Transfonter**（更专业）

1. 访问 https://transfonter.org/
2. 上传字体文件（`.ttf`、`.otf` 或 `.ttc`）
3. 勾选 **WOFF2** 和 **WOFF** 格式
4. 点击 "Convert" 下载转换后的文件
5. 将文件重命名为上述列表中的名称
6. 复制到此文件夹

### 方案 B：使用字体编辑软件（高级）

如果在线工具无法处理 TTC 文件，可以使用：
- **FontForge**（免费开源）：https://fontforge.org/
- **TransType 4**（商业软件）

**FontForge 转换步骤：**
1. 下载并安装 FontForge
2. 打开 TTC 文件
3. 选择需要的字体变体（Regular、Bold 等）
4. File → Generate Fonts
5. 选择 WOFF2 格式
6. 导出并重命名

---

## ✅ 检查清单

放置字体文件后，确保文件结构如下：

```
src/assets/fonts/
├── AvenirNext-Regular.woff2
├── AvenirNext-Regular.woff
├── AvenirNext-Bold.woff2
├── AvenirNext-Bold.woff
├── Inter-Regular.woff2
├── Inter-Regular.woff
├── Inter-Bold.woff2
├── Inter-Bold.woff
├── Inter-Black.woff2
├── Inter-Black.woff
├── NotoSansJP-Regular.woff2
├── NotoSansJP-Regular.woff
├── NotoSansJP-Bold.woff2
├── NotoSansJP-Bold.woff
├── AlibabaPuHuiTi-Regular.woff2 (可选)
├── AlibabaPuHuiTi-Regular.woff (可选)
└── README.md
```

---

## 🚀 使用说明

字体文件放置后：
1. **不需要修改任何代码** - 字体配置已经在 `src/fonts.css` 中完成
2. 运行 `npm run build` 重新构建
3. 运行 `npm run sync` 同步到 Android
4. 字体会自动生效

如果字体文件缺失，应用会自动回退到 Google Fonts CDN 加载的备用字体。

---

## ⚠️ 注意事项

1. **WOFF2 优先**：浏览器会优先使用 `.woff2` 格式（更小、更快）
2. **WOFF 备用**：`.woff` 作为旧浏览器的备用格式
3. **版权问题**：确保你有字体的使用授权
4. **文件大小**：字体文件会增加应用体积，注意优化
5. **缓存**：字体会被打包到应用中，不需要网络连接

### 📌 关于 TTC 格式的特别说明

**TTC (TrueType Collection)** 是一种特殊的字体文件格式，它将多个字体打包在一个文件中。

**为什么不能直接使用 TTC？**
- Web 浏览器不支持直接加载 TTC 格式
- 需要先从 TTC 中提取单个字体，再转换为 WOFF2

**TTC 文件通常包含：**
- `Avenir Next.ttc` → 包含 Regular、Bold、Italic、Medium 等多个变体
- 转换时需要选择你需要的具体变体

**推荐处理流程：**
1. 使用 **CloudConvert** 或 **Transfonter** 在线转换
2. 如果在线工具不支持，使用 **FontForge** 软件
3. 从 TTC 中提取 Regular 和 Bold 两个变体
4. 分别转换为 WOFF2 格式
5. 重命名并放置到此文件夹

---

*最后更新：2025年11月28日*
