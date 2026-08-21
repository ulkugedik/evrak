<?php
session_start();
require_once 'baglan.php';

// Güvenlik: Giriş yapmayan erişemez
if (!isset($_SESSION['admin_giris']) || $_SESSION['admin_giris'] !== true) {
    header("Location: login.php");
    exit;
}

$admin_id  = $_SESSION['admin_id'] ?? 0;
$admin_rol = $_SESSION['admin_rol'] ?? 'admin';
$admin_ad  = $_SESSION['admin_ad_soyad'] ?? $_SESSION['admin_kullanici'] ?? 'Admin';

// Durum Güncelleme Ve Red Sebebi Kaydetme
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['islem']) && $_POST['islem'] == 'durum_guncelle') {
    $id         = intval($_POST['id']);
    $yeni_durum = $_POST['yeni_durum'] ?? 'Beklemede';
    $red_sebebi = trim($_POST['red_sebebi'] ?? '');

    $basvuruCheck = $db->prepare("SELECT * FROM basvurular WHERE id = :id");
    $basvuruCheck->execute([':id' => $id]);
    $bRow = $basvuruCheck->fetch();

    if ($bRow) {
        $izinli = true;
        if ($admin_rol !== 'superadmin') {
            $permStmt = $db->prepare("SELECT COUNT(*) FROM yonetici_izinleri WHERE yonetici_id = :yid AND form_kodu = :fkodu");
            $permStmt->execute([':yid' => $admin_id, ':fkodu' => $bRow['form_kodu']]);
            if ($permStmt->fetchColumn() == 0) {
                $izinli = false;
            }
        }

        if ($izinli) {
            $guncelle = $db->prepare("UPDATE basvurular SET durum = :durum, red_sebebi = :rseb WHERE id = :id");
            $guncelle->execute([':durum' => $yeni_durum, ':rseb' => ($yeni_durum == 'Reddedildi' ? $red_sebebi : NULL), ':id' => $id]);

            // İşlem Logu Kaydetme
            $logDetay = "Başvuru durumunu '$yeni_durum' olarak güncelledi.";
            if ($yeni_durum == 'Reddedildi' && !empty($red_sebebi)) {
                $logDetay .= " (Red Sebebi: $red_sebebi)";
            }
            $logStmt = $db->prepare("INSERT INTO islem_loglari (yonetici_adi, basvuru_id, takip_no, islem_detayi) VALUES (:yadi, :bid, :tno, :idetay)");
            $logStmt->execute([
                ':yadi'   => $admin_ad,
                ':bid'    => $id,
                ':tno'    => $bRow['takip_no'] ?: $id,
                ':idetay' => $logDetay
            ]);

            header("Location: panel.php?mesaj=guncellendi");
            exit;
        }
    }
}

// Silme, Geri Yükleme ve Kalıcı Silme İşlemleri
if (isset($_GET['islem']) && in_array($_GET['islem'], ['sil', 'geri_yukle', 'kalici_sil']) && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $islem = $_GET['islem'];
    $current_tab = $_GET['tab'] ?? 'tum';
    
    $basvuruCheck = $db->prepare("SELECT * FROM basvurular WHERE id = :id");
    $basvuruCheck->execute([':id' => $id]);
    $bRow = $basvuruCheck->fetch();

    if ($bRow) {
        $izinli = true;
        if ($admin_rol !== 'superadmin') {
            $permStmt = $db->prepare("SELECT COUNT(*) FROM yonetici_izinleri WHERE yonetici_id = :yid AND form_kodu = :fkodu");
            $permStmt->execute([':yid' => $admin_id, ':fkodu' => $bRow['form_kodu']]);
            if ($permStmt->fetchColumn() == 0) {
                $izinli = false;
            }
        }

        if ($izinli) {
            $yonlendirMesaj = "";
            $logDetay = "";

            if ($islem == 'sil') {
                $guncelle = $db->prepare("UPDATE basvurular SET durum = 'Silindi' WHERE id = :id");
                $guncelle->execute([':id' => $id]);
                $logDetay = "Başvuruyu silinenlere taşıdı.";
                $yonlendirMesaj = "silindi";
            } elseif ($islem == 'geri_yukle') {
                $guncelle = $db->prepare("UPDATE basvurular SET durum = 'Beklemede' WHERE id = :id");
                $guncelle->execute([':id' => $id]);
                $logDetay = "Başvuruyu geri yükledi.";
                $yonlendirMesaj = "geriyuklendi";
            } elseif ($islem == 'kalici_sil') {
                $sil = $db->prepare("DELETE FROM basvurular WHERE id = :id");
                $sil->execute([':id' => $id]);
                $logDetay = "Başvuruyu kalıcı olarak sildi.";
                $yonlendirMesaj = "kalicisilindi";
            }

            // Log kaydet
            $logStmt = $db->prepare("INSERT INTO islem_loglari (yonetici_adi, basvuru_id, takip_no, islem_detayi) VALUES (:yadi, :bid, :tno, :idetay)");
            $logStmt->execute([
                ':yadi'   => $admin_ad,
                ':bid'    => $id,
                ':tno'    => $bRow['takip_no'] ?: $id,
                ':idetay' => $logDetay
            ]);

            header("Location: panel.php?tab={$current_tab}&mesaj={$yonlendirMesaj}");
            exit;
        }
    }
}

// Tüm Form İsimlerini Veritabanından (ve Doldurulan Başvurulardan) Dinamik Çekme
$formRows = $db->query("SELECT form_kodu, form_adi FROM formlar ORDER BY form_kodu ASC")->fetchAll();
$tum_form_isimleri = [];
foreach ($formRows as $fr) {
    $tum_form_isimleri[$fr['form_kodu']] = $fr['form_kodu'] . ' - ' . $fr['form_adi'];
}
// Başvurularda olup da formlar tablosunda görünmeyenleri ekle
$extraFormRows = $db->query("SELECT DISTINCT form_kodu, form_adi FROM basvurular WHERE form_kodu IS NOT NULL AND form_kodu != ''")->fetchAll();
foreach ($extraFormRows as $efr) {
    if (!isset($tum_form_isimleri[$efr['form_kodu']])) {
        $tum_form_isimleri[$efr['form_kodu']] = $efr['form_kodu'] . ' - ' . ($efr['form_adi'] ?: ($efr['form_kodu'] . ' Formu'));
    }
}

// Admin İzinli Form Kodlarını Çekme
$izinli_formlar = [];
if ($admin_rol === 'superadmin') {
    $izinli_formlar = array_keys($tum_form_isimleri);
} else {
    $iStmt = $db->prepare("SELECT form_kodu FROM yonetici_izinleri WHERE yonetici_id = :yid");
    $iStmt->execute([':yid' => $admin_id]);
    $izinli_formlar = $iStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Eğer yöneticinin hiç izin kaydı yoksa varsayılan olarak tüm formları göster
    if (empty($izinli_formlar)) {
        $izinli_formlar = array_keys($tum_form_isimleri);
    }
}

// Sekme Filtresi (tum, bekleyen, onaylanan, reddedilen, silinenler)
$tab = $_GET['tab'] ?? 'tum';
$arama = $_GET['arama'] ?? '';
$form_filtre = $_GET['form_filtre'] ?? '';

$sql = "SELECT * FROM basvurular WHERE 1=1";
$params = [];

// Yetki Kısıtlaması Sorgusu
if ($admin_rol !== 'superadmin' && count($izinli_formlar) > 0) {
    $inQuery = implode(',', array_fill(0, count($izinli_formlar), '?'));
    $sql .= " AND form_kodu IN ($inQuery)";
    $params = array_merge($params, $izinli_formlar);
}

// Sekme Filtreleri
if ($tab == 'bekleyen') {
    $sql .= " AND durum = 'Beklemede'";
} elseif ($tab == 'onaylanan') {
    $sql .= " AND durum = 'Onaylandı'";
} elseif ($tab == 'reddedilen') {
    $sql .= " AND durum = 'Reddedildi'";
} elseif ($tab == 'silinenler') {
    $sql .= " AND durum = 'Silindi'";
} else {
    // tum
    $sql .= " AND (durum IS NULL OR durum != 'Silindi')";
}

if (!empty($arama)) {
    $sql .= " AND (ad_soyad LIKE ? OR tc_no LIKE ? OR takip_no LIKE ? OR birim LIKE ?)";
    $params[] = "%$arama%";
    $params[] = "%$arama%";
    $params[] = "%$arama%";
    $params[] = "%$arama%";
}

if (!empty($form_filtre)) {
    $sql .= " AND form_kodu = ?";
    $params[] = $form_filtre;
}

$sql .= " ORDER BY kayit_tarihi DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$basvurular = $stmt->fetchAll();

// İstatistikler (İzinli formlara göre)
if ($admin_rol === 'superadmin' || empty($izinli_formlar)) {
    $toplam_basvuru     = $db->query("SELECT COUNT(*) FROM basvurular WHERE durum IS NULL OR durum != 'Silindi'")->fetchColumn();
    $bekleyen_basvuru   = $db->query("SELECT COUNT(*) FROM basvurular WHERE durum='Beklemede'")->fetchColumn();
    $onaylanan_basvuru  = $db->query("SELECT COUNT(*) FROM basvurular WHERE durum='Onaylandı'")->fetchColumn();
    $reddedilen_basvuru = $db->query("SELECT COUNT(*) FROM basvurular WHERE durum='Reddedildi'")->fetchColumn();
    $silinen_basvuru    = $db->query("SELECT COUNT(*) FROM basvurular WHERE durum='Silindi'")->fetchColumn();
} else {
    $inQuery = implode(',', array_fill(0, count($izinli_formlar), '?'));
    
    $s1 = $db->prepare("SELECT COUNT(*) FROM basvurular WHERE (durum IS NULL OR durum != 'Silindi') AND form_kodu IN ($inQuery)");
    $s1->execute($izinli_formlar);
    $toplam_basvuru = $s1->fetchColumn();

    $s2 = $db->prepare("SELECT COUNT(*) FROM basvurular WHERE durum='Beklemede' AND form_kodu IN ($inQuery)");
    $s2->execute($izinli_formlar);
    $bekleyen_basvuru = $s2->fetchColumn();

    $s3 = $db->prepare("SELECT COUNT(*) FROM basvurular WHERE durum='Onaylandı' AND form_kodu IN ($inQuery)");
    $s3->execute($izinli_formlar);
    $onaylanan_basvuru = $s3->fetchColumn();

    $s4 = $db->prepare("SELECT COUNT(*) FROM basvurular WHERE durum='Reddedildi' AND form_kodu IN ($inQuery)");
    $s4->execute($izinli_formlar);
    $reddedilen_basvuru = $s4->fetchColumn();

    $s5 = $db->prepare("SELECT COUNT(*) FROM basvurular WHERE durum='Silindi' AND form_kodu IN ($inQuery)");
    $s5->execute($izinli_formlar);
    $silinen_basvuru = $s5->fetchColumn();
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yönetici Paneli - BAÜN Form İşlem Merkezi</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; color:#333; }
        .header { background-color: #1b656e; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header h1 { font-size: 20px; margin: 0; display: flex; align-items: center; gap: 10px; }
        .header-btn { background: #d93025; color: white; padding: 8px 16px; border-radius: 5px; text-decoration: none; font-size: 13px; font-weight: bold; transition: 0.3s; }
        .header-btn:hover { background: #b02319; }
        .header-btn-yetki { background: #f39c12; color: white; padding: 8px 16px; border-radius: 5px; text-decoration: none; font-size: 13px; font-weight: bold; transition: 0.3s; margin-right: 10px; }
        .header-btn-yetki:hover { background: #d68910; }
        
        .container { max-width: 1250px; margin: 30px auto; padding: 0 20px; }
        
        /* Sekme Stilleri */
        .tab-menu { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 0; }
        .tab-btn { padding: 12px 22px; font-weight: bold; text-decoration: none; color: #555; background: #e2e8f0; border-radius: 8px 8px 0 0; font-size: 14px; transition: all 0.3s; display: flex; align-items: center; gap: 8px; }
        .tab-btn:hover { background: #cbd5e1; color: #1b656e; }
        .tab-btn.active { background: #1b656e; color: white; border-bottom: 3px solid #144d54; }
        .tab-badge { background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .tab-btn.active .tab-badge { background: white; color: #1b656e; }

        .filter-card { background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; gap: 15px; align-items: center; }
        .filter-card input, .filter-card select { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; outline: none; }
        .filter-card input { flex: 2; }
        .filter-card select { flex: 1; }
        .btn-ara { background: #1b656e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .btn-sifirla { background: #7f8c8d; color: white; border: none; padding: 10px 15px; border-radius: 5px; text-decoration: none; font-size: 13px; }

        .table-card { background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left; }
        th { background: #e8f4f8; color: #1b656e; padding: 12px 15px; font-weight: bold; border-bottom: 2px solid #ddd; }
        td { padding: 12px 15px; border-bottom: 1px solid #eee; vertical-align: middle; }
        tr:hover { background-color: #f9f9f9; }

        .btn-detay { background: #2980b9; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block; }
        .btn-detay:hover { background: #1f618d; }
        .btn-sil { background: #e74c3c; color: white; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block; margin-left: 5px; }
        .btn-sil:hover { background: #c0392b; }
        
        .durum-select { padding: 5px 8px; font-size: 12px; font-weight: bold; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; }

        /* Modal Stili (Red Sebebi İçin) */
        .modal { display: none; position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
        .modal-content { background: white; padding: 25px; border-radius: 8px; width: 450px; max-width: 90%; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .modal-content h3 { margin-top: 0; color: #d93025; }
        .modal-content textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin: 10px 0; font-family: inherit; box-sizing: border-box; }
        .modal-buttons { display: flex; justify-content: flex-end; gap: 10px; }
    </style>
</head>
<body>

    <div class="header">
        <h1>
            <img src="https://baunwebapi.balikesir.edu.tr/uploads/1729083231270.png" height="35" style="background:white; border-radius:4px; padding:2px;">
            BAÜN Form İşlem Merkezi - Yönetici Paneli
        </h1>
        <div>
            <span style="margin-right:15px; font-size:14px;">Hoş geldiniz, <strong><?php echo htmlspecialchars($admin_ad); ?></strong> (<?php echo $admin_rol === 'superadmin' ? 'Süper Admin' : 'Admin'; ?>)</span>
            
            <?php if($admin_rol === 'superadmin'): ?>
                <a href="yetki.php" class="header-btn-yetki"> Admin & İzin Yönetimi</a>
            <?php endif; ?>
            
            <a href="cikis.php" class="header-btn">Güvenli Çıkış</a>
        </div>
    </div>

    <div class="container">
        <!-- BİLDİRİM MESAJLARI -->
        <?php if (isset($_GET['mesaj'])): ?>
            <?php 
                $mesajTip = $_GET['mesaj'];
                $mesajMetni = "";
                $mesajRenk = "#27ae60"; 
                $mesajArkaplan = "#e8f8f5";
                $mesajKenarlik = "#27ae60";

                if ($mesajTip == 'silindi') {
                    $mesajMetni = "✓ Başvuru başarıyla silinerek <strong>Silinenler</strong> sekmesine taşındı.";
                    $mesajRenk = "#d93025"; 
                    $mesajArkaplan = "#fce8e6";
                    $mesajKenarlik = "#d93025";
                } elseif ($mesajTip == 'geriyuklendi') {
                    $mesajMetni = "✓ Başvuru başarıyla geri yüklendi ve aktif listeye alındı.";
                } elseif ($mesajTip == 'kalicisilindi') {
                    $mesajMetni = "✓ Başvuru kalıcı olarak sistemden silindi.";
                    $mesajRenk = "#d93025";
                    $mesajArkaplan = "#fce8e6";
                    $mesajKenarlik = "#d93025";
                } elseif ($mesajTip == 'guncellendi') {
                    $mesajMetni = "✓ Başvuru durumu başarıyla güncellendi.";
                }
            ?>
            <?php if (!empty($mesajMetni)): ?>
                <div style="background: <?php echo $mesajArkaplan; ?>; color: <?php echo $mesajRenk; ?>; border-left: 5px solid <?php echo $mesajKenarlik; ?>; padding: 12px 20px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; font-weight: 500;">
                    <?php echo $mesajMetni; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <!-- SEKME MENÜSÜ -->
        <div class="tab-menu">
            <a href="panel.php?tab=tum" class="tab-btn <?php echo $tab=='tum'?'active':''; ?>">
                 Tüm Başvurular <span class="tab-badge"><?php echo $toplam_basvuru; ?></span>
            </a>
            <a href="panel.php?tab=bekleyen" class="tab-btn <?php echo $tab=='bekleyen'?'active':''; ?>">
                 Bekleyenler <span class="tab-badge"><?php echo $bekleyen_basvuru; ?></span>
            </a>
            <a href="panel.php?tab=onaylanan" class="tab-btn <?php echo $tab=='onaylanan'?'active':''; ?>">
                 Onaylananlar <span class="tab-badge"><?php echo $onaylanan_basvuru; ?></span>
            </a>
            <a href="panel.php?tab=reddedilen" class="tab-btn <?php echo $tab=='reddedilen'?'active':''; ?>">
                 Reddedilenler <span class="tab-badge"><?php echo $reddedilen_basvuru; ?></span>
            </a>
            <a href="panel.php?tab=silinenler" class="tab-btn <?php echo $tab=='silinenler'?'active':''; ?>">
                 Silinenler <span class="tab-badge"><?php echo $silinen_basvuru; ?></span>
            </a>
        </div>

        <form method="GET" class="filter-card">
            <input type="hidden" name="tab" value="<?php echo htmlspecialchars($tab); ?>">
            <input type="text" name="arama" value="<?php echo htmlspecialchars($arama); ?>" placeholder="Takip No, Ad Soyad, TC No veya Birim ara...">
            <select name="form_filtre">
                <option value="">-- Tüm İzinli Formlar --</option>
                <?php foreach($tum_form_isimleri as $f_kodu => $f_adi): ?>
                    <?php if(in_array($f_kodu, $izinli_formlar)): ?>
                        <option value="<?php echo $f_kodu; ?>" <?php echo $form_filtre==$f_kodu?'selected':''; ?>><?php echo htmlspecialchars($f_adi); ?></option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
            <button type="submit" class="btn-ara">Filtrele</button>
            <?php if(!empty($arama) || !empty($form_filtre)): ?>
                <a href="panel.php?tab=<?php echo $tab; ?>" class="btn-sifirla">Filtreyi Temizle</a>
            <?php endif; ?>
        </form>

        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th>Takip No</th>
                        <th>Form Kodu / İsmi</th>
                        <th>Başvuran Ad Soyad</th>
                        <th>T.C. Kimlik No</th>
                        <th>Birim / Fakülte</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                        <th style="text-align:center;">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(count($basvurular) > 0): ?>
                        <?php foreach($basvurular as $b): ?>
                            <tr>
                                <td>
                                    <span style="font-weight:bold; color:#1b656e; font-size:14px; font-family:monospace;">
                                        #<?php echo htmlspecialchars($b['takip_no'] ?: $b['id']); ?>
                                    </span>
                                </td>
                                <td>
                                    <span style="font-weight:bold; color:#1b656e; display:block;"><?php echo htmlspecialchars($b['form_kodu']); ?></span>
                                    <span style="font-size:11.5px; color:#666;"><?php echo htmlspecialchars($b['form_adi']); ?></span>
                                </td>
                                <td><strong><?php echo htmlspecialchars($b['ad_soyad'] ?: '-'); ?></strong></td>
                                <td><?php echo htmlspecialchars($b['tc_no'] ?: '-'); ?></td>
                                <td><?php echo htmlspecialchars($b['birim'] ?: '-'); ?></td>
                                <td><?php echo date('d.m.Y H:i', strtotime($b['kayit_tarihi'])); ?></td>
                                <td>
                                    <?php if ($b['durum'] == 'Silindi'): ?>
                                        <span class="status-badge" style="background:#fce8e6; color:#d93025; border:1px solid #d93025; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">Silindi</span>
                                    <?php else: ?>
                                        <select class="durum-select" onchange="durumDegistir(<?php echo $b['id']; ?>, this.value)">
                                            <option value="Beklemede" <?php echo $b['durum']=='Beklemede'?'selected':''; ?>>Beklemede</option>
                                            <option value="Onaylandı" <?php echo $b['durum']=='Onaylandı'?'selected':''; ?>>Onaylandı</option>
                                            <option value="Reddedildi" <?php echo $b['durum']=='Reddedildi'?'selected':''; ?>>Reddedildi</option>
                                        </select>
                                    <?php endif; ?>

                                    <?php if($b['durum'] == 'Reddedildi' && !empty($b['red_sebebi'])): ?>
                                        <div style="font-size:11px; color:#d93025; margin-top:3px; max-width:180px; word-wrap:break-word;">
                                            <strong>Red Sebebi:</strong> <?php echo htmlspecialchars($b['red_sebebi']); ?>
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align:center; white-space:nowrap;">
                                    <a href="detay.php?id=<?php echo $b['id']; ?>" class="btn-detay">Detay Gör</a>
                                    <a href="detay.php?id=<?php echo $b['id']; ?>&print=1" target="_blank" class="btn-detay" style="background:#27ae60; margin-left:4px;">PDF İndir</a>
                                    <?php if ($b['durum'] == 'Silindi'): ?>
                                        <a href="panel.php?islem=geri_yukle&id=<?php echo $b['id']; ?>&tab=<?php echo $tab; ?>" class="btn-detay" style="background:#27ae60; margin-left:4px;">Geri Yükle</a>
                                        <a href="panel.php?islem=kalici_sil&id=<?php echo $b['id']; ?>&tab=<?php echo $tab; ?>" class="btn-sil" onclick="return confirm('Bu başvuruyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!');">Kalıcı Sil</a>
                                    <?php else: ?>
                                        <a href="panel.php?islem=sil&id=<?php echo $b['id']; ?>&tab=<?php echo $tab; ?>" class="btn-sil" onclick="return confirm('Bu başvuruyu silmek istediğinize emin misiniz?');">Sil</a>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="8" style="text-align:center; padding:30px; color:#999;">Bu sekmede gösterilecek kayıtlı bir başvuru bulunmamaktadır.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- RED SEBEBİ GİRME MODAL (POPUP) -->
    <div id="redModal" class="modal">
        <div class="modal-content">
            <h3> Başvuru Red Sebebi</h3>
            <p style="font-size:13px; color:#666; margin-bottom:10px;">Başvuran kişinin takip ekranında görebilmesi için lütfen red gerekçesini yazınız:</p>
            <form id="redForm" method="POST">
                <input type="hidden" name="islem" value="durum_guncelle">
                <input type="hidden" name="id" id="modalBasvuruId">
                <input type="hidden" name="yeni_durum" value="Reddedildi">
                
                <textarea name="red_sebebi" rows="4" placeholder="Örn: Fotoğraf vesikalık formatına uygun değil / Eksik ödeme dekontu..." required></textarea>
                
                <div class="modal-buttons">
                    <button type="button" onclick="modalKapat()" style="background:#ccc; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">İptal</button>
                    <button type="submit" style="background:#d93025; color:white; border:none; padding:8px 18px; border-radius:4px; font-weight:bold; cursor:pointer;">Reddet ve Kaydet</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function durumDegistir(id, yeniDurum) {
            if (yeniDurum === 'Reddedildi') {
                document.getElementById('modalBasvuruId').value = id;
                document.getElementById('redModal').style.display = 'flex';
            } else {
                var form = document.createElement('form');
                form.method = 'POST';
                form.action = 'panel.php';

                var inputIslem = document.createElement('input');
                inputIslem.type = 'hidden';
                inputIslem.name = 'islem';
                inputIslem.value = 'durum_guncelle';
                form.appendChild(inputIslem);

                var inputId = document.createElement('input');
                inputId.type = 'hidden';
                inputId.name = 'id';
                inputId.value = id;
                form.appendChild(inputId);

                var inputDurum = document.createElement('input');
                inputDurum.type = 'hidden';
                inputDurum.name = 'yeni_durum';
                inputDurum.value = yeniDurum;
                form.appendChild(inputDurum);

                document.body.appendChild(form);
                form.submit();
            }
        }

        function modalKapat() {
            document.getElementById('redModal').style.display = 'none';
        }
    </script>
</body>
</html>