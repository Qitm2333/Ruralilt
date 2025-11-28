import { useEffect, useRef, useState } from 'react';
import { Camera, X, Settings, Eye, EyeOff } from 'lucide-react';

interface CardDetectionProps {
  onClose: () => void;
  onCardDetected: (cardNumber: number) => void;
}

// 卡片特征定义（需要根据实际卡片调整）
interface CardFeature {
  keywords: string[]; // 关键词
  dominantColor: { r: number; g: number; b: number }; // 主色调
  colorThreshold: number; // 颜色容差
}

// 声明OpenCV全局变量
declare const cv: any;

// 卡片ORB特征（预先计算好的，启动时从参考图片提取）
const CARD_ORB_FEATURES: Record<number, { keypoints: any; descriptors: any } | null> = {
  1: null, // 将在运行时计算
  2: null,
  3: null,
  4: null,
  5: null
};

// 卡片颜色配置
interface CardColor {
  r: number;
  g: number;
  b: number;
}

const CARD_COLORS: Record<number, CardColor> = {
  1: { r: 255, g: 225, b: 221 }, // #ffe1dd 浅粉色
  2: { r: 255, g: 222, b: 183 }, // #ffdeb7 浅橙色
  3: { r: 205, g: 229, b: 186 }, // #cde5ba 浅绿色
  4: { r: 158, g: 226, b: 255 }, // #9ee2ff 浅蓝色
  5: { r: 248, g: 135, b: 106 }  // #f8876a 珊瑚橙色
};

export default function CardDetection({ onClose, onCardDetected }: CardDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const consecutiveMatchesRef = useRef<{ cardNumber: number; count: number }>({ cardNumber: 0, count: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [matchConfidence, setMatchConfidence] = useState<number>(0);
  const [currentMatchCard, setCurrentMatchCard] = useState<number>(0);
  const [isOverexposed, setIsOverexposed] = useState(false);
  const [edgeInfo, setEdgeInfo] = useState<string>('');
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [openCVReady, setOpenCVReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{cardNumber: number, edgeMatch: number, colorMatch: number, finalScore: number}[]>([]);
  const [exposureCompensation, setExposureCompensation] = useState<number>(-1); // 默认降低曝光
  const lastAdjustmentRef = useRef<number>(0);
  const exposureInitializedRef = useRef<boolean>(false);
  const [isUiHidden, setIsUiHidden] = useState<boolean>(false);

  // 提取主色调（只提取中心50%区域，避免边缘背景干扰）
  const getDominantColor = (imageData: ImageData): { r: number; g: number; b: number } => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 只采样中心50%区域
    const startX = Math.floor(width * 0.25);
    const endX = Math.floor(width * 0.75);
    const startY = Math.floor(height * 0.25);
    const endY = Math.floor(height * 0.75);
    
    let r = 0, g = 0, b = 0;
    let sampleCount = 0;
    
    // 每隔5个像素采样（更密集）
    for (let y = startY; y < endY; y += 5) {
      for (let x = startX; x < endX; x += 5) {
        const idx = (y * width + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        sampleCount++;
      }
    }
    
    return {
      r: Math.round(r / sampleCount),
      g: Math.round(g / sampleCount),
      b: Math.round(b / sampleCount)
    };
  };

  // 颜色相似度计算
  const colorSimilarity = (
    color1: { r: number; g: number; b: number }, 
    color2: { r: number; g: number; b: number }
  ): number => {
    const rDiff = Math.abs(color1.r - color2.r);
    const gDiff = Math.abs(color1.g - color2.g);
    const bDiff = Math.abs(color1.b - color2.b);
    const totalDiff = rDiff + gDiff + bDiff;
    
    // 转换为相似度百分比 (最大差异 = 255*3 = 765)
    return (1 - totalDiff / 765) * 100;
  };

  // 等待OpenCV加载
  useEffect(() => {
    const checkOpenCV = setInterval(() => {
      if (typeof cv !== 'undefined' && cv.Mat) {
        console.log('✅ OpenCV.js 已就绪');
        setOpenCVReady(true);
        clearInterval(checkOpenCV);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkOpenCV);
      if (!openCVReady) {
        console.error('❌ OpenCV.js 加载超时');
      }
    }, 10000);

    return () => clearInterval(checkOpenCV);
  }, []);

  // 使用OpenCV提取ORB特征
  const extractORBFeatures = (imageData: ImageData): { keypoints: any; descriptors: any } | null => {
    if (!cv || !cv.Mat) {
      console.error('OpenCV未加载');
      return null;
    }

    try {
      // 转换为OpenCV Mat
      const src = cv.matFromImageData(imageData);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // 创建ORB检测器
      const orb = new cv.ORB(500); // 最多500个特征点
      const keypoints = new cv.KeyPointVector();
      const descriptors = new cv.Mat();

      // 检测并计算特征
      orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

      const result = {
        keypoints: keypoints,
        descriptors: descriptors
      };

      // 清理
      src.delete();
      gray.delete();
      orb.delete();

      console.log(`提取到 ${keypoints.size()} 个特征点`);
      return result;
    } catch (err) {
      console.error('ORB特征提取失败:', err);
      return null;
    }
  };

  // 使用OpenCV匹配ORB特征
  const matchORBFeatures = (features1: { keypoints: any; descriptors: any }, features2: { keypoints: any; descriptors: any }): number => {
    if (!cv || !cv.Mat) return 0;

    try {
      // 使用BFMatcher匹配
      const bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
      const matches = new cv.DMatchVector();
      bf.match(features1.descriptors, features2.descriptors, matches);

      // 计算匹配度（好的匹配数量 / 总特征点数）
      const goodMatches = [];
      for (let i = 0; i < matches.size(); i++) {
        const match = matches.get(i);
        if (match.distance < 50) { // 距离阈值
          goodMatches.push(match);
        }
      }

      const matchScore = (goodMatches.length / Math.max(features1.keypoints.size(), 1)) * 100;

      // 清理
      bf.delete();
      matches.delete();

      return matchScore;
    } catch (err) {
      console.error('ORB特征匹配失败:', err);
      return 0;
    }
  };

  // 边缘检测（Canny算法简化版）
  const detectEdges = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data.length);
    
    // 1. 转灰度
    const gray: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const g = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      gray.push(g);
    }
    
    // 2. Sobel边缘检测
    const getPixel = (x: number, y: number): number => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      return gray[y * width + x];
    };
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Sobel X方向
        const gx = 
          -getPixel(x-1, y-1) + getPixel(x+1, y-1) +
          -2*getPixel(x-1, y) + 2*getPixel(x+1, y) +
          -getPixel(x-1, y+1) + getPixel(x+1, y+1);
        
        // Sobel Y方向
        const gy = 
          -getPixel(x-1, y-1) - 2*getPixel(x, y-1) - getPixel(x+1, y-1) +
          getPixel(x-1, y+1) + 2*getPixel(x, y+1) + getPixel(x+1, y+1);
        
        // 梯度幅值
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // 阈值化（降低阈值以适应较暗画面）
        const edge = magnitude > 35 ? 255 : 0;
        
        const idx = (y * width + x) * 4;
        newData[idx] = edge;
        newData[idx + 1] = edge;
        newData[idx + 2] = edge;
        newData[idx + 3] = 255;
      }
    }
    
    return new ImageData(newData, width, height);
  };
  
  // 计算图像特征（边缘密度分布 + 方向梯度直方图）
  const extractFeatures = (imageData: ImageData): number[] => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 将图像分成16×16网格，计算每个区域的边缘密度（更高精度）
    const gridSize = 16;
    const cellWidth = Math.floor(width / gridSize);
    const cellHeight = Math.floor(height / gridSize);
    const features: number[] = [];
    
    // 只提取中心80%区域的特征（忽略边缘背景）
    const marginX = Math.floor(width * 0.1);
    const marginY = Math.floor(height * 0.1);
    
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let edgeCount = 0;
        let totalPixels = 0;
        let horizontalEdges = 0;
        let verticalEdges = 0;
        
        for (let y = gy * cellHeight; y < (gy + 1) * cellHeight && y < height; y++) {
          for (let x = gx * cellWidth; x < (gx + 1) * cellWidth && x < width; x++) {
            // 跳过边缘区域
            if (x < marginX || x > width - marginX || y < marginY || y > height - marginY) {
              continue;
            }
            
            const idx = (y * width + x) * 4;
            const isEdge = data[idx] > 128; // 白色边缘
            
            if (isEdge) {
              edgeCount++;
              
              // 检测边缘方向（水平或垂直）
              if (x > 0 && x < width - 1) {
                const left = data[(y * width + (x - 1)) * 4];
                const right = data[(y * width + (x + 1)) * 4];
                if (Math.abs(left - right) > 50) horizontalEdges++;
              }
              
              if (y > 0 && y < height - 1) {
                const top = data[((y - 1) * width + x) * 4];
                const bottom = data[((y + 1) * width + x) * 4];
                if (Math.abs(top - bottom) > 50) verticalEdges++;
              }
            }
            totalPixels++;
          }
        }
        
        // 归一化边缘密度和方向比例
        const density = totalPixels > 0 ? edgeCount / totalPixels : 0;
        const hRatio = edgeCount > 0 ? horizontalEdges / edgeCount : 0;
        const vRatio = edgeCount > 0 ? verticalEdges / edgeCount : 0;
        
        // 组合特征：密度 + 水平边缘比例 + 垂直边缘比例
        features.push(density);
        features.push(hRatio);
        features.push(vRatio);
      }
    }
    
    return features;
  };
  
  // 计算特征向量相似度（余弦相似度）
  const calculateFeatureSimilarity = (features1: number[], features2: number[]): number => {
    if (features1.length !== features2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    // 余弦相似度转换为百分比
    return (dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100;
  };

  // 简化验证（纯像素匹配不需要额外验证）
  const verifyCardFeatures = async (imageData: ImageData, cardNumber: number): Promise<boolean> => {
    // 纯像素匹配已经足够，直接通过
    console.log(`✅ 卡片${cardNumber} 像素匹配验证通过`);
    return true;
  };

  // 初始化相机曝光（启动时主动降低）
  const initializeCameraExposure = async () => {
    if (!streamRef.current || exposureInitializedRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    try {
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (!capabilities.exposureCompensation) {
        console.log('⚠️ 摄像头不支持曝光补偿调整');
        return;
      }
      
      // 启动时主动设置曝光为-1
      await videoTrack.applyConstraints({
        advanced: [{ exposureCompensation: -1 } as any]
      });
      
      exposureInitializedRef.current = true;
      console.log('📷 初始曝光设置为 -1（轻度降低亮度）');
      
    } catch (err) {
      console.error('❌ 初始曝光设置失败:', err);
    }
  };

  // 自动调整相机曝光（偏暗策略，边缘识别更清晰）
  const adjustCameraExposure = async (avgBrightness: number) => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    // 避免频繁调整（至少间隔3秒）
    const now = Date.now();
    if (now - lastAdjustmentRef.current < 3000) return;
    
    try {
      const capabilities = videoTrack.getCapabilities() as any;
      
      // 检查是否支持曝光补偿
      if (!capabilities.exposureCompensation) {
        return;
      }
      
      const { min, max, step } = capabilities.exposureCompensation as { min?: number; max?: number; step?: number };
      let targetCompensation = exposureCompensation;
      
      // 偏暗策略：降低过曝阈值，提高过暗阈值
      if (avgBrightness > 180) {
        // 过曝：积极降低曝光补偿（阈值从220降到180）
        targetCompensation = Math.max(min || -4, exposureCompensation - (step || 1));
        console.log(`📉 画面偏亮(${avgBrightness.toFixed(0)})，降低曝光: ${targetCompensation}`);
      } else if (avgBrightness < 60) {
        // 过暗：提高曝光补偿（阈值从80降到60，避免太暗）
        targetCompensation = Math.min(max || 1, exposureCompensation + (step || 1));
        console.log(`📈 画面过暗(${avgBrightness.toFixed(0)})，提高曝光: ${targetCompensation}`);
      } else {
        // 亮度适中（60-180），不调整
        return;
      }
      
      // 应用新的曝光设置
      await videoTrack.applyConstraints({
        advanced: [{ exposureCompensation: targetCompensation } as any]
      });
      
      setExposureCompensation(targetCompensation);
      lastAdjustmentRef.current = now;
      console.log(`✅ 曝光调整成功: ${targetCompensation}`);
      
    } catch (err) {
      console.error('❌ 曝光调整失败:', err);
    }
  };

  // 检查图像质量 - 过滤纯色/模糊/过曝图像
  const checkImageQuality = (imageData: ImageData): { stdDev: number; avgBrightness: number; isOverexposed: boolean } => {
    const data = imageData.data;
    let sum = 0;
    let sumSq = 0;
    let brightSum = 0;
    const pixelCount = data.length / 4;
    
    // 计算灰度平均值、方差和亮度
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += gray;
      sumSq += gray * gray;
      brightSum += gray;
    }
    
    const mean = sum / pixelCount;
    const variance = (sumSq / pixelCount) - (mean * mean);
    const stdDev = Math.sqrt(variance);
    const avgBrightness = brightSum / pixelCount;
    
    // 检查是否过曝（平均亮度>200说明过曝）
    const isOverexposed = avgBrightness > 200;
    
    return { stdDev, avgBrightness, isOverexposed };
  };

  // 标准化图像（归一化亮度，去除光照影响）
  const normalizeImage = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    const normalized = new Uint8ClampedArray(data.length);
    
    // 计算平均亮度
    let sum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = sum / pixelCount;
    
    // 归一化到128标准亮度
    const scale = 128 / avgBrightness;
    for (let i = 0; i < data.length; i += 4) {
      normalized[i] = Math.min(255, Math.max(0, data[i] * scale));
      normalized[i + 1] = Math.min(255, Math.max(0, data[i + 1] * scale));
      normalized[i + 2] = Math.min(255, Math.max(0, data[i + 2] * scale));
      normalized[i + 3] = 255;
    }
    
    return new ImageData(normalized, imageData.width, imageData.height);
  };

  // 计算颜色直方图（简化版本）
  const calculateHistogram = (imageData: ImageData): number[] => {
    const data = imageData.data;
    const hist = new Array(512).fill(0); // 8x8x8的色彩空间
    
    const width = imageData.width;
    const height = imageData.height;
    
    let count = 0;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const r = Math.floor(data[idx] / 32);
        const g = Math.floor(data[idx + 1] / 32);
        const b = Math.floor(data[idx + 2] / 32);
        const bin = r * 64 + g * 8 + b;
        hist[bin]++;
        count++;
      }
    }
    
    return hist.map(v => v / count);
  };

  // 图像相似度计算（纯直方图匹配）
  const calculateSimilarity = (imageData1: ImageData, imageData2: ImageData): number => {
    if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) {
      return 0;
    }

    // 1. 标准化（去除光照差异）
    const norm1 = normalizeImage(imageData1);
    const norm2 = normalizeImage(imageData2);
    
    // 2. 计算颜色直方图
    const hist1 = calculateHistogram(norm1);
    const hist2 = calculateHistogram(norm2);
    
    // 3. 计算直方图相关性
    let correlation = 0;
    for (let i = 0; i < hist1.length; i++) {
      correlation += Math.min(hist1[i], hist2[i]);
    }
    
    // 4. 综合评分：只用直方图
    const finalSimilarity = correlation * 100;
    
    console.log(`直方图: ${(correlation * 100).toFixed(1)}%, 最终: ${finalSimilarity.toFixed(1)}%`);
    
    return finalSimilarity;
  };

  // 捕获检测框区域的图像
  const captureFrame = (): ImageData | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 设置Canvas尺寸为检测框大小
    const frameWidth = 280;
    const frameHeight = 380;
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    // 计算检测框在视频中的位置
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const scaleX = videoWidth / window.innerWidth;
    const scaleY = videoHeight / window.innerHeight;
    
    // 检测框在屏幕中心
    const frameX = (window.innerWidth - frameWidth) / 2;
    const frameY = (window.innerHeight - frameHeight) / 2;
    
    // 转换到视频坐标
    const sourceX = frameX * scaleX;
    const sourceY = frameY * scaleY;
    const sourceWidth = frameWidth * scaleX;
    const sourceHeight = frameHeight * scaleY;

    // 绘制视频的检测框区域到Canvas
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, frameWidth, frameHeight
    );

    return ctx.getImageData(0, 0, frameWidth, frameHeight);
  };

  // 加载参考图片并比对
  const detectCard = async () => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    const currentFrame = captureFrame();
    if (!currentFrame) {
      setIsDetecting(false);
      return;
    }

    // 检查当前帧的图像质量
    const frameQuality = checkImageQuality(currentFrame);
    setIsOverexposed(frameQuality.isOverexposed);

    // 自动调整相机曝光（基于平均亮度）
    adjustCameraExposure(frameQuality.avgBrightness);

    // 先对当前帧进行边缘检测
    const currentEdges = detectEdges(currentFrame);
    const currentEdgeFeatures = extractFeatures(currentEdges);

    try {
      let bestFinalScore = 0;
      let bestCardNumber = 0;
      const allMatches: {cardNumber: number, edgeMatch: number, colorMatch: number, finalScore: number}[] = [];

      // 遍历5张参考图片，只使用像素相似度（最简单最可靠）
      for (let i = 1; i <= 5; i++) {
        const pixelSimilarity = await new Promise<number>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 280;
            canvas.height = 380;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              resolve(0);
              return;
            }
            
            ctx.drawImage(img, 0, 0, 280, 380);
            const referenceFrame = ctx.getImageData(0, 0, 280, 380);
            
            const similarity = calculateSimilarity(currentFrame, referenceFrame);
            resolve(similarity);
          };
          
          img.onerror = () => reject();
          img.src = `/detectCard/${i}.png`;
        });

        // 计算颜色相似度（仅用于调试显示）
        const dominantColor = getDominantColor(currentFrame);
        const targetColor = CARD_COLORS[i];
        const colorSimilarityValue = colorSimilarity(dominantColor, targetColor);

        // 只使用像素相似度
        const finalScore = pixelSimilarity;

        allMatches.push({
          cardNumber: i,
          edgeMatch: 0, // 不再使用边缘
          colorMatch: colorSimilarityValue,
          finalScore: finalScore
        });

        if (finalScore > bestFinalScore) {
          bestFinalScore = finalScore;
          bestCardNumber = i;
        }
      }

      // 更新调试信息
      setDebugInfo(allMatches);

      // 检查最高分和第二高分的差距
      const sortedMatches = [...allMatches].sort((a, b) => b.finalScore - a.finalScore);
      const bestScore = sortedMatches[0].finalScore;
      const secondBestScore = sortedMatches[1].finalScore;
      const scoreDiff = bestScore - secondBestScore;
      
      console.log(`最高分差距: ${scoreDiff.toFixed(2)}% (Card ${sortedMatches[0].cardNumber} vs Card ${sortedMatches[1].cardNumber})`);

      setMatchConfidence(bestFinalScore); // 使用综合分数作为置信度
      setCurrentMatchCard(bestCardNumber);
      
      // 阈值35%
      if (bestFinalScore > 35) {
        // 简化逻辑：如果差距<5%，需要更多验证
        const minRequiredDiff = scoreDiff < 5 ? 3 : 2;
        
        console.log(`\n========== 验证卡片 ${bestCardNumber} ==========`);
        console.log(`最高分差距: ${scoreDiff.toFixed(2)}%，要求连续匹配: ${minRequiredDiff}次`);
        
        const verified = await verifyCardFeatures(currentFrame, bestCardNumber);
        
        if (!verified) {
          console.log(`❌ 卡片${bestCardNumber} 验证失败，重置计数\n`);
          consecutiveMatchesRef.current = { cardNumber: 0, count: 0 };
          setIsDetecting(false);
          return;
        }
        
        console.log(`✅ 卡片${bestCardNumber} 边缘+颜色综合验证通过\n`);
        
        // 检查是否与上次匹配的是同一张卡片
        if (consecutiveMatchesRef.current.cardNumber === bestCardNumber) {
          consecutiveMatchesRef.current.count++;
          console.log(`✅ 连续匹配卡片 ${bestCardNumber}，次数: ${consecutiveMatchesRef.current.count}/${minRequiredDiff}，综合分数: ${bestFinalScore.toFixed(2)}%`);
          
          // 根据差距决定需要几次匹配
          if (consecutiveMatchesRef.current.count >= minRequiredDiff) {
            console.log(`🎉 确认识别卡片 ${bestCardNumber} (像素+边缘特征双重验证)`);
            // 停止检测循环
            if (detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current);
            }
            onCardDetected(bestCardNumber);
          }
        } else {
          // 匹配到不同的卡片，重置计数
          consecutiveMatchesRef.current = { cardNumber: bestCardNumber, count: 1 };
        }
      } else {
        // 相似度不够，重置计数
        consecutiveMatchesRef.current = { cardNumber: 0, count: 0 };
      }
    } catch (err) {
      console.error('卡片检测失败:', err);
    }
    
    setIsDetecting(false);
  };

  // 开始检测循环
  const startDetection = () => {
    // 每1000ms检测一次（增加间隔，因为OCR需要时间）
    detectionIntervalRef.current = window.setInterval(() => {
      detectCard();
    }, 1000);
  };

  // 加载参考图片特征
  const loadReferenceFeatures = async () => {
    console.log('开始加载参考图片边缘特征...');
    
    for (let i = 1; i <= 5; i++) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // 创建Canvas提取图像数据
            const canvas = document.createElement('canvas');
            canvas.width = 280;
            canvas.height = 380;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject();
              return;
            }
            
            // 绘制图片
            ctx.drawImage(img, 0, 0, 280, 380);
            const imageData = ctx.getImageData(0, 0, 280, 380);
            
            // 边缘检测
            const edges = detectEdges(imageData);
            
            // 提取特征
            const features = extractFeatures(edges);
            
            
            console.log(`✅ 卡片${i} 特征加载完成:`, features.map(f => f.toFixed(3)).join(', '));
            resolve();
          };
          
          img.onerror = () => {
            console.error(`❌ 卡片${i} 图片加载失败`);
            reject();
          };
          
          img.src = `/detectCard/${i}.png`;
        });
      } catch (err) {
        console.error(`卡片${i} 特征提取失败:`, err);
      }
    }
    
    setFeaturesLoaded(true);
    console.log('✅ 所有参考特征加载完成！');
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        // 检查浏览器支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support camera access');
        }

        // 获取后置摄像头
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // 后置摄像头
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // 等待视频元数据加载
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(async () => {
              // 初始化曝光设置（降低亮度）
              await initializeCameraExposure();
              
              setIsLoading(false);
              // 开始检测循环
              startDetection();
            }).catch(err => {
              console.error('视频播放失败:', err);
              setIsLoading(false);
            });
          };
        }
      } catch (error: any) {
        console.error('相机访问错误:', error);
        setIsLoading(false);
        
        let errorMessage = 'Unable to access camera';
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied, please allow camera access in settings';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera device found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application';
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
      }
    };

    startCamera();

    // 清理：关闭摄像头和检测循环
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="fixed"
      style={{
        backgroundColor: '#000',
        zIndex: 999999,
        animation: 'fadeIn 0.3s ease-out',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)'
      }}
    >
      {/* 视频预览 */}
      {!error && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full"
            style={{
              display: isLoading ? 'none' : 'block',
              objectFit: 'cover',
              width: '100vw',
              height: '100vh'
            }}
          />
          
          {/* 隐藏的Canvas用于图像处理 */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </>
      )}

      {/* 顶部控制栏 - 调整位置避开状态栏 */}
      {!isUiHidden && (
        <div className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-black/80 to-transparent" 
             style={{ paddingTop: '50px', zIndex: 100000 }}>
          <div className="flex items-center justify-between px-6 pb-4">
            <button
              onClick={onClose}
              className="w-[44px] h-[44px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <X size={24} className="text-white" strokeWidth={2.5} />
            </button>
            <h1 className="text-white text-[20px] font-['Avenir_Next:Bold',sans-serif]">
              Card Detection
            </h1>
            {false && (
              <button
                onClick={() => setIsUiHidden(true)}
                className="w-[44px] h-[44px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Hide UI"
              >
                <EyeOff size={24} className="text-white" strokeWidth={2.5} />
              </button>
            )}
            <div className="w-[44px] h-[44px]"></div>
          </div>
        </div>
      )}

      {/* 黄色检测框 - 参考底部文字的定位方式 */}
      {!isLoading && !error && !isUiHidden && (
        <div 
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 15
          }}
        >
          <div
            style={{
              width: '280px',
              height: '380px',
              border: '4px solid #FFD700',
              borderRadius: '16px',
              boxShadow: `
                0 0 30px rgba(255, 215, 0, 0.6),
                0 0 0 9999px rgba(0, 0, 0, 0.4)
              `,
              position: 'relative'
            }}
          />
        </div>
      )}

      {/* 调试信息面板 - 右上角 */}
      {false && !isLoading && !error && debugInfo.length > 0 && !isUiHidden && (
        <div 
          className="absolute right-4 top-4 bg-black/90 backdrop-blur-md rounded-lg p-2"
          style={{
            zIndex: 1002,
            pointerEvents: 'none',
            minWidth: '100px'
          }}
        >
          <p className="text-white text-[10px] font-['Avenir_Next:Bold',sans-serif] mb-1 text-center opacity-60">
            Match %
          </p>
          {debugInfo.map((info) => (
            <div 
              key={info.cardNumber}
              className={`mb-0.5 px-2 py-1 rounded flex justify-between items-center ${
                info.cardNumber === currentMatchCard && info.finalScore > 35
                  ? 'bg-green-500/70' 
                  : 'bg-gray-700/50'
              }`}
            >
              <span className="text-white text-[11px] font-['Avenir_Next:Bold',sans-serif]">
                #{info.cardNumber}
              </span>
              <span className={`text-[12px] font-['Avenir_Next:Bold',sans-serif] ${
                info.finalScore > 35 ? 'text-green-300' : 'text-gray-400'
              }`}>
                {info.finalScore.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 底部提示文字和检测状态 */}
      {!isLoading && !error && !isUiHidden && (
        <div 
          className="absolute left-0 right-0 flex flex-col items-center gap-3"
          style={{
            bottom: '60px',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        >
          {/* 检测状态指示器 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all ${
            matchConfidence > 35 
              ? 'bg-green-600/80' 
              : isDetecting 
                ? 'bg-blue-600/80' 
                : 'bg-orange-600/80'
          }`}>
            <div className={`w-2 h-2 rounded-full ${matchConfidence > 35 || isDetecting ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>
            <p className="text-white text-[14px] font-['Avenir_Next:Bold',sans-serif] m-0">
              {matchConfidence > 35 
                ? `Matching... ${consecutiveMatchesRef.current.count}` 
                : isDetecting 
                  ? 'Detecting...' 
                  : 'Ready'}
            </p>
            {matchConfidence > 0 && (
              <span className="text-white/80 text-[12px] font-['Avenir_Next:Regular',sans-serif]">
                {matchConfidence.toFixed(0)}%
              </span>
            )}
          </div>
          
          {/* 颜色信息显示 */}
          {edgeInfo && (
            <div className="bg-purple-600/80 backdrop-blur-md rounded-full px-4 py-2">
              <p className="text-white text-[12px] font-['Avenir_Next:Regular',sans-serif] m-0">
                {edgeInfo}
              </p>
            </div>
          )}
          
          {/* 连续匹配进度条 */}
          {matchConfidence > 35 && consecutiveMatchesRef.current.count > 0 && (
            <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
              <p className="text-white text-[12px] font-['Avenir_Next:Regular',sans-serif] m-0">
                Card #{currentMatchCard}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i <= consecutiveMatchesRef.current.count
                        ? 'bg-green-400'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* 过曝警告 */}
          {isOverexposed && (
            <div className="bg-red-600/80 backdrop-blur-md rounded-full px-6 py-3 animate-pulse">
              <p className="text-white text-[14px] font-['Avenir_Next:Bold',sans-serif] text-center m-0">
                ⚠️ Image Overexposed
              </p>
              <p className="text-white/90 text-[12px] font-['Avenir_Next:Regular',sans-serif] text-center m-0 mt-1">
                Avoid screen glare - Use printed card
              </p>
            </div>
          )}
          
          {/* 提示文字 */}
          <div className="bg-black/50 backdrop-blur-md rounded-full px-6 py-3">
            <p className="text-white text-[16px] font-['Avenir_Next:Regular',sans-serif] text-center m-0">
              Align card within yellow frame
            </p>
          </div>
          <div className="bg-cyan-600/80 backdrop-blur-md rounded-full px-4 py-2">
            <p className="text-white text-[13px] font-['Avenir_Next:Regular',sans-serif] text-center m-0">
              ⚡ Edge feature matching
            </p>
          </div>
        </div>
      )}

      {isUiHidden && (
        <button
          onClick={() => setIsUiHidden(false)}
          className="absolute right-4 top-4 w-[44px] h-[44px] bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center active:scale-95"
          style={{ zIndex: 1003 }}
          aria-label="Show UI"
        >
          <Eye size={24} className="text-white" strokeWidth={2.5} />
        </button>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
