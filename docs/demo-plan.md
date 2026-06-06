# Demo Plan - 3 to 5 Minutes

Goal: prove a live, repeatable, privacy-safe consumer walking-route flow.

## Setup

- [ ] Vercel web application is open
- [ ] Render `/health/live` is reachable from an external network
- [ ] Render `POST /api/v1/routes` returns live Google walking alternatives
- [ ] `CURSOR_API_KEY` is configured only on Vercel
- [ ] Route Assistant returns a live Cursor SDK response
- [ ] anonymization and training evidence is open under `reports/`
- [ ] local fallback is ready only for network failure

## Script

**0:00 - Problem.**

"Haritalar bize en kisa yolu soyluyor, fakat o yolun fiziksel olarak ne kadar
acik, kaldirimli veya yesil oldugunu anlatmiyor. OmniSight, bir yere giderken
hangi sokak deneyimini yasayacagimizi secmemize yardim ediyor."

**0:30 - Live route request.**

Choose an origin, destination, and preference such as `Daha Ferah`. Show that
the browser calls the Render Go API and that Go obtains live `WALK`
alternatives from Google Routes.

Point out distance, duration, Google attribution, and the generated-live
indicator.

**1:30 - Honest scoring boundary.**

Show route analysis coverage. If a route has no matching physical analysis,
its OmniSight score is `null` and the UI says coverage is insufficient.

"Sistem veri yokken guvenlik skoru uydurmuyor. Yalnizca fiziksel cevre
gostergesi bulunan segmentleri yeniden siraliyor."

Never say guaranteed safe, crime-free, or actual pedestrian density.

**2:15 - Cursor SDK Route Assistant.**

Ask "Bu rota neden onerildi?" Show the live response from
`POST /api/route-assistant`.

"Kullanici Cursor'a giris yapmiyor. Anahtar Vercel sunucusunda. SDK sadece
mevcut rota metriklerini acikliyor; skoru degistiremiyor ve ham konum gecmisi
almiyor."

There is no mock response. If Cursor is unavailable, the product displays the
explicit unavailable state.

**3:00 - CV, training, and KVKK evidence.**

Open `reports/training-summary.md` and the selected Modal run:

- 60 anonymized images prepared locally
- faces and plates masked before upload/training
- SegFormer physical-environment baseline
- selected B200 auxiliary run with recorded revisions and checkpoint hash
- person/rider/vehicle classes discarded before persistence

**4:00 - Architecture and close.**

"Core backend masterfabric-go mimarisinde Go ve Render'da; web Vercel'de;
rotalar Google Routes'tan canli; modeller Hugging Face'ten; egitim yalnizca
anonim veriyle Modal'da; Cursor SDK urun icinde rota aciklama asistani."

Show the per-feature commit history and the repository presentation.

## Failure Handling

| Failure | Demo behavior |
| --- | --- |
| Cursor SDK unavailable | explicit `503` / unavailable state, no fake answer |
| Physical coverage missing | Google alternatives remain visible, score stays `null` |
| Render unavailable | controlled local Go service for recovery, clearly labeled |
| Google Routes unavailable | visible upstream error, no fabricated route |
| CV network unavailable | previously recorded reproducible reports and private checkpoint evidence |
