<?php
require_once 'baglan.php';

$takip_no = trim($_GET['takip_no'] ?? $_POST['takip_no'] ?? '');
$basvuru = null;
$hata = "";

if (!empty($takip_no)) {
    $stmt = $db->prepare("SELECT * FROM basvurular WHERE takip_no = :tno");
    $stmt->execute([':tno' => $takip_no]);
    $basvuru = $stmt->fetch();

    if (!$basvuru) {
        $hata = "Girdiğiniz takip numarasına (<strong>".htmlspecialchars($takip_no)."</strong>) ait bir başvuru kaydı bulunamadı.";
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Başvuru Takip Sistemi - BAÜN Form İşlem Merkezi</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; color: #333; }
        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; background-color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .navbar-logo { display: flex; align-items: center; gap: 15px; font-weight: bold; color: #1b656e; font-size: 18px; text-decoration: none; }
        .navbar-link { font-size: 14px; color: #555; text-decoration: none; margin-left: 15px; }
        .navbar-link:hover { color: #1b656e; }

        .banner { background-color: rgb(3, 149, 159); color: white; text-align: center; padding: 60px 20px 100px 20px; border-bottom-left-radius: 50% 20%; border-bottom-right-radius: 50% 20%; margin-bottom: -40px; }
        .banner h1 { font-size: 32px; margin: 0 0 10px 0; }
        .banner p { font-size: 14px; opacity: 0.9; }

        .container { max-width: 700px; margin: 0 auto 50px auto; padding: 0 20px; position: relative; z-index: 10; }
        
        .sorgu-kutusu { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        .sorgu-kutusu h2 { color: #1b656e; margin-top: 0; font-size: 22px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .sorgu-form { display: flex; gap: 10px; margin-top: 20px; }
        .sorgu-input { flex: 1; padding: 14px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; text-align: center; letter-spacing: 1px; font-weight: bold; outline: none; transition: border-color 0.3s; }
        .sorgu-input:focus { border-color: #1b656e; }
        .btn-sorgula { background: #1b656e; color: white; border: none; padding: 14px 25px; border-radius: 6px; font-weight: bold; font-size: 15px; cursor: pointer; transition: background 0.3s; }
        .btn-sorgula:hover { background: rgb(3, 149, 159); }

        .sonuc-kart { background: white; margin-top: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); overflow: hidden; }
        .sonuc-header { background: #e8f4f8; padding: 18px 25px; border-bottom: 1px solid #d0e4eb; display: flex; justify-content: space-between; align-items: center; }
        .sonuc-header h3 { margin: 0; color: #1b656e; font-size: 18px; }
        .durum-rozeti { padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
        .durum-beklemede { background: #fef9e7; color: #f39c12; border: 1px solid #f39c12; }
        .durum-onaylandi { background: #e8f8f5; color: #27ae60; border: 1px solid #27ae60; }
        .durum-reddedildi { background: #fce8e6; color: #d93025; border: 1px solid #d93025; }

        .sonuc-body { padding: 25px; }
        .bilgi-satir { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .bilgi-satir:last-child { border-bottom: none; }
        .bilgi-baslik { font-weight: bold; color: #666; }
        .bilgi-deger { color: #333; font-weight: 600; text-align: right; }

        .red-kutusu { background: #fce8e6; border-left: 5px solid #d93025; padding: 15px 20px; border-radius: 6px; margin-top: 20px; color: #a51d12; text-align: left; }
        .red-kutusu h4 { margin: 0 0 5px 0; font-size: 15px; }
        .red-kutusu p { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 500; }

        .hata-kutusu { background: #fce8e6; color: #d93025; padding: 15px; border-radius: 6px; margin-top: 20px; font-weight: bold; border-left: 4px solid #d93025; }
    </style>
</head>
<body>

    <div class="navbar">
        <a href="index.php" class="navbar-logo">
            <img src="https://baunwebapi.balikesir.edu.tr/uploads/1729083231270.png" height="45">
            BALIKESİR ÜNİVERSİTESİ
        </a>
        <div>
            <a href="index.php" class="navbar-link">Formlar</a>
            <a href="takip.php" class="navbar-link" style="font-weight:bold; color:#1b656e;">Başvuru Takibi</a>
            <a href="login.php" class="navbar-link">Yönetici Girişi</a>
        </div>
    </div>

    <div class="banner">
        <h1>Başvuru Takip Sistemi</h1>
        <p><a href="index.php" style="color:white; text-decoration:none;">ANASAYFA</a> > BAŞVURU SORGULAMA</p>
    </div>

    <div class="container">
        <div class="sorgu-kutusu">
            <h2>Başvurunuzun Durumunu Öğrenin</h2>
            <p style="font-size:13.5px; color:#666; margin-bottom:15px;">Formu gönderdikten sonra size verilen 10 haneli <strong>Takip Numarasını</strong> aşağıya girerek sorgulama yapabilirsiniz.</p>
            
            <form method="GET" class="sorgu-form">
                <input type="text" name="takip_no" class="sorgu-input" value="<?php echo htmlspecialchars($takip_no); ?>" placeholder="Örn: 2026230593" required autocomplete="off">
                <button type="submit" class="btn-sorgula">Sorgula</button>
            </form>

            <?php if(!empty($hata)): ?>
                <div class="hata-kutusu"><?php echo $hata; ?></div>
            <?php endif; ?>
        </div>

        <?php if ($basvuru): ?>
            <?php 
                $durum = $basvuru['durum'];
                $rozet_class = 'durum-beklemede';
                if ($durum == 'Onaylandı') $rozet_class = 'durum-onaylandi';
                if ($durum == 'Reddedildi') $rozet_class = 'durum-reddedildi';
            ?>
            <div class="sonuc-kart">
                <div class="sonuc-header">
                    <h3>Başvuru Durum Detayı</h3>
                    <span class="durum-rozeti <?php echo $rozet_class; ?>"><?php echo htmlspecialchars($durum); ?></span>
                </div>
                <div class="sonuc-body">
                    <div class="bilgi-satir">
                        <span class="bilgi-baslik">Takip Numarası</span>
                        <span class="bilgi-deger" style="color:#1b656e; font-size:16px;">#<?php echo htmlspecialchars($basvuru['takip_no']); ?></span>
                    </div>
                    <div class="bilgi-satir">
                        <span class="bilgi-baslik">Form Türü / Adı</span>
                        <span class="bilgi-deger"><?php echo htmlspecialchars($basvuru['form_kodu'] . ' - ' . $basvuru['form_adi']); ?></span>
                    </div>
                    <div class="bilgi-satir">
                        <span class="bilgi-baslik">Başvuran Ad Soyad</span>
                        <span class="bilgi-deger"><?php echo htmlspecialchars($basvuru['ad_soyad'] ?: '-'); ?></span>
                    </div>
                    <div class="bilgi-satir">
                        <span class="bilgi-baslik">Başvuru Tarihi</span>
                        <span class="bilgi-deger"><?php echo date('d.m.Y H:i', strtotime($basvuru['kayit_tarihi'])); ?></span>
                    </div>

                    <?php if ($durum == 'Reddedildi'): ?>
                        <div class="red-kutusu">
                            <h4>❌ Başvurunuz Reddedilmiştir</h4>
                            <p><strong>Gerekçe / Red Sebebi:</strong> <?php echo nl2br(htmlspecialchars($basvuru['red_sebebi'] ?: 'Belirtilen gerekçe bulunmamaktadır. Lütfen biriminiz ile iletişime geçiniz.')); ?></p>
                        </div>
                    <?php elseif ($durum == 'Onaylandı'): ?>
                        <div style="background:#e8f8f5; border-left:5px solid #27ae60; padding:15px 20px; border-radius:6px; margin-top:20px; color:#1e8449; text-align:left;">
                            ✓ <strong>Tebrikler:</strong> Başvurunuz onaylanmış ve gerekli işlemler tamamlanmıştır.
                        </div>
                    <?php else: ?>
                        <div style="background:#fef9e7; border-left:5px solid #f39c12; padding:15px 20px; border-radius:6px; margin-top:20px; color:#b7950b; text-align:left;">
                            ⏳ <strong>Bilgi:</strong> Başvurunuz yetkili birim tarafından inceleme aşamasındadır.
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>

</body>
</html>
