# Class — tarayıcıda çalışan yerel yapay zekâ (NotebookLM benzeri)

Kaynaklarını (PDF, Word, PowerPoint, Excel, ODT/ODP/ODS, EPUB, TXT, MD, web sayfası, yerel sunucuyla ses ve video) yükle, onlarla sohbet et, özet / SSS / çalışma rehberi / quiz / zihin haritası çıkar, cevapları nota kaydet.
Hepsi **tarayıcında** çalışır: model [wllama](https://github.com/ngxson/wllama) (llama.cpp'nin WASM + WebGPU sürümü) ile ekran kartında/işlemcide çalışır, dosyalar yalnızca bu tarayıcının depolamasında (IndexedDB) kalır. Sunucuya hiçbir şey gönderilmez.

## GitHub Pages'ta yayınlama

1. Depoda **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Branch: `main`, klasör: **`/docs`** → Save.
3. Birkaç dakika sonra `https://<kullanici>.github.io/<depo>/` adresinde açılır.

Hiçbir derleme adımı yok; `docs/` klasörü olduğu gibi yayınlanır. wllama ve pdf.js `docs/vendor/` içinde hazır durur, CDN gerekmez.

## Nasıl kullanılır

Telefonda düzen NotebookLM'in mobil web arayüzü gibidir: üstte **Tümü** filtresi, arama ve ayarlar; **Son kullanılan not defterleri** listesi (⋮ menüsünde başlığı düzenle, en üste sabitle, sil); not defterinde **Kaynaklar | Sohbet | Stüdyo** sekmeleri, onay kutulu kaynak listesi, hap biçimli yazma alanı, cevap altında sabitle/kopyala. Ayarlar (dişli) menüsünde model seçimi ile açık/koyu/cihaz teması var. Açılışta **Not defterlerin** ekranı gelir: **Yeni not defteri** karosuna bas, kaynak ekleme penceresi açılır (dosyaları sürükle-bırak ya da seç), sonra not defteri sayfası açılır. Her not defterinin kaynakları, sohbeti ve notları ayrı tutulur; başlığa basıp adını değiştirebilir, ana ekranda karttaki ✕ ile silebilirsin. Not defteri adresi `#nb-…` ile kaydedilir, sayfayı yenileyince kaldığın yerden açılır.

1. Sağ üstten **Model seç** → bir model seç → **Yükle**. İlk seferde Hugging Face'ten iner (birkaç yüz MB – birkaç GB), sonra tarayıcı depolamasında kalır ve bir daha indirilmez.
2. Soldan **Dosya ekle** / **Metin yapıştır** ile kaynak ekle. Kutuyu işaretleyip kaldırarak hangi kaynakların kullanılacağını seç.
3. Sohbete soru yaz. Cevaptaki `[1]`, `[2]` atıflarına basınca ilgili kaynak parçası açılır. Kaynak seçili değilse normal sohbet olur.
4. Sağdaki **Stüdyo** seçili kaynaklardan çıktı üretir:
   - **Sesli özet:** Ayşe ve Can'ın sohbet ettiği bir metin; cihazının konuşma sentezi iki farklı sesle okur. Yerel sunucu açıksa **🎙 Gerçek sesle oluştur** her satırı sunucunun TTS motoruyla iki ayrı sesle seslendirir, tek bir `.wav` dosyasında birleştirir; dosya çıktıyla birlikte saklanır ve indirilebilir.
   - **Zihin haritası:** renkli SVG harita, PNG indirilir.
   - **Görsel özet:** başlık, emojili ana noktalar ve çıkarımdan oluşan bilgi grafiği, PNG indirilir.
   - **Bilgi kartları:** çevirmeli kartlar, "Biliyorum" işaretleme.
   - **Quiz:** çoktan seçmeli, anında doğru/yanlış, puan.
   - **Özet, ana fikirler, SSS, çalışma rehberi:** sohbete metin olarak gelir, **Nota kaydet** ile saklanır.
   Üretilen çıktılar not defterinde **Çıktılar** listesinde kalır. Model, çıktıyı JSON şemasına uyarak üretir; küçük modeller bazen başarısız olur, "tekrar dene" ya da daha büyük model.
5. **Demo (model yok)** düğmesi modeli indirmeden arayüzü dener (cevap yerine eşleşen kaynak parçalarını gösterir). Adrese `?demo` eklersen doğrudan demo açılır.

## Sohbet: komutlar, tepki, yanıt, dosya

Blogger şablonundaki yorum sistemiyle aynı mantık:

- **/komutlar:** yazma alanına `/` yaz, liste açılır (↑ ↓ ile gez, Enter ya da Tab ile seç, Esc ile kapat). Yazma alanının üstündeki **/ Komutlar** düğmesi aynı komutları yana kayan kutucuklar olarak açar/kapatır (telefonda varsayılan kapalı, tercih hatırlanır).
  `/ozet` `/fikir` `/sss` `/rehber` `/sesli` `/harita` `/gorsel` `/kart` `/quiz` `/ekle` `/not` `/yanitla` `/indir` `/model` `/temizle`
- **Tepki:** her mesajın altındaki gülen yüz düğmesi emoji menüsünü açar; seçilen tepki mavi rozet olarak kalır, rozete basınca kalkar.
- **Yanıtla:** mesajı alıntılayarak yazarsın; gönderilen mesajın üstündeki alıntı çubuğuna basınca yanıtlanan mesaja gider ve onu parlatır. Model yanıtlanan mesajı da bağlam olarak görür.
- **Dosya ekleme:** ataç düğmesi, sürükle bırak ya da yapıştır. Ekler gönderilmeden önce kart olarak önizlenir, ✕ ile kaldırılır; gönderince okunabilen dosyalar (PDF, TXT, MD, HTML, CSV, JSON) not defterine kaynak olarak eklenir.

Geniş ekranda (900 px üstü) sol kenarda kalıcı bir ray durur: kapalıyken yalnız ikonlar (75 px), gruba basınca sağda sol üst köşesi 5 px olan bir çekmece açılır; üstteki menü düğmesi ya da alttaki panel düğmesiyle açılınca ikonların yanında yazılar ve alt menüler görünür (230 px). Telefonda menü eskisi gibi soldan kayan çekmecedir.

## Klavye ve oyun kolu

Blogger şablonundaki TV/oyun kolu gezinmesi gibi çalışır (ayarlar menüsünde **Klavye ve oyun kolu** ile yardım penceresi açılır):

| Giriş | İş |
|---|---|
| Oklar, D-pad, sol çubuk | Odağı yakındaki bir sonraki öğeye taşı (odakta nokta görünür) |
| Tab / Shift+Tab | Sıradaki / önceki öğe |
| Enter, Boşluk, A | Seç |
| Esc, Backspace, B | Geri: menü, pencere, sonra not defteri → ana ekran |
| Y, `/`, `s` | Ara |
| X, `n` | Yeni not defteri / kaynak ekle |
| LB / RB, `[` ve `]` | Önceki / sonraki sekme |
| Start, `m` | Ayarlar menüsü |
| Select, `d` | Açık / koyu tema |
| Sağ çubuk | Kaydır |
| L3, `?` | Yardım |

Xbox, PlayStation ve standart eşlemeli oyun kollarıyla çalışır (tarayıcının Gamepad API'si).

## Model önerileri (8 GB ekran kartı için)

| Model | Boyut (yaklaşık) | Not |
|---|---|---|
| Qwen2.5 1.5B Q4 | 1 GB | en hızlı, basit işler |
| Llama 3.2 3B Q4 | 2 GB | hızlı, dengeli |
| Qwen2.5 3B Q4 | 2 GB | Türkçe için iyi bir başlangıç |
| Qwen2.5 7B Q4 | 4.7 GB | en akıllısı, 8 GB VRAM ister, daha yavaş |

Listedeki dosya adları Hugging Face'teki depolara işaret eder; bir ad değişmişse **Kendi GGUF dosyam / bağlantım** bölümünden doğru depo/dosyayı, doğrudan bağlantıyı ya da diskindeki bir `.gguf` dosyasını seçebilirsin.

## Teknik notlar ve sınırlar

- **Çok çekirdekli mod:** GitHub Pages `COOP/COEP` başlığı gönderemediği için `coi-sw.js` (service worker) bu başlıkları ekler; sayfa ilk açılışta bir kez yenilenir.
- **WebGPU:** Chrome / Edge (yeni sürümler). Ekran kartı seçeneği kapatılırsa yalnızca işlemci kullanılır (yavaştır).
- **Bağlam:** Varsayılan 4096 token. Kaynaklar uzunsa soruyla en alakalı parçalar (BM25 araması) modele verilir; Stüdyo düğmeleri her kaynağı baştan kısaltır.
- **Kalite:** 3B–7B yerel modeller Gemini gibi büyük bulut modelleri kadar iyi değildir; atıfları kontrol et.
- **Görsel, ses, müzik, video üretimi, yazıya dökme ve web araştırması** yerel sunucu gerektirir (aşağıda *Stüdyolar*). GitHub Pages sürümünde bu paneller “yerel sunucuyla açın” bilgisini gösterir; sohbet, kaynaklar ve Stüdyo çıktıları sunucusuz çalışır.
- Tarayıcı verilerini temizlersen kaynaklar, notlar ve indirilen modeller silinir. Uygulama kalıcı depolama izni ister.

## Üçüncü taraf bileşenler

`docs/vendor/wllama` (MIT), `docs/vendor/pdfjs` (Apache-2.0) ve `docs/vendor/dockview` (Dockview 8.8.3, MIT) — lisans dosyaları kendi klasörlerindedir. Simgeler Plus UI Blogger temasının simge setinden (`docs/icons.js`).

## Ayarlar ve yapay zekâ motorları (v24)

Sağ üstteki dişli **Ayarlar** panelini açar. İlk açılışta kısa bir **Kurulum** sihirbazı (görünüm → cihaz kontrolü → motor seçimi) çıkar; Ayarlar > Hakkında'dan yeniden başlatılabilir.

| Motor | Nasıl | Not |
|---|---|---|
| Tarayıcıda model | Ayarlar > Motor > *Model seç ve yükle* | İnternetsiz; model bir kez indirilir (WebAssembly / WebGPU). |
| Yerel sunucu | Class'ı `windows.bat` / `linux.sh` / `mac.sh` ile aç → *Sunucuya bağlan* | Sunucunun llama.cpp motorunu (GPU) kullanır; `app/llm-models` içindeki `.gguf` modelleri listeler. Yalnızca aynı kaynaktan (localhost) çalışır. |
| OpenAI uyumlu API | Adres + (isteğe bağlı) anahtar + model | LM Studio `http://localhost:1234/v1`, Ollama `http://localhost:11434/v1` (`OLLAMA_ORIGINS` ile), OpenRouter vb. Anahtar yalnızca bu tarayıcıda saklanır. |

Diğer ayarlar: tema ve tema rengi, yazı/arayüz boyutu, animasyonlar, ayna (RTL), sıcaklık, en uzun cevap, bağlam, ek sistem talimatı, Enter ile gönder, depolama kullanımı, kalıcı depolama, **yedeği indir / yükle (.json)**, tüm verileri sil, cihaz tanılama.

## Stüdyolar, kaynak türleri ve pencere düzeni (v25)

**Stüdyolar** (Stüdyo panelinin üstündeki şerit, hızlı menü, kenar menüsü ya da `/` aramasında “stüdyo”): yerel sunucuyla (`windows.bat` / `linux.sh` / `mac.sh`) çalışır.

| Panel | Ne yapar | Sunucu uç noktası |
|---|---|---|
| Görsel | Stable Diffusion; oran, çözünürlük, adım, CFG, tohum, “kaynaklardan istem öner”; indir ya da sohbete ekle | `/api/models`, `/sdapi/v1/txt2img` |
| Ses | Metni seslendir (ses, hız seçimi) | `/api/tts/*` |
| Yazıya dök | Ses/video dosyası ya da mikrofon → metin (Whisper); kaynak olarak ekle | `/api/speech/*` |
| Müzik | Müzik ve ses efekti üretimi | `/api/audio/music` |
| Video | Metinden video (ilerleme takibi) | `/api/video/*` |
| Web | Web araması → seçilen sonuçları kaynak yap; adresten sayfa ekle | `/api/web-search`, `/api/fetch-url` |
| Modeller | Donanım, yüklü modeller (kullan/sil), öneriler, Hugging Face araması ve indirme (ilerleme, iptal), ses modelleri | `/api/llm/*`, `/api/huggingface/models`, `/api/download-progress` |
| Sistem | Güncelleme, Hugging Face anahtarı, disk temizliği, tanılama | `/api/updater/*`, `/api/hf-token`, `/api/cleanup*`, `/api/diagnostics` |

**Kaynak türleri:** `.docx .pptx .xlsx .odt .odp .ods .epub` tarayıcıda, kütüphanesiz okunur (`docs/extract.js`). Ses ve video dosyaları 16 kHz WAV'a çevrilip yerel sunucunun Whisper motoruyla yazıya dökülür. Web sayfaları adresle eklenir.

**Pencere düzeni** (geniş ekran: masaüstü, el konsolu, yatay/dikey tablet; ≥ 901 × 520 px): Kaynaklar, Sohbet, Stüdyo ve tüm stüdyo panelleri Krita'daki gibi sekmeli bölmelere dönüşür. Sekmeyi sürükleyip başka bölmeye bırak, kenara bırakarak böl, başlıktaki düğmeyle **yüzen pencere** yap ya da **büyüt**; sağ tıkla menü. Hazır **çalışma alanları**: Araştırma, Odak, Medya, Laboratuvar. Düzen yatay ve dikey yön için ayrı saklanır. Aç/kapat: Ayarlar > Görünüm, kenar menüsü > Araçlar, ⋮ menüsü ya da arama. Telefonda klasik sekmeler kalır.

## Dönüştürücü ve telefonda kayan paneller (v26)

**Dönüştürücü** (Stüdyolar > Dönüştür; ZenConverter'dan esinlenildi, kod alınmadı). Dosyalar internete gönderilmez; aşağıdakiler tarayıcıda çalışır (telefon, el konsolu, PC, GitHub Pages):

| Araç | Ne yapar |
|---|---|
| Görsel | JPG / PNG / WEBP / ICO (16–256 px) / PDF; %25–%75 küçültme, en fazla 1920/1280/720 px, ×2–×4 büyütme, kalite; saydamlığı beyaza çevirme |
| PDF | görsellerden PDF (görsel boyutu ya da A4), birleştir, sayfa seç, her sayfayı ayrı PDF, döndür, sayfa sil, sıkıştır (görüntüye çevirerek), metne (TXT / MD) ve görsele (PNG / JPG) çevir, başlık/yazar/tarih/XMP temizle (`docs/vendor/pdf-lib`, pdf.js) |
| Ses | ses ya da videodan WAV; kırp, açılış/kapanış, ses düzeyi, normalleştir, ters çevir, mono, örnekleme hızı |
| Video | kontak sayfası (ızgara, zaman damgası, başlık, koyu/açık/saydam), GIF (5–15 fps, 240–640 px, en fazla 15 sn), kare yakala, sesi çıkar |
| Altyazı | SRT ⇄ VTT ⇄ LRC ⇄ ASS, zaman kaydırma, Türkçe (Windows-1254 / ISO-8859-9) ve diğer kodlamaları UTF-8'e çevirme |
| Yazı tipi | TTF / OTF ⇄ WOFF (WOFF2 henüz yok) |
| Belge | DOCX / PPTX / XLSX / ODT / EPUB / PDF / HTML → Markdown, TXT, HTML, yazdır (PDF olarak kaydet); istenirse kaynak olarak ekle |
| Gizlilik | fotoğraftaki konum, çekim zamanı, cihaz bilgisini gösterir; JPG / PNG / WEBP'de yeniden kodlamadan siler |

Birden çok çıktı **tek ZIP** olarak indirilebilir. **Gelişmiş** araç yerel sunucu ve bilgisayardaki **ffmpeg** ile çalışır (`winget install Gyan.FFmpeg`, `brew install ffmpeg`, `sudo apt install ffmpeg`): MP4 (H.264 / H.265), MKV, MOV, WEBM (VP9); MP3, M4A, FLAC, OPUS, WAV; kalite, çözünürlük, kare hızı, kırpma, sesi kaldırma, video meta verisini silme; ilerleme ve iptal. Uç noktalar: `GET /api/convert/status`, `GET /api/convert/progress`, `POST /api/convert/media?name=&opts=` (gövde: dosya), `POST /api/convert/cancel`; çıktılar `app/convert-outputs/` içinde 24 saat tutulur. ffmpeg argümanları yalnızca izinli seçeneklerden kurulur, kabuk kullanılmaz.

**Telefonda kayan paneller** (Krita mobil tarzı, `docs/slide.js`): sohbet ana alanda kalır; **Kaynaklar** soldan, **Stüdyo** sağdan kayar (alt menü düğmesi ya da ekran kenarından kaydır; kenarına doğru kaydırınca, arka plana dokununca, Esc ya da oyun kolu B ile kapanır). Stüdyolar alttan açılan, tutamaçla yarım / tam boy yapılan sekmeli bir sayfada açılır. Ayarlar > Görünüm > *Telefonda paneller*: Kayan / Sekmeler.
