import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoSrc: string;
  onClose: () => void;
}

export default function VideoPlayer({ videoSrc, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const startY = useRef(0);

  useEffect(() => {
    // 播放视频
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('视频播放失败:', err);
      });
    }
    
    // 初始动画完成后（加快到250ms）
    setTimeout(() => setIsAnimating(false), 250);
  }, []);

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只有点击背景才关闭
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  // 点击视频重播
  const handleVideoClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0; // 重置到开始
      videoRef.current.play(); // 播放
    }
  };

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // 只允许向下拖动
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  // 触摸结束
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // 如果下拉距离超过150px，关闭
    if (dragY > 150) {
      onClose();
    } else {
      // 否则回弹
      setDragY(0);
    }
  };

  // 计算背景透明度（随下拉变淡）
  const backdropOpacity = Math.max(0, 0.75 - (dragY / 300));

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
        zIndex: 99999, // 超高层级，覆盖导航栏
        animation: dragY === 0 ? 'fadeIn 0.3s ease-out' : 'none',
        transition: isDragging ? 'none' : 'background-color 0.3s ease-out'
      }}
      onClick={handleBackdropClick}
    >
      {/* 视频容器 - 绝对定位在底部 */}
      <div 
        ref={containerRef}
        className="absolute bottom-0 w-full"
        style={{
          left: '50%',
          maxWidth: '430px',
          transform: `translate(-50%, ${isAnimating ? '100%' : `${dragY}px`})`,
          transition: isAnimating 
            ? 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            : (isDragging ? 'none' : 'transform 0.25s ease-out')
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部控制区域 - 只保留拖动指示器 */}
        <div className="relative w-full h-[50px] flex items-center justify-center">
          {/* 拖动指示器 */}
          <div className="absolute top-[12px] left-0 right-0 flex justify-center">
            <div className="w-[40px] h-[4px] bg-white/50 rounded-full"></div>
          </div>
        </div>

        {/* 视频 - 填充宽度，无padding */}
        <video
          ref={videoRef}
          className="w-full block cursor-pointer"
          playsInline
          preload="metadata"
          webkit-playsinline="true"
          x5-playsinline="true"
          onClick={handleVideoClick}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            backgroundColor: '#000' // 黑色背景匹配视频
          }}
          onEnded={() => {
            // 播放完成后停在最后一帧
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          您的浏览器不支持视频播放
        </video>
      </div>

      {/* CSS样式 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* 隐藏视频控制条 */
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-enclosure {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
