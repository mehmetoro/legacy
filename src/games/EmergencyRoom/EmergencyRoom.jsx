import { useState, useEffect } from 'react';
import { db, initAnonymousSession } from '../../lib/firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import './EmergencyRoom.css';

const patients = [
  { id: 'fever-check', name: 'Ateş Kontrolü', icon: '🌡️', tool: 'thermometer', toolName: 'Termometre', color: '#feca57', message: 'Harika! Ateşi nazikçe kontrol ettin.' },
  { id: 'cough-care', name: 'Oksürük Bakımı', icon: '😮‍💨', tool: 'syrup', toolName: 'Şurup Kaşığı', color: '#48dbfb', message: 'Harika! Rahatlatıcı şurup verdin.' },
  { id: 'small-scratch', name: 'Küçük Çizik', icon: '😊', tool: 'bandage', toolName: 'Yara Bandı', color: '#ff9f43', message: 'Süper! Nazikçe yara bandı yapıştırdın.' },
  { id: 'throat-check', name: 'Boğaz Kontrolü', icon: '😷', tool: 'stethoscope', toolName: 'Steteskop', color: '#54a0ff', message: 'Çok iyi! Sakin bir kontrol yaptın.' },
  { id: 'hydration', name: 'Su Hatırlatma', icon: '💧', tool: 'water', toolName: 'Su Şişesi', color: '#1dd1a1', message: 'Mükemmel! Su içmeyi hatırlattın.' }
];

const tools = [
  { id: 'bandage', name: 'Yara Bandı', icon: '🩹', color: '#ff6b6b' },
  { id: 'thermometer', name: 'Termometre', icon: '🌡️', color: '#feca57' },
  { id: 'syrup', name: 'Şurup Kaşığı', icon: '🥄', color: '#48dbfb' },
  { id: 'stethoscope', name: 'Steteskop', icon: '🩺', color: '#54a0ff' },
  { id: 'water', name: 'Su Şişesi', icon: '🧴', color: '#1dd1a1' }
];

const EmergencyRoom = () => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [stars, setStars] = useState([]);
  const [scoreAnim, setScoreAnim] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [nextPatientDelay, setNextPatientDelay] = useState(false);

  useEffect(() => {
    const startSession = async () => {
      const id = await initAnonymousSession();
      setSessionId(id);
    };
    startSession();
  }, []);

  useEffect(() => {
    if (sessionId && gameActive) {
      newPatient();
    }
  }, [sessionId, gameActive]);

  useEffect(() => {
    if (timeLeft <= 0 && gameActive) {
      setGameActive(false);
      setMessage('⏰ Süre doldu! Oyun bitti.');
      saveFinalScore();
    }
  }, [timeLeft, gameActive]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameActive && timeLeft > 0) {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const createStarEffect = (x, y) => {
    const newStar = { id: Date.now(), x, y };
    setStars(prev => [...prev, newStar]);
    setTimeout(() => setStars(prev => prev.filter(star => star.id !== newStar.id)), 500);
  };

  const saveFinalScore = async () => {
    if (sessionId) {
      try {
        await setDoc(doc(db, 'gameScores', `${sessionId}_${Date.now()}`), {
          playerId: sessionId,
          gameName: 'EmergencyRoom',
          score: score,
          level: 1,
          createdAt: new Date()
        });
        
        const statsRef = doc(db, 'gameStats', 'EmergencyRoom');
        await updateDoc(statsRef, {
          playCount: increment(1),
          totalScore: increment(score)
        }).catch(() => {
          setDoc(statsRef, {
            gameName: 'EmergencyRoom',
            playCount: 1,
            totalScore: score,
            avgScore: score
          });
        });
      } catch (error) {
        console.error('Firebase error:', error);
      }
    }
  };

  const newPatient = () => {
    if (!gameActive) return;
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    setCurrentPatient(randomPatient);
    setMessage('');
    setNextPatientDelay(false);
  };

  const handleToolSelect = async (toolId, event) => {
    if (!currentPatient || nextPatientDelay || !gameActive) return;
    
    const isCorrect = currentPatient.tool === toolId;
    
    if (isCorrect) {
      const newScore = score + 20;
      setScore(newScore);
      setScoreAnim(true);
      setTimeout(() => setScoreAnim(false), 300);
      setMessage(`🎉 Doğru tedavi! +20 puan - ${currentPatient.message}`);
      
      if (event) createStarEffect(event.clientX, event.clientY);
      
      setNextPatientDelay(true);
      setTimeout(() => {
        newPatient();
      }, 1000);
    } else {
      const newScore = Math.max(0, score - 2);
      setScore(newScore);
      setMessage(`Tekrar deneyelim. ${currentPatient.name} için ${currentPatient.toolName} gerekiyor.`);
    }
  };

  const restartGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    setMessage('');
    newPatient();
  };

  if (!currentPatient && gameActive) {
    return <div className="loading">🚑 Acil servis hazırlanıyor...</div>;
  }

  if (!gameActive) {
    return (
      <div className="emergency-room game-over">
        <div className="game-over-content">
          <div className="game-over-icon">🏥</div>
          <h2>Oyun Bitti!</h2>
          <p>Toplam Puanın: {score}</p>
          <p>Süre doldu. Tebrikler! 🎉</p>
          <button className="restart-button" onClick={restartGame}>Tekrar Oyna</button>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-room">
      <div className="game-header">
        <div className={`score-board ${scoreAnim ? 'score-pop' : ''}`}>
          🏆 Puan: {score}
        </div>
        <div className="timer">
          ⏱️ Süre: {timeLeft} sn
        </div>
      </div>

      <div className="patient-area">
        <div className="patient-card" style={{ backgroundColor: currentPatient.color }}>
          <div className="patient-icon">{currentPatient.icon}</div>
          <div className="patient-name">{currentPatient.name}</div>
          <div className="patient-question">Hangi aletle yardımcı olalım?</div>
        </div>
      </div>

      <div className="tools-area">
        <div className="tools-grid">
          {tools.map(tool => (
            <div
              key={tool.id}
              className="tool-card"
              style={{ backgroundColor: tool.color }}
              onClick={(e) => handleToolSelect(tool.id, e)}
            >
              <div className="tool-icon">{tool.icon}</div>
              <div className="tool-name">{tool.name}</div>
            </div>
          ))}
        </div>
      </div>

      {message && <div className="message">{message}</div>}
      
      <div className="star-effect-container">
        {stars.map(star => (
          <div key={star.id} className="star" style={{ left: star.x - 15, top: star.y - 15, position: 'fixed' }}>⭐</div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyRoom;