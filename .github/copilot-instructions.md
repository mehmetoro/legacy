# Miras Copilot Instructions

## Skill: Oyun Aciklamasi Zorunlulugu

Bu skill, yeni oyun ekleme veya mevcut oyunu buyuk olcude degistirme durumunda otomatik uygulanir.

### Zorunlu Kontrol Listesi

1. `src/games/index.js` dosyasinda oyun kaydi olmalidir.
2. Oyun kaydinda `description` alani bos birakilamaz.
3. `description` metni tek cumle, cocuk dostu ve eylem odakli olmalidir.
4. Siddet cagristiran kelimeler kullanilamaz.
5. Oyun mekanigi degistiyse aciklama da ayni committe guncellenmelidir.
6. Oyun yas grubu degistiyse, gerekli oldugunda `MIRAS_PLANI.md` icindeki yas tablosu da guncellenmelidir.

### Aciklama Kalibi

`[Mekanik] + [Amaç] + [Kisa motivasyon]`

Ornekler:
- `Akan yolda gorevleri kacirmadan tamamla ve seviye atla!`
- `Dogru istasyonu sure dolmadan sec ve puan topla!`
- `Sevgi nesnelerini topla, anneye ulastir ve kalp kazan!`

### Cikis Kontrolu

Is bitmeden once asagidakiler dogrulanir:
- `src/games/index.js` icinde ilgili oyun icin `description` var mi?
- Aciklama oyunun son halindeki mekanigi dogru anlatiyor mu?
- Aciklama sade, kisa ve cocuk dostu mu?
