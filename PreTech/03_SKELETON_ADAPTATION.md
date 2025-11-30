# 骨骼适配儿童算法 - 技术方案

## 一、技术架构

```
儿童身高输入 → 计算缩放比例 → 标准骨架归一化 → 实时比对时应用缩放 → 消除身高差异
```

---

## 二、核心原理

### 问题
- 标准舞蹈动作由成人录制（默认身高170cm）
- 儿童身高范围广（3岁~90cm，12岁~150cm）
- 直接比对会因身高差异导致误判

### 解决方案
通过身高比例对骨架坐标进行归一化处理，消除身高差异影响

---

## 三、数据结构

### 1. 用户身高配置

```json
{
  "user_id": "child_123",
  "name": "小明",
  "age": 8,
  "height": 130,
  "height_unit": "cm",
  "created_at": "2024-11-30T15:30:00Z",
  "scale_ratio": 0.765
}
```

### 2. 标准骨架参数

```typescript
const STANDARD_SKELETON = {
  reference_height: 170, // 标准参考身高(cm)
  
  // 身体比例（归一化）
  proportions: {
    head_to_total: 0.14,        // 头部占身高14%
    torso_to_total: 0.35,       // 躯干占身高35%
    leg_to_total: 0.51,         // 腿部占身高51%
    arm_to_total: 0.42,         // 手臂占身高42%
    
    shoulder_width: 0.24,       // 肩宽占身高24%
    hip_width: 0.18            // 髋宽占身高18%
  },
  
  // 关键点映射（MediaPipe 33点）
  keypoints: {
    head: ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'],
    torso: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
    arms: ['left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
    legs: ['left_knee', 'right_knee', 'left_ankle', 'right_ankle']
  }
};
```

---

## 四、算法实现

### 1. 计算缩放比例

```typescript
class SkeletonAdapter {
  private standardHeight: number = 170; // 标准身高(cm)
  
  calculateScaleRatio(childHeight: number): number {
    // 简单线性缩放
    return childHeight / this.standardHeight;
  }
  
  // 示例：
  // 儿童身高130cm: 130/170 = 0.765
  // 儿童身高100cm: 100/170 = 0.588
  // 儿童身高150cm: 150/170 = 0.882
}
```

### 2. 骨架归一化（标准动作 → 适配儿童）

```typescript
interface Point3D {
  x: number;
  y: number;
  z: number;
}

function normalizeStandardPose(
  standardPose: PoseLandmarks,
  scaleRatio: number
): PoseLandmarks {
  const normalized = {};
  
  // 找到参考点（通常是髋部中心）
  const hipCenter = {
    x: (standardPose.left_hip.x + standardPose.right_hip.x) / 2,
    y: (standardPose.left_hip.y + standardPose.right_hip.y) / 2,
    z: (standardPose.left_hip.z + standardPose.right_hip.z) / 2
  };
  
  // 对每个关键点进行缩放
  for (const [key, point] of Object.entries(standardPose)) {
    // 相对于髋部中心的偏移
    const offset = {
      x: point.x - hipCenter.x,
      y: point.y - hipCenter.y,
      z: point.z - hipCenter.z
    };
    
    // 应用缩放
    normalized[key] = {
      x: hipCenter.x + offset.x * scaleRatio,
      y: hipCenter.y + offset.y * scaleRatio,
      z: hipCenter.z + offset.z * scaleRatio,
      visibility: point.visibility
    };
  }
  
  return normalized as PoseLandmarks;
}
```

### 3. 反向缩放（儿童姿态 → 标准尺度）

```typescript
function scaleChildPoseToStandard(
  childPose: PoseLandmarks,
  scaleRatio: number
): PoseLandmarks {
  // 将儿童姿态放大到成人标准
  return normalizeStandardPose(childPose, 1 / scaleRatio);
}
```

### 4. 实时比对（应用缩放）

```typescript
class PoseComparator {
  compare(
    childPose: PoseLandmarks,
    standardPose: PoseLandmarks,
    childHeight: number
  ): number {
    const scaleRatio = childHeight / 170;
    
    // 方案1：将标准动作缩小到儿童尺度
    const scaledStandard = normalizeStandardPose(standardPose, scaleRatio);
    return this.calculateSimilarity(childPose, scaledStandard);
    
    // 方案2：将儿童动作放大到标准尺度（效果相同）
    // const scaledChild = scaleChildPoseToStandard(childPose, scaleRatio);
    // return this.calculateSimilarity(scaledChild, standardPose);
  }
  
  private calculateSimilarity(pose1: PoseLandmarks, pose2: PoseLandmarks): number {
    let totalDiff = 0;
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
        const diff = Math.sqrt(
          Math.pow(pose1[point].x - pose2[point].x, 2) +
          Math.pow(pose1[point].y - pose2[point].y, 2) +
          Math.pow(pose1[point].z - pose2[point].z, 2)
        );
        
        totalDiff += diff;
        validPoints++;
      }
    }
    
    const avgDiff = totalDiff / validPoints;
    
    // 转换为得分 (0-100)
    return Math.max(0, 100 - avgDiff * 200);
  }
}
```

---

## 五、身高档位预设

### 年龄-身高对照表

```typescript
const HEIGHT_PRESETS = {
  age_3: { height: 95, label: '3岁 (约95cm)' },
  age_4: { height: 102, label: '4岁 (约102cm)' },
  age_5: { height: 109, label: '5岁 (约109cm)' },
  age_6: { height: 115, label: '6岁 (约115cm)' },
  age_7: { height: 122, label: '7岁 (约122cm)' },
  age_8: { height: 128, label: '8岁 (约128cm)' },
  age_9: { height: 134, label: '9岁 (约134cm)' },
  age_10: { height: 140, label: '10岁 (约140cm)' },
  age_11: { height: 146, label: '11岁 (约146cm)' },
  age_12: { height: 152, label: '12岁 (约152cm)' }
};
```

### UI选择器

```typescript
interface HeightInputProps {
  onHeightChange: (height: number) => void;
}

function HeightInput({ onHeightChange }: HeightInputProps) {
  const [inputMode, setInputMode] = useState<'preset' | 'manual'>('preset');
  const [selectedAge, setSelectedAge] = useState(8);
  const [customHeight, setCustomHeight] = useState(130);
  
  const handlePresetSelect = (age: number) => {
    setSelectedAge(age);
    const preset = HEIGHT_PRESETS[`age_${age}`];
    onHeightChange(preset.height);
  };
  
  const handleManualInput = (height: number) => {
    setCustomHeight(height);
    onHeightChange(height);
  };
  
  return (
    <div>
      <div>
        <button onClick={() => setInputMode('preset')}>按年龄</button>
        <button onClick={() => setInputMode('manual')}>手动输入</button>
      </div>
      
      {inputMode === 'preset' ? (
        <select onChange={(e) => handlePresetSelect(Number(e.target.value))}>
          {Object.entries(HEIGHT_PRESETS).map(([key, value]) => (
            <option key={key} value={value.height}>
              {value.label}
            </option>
          ))}
        </select>
      ) : (
        <div>
          <input
            type="number"
            min="80"
            max="180"
            value={customHeight}
            onChange={(e) => handleManualInput(Number(e.target.value))}
          />
          <span>cm</span>
        </div>
      )}
      
      <div>缩放比例: {(customHeight / 170).toFixed(3)}</div>
    </div>
  );
}
```

---

## 六、高级适配（可选）

### 1. 儿童身体比例调整

```typescript
// 儿童与成人身体比例差异
const CHILD_ADULT_RATIO = {
  // 儿童头部相对更大
  head_scale: 1.15,
  
  // 儿童四肢相对较短
  arm_scale: 0.92,
  leg_scale: 0.95,
  
  // 儿童躯干相对较长
  torso_scale: 1.05
};

function adaptChildProportions(
  pose: PoseLandmarks,
  childAge: number
): PoseLandmarks {
  // 3-6岁：比例差异明显
  // 7-12岁：逐渐接近成人比例
  
  const ageFactor = Math.min(1, (childAge - 3) / 9); // 0到1
  
  const headScale = 1 + (CHILD_ADULT_RATIO.head_scale - 1) * (1 - ageFactor);
  const limbScale = 1 - (1 - CHILD_ADULT_RATIO.arm_scale) * (1 - ageFactor);
  
  // 应用分段缩放...
  
  return pose;
}
```

### 2. 动态校准

```typescript
class DynamicCalibration {
  // 自动检测儿童实际身高
  async calibrateHeight(pose: PoseLandmarks): Promise<number> {
    // 计算鼻子到脚踝的距离（估算身高）
    const noseToAnkle = Math.abs(pose.nose.y - 
      (pose.left_ankle.y + pose.right_ankle.y) / 2);
    
    // MediaPipe坐标是归一化的(0-1)
    // 需要根据实际摄像头画面高度计算
    const cameraHeight = window.innerHeight;
    const estimatedHeight = noseToAnkle * cameraHeight;
    
    // 转换为厘米（需要标定）
    return estimatedHeight * 1.2; // 经验系数
  }
}
```

---

## 七、使用流程

### 1. 用户首次使用

```typescript
// 1. 用户输入身高
const userHeight = 130; // cm

// 2. 保存到本地存储
localStorage.setItem('user_height', userHeight.toString());

// 3. 计算缩放比例
const scaleRatio = userHeight / 170; // 0.765

// 4. 后续比对时自动应用
```

### 2. 实时练习

```typescript
const danceLibrary = new DanceLibrary();
const comparator = new PoseComparator();

// 加载标准动作
await danceLibrary.load();

// 获取儿童身高
const childHeight = Number(localStorage.getItem('user_height')) || 130;

// 实时比对
function onPoseDetected(childPose: PoseLandmarks, musicTime: number) {
  const standardFrame = danceLibrary.getFrameAtTime('song_rainbow_dance', musicTime);
  
  if (standardFrame) {
    const score = comparator.compare(
      childPose,
      standardFrame.pose,
      childHeight  // 自动应用缩放
    );
    
    updateScoreDisplay(score);
  }
}
```

---

## 八、目录结构

```
src/
└── utils/
    ├── SkeletonAdapter.ts          # 骨架适配算法
    ├── PoseComparator.ts           # 比对算法（含缩放）
    └── HeightCalibration.ts        # 身高校准工具

components/
└── HeightInput.tsx                 # 身高输入组件
```

---

## 九、核心要点

1. **标准身高**: 170cm（成人标准）
2. **缩放公式**: `scaleRatio = childHeight / 170`
3. **适配方式**: 
   - 将标准动作缩小到儿童尺度（推荐）
   - 或将儿童动作放大到标准尺度
4. **参考点**: 使用髋部中心作为缩放原点
5. **身高输入**: 支持按年龄预设 + 手动输入
6. **存储**: LocalStorage持久化

---

**缩放效果示例**:
```
儿童身高100cm: 比例0.588 (6岁以下)
儿童身高130cm: 比例0.765 (8岁左右)
儿童身高150cm: 比例0.882 (11-12岁)
成人身高170cm: 比例1.000 (标准)
```
