import { useEffect, useRef, useState } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import './MomLoveRun.css';

const laneLeftMap = ['18%', '50%', '82%'];
const LEVEL_STEP = 3;
const MAX_MISS = 5;

const loveItems = {
  flower: { type: 'flower', icon: '🌸', label: 'Cicek', color: '#ff9ff3' },
  gift: { type: 'gift', icon: '🎁', label: 'Hediye', color: '#feca57' },
  letter: { type: 'letter', icon: '💌', label: 'Mektup', color: '#54a0ff' }
};

const obstacles = [
  { type: 'puddle', icon: '💦', label: 'Su Birikintisi', color: '#74b9ff' },
  { type: 'toy', icon: '🧸', label: 'Oyuncak', color: '#ff7675' }
];

const randomLane = () => Math.floor(Math.random() * 3);
const randomItemType = () => {
  const keys = Object.keys(loveItems);
  return keys[Math.floor(Math.random() * keys.length)];
};
const randomObstacle = () => obstacles[Math.floor(Math.random() * obstacles.length)];

const createObject = (id) => {
  const lane = randomLane();
  const roll = Math.random();

  if (roll < 0.58) {
    const type = randomItemType();
    return {
      id,
      lane,
      y: -10,
      kind: 'collect',
      ...loveItems[type]
    };
  }

  if (roll < 0.8) {
    const obstacle = randomObstacle();
    return {
      id,
      lane,
      y: -10,
      kind: 'obstacle',
      ...obstacle
    };
  }

  return {
    id,
    lane,
    y: -10,
    kind: 'mom',
    type: 'mom',
    icon: '👩',
    label: 'Anneye Saril',
    color: '#ff6b81'
  };
};

const initialGame = {
  playerLane: 1,
  objects: [],
  carrying: null,
  score: 0,
  level: 1,
  hugs: 0,
  misses: 0,
  combo: 0,
  message: '',
  gameOver: false,
  gameOverReason: ''
};

const MomLoveRun = () => {
  const [sessionId, setSessionId] = useState(null);
  const [game, setGame] = useState(initialGame);
  const objectIdRef = useRef(1);
  const scoreSavedRef = useRef(false);

  useEffect(() => {
    const startSession = async () => {
      const id = await initAnonymousSession();
      setSessionId(id);
    };
    startSession();
  }, []);

  const moveLeft = () => {
    setGame((prev) => {
      if (prev.gameOver) return prev;
      return { ...prev, playerLane: Math.max(0, prev.playerLane - 1) };
    });
  };

  const moveRight = () => {
    setGame((prev) => {
      if (prev.gameOver) return prev;
      return { ...prev, playerLane: Math.min(2, prev.playerLane + 1) };
    });
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') moveLeft();
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') moveRight();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (game.gameOver) return;

    const spawnIntervalMs = Math.max(680, 1700 - (game.level - 1) * 120);
    const timer = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver) return prev;
        const object = createObject(objectIdRef.current++);
        const trimmed = prev.objects.slice(-16);
        return { ...prev, objects: [...trimmed, object] };
      });
    }, spawnIntervalMs);

    return () => clearInterval(timer);
  }, [game.level, game.gameOver]);

  useEffect(() => {
    if (game.gameOver) return;

    const tick = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver) return prev;

        const speed = 0.95 + (prev.level - 1) * 0.16;
        let score = prev.score;
        let hugs = prev.hugs;
        let misses = prev.misses;
        let combo = prev.combo;
        let carrying = prev.carrying;
        let message = prev.message;
        let gameOverReason = prev.gameOverReason;
        let messageSet = false;

        const moved = [];

        for (const obj of prev.objects) {
          const nextY = obj.y + speed;
          const collision = obj.lane === prev.playerLane && nextY >= 84 && nextY <= 94;

          if (collision) {
            if (obj.kind === 'collect') {
              if (!carrying) {
                carrying = obj.type;
                score += 8;
                if (!messageSet) {
                  message = `${obj.label} alindi. Simdi anneye ulastir.`;
                  messageSet = true;
                }
              } else {
                if (!messageSet) {
                  message = 'Elinde hediye var. Once anneye ulastir.';
                  messageSet = true;
                }
              }
            }

            if (obj.kind === 'mom') {
              if (carrying) {
                hugs += 1;
                combo += 1;
                const earned = 18 + Math.min(8, combo * 2);
                score += earned;
                carrying = null;
                if (!messageSet) {
                  message = `Anne mutlu! +${earned} puan`;
                  messageSet = true;
                }
              } else {
                if (!messageSet) {
                  message = 'Anneye sevgi hediyesi goturmek icin once bir sey topla.';
                  messageSet = true;
                }
              }
            }

            if (obj.kind === 'obstacle') {
              misses += 1;
              combo = 0;
              gameOverReason = 'Engelleri cok kaciramadin.';
              if (!messageSet) {
                message = 'Hop! Engele carptin. Dikkatli git.';
                messageSet = true;
              }
            }

            continue;
          }

          if (nextY > 105) {
            if (obj.kind === 'mom' && carrying) {
              misses += 1;
              combo = 0;
              gameOverReason = 'Anneyi kacirdin, hediye elinde kaldi.';
              if (!messageSet) {
                message = 'Anne gecip gitti, siradaki anneye yetismelisin.';
                messageSet = true;
              }
            }
            continue;
          }

          moved.push({ ...obj, y: nextY });
        }

        const level = Math.min(10, 1 + Math.floor(hugs / LEVEL_STEP));
        if (level > prev.level && !messageSet) {
          message = `Level ${level}! Yol biraz hizlandi.`;
        }

        let gameOver = prev.gameOver;
        if (misses >= MAX_MISS) {
          gameOver = true;
          if (!gameOverReason) {
            gameOverReason = 'Arka arkaya gorevler kacirildi.';
          }
          message = `Oyun bitti: ${gameOverReason}`;
        }

        return {
          ...prev,
          objects: moved,
          carrying,
          score,
          hugs,
          misses,
          combo,
          level,
          message,
          gameOver,
          gameOverReason
        };
      });
    }, 50);

    return () => clearInterval(tick);
  }, [game.gameOver]);

  useEffect(() => {
    if (!game.message || game.gameOver) return;
    const timeout = setTimeout(() => {
      setGame((prev) => ({ ...prev, message: prev.gameOver ? prev.message : '' }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [game.message, game.gameOver]);

  useEffect(() => {
    if (!sessionId || !game.gameOver || scoreSavedRef.current) return;

    scoreSavedRef.current = true;

    const saveScore = async () => {
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'MomLoveRun',
          score: game.score,
          level: game.level,
          createdAt: new Date()
        });

        const statsRef = doc(db, 'gameStats', 'MomLoveRun');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(game.score)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'MomLoveRun',
            playCount: 1,
            totalScore: game.score,
            avgScore: game.score
          });
        });
      } catch (error) {
        console.error('Firebase error:', error);
      }
    };

    saveScore();
  }, [sessionId, game.gameOver, game.level, game.score]);

  const resetGame = () => {
    scoreSavedRef.current = false;
    setGame(initialGame);
  };

  const carryingLabel = game.carrying ? loveItems[game.carrying].label : 'Bos';
  const tasksToNextLevel = Math.max(0, game.level * LEVEL_STEP - game.hugs);

  return (
    <div className="mom-love-run">
      <div className="hud">
        <div className="pill">Puan: {game.score}</div>
        <div className="pill">Level: {game.level}</div>
        <div className="pill">Anne Mutlulugu: {game.hugs}</div>
        <div className="pill">Hata: {game.misses}/{MAX_MISS}</div>
      </div>

      <div className="info-card">
        <h2>Anneye Sevgi Kosusu</h2>
        <p>Hediye, cicek veya mektup topla. Dogru zamanda anneye ulastir ve puan kazan.</p>
        <p>Eldeki gorev: <strong>{carryingLabel}</strong> | Sonraki level icin {tasksToNextLevel} teslim kaldi.</p>
        {game.gameOver && <p className="end-reason">Bitis: {game.gameOverReason}</p>}
      </div>

      <div className="road">
        <div className="lane-mark lane-1" />
        <div className="lane-mark lane-2" />

        {game.objects.map((obj) => (
          <div
            key={obj.id}
            className={`road-object ${obj.kind}`}
            style={{ left: laneLeftMap[obj.lane], top: `${obj.y}%`, backgroundColor: obj.color }}
            title={obj.label}
          >
            {obj.icon}
          </div>
        ))}

        <div className="player" style={{ left: laneLeftMap[game.playerLane] }}>
          <span className="player-icon">🧒</span>
          {game.carrying && <span className="carry-badge">{loveItems[game.carrying].icon}</span>}
        </div>
      </div>

      <div className="controls">
        <button className="control-btn" onClick={moveLeft}>← Sol</button>
        <button className="control-btn" onClick={moveRight}>Sag →</button>
        {game.gameOver && <button className="play-btn" onClick={resetGame}>Tekrar Oyna</button>}
      </div>

      {game.message && <div className="message">{game.message}</div>}

      <section className="guide-panel">
        <h3>Minik Gorevler</h3>
        <div className="task-grid">
          <div className="task">🌸 Cicek topla ve anneye gotur.</div>
          <div className="task">🎁 Hediye yakala, anneye ulas.</div>
          <div className="task">💌 Mektubu anneden once kacirma.</div>
        </div>
      </section>
    </div>
  );
};

export default MomLoveRun;
