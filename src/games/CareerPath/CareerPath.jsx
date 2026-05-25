import { useState, useEffect } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import './CareerPath.css';

const tools = [
  { 
    id: 'stethoscope', 
    name: 'Steteskop', 
    icon: '🩺', 
    profession: 'doctor',
    professionName: 'Doktor',
    color: '#ff6b6b'
  },
  { 
    id: 'spatula', 
    name: 'Spatula', 
    icon: '🍳', 
    profession: 'chef',
    professionName: 'Aşçı',
    color: '#feca57'
  },
  { 
    id: 'hose', 
    name: 'İtfaiye Hortumu', 
    icon: '🧯', 
    profession: 'firefighter',
    professionName: 'İtfaiyeci',
    color: '#ff9f43'
  },
  { 
    id: 'book', 
    name: 'Kitap', 
    icon: '📚', 
    profession: 'teacher',
    professionName: 'Öğretmen',
    color: '#48dbfb'
  }
];

const characters = [
  {
    id: 'doctor',
    name: 'Doktor Ayşe',
    icon: '👩‍⚕️',
    title: 'Doktor',
    description: 'Hastaları iyileştirir',
    color: '#ff6b6b'
  },
  {
    id: 'chef',
    name: 'Aşçı Mehmet',
    icon: '👨‍🍳',
    title: 'Aşçı',
    description: 'Lezzetli yemekler yapar',
    color: '#feca57'
  },
  {
    id: 'firefighter',
    name: 'İtfaiyeci Ali',
    icon: '🧑‍🚒',
    title: 'İtfaiyeci',
    description: 'Yangınları söndürür',
    color: '#ff9f43'
  },
  {
    id: 'teacher',
    name: 'Öğretmen Zeynep',
    icon: '👩‍🏫',
    title: 'Öğretmen',
    description: 'Çocuklara bilgi öğretir',
    color: '#48dbfb'
  }
];

const CareerPath = () => {
  const [currentTool, setCurrentTool] = useState(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [stars, setStars] = useState([]);
  const [shakeTool, setShakeTool] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(false);
  const [successEffect, setSuccessEffect] = useState(null);

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
      newTool();
    }
  }, [sessionId]);

  const createStarEffect = (x, y) => {
    const newStar = { id: Date.now(), x, y };
    setStars(prev => [...prev, newStar]);
    setTimeout(() => {
      setStars(prev => prev.filter(star => star.id !== newStar.id));
    }, 500);
  };

  const newTool = () => {
    const randomTool = tools[Math.floor(Math.random() * tools.length)];
    setCurrentTool(randomTool);
    setMessage('');
    setShakeTool(false);
    setSuccessEffect(null);
  };

  const handleDrop = async (professionId, event) => {
    if (!currentTool) return;
    if (!sessionId) {
      setMessage('Oturum başlatılıyor, lütfen bekleyin...');
      return;
    }

    const isCorrect = currentTool.profession === professionId;
    
    if (isCorrect) {
      const newScore = score + 10;
      setScore(newScore);
      setScoreAnim(true);
      setTimeout(() => setScoreAnim(false), 300);
      setMessage(`🎉 Doğru! ${currentTool.name} ${currentTool.professionName}'a ait! +10 puan`);
      
      // Başarı efekti
      setSuccessEffect(professionId);
      setTimeout(() => setSuccessEffect(null), 500);
      
      // Tıklama pozisyonunda yıldız efekti
      if (event) {
        createStarEffect(event.clientX, event.clientY);
      }
      
      // Ses efekti için basit bip
      try {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,U3RlYWx0aCBXZWIgQXVkaW8gVGVzdA==';
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Ses çalınamadı:', e));
      } catch(e) { console.log('Ses hatası:', e); }
      
      // Firebase'e skor kaydet
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'CareerPath',
          score: newScore,
          level: 1,
          createdAt: new Date()
        });
        
        const statsRef = doc(db, 'gameStats', 'CareerPath');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(newScore)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'CareerPath',
            playCount: 1,
            totalScore: newScore,
            avgScore: newScore
          });
        });
      } catch (error) {
        console.error('Firebase error:', error);
      }
    } else {
      const correctProfession = tools.find(t => t.id === currentTool.id)?.professionName;
      setMessage(`❌ Yanlış! ${currentTool.name} ${correctProfession} ait. Tekrar dene!`);
      setShakeTool(true);
      setTimeout(() => setShakeTool(false), 500);
    }
    
    setTimeout(() => {
      newTool();
    }, 1200);
  };

  if (!currentTool) {
    return <div className="loading">🏥 Meslekler hazırlanıyor...</div>;
  }

  return (
    <div className="career-path">
      {/* Arka plan dekorasyonları */}
      <div className="bg-decoration building-1"></div>
      <div className="bg-decoration building-2"></div>
      <div className="bg-decoration cloud-1"></div>
      <div className="bg-decoration cloud-2"></div>
      
      <div className={`score-board ${scoreAnim ? 'score-pop' : ''}`}>
        🏆 Puan: {score}
      </div>
      
      <div className="game-area">
        <div className="tool-area">
          <div className="tool-label">Bu alet kime ait?</div>
          <div 
            className={`floating-tool ${shakeTool ? 'shake' : ''}`}
            style={{ backgroundColor: currentTool.color }}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', currentTool.id);
            }}
          >
            <span className="tool-icon">{currentTool.icon}</span>
            <span className="tool-name">{currentTool.name}</span>
          </div>
        </div>

        <div className="characters-area">
          <div className="characters-grid">
            {characters.map(character => (
              <div
                key={character.id}
                className={`character-card ${successEffect === character.id ? 'success-flash' : ''}`}
                data-profession={character.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(character.id, e);
                }}
              >
                <div className="character-icon" style={{ backgroundColor: character.color }}>
                  {character.icon}
                </div>
                <div className="character-name">{character.name}</div>
                <div className="character-title">{character.title}</div>
                <div className="character-desc">{character.description}</div>
              </div>
            ))}
          </div>
        </div>
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

export default CareerPath;