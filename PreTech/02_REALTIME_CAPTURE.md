# 实时采集儿童动作 - 技术方案

## 一、技术架构

```
前置摄像头 → MediaPipe实时检测 → 骨架数据流 → 实时比对/存储 → 评分反馈
```

---

## 二、数据存储结构

### 1. 实时采集会话数据

```json
{
  "session_id": "sess_20241130_152530",
  "user_id": "child_123",
  "dance_id": "song_rainbow_dance",
  "start_time": "2024-11-30T15:25:30Z",
  "duration": 180.5,
  "fps": 30,
  "total_frames": 5415,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 0.0,
      "music_time": 0.0,
      "pose": {
        "nose": {"x": 0.51, "y": 0.22, "z": -0.09, "visibility": 0.98},
        "left_shoulder": {"x": 0.38, "y": 0.42, "z": -0.06, "visibility": 0.95},
        "right_shoulder": {"x": 0.62, "y": 0.41, "z": -0.05, "visibility": 0.96},
        "left_elbow": {"x": 0.33, "y": 0.58, "z": -0.09, "visibility": 0.92},
        "right_elbow": {"x": 0.67, "y": 0.59, "z": -0.08, "visibility": 0.94},
        "left_wrist": {"x": 0.28, "y": 0.73, "z": -0.12, "visibility": 0.88},
        "right_wrist": {"x": 0.72, "y": 0.74, "z": -0.11, "visibility": 0.90},
        "left_hip": {"x": 0.44, "y": 0.71, "z": -0.03, "visibility": 0.97},
        "right_hip": {"x": 0.56, "y": 0.72, "z": -0.02, "visibility": 0.98},
        "left_knee": {"x": 0.42, "y": 0.86, "z": -0.06, "visibility": 0.93},
        "right_knee": {"x": 0.58, "y": 0.85, "z": -0.05, "visibility": 0.94},
        "left_ankle": {"x": 0.41, "y": 0.96, "z": -0.09, "visibility": 0.89},
        "right_ankle": {"x": 0.59, "y": 0.95, "z": -0.08, "visibility": 0.91}
      },
      "score": 85.6
    },
    {
      "frame_index": 1,
      "timestamp": 0.033,
      "music_time": 0.033,
      "pose": { /* 下一帧 */ },
      "score": 87.2
    }
    // ... 5415帧数据
  ],
  "statistics": {
    "average_score": 82.4,
    "max_score": 95.8,
    "min_score": 65.2,
    "completion_rate": 98.5,
    "sections": [
      {
        "name": "前奏",
        "start_time": 0.0,
        "end_time": 8.0,
        "average_score": 78.5
      },
      {
        "name": "第一段",
        "start_time": 8.0,
        "end_time": 45.0,
        "average_score": 84.2
      },
      {
        "name": "副歌",
        "start_time": 45.0,
        "end_time": 75.0,
        "average_score": 88.6
      }
    ]
  }
}
```

### 2. 简化存储（关键帧模式）

```json
{
  "session_id": "sess_20241130_152530",
  "user_id": "child_123",
  "dance_id": "song_rainbow_dance",
  "start_time": "2024-11-30T15:25:30Z",
  "duration": 180.5,
  "mode": "keyframe",
  "keyframes": [
    {
      "timestamp": 0.0,
      "music_time": 0.0,
      "pose": { /* 关键点数据 */ },
      "score": 85.6
    },
    {
      "timestamp": 2.5,
      "music_time": 2.5,
      "pose": { /* 关键点数据 */ },
      "score": 88.3
    }
    // 只存储关键帧，减少存储量
  ],
  "statistics": {
    "average_score": 82.4,
    "completion_rate": 98.5
  }
}
```

---

## 三、实时采集逻辑

### 1. MediaPipe初始化

```typescript
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

class RealtimePoseCapture {
  private pose: Pose;
  private camera: Camera;
  private frames: CapturedFrame[] = [];
  private startTime: number = 0;
  
  async init(videoElement: HTMLVideoElement) {
    // 初始化MediaPipe Pose
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    
    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    this.pose.onResults(this.onPoseDetected.bind(this));
    
    // 初始化前置摄像头
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        await this.pose.send({image: videoElement});
      },
      width: 1280,
      height: 720,
      facingMode: 'user' // 前置摄像头
    });
  }
  
  start() {
    this.startTime = Date.now();
    this.frames = [];
    this.camera.start();
  }
  
  stop() {
    this.camera.stop();
    return this.exportData();
  }
}
```

### 2. 实时数据捕获

```typescript
private onPoseDetected(results: any) {
  if (!results.poseLandmarks) return;
  
  const currentTime = (Date.now() - this.startTime) / 1000;
  const musicTime = this.getMusicCurrentTime(); // 从audio元素获取
  
  // 提取关键点
  const pose = this.extractLandmarks(results.poseLandmarks);
  
  // 实时比对（与标准动作）
  const standardFrame = danceLibrary.getFrameAtTime(this.danceId, musicTime);
  const score = this.compareWithStandard(pose, standardFrame?.pose);
  
  // 存储当前帧
  this.frames.push({
    frame_index: this.frames.length,
    timestamp: currentTime,
    music_time: musicTime,
    pose: pose,
    score: score
  });
  
  // 实时反馈给UI
  this.onScoreUpdate?.(score);
}

private extractLandmarks(landmarks: any[]) {
  return {
    nose: {
      x: landmarks[0].x,
      y: landmarks[0].y,
      z: landmarks[0].z,
      visibility: landmarks[0].visibility
    },
    left_shoulder: {
      x: landmarks[11].x,
      y: landmarks[11].y,
      z: landmarks[11].z,
      visibility: landmarks[11].visibility
    },
    right_shoulder: {
      x: landmarks[12].x,
      y: landmarks[12].y,
      z: landmarks[12].z,
      visibility: landmarks[12].visibility
    },
    // ... 其他关键点
  };
}
```

### 3. 数据导出

```typescript
private exportData(): SessionData {
  // 计算统计信息
  const scores = this.frames.map(f => f.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  return {
    session_id: `sess_${Date.now()}`,
    user_id: this.userId,
    dance_id: this.danceId,
    start_time: new Date(this.startTime).toISOString(),
    duration: (Date.now() - this.startTime) / 1000,
    fps: 30,
    total_frames: this.frames.length,
    frames: this.frames,
    statistics: {
      average_score: avgScore,
      max_score: maxScore,
      min_score: minScore,
      completion_rate: this.calculateCompletionRate()
    }
  };
}
```

---

## 四、存储方案

### 1. 本地存储（IndexedDB）

```typescript
class SessionStorage {
  private db: IDBDatabase;
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DanceSessionDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        
        // 创建会话存储表
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', {
            keyPath: 'session_id'
          });
          store.createIndex('user_id', 'user_id', { unique: false });
          store.createIndex('dance_id', 'dance_id', { unique: false });
          store.createIndex('start_time', 'start_time', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as any).result;
        resolve(this.db);
      };
      
      request.onerror = reject;
    });
  }
  
  async saveSession(sessionData: SessionData) {
    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    await store.add(sessionData);
  }
  
  async getSessionsByUser(userId: string) {
    const transaction = this.db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const index = store.index('user_id');
    return await index.getAll(userId);
  }
}
```

### 2. 云端存储（可选）

```typescript
async uploadToCloud(sessionData: SessionData) {
  // 上传到服务器
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData)
  });
  
  return response.json();
}
```

### 3. 关键帧模式（节省空间）

```typescript
private exportKeyframes(): SessionData {
  const keyframes = [];
  let lastPose = null;
  const threshold = 0.05; // 姿态变化阈值
  
  for (const frame of this.frames) {
    if (!lastPose || this.poseDifference(frame.pose, lastPose) > threshold) {
      keyframes.push(frame);
      lastPose = frame.pose;
    }
  }
  
  return {
    ...this.exportData(),
    mode: 'keyframe',
    keyframes: keyframes,
    frames: undefined // 不存储完整帧
  };
}
```

---

## 五、目录结构

```
src/
├── utils/
│   ├── RealtimePoseCapture.ts      # 实时采集类
│   ├── SessionStorage.ts           # IndexedDB存储
│   └── PoseComparison.ts           # 姿态比对算法
│
└── components/
    └── DancePracticePage.tsx       # 练习页面组件

public/
└── sessions/                       # 可选：导出的会话数据
    ├── sess_20241130_152530.json
    └── sess_20241130_163045.json
```

---

## 六、核心要点

1. **实时检测**: MediaPipe Pose前置摄像头，30fps
2. **同步音乐**: 通过audio元素的currentTime同步
3. **实时比对**: 每帧与标准动作比对，即时反馈得分
4. **存储方式**: 
   - 完整模式：所有帧 (500KB-1MB/3分钟)
   - 关键帧模式：仅关键帧 (50-100KB/3分钟)
5. **本地存储**: IndexedDB，支持离线
6. **可视化反馈**: 实时骨架叠加 + 分数显示

---

**数据量估算**:
- 完整模式(3分钟): ~5400帧 × 13关键点 × 4字节 ≈ 280KB + 元数据 ≈ 500KB
- 关键帧模式: ~500帧 × 13关键点 × 4字节 ≈ 26KB + 元数据 ≈ 50KB
