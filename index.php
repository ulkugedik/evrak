<?php
require_once 'baglan.php';

$sabit_formlar_map = [
    'F-52'         => 'form_f52.php',
    'F-53'         => 'form_f53.php',
    'F-54'         => 'form_f54.php',
    'F-55'         => 'form_f55.php',
    'F-ISE'        => 'form_ise.php',
    'KDYS.FR.0072' => 'form_0072.php',
    'KDYS.FR.0073' => 'form_0073.php',
    'KDYS.FR.0074' => 'form_0074.php',
    'KDYS.FR.0077' => 'form_0077.php',
    'KDYS.FR.0078' => 'form_0078.php',
    'KDYS.FR.0079' => 'form_0079.php',
    'KDYS.FR.0080' => 'form_0080.php',
    'KDYS.FR.0082' => 'form_0082.php'
];

$aktif_formlar = $db->query("SELECT * FROM formlar WHERE durum = 'aktif' ORDER BY kategori ASC, id ASC")->fetchAll();
$formlar_kategorili = [];
$dinamik_formlar = [];

foreach ($aktif_formlar as $af) {
    $formlar_kategorili[$af['kategori']][] = $af;
    if (!isset($sabit_formlar_map[$af['form_kodu']])) {
        $dinamik_formlar[] = $af;
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BAÜN Form İşlem Merkezi</title>
    <style>
        /* Genel Sayfa Ayarları */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; padding-bottom: 50px; }
        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; background-color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .navbar-logo { display: flex; align-items: center; gap: 15px; font-weight: bold; color: #1b656e; font-size: 18px; text-decoration: none; transition: opacity 0.3s; }
        .navbar-logo:hover { opacity: 0.8; }
        .navbar-link { font-size: 14px; color: #555; text-decoration: none; transition: color 0.3s; }
        .navbar-link:hover { color: #1b656e; }
        .banner { background-color: rgb(3, 149, 159); color: white; text-align: center; padding: 80px 20px 120px 20px; border-bottom-left-radius: 50% 20%; border-bottom-right-radius: 50% 20%; margin-bottom: -40px; }
        .banner h1 { font-size: 36px; margin: 0 0 10px 0; }
        .banner p { font-size: 14px; opacity: 0.9; }
        .banner p a { color: white; text-decoration: none; transition: opacity 0.3s; }
        .banner p a:hover { opacity: 0.7; text-decoration: underline; }

        /* Form Seçim Kutusu */
        .secim-kutusu { background: white; max-width: 900px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; gap: 15px; position: relative; z-index: 10; }
        .form-select { flex: 1; padding: 15px; font-size: 15px; border: 1px solid #ddd; border-radius: 5px; outline: none; color: #333; appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231b656e%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 15px top 50%; background-size: 15px auto; }
        .form-select:focus { border-color: #1b656e; }
        .form-select optgroup { font-weight: bold; color: #1b656e; }
        .btn-tamam { background-color: #1b656e; color: white; border: none; padding: 15px 30px; font-size: 16px; font-weight: bold; border-radius: 5px; cursor: pointer; transition: background 0.3s; text-align: center; }
        .btn-tamam:hover { background-color: rgb(3, 149, 159); }
        #hata-mesaji { color: #e74c3c; text-align: center; margin-top: 15px; font-weight: bold; display: none; }

        /* Gizli Formların Tasarımı */
        .gizli-form { display: none; background: white; max-width: 1100px; margin: 20px auto; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .gizli-form h2 { color: #1b656e; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0; text-align: center; }
        .form-grup { margin-bottom: 15px; text-align: left; }
        .form-grup label { display: block; font-weight: bold; margin-bottom: 5px; color: #555; font-size: 14px; }
        .form-grup input[type="text"], .form-grup input[type="date"], .form-grup input[type="time"], .form-grup input[type="email"], .form-grup select, .form-grup textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; font-family: inherit; }
        
        /* Önemli Uyarı ve Checkbox Sınıfları */
        .form-bilgi { font-size: 11.5px; color: #d93025; margin-top: 4px; display: block; font-weight: 500; }
        .form-bilgi-liste { font-size: 11.5px; color: #d93025; background: #fce8e6; padding: 10px; border-radius: 5px; border-left: 3px solid #d93025; margin-bottom: 15px; }
        .resmi-yazi { font-size: 14px; color: #333; text-align: justify; line-height: 1.6; background: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #eee; margin-bottom: 20px; }
        .checkbox-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; font-size: 13px; color: #333; }
        .checkbox-grid label { font-weight: normal !important; display: flex; align-items: center; gap: 8px; cursor: pointer; color: #333 !important; }
        
        .form-satir { display: flex; gap: 15px; }
        .form-satir .form-grup { flex: 1; }

        /* Tablo Stil Ayarları (E-İmza Formu İçin) */
        .form-tablosu { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
        .form-tablosu th, .form-tablosu td { border: 1px solid #ddd; padding: 8px 5px; text-align: center; }
        .form-tablosu th { background-color: #1b656e; color: white; font-weight: 600; white-space: nowrap; }
        .form-tablosu td input, .form-tablosu td select { width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box; font-size: 11px; }

        .btn-alt-satir-ekle { background-color: #27ae60; color: white; border: none; padding: 6px 12px; font-size: 12px; font-weight: bold; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
        .btn-alt-satir-ekle:hover { background-color: #219150; }
        .btn-satir-sil { background-color: #e74c3c; color: white; border: none; width: 22px; height: 22px; border-radius: 3px; cursor: pointer; font-weight: bold; }

        /* Yüklenen Dosya Görsel Bildirimi Stili */
        .file-preview-box {
            margin-top: 8px;
            padding: 10px 14px;
            background: #e8f8f5;
            border: 1px solid #27ae60;
            border-radius: 6px;
            color: #1e8449;
            font-size: 13.5px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .file-preview-box .file-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .file-preview-box .btn-remove-file {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }
        .file-preview-box .btn-remove-file:hover {
            background: #c0392b;
        }

        /* Açılır / Kapanır Akordiyon Stili */
        .accordion-btn { background-color: #e8f4f8; color: #1b656e; cursor: pointer; padding: 12px 15px; width: 100%; border: 1px solid #1b656e; border-radius: 5px; text-align: left; outline: none; font-size: 13.5px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; transition: background-color 0.3s; margin-top: 15px; margin-bottom: 15px; }
        .accordion-btn:hover, .accordion-btn.active { background-color: #1b656e; color: white; }
        .accordion-panel { padding: 0 18px; background-color: #fdfdfd; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; margin-top: -15px; margin-bottom: 15px; font-size: 12.5px; line-height: 1.6; color: #333; }
        .accordion-panel h4 { color: #1b656e; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
        .accordion-panel ol, .accordion-panel ul { padding-left: 20px; margin-top: 5px; }
    </style>
</head>
<body>

    <!-- Üst Menü -->
    <div class="navbar">
        <a href="https://bid.balikesir.edu.tr" target="_blank" class="navbar-logo">
            <img src="https://baunwebapi.balikesir.edu.tr/uploads/1729083231270.png" alt="BAÜN Logo" height="50">
            BALIKESİR ÜNİVERSİTESİ
        </a>
        <div>
            <a href="takip.php" class="navbar-link" style="font-weight:bold; color:#555; margin-right:15px;"> Başvuru Takibi</a>
            <a href="login.php" class="navbar-link" style="font-weight:bold; color:#555; margin-right:15px;">Yönetici Girişi</a>
            <a href="https://bid.balikesir.edu.tr" target="_blank" class="navbar-link";>BİLGİ İŞLEM DAİRE BAŞKANLIĞI</a>
        </div>
    </div>

    <!-- Banner -->
    <div class="banner">
        <h1>Üniversitemiz Form İşlem Merkezi</h1>
        <p><a href="https://bid.balikesir.edu.tr" target="_blank">ANASAYFA</a> > FORMLAR</p>
    </div>

    <!-- Başarılı Başvuru Bildirimi -->
    <?php if(isset($_GET['durum']) && $_GET['durum'] == 'basarili'): ?>
        <script>
            alert("Form başarıyla gönderildi! Takip numaranız: <?php echo htmlspecialchars($_GET['takip_no'] ?? ''); ?>");
        </script>
        <div style="max-width:900px; margin:20px auto; background:#d4edda; color:#155724; padding:20px; border-radius:8px; border-left:6px solid #28a745; text-align:center; position:relative; z-index:20; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
            <h3 style="margin:0 0 10px 0; font-size:20px;">✓ Form Başvurunuz Başarıyla Alınmıştır!</h3>
            <p style="margin:5px 0; font-size:15px;">Başvurunuzun durumunu sorgulamak için aşağıdaki **Başvuru Takip Numarasını** saklayınız:</p>
            <div style="font-size:26px; font-weight:bold; color:#1b656e; background:white; display:inline-block; padding:8px 25px; border-radius:5px; margin:10px 0; border:2px dashed #1b656e; letter-spacing:2px;">
                <?php echo htmlspecialchars($_GET['takip_no'] ?? '-'); ?>
            </div>
            <br>
            <a href="takip.php?takip_no=<?php echo urlencode($_GET['takip_no'] ?? ''); ?>" style="display:inline-block; margin-top:5px; color:#1b656e; font-weight:bold; text-decoration:underline;">Başvuru Durumunu Şimdi Sorgula →</a>
        </div>
    <?php endif; ?>

    <!-- Form Seçim Kutusu -->
    <div class="secim-kutusu">
        <select id="formSecici" class="form-select" onchange="formYonetlendir()">
            <option value="">-- Doldurmak İstediğiniz Formu Seçiniz --</option>
            
            <?php foreach ($formlar_kategorili as $kategori => $form_listesi): ?>
                <optgroup label="<?php echo htmlspecialchars($kategori); ?>">
                    <?php foreach ($form_listesi as $f): ?>
                        <?php 
                            $target_id = $sabit_formlar_map[$f['form_kodu']] ?? ('form_dyn_' . md5($f['form_kodu']));
                        ?>
                        <option value="<?php echo $target_id; ?>"><?php echo htmlspecialchars($f['form_adi']); ?></option>
                    <?php endforeach; ?>
                </optgroup>
            <?php endforeach; ?>
        </select>
    </div>
    
    <div id="hata-mesaji">Lütfen listeden bir form seçiniz!</div>

    <!-- GİZLİ FORMLAR -->

    <!-- F-52 FORMU (PERSONEL İŞLEMLERİ) -->
    <div id="form_f52.php" class="gizli-form">
        <h2>Akıllı Kart İşlem Formu (F-52)</h2>
        <form method="POST" action="islem.php" enctype="multipart/form-data">
            <input type="hidden" name="form_kodu" value="F-52">
            <input type="hidden" name="form_adi" value="Akıllı Kart İşlem Formu (F-52)">

            <div class="form-satir">
                <div class="form-grup">
                    <label>Ad, Soyad</label>
                    <input type="text" name="ad_soyad" required>
                    <span class="form-bilgi">Bu kısmın tüm kart tipleri için doldurulması zorunludur.</span>
                </div>
                <div class="form-grup">
                    <label>TC Kimlik No</label>
                    <input type="text" name="tc_no" maxlength="11" required>
                    <span class="form-bilgi">Bu kısmın tüm kart tipleri için doldurulması zorunludur.</span>
                </div>
            </div>
            
            <div class="form-satir">
                <div class="form-grup"><label>Fakülte/YO/MYO/Birim</label><input type="text" name="fakulte_birim"></div>
                <div class="form-grup"><label>İrtibat Telefonu</label><input type="text" name="telefon"></div>
            </div>

            <div class="form-grup">
                <label>Kart (Kişi) Tipi (Fareyi seçeneklerin üzerinde bekleterek açıklamaları görebilirsiniz)</label>
                <select name="kart_tipi" required>
                    <option value="">Seçiniz...</option>
                    <option>Akademik Personel</option>
                    <option>İdari Personel</option>
                    <option title="Temizlik, Hastane Destek vb.">Hizmet Alımı Personeli</option>
                    <option title="müteahhit firma, kiralama, özel yurt personeli, satın alma, yapım, altyapı, onarım, bakım firması">Firma Personeli</option>
                    <option title="Üniversitemiz kadrosunda bulunmayan diğer devlet memurları">Diğer Kurum Personeli</option>
                    <option title="Üniversitemiz kadrosunda öğretim görevlileri veya farklı amaçlarla geçici süre çalışan personel">Misafir Personel</option>
                    <option>Koruma ve Güvenlik Personeli</option>
                    <option>Özel Güvenlik Personeli</option>
                    <option>Emekli Personel</option>
                    <option title="Rektörlük Makamınca uygun görülen ve Üniversiteye maddi, manevi katkıları bulunmuş kişiler">Onursal</option>
                    <option>Kütüphane</option>
                </select>
            </div>

            <div class="form-grup">
                <label>Yapılacak İşlem Türü</label>
                <select name="islem_turu" required>
                    <option value="">Seçiniz...</option>
                    <option title="Yeni Başlayan Personel/kişiler için">Akıllı kartın ilk kez verilmesi</option>
                    <option>Hatalı Basılan Kart Bilgisinin Düzeltilmesi</option>
                    <option title="Soyad, Kadro Yeri, ek gösterge vb. Değişikliği">Bilgi Değişikliği</option>
                    <option title="Sebebi: İstifa, Emeklilik, Tayin, Nakil vb.">Ayrılış</option>
                </select>
            </div>
            
            <hr style="border:1px solid #eee; margin: 20px 0;">

            <div class="form-satir">
                <div class="form-grup">
                    <label>Unvanı</label>
                    <input type="text" name="unvan">
                    <span class="form-bilgi">Bu kısım Akademik, İdari Personel ve Yerleşke Onursal, Emekli, Hizmet, Firma, Kurum, Misafir, Kütüphane Giriş Kartları içindir.</span>
                </div>
                <div class="form-grup">
                    <label>Birim</label>
                    <input type="text" name="birim">
                    <span class="form-bilgi">Akademik ve İdari Personelin kadrosunun olduğu birim, diğer kart tipleri için personelin çalıştığı birim yazılmalıdır.</span>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Bölüm</label>
                    <input type="text" name="bolum">
                    <span class="form-bilgi">Akademik Personelin kadrosunun olduğu bölüm yazılmalıdır.</span>
                </div>
                <div class="form-grup">
                    <label>Kurum Sicil No'su</label>
                    <input type="text" name="sicil_no">
                    <span class="form-bilgi">Bu kısım Akademik, İdari Personel, Koruma Güvenlik görevlisi ve Yerleşke Kurum Giriş Kartları içindir.</span>
                </div>
            </div>

            <div class="form-grup">
                <label>Ödemeye Esas Ek Göstergesi</label>
                <input type="text" name="ek_gosterge">
                <span class="form-bilgi">Personelin ödemeye esas ek göstergesi yemek ücretinin belirlenmesinde baz alınacağı için doğruluğundan ilgili birim sorumlu olacaktır.</span>
            </div>

            <div class="form-satir">
                <div class="form-grup"><label>Hizmet Yeri</label><input type="text" name="hizmet_yeri"><span class="form-bilgi">Sadece Yerleşke Hizmet, Firma, Kurum Giriş Kartları içindir.</span></div>
                <div class="form-grup"><label>Firma Adı</label><input type="text" name="firma_adi"><span class="form-bilgi">Sadece Yerleşke Firma Giriş Kartları içindir.</span></div>
            </div>

            <div class="form-satir">
                <div class="form-grup"><label>Kurumu</label><input type="text" name="kurumu"><span class="form-bilgi">Yerleşke Kurum Giriş Kartları içindir.</span></div>
                <div class="form-grup"><label>Kan Grubu</label><input type="text" name="kan_grubu"><span class="form-bilgi">Sadece Koruma Güvenlik veya Özel Güvenlik kartı alacak personel doldurmalıdır.</span></div>
            </div>
            
            <div class="form-grup">
                <label>Görev</label>
                <input type="text" name="gorev">
                <span class="form-bilgi">Bu kısmı sadece Yerleşke Misafir Giriş Kartı alacak personel doldurmalıdır.</span>
            </div>

            <div class="form-bilgi-liste" style="background:#e8f4f8; border-left-color:#1b656e;">
                <label style="color:#1b656e; font-weight:bold; font-size:14px; margin-bottom:10px; display:block;">Hatalı Basılan Kart veya Bilgi Değişikliği Yapılacaksa Düzeltilecek / Değişecek Kısmı Seçiniz:</label>
                
                <div class="checkbox-grid">
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Ad, Soyad"> Ad, Soyad</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Unvan"> Unvan</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Görev"> Görev</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Birim"> Birim</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Bölüm"> Bölüm</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Kurum Sicil No"> Kurum Sicil No</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="TC Kimlik No"> TC Kimlik No</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Hizmet Yeri"> Hizmet Yeri</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Firma Adı"> Firma Adı</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Kurum Adı"> Kurum Adı</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Kan Grubu"> Kan Grubu</label>
                    <label><input type="checkbox" name="degisecek_alanlar[]" value="Fotoğraf"> Fotoğraf</label>
                    <label style="grid-column: span 2;"><input type="checkbox" name="degisecek_alanlar[]" value="Ödemeye Esas Ek Göstergesi"> Ödemeye Esas Ek Göstergesi</label>
                    <label style="grid-column: span 3; display: flex; gap: 10px;">
                        <input type="checkbox" name="degisecek_alanlar[]" value="Diğer"> Diğer: 
                        <input type="text" name="digeralan_metin" style="width: 250px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
                    </label>
                </div>

                <label style="color:#1b656e; font-weight:bold; font-size:13px; margin-bottom:5px; margin-top: 15px; display:block;">Yeni Bilgi (Seçtiğiniz alanın doğru halini aşağıya yazınız):</label>
                <textarea name="yeni_bilgi" rows="2" style="width:100%; border:1px solid #ccc; border-radius:4px; padding:5px;"></textarea>
            </div>

            <div class="form-bilgi-liste">
                <strong>AÇIKLAMA (Lütfen kart tipinize göre zorunlu alanları kontrol ediniz):</strong><br>
                + <b>Akademik Personel Kimlik Kartı</b> için Ad, Soyad, Unvan, Görev, Birim, Bölüm, Kurum sicil no ve T.C Kimlik No kısımları doldurulacaktır.<br>
                + <b>İdari Personel Kimlik Kartı</b> için Ad, Soyad, Unvan, Kadrosunun Olduğu Birim/Bölüm, Kurum sicil no ve T.C Kimlik no kısımları doldurulacaktır.<br>
                + <b>Yerleşke Hizmet Giriş Kartı</b> için Ad, Soyad, Unvan, Firma Adı, Birim, Hizmet Yeri ve T.C Kimlik no kısımları doldurulacaktır.<br>
                + <b>Yerleşke Firma Giriş Kartı</b> için Ad, Soyad, Unvan, Firma Adı, Birim, Hizmet Yeri ve T.C Kimlik no kısımları doldurulacaktır.<br>
                + <b>Yerleşke Kurum Giriş Kartı</b> için Ad, Soyad, Unvan, Kurum, Kurum Sicil no, Hizmet Yeri ve T.C Kimlik no kısımları doldurulacaktır.<br>
                + <b>Yerleşke Misafir Giriş Kartı</b> için Ad, Soyad, Unvan, Görev, Birim ve T.C Kimlik no kısımları doldurulacaktır.<br>
                + <b>Yerleşke Emekli, Onursal ve Kütüphane Giriş Kartı</b> için Ad, Soyad, Unvan ve T.C Kimlik no kısımları doldurulacaktır.<br>
                + <b>Koruma ve Güvenlik Görevlisi</b> için Ad, Soyad, Kan Grubu, Kurum Sicil no ve T.C Kimlik no doldurulacaktır.<br>
                + <b>Özel Güvenlik Görevlisi</b> için Ad, Soyad, Kan Grubu ve T.C Kimlik no doldurulacaktır.
            </div>

            <div class="form-grup">
                <label>Fotoğraf Yükle</label>
                <input type="file" name="fotograf" accept=".jpg, .jpeg">
                <span class="form-bilgi"><b>Fotoğraflar için önemli not:</b> Gönderilecek fotoğraflar; yakın tarihli, vesikalık standardında, dijital olarak çekilmiş veya iyi taranmış (en az 300dpi) olmalıdır. Fotoğraf bilgileri; T.C kimlik no, dosya adı olmak üzere; jpg dosyası biçiminde (örnek: 12345678901.jpg) olmalıdır. Uygun Fotoğraf bilgisi olmayan kişiler için kart basımı yapılamamaktadır.</span>
            </div>
            
            <div class="form-bilgi" style="margin-bottom:15px;">
                <b>Önemli not:</b> Hatalı basılan veya değişecek kart bu form ile birlikte bir üst yazı ekinde Bilgi işlem Dairesi Başkanlığına gönderilecektir. BAUN akıllı merkezine gönderilmeyen veya getirilmeyen hatalı basılan veya değişecek kartlar ile ilgili herhangi bir işlem yapılmayacaktır. Ödemeye esas ek göstergenin değişimi için akıllı kart gönderilmeyecektir.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center;">Formu Gönder</button>
        </form>
    </div>

    <!-- F-53 FORMU (ÖĞRENCİ) -->
    <div id="form_f53.php" class="gizli-form">
        <h2>Akıllı Kart Öğrenci İşlem Formu (F-53)</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="F-53">
            <input type="hidden" name="form_adi" value="Akıllı Kart Öğrenci İşlem Formu (F-53)">

            <div class="form-satir">
                <div class="form-grup"><label>AD SOYAD</label><input type="text" name="ad_soyad" required></div>
                <div class="form-grup"><label>OKUL NO</label><input type="text" name="okul_no" required></div>
                <div class="form-grup"><label>TC Kimlik No</label><input type="text" name="tc_no" maxlength="11" required></div>
            </div>
            
            <div class="form-satir">
                <div class="form-grup"><label>Fakülte/Yüksekokul/MYO/Enstitü</label><input type="text" name="fakulte_birim"></div>
                <div class="form-grup"><label>BÖLÜM</label><input type="text" name="bolum"></div>
                <div class="form-grup"><label>PROGRAM</label><input type="text" name="program"></div>
            </div>
            
            <div class="form-grup">
                <label title="Yeni kayıt (kart), lisans, yüksek lisans, yaz okulu, düzeltme, fotoğraf, mezun, kayıt dondurmuş, uzaklaştırma vb.">
                    AÇIKLAMA (Öğrencinin son durumu ile ilgili bilgiyi yazınız)
                </label>
                <textarea name="aciklama" rows="3"></textarea>
                <span class="form-bilgi">Fare imlecini 'AÇIKLAMA' başlığının üzerinde bekleterek açıklama örneklerini görebilirsiniz.</span>
            </div>
            
            <div class="form-bilgi" style="margin-bottom:15px;">
                <b>Önemli Not:</b> Hatalı basılan veya değişecek kartlar bu form ile birlikte bir üst yazı ekinde Bilgi işlem Dairesi Başkanlığına gönderilecektir. BAUN akıllı merkezine gönderilmeyen veya getirilmeyen hatalı basılan veya değişecek kartlar ile ilgili herhangi bir işlem yapılmayacaktır.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center;">Formu Gönder</button>
        </form>
    </div>

    <!-- F-54 FORMU (KAYIP KART) -->
    <div id="form_f54.php" class="gizli-form">
        <h2>Kayıp Akıllı Kart Müracaat Formu (F-54)</h2>
        <form method="POST" action="islem.php" enctype="multipart/form-data">
            <input type="hidden" name="form_kodu" value="F-54">
            <input type="hidden" name="form_adi" value="Kayıp Akıllı Kart Müracaat Formu (F-54)">

            <div class="resmi-yazi">
                Aşağıda belirttiğim adıma kayıtlı olan akıllı kimlik kartımı kaybettim. Eski kimlik kartımın AKS sisteminden iptal edilmesini ve bedeli karşılığında yeni kimlik kartımın tanzim edilerek tarafıma verilmesini rica ederim.
            </div>
            
            <div class="form-grup"><label>Görev Yapılan / Öğrenim Görülen Yer</label><input type="text" name="gorev_ogrenim_yeri" required></div>
            
            <div class="form-satir">
                <div class="form-grup"><label>TC Kimlik Numarası</label><input type="text" name="tc_no" maxlength="11" required></div>
                <div class="form-grup"><label>Ad Soyad (Adıma Kayıtlı Olan)</label><input type="text" name="ad_soyad" required></div>
            </div>
            
            <div class="form-satir">
                <div class="form-grup"><label>Kart Seri No</label><input type="text" name="kart_seri_no"></div>
                <div class="form-grup"><label>Kayıp Tarihi</label><input type="date" name="kayip_tarihi"></div>
                <div class="form-grup"><label>İrtibat Telefonu</label><input type="text" name="telefon"></div>
            </div>

            <div class="form-grup">
                <label>Ödeme Dekontu Yükle (Yeni Kart Ücreti İçin)</label>
                <input type="file" name="dekont" accept=".pdf, .jpg, .jpeg, .png">
                <span class="form-bilgi">Yeni kart bedelinin yatırıldığına dair banka dekontunu (PDF, JPG veya PNG formatında) yükleyebilirsiniz.</span>
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center;">Formu Gönder</button>
        </form>
    </div>

    <!-- F-55 FORMU (ARIZALI KART) -->
    <div id="form_f55.php" class="gizli-form">
        <h2>Arızalı Akıllı Kart Müracaat Formu (F-55)</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="F-55">
            <input type="hidden" name="form_adi" value="Arızalı Akıllı Kart Müracaat Formu (F-55)">

            <div class="resmi-yazi">
                Eski kimlik kartımın AKS sisteminden iptal edilmesi ve akıllı kart merkezince yapılan teknik inceleme sonucunda, kart arızasının tarafımdan kaynakladığı takdirde bedeli karşılığında yeni akıllı kimlik kartımın tanzim edilerek tarafıma verilmesini rica ederim.
            </div>

            <div class="form-grup"><label>Görev Yapılan / Öğrenim Görülen Yer</label><input type="text" name="gorev_ogrenim_yeri" required></div>
            
            <div class="form-satir">
                <div class="form-grup"><label>TC Kimlik Numarası</label><input type="text" name="tc_no" maxlength="11" required></div>
                <div class="form-grup"><label>Ad Soyad (Adıma Kayıtlı Olan)</label><input type="text" name="ad_soyad" required></div>
            </div>
            
            <div class="form-satir">
                <div class="form-grup"><label>Kart Seri No</label><input type="text" name="kart_seri_no"></div>
                <div class="form-grup"><label>Arızalanma Tarihi</label><input type="date" name="ariza_tarihi"></div>
                <div class="form-grup"><label>İrtibat Telefonu</label><input type="text" name="telefon"></div>
            </div>
            
            <div class="form-bilgi" style="margin-bottom:15px; font-size:12px;">
                <b>Uyarı:</b> Arızalı kart bu form ile birlikte Bilgi işlem Dairesi Başkanlığına gönderilecektir. BAUN akıllı merkezine gönderilmeyen veya getirilmeyen, hatalı basılan veya değişecek kartlar ile ilgili herhangi bir işlem yapılmayacaktır.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center;">Formu Gönder</button>
        </form>
    </div>

    <!-- F-ISE FORMU (İŞE GİRİŞ VE PERİYODİK MUAYENE FORMU) -->
    <div id="form_ise.php" class="gizli-form">
        <h2>İşe Giriş ve Periyodik Muayene Formu (F-ISE)</h2>
        <form method="POST" action="islem.php" enctype="multipart/form-data">
            <input type="hidden" name="form_kodu" value="F-ISE">
            <input type="hidden" name="form_adi" value="İşe Giriş ve Periyodik Muayene Formu (F-ISE)">

            <div class="resmi-yazi">
                Bu form 6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında İşe Giriş ve Periyodik Sağlık Muayenesi işlemleri için kullanılır. İşe Giriş Formı 1 yıl geçerli olup, muayene tarihi seçildiğinde bitiş tarihi otomatik olarak 1 yıl sonrası olarak belirlenmektedir.
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Ad, Soyad *</label>
                    <input type="text" name="ad_soyad" required placeholder="Adınız ve Soyadınız">
                </div>
                <div class="form-grup">
                    <label>TC Kimlik No *</label>
                    <input type="text" name="tc_no" maxlength="11" required placeholder="11 Haneli T.C. Kimlik No">
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Fakülte / Birim / Görev *</label>
                    <input type="text" name="birim" required placeholder="Görev Yaptığınız Birim / Unvan">
                </div>
                <div class="form-grup">
                    <label>İrtibat Telefonu *</label>
                    <input type="text" name="telefon" required placeholder="05XX XXX XX XX">
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Muayene Tarihi *</label>
                    <input type="date" name="muayene_tarihi" id="ise_muayene_tarihi" required onchange="muayeneTarihiHesapla(this)">
                    <span class="form-bilgi">Muayene tarihi seçildiğinde bitiş tarihi otomatik 1 yıl sonrası olarak doldurulacaktır.</span>
                </div>
                <div class="form-grup">
                    <label>Bitiş Tarihi (Geçerlilik Süresi: 1 Yıl) *</label>
                    <input type="date" name="bitis_tarihi" id="ise_bitis_tarihi" required readonly style="background-color: #e9ecef; cursor: not-allowed; font-weight:bold;">
                    <span class="form-bilgi">İşe Giriş Formu 1 yıl geçerlidir.</span>
                </div>
            </div>

            <div class="form-grup">
                <label>Muayene Raporu / PDF Belgesi Yükle *</label>
                <input type="file" name="dekont" accept=".pdf, .jpg, .jpeg, .png" required>
                <span class="form-bilgi">Muayene Raporu veya Sağlık Belgesi (PDF, JPG veya PNG formatında) yükleyiniz. Yüklenen dosya yeşil rozet ile gösterilecektir.</span>
            </div>

            <div class="form-grup">
                <label>Açıklama / Muayene Notları</label>
                <textarea name="aciklama" rows="3" placeholder="Muayeneye ilişkin ek açıklamalar veya notlar..."></textarea>
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center;">Formu Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0072 - Bilgi İşlem DB Kurumsal E-Posta Talep Form -->
    <div id="form_0072.php" class="gizli-form">
        <h2>KDYS.FR.0072 - Bilgi İşlem DB Kurumsal E-Posta Talep Formu</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0072">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB Kurumsal E-Posta Talep Formu">

            <div class="form-satir">
                <div class="form-grup">
                    <label>Birim Adı</label>
                    <input type="text" name="birim_adi" value="BALIKESİR ÜNİVERSİTESİ-" required>
                </div>
                <div class="form-grup">
                    <label>Sorumlu Personelin Adı Soyadı</label>
                    <input type="text" name="sorumlu_ad_soyad" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Unvanı</label>
                    <input type="text" name="unvan">
                </div>
                <div class="form-grup">
                    <label>T.C. Kimlik Numarası</label>
                    <input type="text" name="tc_no" maxlength="11" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Telefonu</label>
                    <input type="text" name="telefon">
                </div>
                <div class="form-grup">
                    <label>E-posta adresi (Hesap bilgileri gönderilecek)</label>
                    <input type="text" name="eposta" required>
                </div>
            </div>

            <div class="form-grup">
                <label>Talep Edilen E-posta Adresi</label>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="text" name="talep_eposta" style="flex: 1;" placeholder="örnek" required>
                    <span>@balikesir.edu.tr</span>
                </div>
            </div>

            <div class="form-grup">
                <label>Kurumsal E-posta Kullanım Amacı</label>
                <div class="checkbox-grid">
                    <label><input type="checkbox" name="kullanim_amaci[]" value="Fakülte/YO Adına"> Fakülte/YO Adına</label>
                    <label><input type="checkbox" name="kullanim_amaci[]" value="Bölüm/Birim Adına"> Bölüm/Birim Adına</label>
                    <label><input type="checkbox" name="kullanim_amaci[]" value="Topluluk/Dernek"> Topluluk/Dernek</label>
                    <label><input type="checkbox" name="kullanim_amaci[]" value="Proje Grubu"> Proje Grubu</label>
                    <label><input type="checkbox" name="kullanim_amaci[]" value="Konferans/Kongre/Sempozyum"> Konferans/Kongre/Sempozyum</label>
                    <label><input type="checkbox" name="kullanim_amaci[]" value="Diğer"> Diğer</label>
                </div>
                <textarea name="aciklama" rows="2" placeholder="Diğer veya ek açıklamalarınız..."></textarea>
            </div>

            <button type="button" class="accordion-btn" onclick="toggleAccordion(this)">
                <span>BALIKESİR ÜNİVERSİTESİ ELEKTRONİK POSTA (e-mail) ADRESİ KULLANIM KURALLARI</span>
                <span class="icon">▼</span>
            </button>
            <div class="accordion-panel">
                <div style="padding-top: 15px; padding-bottom: 15px;">
                    <p><strong>1- KANUNİ YÜKÜMLÜLÜK:</strong></p>
                    <p>1.1- @balikesir.edu.tr domain’i T.C. Balıkesir Üniversitesi personeline (Akademik vce İdari) hizmet vermektedir. Bu hizmet akademik eğitim- öğretim amaçlı araştırma ve geliştirme faaliyetleri içermektedir.</p>
                    <p>1.2- @balikesir.edu.tr domain’ine ait e-posta hesaplarını kullanan şahıslar Türkiye Cumhuriyeti kanun ve bunlara bağlı olan yönetmeliklere, TÜBİTAK ULAKBİM tarafından işletilen Ulusal Akademik Ağ'ın (ULAKNET) kullanımına ilişkin usul ve esaslara, T.C. Balıkesir Üniversitesi yönetmeliklerine aykırı hareket edemezler.</p>
                    
                    <p><strong>2- GİZLİLİK ve GÜVENLİK:</strong></p>
                    <p>2.1- T.C. Balıkesir Üniversitesinden personel e-posta adresi talep eden şahıslar, bu formu doldurup personel kimlikleri ile birlikte Bilgi İşlem Dairesi Başkanlığına şahsen müracaat etmeleri gerekmektedir.</p>
                    <p>2.2- Kullanıcı adı ve şifrenin seçimi ve korunması tamamıyla kullanıcının sorumluluğundadır.</p>
                </div>
            </div>

            <div class="resmi-yazi" style="font-size: 12.5px;">
                Birimimiz adına kullanılmak üzere, sistemde yukarıda belirtilen e-posta hesabının açılmasını talep ediyoruz. Ayrıca yukarıda bulunan T.C. Balıkesir Üniversitesi Bilişim Kaynakları Kullanım Politikası, T.C. Balıkesir Üniversitesi E-posta Kullanım Politikası ve Bilgi İşlem Daire Başkanlığı web sayfasında bulunan yasal düzenlemelerdeki kanun, yönetmelik ve politikaların okunduğu ve bunlara uygun hareket edileceğini taahhüt ederiz.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Formu Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0073 - Bilgi İşlem DB E-İmza Mini Kart Okuyucu Teslim Tesellüm Tutanağı -->
    <div id="form_0073.php" class="gizli-form">
        <h2>KDYS.FR.0073 - E-İmza Mini Kart Okuyucu Teslim Tesellüm Tutanağı</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0073">
            <input type="hidden" name="form_adi" value="E-İmza Mini Kart Okuyucu Teslim Tesellüm Tutanağı">

            <div class="resmi-yazi" style="text-align: center; font-weight: bold;">
                ÜRÜNÜ ALAN KİŞİ BİLGİLERİ
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>AD, SOYAD</label>
                    <input type="text" name="ad_soyad" required>
                </div>
                <div class="form-grup">
                    <label>TC KİMLİK NO</label>
                    <input type="text" name="tc_no" maxlength="11" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Fakülte/YO/MYO/Birim</label>
                    <input type="text" name="birim" required>
                </div>
                <div class="form-grup">
                    <label>İrtibat Telefonu</label>
                    <input type="text" name="telefon">
                </div>
            </div>

            <div class="form-grup">
                <label>Talep Tarihi</label>
                <input type="date" name="talep_tarihi" required>
            </div>

            <div class="resmi-yazi">
                Yukarıda belirtilen tarihte talep etmiş olduğum e-imza mini kart okuyucuyu TÜBİTAK Bilişim ve Bilgi Güvenliği İleri Teknolojileri Araştırma Merkezi firmasından tarafımca teslim aldığımı beyan ederim.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Formu Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0074 - E-İmza Talep Formu -->
    <div id="form_0074.php" class="gizli-form">
        <h2>KDYS.FR.0074 - Bilgi İşlem DB E-İmza Talep Formu</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0074">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB E-İmza Talep Formu">

            <div class="resmi-yazi" style="text-align: center; font-weight: bold;">
                E-İMZA BAŞVURU SAHİBİ / PERSONEL BİLGİ LİSTESİ
            </div>
            <div class="form-tablosu-wrapper">
                <table class="form-tablosu" id="eImzaTablosu">
                    <thead>
                        <tr>
                            <th style="min-width: 40px;">S.N.</th>
                            <th>T.C. Kimlik No</th>
                            <th>Doğum Tarihi (Gün/Ay/Yıl)</th>
                            <th>Ad</th>
                            <th>Soyad</th>
                            <th>E-Posta Adresi</th>
                            <th>Çalıştığı Birimi</th>
                            <th>Görevi</th>
                            <th>Cep Tel. No</th>
                            <th>Başvuru Türü</th>
                            <th>Ödeme</th>
                            <th>Açıklama</th>
                            <th style="width: 30px;">#</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="sn-hucre">1</td>
                            <td><input type="text" name="eimza_tc[]" maxlength="11"></td>
                            <td><input type="date" name="eimza_dogum[]"></td>
                            <td><input type="text" name="eimza_ad[]"></td>
                            <td><input type="text" name="eimza_soyad[]"></td>
                            <td><input type="text" name="eimza_eposta[]"></td>
                            <td><input type="text" name="eimza_birim[]"></td>
                            <td><input type="text" name="eimza_gorev[]"></td>
                            <td><input type="text" name="eimza_telefon[]"></td>
                            <td>
                                <select name="eimza_basvuru_turu[]">
                                    <option value="İlk Sertifika">İlk Sertifika</option>
                                    <option value="Yenileme">Yenileme</option>
                                </select>
                            </td>
                            <td><input type="text" name="eimza_odeme[]"></td>
                            <td><input type="text" name="eimza_aciklama[]"></td>
                            <td></td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="13" style="text-align: left; background-color: #fcfcfc; padding: 10px;">
                                <button type="button" class="btn-alt-satir-ekle" onclick="yeniSatirEkle()">
                                    <span>+</span> Yeni Satır Ekle
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Formu Gönder</button>
        </form>
    </div>    <!-- KDYS.FR.0077 - Bilgi İşlem DB Kişisel Web Adı ve Alanı Sözleşmesi -->
    <div id="form_0077.php" class="gizli-form">
        <h2>KDYS.FR.0077 - Bilgi İşlem DB Kişisel Web Adı ve Alanı Sözleşmesi</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0077">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB Kişisel Web Adı ve Alanı Sözleşmesi">

            <div class="resmi-yazi" style="text-align: center; font-weight: bold; background-color: #e8f4f8; color: #1b656e;">
                KİŞİSEL WEB ADI VE ALANI TALEP BİLGİLERİ
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Birim Adı *</label>
                    <input type="text" name="birim_adi" placeholder="BALIKESİR ÜNİVERSİTESİ - ..." required>
                </div>
                <div class="form-grup">
                    <label>Personelin Adı-Soyadı *</label>
                    <input type="text" name="personel_ad_soyad" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Unvanı *</label>
                    <input type="text" name="unvan" required>
                </div>
                <div class="form-grup">
                    <label>T.C. Kimlik Numarası *</label>
                    <input type="text" name="tc_no" maxlength="11" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Telefonu *</label>
                    <input type="text" name="telefon" required>
                </div>
                <div class="form-grup">
                    <label>E-posta Adresi (Hesap bilgileri bu adrese gönderilecektir) *</label>
                    <input type="email" name="eposta" placeholder="ornek@balikesir.edu.tr" required>
                </div>
            </div>

            <div class="form-grup">
                <label>Talep Edilen Web Adı *</label>
                <input type="text" name="web_adi" placeholder="kullaniciadi.baun.edu.tr" required>
            </div>

            <div class="form-grup">
                <label>Kullanım Amacı *</label>
                <textarea name="kullanim_amaci" rows="3" placeholder="Web alanının kullanım amacını detaylıca açıklayınız..." required></textarea>
            </div>

            <div class="resmi-yazi">
                Akademik/İdari çalışmalarımda kullanmak üzere, sistemde yukarıda belirtilen alan adının açılması, 150 MB web ve 20 MB veritabanı (istenirse) kotalı alanın tahsis edilmesi ve bu alanların kullanımı için gerekli web kullanıcısının açılarak erişim bilgilerinin tarafıma teslim edilmesini talep ediyorum. Ayrıca bu sayfanın altında bulunan T.C. Balıkesir Üniversitesi Bilişim Kaynakları Kullanım Politikası ve <a href="http://bid.balikesir.edu.tr" target="_blank" style="color: #1b656e; font-weight: bold;">http://bid.balikesir.edu.tr</a> adresinde bulunan yasal düzenlemelerdeki kanun, yönetmelik ve politikaları okuduğumu ve bunlara uygun hareket edeceğimi taahhüt ederim.
            </div>

            <button type="button" class="accordion-btn" onclick="toggleAccordion(this)">
                <span> BAÜN Bilişim Kaynakları Kullanım Politikası</span>
                <span style="font-size: 16px;">▼</span>
            </button>
            <div class="accordion-panel">
                <h4>1. Tanımlamalar</h4>
                <p><strong>BAÜN Bilişim Kaynakları:</strong> Mülkiyet hakları BAÜN’ ye ait olan, BAÜN tarafından lisanslanan/kiralanan ya da BAÜN tarafından kullanım hakkına sahip olunan her türlü bilgisayar/bilgisayar ağı, donanım, yazılım ve servislerini ifade eder.</p>
                <p><strong>BAÜN Bilişim Kaynakları Kullanıcıları:</strong> BAÜN Bilişim Kaynaklarını kullanmak üzere, bu kaynaklar üzerinde gerekli yetkilendirme tanımları yapılarak belirlenen özel ve tüzel kişilerdir.</p>
                <p><strong>BAÜN Kullanıcıları:</strong> BAÜN’ nün idari yapısı içinde yer alan birimlerde akademik ve idari görevlerde bulunan kadrolu/geçici personel ile BAÜN’ de öğrenim hayatını sürdürmekte olan tüm lisans ve lisansüstü öğrenciler “BAÜN Kullanıcıları” olarak tanımlanır.</p>
                
                <h4>2. Genel İlkeler</h4>
                <p>BAÜN Bilişim Kaynakları, Temel Kullanım kapsamındaki ihtiyaçlar için hizmete sunulmaktadır. Bu kaynakların israfından kaçınılmalıdır.</p>
            </div>
            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Talebi ve Sözleşmeyi Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0078 - Bilgi İşlem DB Kurumsal Statik IP Sözleşmesi -->
    <div id="form_0078.php" class="gizli-form">
        <h2>KDYS.FR.0078 - Bilgi İşlem DB Kurumsal Statik IP Sözleşmesi</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0078">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB Kurumsal Statik IP Sözleşmesi">

            <div class="resmi-yazi" style="text-align: center; font-weight: bold; background-color: #e8f4f8; color: #1b656e;">
                KURUMSAL STATİK IP TALEP BİLGİLERİ
            </div>

            <div class="form-grup">
                <label>Birim Adı *</label>
                <input type="text" name="birim_adi" placeholder="Balıkesir Üniversitesi - ..." required>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Sorumlu Personelin Adı-Soyadı *</label>
                    <input type="text" name="sorumlu_ad_soyad" required>
                </div>
                <div class="form-grup">
                    <label>Unvanı *</label>
                    <input type="text" name="unvan" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>T.C. Kimlik Numarası *</label>
                    <input type="text" name="tc_no" maxlength="11" required>
                </div>
                <div class="form-grup">
                    <label>Telefonu *</label>
                    <input type="text" name="telefon" required>
                </div>
            </div>

            <div class="form-grup">
                <label>E-posta (IP bilgileri bu adrese gönderilecektir) *</label>
                <input type="email" name="eposta" placeholder="ornek@balikesir.edu.tr" required>
            </div>

            <div class="form-grup">
                <label>Kullanım Amacı *</label>
                <select name="kullanim_amaci" required>
                    <option value="">-- Seçiniz --</option>
                    <option value="Fakülte/YO Adına">Fakülte/YO Adına</option>
                    <option value="Bölüm/Birim Adına">Bölüm/Birim Adına</option>
                    <option value="Topluluk Adına">Topluluk Adına</option>
                    <option value="Konferans/Kongre/Sempozyum">Konferans/Kongre/Sempozyum</option>
                    <option value="Proje Grubu">Proje Grubu</option>
                    <option value="Diğer">Diğer</option>
                </select>
            </div>
            <div class="form-grup">
                <label>Açıklama</label>
                <textarea name="aciklama" rows="2" placeholder="Kullanım amacınızı detaylandırınız..."></textarea>
            </div>

            <div class="resmi-yazi">
                Birimimiz adına kullanılmak üzere, bir adet statik ip'nin tarafımıza tahsis edilmesini talep ediyoruz. Kullanacağımız tüm bilgisayar, sunucu ve cihazlar birimimiz tarafından temin edilecektir. Bu statik ip'nin erişim sağlayıcı (gateway) olarak kullanılmayacağını, ayrıca bu sayfanın arkasında bulunan T.C. Balıkesir Üniversitesi Bilişim Kaynakları Kullanım Politikası ve <a href="http://bid.balikesir.edu.tr" target="_blank" style="color: #1b656e; font-weight: bold;">http://bid.balikesir.edu.tr</a> adresinde bulunan yasal düzenlemelerdeki kanun, yönetmelik ve politikaların okunduğu ve bunlara uygun hareket edileceğini taahhüt ederiz.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Talebi ve Sözleşmeyi Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0079 - Bilgi İşlem DB Kurumsal Web Adı ve Alanı Sözleşmesi -->
    <div id="form_0079.php" class="gizli-form">
        <h2>KDYS.FR.0079 - Bilgi İşlem DB Kurumsal Web Adı ve Alanı Sözleşmesi</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0079">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB Kurumsal Web Adı ve Alanı Sözleşmesi">

            <div class="resmi-yazi" style="text-align: center; font-weight: bold; background-color: #e8f4f8; color: #1b656e;">
                KURUMSAL WEB ADI VE ALANI TALEP BİLGİLERİ
            </div>

            <div class="form-grup">
                <label>Birim Adı *</label>
                <input type="text" name="birim_adi" value="BALIKESİR ÜNİVERSİTESİ" required>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Sorumlu Personelin Adı-Soyadı *</label>
                    <input type="text" name="sorumlu_ad_soyad" required>
                </div>
                <div class="form-grup">
                    <label>Unvanı *</label>
                    <input type="text" name="unvan" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>T.C. Kimlik Numarası *</label>
                    <input type="text" name="tc_no" maxlength="11" required>
                </div>
                <div class="form-grup">
                    <label>Telefonu *</label>
                    <input type="text" name="telefon" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>E-posta (Hesap bilgileri bu adrese gönderilecektir) *</label>
                    <input type="email" name="eposta" placeholder="ornek@balikesir.edu.tr" required>
                </div>
                <div class="form-grup">
                    <label>Talep Edilen Web Adı *</label>
                    <input type="text" name="web_adi" placeholder="birimadi.balikesir.edu.tr" required>
                </div>
            </div>

            <div class="form-grup">
                <label>Kullanım Amacı *</label>
                <select name="kullanim_amaci" required>
                    <option value="">-- Seçiniz --</option>
                    <option value="Fakülte/YO Adına">Fakülte/YO Adına</option>
                    <option value="Birim/Bölüm Adına">Birim/Bölüm Adına</option>
                    <option value="Topluluk Adına">Topluluk Adına</option>
                    <option value="Konferans/Kongre/Sempozyum">Konferans/Kongre/Sempozyum</option>
                    <option value="Proje Grubu">Proje Grubu</option>
                    <option value="Diğer">Diğer</option>
                </select>
            </div>
            <div class="form-grup">
                <label>Açıklama</label>
                <textarea name="aciklama" rows="2" placeholder="Kullanım amacınızı detaylandırınız..."></textarea>
            </div>

            <div class="resmi-yazi">
                Birimimiz adına kullanılmak üzere, sistemde yukarıda belirtilen alan adının açılması, 250 MB web ve 100 MB veri tabanı (istenirse) kotalı alanın tahsis edilmesi ve bu alanların kullanımı için gerekli web kullanıcısının açılarak yukarıda adı belirtilen personele teslim edilmesini talep ediyoruz. Ayrıca bu sayfanın arkasında bulunan T.C. Balıkesir Üniversitesi Bilişim Kaynakları Kullanım Politikası, eki Web Kullanıcıları Servis Politikası ve <a href="http://bid.balikesir.edu.tr" target="_blank" style="color: #1b656e; font-weight: bold;">http://bid.balikesir.edu.tr</a> adresinde bulunan yasal düzenlemelerdeki kanun, yönetmelik ve politikaların okunduğu ve bunlara uygun hareket edileceğini taahhüt ederiz.
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Talebi ve Sözleşmeyi Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0080 - Bilgi İşlem DB Mernis Taahhütnamesi -->
    <div id="form_0080.php" class="gizli-form">
        <h2>KDYS.FR.0080 - Bilgi İşlem DB Mernis Taahhütnamesi</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0080">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB Mernis Taahhütnamesi">

            <div class="resmi-yazi" style="text-align: center; font-weight: bold; background-color: #e8f4f8; color: #1b656e;">
                KİMLİK PAYLAŞIM SİSTEMİ (KPS) KULLANICI TAAHHÜTNAMESİ<br>
                <span style="font-weight: normal; font-style: italic; font-size: 12px;">- Gizlilik Taahhüt Belgesi -</span>
            </div>

            <div class="resmi-yazi">
                <strong>AÇIKLAMA:</strong> 10/07/2005 tarih ve 25871 sayılı Resmi Gazete'de yayımlanan T.C. Nüfus ve Vatandaşlık İşleri Genel Müdürlüğüne ait Kimlik Paylaşım Sistemi (KPS) Uygulama Yönetmeliği kapsamında Bakanlığımız ile ilgili iş ve işlem süreçlerindeki vatandaşlarımızın nüfus ve adres bilgilerinin paylaşımı hakkında "ikili anlaşma" imzalanmıştır. İlgili Yönetmeliğe ilişkin usul ve esaslar içerisinde yer alan "Özel Hayatın Gizliliği" ve "Kişisel Verilerin Korunması" hükümleriyle Balıkesir Üniversitesine ve görevli personele bazı sorumluluklar getirilmiştir. Bu sorumlulukların paylaşımı çerçevesinde iş süreçlerinde KPS üzerinden nüfus ve adres bilgilerine erişen çalışanlarımız için aşağıdaki taahhütname hazırlanmıştır.
            </div>

            <div class="resmi-yazi" style="font-weight: bold;">
                TAAHHÜTNAME: Anayasamızın 20. maddesinde "Herkes, özel hayatına ve aile hayatına saygı gösterilmesini isteme hakkına sahiptir. Özel hayatın ve aile hayatının gizliliğine dokunulamaz." denilmektedir. Bu kapsamda KPS'den elde edilen tüm nüfus ve adres bilgilerini sadece T.C. Balıkesir Üniversitesi ve bağlı birimlerdeki iş süreçleri içerisinde kullanacağımı, kullanıcı parolamın güvenliğini sağlayacağımı, aksi takdirde idari, hukuki ve mali sorumluluğun tarafıma ait olduğunu beyan ve taahhüt ederim.
            </div>

            <div class="form-grup">
                <label>Taahhüt Tarihi *</label>
                <input type="date" name="taahhut_tarihi" required>
            </div>

            <h3 style="color:#1b656e; font-size:15px; border-bottom:1px solid #eee; padding-bottom:5px; margin-top:25px;">Personel Bilgisi</h3>
            <div class="form-satir">
                <div class="form-grup">
                    <label>Adı Soyadı *</label>
                    <input type="text" name="personel_ad_soyad" required>
                </div>
                <div class="form-grup">
                    <label>Kurum Sicili, Unvanı *</label>
                    <input type="text" name="personel_sicil_unvan" required>
                </div>
            </div>
            <div class="form-satir">
                <div class="form-grup">
                    <label>T.C. Kimlik No *</label>
                    <input type="text" name="personel_tc_no" maxlength="11" required>
                </div>
                <div class="form-grup">
                    <label>E-posta *</label>
                    <input type="email" name="personel_eposta" required>
                </div>
            </div>
            <div class="form-grup">
                <label>Birim *</label>
                <input type="text" name="personel_birim" required>
            </div>

            <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 15px;">Taahhütnameyi Gönder</button>
        </form>
    </div>

    <!-- KDYS.FR.0082 - Bilgi İşlem DB Personel Elektronik Posta Başvuru Formu -->
    <div id="form_0082.php" class="gizli-form">
        <h2>KDYS.FR.0082 - Bilgi İşlem DB Personel Elektronik Posta Başvuru Formu</h2>
        <form method="POST" action="islem.php">
            <input type="hidden" name="form_kodu" value="KDYS.FR.0082">
            <input type="hidden" name="form_adi" value="Bilgi İşlem DB Personel Elektronik Posta Başvuru Formu">

            <div class="form-satir">
                <div class="form-grup">
                    <label>Başvuru Tarihi *</label>
                    <input type="date" name="basvuru_tarihi" required>
                </div>
                <div class="form-grup">
                    <label>Adı Soyadı *</label>
                    <input type="text" name="ad_soyad" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>T.C. No - Kurum Sicil No *</label>
                    <input type="text" name="tc_sicil_no" required>
                </div>
                <div class="form-grup">
                    <label>Fakülte/Yüksekokul *</label>
                    <input type="text" name="fakulte_yo" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Unvanı - Bölümü/Birimi *</label>
                    <input type="text" name="unvan_bolum" required>
                </div>
                <div class="form-grup">
                    <label>Ev / Cep Telefonu *</label>
                    <input type="text" name="telefon" required>
                </div>
            </div>

            <div class="form-satir">
                <div class="form-grup">
                    <label>Diğer E-posta *</label>
                    <input type="email" name="diger_eposta" required>
                </div>
                <div class="form-grup">
                    <label>Bölüm Başkanının Adı Soyadı (Onay) *</label>
                    <input type="text" name="bolum_baskani_onay" required>
                </div>
            </div>

            <button type="button" class="accordion-btn" onclick="toggleAccordion(this)">
                <span> BALIKESİR ÜNİVERSİTESİ Elektronik Posta (e-mail) Adresi Kullanım Kuralları</span>
                <span style="font-size: 16px;">▼</span>
            </button>
            <div class="accordion-panel">
                <h4>1. Kanuni Yükümlülük</h4>
                <p>@balikesir.edu.tr domaini T.C. Balıkesir Üniversitesi personeline (akademik ve idari) hizmet vermektedir.</p>
                <h4>2. Gizlilik ve Güvenlik</h4>
                <p>E-posta şifresinin korunması kullanıcının sorumluluğundadır.</p>
            </div>

        </form>
    </div>

    <!-- DİNAMİK EKLENEN SÜPER ADMİN FORMLARI -->
    <?php foreach ($dinamik_formlar as $df): ?>
        <?php $dyn_id = 'form_dyn_' . md5($df['form_kodu']); ?>
        <div id="<?php echo $dyn_id; ?>" class="gizli-form">
            <h2><?php echo htmlspecialchars($df['form_adi']); ?></h2>

            <?php if (!empty($df['aciklama'])): ?>
                <div class="resmi-yazi">
                    <?php echo nl2br(htmlspecialchars($df['aciklama'])); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="islem.php" enctype="multipart/form-data">
                <input type="hidden" name="form_kodu" value="<?php echo htmlspecialchars($df['form_kodu']); ?>">
                <input type="hidden" name="form_adi" value="<?php echo htmlspecialchars($df['form_adi']); ?>">

                <div class="form-satir">
                    <div class="form-grup">
                        <label>Ad, Soyad *</label>
                        <input type="text" name="ad_soyad" required>
                    </div>
                    <div class="form-grup">
                        <label>TC Kimlik No *</label>
                        <input type="text" name="tc_no" maxlength="11" required>
                    </div>
                </div>

                <div class="form-satir">
                    <div class="form-grup">
                        <label>İrtibat Telefonu *</label>
                        <input type="text" name="telefon" required>
                    </div>
                    <div class="form-grup">
                        <label>E-Posta Adresi *</label>
                        <input type="email" name="eposta" required>
                    </div>
                </div>

                <div class="form-grup">
                    <label>Fakülte / Birim *</label>
                    <input type="text" name="birim" required>
                </div>

                <!-- Özel Tanımlanmış Dinamik Alanlar -->
                <?php 
                $oAlanlar = json_decode($df['alanlar'] ?? '[]', true) ?: [];
                foreach ($oAlanlar as $oa):
                    $etiket = htmlspecialchars($oa['etiket']);
                    $field_name = htmlspecialchars($oa['etiket']);
                    $tip = $oa['tip'] ?? 'text';
                    $req = !empty($oa['zorunlu']) ? 'required' : '';
                    $req_star = !empty($oa['zorunlu']) ? ' *' : '';
                ?>
                    <div class="form-grup">
                        <label><?php echo $etiket . $req_star; ?></label>

                        <?php if ($tip === 'textarea'): ?>
                            <textarea name="dyn_field[<?php echo $field_name; ?>]" rows="3" <?php echo $req; ?>></textarea>
                        <?php elseif ($tip === 'select'): ?>
                            <select name="dyn_field[<?php echo $field_name; ?>]" <?php echo $req; ?>>
                                <option value="">Seçiniz...</option>
                                <?php foreach ($oa['secenekler'] as $opt): ?>
                                    <option value="<?php echo htmlspecialchars($opt); ?>"><?php echo htmlspecialchars($opt); ?></option>
                                <?php endforeach; ?>
                            </select>
                        <?php elseif ($tip === 'date'): ?>
                            <input type="date" name="dyn_field[<?php echo $field_name; ?>]" <?php echo $req; ?>>
                        <?php elseif ($tip === 'file'): ?>
                            <input type="file" name="dyn_file_<?php echo md5($field_name); ?>" <?php echo $req; ?>>
                            <input type="hidden" name="dyn_file_label_<?php echo md5($field_name); ?>" value="<?php echo $field_name; ?>">
                        <?php else: ?>
                            <input type="text" name="dyn_field[<?php echo $field_name; ?>]" <?php echo $req; ?>>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>

                <button type="submit" name="form_gonder" class="btn-tamam" style="width: 100%; justify-content: center; margin-top: 20px;">Başvuruyu Gönder</button>
            </form>
        </div>
    <?php endforeach; ?>

    <!-- JavaScript Kodları -->
    <script>
        function formYonetlendir() {
            var secilenForm = document.getElementById("formSecici").value;
            var hataMesaji = document.getElementById("hata-mesaji");
            var tumFormlar = document.querySelectorAll(".gizli-form");
            
            tumFormlar.forEach(function(form) { form.style.display = "none"; });
            
            if (secilenForm === "") {
                hataMesaji.style.display = "block";
            } else {
                hataMesaji.style.display = "none";
                var acilacakForm = document.getElementById(secilenForm);
                if (acilacakForm) {
                    acilacakForm.style.display = "block";
                } else {
                    alert("Seçtiğiniz form (" + secilenForm + ") henüz hazırlanmaktadır.");
                }
            }
        }

        // KDYS.FR.0074 Formu İçin Satır Ekleme/Silme İşlemleri
        function yeniSatirEkle() {
            var tabloBody = document.querySelector("#eImzaTablosu tbody");
            var yeniSatir = document.createElement("tr");
            yeniSatir.innerHTML = `
                <td class="sn-hucre"></td>
                <td><input type="text" name="eimza_tc[]" maxlength="11"></td>
                <td><input type="date" name="eimza_dogum[]"></td>
                <td><input type="text" name="eimza_ad[]"></td>
                <td><input type="text" name="eimza_soyad[]"></td>
                <td><input type="text" name="eimza_eposta[]"></td>
                <td><input type="text" name="eimza_birim[]"></td>
                <td><input type="text" name="eimza_gorev[]"></td>
                <td><input type="text" name="eimza_telefon[]"></td>
                <td>
                    <select name="eimza_basvuru_turu[]">
                        <option value="İlk Sertifika">İlk Sertifika</option>
                        <option value="Yenileme">Yenileme</option>
                    </select>
                </td>
                <td><input type="text" name="eimza_odeme[]"></td>
                <td><input type="text" name="eimza_aciklama[]"></td>
                <td>
                    <button type="button" class="btn-satir-sil" onclick="satirSil(this)" title="Satırı Sil">✕</button>
                </td>
            `;
            tabloBody.appendChild(yeniSatir);
            snNumaralariniGuncelle();
        }

        function satirSil(btn) {
            var satir = btn.closest("tr");
            satir.remove();
            snNumaralariniGuncelle();
        }

        function snNumaralariniGuncelle() {
            var snHucraleri = document.querySelectorAll("#eImzaTablosu tbody .sn-hucre");
            snHucraleri.forEach(function(hucre, index) {
                hucre.textContent = index + 1;
            });
        }

        // Akordiyon (Açılır / Kapanır Politika Alanı) Fonksiyonu
        function toggleAccordion(btn) {
            btn.classList.toggle("active");
            var panel = btn.nextElementSibling;
            var arrow = btn.querySelector("span:last-child");
            
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                arrow.textContent = "▼";
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                arrow.textContent = "▲";
            }
        }

        // İşe Giriş Formu Muayene Tarihi Seçilince Bitiş Tarihini Otomatik 1 Yıl Sonrasına Ayarlama
        function muayeneTarihiHesapla(input) {
            if (!input || !input.value) return;
            var parts = input.value.split('-');
            if (parts.length !== 3) return;
            var secilenTarih = new Date(parts[0], parts[1] - 1, parts[2]);
            if (isNaN(secilenTarih.getTime())) return;
            
            secilenTarih.setFullYear(secilenTarih.getFullYear() + 1);
            
            var yyyy = secilenTarih.getFullYear();
            var mm = String(secilenTarih.getMonth() + 1).padStart(2, '0');
            var dd = String(secilenTarih.getDate()).padStart(2, '0');
            var bitisStr = yyyy + '-' + mm + '-' + dd;
            
            var form = input.closest("form");
            if (form) {
                var bitisInput = form.querySelector('input[name="bitis_tarihi"], #ise_bitis_tarihi');
                if (bitisInput) {
                    bitisInput.value = bitisStr;
                }
            }
        }

        // Dosya / PDF Yüklendiğinde Görsel Yeşil Rozet ve Detay Gösterme İşlemleri
        function initFileInputPreviews() {
            document.querySelectorAll('input[type="file"]').forEach(function(fileInput) {
                if (fileInput.dataset.hasPreviewListener) return;
                fileInput.dataset.hasPreviewListener = "true";

                fileInput.addEventListener('change', function() {
                    // Eski object URL'yi bellek sızıntısını önlemek için iptal et
                    if (fileInput.dataset.objectUrl) {
                        URL.revokeObjectURL(fileInput.dataset.objectUrl);
                        delete fileInput.dataset.objectUrl;
                    }

                    var existingPreview = fileInput.parentNode.querySelector('.file-preview-box');
                    if (existingPreview) existingPreview.remove();

                    if (fileInput.files && fileInput.files.length > 0) {
                        var file = fileInput.files[0];
                        var fileName = file.name;
                        var fileSize = (file.size / 1024).toFixed(1);
                        var sizeText = fileSize > 1024 ? (fileSize / 1024).toFixed(2) + ' MB' : fileSize + ' KB';
                        var isPdf = fileName.toLowerCase().endsWith('.pdf');
                        var icon = isPdf ? '📄 PDF' : '📎 Dosya';

                        if (isPdf) {
                            alert("PDF başarıyla eklendi!");
                        }

                        var previewDiv = document.createElement('div');
                        previewDiv.className = 'file-preview-box';
                        previewDiv.style.marginTop = '10px';
                        previewDiv.style.padding = '10px';
                        previewDiv.style.border = '1px solid #ced4da';
                        previewDiv.style.borderRadius = '4px';
                        previewDiv.style.backgroundColor = '#f8f9fa';

                        var objectUrl = URL.createObjectURL(file);
                        fileInput.dataset.objectUrl = objectUrl;

                        var previewHtml = `
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                <span class="file-info" style="display: flex; align-items: center; gap: 6px;">
                                    <strong style="font-size:16px; color:#28a745;">✓</strong> 
                                    <span style="color:#28a745; font-weight:bold;"><strong>${icon} Başarıyla Eklendi:</strong> ${fileName} (${sizeText})</span>
                                </span>
                                <button type="button" class="btn-remove-file" onclick="clearSelectedFile(this)" style="padding: 4px 8px; font-size: 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">✕ Kaldır</button>
                            </div>
                        `;

                        if (isPdf) {
                            previewHtml += `
                                <div class="pdf-preview-container" style="width: 100%; height: 400px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: #fff;">
                                    <iframe src="${objectUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
                                </div>
                            `;
                        } else if (fileName.toLowerCase().match(/\.(jpe?g|png|gif|webp)$/)) {
                            previewHtml += `
                                <div class="img-preview-container" style="margin-top: 10px; text-align: left;">
                                    <img src="${objectUrl}" style="max-width: 100%; max-height: 250px; border: 1px solid #ddd; border-radius: 4px; object-fit: contain;">
                                </div>
                            `;
                        }
                        previewDiv.innerHTML = previewHtml;
                        fileInput.parentNode.insertBefore(previewDiv, fileInput.nextSibling);
                    }
                });
            });
        }

        function clearSelectedFile(btn) {
            var previewDiv = btn.closest('.file-preview-box');
            if (previewDiv) {
                var fileInput = previewDiv.parentNode.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.value = '';
                    if (fileInput.dataset.objectUrl) {
                        URL.revokeObjectURL(fileInput.dataset.objectUrl);
                        delete fileInput.dataset.objectUrl;
                    }
                }
                previewDiv.remove();
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            initFileInputPreviews();
            var observer = new MutationObserver(function() {
                initFileInputPreviews();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    </script>

</body>
</html>