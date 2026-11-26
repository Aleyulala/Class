# Class — tarayıcıda çalışan yerel yapay zekâ (NotebookLM benzeri)

Kaynaklarını (PDF, TXT, MD, yapıştırılmış metin) yükle, onlarla sohbet et, özet / SSS / çalışma rehberi / quiz / zihin haritası çıkar, cevapları nota kaydet.
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
   - **Sesli özet:** Ayşe ve Can'ın sohbet ettiği bir metin; cihazının konuşma sentezi iki farklı sesle okur (ses dosyası olarak indirilemez).
   - **Zihin haritası:** renkli SVG harita, PNG indirilir.
   - **Görsel özet:** başlık, emojili ana noktalar ve çıkarımdan oluşan bilgi grafiği, PNG indirilir.
   - **Bilgi kartları:** çevirmeli kartlar, "Biliyorum" işaretleme.
   - **Quiz:** çoktan seçmeli, anında doğru/yanlış, puan.
   - **Özet, ana fikirler, SSS, çalışma rehberi:** sohbete metin olarak gelir, **Nota kaydet** ile saklanır.
   Üretilen çıktılar not defterinde **Çıktılar** listesinde kalır. Model, çıktıyı JSON şemasına uyarak üretir; küçük modeller bazen başarısız olur, "tekrar dene" ya da daha büyük model.
5. **Demo (model yok)** düğmesi modeli indirmeden arayüzü dener (cevap yerine eşleşen kaynak parçalarını gösterir). Adrese `?demo` eklersen doğrudan demo açılır.

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
- **Yapay zekâ ile fotoğraf/video üretimi ve web'de araştırma bu uygulamada yok.** "Görsel özet" modelin yazdığı içeriği çizen bir bilgi grafiğidir, fotoğraf üretmez. Görsel/video üretimi için ana stüdyo uygulamasını (`/app`) kullan.
- Tarayıcı verilerini temizlersen kaynaklar, notlar ve indirilen modeller silinir. Uygulama kalıcı depolama izni ister.

## Üçüncü taraf bileşenler

`docs/vendor/wllama` (MIT) ve `docs/vendor/pdfjs` (Apache-2.0) — lisans dosyaları kendi klasörlerindedir.
