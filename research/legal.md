# Hukuki ve Etik Kullanim Notu

> Tarih: 6 Haziran 2026
>
> Bu belge hukuki gorus degildir. Hackathon demosunda kullanilacak veri
> kaynaklari icin teknik ve operasyonel karar kaydidir.

## Kisa Karar

Istanbul'daki MOBESE/KGYS veya belediye trafik kameralarinin goruntulerini
halka acik bir ekrandan izleyebilmek, goruntuyu indirme, kaydetme, yeniden
yayinlama ya da bilgisayarli goruyla analiz etme izni anlamina gelmez.

Gercek belediye kamera akisi ancak su kosullarin tamami saglanirsa kullanilir:

1. Veri sorumlusu veya yetkili kurumdan yazili ve amaci belirli kullanim izni
   alinmistir.
2. Erişim resmi bir API, dosya teslimi veya yetkilendirilmis stream uzerinden
   saglanmistir.
3. Isleme amaci yalnizca cansiz kentsel objeler ve fiziksel sokak
   gostergeleridir.
4. Yuzler ve plakalar modelden once geri dondurulemez bicimde maskelenir.
5. Kisi sayimi, yuz tanima, plaka okuma, demografik cikarim, profil olusturma
   ve kisi/arac takibi yapilmaz.
6. Ham kareler kalici depolamaya, public buluta, GitHub'a veya loglara girmez.
7. Saklama suresi ve hackathon sonu imha islemi belgelenir.

Bu izin yoksa urun demosu `Simulated Municipal Camera Source` adli, acikca
etiketlenmis anonim fixture ile calisir. Sunumda gercek belediye verisine sahip
oldugumuz veya canli MOBESE entegrasyonu yaptigimiz soylenmez.

## Neden Otomatik Olarak "KVKK Sorunu Yok" Diyemeyiz?

- Kamera goruntusundeki belirli veya belirlenebilir kisiler kisisel veri
  niteligindedir. Goruntuyu elde etme, kullanma, siniflandirma veya aktarma da
  veri isleme faaliyetidir.
- Veri sorumlusu; hukuki sebep, belirli ve mesru amac, amacla baglantili ve
  olculu isleme, aydinlatma, erisim guvenligi ve saklama/imha kosullarini
  saglamak zorundadir.
- Sonradan yuz/plaka maskelemek riski azaltir ancak ham goruntunun ilk elde
  edilmesini kendiliginden hukuka uygun hale getirmez.
- Anonimlestirme, verinin baska verilerle eslestirilse dahi bir kisiyle
  iliskilendirilememesini gerektirir. Sadece hafif blur uygulamak bu sonucu
  garanti etmez; demo politikasinda genisletilmis solid mask tercih edilir.

## Demo Icin Savunulabilir Anlatim

Sunumda kullanilacak ifade:

> OmniSight, veri kaynagini degistirilebilir bir adaptor olarak tasarlar.
> Bugunku demo, belediye kamera entegrasyonunu anonim ve tekrar edilebilir
> fixture ile simule eder. Yetkili kurum gercek akisi sagladiginda ayni
> pipeline ham kareyi kalici saklamadan, modelden once yuz ve plakalari
> geri dondurulemez bicimde maskeler ve yalnizca cansiz kentsel gostergeleri
> uretir.

Kullanilmayacak ifadeler:

- "MOBESE goruntulerine erisiyoruz."
- "Halka acik oldugu icin serbestce kullandik."
- "Yuzleri bulaniklastirdigimiz icin KVKK disindayiz."
- "Belediye verileri elimizde."
- "Canli yaya yogunlugunu veya guvenligi olcuyoruz."

## Urun Veri Kaynagi Politikasi

| Kaynak | Demo durumu | Kosul |
|---|---|---|
| Anonim sentetik/fixture veri | Kullanilabilir | Gercek veri gibi sunulmaz |
| Takimin kendi Expo saha cekimi | Kullanilabilir | Aydinlatma/izin, lokal anonymization-first ve ham veri imhasi |
| Yetkili belediye kamera akisi | Kosullu | Yazili izin, resmi erisim, amac ve saklama protokolu |
| Halka acik trafik kamera izleme sayfasi | Kullanilmaz | Acik izleme, yeniden isleme lisansi degildir |
| MOBESE/KGYS | Kullanilmaz | Yetkili kolluk erisimi olmadan programatik kullanim yok |
| Google Street View | Sinirli demo girdisi | Google sartlari ayrica uygulanir; egitim veya sehir capinda kalici endeks yok |

## Juriye Sorulacak Kritik Soru

> Organizasyon veya belediye, yalnizca cansiz kentsel gostergelerin analizi
> icin kullanabilecegimiz yazili izinli bir kamera akisi ya da anonim ornek
> veri saglayacak mi; saglarsa saklama, turetilmis veri ve imha kosullari
> nelerdir?

## Kaynaklar

- KVKK, kamera goruntulerinin kisisel veri olarak islenmesi ve isleme
  faaliyetinin genis kapsami:
  <https://www.kvkk.gov.tr/Icerik/6892/2020-212>
- KVKK, silme, yok etme ve anonim hale getirme tanimlari:
  <https://www.kvkk.gov.tr/Icerik/2038/kisisel-verilerin-silinmesi-yok-edilmesi-veya-anonim-hale-getirilmesi>
- KVKK anonimlestirme rehberi:
  <https://www.kvkk.gov.tr/Icerik/4099/Kisisel-Verilerin-Silinmesi%2C-Yok-Edilmesi-veya-Anonim-Hale-Getirilmesi-Rehberi>
- KVKK Kanunu genel ilkeleri icin resmi kaynak:
  <https://www.kvkk.gov.tr/Icerik/7421/Kisisel-Verilerin-Korunmasina-Iliskin-Bankacilik-Sektoru-Iyi-Uygulamalar-Rehberi>
- IBB UYM trafik gozlem sistemlerinin resmi tanimi:
  <https://uym.ibb.gov.tr/hizmetler/trafik-olcum-ve-gozlem>
