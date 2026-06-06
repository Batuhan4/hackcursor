# Deep Research Prompt

```text
Cursor x ALT+TAB Hackathon için detaylı ürün, veri seti, model ve teknik strateji araştırması yap.

Bağlam:
6 Haziran 2026 tarihli hackathon’da AI-driven kentsel çözümler geliştirilecek. Proje, gerçek kentsel bağlamda kamu faydası üretmeli. Zorunlu stack:
- Web: Next.js
- Mobil: Expo
- Backend: Go
- Backend mimarisi: https://github.com/gurkanfikretgunak/masterfabric-go kullanılmalı
- AI dataset/model kaynağı: Hugging Face
- Harici veri kaynağı: Google Street View API
- Web hosting: Vercel
- Backend hosting: Render.com
- Database tercihi: Render Postgres
- Cursor IDE, Cursor ruleset ve mümkünse Cursor SDK/CLI kullanımı README’de belgelenmeli
- KVKK: yüz tanıma, plaka okuma, kişi/araç takibi, profilleme yasak. Yüzler ve plakalar model/detection/training/demo öncesi geri döndürülemez blur/mask yapılmalı. Ham görüntüler public repo/cloud’a yüklenemez ve hackathon sonunda silme belgelenmeli.

Puanlama:
- 30 puan teknik çalışırlık, mimariye uyum, canlı demo
- 25 puan CV doğruluğu/güvenilirliği
- 20 puan kamu faydası
- 10 puan AI adaptasyonu / Cursor / agentic yapı
- 10 puan KVKK ve etik
- 5 puan README/sunum

Araştırma hedefi:
6 saatlik hackathon’da gerçekçi şekilde canlı demo yapılabilecek en güçlü proje fikrini bulmak. Sadece yaratıcı fikir değil; veri, model, mimari, demo akışı, riskler ve uygulanabilirlik analizi istiyorum.

Şu başlıklarda detaylı araştır:

1. Proje Fikri Adayları
En az 8 farklı kentsel computer vision proje fikri öner:
- tabela tespiti / envanteri
- çöp kutusu veya atık noktası tespiti
- yol bozukluğu / çukur / asfalt hasarı tespiti
- kaldırım engeli / erişilebilirlik sorunu tespiti
- trafik işareti / yönlendirme levhası envanteri
- sokak lambası / direk / kent mobilyası tespiti
- kaçak/uygunsuz tabela veya görsel kirlilik tespiti
- yeşil alan / ağaç / gölgelik analizi
ve gerekiyorsa daha iyi alternatifler.

Her fikir için:
- Kamu faydası nedir?
- Google Street View veya belediye araç görüntüsüyle çalışır mı?
- Hugging Face’te uygun dataset/model bulunabilir mi?
- 6 saatte MVP yapılabilir mi?
- Canlı demo nasıl olur?
- KVKK riski nedir?
- Jüri puanlamasında avantaj/dezavantajı nedir?
- Teknik risk seviyesi: düşük/orta/yüksek
- Tahmini demo etkisi: düşük/orta/yüksek

2. En İyi 3 Fikri Seç
Tüm fikirleri şu matrisle puanla:
- Teknik yapılabilirlik: 1-10
- CV doğruluğu şansı: 1-10
- Kamu faydası: 1-10
- Demo etkisi: 1-10
- KVKK güvenliği: 1-10
- Veri/model bulunabilirliği: 1-10
- 6 saatte bitirme ihtimali: 1-10
Toplam puana göre en iyi 3 fikri seç ve nedenlerini açıkla.

3. Hugging Face Dataset ve Model Araştırması
Özellikle Hugging Face üzerinde şu tür dataset/model’leri ara:
- traffic sign detection
- street sign detection
- road damage detection
- pothole detection
- waste bin detection
- urban object detection
- street furniture detection
- license plate detection only for anonymization
- face detection only for anonymization

Her uygun kaynak için:
- Link
- Lisans
- Dataset/model tipi
- Sınıflar
- Format: YOLO/COCO/CSV/başka
- Kullanılabilirlik
- İndirme/entegrasyon kolaylığı
- Türk/Avrupa şehir görüntülerine transfer edilebilirlik
- Canlı demo için uygun mu?
- Riskler

Önemli:
Plaka ve yüz modelleri sadece anonimleştirme için kullanılabilir. Plaka okuma/OCR, yüz tanıma veya identity feature kesinlikle önerme.

4. Google Street View API Kullanımı
Google Street View API ile bu proje nasıl beslenebilir araştır:
- Koordinattan image alma
- Heading/pitch/fov parametreleri
- Kota/rate-limit ve cache stratejisi
- Aynı koordinattan tekrar üretilebilir demo üretme
- Türkiye/İstanbul/Güngören özelinde kullanılabilirlik riskleri
- Street View görüntülerindeki yüz/plaka blur yeterli mi? Yine de kendi blur gate gerekli mi?
- Demo için 5-20 koordinatlık fixture nasıl hazırlanmalı?

5. Teknik Mimari Önerisi
Zorunlu stack’e uygun mimari öner:
- Next.js web dashboard
- Go backend, masterfabric-go mimarisi ile
- Render Postgres schema
- Python CV worker veya Go içinden subprocess/job çağrısı
- Hugging Face model/dataset entegrasyonu
- Google Street View image fetch
- Anonymization pipeline
- Detection pipeline
- API endpoint tasarımı
- Web UI sayfaları
- Expo minimum scope önerisi

Backend için önerilen entity/table tasarla:
- image_sources
- processing_jobs
- detections
- anonymization_events
- demo_runs
- audit_events
veya daha iyi bir schema.

6. Cursor SDK / CLI Bonus Stratejisi
Cursor SDK veya Cursor CLI’yi bu projede düşük riskli şekilde nasıl kullanabiliriz?
Amaç: Ek puan almak, MVP’yi riske atmamak.

Öneriler üret:
- demo sonuçlarından otomatik README/demo raporu üretme
- detection JSON’dan jüri sunum özeti üretme
- KVKK checklist otomasyonu
- quality gate script’i
- prompt log / agentic workflow belgesi
- Cursor ruleset ile bağlantı

Her öneri için:
- Uygulama zorluğu
- README’de nasıl belgelenir?
- Gerçek ürün değerine katkısı
- Hackathon bonus etkisi

7. KVKK ve Etik Güvenlik Planı
Ayrıntılı KVKK planı çıkar:
- Ham görüntü nerede tutulmalı/tutulmamalı?
- Blur hangi aşamada yapılmalı?
- Yüz/plaka tespiti nasıl sadece anonimleştirme amaçlı sınırlandırılır?
- Ham verinin silindiği nasıl belgelenir?
- README’de hangi ifadeler kullanılmalı?
- Demo sırasında ne gösterilmeli/ne gösterilmemeli?
- Riskli edge case’ler neler?

8. 6 Saatlik Uygulama Planı
Saat saat gerçekçi plan çıkar:
- 0:00-0:30 scaffold ve env
- 0:30-1:30 CV anonymization
- 1:30-2:30 object detection
- 2:30-3:30 Go API
- 3:30-4:30 Next.js UI
- 4:30-5:15 deploy
- 5:15-6:00 README, KVKK, sunum, Cursor SDK bonus
Bu planı daha iyi hale getir ve kritik path’i belirt.

9. Demo Senaryosu
Jüri karşısında 3-5 dakikalık demo akışı öner:
- Problem anlatımı
- Veri girişi
- Anonimleştirme kanıtı
- Obje tespiti
- Harita/liste gösterimi
- Kamu faydası
- KVKK güvenliği
- AI/Cursor adaptasyonu
- Tekrarlanabilir sonuç

10. Nihai Tavsiye
Araştırmanın sonunda net bir öneri ver:
- Hangi proje fikri seçilmeli?
- Hangi dataset/model kullanılmalı?
- Hangi obje sınıfları MVP’ye alınmalı?
- Hangi sınıflar kapsam dışı bırakılmalı?
- Hangi teknik mimari uygulanmalı?
- Hangi risklere dikkat edilmeli?
- İlk yapılacak 10 somut iş ne olmalı?

Çıktı formatı:
- Önce kısa executive summary
- Sonra karşılaştırmalı tablo
- Sonra detaylı kaynak listesi
- Sonra önerilen MVP
- Sonra riskler
- Sonra 6 saatlik uygulama planı
- Linkleri mutlaka ver
- Emin olmadığın yerlerde “varsayım” diye belirt
- Lisans ve KVKK risklerini özellikle işaretle
```
