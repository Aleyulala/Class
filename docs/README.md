# Defter — tarayıcıda çalışan yerel yapay zekâ (NotebookLM benzeri)

Kaynaklarını (PDF, TXT, MD, yapıştırılmış metin) yükle, onlarla sohbet et, özet / SSS / çalışma rehberi / quiz / zihin haritası çıkar, cevapları nota kaydet.
Hepsi **tarayıcında** çalışır: model [wllama](https://github.com/ngxson/wllama) (llama.cpp'nin WASM + WebGPU sürümü) ile ekran kartında/işlemcide çalışır, dosyalar yalnızca bu tarayıcının depolamasında (IndexedDB) kalır. Sunucuya hiçbir şey gönderilmez.

## GitHub Pages'ta yayınlama

1. Depoda **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Branch: `main`, klasör: **`/docs`** → Save.
3. Birkaç dakika sonra `https://<kullanici>.github.io/<depo>/` adresinde açılır.

Hiçbir derleme adımı yok; `docs/` klasörü olduğu gibi yayınlanır. wllama ve pdf.js `docs/vendor/` içinde hazır durur, CDN gerekmez.

## Nasıl kullanılır

1. Sağ üstten **Model seç** → bir model seç → **Yükle**. İlk seferde Hugging Face'ten iner (birkaç yüz MB – birkaç GB), sonra tarayıcı depolamasında kalır ve bir daha indirilmez.
2. Soldan **Dosya ekle** / **Metin yapıştır** ile kaynak ekle. Kutuyu işaretleyip kaldırarak hangi kaynakların kullanılacağını seç.
3. Sohbete soru yaz. Cevaptaki `[1]`, `[2]` atıflarına basınca ilgili kaynak parçası açılır. Kaynak seçili değilse normal sohbet olur.
4. Sağdaki **Stüdyo** düğmeleri seçili kaynaklardan özet, ana fikirler, SSS, çalışma rehberi, quiz ve zihin haritası üretir. **Nota kaydet** ile saklanır, `.md` olarak indirilir.
5. **Demo (model yok)** düğmesi modeli indirmeden arayüzü dener (cevap yerine eşleşen kaynak parçalarını gösterir). Adrese `?demo` eklersen doğrudan demo açılır.

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
- **Sesli özet (podcast), görsel/video üretimi bu uygulamada yok.** Onlar için ana stüdyo uygulamasını (`/app`) kullan.
- Tarayıcı verilerini temizlersen kaynaklar, notlar ve indirilen modeller silinir. Uygulama kalıcı depolama izni ister.

## Üçüncü taraf bileşenler

`docs/vendor/wllama` (MIT) ve `docs/vendor/pdfjs` (Apache-2.0) — lisans dosyaları kendi klasörlerindedir.
