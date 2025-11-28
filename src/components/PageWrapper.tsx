import { ReactNode, useEffect, useState } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      // 智能缩放核心公式
      // scale = Math.min(maxScale, (screenWidth - padding) / designWidth)
      const designWidth = 430;
      const maxScale = 1.05;
      const padding = 10;
      const screenWidth = window.innerWidth;
      
      const calculatedScale = Math.min(maxScale, (screenWidth - padding) / designWidth);
      setScale(calculatedScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <div
      style={{
        width: '430px',
        minHeight: '100%',
        // 核心缩放变换：缩放 + 微调偏移（向左移动26px）
        transform: `scale(${scale}) translateX(-26px)`,
        transformOrigin: 'top center',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}
