import { useState, useEffect, useRef } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import './ShapeIsland.css';

const shapes = [
  { id: 'circle', name: 'Daire', icon: '●', color: '#ff6b6b', container: 'circle' },
  { id: 'triangle', name: 'Üçgen', icon: '▲', color: '#feca57', container: 'triangle' },
  { id: 'square', name: 'Kare', icon: '■', color: '#48dbfb', container: 'square' }
];

const ShapeIsland = () => {
  const [currentShape, setCurrentShape] = useState(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [stars, setStars] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [shakeShape, setShakeShape] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(false);
  const shapeRef = useRef(null);

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
      newShape();
    }
  }, [sessionId]);

  const createStarEffect = (x, y) => {
    const newStar = { id: Date.now(), x, y };
    setStars(prev => [...prev, newStar]);
    setTimeout(() => {
      setStars(prev => prev.filter(star => star.id !== newStar.id));
    }, 500);
  };

  const newShape = () => {
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    setCurrentShape(randomShape);
    setMessage('');
    setShakeShape(false);
  };

  const handleDrop = async (containerType, event) => {
    if (!currentShape) return;
    if (!sessionId) {
      setMessage('Oturum başlatılıyor, lütfen bekleyin...');
      return;
    }

    const isCorrect = currentShape.container === containerType;
    
    if (isCorrect) {
      const newScore = score + 10;
      setScore(newScore);
      setScoreAnim(true);
      setTimeout(() => setScoreAnim(false), 300);
      setMessage('🎉 Doğru! +10 puan');
      
      // Işık efekti için container'a class ekle
      const containerEl = document.querySelector(`.container[data-shape="${currentShape.container}"]`);
      if (containerEl) {
        containerEl.classList.add('correct-flash');
        setTimeout(() => containerEl.classList.remove('correct-flash'), 500);
      }
      
      // Tıklama pozisyonunda yıldız efekti
      if (event) {
        createStarEffect(event.clientX, event.clientY);
      }
      
      // Ses efekti için (opsiyonel - Web Speech API ile basit bip)
      try {
        const audio = new Audio();
        // Basit bip sesi (base64 ile)
        audio.src = 'data:audio/wav;base64,U3RlYWx0aCBXZWIgQXVkaW8gVGVzdA==';
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Ses çalınamadı:', e));
      } catch(e) { console.log('Ses hatası:', e); }
      
      // Firebase'e skor kaydet
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'ShapeIsland',
          score: newScore,
          level: 1,
          createdAt: new Date()
        });
        
        const statsRef = doc(db, 'gameStats', 'ShapeIsland');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(newScore)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'ShapeIsland',
            playCount: 1,
            totalScore: newScore,
            avgScore: newScore
          });
        });
      } catch (error) {
        console.error('Firebase error:', error);
      }
    } else {
      setMessage('❌ Yanlış kutu! Tekrar dene.');
      setShakeShape(true);
      setTimeout(() => setShakeShape(false), 500);
    }
    
    setTimeout(() => {
      newShape();
    }, 800);
  };

  if (!currentShape) {
    return <div className="loading">🌊 Ada hazırlanıyor...</div>;
  }

  return (
    <div className="shape-island">
      {/* Bulutlar */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      
      {/* Dalgalar */}
      <div className="wave-layer wave-1"></div>
      <div className="wave-layer wave-2"></div>
      <div className="wave-layer wave-3"></div>
      
      <div className={`score-board ${scoreAnim ? 'score-pop' : ''}`}>
        🏆 Puan: {score}
      </div>
      
      <div className="river">
        <div 
          ref={shapeRef}
          className={`floating-shape ${isDragging ? 'dragging' : ''} ${shakeShape ? 'shake' : ''}`}
          style={{ backgroundColor: currentShape.color }}
          draggable="true"
          onDragStart={(e) => {
            setIsDragging(true);
            e.dataTransfer.setData('text/plain', currentShape.id);
          }}
          onDragEnd={() => setIsDragging(false)}
        >
          {currentShape.icon}
        </div>
      </div>

      <div className="containers">
        {shapes.map(shape => (
          <div
            key={shape.container}
            className="container"
            data-shape={shape.container}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(shape.container, e);
            }}
          >
            <div className="container-shape" style={{ backgroundColor: shape.color }}>
              {shape.icon}
            </div>
            <div className="container-label">{shape.name} Kutusu</div>
          </div>
        ))}
      </div>

      {message && <div className="message">{message}</div>}
      
      {/* Yıldız efektleri */}
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

export default ShapeIsland;