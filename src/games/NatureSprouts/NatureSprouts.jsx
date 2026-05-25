import { useEffect, useState } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import './NatureSprouts.css';

const LEVEL_STEP = 4;

const tasks = [
  {
    id: 'seed-to-soil',
    icon: '🌱',
    actionId: 'soil',
    successText: '✅✨',
    clue: '🟤'
  },
  {
    id: 'flower-needs-water',
    icon: '🌸',
    actionId: 'water',
    successText: '✅💧',
    clue: '💧'
  },
  {
    id: 'tree-needs-sun',
    icon: '🌳',
    actionId: 'sun',
    successText: '✅☀️',
    clue: '☀️'
  },
  {
    id: 'sapling-needs-love',
    icon: '🪴',
    actionId: 'hug-nature',
    successText: '✅💚',
    clue: '🤗'
  },
  {
    id: 'recycle-bottle',
    icon: '🧴',
    actionId: 'recycle',
    successText: '✅♻️',
    clue: '♻️'
  },
  {
    id: 'bird-needs-seeds',
    icon: '🐦',
    actionId: 'feed-birds',
    successText: '✅🐦',
    clue: '🌾'
  }
];

const actions = [
  { id: 'water', name: 'Su Ver', icon: '💧', color: '#54a0ff' },
  { id: 'soil', name: 'Topraga Koy', icon: '🟤', color: '#9c6b4f' },
  { id: 'sun', name: 'Gunes Ac', icon: '☀️', color: '#feca57' },
  { id: 'hug-nature', name: 'Nazik Davran', icon: '🤗', color: '#2ecc71' },
  { id: 'recycle', name: 'Geri Donustur', icon: '♻️', color: '#16a085' },
  { id: 'feed-birds', name: 'Yem Ver', icon: '🌾', color: '#88c057' }
];

const levelThemes = {
  1: 'theme-morning',
  2: 'theme-garden',
  3: 'theme-meadow',
  4: 'theme-forest'
};

const weightedTaskIds = [
  'recycle-bottle',
  'recycle-bottle',
  'recycle-bottle',
  'bird-needs-seeds',
  'seed-to-soil',
  'flower-needs-water',
  'tree-needs-sun',
  'sapling-needs-love'
];

const randomTask = (exceptId = null) => {
  const pool = weightedTaskIds.filter((id) => id !== exceptId);
  const pickedId = pool[Math.floor(Math.random() * pool.length)];
  return tasks.find((task) => task.id === pickedId) || tasks[0];
};

const NatureSprouts = () => {
  const [sessionId, setSessionId] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [sparkles, setSparkles] = useState([]);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    const startSession = async () => {
      const id = await initAnonymousSession();
      setSessionId(id);
      setCurrentTask(randomTask());
    };
    startSession();
  }, []);

  const createSparkles = () => {
    const base = Date.now();
    const icons = ['⭐', '✨', '💫', '🌟'];
    const next = Array.from({ length: 18 }, (_, index) => ({
      id: `${base}-${index}`,
      left: 6 + Math.random() * 88,
      top: 12 + Math.random() * 65,
      delay: index * 35,
      icon: icons[Math.floor(Math.random() * icons.length)]
    }));
    setSparkles(next);
    setTimeout(() => setSparkles([]), 1100);
  };

  const saveScore = async (newScore, newLevel) => {
    if (!sessionId) return;

    try {
      await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
        playerId: sessionId,
        gameName: 'NatureSprouts',
        score: newScore,
        level: newLevel,
        createdAt: new Date()
      });

      const statsRef = doc(db, 'gameStats', 'NatureSprouts');
      await updateDoc(statsRef, {
        playCount: increment(1),
        totalScore: increment(newScore)
      }).catch(() => {
        setDoc(statsRef, {
          gameName: 'NatureSprouts',
          playCount: 1,
          totalScore: newScore,
          avgScore: newScore
        });
      });
    } catch (error) {
      console.error('Firebase error:', error);
    }
  };

  const handleAction = (actionId) => {
    if (!currentTask) return;
    setActiveAction(actionId);

    if (currentTask.actionId === actionId) {
      const nextCorrect = correctCount + 1;
      const nextLevel = Math.min(4, 1 + Math.floor(nextCorrect / LEVEL_STEP));
      const earned = 12;
      const nextScore = score + earned;

      setCorrectCount(nextCorrect);
      setLevel(nextLevel);
      setScore(nextScore);
      setMessage(`${currentTask.successText} +${earned} puan`);
      createSparkles();
      saveScore(nextScore, nextLevel);
    } else {
      setMessage('❌🔁');
    }

    setTimeout(() => {
      setActiveAction(null);
      setCurrentTask((prev) => randomTask(prev?.id));
    }, 750);
  };

  if (!currentTask) {
    return <div className="nature-sprouts loading">Bahce hazirlaniyor...</div>;
  }

  return (
    <div className={`nature-sprouts ${levelThemes[level] || 'theme-forest'}`}>
      <div className="cloud cloud-1" aria-hidden="true" />
      <div className="cloud cloud-2" aria-hidden="true" />

      <div className="top-hud">
        <div className="hud-pill" aria-label="Puan">⭐ {score}</div>
        <div className="hud-pill" aria-label="Level">🌱 {level}</div>
        <div className="hud-pill" aria-label="Dogru">✅ {correctCount}</div>
      </div>

      <div className="task-card">
        <div className="cute-buddies" aria-hidden="true">
          <span>🐞</span>
          <span>🐣</span>
          <span>🦋</span>
        </div>
        <div className="task-visual-row">
          <div className="task-icon pulse">{currentTask.icon}</div>
          <div className="task-arrow">➡️</div>
          <div className="task-clue pulse-soft">{currentTask.clue}</div>
        </div>
      </div>

      <div className="action-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`action-btn ${activeAction === action.id ? 'active' : ''} ${currentTask.actionId === action.id ? 'target-hint' : ''}`}
            style={{ borderColor: action.color }}
            onClick={() => handleAction(action.id)}
            aria-label={action.name}
          >
            <span className="action-icon" style={{ backgroundColor: action.color }}>{action.icon}</span>
          </button>
        ))}
      </div>

      {message && <div className="message">{message}</div>}

      <div className="sparkle-area" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}ms`
            }}
          >
            {sparkle.icon}
          </span>
        ))}
      </div>

      <section className="guide-box">
        <div className="visual-guide" aria-label="Gorsel gorevler">
          <div className="visual-pair">🌱 ➡️ 🟤</div>
          <div className="visual-pair">🌸 ➡️ 💧</div>
          <div className="visual-pair">🌳 ➡️ ☀️</div>
          <div className="visual-pair">🪴 ➡️ 🤗</div>
          <div className="visual-pair">🧴 ➡️ ♻️</div>
          <div className="visual-pair">🐦 ➡️ 🌾</div>
        </div>
      </section>
    </div>
  );
};

export default NatureSprouts;
