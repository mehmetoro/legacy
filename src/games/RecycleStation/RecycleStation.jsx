import { useEffect, useState } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import './RecycleStation.css';

const BASE_TIME = 7;
const MIN_TIME = 2.5;
const LEVEL_STEP = 4;
const MAX_MISS = 5;

const items = [
  { id: 'plastic-bottle', name: 'Plastik Şişe', icon: '🧴', target: 'recycle', targetName: 'Geri Dönüşüm' },
  { id: 'apple-core', name: 'Elma Çekirdeği', icon: '🍎', target: 'organic', targetName: 'Organik Kutu' },
  { id: 'old-shirt', name: 'Temiz Tişört', icon: '👕', target: 'donation', targetName: 'Paylaşım Kutusu' },
  { id: 'toy-car', name: 'Bozuk Oyuncak', icon: '🧸', target: 'repair', targetName: 'Tamir Masası' },
  { id: 'paper', name: 'Kullanılmış Kağıt', icon: '📄', target: 'recycle', targetName: 'Geri Dönüşüm' },
  { id: 'banana-peel', name: 'Muz Kabuğu', icon: '🍌', target: 'organic', targetName: 'Organik Kutu' },
  { id: 'glass-jar', name: 'Cam Kavanoz', icon: '🫙', target: 'recycle', targetName: 'Geri Dönüşüm' },
  { id: 'milk-box', name: 'Süt Kutusu', icon: '🥛', target: 'recycle', targetName: 'Geri Dönüşüm' },
  { id: 'egg-shell', name: 'Yumurta Kabuğu', icon: '🥚', target: 'organic', targetName: 'Organik Kutu' },
  { id: 'tea-bag', name: 'Demlik Posası', icon: '🍵', target: 'organic', targetName: 'Organik Kutu' },
  { id: 'book', name: 'Eski Kitap', icon: '📘', target: 'donation', targetName: 'Paylaşım Kutusu' },
  { id: 'scarf', name: 'Temiz Atkı', icon: '🧣', target: 'donation', targetName: 'Paylaşım Kutusu' },
  { id: 'chair-leg', name: 'Kırık Sandalye Ayağı', icon: '🪵', target: 'repair', targetName: 'Tamir Masası' },
  { id: 'lamp', name: 'Bozuk Lamba', icon: '💡', target: 'repair', targetName: 'Tamir Masası' },
  { id: 'backpack', name: 'Yırtık Çanta', icon: '🎒', target: 'repair', targetName: 'Tamir Masası' }
];

const stations = [
  { id: 'recycle', name: 'Geri Dönüşüm', icon: '♻️', color: '#2ecc71' },
  { id: 'organic', name: 'Organik Kutu', icon: '🌿', color: '#27ae60' },
  { id: 'donation', name: 'Paylaşım Kutusu', icon: '🎁', color: '#f39c12' },
  { id: 'repair', name: 'Tamir Masası', icon: '🛠️', color: '#3498db' }
];

const getTimeLimitByLevel = (level) => {
  return Math.max(MIN_TIME, BASE_TIME - (level - 1) * 0.45);
};

const pickRandomItem = (exceptId = null) => {
  const pool = exceptId ? items.filter((item) => item.id !== exceptId) : items;
  return pool[Math.floor(Math.random() * pool.length)];
};

const RecycleStation = () => {
  const [game, setGame] = useState({
    currentItem: null,
    score: 0,
    streak: 0,
    level: 1,
    correctCount: 0,
    questionCount: 0,
    misses: 0,
    timeLimit: BASE_TIME,
    timeLeft: BASE_TIME,
    gameOver: false,
    gameOverReason: '',
    message: ''
  });
  const [sessionId, setSessionId] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    const startSession = async () => {
      const id = await initAnonymousSession();
      setSessionId(id);
    };
    startSession();
  }, []);

  useEffect(() => {
    if (sessionId) {
      setGame((prev) => ({
        ...prev,
        currentItem: pickRandomItem(),
        message: ''
      }));
    }
  }, [sessionId]);

  useEffect(() => {
    if (game.gameOver || !game.currentItem) return;

    const timer = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver || !prev.currentItem) return prev;

        const nextTime = Number((prev.timeLeft - 0.1).toFixed(1));
        if (nextTime > 0) {
          return { ...prev, timeLeft: nextTime };
        }

        const nextMiss = prev.misses + 1;
        const over = nextMiss >= MAX_MISS;

        if (over) {
          return {
            ...prev,
            timeLeft: 0,
            misses: nextMiss,
            gameOver: true,
            gameOverReason: 'Süre dolarak çok fazla soru kaçtı.',
            message: 'Süre doldu ve oyun bitti. Tekrar dene!'
          };
        }

        const nextItem = pickRandomItem(prev.currentItem.id);
        const limit = getTimeLimitByLevel(prev.level);

        return {
          ...prev,
          currentItem: nextItem,
          misses: nextMiss,
          streak: 0,
          questionCount: prev.questionCount + 1,
          timeLimit: limit,
          timeLeft: limit,
          message: `Süre bitti. Yeni soru: ${nextItem.name}`
        };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [game.gameOver, game.currentItem]);

  useEffect(() => {
    if (!sessionId || !game.gameOver || scoreSaved) return;

    const saveFinalScore = async () => {
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'RecycleStation',
          score: game.score,
          level: game.level,
          createdAt: new Date()
        });

        const statsRef = doc(db, 'gameStats', 'RecycleStation');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(game.score)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'RecycleStation',
            playCount: 1,
            totalScore: game.score,
            avgScore: game.score
          });
        });

        setScoreSaved(true);
      } catch (error) {
        console.error('Firebase error:', error);
      }
    };

    saveFinalScore();
  }, [sessionId, game.gameOver, game.level, game.score, scoreSaved]);

  const handleSelect = (stationId) => {
    setGame((prev) => {
      if (!prev.currentItem || prev.gameOver) return prev;

      const isCorrect = prev.currentItem.target === stationId;

      if (isCorrect) {
        const streakBonus = prev.streak >= 2 ? 4 : 0;
        const speedBonus = Math.round(prev.timeLeft * 2);
        const earned = 12 + streakBonus + speedBonus;
        const nextCorrect = prev.correctCount + 1;
        const nextLevel = 1 + Math.floor(nextCorrect / LEVEL_STEP);
        const nextLimit = getTimeLimitByLevel(nextLevel);
        const nextItem = pickRandomItem(prev.currentItem.id);

        return {
          ...prev,
          currentItem: nextItem,
          score: prev.score + earned,
          streak: prev.streak + 1,
          level: nextLevel,
          correctCount: nextCorrect,
          questionCount: prev.questionCount + 1,
          timeLimit: nextLimit,
          timeLeft: nextLimit,
          message: `Doğru! +${earned} puan. Süre daralıyor.`
        };
      }

      const nextMiss = prev.misses + 1;
      const over = nextMiss >= MAX_MISS;

      if (over) {
        return {
          ...prev,
          misses: nextMiss,
          streak: 0,
          gameOver: true,
          gameOverReason: `Yanlış seçimler arttı. Doğru cevap: ${prev.currentItem.targetName}`,
          message: `Oyun bitti. Son soruda doğru cevap: ${prev.currentItem.targetName}`
        };
      }

      const nextItem = pickRandomItem(prev.currentItem.id);
      const nextLimit = getTimeLimitByLevel(prev.level);

      return {
        ...prev,
        currentItem: nextItem,
        misses: nextMiss,
        streak: 0,
        questionCount: prev.questionCount + 1,
        timeLimit: nextLimit,
        timeLeft: nextLimit,
        message: `Yanlış. ${prev.currentItem.name} için doğru yer: ${prev.currentItem.targetName}`
      };
    });
  };

  const restartGame = () => {
    setScoreSaved(false);
    setGame({
      currentItem: pickRandomItem(),
      score: 0,
      streak: 0,
      level: 1,
      correctCount: 0,
      questionCount: 0,
      misses: 0,
      timeLimit: BASE_TIME,
      timeLeft: BASE_TIME,
      gameOver: false,
      gameOverReason: '',
      message: 'Yeni tur başladı. Hazır mısın?'
    });
  };

  if (!game.currentItem) {
    return <div className="loading">Istasyon hazirlaniyor...</div>;
  }

  const timerPercent = Math.max(0, (game.timeLeft / game.timeLimit) * 100);

  return (
    <div className="recycle-station">
      <div className="top-bar">
        <div className="score">Puan: {game.score}</div>
        <div className="streak">Seri: {game.streak}</div>
        <div className="streak">Level: {game.level}</div>
        <div className="streak">Hata: {game.misses}/{MAX_MISS}</div>
      </div>

      <div className="timer-panel">
        <div className="timer-row">
          <span>Süre: {game.timeLeft.toFixed(1)} sn</span>
          <span>Soru: {game.questionCount + 1}</span>
        </div>
        <div className="timer-track">
          <div className="timer-fill" style={{ width: `${timerPercent}%` }} />
        </div>
      </div>

      <div className="item-panel">
        <p className="item-label">Süre dolmadan doğru istasyonu seç:</p>
        <div className="item-card">
          <span className="item-icon">{game.currentItem.icon}</span>
          <span>{game.currentItem.name}</span>
        </div>
      </div>

      <div className="stations-grid">
        {stations.map((station) => (
          <button
            key={station.id}
            className="station-card"
            style={{ borderColor: station.color }}
            onClick={() => handleSelect(station.id)}
            disabled={game.gameOver}
          >
            <div className="station-icon" style={{ backgroundColor: station.color }}>
              {station.icon}
            </div>
            <h3>{station.name}</h3>
          </button>
        ))}
      </div>

      {game.message && <div className="message">{game.message}</div>}

      {game.gameOver && (
        <div className="game-over-card">
          <h3>Tur Bitti</h3>
          <p>{game.gameOverReason}</p>
          <p>Toplam Puan: <strong>{game.score}</strong></p>
          <p>Doğru Cevap: <strong>{game.correctCount}</strong> | Ulaşılan Level: <strong>{game.level}</strong></p>
          <button className="restart-button" onClick={restartGame}>Tekrar Oyna</button>
        </div>
      )}
    </div>
  );
};

export default RecycleStation;
