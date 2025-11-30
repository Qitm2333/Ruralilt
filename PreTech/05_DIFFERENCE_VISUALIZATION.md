# 差异分析与可视化 - 技术方案

## 一、技术架构

```
DTW评估结果 → 差异提取 → 多维度分析 → 可视化呈现 → 改进建议
    ↓
位置/速度/加速度/节奏
```

---

## 二、差异数据结构

### 1. 差异分析结果

```json
{
  "session_id": "sess_20241130_152530",
  "overall_score": 82.4,
  "analysis": {
    "position_diff": {
      "score": 85.2,
      "problem_points": [
        {
          "joint": "left_wrist",
          "avg_distance": 0.08,
          "severity": "medium",
          "description": "左手抬起高度不够"
        },
        {
          "joint": "right_knee",
          "avg_distance": 0.12,
          "severity": "high",
          "description": "右膝弯曲角度过大"
        }
      ]
    },
    "velocity_diff": {
      "score": 78.5,
      "problem_motions": [
        {
          "joint": "right_wrist",
          "section": "副歌 (45s-75s)",
          "expected_speed": 1.2,
          "actual_speed": 0.85,
          "ratio": 0.71,
          "description": "挥手动作过慢"
        },
        {
          "joint": "left_ankle",
          "section": "第一段 (8s-45s)",
          "expected_speed": 0.8,
          "actual_speed": 1.3,
          "ratio": 1.62,
          "description": "跳跃动作过快"
        }
      ]
    },
    "acceleration_diff": {
      "score": 80.3,
      "problem_forces": [
        {
          "joint": "right_elbow",
          "section": "副歌 (45s-75s)",
          "expected_force": 2.5,
          "actual_force": 1.6,
          "ratio": 0.64,
          "description": "手臂发力不足"
        }
      ]
    },
    "rhythm_diff": {
      "score": 85.0,
      "timing_issues": [
        {
          "section": "第一段",
          "expected_duration": 37.0,
          "actual_duration": 42.5,
          "delay": 5.5,
          "description": "节奏偏慢"
        }
      ]
    }
  },
  "timeline_analysis": [
    {
      "timestamp": 12.5,
      "score": 65.3,
      "issue": "转身动作不完整",
      "joints_affected": ["left_shoulder", "right_shoulder"]
    },
    {
      "timestamp": 28.8,
      "score": 92.5,
      "highlight": "跳跃动作标准"
    }
  ],
  "suggestions": [
    {
      "priority": "high",
      "category": "velocity",
      "message": "挥手动作可以再快一点，跟上音乐节奏",
      "target_joints": ["right_wrist", "left_wrist"]
    },
    {
      "priority": "medium",
      "category": "position",
      "message": "左手抬起时尽量高举过头",
      "target_joints": ["left_wrist"]
    }
  ]
}
```

---

## 三、差异分析算法

### 1. 位置差异分析

```typescript
class PositionAnalyzer {
  analyzePositionDifference(
    standardSeq: MotionSequence,
    childSeq: MotionSequence,
    alignmentPath: [number, number][]
  ): PositionDiff {
    const jointErrors: Map<string, number[]> = new Map();
    
    const keyJoints = [
      'left_wrist', 'right_wrist',
      'left_elbow', 'right_elbow',
      'left_knee', 'right_knee',
      'left_ankle', 'right_ankle'
    ];
    
    // 初始化
    keyJoints.forEach(joint => jointErrors.set(joint, []));
    
    // 沿着DTW对齐路径计算每个关节的偏差
    for (const [stdIdx, childIdx] of alignmentPath) {
      const stdPose = standardSeq.frames[stdIdx].pose;
      const childPose = childSeq.frames[childIdx].pose;
      
      for (const joint of keyJoints) {
        const distance = this.calculateDistance(
          stdPose[joint],
          childPose[joint]
        );
        jointErrors.get(joint)!.push(distance);
      }
    }
    
    // 找出问题关节
    const problemPoints = [];
    
    for (const [joint, errors] of jointErrors) {
      const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
      const maxError = Math.max(...errors);
      
      if (avgError > 0.05) { // 阈值：5%画面
        problemPoints.push({
          joint,
          avg_distance: avgError,
          max_distance: maxError,
          severity: this.getSeverity(avgError),
          description: this.getPositionDescription(joint, avgError)
        });
      }
    }
    
    // 按严重程度排序
    problemPoints.sort((a, b) => b.avg_distance - a.avg_distance);
    
    return {
      score: this.calculatePositionScore(jointErrors),
      problem_points: problemPoints
    };
  }
  
  private getSeverity(distance: number): 'low' | 'medium' | 'high' {
    if (distance > 0.15) return 'high';
    if (distance > 0.08) return 'medium';
    return 'low';
  }
  
  private getPositionDescription(joint: string, distance: number): string {
    const jointNames = {
      'left_wrist': '左手',
      'right_wrist': '右手',
      'left_elbow': '左肘',
      'right_elbow': '右肘',
      'left_knee': '左膝',
      'right_knee': '右膝',
      'left_ankle': '左脚',
      'right_ankle': '右脚'
    };
    
    const name = jointNames[joint];
    
    if (distance > 0.15) {
      return `${name}位置偏差较大，请注意调整`;
    } else if (distance > 0.08) {
      return `${name}位置略有偏差`;
    }
    return `${name}位置基本准确`;
  }
}
```

### 2. 速度差异分析

```typescript
class VelocityAnalyzer {
  analyzeVelocityDifference(
    standardSeq: MotionSequence,
    childSeq: MotionSequence,
    alignmentPath: [number, number][]
  ): VelocityDiff {
    const problemMotions = [];
    
    // 按时间段分析
    const sections = this.divideIntoSections(alignmentPath, 3.0); // 3秒一段
    
    for (const section of sections) {
      const velocityComparison = this.compareVelocityInSection(
        standardSeq,
        childSeq,
        section
      );
      
      // 找出速度偏差大的关节
      for (const [joint, comparison] of Object.entries(velocityComparison)) {
        const ratio = comparison.actual / comparison.expected;
        
        if (ratio < 0.7 || ratio > 1.3) { // 偏差超过30%
          problemMotions.push({
            joint,
            section: section.name,
            expected_speed: comparison.expected,
            actual_speed: comparison.actual,
            ratio,
            description: this.getVelocityDescription(joint, ratio)
          });
        }
      }
    }
    
    return {
      score: this.calculateVelocityScore(problemMotions),
      problem_motions: problemMotions
    };
  }
  
  private getVelocityDescription(joint: string, ratio: number): string {
    const jointNames = {
      'left_wrist': '左手',
      'right_wrist': '右手',
      'left_knee': '左腿',
      'right_knee': '右腿'
    };
    
    const name = jointNames[joint] || joint;
    
    if (ratio < 0.5) {
      return `${name}动作明显过慢，需要加快速度`;
    } else if (ratio < 0.7) {
      return `${name}动作稍慢，可以再快一点`;
    } else if (ratio > 1.5) {
      return `${name}动作明显过快，需要放慢节奏`;
    } else if (ratio > 1.3) {
      return `${name}动作稍快，注意控制速度`;
    }
    return `${name}速度适中`;
  }
}
```

### 3. 加速度差异分析（力度分析）

```typescript
class AccelerationAnalyzer {
  analyzeAccelerationDifference(
    standardSeq: MotionSequence,
    childSeq: MotionSequence,
    alignmentPath: [number, number][]
  ): AccelerationDiff {
    const problemForces = [];
    
    // 检测关键发力点
    const forcePoints = this.detectForcePoints(standardSeq);
    
    for (const forcePoint of forcePoints) {
      const comparison = this.compareForceAtPoint(
        standardSeq,
        childSeq,
        forcePoint,
        alignmentPath
      );
      
      const ratio = comparison.actual / comparison.expected;
      
      if (ratio < 0.7 || ratio > 1.3) {
        problemForces.push({
          joint: forcePoint.joint,
          section: forcePoint.section,
          expected_force: comparison.expected,
          actual_force: comparison.actual,
          ratio,
          description: this.getForceDescription(forcePoint.joint, ratio)
        });
      }
    }
    
    return {
      score: this.calculateAccelerationScore(problemForces),
      problem_forces: problemForces
    };
  }
  
  private getForceDescription(joint: string, ratio: number): string {
    const jointNames = {
      'left_wrist': '左手',
      'right_wrist': '右手',
      'left_knee': '左腿',
      'right_knee': '右腿'
    };
    
    const name = jointNames[joint] || joint;
    
    if (ratio < 0.5) {
      return `${name}发力明显不足，动作要更有力`;
    } else if (ratio < 0.7) {
      return `${name}发力稍弱，可以再用力一点`;
    } else if (ratio > 1.5) {
      return `${name}发力过猛，注意控制力度`;
    } else if (ratio > 1.3) {
      return `${name}发力稍强，适当放松`;
    }
    return `${name}力度适中`;
  }
  
  // 检测标准动作中的关键发力点
  private detectForcePoints(seq: MotionSequence): ForcePoint[] {
    const forcePoints = [];
    
    for (let i = 2; i < seq.frames.length - 2; i++) {
      const frame = seq.frames[i];
      
      // 检测加速度峰值
      for (const [joint, accel] of Object.entries(frame.acceleration)) {
        const magnitude = Math.sqrt(
          accel.ax ** 2 + accel.ay ** 2 + accel.az ** 2
        );
        
        if (magnitude > 5.0) { // 阈值
          forcePoints.push({
            timestamp: frame.timestamp,
            joint,
            magnitude,
            section: this.getSection(frame.timestamp)
          });
        }
      }
    }
    
    return forcePoints;
  }
}
```

### 4. 节奏差异分析

```typescript
class RhythmAnalyzer {
  analyzeRhythmDifference(
    standardSeq: MotionSequence,
    childSeq: MotionSequence,
    sections: Section[]
  ): RhythmDiff {
    const timingIssues = [];
    
    for (const section of sections) {
      const stdDuration = section.end_time - section.start_time;
      
      // 找到儿童序列中对应的时间段
      const childSection = this.findCorrespondingSection(
        childSeq,
        section
      );
      
      const childDuration = childSection.end_time - childSection.start_time;
      const delay = childDuration - stdDuration;
      
      if (Math.abs(delay) > 2.0) { // 偏差超过2秒
        timingIssues.push({
          section: section.name,
          expected_duration: stdDuration,
          actual_duration: childDuration,
          delay,
          description: this.getRhythmDescription(delay)
        });
      }
    }
    
    return {
      score: this.calculateRhythmScore(timingIssues),
      timing_issues: timingIssues
    };
  }
  
  private getRhythmDescription(delay: number): string {
    if (delay > 5) {
      return '节奏明显偏慢，要跟上音乐速度';
    } else if (delay > 2) {
      return '节奏稍慢，可以再快一些';
    } else if (delay < -5) {
      return '节奏明显偏快，需要放慢';
    } else if (delay < -2) {
      return '节奏稍快，注意控制';
    }
    return '节奏把握准确';
  }
}
```

---

## 四、可视化方案

### 1. 得分雷达图

```typescript
interface RadarChartData {
  categories: string[];
  scores: number[];
  standardLine: number; // 及格线
}

const radarData: RadarChartData = {
  categories: ['位置', '速度', '力度', '节奏', '流畅度'],
  scores: [85.2, 78.5, 80.3, 85.0, 82.4],
  standardLine: 80
};

// 使用Chart.js或ECharts渲染
```

### 2. 时间轴热力图

```typescript
interface TimelineHeatmap {
  timestamps: number[];      // [0, 0.5, 1.0, 1.5, ...]
  scores: number[];          // [75, 82, 88, 65, ...]
  highlights: {
    time: number;
    type: 'good' | 'bad';
    message: string;
  }[];
}

// 可视化示例：
// 时间 →
// 0s ████████ 75分
// 1s ███████████ 88分 ⭐ 跳跃标准
// 2s ██████ 65分 ⚠️ 转身不完整
```

### 3. 关节偏差示意图

```typescript
interface JointErrorVisualization {
  skeleton: {
    joint_name: string;
    position: { x: number, y: number };
    error_magnitude: number;    // 0-1
    error_vector: { dx: number, dy: number }; // 偏差方向
  }[];
}

// 渲染为人体骨架图，用颜色和箭头表示偏差
// 绿色：准确（error < 0.05）
// 黄色：轻微偏差（0.05 < error < 0.1）
// 红色：较大偏差（error > 0.1）
// 箭头：指向应该移动的方向
```

### 4. 速度曲线对比图

```typescript
interface VelocityComparisonChart {
  joint: string;
  time: number[];
  standardVelocity: number[];
  childVelocity: number[];
}

// 使用折线图展示
// X轴：时间
// Y轴：速度
// 蓝色线：标准速度
// 红色线：儿童速度
// 高亮差异大的区域
```

### 5. 3D骨架动画对比

```typescript
interface AnimationComparison {
  mode: 'side-by-side' | 'overlay';
  standardAnimation: SkeletonKeyframes[];
  childAnimation: SkeletonKeyframes[];
  syncedTimeline: boolean;
}

// side-by-side: 左右对比
// overlay: 叠加显示（标准用半透明绿色，儿童用蓝色）
```

---

## 五、儿童友好的反馈呈现

### 1. 评分卡片

```typescript
interface ScoreCard {
  emoji: string;           // 😊 😐 😢
  score: number;
  level: string;           // "太棒了！" "继续加油！" "需要练习"
  stars: number;           // 1-5星
  encouragement: string;   // "你已经很棒了！"
}

function generateScoreCard(score: number): ScoreCard {
  if (score >= 90) {
    return {
      emoji: '🎉',
      score,
      level: '太棒了！',
      stars: 5,
      encouragement: '你跳得像专业舞者一样！'
    };
  } else if (score >= 80) {
    return {
      emoji: '😊',
      score,
      level: '做得很好！',
      stars: 4,
      encouragement: '再练习一下就完美了！'
    };
  } else if (score >= 70) {
    return {
      emoji: '🙂',
      score,
      level: '继续加油！',
      stars: 3,
      encouragement: '你正在进步，再努力一点！'
    };
  } else {
    return {
      emoji: '💪',
      score,
      level: '多练习会更好',
      stars: 2,
      encouragement: '不要气馁，多练几次就好了！'
    };
  }
}
```

### 2. 动画提示

```typescript
interface AnimatedFeedback {
  type: 'position' | 'speed' | 'force';
  joint: string;
  animation: {
    type: 'arrow' | 'circle' | 'glow';
    color: string;
    message: string;
  };
}

// 在3D骨架上叠加动画提示
// 例如：左手位置不对 → 在左手处显示向上的箭头 + "再抬高一点哦"
```

### 3. 语音反馈（可选）

```typescript
interface VoiceFeedback {
  messages: string[];
  voice: 'child' | 'adult';
  timing: 'immediate' | 'after-practice';
}

const voiceFeedback: VoiceFeedback = {
  messages: [
    '这次跳得不错，继续加油！',
    '挥手的时候可以再快一点哦',
    '跳跃动作很标准，真棒！'
  ],
  voice: 'child',
  timing: 'after-practice'
};
```

---

## 六、家长报告

### 详细报告数据

```json
{
  "report_id": "report_20241130_152530",
  "child_name": "小明",
  "dance_name": "彩虹舞",
  "practice_date": "2024-11-30",
  "practice_duration": "3分30秒",
  
  "overall_performance": {
    "score": 82.4,
    "rank": "良好",
    "improvement_from_last": "+5.2分"
  },
  
  "detailed_scores": {
    "position_accuracy": {
      "score": 85.2,
      "evaluation": "动作基本到位",
      "issues": ["左手抬起高度稍低"]
    },
    "speed_matching": {
      "score": 78.5,
      "evaluation": "节奏把握需加强",
      "issues": ["挥手动作偏慢", "跳跃动作过快"]
    },
    "force_control": {
      "score": 80.3,
      "evaluation": "力度控制良好",
      "issues": ["手臂发力稍弱"]
    },
    "rhythm_sense": {
      "score": 85.0,
      "evaluation": "节奏感较好",
      "issues": ["第一段节奏稍慢"]
    }
  },
  
  "progress_tracking": {
    "total_practices": 8,
    "best_score": 87.3,
    "average_score": 79.6,
    "trend": "improving"
  },
  
  "suggestions_for_parents": [
    "可以放慢音乐速度，让孩子先掌握动作要领",
    "鼓励孩子多练习挥手动作，提高速度",
    "孩子的节奏感不错，继续保持"
  ]
}
```

### 进度趋势图

```typescript
interface ProgressChart {
  dates: string[];              // ["11-23", "11-25", "11-27", ...]
  scores: number[];             // [72, 75, 78, 82, ...]
  categories: {
    position: number[];
    velocity: number[];
    acceleration: number[];
    rhythm: number[];
  };
}
```

---

## 七、实时反馈（练习中）

### 即时提示系统

```typescript
class RealtimeFeedbackSystem {
  private lastFeedbackTime: number = 0;
  private feedbackInterval: number = 3000; // 3秒一次
  
  provideFeedback(
    currentScore: number,
    currentIssue: string | null,
    musicTime: number
  ) {
    const now = Date.now();
    
    // 避免反馈过于频繁
    if (now - this.lastFeedbackTime < this.feedbackInterval) {
      return;
    }
    
    if (currentScore < 70 && currentIssue) {
      // 显示提示气泡
      this.showBubble({
        message: this.getSimpleFeedback(currentIssue),
        duration: 2000,
        position: 'top-center'
      });
      
      this.lastFeedbackTime = now;
    }
  }
  
  private getSimpleFeedback(issue: string): string {
    const feedbackMap = {
      'left_wrist_low': '左手再抬高一点！',
      'right_wrist_slow': '挥手再快一点！',
      'left_knee_angle': '膝盖弯曲再大一点！',
      'rhythm_slow': '跟上节奏！'
    };
    
    return feedbackMap[issue] || '继续加油！';
  }
}
```

---

## 八、UI组件设计

### 1. 差异分析页面布局

```
┌─────────────────────────────────────┐
│  🎉 你的得分：82.4分                  │
│  ⭐⭐⭐⭐ 做得很好！                   │
├─────────────────────────────────────┤
│  【雷达图】                           │
│  位置 ████████ 85.2                  │
│  速度 ███████  78.5 ⚠️               │
│  力度 ████████ 80.3                  │
│  节奏 ████████ 85.0                  │
├─────────────────────────────────────┤
│  【需要改进的地方】                   │
│  🔴 挥手动作偏慢，跟上节奏            │
│  🟡 左手抬起高度稍低                  │
│  🟢 跳跃动作很标准！                  │
├─────────────────────────────────────┤
│  【时间轴】                           │
│  0s ████████                         │
│  12s ███ ⚠️ 转身不完整                │
│  28s ███████████ ⭐ 跳跃标准          │
├─────────────────────────────────────┤
│  [查看3D对比动画] [再练一次]          │
└─────────────────────────────────────┘
```

### 2. React组件示例

```typescript
interface DifferenceVisualizationProps {
  analysisResult: AnalysisResult;
  onRetry: () => void;
  onViewAnimation: () => void;
}

function DifferenceVisualization({
  analysisResult,
  onRetry,
  onViewAnimation
}: DifferenceVisualizationProps) {
  return (
    <div className="analysis-container">
      {/* 得分卡片 */}
      <ScoreCard score={analysisResult.overall_score} />
      
      {/* 雷达图 */}
      <RadarChart data={analysisResult.scores} />
      
      {/* 问题列表 */}
      <IssueList issues={analysisResult.suggestions} />
      
      {/* 时间轴热力图 */}
      <TimelineHeatmap data={analysisResult.timeline_analysis} />
      
      {/* 操作按钮 */}
      <div className="actions">
        <button onClick={onViewAnimation}>
          查看动作对比
        </button>
        <button onClick={onRetry}>
          再练一次
        </button>
      </div>
    </div>
  );
}
```

---

## 九、存储结构

```
public/
└── analysis_results/
    ├── sess_20241130_152530_analysis.json    # 差异分析结果
    └── sess_20241130_152530_visualization.json # 可视化数据

src/
└── components/
    ├── ScoreCard.tsx                  # 得分卡片
    ├── RadarChart.tsx                 # 雷达图
    ├── TimelineHeatmap.tsx            # 时间轴热力图
    ├── SkeletonComparison.tsx         # 骨架对比
    └── IssueList.tsx                  # 问题列表
```

---

## 十、核心要点

1. **多维度分析**: 位置、速度、力度、节奏四个维度
2. **具体问题定位**: 精确到关节、时间段、偏差量
3. **儿童友好**: 使用表情、星级、鼓励语言
4. **可视化丰富**: 雷达图、热力图、骨架图、动画对比
5. **实时反馈**: 练习中即时提示
6. **家长报告**: 详细的进步追踪和建议

---

**输出示例**:
```
🎉 太棒了！得分 82.4 分

优点：
✅ 跳跃动作很标准 (28s处)
✅ 节奏把握准确

需要改进：
⚠️ 挥手动作可以再快一点
⚠️ 左手抬起时尽量高举过头

继续加油，你已经很棒了！💪
```
