# ComfyUI自定义插件 - DWPose骨骼匹配方案

## 一、技术架构

```
儿童舞蹈JSON → 自定义插件节点 → 直接渲染骨架图像 → WanVideoAnimateEmbeds → 视频生成
```

**核心优势**: 不依赖POSE_KEYPOINT等内部格式，直接输出标准IMAGE类型，兼容性最强。

---

## 二、现有工作流分析

### 关键节点流程（基于Wan2.2 Animate工作流）

```
1. DWPreprocessor (id: 36) [我们要替代这个]
   输入: IMAGE (视频帧)
   输出: IMAGE (pose图像) ← 我们只需要这个输出
   
2. WanVideoAnimateEmbeds (id: 37) [直接对接]
   输入: 
     - vae: WANVAE
     - clip_embeds: WANVIDIMAGE_CLIPEMBEDS
     - ref_images: IMAGE (参考图像)
     - pose_images: IMAGE (姿态图像) ← 我们的节点输出接这里
     - face_images: IMAGE (可选)
     - width, height, num_frames: INT
   输出:
     - image_embeds: WANVIDIMAGE_EMBEDS

3. WanVideoSampler (id: 38)
   输入:
     - model: WANVIDEOMODEL
     - image_embeds: WANVIDIMAGE_EMBEDS
     - text_embeds: WANVIDEOTEXTEMBEDS
   输出:
     - samples: LATENT (潜在编码)

4. WanVideoDecode (id: 23)
   输入:
     - vae: WANVAE
     - samples: LATENT
   输出:
     - images: IMAGE (最终视频帧)
```

---

## 三、技术方案

### 方案对比

| 方案 | 流程 | 优点 | 缺点 |
|------|------|------|------|
| ❌ 方案A | JSON → POSE_KEYPOINT → IMAGE | 完全符合DWPose标准 | POSE_KEYPOINT格式复杂，难以对接 |
| ✅ 方案B | JSON → 直接渲染 → IMAGE | 简单可靠，标准IMAGE格式 | 跳过中间格式 |

**我们采用方案B**：直接从JSON渲染骨架图像

### 数据处理流程

```
1. 读取JSON文件
   ↓
2. 提取MediaPipe关键点 (归一化坐标0-1)
   ↓
3. 转换为像素坐标 (x_pixel = x * width)
   ↓
4. 使用OpenCV绘制骨架
   ↓
5. 输出IMAGE tensor (N, H, W, 3)
```

---

## 四、自定义插件设计

### 插件目录结构（极简版）

```
ComfyUI/
└── custom_nodes/
    └── comfyui-dance-pose-loader/
        ├── __init__.py                    # 插件入口
        ├── dance_pose_node.py             # 单个节点（包含所有逻辑）
        └── requirements.txt               # 依赖包
```

---

### 1. 插件入口 `__init__.py`

```python
"""
ComfyUI Dance Pose Loader Plugin
加载儿童舞蹈JSON数据并直接渲染为骨架图像
"""

from .dance_pose_node import DancePoseLoader

NODE_CLASS_MAPPINGS = {
    "DancePoseLoader": DancePoseLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DancePoseLoader": "载入舞蹈姿态 (JSON→图像)"
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
```

---

### 2. 核心节点 `dance_pose_node.py`（一体化设计）

```python
import json
import cv2
import torch
import numpy as np
from pathlib import Path

class DancePoseLoader:
    """
    一步到位：加载JSON → 渲染骨架 → 输出IMAGE
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # 文件选择（需要在ComfyUI的input文件夹中）
                "json_file": ("STRING", {
                    "default": "rainbow_dance.json",
                    "multiline": False
                }),
                # 目标分辨率
                "width": ("INT", {
                    "default": 480,
                    "min": 64,
                    "max": 2048,
                    "step": 8
                }),
                "height": ("INT", {
                    "default": 832,
                    "min": 64,
                    "max": 2048,
                    "step": 8
                }),
                # 帧范围选择
                "start_frame": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 10000
                }),
                "end_frame": ("INT", {
                    "default": -1,  # -1表示到最后一帧
                    "min": -1,
                    "max": 10000
                }),
                # 线条粗细
                "line_thickness": ("INT", {
                    "default": 2,
                    "min": 1,
                    "max": 10
                }),
                # 是否镜像（左右翻转）
                "mirror": ("BOOLEAN", {
                    "default": False
                })
            }
        }
    
    RETURN_TYPES = ("IMAGE", "INT")
    RETURN_NAMES = ("pose_images", "frame_count")
    FUNCTION = "load_and_render"
    CATEGORY = "Dance/Pose"
    
    def load_and_render(self, json_file, width, height, 
                        start_frame, end_frame, line_thickness, mirror):
        """
        加载JSON并直接渲染为骨架图像
        
        Returns:
            pose_images: shape (N, H, W, 3) 的tensor，N为帧数
            frame_count: 总帧数
        """
        # 1. 读取JSON文件
        input_dir = Path("ComfyUI/input")
        json_path = input_dir / json_file
        
        if not json_path.exists():
            raise FileNotFoundError(f"找不到文件: {json_path}")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 2. 提取帧范围
        frames = data.get('frames', [])
        
        if end_frame == -1:
            end_frame = len(frames)
        
        frames = frames[start_frame:end_frame]
        
        # 3. 渲染每一帧
        images = []
        for frame in frames:
            mediapipe_pose = frame.get('pose', {})
            
            # 直接渲染为图像
            img = self._render_skeleton(
                mediapipe_pose, 
                width, 
                height, 
                line_thickness,
                mirror
            )
            images.append(img)
        
        # 4. 转换为ComfyUI的IMAGE格式: (N, H, W, C) 归一化到0-1
        images_np = np.array(images, dtype=np.float32) / 255.0
        images_tensor = torch.from_numpy(images_np)
        
        return (images_tensor, len(frames))
    
    def _render_skeleton(self, mediapipe_pose, width, height, thickness, mirror):
        """
        渲染MediaPipe姿态为骨架图像
        
        Args:
            mediapipe_pose: dict, {joint_name: {x, y, z, visibility}}
            
        Returns:
            img: ndarray, shape (H, W, 3), RGB图像
        """
        # 创建黑色背景
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # 定义骨骼连接关系（MediaPipe关键点）
        connections = [
            # 躯干
            ('left_shoulder', 'right_shoulder'),
            ('left_shoulder', 'left_hip'),
            ('right_shoulder', 'right_hip'),
            ('left_hip', 'right_hip'),
            
            # 左臂
            ('left_shoulder', 'left_elbow'),
            ('left_elbow', 'left_wrist'),
            
            # 右臂
            ('right_shoulder', 'right_elbow'),
            ('right_elbow', 'right_wrist'),
            
            # 左腿
            ('left_hip', 'left_knee'),
            ('left_knee', 'left_ankle'),
            
            # 右腿
            ('right_hip', 'right_knee'),
            ('right_knee', 'right_ankle')
        ]
        
        # 绘制骨骼连线
        for start_joint, end_joint in connections:
            if start_joint not in mediapipe_pose or end_joint not in mediapipe_pose:
                continue
            
            start = mediapipe_pose[start_joint]
            end = mediapipe_pose[end_joint]
            
            # 归一化坐标 → 像素坐标
            x1 = int(start['x'] * width)
            y1 = int(start['y'] * height)
            x2 = int(end['x'] * width)
            y2 = int(end['y'] * height)
            
            # 镜像翻转
            if mirror:
                x1 = width - x1
                x2 = width - x2
            
            # 检查可见性
            if start.get('visibility', 1.0) > 0.5 and end.get('visibility', 1.0) > 0.5:
                cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), thickness)
        
        # 绘制关键点（可选）
        for joint_name, point in mediapipe_pose.items():
            if point.get('visibility', 1.0) > 0.5:
                x = int(point['x'] * width)
                y = int(point['y'] * height)
                
                if mirror:
                    x = width - x
                
                cv2.circle(img, (x, y), radius=4, color=(0, 255, 255), thickness=-1)
        
        return img
```

---

### 3. 依赖配置 `requirements.txt`

```
opencv-python>=4.5.0
numpy>=1.19.0
torch>=2.0.0
```

---

## 五、安装与使用

### 安装插件

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/your-repo/comfyui-dance-pose-loader
cd comfyui-dance-pose-loader
pip install -r requirements.txt
```

### 工作流集成（极简版）

**只需一个节点！**

```
【载入舞蹈姿态 (JSON→图像)】
  ↓ pose_images (IMAGE)
  ↓ frame_count (INT)
  ↓
WanVideoAnimateEmbeds
  - ref_images: (儿童照片)
  - pose_images: (直接连接) ← 关键
  - width: 480
  - height: 832
  - num_frames: (连接frame_count)
  ↓
WanVideoSampler
  ↓
WanVideoDecode
  ↓
最终视频
```

### 节点参数设置

```
【载入舞蹈姿态 (JSON→图像)】
├─ json_file: "rainbow_dance.json"     (JSON文件名)
├─ width: 480                          (输出宽度)
├─ height: 832                         (输出高度)
├─ start_frame: 0                      (起始帧)
├─ end_frame: -1                       (结束帧，-1=全部)
├─ line_thickness: 2                   (骨架线条粗细)
└─ mirror: False                       (是否镜像翻转)

输出:
├─ pose_images: IMAGE (骨架图像序列)
└─ frame_count: INT (总帧数)
```

---

## 六、数据准备

### JSON文件格式（需放入ComfyUI/input/）

```json
{
  "id": "song_rainbow_dance",
  "name": "彩虹舞",
  "fps": 30,
  "total_frames": 5415,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 0.0,
      "pose": {
        "nose": {"x": 0.5, "y": 0.2, "z": -0.1, "visibility": 0.98},
        "left_shoulder": {"x": 0.4, "y": 0.4, "z": -0.05, "visibility": 0.95},
        "right_shoulder": {"x": 0.6, "y": 0.4, "z": -0.05, "visibility": 0.96},
        "left_elbow": {"x": 0.35, "y": 0.6, "z": -0.08, "visibility": 0.92},
        "right_elbow": {"x": 0.65, "y": 0.6, "z": -0.08, "visibility": 0.94},
        "left_wrist": {"x": 0.3, "y": 0.75, "z": -0.1, "visibility": 0.88},
        "right_wrist": {"x": 0.7, "y": 0.75, "z": -0.1, "visibility": 0.90},
        "left_hip": {"x": 0.45, "y": 0.7, "z": -0.02, "visibility": 0.97},
        "right_hip": {"x": 0.55, "y": 0.7, "z": -0.02, "visibility": 0.98},
        "left_knee": {"x": 0.43, "y": 0.85, "z": -0.05, "visibility": 0.93},
        "right_knee": {"x": 0.57, "y": 0.85, "z": -0.05, "visibility": 0.94},
        "left_ankle": {"x": 0.42, "y": 0.95, "z": -0.08, "visibility": 0.89},
        "right_ankle": {"x": 0.58, "y": 0.95, "z": -0.08, "visibility": 0.91}
      }
    }
  ]
}
```

---

## 七、技术要点

### 1. 坐标转换

```python
# MediaPipe归一化坐标 (0-1) → 像素坐标
x_pixel = int(x_normalized * image_width)
y_pixel = int(y_normalized * image_height)

# 镜像翻转（可选）
if mirror:
    x_pixel = image_width - x_pixel
```

### 2. 可见性过滤

```python
# 只绘制可见性高的关键点
if point['visibility'] > 0.5:
    cv2.line(img, pt1, pt2, color, thickness)
```

### 3. ComfyUI IMAGE格式

```python
# 重要：ComfyUI的IMAGE格式要求
# - Shape: (batch, height, width, channels)
# - Dtype: float32
# - Range: 0.0 ~ 1.0 (归一化)

images_np = np.array(images, dtype=np.float32) / 255.0
images_tensor = torch.from_numpy(images_np)
```

---

## 八、核心优势

1. ✅ **极简实现** - 单个节点，约200行代码
2. ✅ **无依赖冲突** - 不依赖POSE_KEYPOINT等内部类型
3. ✅ **标准输出** - 直接输出IMAGE，兼容所有节点
4. ✅ **灵活配置** - 支持分辨率、帧范围、镜像等参数
5. ✅ **易于调试** - 黑底白线骨架，可视化清晰

---

## 九、使用流程

```
1. 录制标准舞蹈 → 提取MediaPipe数据 → 保存为JSON
   (使用我们的01_DANCE_MOTION_LIBRARY方案)

2. 将JSON文件放入ComfyUI/input/

3. 在ComfyUI工作流中添加【载入舞蹈姿态 (JSON→图像)】节点

4. 连接到WanVideoAnimateEmbeds的pose_images输入

5. 设置参考图像（儿童照片）+ 提示词

6. 运行工作流 → 生成AI舞蹈视频
```

---

## 十、项目统计

### 代码量估算

| 文件 | 行数 | 说明 |
|------|------|------|
| `__init__.py` | ~15行 | 插件入口 |
| `dance_pose_node.py` | ~150行 | 核心节点逻辑 |
| `requirements.txt` | 3行 | 依赖包 |
| **总计** | **~170行** | **极简实现** |

### 数据量估算

| 数据 | 大小 | 说明 |
|------|------|------|
| JSON文件 (1分钟) | ~200KB | 30fps × 60秒 = 1800帧 |
| JSON文件 (3分钟) | ~600KB | 完整舞蹈数据 |
| 渲染后图像 (内存) | ~250MB | 5400帧 × 480×832×3 |

### 开发难度

⭐⭐⭐ 中等

**需要掌握**:
- ComfyUI自定义节点基础
- OpenCV图像绘制
- PyTorch tensor操作
- JSON数据处理

**优势**:
- 无需深入理解DWPose格式
- 无需对接复杂的内部类型
- 代码结构简单清晰
