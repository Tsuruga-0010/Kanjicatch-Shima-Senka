import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const MIN_KANJI_SIZE = 20;
const MAX_KANJI_SIZE = 40;

const kanjiData = [
  { char: '品', speed: 2, points: 10 },
  { char: '田', speed: 3, points: 25 },
  { char: '遊', speed: 4, points: 50 },
];

const KanjiCatchGame = () => {
  const [gameState, setGameState] = useState('idle');
  const [playerPosition, setPlayerPosition] = useState({ x: GAME_WIDTH / 2 - PLAYER_SIZE / 2, y: GAME_HEIGHT - PLAYER_SIZE });
  const [kanjis, setKanjis] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [popups, setPopups] = useState([]);
  const [caughtKanjis, setCaughtKanjis] = useState([]);
  const [resultSentence, setResultSentence] = useState('');
  const [displayedSentence, setDisplayedSentence] = useState('');
  const [bonusPoints, setBonusPoints] = useState(0);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setKanjis([]);
    setPopups([]);
    setCaughtKanjis([]);
    setResultSentence('');
    setDisplayedSentence('');
    setBonusPoints(0);
  };

  const endGame = () => {
    setGameState('end');
    const sentence = caughtKanjis.join('');
    setResultSentence(sentence);
    const bonus = calculateBonus(sentence);
    setBonusPoints(bonus);
    setScore(prevScore => prevScore + bonus);
    animateSentence(sentence);
  };

  const calculateBonus = (sentence) => {
    const regex = /品田遊/g;
    const matches = sentence.match(regex);
    return matches ? matches.length * 50 : 0;
  };

  const animateSentence = (sentence) => {
    let i = 0;
    const intervalId = setInterval(() => {
      if (i <= sentence.length) {
        setDisplayedSentence(sentence.slice(0, i));
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, 100);
  };

  const movePlayer = useCallback((direction) => {
    setPlayerPosition((prev) => {
      let newX = prev.x;
      let newY = prev.y;
      switch (direction) {
        case 'left':
          newX = Math.max(0, prev.x - 10);
          break;
        case 'right':
          newX = Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x + 10);
          break;
        case 'up':
          newY = Math.max(0, prev.y - 10);
          break;
        case 'down':
          newY = Math.min(GAME_HEIGHT - PLAYER_SIZE, prev.y + 10);
          break;
      }
      return { x: newX, y: newY };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft':
          movePlayer('left');
          break;
        case 'ArrowRight':
          movePlayer('right');
          break;
        case 'ArrowUp':
          movePlayer('up');
          break;
        case 'ArrowDown':
          movePlayer('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setKanjis((prevKanjis) => {
        const movedKanjis = prevKanjis
          .map((kanji) => ({
            ...kanji,
            y: kanji.y + kanji.speed,
          }))
          .filter((kanji) => kanji.y < GAME_HEIGHT);

        const collidedKanjis = movedKanjis.filter(
          (kanji) =>
            kanji.x < playerPosition.x + PLAYER_SIZE &&
            kanji.x + kanji.size > playerPosition.x &&
            kanji.y < playerPosition.y + PLAYER_SIZE &&
            kanji.y + kanji.size > playerPosition.y
        );

        collidedKanjis.forEach((kanji) => {
          const pointsEarned = kanji.isRainbow ? kanji.points * 2 : kanji.points;
          setScore((prevScore) => prevScore + pointsEarned);
          setPopups((prevPopups) => [
            ...prevPopups,
            {
              id: Date.now(),
              points: pointsEarned,
              x: playerPosition.x,
              y: playerPosition.y,
            },
          ]);
          setCaughtKanjis((prevCaughtKanjis) => [...prevCaughtKanjis, kanji.char]);
        });

        const remainingKanjis = movedKanjis.filter(
          (kanji) => !collidedKanjis.includes(kanji)
        );

        if (Math.random() < 0.05) {
          const newKanji = {
            ...kanjiData[Math.floor(Math.random() * kanjiData.length)],
            x: Math.random() * (GAME_WIDTH - MAX_KANJI_SIZE),
            y: 0,
            size: Math.floor(Math.random() * (MAX_KANJI_SIZE - MIN_KANJI_SIZE + 1)) + MIN_KANJI_SIZE,
            isRainbow: Math.random() < 0.1,
          };
          return [...remainingKanjis, newKanji];
        }

        return remainingKanjis;
      });

      setTimeLeft((prevTime) => {
        if (prevTime <= 0.05) {
          clearInterval(gameLoop);
          endGame();
          return 0;
        }
        return prevTime - 0.05;
      });

      setPopups((prevPopups) =>
        prevPopups.filter((popup) => Date.now() - popup.id < 500)
      );
    }, 50);

    return () => {
      clearInterval(gameLoop);
    };
  }, [gameState, playerPosition]);

  const rainbowAnimation = `
    @keyframes rainbow {
      0% { color: red; }
      14% { color: orange; }
      28% { color: yellow; }
      42% { color: green; }
      57% { color: blue; }
      71% { color: indigo; }
      85% { color: violet; }
      100% { color: red; }
    }
  `;

  const renderSentence = () => {
    const regex = /(品田遊)/g;
    return displayedSentence.split(regex).map((part, index) => 
      part === '品田遊' ? 
        <span key={index} className="text-red-500 font-bold">{part}</span> : 
        <span key={index}>{part}</span>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <style>{rainbowAnimation}</style>
      <div className="relative bg-white" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={startGame}>スタート</Button>
          </div>
        )}
        <div className="absolute top-2 right-2 text-lg font-bold">
          スコア: {score} | 残り時間: {Math.ceil(timeLeft)}秒
        </div>
        {gameState === 'playing' && (
          <>
            <div
              className="absolute bg-blue-500"
              style={{
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                left: playerPosition.x,
                top: playerPosition.y,
              }}
            />
            {kanjis.map((kanji, index) => (
              <div
                key={index}
                className={`absolute font-bold ${kanji.isRainbow ? 'animate-[rainbow_2s_linear_infinite]' : ''}`}
                style={{
                  left: kanji.x,
                  top: kanji.y,
                  width: kanji.size,
                  height: kanji.size,
                  fontSize: `${kanji.size}px`,
                  lineHeight: `${kanji.size}px`,
                }}
              >
                {kanji.char}
              </div>
            ))}
            {popups.map((popup) => (
              <div
                key={popup.id}
                className="absolute font-bold text-green-500 animate-[fadeOutUp_0.5s_ease-out]"
                style={{
                  left: popup.x,
                  top: popup.y - 20,
                }}
              >
                +{popup.points}
              </div>
            ))}
          </>
        )}
        {gameState === 'end' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
            <div className="text-2xl font-bold mb-4">ゲーム終了！</div>
            <div className="text-xl mb-4">最終スコア: {score}</div>
            {bonusPoints > 0 && (
              <div className="text-xl mb-4 text-red-500">ボーナス！ {bonusPoints}点</div>
            )}
            <div className="text-lg mb-4 w-3/4 text-center">
              あなたの成績は…
              <br />
              {renderSentence()}
            </div>
            <Button onClick={startGame}>もう一度プレイ</Button>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button onClick={() => movePlayer('left')}><ChevronLeft /></Button>
        <div className="grid grid-cols-1 gap-2">
          <Button onClick={() => movePlayer('up')}><ChevronUp /></Button>
          <Button onClick={() => movePlayer('down')}><ChevronDown /></Button>
        </div>
        <Button onClick={() => movePlayer('right')}><ChevronRight /></Button>
      </div>
    </div>
  );
};

export default KanjiCatchGame;
