import { useEffect, useRef, useState } from 'react';
import { X, Camera, Settings } from 'lucide-react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface CameraCaptureProps {
  onClose: () => void;
}

export default function CameraCapture({ onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const animationRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [poseDetected, setPoseDetected] = useState(false);

  // 初始化MediaPipe
  const initializeMediaPipe = async () => {
    try {
      // 初始化姿势检测
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
      
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      pose.onResults(onPoseResults);
      poseRef.current = pose;
      
      // 初始化手部检测
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      hands.onResults(onHandsResults);
      handsRef.current = hands;
      
      // 开始检测循环
      detectLoop();
    } catch (err) {
      console.error('MediaPipe初始化失败:', err);
    }
  };

  // 姿势检测结果处理
  const onPoseResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 使用window尺寸确保有效值
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 设置Canvas分辨率（只在尺寸改变时设置）
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制姿势骨骼
    if (results.poseLandmarks) {
      setPoseDetected(true);
      
      // 直接使用归一化坐标！drawConnectors期望0-1的坐标
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
        radius: 6
      });
    } else {
      setPoseDetected(false);
    }
  };

  // 手部检测结果处理
  const onHandsResults = (results: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 绘制手部关键点（不清空画布，保留姿势骨骼）
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // 直接使用归一化坐标！
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: '#00CCFF',
          lineWidth: 3
        });
        drawLandmarks(ctx, landmarks, {
          color: '#FF00FF',
          lineWidth: 2,
          radius: 5
        });
      }
    }
  };

  // 检测循环
  const detectLoop = async () => {
    if (!videoRef.current || !poseRef.current || !handsRef.current) return;
    
    // 发送到姿势检测
    await poseRef.current.send({ image: videoRef.current });
    
    // 发送到手部检测
    await handsRef.current.send({ image: videoRef.current });
    
    // 继续循环
    animationRef.current = requestAnimationFrame(detectLoop);
  };

  useEffect(() => {
    // 打开前置摄像头
    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 检查是否支持getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('您的浏览器不支持摄像头访问');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // 前置摄像头
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // 等待视频加载
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          
          // 初始化MediaPipe
          await initializeMediaPipe();
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('相机访问错误:', error);
        setIsLoading(false);
        
        let errorMessage = '无法访问摄像头';
        if (error.name === 'NotAllowedError') {
          errorMessage = '相机权限被拒绝，请在设置中允许相机权限';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到摄像头设备';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '摄像头正被其他应用使用';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      }
    };

    startCamera();

    // 清理：关闭摄像头和MediaPipe
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  return (
    <div 
      className="fixed"
      style={{
        backgroundColor: '#000',
        zIndex: 999999, // 更高的层级
        animation: 'fadeIn 0.3s ease-out',
        // 确保完全覆盖整个屏幕
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        // 覆盖所有可能的系统UI
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
              transform: 'scaleX(-1)', // 镜像翻转，更自然
              display: isLoading ? 'none' : 'block',
              objectFit: 'cover', // 填满整个容器
              width: '100vw',
              height: '100vh'
            }}
          />
          
          {/* Canvas用于绘制骨骼和手部关键点 */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: 'scaleX(-1)', // 镜像翻转匹配视频
              display: isLoading ? 'none' : 'block',
              zIndex: 10
            }}
          />
        </>
      )}

      {/* 顶部控制栏 - 调整位置避开状态栏 */}
      <div className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-black/80 to-transparent" 
           style={{ paddingTop: '50px' }}>
        {/* 控制按钮区域 */}
        <div className="flex items-center justify-between px-6 pb-4">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="w-[44px] h-[44px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <X size={24} className="text-white" strokeWidth={2.5} />
          </button>

          {/* 标题 */}
          <h1 className="text-white text-[20px] font-['Avenir_Next:Bold',sans-serif]">
            Pose Detection
          </h1>

          {/* 占位，保持对称 */}
          <div className="w-[44px]"></div>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-pulse">
              <Camera size={48} className="text-white/70" />
            </div>
            <p className="text-white text-[16px] font-['Avenir_Next:Regular',sans-serif]">
              正在打开摄像头...
            </p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="bg-red-600/20 backdrop-blur-md rounded-[20px] p-8 max-w-[350px] text-center">
            <Settings size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-white text-[18px] font-['Avenir_Next:Bold',sans-serif] mb-4">
              相机访问失败
            </h2>
            <p className="text-white/80 text-[14px] font-['Avenir_Next:Regular',sans-serif] mb-6 leading-relaxed">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-[12px] font-['Avenir_Next:Bold',sans-serif] text-[14px] active:scale-95 transition-all"
              >
                重新尝试
              </button>
              <button
                onClick={onClose}
                className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-[12px] font-['Avenir_Next:Regular',sans-serif] text-[14px] active:scale-95 transition-all"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部提示文字和检测状态 */}
      {!isLoading && !error && (
        <div 
          className="absolute left-0 right-0 flex flex-col items-center gap-3"
          style={{
            bottom: '60px', // 更靠下，距离底部60px
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        >
          {/* 姿势检测状态指示器 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all ${
            poseDetected 
              ? 'bg-green-600/80' 
              : 'bg-orange-600/80'
          }`}>
            <div className={`w-2 h-2 rounded-full ${poseDetected ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>
            <p className="text-white text-[14px] font-['Avenir_Next:Bold',sans-serif] m-0">
              {poseDetected ? 'Pose Detected' : 'Detecting...'}
            </p>
          </div>
          
          {/* 提示文字 */}
          <div className="bg-black/50 backdrop-blur-md rounded-full px-6 py-3">
            <p className="text-white text-[16px] font-['Avenir_Next:Regular',sans-serif] text-center m-0">
              Stand in front of the camera
            </p>
          </div>
          <p className="text-white/70 text-[14px] font-['Avenir_Next:Regular',sans-serif] text-center m-0">
            Make sure your full body is visible
          </p>
        </div>
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
