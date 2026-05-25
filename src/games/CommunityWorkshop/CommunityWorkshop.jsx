import { useEffect, useRef, useState } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import './CommunityWorkshop.css';

const laneLeftMap = ['17%', '50%', '83%'];
const LEVEL_STEP = 4;
const MAX_MISS = 5;

const collectables = {
  trash: { type: 'trash', icon: '🗑️', label: 'Cop', color: '#f39c12' },
  water: { type: 'water', icon: '💧', label: 'Su', color: '#3498db' },
  seed: { type: 'seed', icon: '🌱', label: 'Tohum', color: '#2ecc71' }
};

const targets = {
  trash: { type: 'trash', icon: '♻️', label: 'Cop Kutusu', color: '#16a085' },
  water: { type: 'water', icon: '🌸', label: 'Cicek', color: '#e84393' },
  seed: { type: 'seed', icon: '🪴', label: 'Toprak', color: '#8e6e53' }
};

const obstacle = { icon: '🚧', label: 'Engel', color: '#e74c3c' };

const randomLane = () => Math.floor(Math.random() * 3);

const randomTaskType = () => {
  const types = Object.keys(collectables);
  return types[Math.floor(Math.random() * types.length)];
};

const randomDifferentType = (currentType) => {
  const types = Object.keys(collectables).filter((type) => type !== currentType);
  return types[Math.floor(Math.random() * types.length)];
};

const createSpawnObject = (id, carrying) => {
  const roll = Math.random();
  const lane = randomLane();

  if (carrying) {
    if (roll < 0.55) {
      return {
        id,
        kind: 'target',
        type: carrying,
        lane,
        y: -12,
        ...targets[carrying]
      };
    }

    if (roll < 0.75) {
      return {
        id,
        kind: 'obstacle',
        type: 'obstacle',
        lane,
        y: -12,
        ...obstacle
      };
    }

    if (roll < 0.9) {
      const differentType = randomDifferentType(carrying);
      return {
        id,
        kind: 'target',
        type: differentType,
        lane,
        y: -12,
        ...targets[differentType]
      };
    }

    const collectType = randomTaskType();
    return {
      id,
      kind: 'collect',
      type: collectType,
      lane,
      y: -12,
      ...collectables[collectType]
    };
  }

  if (roll < 0.62) {
    const collectType = randomTaskType();
    return {
      id,
      kind: 'collect',
      type: collectType,
      lane,
      y: -12,
      ...collectables[collectType]
    };
  }

  if (roll < 0.82) {
    return {
      id,
      kind: 'obstacle',
      type: 'obstacle',
      lane,
      y: -12,
      ...obstacle
    };
  }

  const targetType = randomTaskType();
  return {
    id,
    kind: 'target',
    type: targetType,
    lane,
    y: -12,
    ...targets[targetType]
  };
};

const initialGameState = {
  playerLane: 1,
  carrying: null,
  objects: [],
  score: 0,
  tasks: 0,
  level: 1,
  misses: 0,
  combo: 0,
  gameOverReason: '',
  message: '',
  gameOver: false
};

const CommunityWorkshop = () => {
  const [sessionId, setSessionId] = useState(null);
  const [game, setGame] = useState(initialGameState);
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
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        moveLeft();
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        moveRight();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (game.gameOver) return;

    const intervalMs = Math.max(560, 1620 - (game.level - 1) * 100);
    const spawnLoop = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver) return prev;
        const created = createSpawnObject(objectIdRef.current++, prev.carrying);
        const trimmed = prev.objects.slice(-18);
        return { ...prev, objects: [...trimmed, created] };
      });
    }, intervalMs);

    return () => clearInterval(spawnLoop);
  }, [game.level, game.gameOver]);

  useEffect(() => {
    if (game.gameOver) return;

    const tickLoop = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver) return prev;

        const speed = 1.02 + (prev.level - 1) * 0.18;
        let score = prev.score;
        let carrying = prev.carrying;
        let tasks = prev.tasks;
        let misses = prev.misses;
        let combo = prev.combo;
        let gameOverReason = prev.gameOverReason;
        let message = prev.message;
        let gameOver = prev.gameOver;
        let messageSet = false;

        const movedObjects = [];

        for (const obj of prev.objects) {
          const nextY = obj.y + speed;
          const isCollision = obj.lane === prev.playerLane && nextY >= 84 && nextY <= 94;

          if (isCollision) {
            if (obj.kind === 'collect') {
              if (carrying) {
                if (!messageSet) {
                  message = 'Elindeki gorevi bitir, sonra yenisini al.';
                  messageSet = true;
                }
              } else {
                carrying = obj.type;
                score += 8;
                if (!messageSet) {
                  message = `${obj.label} alindi. Simdi uygun hedefi kacirma.`;
                  messageSet = true;
                }
              }
            }

            if (obj.kind === 'target') {
              if (!carrying) {
                if (!messageSet) {
                  message = 'Hedefe gelmeden once bir gorev nesnesi al.';
                  messageSet = true;
                }
              } else if (carrying === obj.type) {
                tasks += 1;
                combo += 1;
                const earned = 22 + Math.min(10, combo * 2);
                score += earned;
                carrying = null;
                if (!messageSet) {
                  message = `Teslim tamam! +${earned} puan`;
                  messageSet = true;
                }
              } else {
                combo = 0;
                if (!messageSet) {
                  message = 'Bu hedef elindekine uygun degil.';
                  messageSet = true;
                }
              }
            }

            if (obj.kind === 'obstacle') {
              misses += 1;
              combo = 0;
              gameOverReason = 'Engellere fazla carptin.';
              if (!messageSet) {
                message = 'Engeli kaciramadin. Dikkat!';
                messageSet = true;
              }
            }
            continue;
          }

          if (nextY > 104) {
            if (obj.kind === 'target' && carrying === obj.type) {
              misses += 1;
              combo = 0;
              gameOverReason = 'Eldeki gorevin dogru hedefini kacirdin.';
              if (!messageSet) {
                message = 'Dogru hedefi kacirdin. Elindeki nesneyi sonraki hedefe tasi.';
                messageSet = true;
              }
            }
            continue;
          }

          movedObjects.push({ ...obj, y: nextY });
        }

        const level = Math.min(12, 1 + Math.floor(tasks / LEVEL_STEP));
        if (level > prev.level && !messageSet) {
          message = `Level ${level}! Oyun biraz daha hizlandi.`;
        }

        if (misses >= MAX_MISS) {
          gameOver = true;
          if (!gameOverReason) {
            gameOverReason = 'Arka arkaya gorevleri kacirdin.';
          }
          message = `Oyun bitti: ${gameOverReason}`;
        }

        return {
          ...prev,
          objects: movedObjects,
          score,
          carrying,
          tasks,
          misses,
          combo,
          level,
          gameOverReason,
          gameOver,
          message
        };
      });
    }, 50);

    return () => clearInterval(tickLoop);
  }, [game.gameOver]);

  useEffect(() => {
    if (!game.message || game.gameOver) return;

    const timeout = setTimeout(() => {
      setGame((prev) => {
        if (prev.gameOver) return prev;
        return { ...prev, message: '' };
      });
    }, 900);

    return () => clearTimeout(timeout);
  }, [game.message, game.gameOver]);

  useEffect(() => {
    if (!game.gameOver || !sessionId || scoreSavedRef.current) return;

    scoreSavedRef.current = true;

    const saveScore = async () => {
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'CommunityWorkshop',
          score: game.score,
          level: game.level,
          createdAt: new Date()
        });

        const statsRef = doc(db, 'gameStats', 'CommunityWorkshop');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(game.score)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'CommunityWorkshop',
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
  }, [game.gameOver, game.level, game.score, sessionId]);

  const resetGame = () => {
    scoreSavedRef.current = false;
    setGame(initialGameState);
  };

  const carryingLabel = game.carrying ? collectables[game.carrying].label : 'Bos';
  const nextLevelTaskTarget = game.level * LEVEL_STEP;
  const tasksToNextLevel = Math.max(0, nextLevelTaskTarget - game.tasks);

  return (
    <div className="community-workshop">
      <div className="hud">
        <div className="score">Puan: {game.score}</div>
        <div className="level">Seviye: {game.level}</div>
        <div className="level">Teslim: {game.tasks}</div>
        <div className="level">Seri: {game.combo}</div>
        <div className="level">Hata: {game.misses}/{MAX_MISS}</div>
      </div>

      <div className="mission-card runner-info">
        <div className="mission-icon">🧒</div>
        <h2>Kahraman Rotasi</h2>
        <p>
          Sag-sol hareket et, gorev nesnesini al ve dogru hedefe ulastir.
          Elin doluyken yeni gorev alamazsin.
        </p>
        <p className="carry-status">Eldeki gorev: <strong>{carryingLabel}</strong></p>
        {!game.gameOver && (
          <p className="carry-status">Sonraki level icin {tasksToNextLevel} teslim daha yap.</p>
        )}
        {game.gameOver && (
          <p className="end-reason">Bitis nedeni: {game.gameOverReason}</p>
        )}
      </div>

      <div className="runner-board">
        <div className="lane lane-left" />
        <div className="lane lane-center" />
        <div className="lane lane-right" />

        {game.objects.map((obj) => (
          <div
            key={obj.id}
            className={`road-object ${obj.kind}`}
            style={{
              left: laneLeftMap[obj.lane],
              top: `${obj.y}%`,
              backgroundColor: obj.color
            }}
            title={obj.label}
          >
            <span>{obj.icon}</span>
          </div>
        ))}

        <div className="player" style={{ left: laneLeftMap[game.playerLane] }}>
          <span className="player-icon">🧒</span>
          {game.carrying && <span className="carry-badge">{collectables[game.carrying].icon}</span>}
        </div>
      </div>

      <div className="actions-row">
        <button className="clear-button" onClick={moveLeft}>← Sol</button>
        <button className="clear-button" onClick={moveRight}>Sag →</button>
        {game.gameOver && <button className="check-button" onClick={resetGame}>Tekrar Oyna</button>}
      </div>

      {game.message && <div className="message">{game.message}</div>}

      <section className="guide-panel">
        <h3>Gorevler ve Kurallar</h3>
        <div className="task-grid">
          <div className="task-card">🗑️ Cop al → ♻️ Cop kutusuna birak</div>
          <div className="task-card">💧 Su al → 🌸 Cicegi sula</div>
          <div className="task-card">🌱 Tohum al → 🪴 Topraga ek</div>
        </div>
        <p>Level atlama: Her {LEVEL_STEP} dogru teslim 1 level kazandirir.</p>
        <p>Oyun bitisi: Toplam {MAX_MISS} hata olunca tur biter. Hata; engele carpma veya dogru hedefi kacirma ile artar.</p>
      </section>
    </div>
  );
};

export default CommunityWorkshop;
