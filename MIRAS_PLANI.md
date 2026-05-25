# 🌱 MİRAS (LEGACY) - Yapıcı Oyunlar Platformu

## 1. Proje Vizyonu ve Hikaye

**Miras**, çocukların ve gençlerin **sadece inşa etme, yaşatma ve keşfetme** üzerine kurulu oyunlar oynadığı, **tamamen ücretsiz, açık kaynaklı ve reklamsız** bir platformdur.

**Hikaye:** Günümüzde çocukların oynadığı oyunların çoğu kırma, yıkma, vurma, öldürme konseptlidir. Miras, buna zıt olarak; bir çöpü doğru kutuya atmayı, bir tohumu toprakla buluşturmayı, hasta bir hayvana yardım etmeyi, bir şekli doğru deliğe yerleştirmeyi bir **macera** haline getirir. Amaç, eğlendirirken **iyi alışkanlıklar** (yardımlaşma, temizlik, doğa sevgisi) ve **yetenek farkındalığı** (şekil/renk tanıma, problem çözme, el-göz koordinasyonu) kazandırmaktır.

Bu proje, "Bugünün tohumu, yarının mirası" anlayışıyla, çocukların boş zamanlarını dönüştürmeyi hedefler. Kodları tamamen açıktır, herkes katkıda bulunabilir, herkes yeni oyunlar ekleyebilir.

## 2. Proje Hedefleri (Kesinlikle Yapılmayacaklar)

| Yapılacaklar ✅ | Yapılmayacaklar ❌ |
| :--- | :--- |
| Şiddet içermeyen, yapıcı oyunlar | Kırma, yıkma, vurma, öldürme, parçalama |
| Görsel ve işitsel geri bildirimlerle öğrenme | Uzun ve sıkıcı eğitim videoları |
| Yaşa ve yeteneğe göre zorluk seviyeleri | Rekabet ve kaybetme kaygısı |
| Açık kaynak, herkes yeni oyun ekleyebilir | Gizli ücretler veya reklamlar |
| Çocukların ilgi alanlarını keşfetmesine yardımcı olmak | Kullanıcı verilerini toplamak (anonimdir) |

## 3. Teknik Altyapı (EyeBridge ile Aynı)

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Frontend** | React + Vite | Hızlı, modern web uygulaması |
| **Hosting** | GitHub Pages | Ücretsiz, GitHub Actions ile otomatik yayın |
| **Veritabanı** | Firebase (Free Tier) | Oyun ilerlemesi, anonim tercih ve skor verileri |
| **Oyun Motoru** | HTML5 / Canvas | Her oyun bağımsız bir bileşen |
| **Geliştirici API'si** | Basit JavaScript API'si | Topluluk oyun ekleyebilsin |
| **Depo** | GitHub (public) | Açık kaynak ve topluluk katkısına açık |

## 4. Yaş Grupları ve Oyun Mekanikleri

Oyunlar, yaşa ve yeteneğe göre 4 ana kategoriye ayrılır. Her oyun **"sürükle-bırak" (drag-drop)** veya **"tıkla-seç" (click-select)** ile oynanır.

| Yaş | Kategori | Mekanik | Örnek Oyun |
| :--- | :--- | :--- | :--- |
| **2-4** | Şekil, Renk ve Doğa Sevgisi | Eşleştirme / Basit seçim | **"Şekil Adası"** ve **"Minik Fidan Bahçesi"**: Minik görevlerde doğaya yardım seçimini yap, fidanları mutlu et. |
| **4-6** | Doğa, Nazik Bakım ve Aile Sevgisi | Sürükle-bırak / Tıkla-seç / Akan yol | **"Doğa Köprüsü"**, **"Acil Servis"**, **"Anneye Sevgi Koşusu"** ve **"Anne Sevgisi Macerası"**: Sevgi nesnelerini toplayıp anneye ulaştır, mini bölümler ve rozetlerle akışta görev tamamla. |
| **6-8** | Geri Dönüşüm ve Sorumluluk | Çoklu hedef eşleştirme | **"Geri Dönüşüm İstasyonu"**: Atıkları geri dönüşüm, organik, paylaşım ve tamir alanlarına ayır. |
| **8+** | Toplumsal Alışkanlık ve Akış Oyunu | Akan yol + görev taşıma + seviye artışı | **"Topluluk Atölyesi"**: Kahraman sağ-sol ilerler, çöp/su/tohum görevlerini doğru hedefe ulaştırır; hız ve görev yoğunluğu artar. |

## 5. Oyun Tasarım Kuralları (Copilot Skill - Çok Önemli!)

**Tüm oyunlar için kesinlikle uyulması gereken kurallar:**

1.  **Şiddet kesinlikle yasaktır:** Hedefler asla "yok edilmez", dönüştürülür veya doğru yere taşınır.
2.  **Oyunlar eğitici değil, alışkanlık kazandırıcıdır:** Çocuk "ders çalışıyor" hissi yaşamadan, tekrar ederek iyi davranışları doğal rutine dönüştürür.
3.  **Her doğru eylem için görsel ve işitsel geri bildirim şarttır:** Doğru yere koyunca "ding" sesi ve yeşil ışık; yanlışsa "uh oh" ve kırmızı ışık.
4.  **Başarısızlık cezalandırılmaz:** Yanlış eylemde sadece geri bildirim verilir, puan kırılmaz (küçük yaşlar için). Büyük yaşlarda puan kaybı çok az olabilir.
5.  **Oyunlar en fazla 3-5 dakikalık turlardan oluşur:** Çocukların dikkat süresi kısadır. Her turda 5-10 hedef olur.
6.  **Görseller karikatür tarzında ve neşelidir:** Gerçekçi, korkutucu veya karmaşık görseller yasaktır.
7.  **Sesler yumuşak ve teşvik edicidir:** Yüksek, ani veya rahatsız edici sesler yasaktır.
8.  **Tüm oyunlar, `MIRAS_PLANI.md` güncellenerek yapılır:** Yeni bir oyun fikri için önce bu dosyaya eklenir, sonra kodlanır.

## 6. Standart Oyun Ekleme Yapısı (Açık Kaynak Katkısı)

Topluluk katkılarında bakım yükünü azaltmak için her oyun aynı iskelete uyar:

1. Oyun klasörü: `src/games/OyunAdi/`
2. Zorunlu dosyalar:
  - `OyunAdi.jsx` (oyun bileşeni)
  - `OyunAdi.css` (yalnızca o oyuna ait stiller)
  - `meta.js` (oyun adı, yaş aralığı, kategori, ikon, açıklama)
3. Oyun kayıt adımı: `src/games/index.js` dosyasına oyun meta bilgisini ekle.
4. Oyun tur süresi: 3-5 dakika, 5-10 hedef.
5. Etkileşim modeli: sadece sürükle-bırak, eşleştirme, sıralama, doğru yere koyma.

Bu standart yapı sayesinde yeni oyunlar hızlıca eklenir, inceleme kolaylaşır, ana sayfa kartları otomatik olarak aynı düzende görüntülenir.

## 7. Geliştirici API'si (Topluluk Katkısı İçin)

Herkes kendi oyununu ekleyebilir. Bunun için basit bir JavaScript API'si hazırlanacaktır.

```javascript
// Bir oyun geliştiricisinin yazması gereken asgari kod
Miras.registerGame({
  name: "Temizlik Kahramanı",
  ageGroup: "6-8",
  category: "doğa",
  component: () => import("./games/TemizlikKahramani.jsx")
});