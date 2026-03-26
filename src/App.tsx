import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;

const TRACKS = [
  { id: 1, title: "Neon Pulse (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Cybernetic Dreams (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Synthwave Rider (AI Gen)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

// --- Helper Functions ---
const generateFood = (snake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) break;
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameRunning(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !isGameRunning) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { x: head.x + direction.x, y: head.y + direction.y };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isGameRunning]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevent scrolling
      }

      if (!isGameRunning && !gameOver && e.key === 'Enter') {
        setIsGameRunning(true);
      }

      setDirection(prev => {
        // Prevent 180 degree turns
        switch (e.key) {
          case 'ArrowUp':
            return prev.y === 1 ? prev : { x: 0, y: -1 };
          case 'ArrowDown':
            return prev.y === -1 ? prev : { x: 0, y: 1 };
          case 'ArrowLeft':
            return prev.x === 1 ? prev : { x: -1, y: 0 };
          case 'ArrowRight':
            return prev.x === -1 ? prev : { x: 1, y: 0 };
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-[#000] text-[#0ff] font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden tear">
      <div className="static-noise"></div>
      <div className="scanline"></div>

      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Audio Subsystem */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full max-w-sm mx-auto">
          <div className="bg-[#000] border-2 border-[#f0f] p-6 flex flex-col items-start relative shadow-[4px_4px_0px_#0ff]">
            <div className="absolute top-0 left-0 bg-[#f0f] text-[#000] px-2 text-sm font-bold">AUDIO_SUBSYS</div>
            
            <h2 className="text-2xl font-bold text-[#0ff] mt-4 mb-2 glitch" data-text="STREAM_ACTIVE">STREAM_ACTIVE</h2>
            <p className="text-sm text-[#f0f] mb-6 truncate w-full border-b border-[#0ff] pb-2">
              {">"} {TRACKS[currentTrackIndex].title}
            </p>

            <audio 
              ref={audioRef} 
              src={TRACKS[currentTrackIndex].url} 
              onEnded={handleTrackEnded}
              className="hidden"
            />

            <div className="flex items-center gap-4 mb-4 w-full justify-between text-xl">
              <button onClick={prevTrack} className="hover:text-[#f0f] hover:bg-[#0ff] px-2 transition-none border border-transparent hover:border-[#f0f]">
                [{"<<"}]
              </button>
              <button onClick={togglePlay} className="text-[#f0f] hover:text-[#000] hover:bg-[#f0f] px-4 py-1 border border-[#f0f] transition-none">
                {isPlaying ? "[ || ]" : "[ > ]"}
              </button>
              <button onClick={nextTrack} className="hover:text-[#f0f] hover:bg-[#0ff] px-2 transition-none border border-transparent hover:border-[#f0f]">
                [{">>"}]
              </button>
            </div>

            <div className="flex items-center gap-2 w-full justify-start text-sm">
              <button onClick={() => setIsMuted(!isMuted)} className="text-[#0ff] hover:bg-[#0ff] hover:text-[#000] px-2 border border-[#0ff] transition-none">
                VOL: {isMuted ? "MUTE" : "100%"}
              </button>
            </div>
          </div>

          {/* Track List */}
          <div className="bg-[#000] border-2 border-[#0ff] p-4 relative shadow-[4px_4px_0px_#f0f]">
            <div className="absolute top-0 right-0 bg-[#0ff] text-[#000] px-2 text-sm font-bold">INDEX</div>
            <ul className="space-y-2 mt-4">
              {TRACKS.map((track, idx) => (
                <li 
                  key={track.id}
                  onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                  className={`cursor-pointer text-sm p-1 transition-none ${
                    idx === currentTrackIndex 
                      ? 'bg-[#f0f] text-[#000] border border-[#f0f]' 
                      : 'text-[#0ff] hover:bg-[#0ff] hover:text-[#000] border border-transparent'
                  }`}
                >
                  {idx === currentTrackIndex ? "> " : "  "}{track.id.toString().padStart(2, '0')} // {track.title}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Snake Game */}
        <div className="lg:col-span-2 flex flex-col items-center w-full">
          <div className="w-full max-w-[500px] flex justify-between items-end mb-2 px-2 border-b-2 border-[#f0f] pb-2">
            <div>
              <h1 className="text-4xl font-black text-[#0ff] tracking-widest glitch" data-text="EXEC // SNAKE.EXE">EXEC // SNAKE.EXE</h1>
              <p className="text-xs text-[#f0f] mt-1">AWAITING_INPUT: [ARROWS]</p>
            </div>
            <div className="text-xl font-bold text-[#0ff] flex flex-col items-end">
              <span className="text-[10px] text-[#f0f]">DATA_FRAGMENTS</span>
              <span>0x{score.toString(16).padStart(4, '0').toUpperCase()}</span>
            </div>
          </div>

          <div className="relative bg-[#000] border-4 border-[#0ff] p-1 w-full max-w-[500px] shadow-[8px_8px_0px_#f0f]">
            <div 
              className="grid bg-[#000] w-full aspect-square relative"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some(segment => segment.x === x && segment.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={i} 
                    className={`
                      w-full h-full border-[0.5px] border-[#0ff]/20
                      ${isHead ? 'bg-[#fff] z-10' : ''}
                      ${isSnake && !isHead ? 'bg-[#0ff]' : ''}
                      ${isFood ? 'bg-[#f0f] animate-pulse' : ''}
                    `}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-[#000]/80 flex flex-col items-center justify-center z-20">
                <button 
                  onClick={() => setIsGameRunning(true)}
                  className="px-6 py-2 bg-[#000] text-[#0ff] border-2 border-[#0ff] font-bold text-xl hover:bg-[#0ff] hover:text-[#000] transition-none uppercase tracking-wider shadow-[4px_4px_0px_#f0f] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                >
                  INIT_SEQUENCE
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-[#000]/90 flex flex-col items-center justify-center z-20 border-4 border-[#f0f]">
                <h2 className="text-4xl font-black text-[#f0f] mb-2 glitch" data-text="FATAL_ERR: 0x0000">FATAL_ERR: 0x0000</h2>
                <p className="text-xl text-[#0ff] mb-6">FRAGMENTS_LOST: 0x{score.toString(16).padStart(4, '0').toUpperCase()}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-2 bg-[#000] text-[#f0f] border-2 border-[#f0f] font-bold text-xl hover:bg-[#f0f] hover:text-[#000] transition-none uppercase tracking-wider shadow-[4px_4px_0px_#0ff] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                >
                  REBOOT_SYS
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
