# 标准舞蹈动作库 - 技术方案

## 一、技术架构

```
完整歌曲舞蹈录制 → MediaPipe提取骨架序列 → JSON存储 → React加载 → 实时比对评分
```

---

## 二、数据存储结构

### 1. 完整舞蹈数据格式

```json
{
  "id": "song_rainbow_dance",
  "name": "彩虹舞",
  "song": {
    "title": "Rainbow Song",
    "duration": 180.5,
    "audio_file": "/audio/rainbow_song.mp3"
  },
  "video_demo": "/demos/rainbow_dance.mp4",
  "difficulty": 2,
  "fps": 30,
  "total_frames": 5415,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 0.0,
      "pose": {
        "nose": {"x": 0.5, "y": 0.2, "z": -0.1},
        "left_shoulder": {"x": 0.4, "y": 0.4, "z": -0.05},
        "right_shoulder": {"x": 0.6, "y": 0.4, "z": -0.05},
        "left_elbow": {"x": 0.35, "y": 0.6, "z": -0.08},
        "right_elbow": {"x": 0.65, "y": 0.6, "z": -0.08},
        "left_wrist": {"x": 0.3, "y": 0.75, "z": -0.1},
        "right_wrist": {"x": 0.7, "y": 0.75, "z": -0.1},
        "left_hip": {"x": 0.45, "y": 0.7, "z": -0.02},
        "right_hip": {"x": 0.55, "y": 0.7, "z": -0.02},
        "left_knee": {"x": 0.43, "y": 0.85, "z": -0.05},
        "right_knee": {"x": 0.57, "y": 0.85, "z": -0.05},
        "left_ankle": {"x": 0.42, "y": 0.95, "z": -0.08},
        "right_ankle": {"x": 0.58, "y": 0.95, "z": -0.08}
      }
    },
    {
      "frame_index": 1,
      "timestamp": 0.033,
      "pose": { /* 下一帧数据 */ }
    }
    // ... 5415帧数据
  ],
  "sections": [
    {
      "name": "前奏",
      "start_time": 0.0,
      "end_time": 8.0,
      "start_frame": 0,
      "end_frame": 240
    },
    {
      "name": "第一段",
      "start_time": 8.0,
      "end_time": 45.0,
      "start_frame": 240,
      "end_frame": 1350
    },
    {
      "name": "副歌",
      "start_time": 45.0,
      "end_time": 75.0,
      "start_frame": 1350,
      "end_frame": 2250
    }
  ]
}
```

### 2. 舞蹈库索引文件

```json
{
  "library": [
    {
      "id": "song_rainbow_dance",
      "name": "彩虹舞",
      "song_title": "Rainbow Song",
      "duration": 180.5,
      "difficulty": 2,
      "age_range": "6-8岁",
      "data_file": "/dance_library/rainbow_dance.json",
      "audio_file": "/audio/rainbow_song.mp3",
      "thumbnail": "/thumbnails/rainbow_dance.jpg",
      "tags": ["欢快", "全身", "协调性"]
    },
    {
      "id": "song_happy_star",
      "name": "快乐小星星",
      "song_title": "Twinkle Star",
      "duration": 120.0,
      "difficulty": 1,
      "age_range": "3-5岁",
      "data_file": "/dance_library/happy_star.json",
      "audio_file": "/audio/happy_star.mp3",
      "thumbnail": "/thumbnails/happy_star.jpg",
      "tags": ["简单", "儿歌", "手部"]
    }
  ]
}
```

---

## 三、录制与提取流程

### 录制标准
```yaml
环境: 纯色背景，均匀光线
设备: 手机/相机 1080p, 30fps
时长: 2-5秒完整动作
格式: MP4
```

### 骨架提取（浏览器端）
```typescript
// 使用MediaPipe Pose (JavaScript版本)
import { Pose } from '@mediapipe/pose';

async function extractPoseFromVideo(videoElement: HTMLVideoElement) {
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });
  
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  const frames = [];
  
  pose.onResults((results) => {
    if (results.poseLandmarks) {
      frames.push({
        timestamp: videoElement.currentTime,
        pose: convertLandmarks(results.poseLandmarks),
        angles: calculateAngles(results.poseLandmarks)
      });
    }
  });
  
  // 逐帧提取
  await pose.send({image: videoElement});
  
  return {
    id: 'custom_move',
    fps: 30,
    frames: frames
  };
}
```

---

## 四、调用逻辑

### 加载舞蹈库
```typescript
class DanceLibrary {
  private dances: Map<string, Dance> = new Map();
  
  async load() {
    const index = await fetch('/dance_library/index.json').then(r => r.json());
    
    for (const dance of index.library) {
      const data = await fetch(dance.data_file).then(r => r.json());
      this.dances.set(dance.id, data);
    }
  }
  
  get(danceId: string) {
    return this.dances.get(danceId);
  }
  
  // 根据音乐时间获取对应帧
  getFrameAtTime(danceId: string, timestamp: number) {
    const dance = this.dances.get(danceId);
    if (!dance) return null;
    
    const frameIndex = Math.floor(timestamp * dance.fps);
    return dance.frames[frameIndex];
  }
}
```

### 实时比对（同步音乐）
```typescript
function compareWithStandard(
  userPose: Landmarks, 
  standardPose: Landmarks
): number {
  let totalDiff = 0;
  const keyPoints = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow'];
  
  for (const point of keyPoints) {
    const user = userPose[point];
    const standard = standardPose[point];
    
    const diff = Math.sqrt(
      Math.pow(user.x - standard.x, 2) +
      Math.pow(user.y - standard.y, 2)
    );
    
    totalDiff += diff;
  }
  
  // 转换为得分 (0-100)
  return Math.max(0, 100 - totalDiff * 200);
}

// 使用示例
const audioElement = document.getElementById('dance-music');
const currentTime = audioElement.currentTime; // 当前播放时间
const standardFrame = library.getFrameAtTime('song_rainbow_dance', currentTime);
const userPose = getCurrentUserPose(); // 从MediaPipe获取
const score = compareWithStandard(userPose, standardFrame.pose);
```

---

## 五、目录结构

```
public/
├── dance_library/
│   ├── index.json                    # 舞蹈库索引
│   ├── rainbow_dance.json            # 彩虹舞完整数据
│   └── happy_star.json               # 快乐小星星完整数据
│
├── audio/
│   ├── rainbow_song.mp3              # 配套音乐
│   └── happy_star.mp3
│
├── demos/
│   ├── rainbow_dance.mp4             # 演示视频（带骨架）
│   └── happy_star.mp4
│
└── thumbnails/
    ├── rainbow_dance.jpg             # 缩略图
    └── happy_star.jpg

src/
└── utils/
    ├── DanceLibrary.ts               # 舞蹈库管理类
    └── PoseComparison.ts             # 实时姿态比对
```

---

## 六、核心要点

1. **数据格式**: JSON，包含完整歌曲的所有帧骨架数据
2. **提取工具**: MediaPipe Pose (JavaScript版本)
3. **存储方式**: 每首歌独立JSON文件，包含分段信息
4. **调用接口**: DanceLibrary类加载完整舞蹈，按时间戳比对
5. **比对算法**: 根据音乐播放时间，实时比对当前帧的姿态相似度

---

**文件大小估算**: 
- 3分钟歌曲(30fps) ≈ 5400帧 ≈ 500KB-1MB
- 包含分段信息，支持按章节练习
