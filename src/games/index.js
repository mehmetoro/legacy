import ShapeIsland from './ShapeIsland/ShapeIsland';
import CareerPath from './CareerPath/CareerPath';
import NatureBridge from './NatureBridge/NatureBridge';
import EmergencyRoom from './EmergencyRoom/EmergencyRoom';
import RecycleStation from './RecycleStation/RecycleStation';
import CommunityWorkshop from './CommunityWorkshop/CommunityWorkshop';
import MomLoveRun from './MomLoveRun/MomLoveRun';
import MomLoveAdventure from './MomLoveAdventure/MomLoveAdventure';
import NatureSprouts from './NatureSprouts/NatureSprouts';

export const games = [
  {
    id: 'shape-island',
    name: 'Şekil Adası',
    ageGroup: '2-4',
    category: 'shapes',
    icon: '🔺',
    component: ShapeIsland,
    description: 'Şekilleri doğru kutulara yerleştir!'
  },
  {
    id: 'nature-sprouts',
    name: 'Minik Fidan Bahcesi',
    ageGroup: '2-4',
    category: 'nature',
    icon: '🌱',
    component: NatureSprouts,
    description: 'Dogaya yardim seceneklerini dogru sec ve minik fidanlari mutlu et!'
  },
  {
    id: 'career-path',
    name: 'Meslek Yolu',
    ageGroup: '4-6',
    category: 'careers',
    icon: '👩‍⚕️',
    component: CareerPath,
    description: 'Aletleri doğru meslek sahiplerine ulaştır!'
  },
  {
    id: 'nature-bridge',
    name: 'Doğa Köprüsü',
    ageGroup: '4-6',
    category: 'nature',
    icon: '🌱',
    component: NatureBridge,
    description: 'Nesneleri doğru doğa bölgesine ulaştır!'
  },
  {
    id: 'emergency-room',
    name: 'Acil Servis',
    ageGroup: '4-6',
    category: 'skills',
    icon: '🚑',
    component: EmergencyRoom,
    description: 'Saglik bakiminda dogru araci secerek yardim et!'
  },
  {
    id: 'mom-love-run',
    name: 'Anneye Sevgi Kosusu',
    ageGroup: '4-6',
    category: 'habits',
    icon: '💖',
    component: MomLoveRun,
    description: 'Akan yolda sevgiyi topla, anneye ulastir ve level atla!'
  },
  {
    id: 'mom-love-adventure',
    name: 'Anne Sevgisi Macerasi',
    ageGroup: '4-6',
    category: 'habits',
    icon: '🌷',
    component: MomLoveAdventure,
    description: 'Mini bolumler, rozetler ve yumusak seslerle sevgi macerasi!'
  },
  {
    id: 'recycle-station',
    name: 'Geri Donusum Istasyonu',
    ageGroup: '6-8',
    category: 'nature',
    icon: '♻️',
    component: RecycleStation,
    description: 'Nesneleri dogru istasyona surukle ve donustur!'
  },
  {
    id: 'community-workshop',
    name: 'Topluluk Atolyesi',
    ageGroup: '8+',
    category: 'habits',
    icon: '🤝',
    component: CommunityWorkshop,
    description: 'Akan yolda gorevleri kacirmadan tamamla ve seviye atla!'
  }
];