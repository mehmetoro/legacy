import { useEffect, useRef, useState } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import './MomLoveAdventure.css';

const laneLeftMap = ['18%', '50%', '82%'];
const LEVEL_STEP = 3;
const MAX_MISS = 5;

const stages = [
  { id: 'home', name: 'Ev Yolu', className: 'stage-home', minLevel: 1, maxLevel: 3, icon: '🏡' },
  { id: 'park', name: 'Park Yolu', className: 'stage-park', minLevel: 4, maxLevel: 6, icon: '🌳' },
  { id: 'market', name: 'Pazar Yolu', className: 'stage-market', minLevel: 7, maxLevel: 10, icon: '🛍️' }
];

const loveItems = {
  flower: { type: 'flower', icon: '🌸', label: 'Cicek', color: '#ff9ff3' },
  gift: { type: 'gift', icon: '🎁', label: 'Hediye', color: '#feca57' },
  letter: { type: 'letter', icon: '💌', label: 'Mektup', color: '#54a0ff' }
};

const obstacles = [
  { type: 'puddle', icon: '💦', label: 'Su Birikintisi', color: '#74b9ff' },
  { type: 'toy', icon: '🧸', label: 'Oyuncak', color: '#ff7675' },
  { type: 'cone', icon: '🚧', label: 'Koni', color: '#ff9f43' }
];

const randomLane = () => Math.floor(Math.random() * 3);
const randomItemType = () => {
  const keys = Object.keys(loveItems);
  return keys[Math.floor(Math.random() * keys.length)];
};
const randomObstacle = () => obstacles[Math.floor(Math.random() * obstacles.length)];

const createObject = (id, level) => {
  const lane = randomLane();
  const roll = Math.random();

  const collectChance = level <= 3 ? 0.62 : level <= 6 ? 0.56 : 0.5;
  const obstacleChance = level <= 3 ? 0.2 : level <= 6 ? 0.26 : 0.32;

  if (roll < collectChance) {
    const type = randomItemType();
    return {
      id,
      lane,
      y: -10,
      kind: 'collect',
      ...loveItems[type]
    };
  }

  if (roll < collectChance + obstacleChance) {
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
  hearts: 0,
  badges: [],
  message: '',
  gameOver: false,
  gameOverReason: ''
};

const getStageByLevel = (level) => {
  return stages.find((stage) => level >= stage.minLevel && level <= stage.maxLevel) || stages[stages.length - 1];
};

const MomLoveAdventure = () => {
  const [sessionId, setSessionId] = useState(null);
  const [game, setGame] = useState(initialGame);
  const objectIdRef = useRef(1);
  const scoreSavedRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const startSession = async () => {
      const id = await initAnonymousSession();
      setSessionId(id);
    };
    startSession();
  }, []);

  const playTone = (type) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioRef.current) {
        audioRef.current = new AudioContextClass();
      }

      const context = audioRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';

      if (type === 'success') {
        oscillator.frequency.setValueAtTime(660, context.currentTime);
      } else if (type === 'level') {
        oscillator.frequency.setValueAtTime(784, context.currentTime);
      } else if (type === 'mistake') {
        oscillator.frequency.setValueAtTime(320, context.currentTime);
      }

      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch (error) {
      console.log('Audio context baslatilamadi:', error);
    }
  };

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

    const spawnIntervalMs = Math.max(650, 1780 - (game.level - 1) * 130);
    const timer = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver) return prev;
        const object = createObject(objectIdRef.current++, prev.level);
        const trimmed = prev.objects.slice(-18);
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

        const speed = 0.9 + (prev.level - 1) * 0.17;
        let score = prev.score;
        let hugs = prev.hugs;
        let misses = prev.misses;
        let combo = prev.combo;
        let carrying = prev.carrying;
        let hearts = prev.hearts;
        let badges = [...prev.badges];
        let message = prev.message;
        let gameOverReason = prev.gameOverReason;
        let messageSet = false;
        let toneType = null;

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
                toneType = toneType || 'success';
              } else if (!messageSet) {
                message = 'Elinde hediye var. Once anneye ulastir.';
                messageSet = true;
              }
            }

            if (obj.kind === 'mom') {
              if (carrying) {
                hugs += 1;
                combo += 1;
                hearts += 1;

                const earned = 20 + Math.min(10, combo * 2);
                score += earned;
                carrying = null;

                if (hugs % LEVEL_STEP === 0) {
                  const newBadge = `Level ${1 + Math.floor(hugs / LEVEL_STEP)} Rozeti`;
                  badges = [...badges, newBadge];
                }

                if (!messageSet) {
                  message = `Anne mutlu! +${earned} puan`;
                  messageSet = true;
                }
                toneType = 'success';
              } else if (!messageSet) {
                message = 'Anneye gitmeden once sevgi nesnesi topla.';
                messageSet = true;
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
              toneType = 'mistake';
            }

            continue;
          }

          if (nextY > 105) {
            if (obj.kind === 'mom' && carrying) {
              misses += 1;
              combo = 0;
              gameOverReason = 'Anneyi kacirdin, hediye elinde kaldi.';
              if (!messageSet) {
                message = 'Anne gecip gitti. Siradaki anneye yetismelisin.';
                messageSet = true;
              }
              toneType = 'mistake';
            }
            continue;
          }

          moved.push({ ...obj, y: nextY });
        }

        const level = Math.min(10, 1 + Math.floor(hugs / LEVEL_STEP));
        if (level > prev.level && !messageSet) {
          message = `Level ${level}! Yeni bolume gectin.`;
          toneType = 'level';
        }

        let gameOver = prev.gameOver;
        if (misses >= MAX_MISS) {
          gameOver = true;
          if (!gameOverReason) {
            gameOverReason = 'Arka arkaya gorevler kacirildi.';
          }
          message = `Oyun bitti: ${gameOverReason}`;
          toneType = 'mistake';
        }

        if (toneType) {
          setTimeout(() => playTone(toneType), 0);
        }

        return {
          ...prev,
          objects: moved,
          carrying,
          score,
          hugs,
          misses,
          combo,
          hearts,
          badges,
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
          gameName: 'MomLoveAdventure',
          score: game.score,
          level: game.level,
          createdAt: new Date()
        });

        const statsRef = doc(db, 'gameStats', 'MomLoveAdventure');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(game.score)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'MomLoveAdventure',
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
  const currentStage = getStageByLevel(game.level);
  const celebrationTitle = game.hugs >= 12
    ? 'Muhteşem Sevgi Gunu!'
    : game.hugs >= 6
      ? 'Harika Bir Sevgi Turu!'
      : 'Tatli Bir Baslangic!';

  return (
    <div className="mom-love-adventure">
      <div className="hud">
        <div className="pill">Puan: {game.score}</div>
        <div className="pill">Level: {game.level}</div>
        <div className="pill">Bolum: {currentStage.icon} {currentStage.name}</div>
        <div className="pill">Kalp: {game.hearts}</div>
        <div className="pill">Hata: {game.misses}/{MAX_MISS}</div>
      </div>

      <div className="info-card">
        <h2>Anne Sevgisi Macerasi</h2>
        <p>Hediye, cicek veya mektup topla. Akista anneye ulastir ve sevgi puani kazan.</p>
        <p>Eldeki gorev: <strong>{carryingLabel}</strong> | Sonraki level icin {tasksToNextLevel} teslim kaldi.</p>
        {game.gameOver && <p className="end-reason">Bitis: {game.gameOverReason}</p>}
      </div>

      <div className={`road ${currentStage.className}`}>
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
        {game.gameOver && <button className="play-btn" onClick={resetGame}>Yeni Tura Basla</button>}
      </div>

      {game.message && <div className="message">{game.message}</div>}

      {game.gameOver && (
        <section className="celebration-card" aria-live="polite">
          <div className="celebration-hearts" aria-hidden="true">
            <span>💖</span>
            <span>🌸</span>
            <span>💖</span>
          </div>
          <h3>{celebrationTitle}</h3>
          <p>Bugun anneni mutlu etmeyi basardin. Harika bir sevgi macerasi oldu.</p>
          <div className="celebration-stats">
            <div className="stat">Toplam Puan: <strong>{game.score}</strong></div>
            <div className="stat">Tamamlanan Sevgi Teslimi: <strong>{game.hugs}</strong></div>
            <div className="stat">Kazanilan Kalp: <strong>{game.hearts}</strong></div>
            <div className="stat">Ulasilan Level: <strong>{game.level}</strong></div>
          </div>
        </section>
      )}

      <section className="guide-panel">
        <h3>Oduller ve Mini Bolumler</h3>
        <div className="task-grid">
          <div className="task">🏡 Ev Yolu: sakin baslangic</div>
          <div className="task">🌳 Park Yolu: daha hizli akiş</div>
          <div className="task">🛍️ Pazar Yolu: yogun gorev</div>
        </div>
        <div className="badges-row">
          {game.badges.length === 0 ? (
            <span className="badge-empty">Rozetlerin burada gorunecek.</span>
          ) : (
            game.badges.map((badge, index) => (
              <span key={`${badge}-${index}`} className="badge-chip">⭐ {badge}</span>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default MomLoveAdventure;
