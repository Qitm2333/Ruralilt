import { Home, Book, MessageCircle, User, Plus } from 'lucide-react';

interface BottomNavProps {
  currentPage: 'home' | 'collection' | 'create' | 'message' | 'profile';
  onNavigate: (page: 'home' | 'collection' | 'create' | 'message' | 'profile') => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <div 
      className="fixed left-0 right-0 h-[70px] flex items-center justify-around px-4" 
      style={{
        bottom: '10px',
        backgroundColor: 'transparent',
        zIndex: 1000
      }}
    >
      {/* 导航栏背景 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          zIndex: -1
        }}
      />
      
      {/* Home */}
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center justify-center py-2 px-4 transition-all"
        aria-label="Home"
      >
        <div className={`transition-all ${currentPage === 'home' ? 'text-[#FFE250]' : 'text-gray-500'}`}>
          <Home size={24} fill={currentPage === 'home' ? 'currentColor' : 'none'} strokeWidth={2} />
        </div>
      </button>
      
      {/* Collection */}
      <button
        onClick={() => onNavigate('collection')}
        className="flex items-center justify-center py-2 px-4 transition-all"
        aria-label="Collection"
      >
        <div className={`transition-all ${currentPage === 'collection' ? 'text-[#FFE250]' : 'text-gray-500'}`}>
          <Book size={24} fill={currentPage === 'collection' ? 'currentColor' : 'none'} strokeWidth={2} />
        </div>
      </button>
      
      {/* Create - Center Button */}
      <button
        onClick={() => onNavigate('create')}
        className="relative -mt-6 transition-transform active:scale-95"
        aria-label="Create"
      >
        <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-b from-[#FFA527] to-[#FFDF8C] shadow-lg flex items-center justify-center border-4 border-white">
          <Plus size={32} className="text-white" strokeWidth={3} />
        </div>
      </button>
      
      {/* Message */}
      <button
        onClick={() => onNavigate('message')}
        className="flex items-center justify-center py-2 px-4 transition-all"
        aria-label="Message"
      >
        <div className={`transition-all ${currentPage === 'message' ? 'text-[#FFE250]' : 'text-gray-500'}`}>
          <MessageCircle size={24} fill={currentPage === 'message' ? 'currentColor' : 'none'} strokeWidth={2} />
        </div>
      </button>
      
      {/* Profile */}
      <button
        onClick={() => onNavigate('profile')}
        className="flex items-center justify-center py-2 px-4 transition-all"
        aria-label="Profile"
      >
        <div className={`transition-all ${currentPage === 'profile' ? 'text-[#FFE250]' : 'text-gray-500'}`}>
          <User size={24} fill={currentPage === 'profile' ? 'currentColor' : 'none'} strokeWidth={2} />
        </div>
      </button>
    </div>
  );
}
