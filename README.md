# 🐨 Koala Learning App

一款面向儿童的互动学习应用，集成卡牌识别、舞蹈教学、AI视频生成等功能。

## 📑 目录

- [主要功能](#✨-主要功能)
  - [已实现功能](#🎯-已实现功能-✅)
  - [技术储备](#🚀-技术储备已完成设计待整合)
- [技术栈](#🛠️-技术栈)
- [安装和运行](#📦-安装和运行)
- [项目结构](#📁-项目结构)
- [卡牌识别算法](#🎨-卡牌识别算法已实现)
- [PreTech技术储备详解](#📚-pretech技术储备详解)
- [技术成果总结](#🎯-技术成果总结)
- [产品路线图](#🗺️-产品路线图)

---

## ✨ 主要功能

### 📱 核心页面
- **Home**: 首页，展示课程和学习进度
- **Collection**: 收藏页，卡牌收集和AR识别
- **Create**: 创作页，相机功能 + 舞蹈捕获
- **Message**: 消息页，礼物和通知（含考拉爬上卡牌的动画）
- **Profile**: 个人页，成就、商店、报告（含考拉挥手动画）

### 🎯 已实现功能 ✅

1. **自研卡牌识别系统** 
   - ✅ 多算法融合识别（ORB + 颜色直方图 + 边缘检测）
   - ✅ 自动曝光调整（防过曝优化）
   - ✅ 时序验证机制（连续匹配2-3次）
   - ✅ 识别准确率 >95%，平均2-3秒识别
   - 📄 技术文档：`PreTech/07_MULTI_ALGORITHM_RECOGNITION.md`

2. **PNG序列帧动画**
   - ✅ Profile页面：考拉挥手动画（90帧，30fps，1.6倍缩放）
   - ✅ Message页面：考拉爬树动画（104帧，30fps）
   - ✅ 进入页面自动播放
   （原本想用lottie，但制作过程遇到了很多很多问题）

3. **视频播放器**
   - ✅ 自定义UI设计
   - ✅ 支持下滑关闭手势
   - ✅ 点击重播功能

### 🚀 技术储备（已完成设计，待整合）

4. **儿童舞蹈教学系统** 🎵
   - 📋 标准舞蹈动作库（完整录制 + JSON存储）
   - 📋 实时动作捕获（MediaPipe Pose + 关键帧/全帧模式）
   - 📋 儿童骨骼适配（身高归一化 + 比例缩放）
   - 📋 DTW智能匹配（动态时间规整 + 多维度评分）
   - 📋 差异分析可视化（位置/速度/加速度/节奏分析）
   - 📋 实时反馈系统（雷达图 + 热力图 + 3D动画）
   - 📄 技术文档：`PreTech/01-05_DANCE_*.md`

5. **AI视频生成集成** 🎬
   - 📋 ComfyUI自定义插件（MediaPipe → DWPose转换）
   - 📋 骨架图像渲染（JSON → 骨架序列图）
   - 📋 Wan2.2 Animate工作流集成
   - 📋 儿童舞蹈AI视频生成（参考照片 + 舞蹈动作）
   - 📄 技术文档：`PreTech/06_COMFYUI_PLUGIN.md`

> 💡 **技术储备说明**：上述功能的核心算法、数据结构、API设计已完成并形成技术文档，代码实现处于待整合状态。

## 🛠️ 技术栈

### 核心框架
- **前端**: React 18 + TypeScript + Vite
- **移动端**: Capacitor 6 (Android)
- **UI库**: TailwindCSS + Radix UI
- **图标**: Lucide React

### 计算机视觉 & AI
- **姿态估计**: MediaPipe Pose (Google)
- **图像处理**: OpenCV.js (ORB特征提取)
- **AI视频生成**: ComfyUI + Wan2.2 Animate
- **自研算法**: 
  - 颜色直方图匹配 (512维)
  - Sobel边缘检测 + HOG特征
  - DTW动态时间规整

### 数据处理
- **本地存储**: IndexedDB (舞蹈数据、用户记录)
- **数据格式**: JSON (MediaPipe归一化坐标)
- **动画**: PNG序列帧 (30fps)

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
│   ├── CreatePage.tsx         # 创作页（舞蹈捕获）
│   ├── MessagePage.tsx        # 消息页（考拉爬树动画）
│   ├── ProfilePage.tsx        # 个人页（考拉挥手动画）
│   ├── CardDetection.tsx      # 卡牌识别核心组件（~1084行）
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

PreTech/                       # 🎯 技术储备文档
├── 01_DANCE_MOTION_LIBRARY.md        # 舞蹈动作库设计
├── 02_REALTIME_CAPTURE.md            # 实时动作捕获方案
├── 03_SKELETON_ADAPTATION.md         # 儿童骨骼适配算法
├── 04_DTW_MATCHING.md                # DTW智能匹配引擎
├── 05_DIFFERENCE_VISUALIZATION.md    # 差异分析可视化
├── 06_COMFYUI_PLUGIN.md              # ComfyUI自定义插件
├── 07_MULTI_ALGORITHM_RECOGNITION.md # 多算法识别（已实现）
└── Wan2.2 Animate .json              # ComfyUI工作流参考
```

## 🎨 卡牌识别算法（已实现）

### 多算法融合识别
1. **ORB特征点提取** (OpenCV.js)
   - 500个特征点
   - BFMatcher暴力匹配
   - 汉明距离<50阈值

2. **颜色直方图算法**
   - 8×8×8色彩空间（512维）
   - 主色调提取（中心50%区域）
   - 直方图相关性计算

3. **边缘检测 + 特征提取**
   - Sobel算子（阈值35）
   - 16×16网格分析
   - 768维特征向量

### 防误识别机制
- ✅ **过曝检测**: 平均亮度>200触发警告
- ✅ **自动曝光**: 动态调整-4到+1，目标亮度60-180
- ✅ **时序验证**: 连续2-3次匹配才确认
- ✅ **图像标准化**: 归一化到128亮度

### 性能指标
- 识别准确率：>95%
- 平均识别时间：2-3秒
- 误识别率：<2%
- 代码量：~1084行

---

## 📚 PreTech技术储备详解

### 1️⃣ 舞蹈动作库系统
**文档**: `PreTech/01_DANCE_MOTION_LIBRARY.md`

**核心设计**:
```typescript
interface DanceMotionData {
  song: { title: string; duration: number; audio_file: string };
  video_demo: string;
  difficulty: number;
  fps: 30;
  total_frames: number;
  frames: Array<{
    frame_index: number;
    timestamp: number;
    pose: { /* MediaPipe 13关键点 */ };
  }>;
}
```

**技术要点**:
- 完整舞蹈录制（3分钟 ≈ 5400帧）
- MediaPipe归一化坐标（0-1）
- 13个关键点（鼻子、肩膀、肘、腕、髋、膝、踝）
- JSON存储 ≈ 600KB/首

---

### 2️⃣ 实时动作捕获
**文档**: `PreTech/02_REALTIME_CAPTURE.md`

**双模式设计**:
- **全帧模式**: 30fps完整记录（用于精确分析）
- **关键帧模式**: 仅记录关键动作（节省存储）

**数据结构**:
```typescript
interface CaptureSession {
  session_id: string;
  user_id: string;
  dance_id: string;
  start_time: string;
  duration: number;
  mode: 'full' | 'keyframe';
  frames: Array<{ timestamp, music_time, pose, score }>;
  statistics: { average_score, completion_rate };
}
```

**存储方案**: IndexedDB本地存储

---

### 3️⃣ 儿童骨骼适配
**文档**: `PreTech/03_SKELETON_ADAPTATION.md`

**核心原理**:
```
标准舞蹈（成人/标准身高） 
  ↓ 
身高归一化 
  ↓ 
比例缩放到儿童骨骼 
  ↓ 
公平比对
```

**算法实现**:
```typescript
// 身高缩放比例
scaleRatio = userHeight / standardHeight;

// 骨骼长度归一化
normalizedPose = {
  shoulder_width: shoulder_width / scaleRatio,
  arm_length: arm_length / scaleRatio,
  leg_length: leg_length / scaleRatio
};
```

**适配范围**: 100cm - 180cm

---

### 4️⃣ DTW智能匹配
**文档**: `PreTech/04_DTW_MATCHING.md`

**核心算法**: 动态时间规整（Dynamic Time Warping）

**多维度评分**:
```typescript
interface DTWResult {
  dtw_distance: number;        // 总距离
  alignment_path: [number, number][];  // 最佳对齐路径
  frame_scores: number[];      // 每帧得分
  dimension_scores: {
    position: number;          // 位置得分
    velocity: number;          // 速度得分
    acceleration: number;      // 加速度得分
    rhythm: number;            // 节奏得分
  };
}
```

**特征提取**:
- 速度 = 当前帧 - 前一帧
- 加速度 = 速度变化率
- 节奏 = 动作频率分析

**优势**: 容忍时间延迟和速度差异

---

### 5️⃣ 差异可视化系统
**文档**: `PreTech/05_DIFFERENCE_VISUALIZATION.md`

**可视化方案**:
1. **雷达图** - 6维度综合评分（位置、速度、加速度、节奏、完成度、稳定性）
2. **热力图** - 关键点误差分布（颜色编码：绿→黄→橙→红）
3. **关节误差图** - 3D骨骼展示（误差箭头标注）
4. **时间序列图** - 动作曲线对比

**儿童友好反馈**:
- 😊 太棒了！（>90分）
- 👍 很不错！（80-90分）
- 💪 继续加油！（70-80分）
- 🎯 再练练哦！（<70分）

**家长报告**:
```typescript
interface ParentReport {
  practice_time: number;          // 练习时长
  practice_count: number;         // 练习次数
  score_trend: number[];          // 分数趋势
  strong_points: string[];        // 优势动作
  weak_points: string[];          // 薄弱环节
  improvement_suggestions: string[];  // 改进建议
}
```

---

### 6️⃣ ComfyUI AI视频生成
**文档**: `PreTech/06_COMFYUI_PLUGIN.md`

**核心功能**: 将儿童舞蹈数据转换为AI视频

**技术方案**:
```
儿童舞蹈JSON 
  ↓ 
自定义ComfyUI插件 
  ↓ 
直接渲染骨架图像 
  ↓ 
WanVideoAnimateEmbeds 
  ↓ 
生成AI舞蹈视频
```

**插件设计**:
```python
class DancePoseLoader:
    """一步到位：加载JSON → 渲染骨架 → 输出IMAGE"""
    
    INPUT_TYPES = {
        "json_file": STRING,
        "width": INT,
        "height": INT,
        "start_frame": INT,
        "end_frame": INT,
        "line_thickness": INT,
        "mirror": BOOLEAN
    }
    
    RETURN_TYPES = ("IMAGE", "INT")  # 标准IMAGE格式，兼容性强
```

**核心优势**:
- 单节点设计（~170行代码）
- 直接输出IMAGE类型（无格式对接问题）
- 支持镜像、帧范围选择
- 兼容Wan2.2 Animate工作流

---

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

---

## 🎯 技术成果总结

### ✅ 已完成模块

| 模块 | 状态 | 代码量 | 技术亮点 |
|------|------|---------|---------|
| **卡牌识别系统** | ✅ 已部署 | ~1084行 | 多算法融合、自动曝光、时序验证 |
| **PNG序列帧动画** | ✅ 已部署 | ~200行 | 30fps流畅播放 |
| **视频播放器** | ✅ 已部署 | ~300行 | 手势交互、自定义UI |

### 📋 技术储备模块（待整合）

| 模块 | 文档完成度 | 技术难度 | 预计整合时间 |
|------|-----------|---------|-------------|
| **舞蹈动作库** | 100% | ⭐⭐ | 1周 |
| **实时动作捕获** | 100% | ⭐⭐⭐ | 1-2周 |
| **骨骼适配算法** | 100% | ⭐⭐⭐ | 1周 |
| **DTW智能匹配** | 100% | ⭐⭐⭐⭐ | 2周 |
| **差异可视化** | 100% | ⭐⭐⭐ | 2周 |
| **ComfyUI插件** | 100% | ⭐⭐⭐ | 1-2周 |

**总预计整合时间**: 8-10周

---

## 🗺️ 产品路线图

### Phase 1: 核心功能（已完成）✅
- [x] 卡牌识别系统
- [x] 课程浏览与视频播放
- [x] 用户界面与导航
- [x] PNG序列帧动画

### Phase 2: 舞蹈教学（开发中）📋
- [ ] 标准舞蹈动作库集成
- [ ] 实时动作捕获功能
- [ ] 儿童骨骼适配算法
- [ ] DTW智能匹配引擎
- [ ] 实时反馈与评分系统

### Phase 3: AI增强（规划中）🚀
- [ ] ComfyUI插件开发
- [ ] AI舞蹈视频生成
- [ ] 个性化学习推荐
- [ ] 家长报告系统

### Phase 4: 生态拓展（未来）💡
- [ ] 云端同步
- [ ] 社区分享
- [ ] 多语言支持
- [ ] 更多课程类型

---

## 📊 技术指标

### 当前性能
- **卡牌识别准确率**: >95%
- **识别响应时间**: 2-3秒
- **动画帧率**: 30fps
- **应用包大小**: ~15MB

### 目标性能（舞蹈功能整合后）
- **姿态捕获帧率**: 30fps
- **DTW匹配延迟**: <500ms
- **存储优化**: 关键帧模式节省70%空间
- **离线可用**: 所有核心功能支持离线

---

## 📄 许可证

本项目基于 我自己的Figma 设计稿开发~~
插画，动效，高保真,技术demo都是我自己

**技术文档**: `PreTech/` 文件夹包含完整技术设计文档（共7个模块）

---

Made with ❤️ for kids learning

**技术栈**: React + TypeScript + MediaPipe + OpenCV + ComfyUI  
**项目类型**: 儿童教育 + 计算机视觉 + AI视频生成