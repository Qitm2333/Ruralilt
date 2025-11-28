import { ChevronLeft } from 'lucide-react';
import svgPaths from "../imports/svg-8ehi7uyi7l";
import img023 from "figma:asset/d432a46e01d715c1b84651fe2b1ad59edfe0ce07.png";
import { img } from "../imports/svg-di6ed";

interface CourseDetailPageProps {
  courseType: 'basic' | 'advanced';
  onBack: () => void;
}

export default function CourseDetailPage({ courseType, onBack }: CourseDetailPageProps) {
  const title = courseType === 'basic' ? 'Basic Jazz Collection' : 'Advanced Jazz Collection';
  
  return (
    <div 
      className="relative" 
      style={{ 
        width: '430px',
        minHeight: '932px',
        backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%), linear-gradient(90deg, rgb(255, 247, 212) 0%, rgb(255, 247, 212) 100%)" 
      }}
    >
      {/* 顶部背景 - 完整复制首页 Component() */}
      <div className="absolute h-[189px] left-[calc(50%-0.25px)] top-[-22px] translate-x-[-50%] w-[467.5px]" data-name="顶部背景">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 468 189">
          <g id="顶部背景">
            <path d={svgPaths.p3ceddd00} fill="var(--fill-0, #FFE250)" id="Vector 63" />
            <path d={svgPaths.p23db2c00} fill="var(--fill-0, #FFE250)" id="Vector 64" />
          </g>
        </svg>
      </div>

      {/* 流体背景 - 完整复制首页 Component1() */}
      <div className="absolute h-[996.066px] left-[-104px] top-[-93px] w-[622.312px]" data-name="流体背景">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 623 997">
          <g id="流体背景" opacity="0.48">
            <path d={svgPaths.p290ae200} fill="var(--fill-0, white)" id="Vector 47" />
            <path d={svgPaths.p96b8b00} fill="var(--fill-0, white)" id="Vector 48" />
            <path d={svgPaths.p302bd780} fill="var(--fill-0, white)" id="Vector 53" />
            <path d={svgPaths.p3faecd00} fill="var(--fill-0, white)" id="Vector 49" />
            <path d={svgPaths.p30333480} fill="var(--fill-0, white)" id="Vector 50" />
            <path d={svgPaths.p7951900} fill="var(--fill-0, white)" id="Vector 51" />
            <path d={svgPaths.p146e3b80} fill="var(--fill-0, white)" id="Vector 52" />
            <path d={svgPaths.p5f43f00} fill="var(--fill-0, #FBFBFB)" id="Vector 46" />
          </g>
        </svg>
      </div>

      {/* 标题区域 - 替换原来的招呼语 */}
      <div className="absolute contents left-[22px] top-[121px]" data-name="标题">
        <div className="absolute flex h-[177px] items-center justify-center left-[228px] top-[121px] w-[196px]">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">
            <div className="h-[177px] relative w-[196px]" data-name="02 3">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute h-[269.44%] left-[-259.01%] max-w-none top-[-16.22%] w-[486.49%]" src={img023} />
              </div>
            </div>
          </div>
        </div>
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="absolute top-[50px] left-[3px] z-10 w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
          <ChevronLeft size={24} className="text-[#373737]" strokeWidth={2.5} />
        </button>
        {/* 页面标题 */}
        <div className="absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[60px] justify-center leading-[0] left-[25px] not-italic text-[28px] text-black top-[211px] translate-y-[-50%] w-[380px]">
          <p className="leading-[normal]">{title}</p>
        </div>
      </div>

      {/* 课程卡片列表 - 直接复用首页卡片 */}
      <div className="absolute left-0 right-0 top-[140px]">
        {courseType === 'basic' ? <BasicCourses /> : <AdvancedCourses />}
      </div>
    </div>
  );
}

// 基础课程列表
function BasicCourses() {
  return (
    <>
      {/* 课程 3 */}
      <div className="absolute left-[22px] top-[0px] w-[380px]">
        <CourseCard3 />
      </div>
      
      {/* 课程 4 */}
      <div className="absolute left-[22px] top-[254px] w-[380px]">
        <CourseCard4 />
      </div>
      
      {/* 课程 5 */}
      <div className="absolute left-[22px] top-[508px] w-[380px]">
        <CourseCard5 />
      </div>
    </>
  );
}

// 高级课程列表
function AdvancedCourses() {
  return (
    <>
      {/* 课程 3 */}
      <div className="absolute left-[22px] top-[0px] w-[380px]">
        <CourseCardAdv3 />
      </div>
      
      {/* 课程 4 */}
      <div className="absolute left-[22px] top-[254px] w-[380px]">
        <CourseCardAdv4 />
      </div>
      
      {/* 课程 5 */}
      <div className="absolute left-[22px] top-[508px] w-[380px]">
        <CourseCardAdv5 />
      </div>
    </>
  );
}

// 基础课程卡片 3 - 直接复制首页
function CourseCard3() {
  return (
    <div className="relative h-[234.387px] w-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 235">
        <path d={svgPaths.p2fbefa00} fill="url(#paint0_linear_card3)" id="Rectangle 92167" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_card3" x1="43.1735" x2="342.886" y1="1.4803e-05" y2="226.364">
            <stop stopColor="#FFE250" />
            <stop offset="1" stopColor="#FFEC8F" />
          </linearGradient>
        </defs>
      </svg>
      <p className="absolute font-['Avenir_Next:Bold',sans-serif] h-[80.185px] leading-[normal] left-[22px] not-italic text-[#282828] text-[24px] top-[22.62px] w-[283px]">Basic JAZZ Rhythm Practice</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold h-[13.364px] leading-[normal] left-[22px] not-italic text-[#dd8100] text-[10px] bottom-[37px] w-[87px]">Primary Course</p>
      <div className="absolute right-[22px] top-[22px] w-[21px] h-[21px] bg-[#F8F8F8] rounded-full flex items-center justify-center">
        <span className="font-['Inter:Regular',sans-serif] text-[10px] text-black">3</span>
      </div>
      <div className="absolute left-[22px] bottom-[37px]">
        <div className="relative w-[35px] h-[35px]">
          <svg className="absolute inset-0" viewBox="0 0 35 35">
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
          <svg className="absolute inset-0" viewBox="0 0 35 35" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="#FFE250" strokeWidth="2" strokeDasharray="103.67" strokeDashoffset="38.88" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[10px] text-[#333333] font-bold">3/8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCard4() {
  return (
    <div className="relative h-[234.387px] w-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 235">
        <path d={svgPaths.p2fbefa00} fill="url(#paint0_linear_card4)" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_card4" x1="43.1735" x2="342.886" y1="0" y2="226.364">
            <stop stopColor="#FFE250" />
            <stop offset="1" stopColor="#FFEC8F" />
          </linearGradient>
        </defs>
      </svg>
      <p className="absolute font-['Avenir_Next:Bold',sans-serif] leading-[normal] left-[22px] text-[#282828] text-[24px] top-[22px] w-[283px]">Basic JAZZ Rhythm Practice</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[22px] text-[#dd8100] text-[10px] bottom-[37px]">Primary Course</p>
      <div className="absolute right-[22px] top-[22px] w-[21px] h-[21px] bg-[#F8F8F8] rounded-full flex items-center justify-center">
        <span className="font-['Inter:Regular',sans-serif] text-[10px] text-black">4</span>
      </div>
      <div className="absolute left-[22px] bottom-[37px]">
        <div className="relative w-[35px] h-[35px]">
          <svg className="absolute inset-0" viewBox="0 0 35 35">
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
          <svg className="absolute inset-0" viewBox="0 0 35 35" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="#FFE250" strokeWidth="2" strokeDasharray="103.67" strokeDashoffset="38.88" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[10px] text-[#333333] font-bold">3/8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCard5() {
  return (
    <div className="relative h-[234.387px] w-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 235">
        <path d={svgPaths.p2fbefa00} fill="url(#paint0_linear_card5)" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_card5" x1="43.1735" x2="342.886" y1="0" y2="226.364">
            <stop stopColor="#FFE250" />
            <stop offset="1" stopColor="#FFEC8F" />
          </linearGradient>
        </defs>
      </svg>
      <p className="absolute font-['Avenir_Next:Bold',sans-serif] leading-[normal] left-[22px] text-[#282828] text-[24px] top-[22px] w-[283px]">Basic JAZZ Rhythm Practice</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[22px] text-[#dd8100] text-[10px] bottom-[37px]">Primary Course</p>
      <div className="absolute right-[22px] top-[22px] w-[21px] h-[21px] bg-[#F8F8F8] rounded-full flex items-center justify-center">
        <span className="font-['Inter:Regular',sans-serif] text-[10px] text-black">5</span>
      </div>
      <div className="absolute left-[22px] bottom-[37px]">
        <div className="relative w-[35px] h-[35px]">
          <svg className="absolute inset-0" viewBox="0 0 35 35">
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
          <svg className="absolute inset-0" viewBox="0 0 35 35" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="#FFE250" strokeWidth="2" strokeDasharray="103.67" strokeDashoffset="38.88" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[10px] text-[#333333] font-bold">3/8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 高级课程卡片
function CourseCardAdv3() {
  return (
    <div className="relative h-[234.387px] w-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 235">
        <path d={svgPaths.p2fbefa00} fill="url(#paint0_linear_cardadv3)" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_cardadv3" x1="43.1735" x2="342.886" y1="0" y2="226.364">
            <stop stopColor="#FFCB50" />
            <stop offset="1" stopColor="#FFEC8F" />
          </linearGradient>
        </defs>
      </svg>
      <p className="absolute font-['Avenir_Next:Bold',sans-serif] leading-[normal] left-[22px] text-[#282828] text-[24px] top-[22px] w-[283px]">Advanced JAZZ Rhythm Practice</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[22px] text-[#dd8100] text-[10px] bottom-[37px]">Advanced Course</p>
      <div className="absolute right-[22px] top-[22px] w-[21px] h-[21px] bg-[#F8F8F8] rounded-full flex items-center justify-center">
        <span className="font-['Inter:Regular',sans-serif] text-[10px] text-black">3</span>
      </div>
      <div className="absolute left-[22px] bottom-[37px]">
        <div className="relative w-[35px] h-[35px]">
          <svg className="absolute inset-0" viewBox="0 0 35 35">
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
          <svg className="absolute inset-0" viewBox="0 0 35 35" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="#FFE250" strokeWidth="2" strokeDasharray="103.67" strokeDashoffset="38.88" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[10px] text-[#333333] font-bold">3/8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCardAdv4() {
  return (
    <div className="relative h-[234.387px] w-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 235">
        <path d={svgPaths.p2fbefa00} fill="url(#paint0_linear_cardadv4)" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_cardadv4" x1="43.1735" x2="342.886" y1="0" y2="226.364">
            <stop stopColor="#FFCB50" />
            <stop offset="1" stopColor="#FFEC8F" />
          </linearGradient>
        </defs>
      </svg>
      <p className="absolute font-['Avenir_Next:Bold',sans-serif] leading-[normal] left-[22px] text-[#282828] text-[24px] top-[22px] w-[283px]">Advanced JAZZ Rhythm Practice</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[22px] text-[#dd8100] text-[10px] bottom-[37px]">Advanced Course</p>
      <div className="absolute right-[22px] top-[22px] w-[21px] h-[21px] bg-[#F8F8F8] rounded-full flex items-center justify-center">
        <span className="font-['Inter:Regular',sans-serif] text-[10px] text-black">4</span>
      </div>
      <div className="absolute left-[22px] bottom-[37px]">
        <div className="relative w-[35px] h-[35px]">
          <svg className="absolute inset-0" viewBox="0 0 35 35">
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
          <svg className="absolute inset-0" viewBox="0 0 35 35" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="#FFE250" strokeWidth="2" strokeDasharray="103.67" strokeDashoffset="38.88" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[10px] text-[#333333] font-bold">3/8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCardAdv5() {
  return (
    <div className="relative h-[234.387px] w-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 235">
        <path d={svgPaths.p2fbefa00} fill="url(#paint0_linear_cardadv5)" />
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_cardadv5" x1="43.1735" x2="342.886" y1="0" y2="226.364">
            <stop stopColor="#FFCB50" />
            <stop offset="1" stopColor="#FFEC8F" />
          </linearGradient>
        </defs>
      </svg>
      <p className="absolute font-['Avenir_Next:Bold',sans-serif] leading-[normal] left-[22px] text-[#282828] text-[24px] top-[22px] w-[283px]">Advanced JAZZ Rhythm Practice</p>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[22px] text-[#dd8100] text-[10px] bottom-[37px]">Advanced Course</p>
      <div className="absolute right-[22px] top-[22px] w-[21px] h-[21px] bg-[#F8F8F8] rounded-full flex items-center justify-center">
        <span className="font-['Inter:Regular',sans-serif] text-[10px] text-black">5</span>
      </div>
      <div className="absolute left-[22px] bottom-[37px]">
        <div className="relative w-[35px] h-[35px]">
          <svg className="absolute inset-0" viewBox="0 0 35 35">
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
          <svg className="absolute inset-0" viewBox="0 0 35 35" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="17.5" cy="17.5" r="16.5" fill="none" stroke="#FFE250" strokeWidth="2" strokeDasharray="103.67" strokeDashoffset="38.88" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[10px] text-[#333333] font-bold">3/8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
