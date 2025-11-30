# DTW时序匹配算法 - 技术方案

## 一、技术架构

```
标准动作序列 + 儿童动作序列 → DTW算法 → 最优路径 → 综合评分
    ↓                                              ↓
位置+速度+加速度                        位置相似度 + 运动相似度
```

---

## 二、核心原理

### DTW算法优势

1. **时间轴自适应** - 允许速度不同（儿童动作慢也能识别）
2. **序列整体匹配** - 不是单帧比对，而是整段动作比对
3. **运动轨迹分析** - 不仅看位置，还看移动路径
4. **容错性强** - 允许局部时间延迟和提前

### 问题场景

```
标准动作: [帧1] [帧2] [帧3] [帧4] [帧5]
儿童动作: [帧1] [帧1] [帧2] [帧3] [帧4] [帧4] [帧5]
          ↑速度慢，某些动作停留更久
          
DTW可以自动对齐：
标准: 1 -- 2 -- 3 -- 4 -- 5
       ↓    ↓    ↓    ↓    ↓
儿童: 1-1  2    3    4-4  5
```

---

## 三、数据结构

### 1. 动作序列

```typescript
interface MotionSequence {
  frames: MotionFrame[];
  duration: number;
  fps: number;
}

interface MotionFrame {
  timestamp: number;
  pose: PoseLandmarks;
  
  // 运动特征
  velocity: MotionVelocity;      // 速度
  acceleration: MotionAccel;     // 加速度
  angles: JointAngles;           // 关节角度
}

interface MotionVelocity {
  // 各关键点的速度向量
  left_wrist: { vx: number, vy: number, vz: number },
  right_wrist: { vx: number, vy: number, vz: number },
  left_knee: { vx: number, vy: number, vz: number },
  right_knee: { vx: number, vy: number, vz: number },
  // ... 其他关键点
}

interface MotionAccel {
  // 各关键点的加速度向量
  left_wrist: { ax: number, ay: number, az: number },
  right_wrist: { ax: number, ay: number, az: number },
  // ...
}
```

### 2. DTW代价矩阵

```typescript
interface DTWResult {
  distance: number;              // DTW距离
  normalizedDistance: number;    // 归一化距离
  similarity: number;            // 相似度分数 (0-100)
  alignmentPath: [number, number][]; // 最优对齐路径
  
  // 详细评分
  scores: {
    position: number;            // 位置得分
    velocity: number;            // 速度得分
    acceleration: number;        // 加速度得分
    rhythm: number;              // 节奏得分
  };
}
```

---

## 四、运动特征提取

### 1. 速度计算

```typescript
class MotionAnalyzer {
  // 计算速度（当前帧与前一帧的位置差）
  calculateVelocity(
    currentFrame: MotionFrame,
    previousFrame: MotionFrame
  ): MotionVelocity {
    const dt = currentFrame.timestamp - previousFrame.timestamp;
    
    const velocity: MotionVelocity = {};
    
    const keyPoints = [
      'left_wrist', 'right_wrist',
      'left_elbow', 'right_elbow',
      'left_knee', 'right_knee',
      'left_ankle', 'right_ankle'
    ];
    
    for (const point of keyPoints) {
      const curr = currentFrame.pose[point];
      const prev = previousFrame.pose[point];
      
      velocity[point] = {
        vx: (curr.x - prev.x) / dt,
        vy: (curr.y - prev.y) / dt,
        vz: (curr.z - prev.z) / dt
      };
    }
    
    return velocity;
  }
}
```

### 2. 加速度计算

```typescript
calculateAcceleration(
  currentVelocity: MotionVelocity,
  previousVelocity: MotionVelocity,
  dt: number
): MotionAccel {
  const acceleration: MotionAccel = {};
  
  for (const point of Object.keys(currentVelocity)) {
    const currV = currentVelocity[point];
    const prevV = previousVelocity[point];
    
    acceleration[point] = {
      ax: (currV.vx - prevV.vx) / dt,
      ay: (currV.vy - prevV.vy) / dt,
      az: (currV.vz - prevV.vz) / dt
    };
  }
  
  return acceleration;
}
```

### 3. 预处理序列

```typescript
preprocessSequence(rawFrames: MotionFrame[]): MotionSequence {
  const processedFrames = [rawFrames[0]]; // 第一帧无速度
  
  for (let i = 1; i < rawFrames.length; i++) {
    const frame = rawFrames[i];
    
    // 计算速度
    frame.velocity = this.calculateVelocity(
      frame,
      rawFrames[i - 1]
    );
    
    // 计算加速度
    if (i >= 2) {
      frame.acceleration = this.calculateAcceleration(
        frame.velocity,
        rawFrames[i - 1].velocity,
        frame.timestamp - rawFrames[i - 1].timestamp
      );
    }
    
    processedFrames.push(frame);
  }
  
  return {
    frames: processedFrames,
    duration: rawFrames[rawFrames.length - 1].timestamp,
    fps: rawFrames.length / (rawFrames[rawFrames.length - 1].timestamp)
  };
}
```

---

## 五、DTW算法实现

### 1. 帧间距离计算

```typescript
class DTWMatcher {
  // 计算两帧之间的综合距离
  private frameDistance(
    frame1: MotionFrame,
    frame2: MotionFrame,
    weights: DistanceWeights = {
      position: 0.4,
      velocity: 0.35,
      acceleration: 0.25
    }
  ): number {
    // 1. 位置距离
    const positionDist = this.positionDistance(frame1.pose, frame2.pose);
    
    // 2. 速度距离
    const velocityDist = this.velocityDistance(frame1.velocity, frame2.velocity);
    
    // 3. 加速度距离
    const accelDist = this.accelerationDistance(
      frame1.acceleration,
      frame2.acceleration
    );
    
    // 加权求和
    return (
      weights.position * positionDist +
      weights.velocity * velocityDist +
      weights.acceleration * accelDist
    );
  }
  
  // 位置距离（欧式距离）
  private positionDistance(pose1: PoseLandmarks, pose2: PoseLandmarks): number {
    let totalDist = 0;
    let validPoints = 0;
    
    const keyPoints = [
      'left_shoulder', 'right_shoulder',
      'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist',
      'left_hip', 'right_hip',
      'left_knee', 'right_knee',
      'left_ankle', 'right_ankle'
    ];
    
    for (const point of keyPoints) {
      if (pose1[point].visibility > 0.5 && pose2[point].visibility > 0.5) {
        const dist = Math.sqrt(
          Math.pow(pose1[point].x - pose2[point].x, 2) +
          Math.pow(pose1[point].y - pose2[point].y, 2) +
          Math.pow(pose1[point].z - pose2[point].z, 2)
        );
        totalDist += dist;
        validPoints++;
      }
    }
    
    return totalDist / validPoints;
  }
  
  // 速度距离
  private velocityDistance(v1: MotionVelocity, v2: MotionVelocity): number {
    let totalDist = 0;
    let count = 0;
    
    for (const point of Object.keys(v1)) {
      const dist = Math.sqrt(
        Math.pow(v1[point].vx - v2[point].vx, 2) +
        Math.pow(v1[point].vy - v2[point].vy, 2) +
        Math.pow(v1[point].vz - v2[point].vz, 2)
      );
      totalDist += dist;
      count++;
    }
    
    return totalDist / count;
  }
  
  // 加速度距离
  private accelerationDistance(a1: MotionAccel, a2: MotionAccel): number {
    let totalDist = 0;
    let count = 0;
    
    for (const point of Object.keys(a1)) {
      const dist = Math.sqrt(
        Math.pow(a1[point].ax - a2[point].ax, 2) +
        Math.pow(a1[point].ay - a2[point].ay, 2) +
        Math.pow(a1[point].az - a2[point].az, 2)
      );
      totalDist += dist;
      count++;
    }
    
    return totalDist / count;
  }
}
```

### 2. DTW主算法

```typescript
computeDTW(
  standardSeq: MotionSequence,
  childSeq: MotionSequence
): DTWResult {
  const n = standardSeq.frames.length;
  const m = childSeq.frames.length;
  
  // 初始化DTW代价矩阵
  const dtw: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(Infinity));
  
  dtw[0][0] = 0;
  
  // 动态规划填充矩阵
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = this.frameDistance(
        standardSeq.frames[i - 1],
        childSeq.frames[j - 1]
      );
      
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],      // 插入
        dtw[i][j - 1],      // 删除
        dtw[i - 1][j - 1]   // 匹配
      );
    }
  }
  
  // 回溯最优路径
  const path = this.backtrack(dtw, n, m);
  
  // 归一化距离
  const rawDistance = dtw[n][m];
  const normalizedDistance = rawDistance / path.length;
  
  // 转换为相似度分数 (0-100)
  const similarity = this.distanceToScore(normalizedDistance);
  
  // 详细评分
  const detailedScores = this.calculateDetailedScores(
    standardSeq,
    childSeq,
    path
  );
  
  return {
    distance: rawDistance,
    normalizedDistance,
    similarity,
    alignmentPath: path,
    scores: detailedScores
  };
}

// 回溯最优路径
private backtrack(dtw: number[][], n: number, m: number): [number, number][] {
  const path: [number, number][] = [];
  let i = n, j = m;
  
  while (i > 0 && j > 0) {
    path.unshift([i - 1, j - 1]);
    
    // 选择最小的前驱
    const options = [
      { i: i - 1, j: j - 1, cost: dtw[i - 1][j - 1] },
      { i: i - 1, j: j, cost: dtw[i - 1][j] },
      { i: i, j: j - 1, cost: dtw[i][j - 1] }
    ];
    
    const min = options.reduce((prev, curr) =>
      curr.cost < prev.cost ? curr : prev
    );
    
    i = min.i;
    j = min.j;
  }
  
  return path;
}
```

### 3. 详细评分

```typescript
private calculateDetailedScores(
  standardSeq: MotionSequence,
  childSeq: MotionSequence,
  path: [number, number][]
): DetailedScores {
  let positionSum = 0;
  let velocitySum = 0;
  let accelSum = 0;
  
  for (const [i, j] of path) {
    const std = standardSeq.frames[i];
    const child = childSeq.frames[j];
    
    positionSum += this.positionDistance(std.pose, child.pose);
    velocitySum += this.velocityDistance(std.velocity, child.velocity);
    accelSum += this.accelerationDistance(std.acceleration, child.acceleration);
  }
  
  const count = path.length;
  
  return {
    position: this.distanceToScore(positionSum / count),
    velocity: this.distanceToScore(velocitySum / count),
    acceleration: this.distanceToScore(accelSum / count),
    rhythm: this.calculateRhythmScore(standardSeq, childSeq, path)
  };
}

// 节奏得分（时间对齐质量）
private calculateRhythmScore(
  standardSeq: MotionSequence,
  childSeq: MotionSequence,
  path: [number, number][]
): number {
  // 理想情况：路径应该是对角线（时间完美同步）
  // 实际情况：路径会偏离对角线
  
  let rhythmError = 0;
  
  for (const [i, j] of path) {
    const standardTime = standardSeq.frames[i].timestamp;
    const childTime = childSeq.frames[j].timestamp;
    
    // 标准化时间
    const stdNormTime = standardTime / standardSeq.duration;
    const childNormTime = childTime / childSeq.duration;
    
    // 计算时间偏差
    rhythmError += Math.abs(stdNormTime - childNormTime);
  }
  
  const avgError = rhythmError / path.length;
  
  // 转换为得分
  return Math.max(0, 100 - avgError * 200);
}

// 距离转分数
private distanceToScore(distance: number): number {
  // 距离越小，分数越高
  // 经验公式：score = 100 * exp(-k * distance)
  const k = 5; // 调节参数
  return Math.max(0, Math.min(100, 100 * Math.exp(-k * distance)));
}
```

---

## 六、分段评分

### 按音乐章节评分

```typescript
interface SectionScore {
  section_name: string;
  start_time: number;
  end_time: number;
  score: number;
  details: DetailedScores;
}

function evaluateSections(
  standardSeq: MotionSequence,
  childSeq: MotionSequence,
  sections: Section[]
): SectionScore[] {
  const results: SectionScore[] = [];
  
  for (const section of sections) {
    // 提取该段的帧
    const stdFrames = standardSeq.frames.filter(f =>
      f.timestamp >= section.start_time &&
      f.timestamp <= section.end_time
    );
    
    const childFrames = childSeq.frames.filter(f =>
      f.timestamp >= section.start_time &&
      f.timestamp <= section.end_time
    );
    
    // DTW匹配
    const matcher = new DTWMatcher();
    const result = matcher.computeDTW(
      { frames: stdFrames, duration: section.end_time - section.start_time, fps: 30 },
      { frames: childFrames, duration: section.end_time - section.start_time, fps: 30 }
    );
    
    results.push({
      section_name: section.name,
      start_time: section.start_time,
      end_time: section.end_time,
      score: result.similarity,
      details: result.scores
    });
  }
  
  return results;
}
```

---

## 七、实时评分（滑动窗口）

### 实时DTW

```typescript
class RealtimeDTWEvaluator {
  private windowSize: number = 90; // 3秒窗口（30fps × 3）
  private recentFrames: MotionFrame[] = [];
  
  addFrame(frame: MotionFrame, musicTime: number) {
    this.recentFrames.push(frame);
    
    // 保持窗口大小
    if (this.recentFrames.length > this.windowSize) {
      this.recentFrames.shift();
    }
    
    // 获取标准动作对应窗口
    const standardWindow = this.getStandardWindow(
      musicTime - 3,
      musicTime
    );
    
    // 计算DTW
    if (this.recentFrames.length >= 30) { // 至少1秒数据
      const matcher = new DTWMatcher();
      const result = matcher.computeDTW(
        { frames: standardWindow, duration: 3, fps: 30 },
        { frames: this.recentFrames, duration: 3, fps: 30 }
      );
      
      return result.similarity;
    }
    
    return null;
  }
  
  private getStandardWindow(startTime: number, endTime: number): MotionFrame[] {
    // 从标准动作库中提取对应时间窗口的帧
    // ...
  }
}
```

---

## 八、使用示例

### 完整评估流程

```typescript
async function evaluateDancePerformance(
  standardDanceId: string,
  childSessionId: string
): Promise<PerformanceReport> {
  // 1. 加载数据
  const standardSeq = await loadStandardDance(standardDanceId);
  const childSeq = await loadChildSession(childSessionId);
  
  // 2. 预处理（计算速度、加速度）
  const analyzer = new MotionAnalyzer();
  const processedStandard = analyzer.preprocessSequence(standardSeq.frames);
  const processedChild = analyzer.preprocessSequence(childSeq.frames);
  
  // 3. 身高适配
  const childHeight = await getChildHeight();
  const adapter = new SkeletonAdapter();
  const adaptedStandard = adapter.normalizeStandardPose(
    processedStandard,
    childHeight / 170
  );
  
  // 4. DTW匹配
  const matcher = new DTWMatcher();
  const result = matcher.computeDTW(adaptedStandard, processedChild);
  
  // 5. 分段评分
  const sectionScores = evaluateSections(
    adaptedStandard,
    processedChild,
    standardSeq.sections
  );
  
  // 6. 生成报告
  return {
    overall_score: result.similarity,
    position_score: result.scores.position,
    velocity_score: result.scores.velocity,
    acceleration_score: result.scores.acceleration,
    rhythm_score: result.scores.rhythm,
    section_scores: sectionScores,
    suggestions: generateSuggestions(result)
  };
}
```

---

## 九、评分标准

### 综合得分公式

```typescript
const FINAL_SCORE = 
  0.3 × position_score +      // 位置准确度 30%
  0.25 × velocity_score +     // 速度匹配度 25%
  0.2 × acceleration_score +  // 加速度匹配度 20%
  0.25 × rhythm_score;        // 节奏准确度 25%
```

### 等级划分

```
95-100分: ⭐⭐⭐⭐⭐ 完美
85-94分:  ⭐⭐⭐⭐   优秀
75-84分:  ⭐⭐⭐     良好
60-74分:  ⭐⭐       及格
<60分:    ⭐         需加强
```

---

## 十、核心要点

1. **DTW优势**: 自动时间对齐，允许速度差异
2. **多维度评估**: 
   - 位置（是否到位）
   - 速度（动作快慢）
   - 加速度（力度控制）
   - 节奏（时间把握）
3. **滑动窗口**: 实时评分使用3秒窗口
4. **分段评分**: 可分析每个章节表现
5. **权重配置**: 可根据舞蹈类型调整权重

---

**计算复杂度**: O(N×M)，N和M为序列长度
**优化方案**: 使用FastDTW算法，复杂度降至O(N)
