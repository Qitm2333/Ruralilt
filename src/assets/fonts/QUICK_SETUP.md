# 快速设置指南 - 使用你已转换的字体

## 📁 你已经转换的文件

你有以下两个 WOFF 文件：
- `Avenir.woff`
- `Avenir-Next.woff`

## 🔧 快速配置步骤

### 方案 A：使用这两个文件（推荐先试试）

1. **重命名文件**
   ```
   Avenir-Next.woff → AvenirNext-Regular.woff
   Avenir.woff → AvenirNext-Bold.woff
   ```
   
   或者反过来（如果第一种不对的话）：
   ```
   Avenir.woff → AvenirNext-Regular.woff
   Avenir-Next.woff → AvenirNext-Bold.woff
   ```

2. **复制到字体文件夹**
   - 将重命名后的文件复制到当前文件夹（`src/assets/fonts/`）

3. **重新构建**
   ```bash
   npm run build
   npx cap sync android
   ```

4. **测试效果**
   - 在 Android Studio 中运行应用
   - 查看字体是否正确显示

---

### 方案 B：如果方案 A 效果不好

**问题原因：**
- TTC 文件包含多个字重（Regular、Bold、Medium 等）
- 在线工具可能只提取了 2 个字重，但不一定是你需要的

**解决方案：**

#### 选项 1：使用 FontForge（免费软件）

1. **下载 FontForge**
   - Windows: https://fontforge.org/en-US/downloads/windows/
   - 下载并安装

2. **转换步骤**
   ```
   a. 打开 FontForge
   b. File → Open → 选择 Avenir Next.ttc
   c. 会弹出对话框，显示包含的所有字体变体
   d. 选择 "Avenir Next Regular"
   e. File → Generate Fonts
   f. 格式选择 "WOFF"
   g. 保存为 AvenirNext-Regular.woff
   
   重复步骤 b-g，这次选择 "Avenir Next Bold"
   ```

#### 选项 2：使用免费在线工具 OnlineConvertFree

1. 访问：https://onlineconvertfree.com/convert-format/ttc-to-woff/
2. 上传 `Avenir Next.ttc`
3. 转换并下载
4. 重命名并放置

#### 选项 3：使用系统默认字体（最简单）

**不使用 Avenir Next，直接使用 Inter 字体：**
- 优点：
  - Inter 是免费开源字体
  - 与 Avenir Next 非常相似
  - 已经通过 Google Fonts CDN 配置好了
  - 无需下载任何文件
  
- 缺点：
  - 需要网络连接首次加载
  - 可能与设计稿有细微差异

**如果选择这个方案：**
- 不需要做任何操作
- 字体已经自动配置好了
- 应用会自动使用 Inter 字体

---

## 🎯 推荐做法

### 立即可用方案（无需字体文件）：

**直接使用当前配置**
- 系统已经配置了 Google Fonts 的 Inter 字体作为备用
- 效果与 Avenir Next 非常接近
- 不需要下载任何字体文件
- 立即可用

### 如果你想要完美匹配 Figma：

1. **先试试你已转换的两个文件**（方案 A）
   - 可能其中一个就是你需要的
   - 花费时间：5 分钟

2. **如果效果不满意**
   - 使用 FontForge 手动提取（方案 B - 选项 1）
   - 或者接受使用 Inter 字体（方案 B - 选项 3）

---

## ❓ 常见问题

**Q: 为什么 Transfonter 显示 "not allowed"？**
A: 可能是字体有版权保护，或者 TTC 格式太复杂。

**Q: 我的两个 WOFF 文件能用吗？**
A: 可以试试！先按方案 A 重命名放置，看看效果。

**Q: 不想折腾字体了怎么办？**
A: 直接使用当前配置，Inter 字体效果已经很好了。

**Q: Inter 和 Avenir Next 差别大吗？**
A: 非常小，普通用户几乎察觉不到差异。

---

*创建时间：2025年11月28日*
