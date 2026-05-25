import { useState } from 'react';
import { games } from './games';
import './App.css';

const ageOrder = ['2-4', '4-6', '6-8', '8+'];

const ageSummaries = {
  '2-4': 'Temel eslestirme ve sakin baslangic oyunlari.',
  '4-6': 'Hareketli gorevler ve aliskanlik temelli mini maceralar.',
  '6-8': 'Sure, dikkat ve karar vermeyi guclendiren oyunlar.',
  '8+': 'Akici tempoda seviye ve gorev yonetimi isteyen oyunlar.'
};

const categoryLabels = {
  shapes: 'Sekiller',
  careers: 'Meslekler',
  nature: 'Doga',
  skills: 'Bakim',
  habits: 'Aliskanlik'
};

const paceByGameId = {
  'shape-island': 'Sakin',
  'career-path': 'Sakin',
  'nature-bridge': 'Sakin',
  'emergency-room': 'Akici',
  'mom-love-run': 'Akici',
  'mom-love-adventure': 'Akici',
  'recycle-station': 'Sureli',
  'community-workshop': 'Akici'
};

const difficultyByAge = {
  '2-4': 'Kolay',
  '4-6': 'Orta',
  '6-8': 'Orta-Zor',
  '8+': 'Zor'
};

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [ageFilter, setAgeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [paceFilter, setPaceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const featuredGameIds = ['shape-island', 'nature-bridge', 'recycle-station', 'community-workshop'];
  const featuredGames = featuredGameIds
    .map(id => games.find(game => game.id === id))
    .filter(Boolean);

  const categoryOptions = [
    'all',
    ...Array.from(new Set(games.map(game => game.category)))
  ];

  const difficultyOptions = ['all', ...Array.from(new Set(games.map((game) => difficultyByAge[game.ageGroup] || 'Orta')))];
  const paceOptions = ['all', ...Array.from(new Set(games.map((game) => paceByGameId[game.id] || 'Sakin')))];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredGames = games.filter((game) => {
    const agePass = ageFilter === 'all' || game.ageGroup === ageFilter;
    const categoryPass = categoryFilter === 'all' || game.category === categoryFilter;
    const difficulty = difficultyByAge[game.ageGroup] || 'Orta';
    const pace = paceByGameId[game.id] || 'Sakin';
    const difficultyPass = difficultyFilter === 'all' || difficulty === difficultyFilter;
    const pacePass = paceFilter === 'all' || pace === paceFilter;
    const searchPass = !normalizedSearch
      || game.name.toLowerCase().includes(normalizedSearch)
      || game.description.toLowerCase().includes(normalizedSearch);

    return agePass && categoryPass && difficultyPass && pacePass && searchPass;
  });

  const groupedGames = ageOrder
    .map((age) => ({
      age,
      summary: ageSummaries[age],
      games: filteredGames.filter((game) => game.ageGroup === age)
    }))
    .filter((group) => group.games.length > 0);

  const GameComponent = selectedGame ? selectedGame.component : null;

  return (
    <div className="app">
      {!selectedGame ? (
        <>
          <header className="hero">
            <div className="sun-glow" aria-hidden="true" />
            <div className="hero-content container">
              <p className="eyebrow">Miras | Yapici Oyun Platformu</p>
              <h1 className="hero-title">Sakin, Neseli ve Aliskanlik Kazandiran Oyunlar</h1>
              <p className="hero-description">
                Cocuklar; copu cope atma, geri donusum, gulumseme, yardimlasma ve mesleki yatkinlik
                gibi davranislari oyunla tekrar ederek dogal rutine donusturur.
              </p>

              <div className="quick-links" aria-label="Ornek oyunlar">
                {featuredGames.map((game, index) => (
                  <button
                    key={game.id}
                    className="quick-link"
                    onClick={() => setSelectedGame(game)}
                  >
                    <span className="quick-link-index">0{index + 1}</span>
                    <span>{game.icon} {game.name}</span>
                  </button>
                ))}
              </div>

              <div className="hero-badges">
                <span className="badge">Siddet Icermez</span>
                <span className="badge">Acik Kaynak</span>
                <span className="badge">Ucretsiz</span>
                <span className="badge">Aliskanlik Odakli</span>
              </div>
            </div>
          </header>

          <section className="games-section">
            <div className="container">
              <h2 className="section-title">Kategorize Oyun Kutuphanesi</h2>
              <p className="section-subtitle">
                Oyunlari yas, tema ve anahtar kelimeye gore filtreleyip kolayca secin.
              </p>

              <div className="discovery-panel">
                <div className="search-wrap">
                  <label htmlFor="game-search" className="search-label">Oyun ara</label>
                  <input
                    id="game-search"
                    className="search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Ornek: geri donusum, sevgi, meslek"
                  />
                </div>

                <div className="filter-row">
                  <div className="filter-group">
                    <span className="filter-title">Yas</span>
                    {['all', ...ageOrder].map((age) => (
                      <button
                        key={age}
                        className={`filter-chip ${ageFilter === age ? 'active' : ''}`}
                        onClick={() => setAgeFilter(age)}
                      >
                        {age === 'all' ? 'Tum yaslar' : `${age} yas`}
                      </button>
                    ))}
                  </div>

                  <div className="filter-group">
                    <span className="filter-title">Tema</span>
                    {categoryOptions.map((category) => (
                      <button
                        key={category}
                        className={`filter-chip ${categoryFilter === category ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category === 'all' ? 'Tum temalar' : (categoryLabels[category] || category)}
                      </button>
                    ))}
                  </div>

                  <div className="filter-group">
                    <span className="filter-title">Zorluk</span>
                    {difficultyOptions.map((difficulty) => (
                      <button
                        key={difficulty}
                        className={`filter-chip ${difficultyFilter === difficulty ? 'active' : ''}`}
                        onClick={() => setDifficultyFilter(difficulty)}
                      >
                        {difficulty === 'all' ? 'Tum seviyeler' : difficulty}
                      </button>
                    ))}
                  </div>

                  <div className="filter-group">
                    <span className="filter-title">Tempo</span>
                    {paceOptions.map((pace) => (
                      <button
                        key={pace}
                        className={`filter-chip ${paceFilter === pace ? 'active' : ''}`}
                        onClick={() => setPaceFilter(pace)}
                      >
                        {pace === 'all' ? 'Tum tempolar' : pace}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {groupedGames.length === 0 ? (
                <div className="empty-state">
                  <h3>Filtreye uygun oyun bulunamadi</h3>
                  <p>Aramayi temizleyebilir veya filtreleri "Tum" secimine alabilirsiniz.</p>
                </div>
              ) : (
                groupedGames.map((group) => (
                  <section key={group.age} className="age-group-block">
                    <div className="age-group-header">
                      <h3>{group.age} yas oyunlari</h3>
                      <span>{group.games.length} oyun</span>
                    </div>
                    <p className="age-group-summary">{group.summary}</p>

                    <div className="games-grid">
                      {group.games.map((game) => (
                        <button key={game.id} className="game-card" onClick={() => setSelectedGame(game)}>
                          <div className="game-card-icon">{game.icon || '🎮'}</div>
                          <h3 className="game-card-title">{game.name}</h3>
                          <p className="game-card-description">{game.description}</p>
                          <div className="game-tags">
                            <span className="tag-chip difficulty">{difficultyByAge[game.ageGroup] || 'Orta'}</span>
                            <span className="tag-chip pace">{paceByGameId[game.id] || 'Sakin'}</span>
                            <span className="tag-chip category">{categoryLabels[game.category] || game.category}</span>
                          </div>
                          <div className="game-card-footer">
                            <span className="game-age-badge">{game.ageGroup} yas</span>
                            <span className="game-play-button">Simdi Oyna →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </section>

          <section className="features-section">
            <div className="container">
              <h2 className="section-title">Miras Ne Kazandirir?</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🕊️</div>
                  <h3>Siddetsiz Tasarim</h3>
                  <p>Vurma, kirma, patlatma yok. Sadece birlestirme, yerlestirme ve yardim etme var.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">♻️</div>
                  <h3>Guzel Aliskanliklar</h3>
                  <p>Cop ayristirma, gulumseme, nazik iletisim ve sorumluluk gibi davranislar tekrar edilir.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🧩</div>
                  <h3>Mesleki Yatkinlik</h3>
                  <p>Oyun gorevleri cocugun ilgi duydugu meslek tiplerini erken fark etmeye yardim eder.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💛</div>
                  <h3>Yorulmadan Ogrenme</h3>
                  <p>Ders hissi vermeden, kisa turlarla davranisi pekistiren keyifli bir deneyim sunar.</p>
                </div>
              </div>
            </div>
          </section>

          <footer className="footer">
            <div className="container">
              <p>Miras - Bugunun tohumlari, yarinin mirasi.</p>
              <p className="footer-links">
                <a href="https://github.com/mehmetoro/Miras" target="_blank" rel="noopener noreferrer">GitHub</a> |
                <a href="https://github.com/mehmetoro/Miras/blob/main/MIRAS_PLANI.md" target="_blank" rel="noopener noreferrer">MIRAS_PLANI</a>
              </p>
            </div>
          </footer>
        </>
      ) : (
        <div className="game-container">
          <button className="back-button" onClick={() => setSelectedGame(null)}>
            ← Ana Sayfaya Dön
          </button>
          <GameComponent />
        </div>
      )}
    </div>
  );
}

export default App;