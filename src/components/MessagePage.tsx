import { useState, useEffect, useRef } from 'react';
import svgPaths from "../imports/svg-xh4gozw5o2";

const TOTAL_FRAMES = 104;
const FPS = 30;
const FRAME_DURATION = 1000 / FPS;

function KoalaClimbAnimation() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getFramePath = (frameIndex: number) => {
    const paddedIndex = frameIndex.toString().padStart(5, '0');
    return `/KoalaClimb/KoalaClimb_${paddedIndex}.png`;
  };

  const playAnimation = () => {
    if (isPlaying) return;
    
    console.log('🎬 Starting Koala Climb animation...');
    setIsPlaying(true);
    
    let frame = 0;
    setCurrentFrame(0);
    
    intervalRef.current = setInterval(() => {
      frame++;
      
      if (frame >= TOTAL_FRAMES) {
        console.log('✅ Koala Climb animation finished!');
        setCurrentFrame(TOTAL_FRAMES - 1);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
      } else {
        setCurrentFrame(frame);
      }
    }, FRAME_DURATION);
  };

  useEffect(() => {
    console.log('🐨 Koala Climb Animation mounted, starting animation...');
    const timer = setTimeout(() => {
      playAnimation();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <img 
      alt="Koala Climbing" 
      className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" 
      src={getFramePath(currentFrame)}
      style={{ 
        userSelect: 'none'
      }}
    />
  );
}

function Group4() {
  return (
    <div className="absolute h-[189px] left-[calc(50%-0.25px)] top-[-22px] translate-x-[-50%] w-[467.5px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 468 189">
        <g id="Group 1437253155">
          <path d={svgPaths.p3ceddd00} fill="var(--fill-0, #FFE250)" id="Vector 63" />
          <path d={svgPaths.p23db2c00} fill="var(--fill-0, #FFE250)" id="Vector 64" />
        </g>
      </svg>
    </div>
  );
}

function Component() {
  return (
    <div className="absolute h-[996.066px] left-[-104px] top-[-93px] w-[622.312px]" data-name="流体背景">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 623 997">
        <g id="æµä½èæ¯" opacity="0.48">
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
  );
}

function Heart() {
  return (
    <div className="absolute aspect-[24/24] left-[3.15%] overflow-clip right-[3.47%] top-[2.46px]" data-name="heart">
      <div className="absolute inset-[12.49%_6.45%_11.54%_6.45%]" data-name="Vector">
        <div className="absolute inset-[-5.14%_-4.48%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 22">
            <path d={svgPaths.p3a044100} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function User() {
  return (
    <div className="absolute left-[42.54px] overflow-clip size-[27.446px] top-[550.29px]" data-name="user">
      <Heart />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[26px] top-[535px]">
      <div className="absolute left-[26px] size-[60px] top-[535px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
          <circle cx="30" cy="30" fill="var(--fill-0, #FF8356)" id="Ellipse 38" r="30" />
        </svg>
      </div>
      <User />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents leading-[0] left-[101px] not-italic top-[547.2px]">
      <div className="absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[17.049px] justify-center left-[101px] text-[#333333] text-[18px] top-[555.72px] translate-y-[-50%] w-[96.01px]">
        <p className="leading-[normal]">Likes</p>
      </div>
      <div className="absolute flex flex-col font-['Avenir_Next:Regular',sans-serif] h-[17px] justify-center left-[102px] text-[#797979] text-[14px] top-[576.5px] translate-y-[-50%] w-[295px]">
        <p className="leading-[normal]">Your Mom liked your video.</p>
      </div>
    </div>
  );
}

function LikesSection() {
  return (
    <div className="absolute contents left-[26px] top-[535px]" data-name="LikesSection">
      <div className="absolute bg-white h-[59px] left-[26px] rounded-bl-[90px] rounded-br-[16px] rounded-tl-[90px] rounded-tr-[16px] top-[535px] w-[380px]" />
      <Group1 />
      <Group6 />
      <div className="absolute flex flex-col font-['Avenir_Next:Regular',sans-serif] h-[17.049px] justify-center leading-[0] left-[390.37px] not-italic text-[#aeaeae] text-[12px] text-right top-[555.52px] translate-x-[-100%] translate-y-[-50%] w-[241.371px]">
        <p className="leading-[normal]">12:31</p>
      </div>
      <div className="absolute border-[0.5px] border-[rgba(0,0,0,0.15)] border-solid h-[60px] left-[26px] rounded-bl-[90px] rounded-br-[16px] rounded-tl-[90px] rounded-tr-[16px] top-[535px] w-[380px]" />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute left-[26px] size-[60px] top-[605px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="Group 1437253150">
          <circle cx="30" cy="30" fill="var(--fill-0, #FFA959)" id="Ellipse 38" r="30" />
          <g id="user">
            <path d={svgPaths.p10907d80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d={svgPaths.pdc2e500} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents leading-[0] left-[101px] not-italic top-[618.98px]">
      <div className="absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[17.049px] justify-center left-[101px] text-[#333333] text-[18px] top-[627.51px] translate-y-[-50%] w-[115.751px]">
        <p className="leading-[normal]">Packages</p>
      </div>
      <div className="absolute flex flex-col font-['Avenir_Next:Regular',sans-serif] h-[17px] justify-center left-[102px] text-[#797979] text-[14px] top-[648.5px] translate-y-[-50%] w-[284px]">
        <p className="leading-[normal]">Your package will arriving tomorrow.</p>
      </div>
    </div>
  );
}

function PackagesSection() {
  return (
    <div className="absolute contents left-[26px] top-[605px]" data-name="PackagesSection">
      <div className="absolute bg-[#fff4c9] h-[60px] left-[26px] rounded-bl-[90px] rounded-br-[16px] rounded-tl-[90px] rounded-tr-[16px] top-[605px] w-[380px]" />
      <Group2 />
      <Group5 />
      <div className="absolute border border-[rgba(255,166,0,0.25)] border-solid h-[60px] left-[26px] rounded-bl-[90px] rounded-br-[16px] rounded-tl-[90px] rounded-tr-[16px] top-[605px] w-[380px]" />
      <div className="absolute flex flex-col font-['Avenir_Next:Regular',sans-serif] h-[17.049px] justify-center leading-[0] left-[390.37px] not-italic text-[#aeaeae] text-[12px] text-right top-[625.52px] translate-x-[-100%] translate-y-[-50%] w-[241.371px]">
        <p className="leading-[normal]">12:31</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute left-[26px] size-[60px] top-[679px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="Group 1437253150">
          <path d={svgPaths.p43a0580} fill="var(--fill-0, #FFA9A7)" id="Ellipse 38" />
          <g id="Icon/Settings">
            <g id="Vector"></g>
            <path d={svgPaths.p2d540c00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d={svgPaths.p25794080} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents leading-[0] left-[101px] not-italic top-[691.43px]">
      <div className="absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[17.049px] justify-center left-[101px] text-[#333333] text-[18px] top-[699.95px] translate-y-[-50%] w-[96.01px]">
        <p className="leading-[normal]">System</p>
      </div>
      <div className="absolute flex flex-col font-['Avenir_Next:Regular',sans-serif] h-[17px] justify-center left-[101px] text-[#797979] text-[14px] top-[720.5px] translate-y-[-50%] w-[305px]">
        <p className="leading-[normal]">Please check the latest privacy policy</p>
      </div>
    </div>
  );
}

function SystemSection() {
  return (
    <div className="absolute contents left-[26px] top-[679px]" data-name="systemSection">
      <div className="absolute bg-white h-[60px] left-[26px] rounded-bl-[90px] rounded-br-[16px] rounded-tl-[90px] rounded-tr-[16px] top-[679px] w-[380px]" />
      <Group3 />
      <Group7 />
      <div className="absolute border-[0.5px] border-[rgba(0,0,0,0.15)] border-solid h-[60px] left-[26px] rounded-bl-[90px] rounded-br-[16px] rounded-tl-[90px] rounded-tr-[16px] top-[679px] w-[380px]" />
      <div className="absolute flex flex-col font-['Avenir_Next:Regular',sans-serif] h-[17.049px] justify-center leading-[0] left-[390.37px] not-italic text-[#aeaeae] text-[12px] text-right top-[699.52px] translate-x-[-100%] translate-y-[-50%] w-[241.371px]">
        <p className="leading-[normal]">12:31</p>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents leading-[0] left-[66.72px] text-center top-[360.88px]">
      <div className="[text-shadow:rgba(0,0,0,0.25)_0px_1px_2px] absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[47.269px] justify-center left-[214.98px] not-italic text-[#603b00] text-[30px] top-[384.52px] translate-x-[-50%] translate-y-[-50%] w-[296.518px]">
        <p className="leading-[normal]">Gifts from mon!</p>
      </div>
      <div className="absolute flex flex-col font-['Avenir_Next:Bold','Noto_Sans_JP:Bold',sans-serif] h-[28.361px] justify-center left-[214.98px] text-[#dd8100] text-[14px] top-[427.24px] translate-x-[-50%] translate-y-[-50%] w-[296.518px]" style={{ fontVariationSettings: "'wght' 700" }}>
        <p className="leading-[normal]">Number：416516445</p>
      </div>
    </div>
  );
}

function GiftCard() {
  return (
    <div className="absolute contents left-[8px] top-[109px]" data-name="GiftCard">
      <div className="absolute h-[359px] left-[calc(50%+2px)] top-[109px] translate-x-[-50%] w-[418px]" data-name="giftCard 2">
        <KoalaClimbAnimation />
      </div>
    </div>
  );
}

function Refrshicon() {
  return (
    <div className="absolute right-[25px] size-[40px] top-[72px]" data-name="refrshicon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g id="refrshicon">
          <g id="Ellipse 54">
            <circle cx="20" cy="20" fill="var(--fill-0, white)" r="20" />
            <circle cx="20" cy="20" r="19.5" stroke="var(--stroke-0, black)" strokeOpacity="0.1" />
          </g>
          <g id="Group 1437252976">
            <path d={svgPaths.p3153ae00} fill="var(--fill-0, #343434)" id="Orientation Lock" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function MessagePage() {
  return (
    <div 
      className="relative" 
      data-name="主层级-消息" 
      style={{ 
        width: '430px',
        minHeight: '932px',
        backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%), linear-gradient(90deg, rgb(255, 247, 212) 0%, rgb(255, 247, 212) 100%)" 
      }}
    >
      <Group4 />
      <Component />
      <div className="absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[24px] justify-center leading-[0] left-[25px] not-italic text-[24px] text-black top-[503px] translate-y-[-50%] w-[127px]">
        <p className="leading-[normal]">Latest</p>
      </div>
      <LikesSection />
      <PackagesSection />
      <SystemSection />
      <div className="absolute h-0 left-[26px] top-[474px] w-[378px]">
        <div className="absolute bottom-[-0.25px] left-0 right-0 top-[-0.25px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 378 1">
            <path d="M378 0.25H0" id="fengexian" stroke="var(--stroke-0, #797979)" strokeWidth="0.5" />
          </svg>
        </div>
      </div>
      <GiftCard />
      <Refrshicon />
      <div className="absolute flex flex-col font-['Avenir_Next:Bold',sans-serif] h-[41px] justify-center leading-[0] left-[25px] not-italic text-[26px] text-black top-[91.5px] translate-y-[-50%] w-[141px]">
        <p className="leading-[normal]">Message</p>
      </div>
    </div>
  );
}
