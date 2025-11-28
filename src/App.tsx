import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import CollectionPage from './components/CollectionPage';
import CreatePage from './components/CreatePage';
import MessagePage from './components/MessagePage';
import ProfilePage from './components/ProfilePage';
import CourseDetailPage from './components/CourseDetailPage';
import BottomNav from './components/BottomNav';
import PageWrapper from './components/PageWrapper';
import VideoPlayer from './components/VideoPlayer';
import CameraCapture from './components/CameraCapture';
import CardDetection from './components/CardDetection';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'collection' | 'create' | 'message' | 'profile'>('home');
  const [showCourseDetail, setShowCourseDetail] = useState<'basic' | 'advanced' | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showCardDetection, setShowCardDetection] = useState(false);
  
  // 显示视频
  const showVideo = (src: string) => {
    setVideoSrc(src);
  };
  
  // 关闭视频
  const closeVideo = () => {
    setVideoSrc(null);
  };
  
  // 显示相机
  const openCamera = () => {
    setShowCamera(true);
  };
  
  // 关闭相机
  const closeCamera = () => {
    setShowCamera(false);
  };
  
  // 打开卡片识别
  const openCardDetection = () => {
    setShowCardDetection(true);
  };
  
  // 关闭卡片识别
  const closeCardDetection = () => {
    setShowCardDetection(false);
  };
  
  // 卡片识别成功回调
  const handleCardDetected = (cardNumber: number) => {
    console.log('检测到卡片:', cardNumber);
    // 播放对应视频
    showVideo(`/detectCard/${cardNumber}.mp4`);
    closeCardDetection();
  };

  // 页面切换时自动滚动到顶部
  useEffect(() => {
    const container = document.getElementById('content-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, showCourseDetail]);

  const renderPage = () => {
    // 如果显示课程详情页
    if (showCourseDetail) {
      return (
        <CourseDetailPage 
          courseType={showCourseDetail} 
          onBack={() => setShowCourseDetail(null)}
        />
      );
    }

    // 否则显示普通页面
    switch (currentPage) {
      case 'home':
        return <HomePage onCourseClick={(type) => setShowCourseDetail(type)} />;
      case 'collection':
        return <CollectionPage 
          onAnimalClick={(type) => {
            if (type === 'sheep') {
              showVideo('/videoasset/01卡牌_小羊_视频.mp4');
            } else if (type === 'koala') {
              showVideo('/videoasset/01卡牌_考拉_视频.mp4');
            }
          }}
          onOpenCardDetection={openCardDetection}
        />;
      case 'create':
        return <CreatePage onOpenCamera={openCamera} />;
      case 'message':
        return <MessagePage />;
      case 'profile':
        return <ProfilePage onOpenCardDetection={() => setShowCardDetection(true)} />;
      default:
        return <HomePage onCourseClick={(type) => setShowCourseDetail(type)} />;
    }
  };

  // 处理导航栏点击 - 关闭课程详情页并切换页面
  const handleNavigate = (page: 'home' | 'collection' | 'create' | 'message' | 'profile') => {
    setShowCourseDetail(null); // 先关闭课程详情页
    setCurrentPage(page);      // 再切换页面
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: 'transparent', // 改为透明，避免遮挡
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative'
      }}
    >
      {/* 内容容器 - 预留底部导航栏空间 */}
      <div 
        id="content-container"
        style={{ 
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 80px)', // 为导航栏预留空间（70px高度 + 10px底部间距）
          maxWidth: '430px',
          overflowX: 'hidden', // 禁止横向滚动
          overflowY: 'auto',   // 允许纵向滚动
          backgroundColor: 'transparent' // 确保背景透明
        }} 
      >
        {/* 智能缩放容器 */}
        <PageWrapper>
          {renderPage()}
        </PageWrapper>
      </div>
      
      {/* 固定底部导航栏 */}
      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* 视频播放器 - 最高层级 */}
      {videoSrc && (
        <VideoPlayer 
          videoSrc={videoSrc} 
          onClose={closeVideo} 
        />
      )}
      
      {/* 相机捕获 - 最高层级 */}
      {showCamera && (
        <CameraCapture onClose={closeCamera} />
      )}
      
      {/* 卡片识别 - 最高层级 */}
      {showCardDetection && (
        <CardDetection 
          onClose={closeCardDetection}
          onCardDetected={handleCardDetected}
        />
      )}
    </div>
  );
}
