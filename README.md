# 🐨 Koala Learning App

一款面向儿童的互动学习应用，包含卡牌识别、课程学习、AR互动等功能。

## ✨ 主要功能

### 📱 核心页面
- **Home**: 首页，展示课程和学习进度
- **Collection**: 收藏页，卡牌收集和AR识别
- **Create**: 创作页，相机功能
- **Message**: 消息页，礼物和通知（含考拉爬上卡牌的动画）
- **Profile**: 个人页，成就、商店、报告（含考拉挥手动画）

### 🎯 特色功能
1. **卡牌识别系统**
   - 实时摄像头卡牌检测
   - 5张卡牌支持（基于颜色直方图匹配）
   - 识别成功后播放对应视频

2. **PNG序列帧动画**
   - Profile页面：考拉挥手动画（90帧，30fps，1.6倍缩放）
   - Message页面：考拉爬树动画（104帧，30fps）
   - 进入页面自动播放
（原本想用lottie，但制作过程遇到了很多很多问题）

3. **视频播放器**
   - 自定义UI设计
   - 支持下滑关闭手势
   - 点击重播功能

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript + Vite
- **移动端**: Capacitor 6 (Android)
- **UI库**: TailwindCSS
- **图标**: Lucide React
- **卡牌识别**: 自定义颜色直方图算法
- **动画**: PNG序列帧 + setInterval

## 📦 安装和运行

### Web开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### Android构建
```bash
# 构建Web资源
npm run build

# 同步到Android
npx cap sync android

# 在Android Studio中打开
npx cap open android
```

## 📁 项目结构

```
src/
├── components/
│   ├── HomePage.tsx           # 首页
│   ├── CollectionPage.tsx     # 收藏页
│   ├── CreatePage.tsx         # 创作页
│   ├── MessagePage.tsx        # 消息页（考拉爬树动画）
│   ├── ProfilePage.tsx        # 个人页（考拉挥手动画）
│   ├── CardDetection.tsx      # 卡牌识别核心组件
│   ├── VideoPlayer.tsx        # 视频播放器
│   ├── BottomNav.tsx          # 底部导航栏
│   └── CourseDetailPage.tsx   # 课程详情页
├── App.tsx                    # 主应用组件
└── main.tsx                   # 入口文件

public/
├── detectCard/                # 卡牌参考图（1-5.png）
├── KoalaSequence/             # 考拉挥手动画（90帧）
├── KoalaClimb/                # 考拉爬树动画（104帧）
└── videoasset/                # 卡牌视频资源
```

## 🎨 卡牌识别算法

### 核心原理
- 颜色直方图匹配（512维，8x8x8 RGB空间）
- 图像标准化（去除光照差异）
- 多帧连续验证（避免误检）

### 检测流程
1. 实时捕获摄像头画面
2. 裁剪中心区域（150px圆形）
3. 计算颜色直方图
4. 与参考卡牌比对
5. 分数>35%且连续匹配3次→识别成功

## 🎬 动画系统

### PNG序列帧动画
```typescript
// 核心参数
TOTAL_FRAMES: 90/104帧
FPS: 30帧/秒
FRAME_DURATION: 33.33ms

// 播放器实现
setInterval(() => {
  frame++;
  setCurrentFrame(frame);
  if (frame >= TOTAL_FRAMES) {
    clearInterval();
    setIsPlaying(false);
  }
}, FRAME_DURATION);
```

## 📱 Android配置

### 权限
- CAMERA: 摄像头访问
- RECORD_AUDIO: 视频录制
- INTERNET: 网络访问

### 最低版本
- minSdkVersion: 22 (Android 5.1)
- targetSdkVersion: 34 (Android 14)

## 🔧 开发记录

详见 `DAILY_REPORT_2024-11-28.md`

## 📄 许可证

本项目基于 我自己的Figma 设计稿开发~~
插画，动效，高保真,技术demo都是我自己

---

Made with ❤️ for kids learning