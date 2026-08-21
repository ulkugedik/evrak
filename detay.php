<?php
session_start();
require_once 'baglan.php';

// Güvenlik Kontrolü: Giriş yapılmadıysa login.php'ye yönlendir
if (!isset($_SESSION['admin_giris']) || $_SESSION['admin_giris'] !== true) {
    header("Location: login.php");
    exit;
}

$id = intval($_GET['id'] ?? $_POST['id'] ?? 0);
$stmt = $db->prepare("SELECT * FROM basvurular WHERE id = :id");
$stmt->execute([':id' => $id]);
$basvuru = $stmt->fetch();

if (!$basvuru) {
    die("Başvuru bulunamadı!");
}

$admin_id  = $_SESSION['admin_id'] ?? 0;
$admin_rol = $_SESSION['admin_rol'] ?? 'admin';

// Güvenlik: Normal admin sadece izinli olduğu formu görebilir
if ($admin_rol !== 'superadmin') {
    $permStmt = $db->prepare("SELECT COUNT(*) FROM yonetici_izinleri WHERE yonetici_id = :yid AND form_kodu = :fkodu");
    $permStmt->execute([':yid' => $admin_id, ':fkodu' => $basvuru['form_kodu']]);
    if ($permStmt->fetchColumn() == 0) {
        die("<div style='font-family:sans-serif; padding:50px; text-align:center;'><h2> Erişim Engellendi</h2><p>Bu başvuru formunu (".htmlspecialchars($basvuru['form_kodu']).") görüntüleme yetkiniz bulunmamaktadır.</p><br><a href='panel.php' style='color:#1b656e; font-weight:bold;'>Panele Dön</a></div>");
    }
}

$veriler = json_decode($basvuru['form_verileri'], true) ?? [];

// YÖNETİCİ TARAFINDAN GİRİLEN BİLGİLERİ KAYDETME İŞLEMİ
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['yonetici_kaydet'])) {
    $yonetici_verileri = $_POST['yonetici'] ?? [];
    
    foreach ($yonetici_verileri as $k => $v) {
        $veriler[$k] = $v;
    }
    
    $yeni_json = json_encode($veriler, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $updateStmt = $db->prepare("UPDATE basvurular SET form_verileri = :fv WHERE id = :id");
    $updateStmt->execute([':fv' => $yeni_json, ':id' => $id]);
    
    header("Location: detay.php?id={$id}&kaydedildi=1");
    exit;
}

$bugun = date('Y-m-d');
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Başvuru Detayı #<?php echo $basvuru['takip_no'] ?: $basvuru['id']; ?> - BAÜN</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; color: #333; }
        .noprint { display: flex; justify-content: space-between; align-items: center; background: #1b656e; color: white; padding: 15px 30px; }
        .noprint a { color: white; text-decoration: none; font-weight: bold; background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 4px; }
        .noprint button { background: #27ae60; color: white; border: none; padding: 8px 18px; font-weight: bold; border-radius: 4px; cursor: pointer; }
        
        .paper { background: white; max-width: 900px; margin: 30px auto; padding: 40px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
        .paper-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1b656e; padding-bottom: 15px; margin-bottom: 25px; }
        .paper-header h2 { margin: 0; color: #1b656e; font-size: 22px; }
        .paper-header p { margin: 5px 0 0 0; color: #666; font-size: 13px; }
        
        .photo-box { width: 120px; height: 150px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .grid-table th, .grid-table td { border: 1px solid #e0e0e0; padding: 10px 12px; font-size: 14px; text-align: left; }
        .grid-table th { background: #f8f9fa; width: 30%; color: #1b656e; font-weight: 600; }
        
        .status-badge { padding: 6px 14px; border-radius: 15px; font-size: 13px; font-weight: bold; display: inline-block; background: #e8f4f8; color: #1b656e; }

        /* Yönetici Online Doldurma Alanı Stilleri */
        .yonetici-input {
            width: 100%;
            padding: 6px 10px;
            border: 1px solid #1b656e;
            border-radius: 4px;
            box-sizing: border-box;
            font-family: inherit;
            font-size: 13px;
            background-color: #fff;
        }
        .yonetici-input:focus {
            outline: none;
            border-color: #27ae60;
            box-shadow: 0 0 5px rgba(39, 174, 96, 0.4);
        }
        .btn-yonetici-kaydet {
            background: #1b656e;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
            transition: background 0.3s;
        }
        .btn-yonetici-kaydet:hover {
            background: #144d54;
        }

        .only-print { display: none; }

        @media print {
            .noprint, .btn-yonetici-kaydet, .kayit-bildirimi { display: none !important; }
            .only-print { display: block !important; }
            body { background: white; }
            .paper { box-shadow: none; margin: 0; width: 100%; max-width: 100%; padding: 0; }
            .yonetici-input {
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                font-weight: bold !important;
                color: #000 !important;
                appearance: none !important;
                -webkit-appearance: none !important;
            }
        }
    </style>
</head>
<body>

    <div class="noprint">
        <a href="panel.php">← Panele Dön</a>
        <div>
            <span style="margin-right: 15px;">Yönetici Paneli</span>
            <button onclick="window.print()">Yazdır / PDF Çıktısı Al</button>
        </div>
    </div>

    <?php if(isset($_GET['kaydedildi']) && $_GET['kaydedildi'] == 1): ?>
        <div class="kayit-bildirimi" style="max-width:900px; margin:15px auto -15px auto; background:#d4edda; color:#155724; padding:12px 20px; border-radius:5px; border-left:5px solid #28a745; font-weight:bold;">
            ✓ Yönetici tarafından girilen bilgiler başarıyla veritabanına kaydedildi!
        </div>
    <?php endif; ?>

    <div class="paper">
        <div class="paper-header">
            <div>
                <h2>BALIKESİR ÜNİVERSİTESİ</h2>
                <p><strong>Form Kodu / Adı:</strong> <?php echo htmlspecialchars($basvuru['form_kodu'] . ' - ' . $basvuru['form_adi']); ?></p>
                <p>
                    <strong>Takip No:</strong> <span style="font-size:15px; font-weight:bold; color:#1b656e;">#<?php echo htmlspecialchars($basvuru['takip_no'] ?: $basvuru['id']); ?></span> | 
                    <strong>Tarih:</strong> <?php echo date('d.m.Y H:i', strtotime($basvuru['kayit_tarihi'])); ?>
                </p>
            </div>
            <div>
                <?php if(!empty($basvuru['fotograf_yolu']) && file_exists($basvuru['fotograf_yolu'])): ?>
                    <div class="photo-box">
                        <img src="<?php echo htmlspecialchars($basvuru['fotograf_yolu']); ?>" alt="Vesikalık Fotoğraf">
                    </div>
                <?php else: ?>
                    <span class="status-badge">Durum: <?php echo htmlspecialchars($basvuru['durum']); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($basvuru['durum'] == 'Reddedildi' && !empty($basvuru['red_sebebi'])): ?>
            <div style="background:#fce8e6; border-left:5px solid #d93025; padding:12px 18px; border-radius:6px; margin-bottom:20px; color:#d93025;">
                <strong style="font-size:15px;"> Bu Başvuru Reddedilmiştir</strong><br>
                <strong>Red Gerekçesi:</strong> <?php echo htmlspecialchars($basvuru['red_sebebi']); ?>
            </div>
        <?php endif; ?>

        <h3 style="color:#1b656e; border-bottom:1px solid #ddd; padding-bottom:5px;">Forma Girilen Tüm Detaylar</h3>
        <table class="grid-table">
            <tbody>
                <?php 
                if (is_array($veriler)) {
                    foreach ($veriler as $anahtar => $deger) {
                        if ($anahtar == 'form_kodu' || $anahtar == 'form_adi' || $anahtar == 'id') continue;
                        
                        $etiket = ucwords(str_replace(['_', '[]'], [' ', ''], $anahtar));
                        
                        echo '<tr>';
                        echo '<th>' . htmlspecialchars($etiket) . '</th>';
                        echo '<td>';
                        if (is_array($deger)) {
                            echo htmlspecialchars(implode(', ', $deger));
                        } else {
                            if (is_string($deger) && strpos($deger, 'uploads/') === 0) {
                                echo '<a href="' . htmlspecialchars($deger) . '" target="_blank" style="color:#1b656e; font-weight:bold;">Yüklenen Dosyayı Görüntüle / İndir →</a>';
                            } else {
                                echo nl2br(htmlspecialchars($deger));
                            }
                        }
                        echo '</td>';
                        echo '</tr>';
                    }
                }
                ?>
            </tbody>
        </table>

        <?php if(!empty($basvuru['fotograf_yolu'])): ?>
            <p class="noprint"><strong>Yüklenen Fotoğraf / Ek Belge:</strong> <a href="<?php echo htmlspecialchars($basvuru['fotograf_yolu']); ?>" target="_blank">Görüntüle / İndir</a></p>
        <?php endif; ?>

        <?php if(!empty($basvuru['dekont_yolu'])): ?>
            <p class="noprint" style="background:#e8f4f8; padding:10px 15px; border-radius:5px; border-left:4px solid #1b656e;">
                <strong> Ödeme Dekontu:</strong> <a href="<?php echo htmlspecialchars($basvuru['dekont_yolu']); ?>" target="_blank" style="color:#1b656e; font-weight:bold;">Banka Dekontunu Görüntüle / İndir →</a>
            </p>

            <div class="only-print" style="margin-top:20px;">
                <h3 style="color:#1b656e; border-bottom:1px solid #ddd; padding-bottom:5px;">Ödeme Dekontu</h3>
                <?php 
                $ext = strtolower(pathinfo($basvuru['dekont_yolu'], PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])): 
                ?>
                    <img src="<?php echo htmlspecialchars($basvuru['dekont_yolu']); ?>" alt="Ödeme Dekontu" style="max-width:100%; max-height:800px; object-fit:contain; border:1px solid #ddd; border-radius:4px; display:block; margin:10px 0;">
                <?php elseif ($ext === 'pdf'): ?>
                    <iframe src="<?php echo htmlspecialchars($basvuru['dekont_yolu']); ?>" style="width:100%; height:700px; border:none;"></iframe>
                <?php else: ?>
                    <p><strong>Ödeme Dekontu Dosyası:</strong> <?php echo htmlspecialchars($basvuru['dekont_yolu']); ?></p>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <!-- FORMA ÖZEL ONLINE YÖNETİCİ DOLDURMA ALANLARI (FİZİKİ İMZA KUTULARI TAMAMEN REMOVED) -->

        <?php if ($basvuru['form_kodu'] == 'KDYS.FR.0074'): ?>
            <!-- FORM 74 YÖNETİCİ BİLGİ İŞLEM İŞLEMLERİ ONLINE DOLDURMA -->
            <form method="POST" action="detay.php?id=<?php echo $id; ?>">
                <input type="hidden" name="id" value="<?php echo $id; ?>">

                <div style="margin-top: 25px; border: 2px solid #1b656e; border-radius: 6px; padding: 15px; background: #fafafa;">
                    <h4 style="margin:0 0 10px 0; color:#1b656e; text-align:center; border-bottom:1px solid #ccc; padding-bottom:5px;">BİLGİ İŞLEM DAİRESİ İŞLEMLERİ (* Yönetici Tarafından Doldurulabilir)</h4>
                    <table class="grid-table" style="margin-bottom:0;">
                        <tr>
                            <th style="width:30%;">İşlem Tarihi *</th>
                            <td><input type="date" class="yonetici-input" name="yonetici[islem_tarihi]" value="<?php echo htmlspecialchars($veriler['islem_tarihi'] ?? $bugun); ?>"></td>
                        </tr>
                        <tr>
                            <th>Kullanıcı Şifresi *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[kullanici_sifresi]" value="<?php echo htmlspecialchars($veriler['kullanici_sifresi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>İşlemi Yapan Personel *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[islem_yapan_personel]" value="<?php echo htmlspecialchars($veriler['islem_yapan_personel'] ?? ''); ?>" placeholder="Ad Soyad"></td>
                        </tr>
                    </table>
                    <button type="submit" name="yonetici_kaydet" class="btn-yonetici-kaydet">Yönetici Bilgilerini Kaydet</button>
                </div>
            </form>

        <?php elseif ($basvuru['form_kodu'] == 'KDYS.FR.0077'): ?>
            <!-- FORM 77 KİŞİSEL WEB SÖZLEŞMESİ ONLINE BİLGİ İŞLEM KUTUSU -->
            <form method="POST" action="detay.php?id=<?php echo $id; ?>">
                <input type="hidden" name="id" value="<?php echo $id; ?>">

                <div style="margin-top: 25px; border: 2px solid #1b656e; border-radius: 6px; padding: 15px; background: #fafafa;">
                    <h4 style="margin:0 0 10px 0; color:#1b656e; text-align:center; border-bottom:1px solid #ccc; padding-bottom:5px;">BİLGİ İŞLEM DAİRESİ İŞLEMLERİ (* Yönetici Tarafından Doldurulabilir)</h4>
                    <table class="grid-table" style="margin-bottom:0;">
                        <tr>
                            <th style="width:30%;">İşlem Tarihi *</th>
                            <td><input type="date" class="yonetici-input" name="yonetici[islem_tarihi]" value="<?php echo htmlspecialchars($veriler['islem_tarihi'] ?? $bugun); ?>"></td>
                        </tr>
                        <tr>
                            <th>Web Alanı Adı *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[web_alani_adi]" value="<?php echo htmlspecialchars($veriler['web_alani_adi'] ?? ''); ?>" placeholder="kullanici.baun.edu.tr"></td>
                        </tr>
                        <tr>
                            <th>Veri Tabanı Kullanılacak mı? *</th>
                            <td>
                                <select class="yonetici-input" name="yonetici[veritabani_kullanilacak_mi]">
                                    <option value="Evet" <?php echo ($veriler['veritabani_kullanilacak_mi'] ?? '') == 'Evet' ? 'selected' : ''; ?>>Evet</option>
                                    <option value="Hayır" <?php echo ($veriler['veritabani_kullanilacak_mi'] ?? '') == 'Hayır' ? 'selected' : ''; ?>>Hayır</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Sayfanın Geçerlilik Süresi *</th>
                            <td>
                                <select class="yonetici-input" name="yonetici[sayfa_gecerlilik]" style="width:30%; display:inline-block;">
                                    <option value="Süresiz" <?php echo ($veriler['sayfa_gecerlilik'] ?? '') == 'Süresiz' ? 'selected' : ''; ?>>Süresiz</option>
                                    <option value="Süreli" <?php echo ($veriler['sayfa_gecerlilik'] ?? '') == 'Süreli' ? 'selected' : ''; ?>>Süreli</option>
                                </select>
                                <input type="date" class="yonetici-input" name="yonetici[sayfa_gecerlilik_tarihi]" value="<?php echo htmlspecialchars($veriler['sayfa_gecerlilik_tarihi'] ?? ''); ?>" style="width:65%; display:inline-block;">
                            </td>
                        </tr>
                        <tr>
                            <th>Kullanıcı Adı *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[kullanici_adi]" value="<?php echo htmlspecialchars($veriler['kullanici_adi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>Kullanıcı Şifresi *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[kullanici_sifresi]" value="<?php echo htmlspecialchars($veriler['kullanici_sifresi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>DNS Tanımı *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[dns_tanimi]" value="<?php echo htmlspecialchars($veriler['dns_tanimi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>İşlemi Yapan Personel *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[islem_yapan_personel]" value="<?php echo htmlspecialchars($veriler['islem_yapan_personel'] ?? ''); ?>" placeholder="Ad Soyad"></td>
                        </tr>
                    </table>
                    <button type="submit" name="yonetici_kaydet" class="btn-yonetici-kaydet">Yönetici Bilgilerini Kaydet</button>
                </div>
            </form>

        <?php elseif ($basvuru['form_kodu'] == 'KDYS.FR.0078'): ?>
            <!-- FORM 78 STATİK IP SÖZLEŞMESİ ONLINE BİLGİ İŞLEM KUTUSU -->
            <form method="POST" action="detay.php?id=<?php echo $id; ?>">
                <input type="hidden" name="id" value="<?php echo $id; ?>">

                <div style="margin-top: 25px; border: 2px solid #1b656e; border-radius: 6px; padding: 15px; background: #fafafa;">
                    <h4 style="margin:0 0 10px 0; color:#1b656e; text-align:center; border-bottom:1px solid #ccc; padding-bottom:5px;">BİLGİ İŞLEM DAİRESİ İŞLEMLERİ (* Yönetici Tarafından Doldurulabilir)</h4>
                    <table class="grid-table" style="margin-bottom:0;">
                        <tr>
                            <th style="width:30%;">İşlem Tarihi *</th>
                            <td><input type="date" class="yonetici-input" name="yonetici[islem_tarihi]" value="<?php echo htmlspecialchars($veriler['islem_tarihi'] ?? $bugun); ?>"></td>
                        </tr>
                        <tr>
                            <th>Statik IP *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[statik_ip]" value="<?php echo htmlspecialchars($veriler['statik_ip'] ?? ''); ?>" placeholder="192.168.x.x"></td>
                        </tr>
                        <tr>
                            <th>IP Geçerlilik Süresi *</th>
                            <td>
                                <select class="yonetici-input" name="yonetici[ip_gecerlilik]" style="width:30%; display:inline-block;">
                                    <option value="Süresiz" <?php echo ($veriler['ip_gecerlilik'] ?? '') == 'Süresiz' ? 'selected' : ''; ?>>Süresiz</option>
                                    <option value="Süreli" <?php echo ($veriler['ip_gecerlilik'] ?? '') == 'Süreli' ? 'selected' : ''; ?>>Süreli</option>
                                </select>
                                <input type="date" class="yonetici-input" name="yonetici[ip_gecerlilik_tarihi]" value="<?php echo htmlspecialchars($veriler['ip_gecerlilik_tarihi'] ?? ''); ?>" style="width:65%; display:inline-block;">
                            </td>
                        </tr>
                        <tr>
                            <th>DNS Tanımı (İstenirse)</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[dns_tanimi]" value="<?php echo htmlspecialchars($veriler['dns_tanimi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>İşlemi Yapan Personel *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[islem_yapan_personel]" value="<?php echo htmlspecialchars($veriler['islem_yapan_personel'] ?? ''); ?>" placeholder="Ad Soyad"></td>
                        </tr>
                    </table>
                    <button type="submit" name="yonetici_kaydet" class="btn-yonetici-kaydet">Yönetici Bilgilerini Kaydet</button>
                </div>
            </form>

        <?php elseif ($basvuru['form_kodu'] == 'KDYS.FR.0079'): ?>
            <!-- FORM 79 KURUMSAL WEB ADI SÖZLEŞMESİ ONLINE BİLGİ İŞLEM KUTUSU -->
            <form method="POST" action="detay.php?id=<?php echo $id; ?>">
                <input type="hidden" name="id" value="<?php echo $id; ?>">

                <div style="margin-top: 25px; border: 2px solid #1b656e; border-radius: 6px; padding: 15px; background: #fafafa;">
                    <h4 style="margin:0 0 10px 0; color:#1b656e; text-align:center; border-bottom:1px solid #ccc; padding-bottom:5px;">BİLGİ İŞLEM DAİRESİ İŞLEMLERİ (* Yönetici Tarafından Doldurulabilir)</h4>
                    <table class="grid-table" style="margin-bottom:0;">
                        <tr>
                            <th style="width:30%;">İşlem Tarihi *</th>
                            <td><input type="date" class="yonetici-input" name="yonetici[islem_tarihi]" value="<?php echo htmlspecialchars($veriler['islem_tarihi'] ?? $bugun); ?>"></td>
                        </tr>
                        <tr>
                            <th>Web Alanı Adı *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[web_alani_adi]" value="<?php echo htmlspecialchars($veriler['web_alani_adi'] ?? ''); ?>" placeholder="birimadi.baun.edu.tr"></td>
                        </tr>
                        <tr>
                            <th>Veri Tabanı Kullanılacak mı? *</th>
                            <td>
                                <select class="yonetici-input" name="yonetici[veritabani_kullanilacak_mi]">
                                    <option value="Evet" <?php echo ($veriler['veritabani_kullanilacak_mi'] ?? '') == 'Evet' ? 'selected' : ''; ?>>Evet</option>
                                    <option value="Hayır" <?php echo ($veriler['veritabani_kullanilacak_mi'] ?? '') == 'Hayır' ? 'selected' : ''; ?>>Hayır</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Sayfanın Geçerlilik Süresi *</th>
                            <td>
                                <select class="yonetici-input" name="yonetici[sayfa_gecerlilik]" style="width:30%; display:inline-block;">
                                    <option value="Süresiz" <?php echo ($veriler['sayfa_gecerlilik'] ?? '') == 'Süresiz' ? 'selected' : ''; ?>>Süresiz</option>
                                    <option value="Süreli" <?php echo ($veriler['sayfa_gecerlilik'] ?? '') == 'Süreli' ? 'selected' : ''; ?>>Süreli</option>
                                </select>
                                <input type="date" class="yonetici-input" name="yonetici[sayfa_gecerlilik_tarihi]" value="<?php echo htmlspecialchars($veriler['sayfa_gecerlilik_tarihi'] ?? ''); ?>" style="width:65%; display:inline-block;">
                            </td>
                        </tr>
                        <tr>
                            <th>Kullanıcı Adı *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[kullanici_adi]" value="<?php echo htmlspecialchars($veriler['kullanici_adi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>Kullanıcı Şifresi *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[kullanici_sifresi]" value="<?php echo htmlspecialchars($veriler['kullanici_sifresi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>DNS Tanımı *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[dns_tanimi]" value="<?php echo htmlspecialchars($veriler['dns_tanimi'] ?? ''); ?>"></td>
                        </tr>
                        <tr>
                            <th>İşlemi Yapan Personel *</th>
                            <td><input type="text" class="yonetici-input" name="yonetici[islem_yapan_personel]" value="<?php echo htmlspecialchars($veriler['islem_yapan_personel'] ?? ''); ?>" placeholder="Ad Soyad"></td>
                        </tr>
                    </table>
                    <button type="submit" name="yonetici_kaydet" class="btn-yonetici-kaydet">Yönetici Bilgilerini Kaydet</button>
                </div>
            </form>

        <?php elseif ($basvuru['form_kodu'] == 'KDYS.FR.0080'): ?>
            <!-- FORM 80 MERNİS TAAHHÜTNAMESİ ONLINE BİRİM YETKİLİSİ DOLDURMA -->
            <form method="POST" action="detay.php?id=<?php echo $id; ?>">
                <input type="hidden" name="id" value="<?php echo $id; ?>">

                <div style="margin-top: 15px; border: 1px solid #000;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                        <tr style="background:#f5f5f5; font-weight:bold; text-align:center;">
                            <td style="width: 50%; border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">Personel Bilgisi</td>
                            <td style="width: 50%; border-bottom: 1px solid #000; padding: 8px;">Birim Yetkilisi (Yönetici Doldurabilir)</td>
                        </tr>
                        <tr>
                            <td style="width: 50%; border-right: 1px solid #000; padding: 12px; vertical-align: top;">
                                <p style="margin: 4px 0;"><strong>Adı Soyadı:</strong> <?php echo htmlspecialchars($veriler['personel_ad_soyad'] ?? $basvuru['ad_soyad']); ?></p>
                                <p style="margin: 4px 0;"><strong>Kurum Sicili, Unvanı:</strong> <?php echo htmlspecialchars($veriler['personel_sicil_unvan'] ?? '-'); ?></p>
                            </td>
                            <td style="width: 50%; padding: 12px; vertical-align: top;">
                                <p style="margin: 4px 0;"><strong>Adı Soyadı:</strong> <input type="text" class="yonetici-input" name="yonetici[yetkili_ad_soyad]" value="<?php echo htmlspecialchars($veriler['yetkili_ad_soyad'] ?? ''); ?>" placeholder="Ad Soyad"></p>
                                <p style="margin: 4px 0;"><strong>Kurum Sicili, Unvanı:</strong> <input type="text" class="yonetici-input" name="yonetici[yetkili_sicil_unvan]" value="<?php echo htmlspecialchars($veriler['yetkili_sicil_unvan'] ?? ''); ?>" placeholder="Sicil No / Unvan"></p>
                            </td>
                        </tr>
                        <tr style="background:#f5f5f5; font-weight:bold;">
                            <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 6px;">Personel</td>
                            <td style="border-top: 1px solid #000; padding: 6px;">Birim Yetkilisi</td>
                        </tr>
                        <tr>
                            <td style="border-right: 1px solid #000; border-top: 1px solid #000; padding: 8px;">
                                <p style="margin: 2px 0;"><strong>T.C. Kimlik No:</strong> <?php echo htmlspecialchars($veriler['personel_tc_no'] ?? '-'); ?></p>
                                <p style="margin: 2px 0;"><strong>E-Mail:</strong> <?php echo htmlspecialchars($veriler['personel_eposta'] ?? '-'); ?></p>
                            </td>
                            <td style="border-top: 1px solid #000; padding: 8px;">
                                <p style="margin: 2px 0;"><strong>T.C. Kimlik No:</strong> <input type="text" class="yonetici-input" name="yonetici[yetkili_tc_no]" value="<?php echo htmlspecialchars($veriler['yetkili_tc_no'] ?? ''); ?>" placeholder="TC Kimlik No"></p>
                                <p style="margin: 2px 0;"><strong>E-Mail:</strong> <input type="text" class="yonetici-input" name="yonetici[yetkili_eposta]" value="<?php echo htmlspecialchars($veriler['yetkili_eposta'] ?? ''); ?>" placeholder="ornek@balikesir.edu.tr"></p>
                            </td>
                        </tr>
                    </table>
                </div>
                <button type="submit" name="yonetici_kaydet" class="btn-yonetici-kaydet">Birim Yetkilisi Bilgilerini Kaydet</button>
            </form>

        <?php endif; ?>
    </div>

    <?php if (isset($_GET['print']) && $_GET['print'] == 1): ?>
        <script>
            window.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    window.print();
                }, 300);
            });
        </script>
    <?php endif; ?>
</body>
</html>