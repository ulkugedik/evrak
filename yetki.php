<?php
session_start();
require_once 'baglan.php';

// Güvenlik Kontrolü: Sadece Süper Admin Erişebilir!
if (!isset($_SESSION['admin_giris']) || $_SESSION['admin_giris'] !== true || ($_SESSION['admin_rol'] ?? '') !== 'superadmin') {
    header("Location: panel.php");
    exit;
}

$mesaj = "";
$hata = "";

// POST İşlemi 1: Yeni Form Ekleme
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['yeni_form_ekle'])) {
    $f_kodu     = trim($_POST['form_kodu'] ?? '');
    $f_adi      = trim($_POST['form_adi'] ?? '');
    $f_kategori = trim($_POST['kategori'] ?? 'Diğer Formlar');
    $f_aciklama = trim($_POST['aciklama'] ?? '');

    if (!empty($f_kodu) && !empty($f_adi)) {
        $chk = $db->prepare("SELECT COUNT(*) FROM formlar WHERE form_kodu = :fkodu");
        $chk->execute([':fkodu' => $f_kodu]);
        if ($chk->fetchColumn() > 0) {
            $hata = "Bu form kodu ($f_kodu) zaten kullanılmaktadır!";
        } else {
            $alanlar = [];
            if (isset($_POST['alan_adi']) && is_array($_POST['alan_adi'])) {
                foreach ($_POST['alan_adi'] as $idx => $adi) {
                    $adi = trim($adi);
                    if ($adi !== '') {
                        $tip = $_POST['alan_tipi'][$idx] ?? 'text';
                        $secenekler_str = trim($_POST['alan_secenekler'][$idx] ?? '');
                        $secenekler = $secenekler_str !== '' ? array_map('trim', explode(',', $secenekler_str)) : [];
                        $zorunlu = isset($_POST['alan_zorunlu'][$idx]) && $_POST['alan_zorunlu'][$idx] == '1';

                        $alanlar[] = [
                            'etiket' => $adi,
                            'tip' => $tip,
                            'secenekler' => $secenekler,
                            'zorunlu' => $zorunlu
                        ];
                    }
                }
            }

            $ins = $db->prepare("INSERT INTO formlar (form_kodu, form_adi, kategori, aciklama, alanlar, durum) VALUES (:fkodu, :fadi, :kat, :acik, :alan, 'aktif')");
            $ins->execute([
                ':fkodu' => $f_kodu,
                ':fadi'  => $f_adi,
                ':kat'   => $f_kategori,
                ':acik'  => $f_aciklama,
                ':alan'  => json_encode($alanlar, JSON_UNESCAPED_UNICODE)
            ]);

            // Tüm normal adminlere otomatik olarak izin ekle
            $admins = $db->query("SELECT id FROM yoneticiler WHERE rol = 'admin'")->fetchAll();
            $insPerm = $db->prepare("INSERT IGNORE INTO yonetici_izinleri (yonetici_id, form_kodu) VALUES (:yid, :fkodu)");
            foreach ($admins as $adm) {
                $insPerm->execute([':yid' => $adm['id'], ':fkodu' => $f_kodu]);
            }

            $mesaj = "Yeni form ($f_kodu - $f_adi) başarıyla sisteme eklendi ve tüm yöneticilerin izinlerine dahil edildi.";
        }
    } else {
        $hata = "Lütfen Form Kodu ve Form Adı alanlarını eksiksiz doldurunuz!";
    }
}

// GET İşlemi: Form Durum Değiştirme / Silme
if (isset($_GET['form_islem']) && isset($_GET['kodu'])) {
    $f_kodu = trim($_GET['kodu']);
    $f_islem = $_GET['form_islem'];

    if ($f_islem === 'durum_degistir') {
        $st = $db->prepare("UPDATE formlar SET durum = IF(durum='aktif', 'pasif', 'aktif') WHERE form_kodu = :fk");
        $st->execute([':fk' => $f_kodu]);
        $mesaj = "Form ($f_kodu) durumu başarıyla güncellendi.";
    } elseif ($f_islem === 'sil') {
        $st = $db->prepare("DELETE FROM formlar WHERE form_kodu = :fk");
        $st->execute([':fk' => $f_kodu]);
        $mesaj = "Form ($f_kodu) sistemden başarıyla silindi.";
    }
}

// POST İşlemi 2: Yeni Admin Ekleme
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['yeni_admin_ekle'])) {
    $y_kadi   = trim($_POST['kullanici_adi'] ?? '');
    $y_sifre  = trim($_POST['sifre'] ?? '');
    $y_adsoyad= trim($_POST['ad_soyad'] ?? '');

    if (!empty($y_kadi) && !empty($y_sifre) && !empty($y_adsoyad)) {
        $chk = $db->prepare("SELECT COUNT(*) FROM yoneticiler WHERE kullanici_adi = :kadi");
        $chk->execute([':kadi' => $y_kadi]);
        
        if ($chk->fetchColumn() > 0) {
            $hata = "Bu kullanıcı adı ($y_kadi) zaten kullanılmaktadır!";
        } else {
            $ins = $db->prepare("INSERT INTO yoneticiler (kullanici_adi, sifre, ad_soyad, rol) VALUES (:kadi, :sifre, :adsoyad, 'admin')");
            $hashed = password_hash($y_sifre, PASSWORD_DEFAULT);
            $ins->execute([':kadi' => $y_kadi, ':sifre' => $hashed, ':adsoyad' => $y_adsoyad]);
            
            // Yeni admine tüm mevcut formların izinlerini ver
            $yeni_id = $db->lastInsertId();
            $tumFormKodlari = $db->query("SELECT form_kodu FROM formlar")->fetchAll(PDO::FETCH_COLUMN);
            $insPerm = $db->prepare("INSERT IGNORE INTO yonetici_izinleri (yonetici_id, form_kodu) VALUES (:yid, :fkodu)");
            foreach ($tumFormKodlari as $fk) {
                $insPerm->execute([':yid' => $yeni_id, ':fkodu' => $fk]);
            }

            $mesaj = "Yeni yönetici ($y_adsoyad - $y_kadi) başarıyla eklendi.";
        }
    } else {
        $hata = "Lütfen tüm yönetici bilgilerini eksiksiz giriniz!";
    }
}

// POST İşlemi 3: İzinleri Kaydetme
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['izinleri_kaydet'])) {
    $yonetici_id = intval($_POST['yonetici_id']);
    $secilen_formlar = $_POST['izinler'] ?? [];

    try {
        $delStmt = $db->prepare("DELETE FROM yonetici_izinleri WHERE yonetici_id = :yid");
        $delStmt->execute([':yid' => $yonetici_id]);

        $insStmt = $db->prepare("INSERT INTO yonetici_izinleri (yonetici_id, form_kodu) VALUES (:yid, :fkodu)");
        foreach ($secilen_formlar as $fkodu) {
            $insStmt->execute([':yid' => $yonetici_id, ':fkodu' => $fkodu]);
        }
        $mesaj = "Görev izinleri başarıyla güncellendi.";
    } catch (PDOException $e) {
        $hata = "Hata oluştu: " . $e->getMessage();
    }
}

// Tüm Formları Veritabanından Getir
$formRows = $db->query("SELECT * FROM formlar ORDER BY kategori ASC, form_kodu ASC")->fetchAll();
$tum_formlar = [];
foreach ($formRows as $fr) {
    $tum_formlar[$fr['form_kodu']] = $fr['form_adi'] . ($fr['durum'] == 'pasif' ? ' (Pasif)' : '');
}

// Normal Yöneticileri Getir (rol = admin)
$adminler = $db->query("SELECT * FROM yoneticiler WHERE rol = 'admin' ORDER BY kullanici_adi ASC")->fetchAll();

// Her Yöneticinin Mevcut İzinleri
$mevcut_izinler = [];
$izinRows = $db->query("SELECT * FROM yonetici_izinleri")->fetchAll();
foreach ($izinRows as $row) {
    $mevcut_izinler[$row['yonetici_id']][] = $row['form_kodu'];
}

// İşlem Günlüğü (Loglar)
$loglar = $db->query("SELECT * FROM islem_loglari ORDER BY tarih DESC LIMIT 50")->fetchAll();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin İzin & Form Yönetim Paneli - BAÜN</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; color: #333; }
        .header { background-color: #1b656e; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header h1 { font-size: 20px; margin: 0; display: flex; align-items: center; gap: 10px; }
        .header-btn { background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 5px; text-decoration: none; font-size: 13px; font-weight: bold; transition: 0.3s; }
        .header-btn:hover { background: rgba(255,255,255,0.3); }

        .container { max-width: 1100px; margin: 30px auto; padding: 0 20px; }
        
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); padding: 25px; margin-bottom: 25px; }
        .card h2 { margin-top: 0; color: #1b656e; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; background: #fafafa; padding: 15px; border-radius: 6px; border: 1px solid #eee; }
        .form-grid label { display: flex; align-items: center; gap: 10px; font-size: 13.5px; cursor: pointer; padding: 6px; border-radius: 4px; transition: background 0.2s; }
        .form-grid label:hover { background: #e8f4f8; }
        .form-grid input[type="checkbox"] { width: 18px; height: 18px; accent-color: #1b656e; cursor: pointer; }

        .form-satir { display: flex; gap: 15px; margin-bottom: 15px; }
        .form-satir .form-grup { flex: 1; }
        .form-grup label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 13px; color: #555; }
        .form-grup input, .form-grup select, .form-grup textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; font-family: inherit; }

        .btn-kaydet { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
        .btn-kaydet:hover { background: #219150; }
        
        .btn-sec-hepsi { background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; }
        .btn-sec-hepsi:hover { background: #2980b9; }

        .alert-success { background: #d4edda; color: #155724; padding: 12px 20px; border-radius: 5px; border-left: 5px solid #28a745; margin-bottom: 20px; font-weight: bold; }
        .alert-danger { background: #fce8e6; color: #d93025; padding: 12px 20px; border-radius: 5px; border-left: 5px solid #d93025; margin-bottom: 20px; font-weight: bold; }

        table.log-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.log-table th { background: #e8f4f8; color: #1b656e; padding: 10px; text-align: left; }
        table.log-table td { padding: 10px; border-bottom: 1px solid #eee; }

        /* Dinamik Form Ekleme Tablo Stilleri */
        .alan-ekle-tablo { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
        .alan-ekle-tablo th { background: #f0f4f8; color: #1b656e; padding: 8px; text-align: left; border: 1px solid #ddd; }
        .alan-ekle-tablo td { padding: 8px; border: 1px solid #ddd; background: #fff; }
        .btn-alan-sil { background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; }
        .btn-alan-ekle { background: #3498db; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }

        .badge-aktif { background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; }
        .badge-pasif { background: #e2e3e5; color: #383d41; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; }
        .btn-islem-sm { padding: 4px 8px; border-radius: 4px; font-size: 11.5px; font-weight: bold; text-decoration: none; display: inline-block; margin-right: 5px; }
    </style>
</head>
<body>

    <div class="header">
        <h1>
            <img src="https://baunwebapi.balikesir.edu.tr/uploads/1729083231270.png" height="35" style="background:white; border-radius:4px; padding:2px;">
            BAÜN Form İşlem Merkezi - Yönetici & Form Yapılandırması
        </h1>
        <div>
            <a href="panel.php" class="header-btn">← Panele Dön</a>
            <a href="cikis.php" class="header-btn" style="background:#d93025; margin-left:10px;">Güvenli Çıkış</a>
        </div>
    </div>

    <div class="container">
        <?php if(!empty($mesaj)): ?>
            <div class="alert-success">✓ <?php echo htmlspecialchars($mesaj); ?></div>
        <?php endif; ?>
        <?php if(!empty($hata)): ?>
            <div class="alert-danger">⚠️ <?php echo htmlspecialchars($hata); ?></div>
        <?php endif; ?>

        <!-- YENİ FORM OLUŞTURMA KARTI -->
        <div class="card" style="border-top: 4px solid #1b656e;">
            <h2>📝 Yeni Form Oluştur (Dinamik Form Builder)</h2>
            <p style="font-size:13px; color:#666; margin-top:-5px;">Süper Admin olarak sisteme yeni bir başvuru formu ekleyebilir ve forma ait dinamik alanlar tanımlayabilirsiniz.</p>
            
            <form method="POST">
                <div class="form-satir">
                    <div class="form-grup">
                        <label>Form Kodu (Benzersiz Olmalıdır)</label>
                        <input type="text" name="form_kodu" placeholder="Örn: KDYS.FR.0085 veya F-56" required autocomplete="off">
                    </div>
                    <div class="form-grup">
                        <label>Form Adı</label>
                        <input type="text" name="form_adi" placeholder="Örn: Araştırma Projesi Destek Talep Formu" required>
                    </div>
                </div>

                <div class="form-satir">
                    <div class="form-grup">
                        <label>Kategori / Grup</label>
                        <input type="text" name="kategori" list="kategori_listesi" placeholder="Örn: Bilgi İşlem Daire Başkanlığı Formları" value="Bilgi İşlem Daire Başkanlığı Formları" required>
                        <datalist id="kategori_listesi">
                            <option value="Akıllı Kart Formları">
                            <option value="Bilgi İşlem Daire Başkanlığı Formları">
                            <option value="Genel Talep Formları">
                            <option value="Öğrenci İşleri Formları">
                            <option value="Diğer Formlar">
                        </datalist>
                    </div>
                </div>

                <div class="form-grup">
                    <label>Form Yönergesi / Açıklaması (Opsiyonel)</label>
                    <textarea name="aciklama" rows="2" placeholder="Form hakkında kullanıcılara gösterilecek bilgilendirme metni..."></textarea>
                </div>

                <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">

                <h3>📋 Forma Özel Dinamik Alanlar (Giriş Kutuları)</h3>
                <p style="font-size:12.5px; color:#777; margin-bottom:10px;">Standart olarak Ad-Soyad, TC Kimlik No, Telefon, E-Posta ve Birim alanları otomatik olarak eklenmektedir. Aşağıya ekstra alanlar ekleyebilirsiniz:</p>

                <table class="alan-ekle-tablo" id="dynamic_fields_table">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Alan Adı / Etiket</th>
                            <th style="width: 25%;">Veri Tipi</th>
                            <th style="width: 30%;">Seçenekler (Dropdown ise virgülle ayırın)</th>
                            <th style="width: 10%; text-align:center;">Zorunlu</th>
                            <th style="width: 5%;">İşlem</th>
                        </tr>
                    </thead>
                    <tbody id="alanlar_body">
                        <tr>
                            <td><input type="text" name="alan_adi[]" placeholder="Örn: Talep Gerekçesi" style="width:100%; padding:6px; box-sizing:border-box;"></td>
                            <td>
                                <select name="alan_tipi[]" style="width:100%; padding:6px; box-sizing:border-box;">
                                    <option value="text">Metin Kutusu (Kısa)</option>
                                    <option value="textarea">Uzun Metin (Açıklama)</option>
                                    <option value="select">Seçenek Listesi (Dropdown)</option>
                                    <option value="date">Tarih Seçici</option>
                                    <option value="file">Dosya / Dekont Yükleme</option>
                                </select>
                            </td>
                            <td><input type="text" name="alan_secenekler[]" placeholder="Secenek 1, Secenek 2..." style="width:100%; padding:6px; box-sizing:border-box;"></td>
                            <td style="text-align:center;">
                                <input type="checkbox" name="alan_zorunlu[0]" value="1" checked style="width:18px; height:18px;">
                            </td>
                            <td style="text-align:center;">
                                <button type="button" class="btn-alan-sil" onclick="satirSil(this)">X</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <button type="button" class="btn-alan-ekle" onclick="alanEkle()">➕ Yeni Alan Satırı Ekle</button>
                <br><br>
                <button type="submit" name="yeni_form_ekle" class="btn-kaydet" style="background:#1b656e; padding:12px 30px; font-size:15px;">✓ Formu Oluştur ve Yayınla</button>
            </form>
        </div>

        <!-- MAVİ TABLO: SİSTEMDEKİ FORMLARIN LİSTESİ -->
        <div class="card">
            <h2>⚙️ Sistemde Kayıtlı Formlar (<?php echo count($formRows); ?> Adet)</h2>
            <table class="log-table">
                <thead>
                    <tr>
                        <th>Form Kodu</th>
                        <th>Form Adı</th>
                        <th>Kategori</th>
                        <th>Özel Alan Sayısı</th>
                        <th>Durum</th>
                        <th style="text-align:right;">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($formRows as $fr): ?>
                        <?php 
                            $alanlar_arr = json_decode($fr['alanlar'] ?? '[]', true) ?: [];
                        ?>
                        <tr>
                            <td><strong style="color:#1b656e;"><?php echo htmlspecialchars($fr['form_kodu']); ?></strong></td>
                            <td><?php echo htmlspecialchars($fr['form_adi']); ?></td>
                            <td><span style="color:#666; font-size:12px; background:#f0f0f0; padding:3px 8px; border-radius:4px;"><?php echo htmlspecialchars($fr['kategori']); ?></span></td>
                            <td><?php echo count($alanlar_arr); ?> Alan</td>
                            <td>
                                <?php if($fr['durum'] == 'aktif'): ?>
                                    <span class="badge-aktif">Aktif</span>
                                <?php else: ?>
                                    <span class="badge-pasif">Pasif</span>
                                <?php endif; ?>
                            </td>
                            <td style="text-align:right;">
                                <a href="yetki.php?form_islem=durum_degistir&kodu=<?php echo urlencode($fr['form_kodu']); ?>" class="btn-islem-sm" style="background:#3498db; color:white;">
                                    <?php echo $fr['durum'] == 'aktif' ? 'Pasife Al' : 'Aktif Et'; ?>
                                </a>
                                <a href="yetki.php?form_islem=sil&kodu=<?php echo urlencode($fr['form_kodu']); ?>" class="btn-islem-sm" style="background:#e74c3c; color:white;" onclick="return confirm('Bu formu silmek istediğinize emin misiniz?');">
                                    Sil
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- YENİ ADMİN EKLEME KARTI -->
        <div class="card">
            <h2>👤➕ Yeni Yönetici Hesabı Ekle</h2>
            <form method="POST">
                <div class="form-satir">
                    <div class="form-grup">
                        <label>Kullanıcı Adı</label>
                        <input type="text" name="kullanici_adi" placeholder="Örn: admin3" required autocomplete="off">
                    </div>
                    <div class="form-grup">
                        <label>Şifre</label>
                        <input type="text" name="sifre" value="123456" required>
                    </div>
                    <div class="form-grup">
                        <label>Adı Soyadı</label>
                        <input type="text" name="ad_soyad" placeholder="Örn: Ahmet Yılmaz" required>
                    </div>
                </div>
                <button type="submit" name="yeni_admin_ekle" class="btn-kaydet" style="background:#1b656e;">Yöneticiyi Ekle</button>
            </form>
        </div>

        <!-- YÖNETİCİ İZİN / GÖREV ATAMA KARTLARI -->
        <div class="card" style="background:#f8fbfd; border:1px solid #d0e4eb;">
            <h2 style="border-bottom:none; margin:0;">📋 Yönetici Görev & Form İzinleri</h2>
            <p style="font-size:13px; color:#555; margin-top:5px;">Aşağıdan tüm yöneticilerin inceleyebileceği formları seçip kaydedebilirsiniz.</p>
        </div>

        <?php foreach ($adminler as $admin): ?>
            <?php 
                $aid = $admin['id'];
                $atanmis_formlar = $mevcut_izinler[$aid] ?? [];
            ?>
            <div class="card">
                <h2>
                    <span>👤 <?php echo htmlspecialchars($admin['ad_soyad']); ?> (Kullanıcı Adı: <strong><?php echo htmlspecialchars($admin['kullanici_adi']); ?></strong>)</span>
                    <button type="button" class="btn-sec-hepsi" onclick="tumunuSec('form_grid_<?php echo $aid; ?>')">Tümünü Seç / Kaldır</button>
                </h2>
                
                <form method="POST">
                    <input type="hidden" name="yonetici_id" value="<?php echo $aid; ?>">

                    <div class="form-grid" id="form_grid_<?php echo $aid; ?>">
                        <?php foreach ($tum_formlar as $kodu => $adi): ?>
                            <?php $checked = in_array($kodu, $atanmis_formlar) ? 'checked' : ''; ?>
                            <label>
                                <input type="checkbox" name="izinler[]" value="<?php echo $kodu; ?>" <?php echo $checked; ?>>
                                <strong><?php echo htmlspecialchars($kodu); ?></strong> - <?php echo htmlspecialchars($adi); ?>
                            </label>
                        <?php endforeach; ?>
                    </div>

                    <button type="submit" name="izinleri_kaydet" class="btn-kaydet">Görev ve İzinleri Kaydet</button>
                </form>
            </div>
        <?php endforeach; ?>

        <!-- İŞLEM GÜNLÜĞÜ (AUDIT LOG) KARTI -->
        <div class="card">
            <h2>📜 Yöneticilerin İşlem Günlüğü (Audit Log)</h2>
            <p style="font-size:13px; color:#666;">Yöneticilerin başvurular üzerinde yaptığı tüm durum güncellemeleri ve red sebepleri aşağıda kronolojik olarak listelenmektedir.</p>
            
            <?php if (count($loglar) > 0): ?>
                <table class="log-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>İşlemi Yapan Yönetici</th>
                            <th>Takip No</th>
                            <th>Yapılan İşlem ve Detayı</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($loglar as $l): ?>
                            <tr>
                                <td><?php echo date('d.m.Y H:i:s', strtotime($l['tarih'])); ?></td>
                                <td><strong><?php echo htmlspecialchars($l['yonetici_adi']); ?></strong></td>
                                <td><span style="color:#1b656e; font-weight:bold;">#<?php echo htmlspecialchars($l['takip_no']); ?></span></td>
                                <td><?php echo htmlspecialchars($l['islem_detayi']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p style="color:#999; text-align:center; padding:20px;">Henüz kaydedilmiş bir yönetici işlemi bulunmamaktadır.</p>
            <?php endif; ?>
        </div>
    </div>

    <script>
        var satirIndex = 1;
        function alanEkle() {
            var tbody = document.getElementById('alanlar_body');
            var tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" name="alan_adi[]" placeholder="Alan Adı" style="width:100%; padding:6px; box-sizing:border-box;"></td>
                <td>
                    <select name="alan_tipi[]" style="width:100%; padding:6px; box-sizing:border-box;">
                        <option value="text">Metin Kutusu (Kısa)</option>
                        <option value="textarea">Uzun Metin (Açıklama)</option>
                        <option value="select">Seçenek Listesi (Dropdown)</option>
                        <option value="date">Tarih Seçici</option>
                        <option value="file">Dosya / Dekont Yükleme</option>
                    </select>
                </td>
                <td><input type="text" name="alan_secenekler[]" placeholder="Secenek 1, Secenek 2..." style="width:100%; padding:6px; box-sizing:border-box;"></td>
                <td style="text-align:center;">
                    <input type="checkbox" name="alan_zorunlu[${satirIndex}]" value="1" checked style="width:18px; height:18px;">
                </td>
                <td style="text-align:center;">
                    <button type="button" class="btn-alan-sil" onclick="satirSil(this)">X</button>
                </td>
            `;
            tbody.appendChild(tr);
            satirIndex++;
        }

        function satirSil(btn) {
            var tr = btn.closest('tr');
            if (document.querySelectorAll('#alanlar_body tr').length > 1) {
                tr.remove();
            } else {
                alert('En az bir satır bulunmalıdır.');
            }
        }

        function tumunuSec(gridId) {
            var checkboxes = document.querySelectorAll('#' + gridId + ' input[type="checkbox"]');
            var tumuSecili = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !tumuSecili);
        }
    </script>
</body>
</html>

