/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, ReactNode, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Facebook, Github, Mail, Play, Info, RotateCcw, X } from 'lucide-react';

// --- Constants ---
const GAME_DURATION = 40.00;
const FIXED_WATER_BLUE = '#B2EBF2'; // Light blue from the image

type Language = 'zh-TW' | 'en' | 'ja';

const TRANSLATIONS = {
  'zh-TW': {
    name: '王子軒 | Phillip Wang',
    title: '臺灣科技大學 應科所丙組 博士班一年級',
    gamification: '遊戲化 | Gamification',
    edutech: 'EduTech',
    score: '得分',
    time: '時間',
    startGame: '開始遊戲',
    retry: '重新開始',
    playing: '遊戲中...',
    rules: '遊戲規則',
    rule1: '點擊右上角的 Start Game 開始 40 秒挑戰。',
    rule2: '點擊 正常的魚 (🐟, 🐠, 🐡) 可獲得 +10 積分。',
    rule3: '點擊 不正常的生物 (🐙, 鯊魚, 螃蟹) 會扣除 -15 積分。',
    rule4: '名片中間地帶為"休戰區"，無法被點擊!!',
    gotIt: '我知道了',
    timesUp: '時間到！',
    finalScore: '最終得分',
    playAgain: '再玩一次',
    close: '關閉',
    correct: '正確',
    wrong: '錯誤'
  },
  'en': {
    name: 'Phillip Wang',
    title: 'NTUST, Applied Science, PhD Student (Y1)',
    gamification: 'Gamification',
    edutech: 'EduTech',
    score: 'Score',
    time: 'Time',
    startGame: 'Start Game',
    retry: 'Retry',
    playing: 'Playing...',
    rules: 'Rules',
    rule1: 'Click Start Game to begin the 40s challenge.',
    rule2: 'Click normal fish (🐟, 🐠, 🐡) for +10 points.',
    rule3: 'Click abnormal creatures (🐙, 🦈, 🦀) for -15 points.',
    rule4: 'The center of the card is a "Truce Zone" and cannot be clicked!!',
    gotIt: 'Got it',
    timesUp: "Time's Up!",
    finalScore: 'Final Score',
    playAgain: 'Play Again',
    close: 'Close',
    correct: 'Correct',
    wrong: 'Wrong'
  },
  'ja': {
    name: '王子軒 | フィリップ・ワン',
    title: '台湾科技大学 応用科学研究科 博士課程1年',
    gamification: 'ゲーミフィケーション',
    edutech: 'エデュテック',
    score: 'スコア',
    time: '時間',
    startGame: 'ゲーム開始',
    retry: 'もう一度',
    playing: 'プレイ中...',
    rules: 'ルール',
    rule1: 'Start Gameをクリックして40秒の挑戦を開始します。',
    rule2: '普通の魚 (🐟, 🐠, 🐡) をクリックすると +10 点。',
    rule3: '異常な生物 (🐙, 🦈, 🦀) をクリックすると -15 点。',
    rule4: '名片の中央エリアは「休戦区」であり、クリックできません!!',
    gotIt: '了解',
    timesUp: 'タイムアップ！',
    finalScore: '最終スコア',
    playAgain: 'もう一度遊ぶ',
    close: '閉じる',
    correct: '正解',
    wrong: '不正解'
  }
};

type FishType = 'good' | 'bad' | 'neutral';

interface Fish {
  id: number;
  type: FishType;
  x: number;
  y: number;
  speed: number;
  direction: number; // 1 for right, -1 for left
  size: number;
  emoji: string;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface Feedback {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const GOOD_FISH_EMOJIS = ['🐟', '🐠', '🐡', '🐬', '🐳'];
const BAD_FISH_EMOJIS = ['🐙', '🦑', '🦈', '🦐', '🦀'];
const NEUTRAL_FISH_EMOJIS = ['🐚', '🐌', '🐢', '🦞', '🐧', '🌊', '🌿'];

export default function App() {
  // --- State ---
  const [language, setLanguage] = useState<Language>('zh-TW');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [showRules, setShowRules] = useState(false);
  const [fishList, setFishList] = useState<Fish[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  const t = TRANSLATIONS[language];
  
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);

  // --- Click Effects ---
  const addBubble = (x: number, y: number) => {
    const id = Math.random();
    // Create multiple bubbles for a more "bubbly" effect
    const bubbleCount = 3;
    for (let i = 0; i < bubbleCount; i++) {
      const subId = id + i;
      const size = Math.random() * 20 + 15;
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;
      setBubbles(prev => [...prev, { id: subId, x: x + offsetX, y: y + offsetY, size }]);
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== subId));
      }, 1200);
    }
  };

  const addFeedback = (x: number, y: number, text: string, color: string) => {
    const id = Math.random();
    setFeedbacks(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }, 1000);
  };

  const addRipple = (x: number, y: number) => {
    const id = Math.random();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
  };

  // --- Game Logic ---
  const spawnFish = useCallback(() => {
    const id = Math.random();
    const rand = Math.random();
    let type: FishType;
    if (rand > 0.6) type = 'good';
    else if (rand > 0.3) type = 'bad';
    else type = 'neutral';

    const direction = Math.random() > 0.5 ? 1 : -1;
    const x = direction === 1 ? -100 : window.innerWidth + 100;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    const speed = Math.random() * 2 + 1;
    const size = Math.random() * 30 + 40; // Larger fish
    
    let emoji = '';
    if (type === 'good') emoji = GOOD_FISH_EMOJIS[Math.floor(Math.random() * GOOD_FISH_EMOJIS.length)];
    else if (type === 'bad') emoji = BAD_FISH_EMOJIS[Math.floor(Math.random() * BAD_FISH_EMOJIS.length)];
    else emoji = NEUTRAL_FISH_EMOJIS[Math.floor(Math.random() * NEUTRAL_FISH_EMOJIS.length)];

    return { id, type, x, y, speed, direction, size, emoji };
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameStatus('playing');
    setFishList([]);
  };

  const handleFishClick = (fish: Fish, e: MouseEvent) => {
    if (gameStatus !== 'playing') return;
    
    if (fish.type === 'good') {
      setScore(s => s + 10);
      addFeedback(e.clientX, e.clientY, t.correct, 'text-green-500');
    } else if (fish.type === 'bad') {
      setScore(s => Math.max(0, s - 15));
      addFeedback(e.clientX, e.clientY, t.wrong, 'text-red-500');
    } else {
      addRipple(e.clientX, e.clientY);
    }
    
    setFishList(prev => prev.filter(f => f.id !== fish.id));
  };

  // Timer Effect
  useEffect(() => {
    let timer: number;
    if (gameStatus === 'playing' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          const next = Math.max(0, prev - 0.01);
          if (next <= 0) {
            setGameStatus('finished');
            return 0;
          }
          return next;
        });
      }, 10);
    }
    return () => clearInterval(timer);
  }, [gameStatus, timeLeft]);

  // Game Loop for Fish Movement
  useEffect(() => {
    const update = (time: number) => {
      if (gameStatus === 'playing') {
        // Spawn fish every 1.5 seconds
        if (time - lastSpawnTime.current > 1500) {
          setFishList(prev => [...prev, spawnFish()]);
          lastSpawnTime.current = time;
        }

        // Move fish
        setFishList(prev => 
          prev
            .map(f => ({ ...f, x: f.x + f.speed * f.direction }))
            .filter(f => (f.direction === 1 ? f.x < window.innerWidth + 200 : f.x > -200))
        );
      }
      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStatus, spawnFish]);

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center transition-colors duration-1000 ease-in-out font-sans select-none touch-none"
      style={{ backgroundColor: FIXED_WATER_BLUE }}
      onPointerDown={(e) => {
        addBubble(e.clientX, e.clientY);
        if (gameStatus === 'playing') {
          addRipple(e.clientX, e.clientY);
        }
      }}
    >
      {/* --- Language Switcher (Top Left) --- */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 flex gap-1 sm:gap-2">
        {(['zh-TW', 'en', 'ja'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all border ${
              language === lang
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : 'bg-white/60 text-gray-700 border-white/40 hover:bg-white/80'
            }`}
          >
            {lang === 'zh-TW' ? '繁中' : lang === 'en' ? 'EN' : '日本語'}
          </button>
        ))}
      </div>

      {/* --- Seawater Flow Effect Overlay --- */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse" />

      {/* --- Bubbles Layer --- */}
      <AnimatePresence>
        {bubbles.map(bubble => (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0.6, scale: 0.5, y: bubble.y }}
            animate={{ opacity: 0, scale: 1.5, y: bubble.y - 100 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-full border-2 border-white/40 pointer-events-none"
            style={{ 
              left: bubble.x, 
              top: bubble.y, 
              width: bubble.size, 
              height: bubble.size,
              marginLeft: -bubble.size / 2,
              marginTop: -bubble.size / 2
            }}
          />
        ))}
      </AnimatePresence>

      {/* --- Feedback Layer --- */}
      <AnimatePresence>
        {feedbacks.map(fb => (
          <motion.div
            key={fb.id}
            initial={{ opacity: 1, y: fb.y, scale: 0.8 }}
            animate={{ opacity: 0, y: fb.y - 120, scale: 2.5 }}
            className={`absolute font-black text-3xl sm:text-5xl pointer-events-none z-[60] drop-shadow-lg ${fb.color}`}
            style={{ left: fb.x, top: fb.y, marginLeft: '-1rem' }}
          >
            {fb.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* --- Ripple Layer --- */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0.6, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute border-2 border-white/40 rounded-full pointer-events-none z-[55]"
            style={{ 
              left: r.x, 
              top: r.y, 
              width: '40px', 
              height: '40px', 
              marginLeft: '-20px', 
              marginTop: '-20px' 
            }}
          />
        ))}
      </AnimatePresence>

      {/* --- Game UI (Top Right) --- */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end gap-2 sm:gap-3 z-50">
        <div className="flex items-center gap-2 sm:gap-4 bg-white/40 backdrop-blur-md px-3 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm border border-white/20">
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-gray-600 font-semibold">{t.score}</span>
            <span className="text-lg sm:text-2xl font-bold text-gray-800 tabular-nums">{score}</span>
          </div>
          <div className="w-[1px] h-6 sm:h-8 bg-gray-400/30" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-gray-600 font-semibold">{t.time}</span>
            <span className="text-lg sm:text-2xl font-bold text-gray-800 tabular-nums">{timeLeft.toFixed(2)}s</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="p-2 sm:p-3 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-sm border border-white/30 text-gray-700"
            title={t.rules}
          >
            <Info size={16} className="sm:w-5 sm:h-5" />
          </button>
          
          {gameStatus === 'idle' || gameStatus === 'finished' ? (
            <button 
              onClick={startGame}
              className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg font-semibold text-xs sm:text-base"
            >
              {gameStatus === 'finished' ? <RotateCcw size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={14} className="sm:w-[18px] sm:h-[18px]" />}
              {gameStatus === 'finished' ? t.retry : t.startGame}
            </button>
          ) : (
            <div className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-400/20 backdrop-blur-md text-gray-600 rounded-lg sm:rounded-xl border border-white/20 font-semibold text-xs sm:text-base">
              {t.playing}
            </div>
          )}
        </div>
      </div>

      {/* --- Fish Layer --- */}
      <div className="absolute inset-0 pointer-events-none">
        {fishList.map(fish => (
          <motion.div
            key={fish.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, x: fish.x, y: fish.y }}
            className="absolute pointer-events-auto cursor-pointer"
            style={{ 
              fontSize: fish.size,
              transform: `scaleX(${fish.direction})`,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleFishClick(fish, e);
              addBubble(e.clientX, e.clientY);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
          >
            {fish.emoji}
          </motion.div>
        ))}
      </div>

      {/* --- Main Profile Card --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Avatar Image */}
        <div className="relative mb-8 sm:mb-16 group">
          <div className="w-40 h-40 sm:w-64 sm:h-64 bg-white/30 backdrop-blur-xl rounded-[3rem] sm:rounded-[5rem] flex items-center justify-center shadow-2xl border border-white/40 transform rotate-12 group-hover:rotate-0 transition-transform duration-500 overflow-hidden">
             <div 
               className="w-full h-full bg-cover bg-center bg-no-repeat"
               style={{ 
                 backgroundImage: `url('https://lh3.googleusercontent.com/d/13zihoNG6m9PRtnKc7gTkaP_ePMua9WE2')`,
                 backgroundColor: '#f3f4f6'
               }}
               role="img"
               aria-label="Phillip Wang"
             />
          </div>
          <div className="absolute -inset-4 bg-white/10 rounded-[4rem] sm:rounded-[6rem] -z-10 blur-2xl opacity-50" />
        </div>

        {/* Name & Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-gray-900 tracking-tight mb-4">
          {t.name}
        </h1>
        <p className="text-lg sm:text-2xl md:text-3xl text-gray-700 font-medium mb-2">
          {t.title}
        </p>
        
        {/* Keywords */}
        <div className="flex gap-4 sm:gap-6 mb-10 sm:mb-20">
          <span className="text-sm sm:text-xl md:text-2xl font-bold tracking-widest uppercase text-[#D4AF37]">
            {t.gamification}
          </span>
          <span className="text-sm sm:text-xl md:text-2xl font-bold tracking-widest uppercase text-[#D4AF37]">
            {t.edutech}
          </span>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full">
          <SocialButton icon={<Instagram className="w-8 h-8 sm:w-11 sm:h-11" />} label="IG" href="https://instagram.com" />
          <SocialButton icon={<Facebook className="w-8 h-8 sm:w-11 sm:h-11" />} label="FB" href="https://facebook.com" />
          <SocialButton icon={<Github className="w-8 h-8 sm:w-11 sm:h-11" />} label="GitHub" href="https://github.com" />
          <SocialButton icon={<Mail className="w-8 h-8 sm:w-11 sm:h-11" />} label="Email" href="mailto:example@mail.com" />
        </div>
      </motion.div>

      {/* --- Rules Modal --- */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info className="text-blue-500" /> {t.rules}
              </h2>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                  <p>{t.rule1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                  <p>{t.rule2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                  <p>{t.rule3}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                  <p>{t.rule4}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowRules(false)}
                className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
              >
                {t.gotIt}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Game Over Overlay --- */}
      <AnimatePresence>
        {gameStatus === 'finished' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none p-6"
          >
            <div className="bg-white/90 backdrop-blur-xl px-6 py-8 sm:px-12 sm:py-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/50 text-center pointer-events-auto relative w-full max-w-md">
              <button 
                onClick={() => setGameStatus('idle')}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
              <h3 className="text-[10px] sm:text-sm font-bold tracking-widest uppercase text-gray-500 mb-2">{t.timesUp}</h3>
              <p className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 sm:mb-8">{t.finalScore}: {score}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button 
                  onClick={startGame}
                  className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-sm sm:text-base"
                >
                  {t.playAgain}
                </button>
                <button 
                  onClick={() => setGameStatus('idle')}
                  className="px-6 py-3 sm:px-8 sm:py-4 bg-gray-200 text-gray-700 rounded-xl sm:rounded-2xl font-bold hover:bg-gray-300 transition-all active:scale-95 text-sm sm:text-base"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SocialButton({ icon, label, href }: { icon: ReactNode, label: string, href: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center justify-center gap-2 sm:gap-4 p-4 sm:p-8 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-[3rem] border border-white/30 shadow-sm transition-colors group"
    >
      <div className="text-gray-700 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] sm:text-lg font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </motion.a>
  );
}
