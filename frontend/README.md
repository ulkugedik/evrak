# Öğrenci Uygulama Evrakları ve Sağlık/Aşılama Takip Sistemi - Frontend Projesi

Bu proje, **Öğrenci Uygulama Evrakları ve Sağlık/Aşılama Takip Sistemi** için geliştirilmiş doldurulabilir modern web formu (Frontend) arayüzüdür.

## 🚀 Öne Çıkan Özellikler

1. **4 Adımlı Sekmeli Form Mimarisi (Tabs)**:
   - **1. Öğrenci Temel Bilgileri**: Öğrenci No, TC, Adı Soyadı, Bölüm, Sınıf, Telefon, E-posta, Danışman.
   - **2. Dönem ve Uygulama Bilgileri**: Akademik Yıl, Dönem, Ders Kodu/Adı, Uygulama Kurumu, Uygulama Birimi, Günler, Sorumlu Öğretim Elemanı.
   - **3. Uygulama Belgeleri**: 7 Farklı Belge (16 Saatlik İSG, İşe Giriş Muayene Formu, Gizlilik Sözleşmesi, Kimlik Fotokopisi, Hemogram, ELISA, Akciğer Grafisi).
   - **4. Sağlık & Aşılama Takip**: Hepatit Tetkiki, Tetkik Değerlendirmesi, Aşı Listesi ve **Tekrarlanabilir Dinamik Aşı Doz Kayıtları (1., 2., 3., Ek Doz)**.

2. **Akıllı Otomasyonlar**:
   - **1 Yıllık Geçerlilik Bitiş Takibi**: İşe Giriş Muayene tarihi seçildiğinde 1 yıl sonraki son geçerlilik tarihini otomatik hesaplar.
   - **Hepatit Değerlendirme Entegrasyonu**: Hepatit değerlendirmesi "Aşı Gerekli" seçildiğinde "Aşı Listesine Dahil mi?" seçeneğini otomatik aktifleştirir.
   - **Dinamik Doz Ekleme / Silme**: İstediğiniz kadar aşı dozu ekleyebilirsiniz.

3. **Kullanıcı Deneyimi (UX/UI)**:
   - **Canlı İlerleme Çubuğu (Progress Bar)**: Doldurulan zorunlu alanlara ve yüklenen belgelere göre yüzdelik ilerleme hesaplar.
   - **Taslak Kaydetme (localStorage)**: Formu doldururken yarıda bırakırsanız "Taslağı Kaydet" butonu ile verilerinizi tarayıcıda saklayabilirsiniz.
   - **Dosya Yükleme Kutuları**: Sürükle-bırak ve dosya adı göstergeli modern yükleme alanları.
   - **Özet & Yazdırma Modalı**: Form tamamlandığında onay ve yazdırma/PDF indirme penceresi sunar.

## 📂 Proje Yapısı

```
ogrenci-takip-sistemi/
├── index.html        # Ana HTML Form şablonu ve sekmeler
├── css/
│   └── style.css     # Glassmorphism, renk paleti ve duyarlı CSS grid stilleri
└── js/
    └── app.js        # Sekme geçişleri, dinamik dozlar, ilerleme çubuğu ve form mantığı
```

## 🛠️ Nasıl Çalıştırılır?

1. Proje klasörünü bilgisayarınızda açın:
   `C:\Users\elifs\.gemini\antigravity\scratch\ogrenci-takip-sistemi`
2. `index.html` dosyasına çift tıklayarak istediğiniz tarayıcıda (Chrome, Edge, Firefox vb.) doğrudan çalıştırabilirsiniz. Herhangi bir sunucu veya kurulum gerektirmez!
