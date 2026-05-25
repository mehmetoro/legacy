import { useState, useEffect } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import './NatureBridge.css';

const items = [
  { id: 'seed', name: 'Tohum', icon: '🌱', target: 'forest', targetName: 'Orman', color: '#6ab04c', message: '🌳 Tohumlar ormanda ağaç olur!' },
  { id: 'water', name: 'Su Damlası', icon: '💧', target: 'flower', targetName: 'Çiçek', color: '#4facfe', message: '🌸 Su çiçekleri büyütür!' },
  { id: 'battery', name: 'Pil', icon: '🔋', target: 'recycle', targetName: 'Geri Dönüşüm', color: '#feca57', message: '♻️ Pilleri geri dönüştürelim!' },
  { id: 'bottle', name: 'Plastik Şişe', icon: '🧴', target: 'recycle', targetName: 'Geri Dönüşüm', color: '#ff6b6b', message: '♻️ Plastikler geri dönüşüme!' }
];

const targets = [
  { id: 'forest', name: 'Orman', icon: '🌲', description: 'Ağaçların evi', color: '#6ab04c' },
  { id: 'flower', name: 'Çiçek Bahçesi', icon: '🌸', description: 'Çiçeklerin yuvası', color: '#4facfe' },
  { id: 'recycle', name: 'Geri Dönüşüm Kutusu', icon: '♻️', description: 'Atıkların yeni hayatı', color: '#feca57' }
];

const NatureBridge = () => {
  const [currentItem, setCurrentItem] = useState(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [stars, setStars] = useState([]);
  const [shakeItem, setShakeItem] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(false);
  const [successEffect, setSuccessEffect] = useState(null);
  const [educationalMessage, setEducationalMessage] = useState('');

  useEffect(() => {
    const startSession = async () => {
      const id = await initAnonymousSession();
      console.log("🔐 Session ID:", id);
      setSessionId(id);
    };
    startSession();
  }, []);

  useEffect(() => {
    if (sessionId) {
      newItem();
    }
  }, [sessionId]);

  const createStarEffect = (x, y) => {
    const newStar = { id: Date.now(), x, y };
    setStars(prev => [...prev, newStar]);
    setTimeout(() => {
      setStars(prev => prev.filter(star => star.id !== newStar.id));
    }, 500);
  };

  const newItem = () => {
    const randomItem = items[Math.floor(Math.random() * items.length)];
    setCurrentItem(randomItem);
    setMessage('');
    setShakeItem(false);
    setSuccessEffect(null);
    setEducationalMessage('');
  };

  const handleDrop = async (targetId, event) => {
    if (!currentItem) return;
    if (!sessionId) {
      setMessage('Oturum başlatılıyor, lütfen bekleyin...');
      return;
    }

    const isCorrect = currentItem.target === targetId;
    
    if (isCorrect) {
      const newScore = score + 15;
      setScore(newScore);
      setScoreAnim(true);
      setTimeout(() => setScoreAnim(false), 300);
      setMessage(`🎉 Doğru! +15 puan`);
      setEducationalMessage(currentItem.message);
      setTimeout(() => setEducationalMessage(''), 2000);
      
      setSuccessEffect(targetId);
      setTimeout(() => setSuccessEffect(null), 500);
      
      if (event) {
        createStarEffect(event.clientX, event.clientY);
      }
      
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'NatureBridge',
          score: newScore,
          level: 1,
          createdAt: new Date()
        });
        
        const statsRef = doc(db, 'gameStats', 'NatureBridge');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(newScore)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'NatureBridge',
            playCount: 1,
            totalScore: newScore,
            avgScore: newScore
          });
        });
      } catch (error) {
        console.error('Firebase error:', error);
      }
    } else {
      const correctTarget = items.find(i => i.id === currentItem.id)?.targetName;
      setMessage(`❌ Yanlış! ${currentItem.name} ${correctTarget} ait. Tekrar dene!`);
      setShakeItem(true);
      setTimeout(() => setShakeItem(false), 500);
    }
    
    setTimeout(() => {
      newItem();
    }, 1200);
  };

  if (!currentItem) {
    return <div className="loading">🌍 Doğa hazırlanıyor...</div>;
  }

  return (
    <div className="nature-bridge">
      <div className={`score-board ${scoreAnim ? 'score-pop' : ''}`}>
        🏆 Puan: {score}
      </div>
      
      <div className="game-area">
        <div className="item-area">
          <div className="item-label">Bu nesne nereye ait?</div>
          <div 
            className={`floating-item ${shakeItem ? 'shake' : ''}`}
            style={{ backgroundColor: currentItem.color }}
            draggable="true"
            onDragStart={(e) => e.dataTransfer.setData('text/plain', currentItem.id)}
          >
            <span className="item-icon">{currentItem.icon}</span>
            <span className="item-name">{currentItem.name}</span>
          </div>
        </div>

        <div className="targets-area">
          <div className="targets-grid">
            {targets.map(target => (
              <div
                key={target.id}
                className={`target-card ${successEffect === target.id ? 'success-flash' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(target.id, e);
                }}
              >
                <div className="target-icon" style={{ backgroundColor: target.color }}>
                  {target.icon}
                </div>
                <div className="target-name">{target.name}</div>
                <div className="target-desc">{target.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && <div className="message">{message}</div>}
      {educationalMessage && <div className="educational-message">{educationalMessage}</div>}
      
      <div className="star-effect-container">
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{ left: star.x - 15, top: star.y - 15, position: 'fixed' }}
          >
            ⭐
          </div>
        ))}
      </div>
    </div>
  );
};

export default NatureBridge;