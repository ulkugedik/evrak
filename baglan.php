<?php
$host     = "localhost";
$db_name  = "kart_sistemi";
$username = "root";
$password = ""; // XAMPP varsayılan şifre boştur

try {
    $db = new PDO("mysql:host={$host};dbname={$db_name};charset=utf8mb4", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Tabloların Otomatik Oluşturulması
    $db->exec("CREATE TABLE IF NOT EXISTS yoneticiler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
        sifre VARCHAR(255) NOT NULL,
        ad_soyad VARCHAR(100) NOT NULL,
        rol ENUM('superadmin', 'admin') DEFAULT 'admin'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Sütun Kontrolü ve Güncellemesi (yoneticiler)
    $columnsYonetici = $db->query("SHOW COLUMNS FROM yoneticiler")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('ad_soyad', $columnsYonetici)) {
        $db->exec("ALTER TABLE yoneticiler ADD COLUMN ad_soyad VARCHAR(100) NOT NULL DEFAULT ''");
    }
    if (!in_array('rol', $columnsYonetici)) {
        $db->exec("ALTER TABLE yoneticiler ADD COLUMN rol ENUM('superadmin', 'admin') DEFAULT 'admin'");
    }

    $db->exec("CREATE TABLE IF NOT EXISTS yonetici_izinleri (
        id INT AUTO_INCREMENT PRIMARY KEY,
        yonetici_id INT NOT NULL,
        form_kodu VARCHAR(50) NOT NULL,
        UNIQUE KEY (yonetici_id, form_kodu),
        FOREIGN KEY (yonetici_id) REFERENCES yoneticiler(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Formlar Tablosunun Oluşturulması
    $db->exec("CREATE TABLE IF NOT EXISTS formlar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_kodu VARCHAR(50) NOT NULL UNIQUE,
        form_adi VARCHAR(255) NOT NULL,
        kategori VARCHAR(100) DEFAULT 'Diğer Formlar',
        aciklama TEXT NULL,
        alanlar LONGTEXT NULL,
        durum ENUM('aktif', 'pasif') DEFAULT 'aktif',
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Sütun Kontrolü ve Güncellemesi (basvurular)
    $columnsBasvuru = $db->query("SHOW COLUMNS FROM basvurular")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('takip_no', $columnsBasvuru)) {
        $db->exec("ALTER TABLE basvurular ADD COLUMN takip_no VARCHAR(20) NULL UNIQUE");
    }
    if (!in_array('red_sebebi', $columnsBasvuru)) {
        $db->exec("ALTER TABLE basvurular ADD COLUMN red_sebebi TEXT NULL");
    }
    if (!in_array('dekont_yolu', $columnsBasvuru)) {
        $db->exec("ALTER TABLE basvurular ADD COLUMN dekont_yolu VARCHAR(255) NULL");
    }

    // İşlem Günlüğü (Log) Tablosu
    $db->exec("CREATE TABLE IF NOT EXISTS islem_loglari (
        id INT AUTO_INCREMENT PRIMARY KEY,
        yonetici_adi VARCHAR(100) NOT NULL,
        basvuru_id INT NOT NULL,
        takip_no VARCHAR(20) NOT NULL,
        islem_detayi TEXT NOT NULL,
        tarih DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Varsayılan Sistem Formlarını Veritabanına Aktarma
    $varsayilan_formlar = [
        ['kodu' => 'F-52',         'adi' => 'Akıllı Kart İşlem Formu (F-52)',                         'kategori' => 'Akıllı Kart Formları'],
        ['kodu' => 'F-53',         'adi' => 'Akıllı Kart Öğrenci İşlem Formu (F-53)',                'kategori' => 'Akıllı Kart Formları'],
        ['kodu' => 'F-54',         'adi' => 'Kayıp Akıllı Kart Müracaat Formu (F-54)',               'kategori' => 'Akıllı Kart Formları'],
        ['kodu' => 'F-55',         'adi' => 'Arızalı Akıllı Kart Müracaat Formu (F-55)',             'kategori' => 'Akıllı Kart Formları'],
        ['kodu' => 'KDYS.FR.0072', 'adi' => 'KDYS.FR.0072 - Kurumsal E-Posta Talep Formu',           'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0073', 'adi' => 'KDYS.FR.0073 - E-İmza Mini Kart Okuyucu Tutanağı',       'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0074', 'adi' => 'KDYS.FR.0074 - E-İmza Talep Formu',                        'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0077', 'adi' => 'KDYS.FR.0077 - Kişisel Web Sözleşmesi',                 'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0078', 'adi' => 'KDYS.FR.0078 - Kurumsal Statik IP Sözleşmesi',         'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0079', 'adi' => 'KDYS.FR.0079 - Kurumsal Web Sözleşmesi',                'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0080', 'adi' => 'KDYS.FR.0080 - Mernis Taahhütnamesi',                   'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'KDYS.FR.0082', 'adi' => 'KDYS.FR.0082 - Personel E-Posta Başvuru Formu',         'kategori' => 'Bilgi İşlem Daire Başkanlığı Formları'],
        ['kodu' => 'F-ISE',        'adi' => 'İşe Giriş ve Periyodik Muayene Formu (F-ISE)',           'kategori' => 'Sağlık ve Güvenlik Formları']
    ];

    $chkForm = $db->prepare("SELECT COUNT(*) FROM formlar WHERE form_kodu = :fkodu");
    $insForm = $db->prepare("INSERT INTO formlar (form_kodu, form_adi, kategori, durum) VALUES (:fkodu, :fadi, :kat, 'aktif')");
    foreach ($varsayilan_formlar as $vf) {
        $chkForm->execute([':fkodu' => $vf['kodu']]);
        if ($chkForm->fetchColumn() == 0) {
            $insForm->execute([':fkodu' => $vf['kodu'], ':fadi' => $vf['adi'], ':kat' => $vf['kategori']]);
        }
    }

    // Başvurular tablosunda olup da formlar tablosunda bulunmayan form kodlarını otomatik formlar tablosuna aktarma
    $doldurulanFormKodlari = $db->query("SELECT DISTINCT form_kodu, form_adi FROM basvurular WHERE form_kodu IS NOT NULL AND form_kodu != ''")->fetchAll();
    foreach ($doldurulanFormKodlari as $dfk) {
        $chkForm->execute([':fkodu' => $dfk['form_kodu']]);
        if ($chkForm->fetchColumn() == 0) {
            $insForm->execute([
                ':fkodu' => $dfk['form_kodu'],
                ':fadi'  => $dfk['form_adi'] ?: ($dfk['form_kodu'] . ' Formu'),
                ':kat'   => 'Doldurulan Formlar'
            ]);
        }
    }

    // Mevcut takipsiz başvurulara takip no atama
    $takipsizler = $db->query("SELECT id FROM basvurular WHERE takip_no IS NULL OR takip_no = ''")->fetchAll();
    if ($takipsizler) {
        $upStmt = $db->prepare("UPDATE basvurular SET takip_no = :tno WHERE id = :id");
        foreach ($takipsizler as $row) {
            $yeni_tno = date('Y') . random_int(100000, 999999);
            $upStmt->execute([':tno' => $yeni_tno, ':id' => $row['id']]);
        }
    }

    // Eski 'admin' veya gereksiz hesapları temizleme
    $db->exec("DELETE FROM yoneticiler WHERE kullanici_adi NOT IN ('superadmin', 'admin1', 'admin2') AND rol != 'admin'");

    // Varsayılan Yöneticilerin Oluşturulması
    $varsayilan_yoneticiler = [
        ['kullanici_adi' => 'superadmin', 'sifre' => '123456', 'ad_soyad' => 'Süper Yönetici', 'rol' => 'superadmin'],
        ['kullanici_adi' => 'admin1',      'sifre' => '123456', 'ad_soyad' => 'Yönetici 1',     'rol' => 'admin'],
        ['kullanici_adi' => 'admin2',      'sifre' => '123456', 'ad_soyad' => 'Yönetici 2',     'rol' => 'admin']
    ];

    $checkStmt = $db->prepare("SELECT COUNT(*) FROM yoneticiler WHERE kullanici_adi = :kadi");
    $insertStmt = $db->prepare("INSERT INTO yoneticiler (kullanici_adi, sifre, ad_soyad, rol) VALUES (:kadi, :sifre, :ad_soyad, :rol)");

    foreach ($varsayilan_yoneticiler as $y) {
        $checkStmt->execute([':kadi' => $y['kullanici_adi']]);
        if ($checkStmt->fetchColumn() == 0) {
            $hashed_pass = password_hash($y['sifre'], PASSWORD_DEFAULT);
            $insertStmt->execute([
                ':kadi'     => $y['kullanici_adi'],
                ':sifre'    => $hashed_pass,
                ':ad_soyad' => $y['ad_soyad'],
                ':rol'      => $y['rol']
            ]);
        }
    }

    // Normal yöneticilere tüm form izinlerini otomatik tanımla
    $tum_form_kodlari = $db->query("SELECT form_kodu FROM formlar")->fetchAll(PDO::FETCH_COLUMN);
    $admins = $db->query("SELECT id FROM yoneticiler WHERE rol = 'admin'")->fetchAll();
    $insPerm = $db->prepare("INSERT IGNORE INTO yonetici_izinleri (yonetici_id, form_kodu) VALUES (:yid, :fkodu)");
    foreach ($admins as $adm) {
        foreach ($tum_form_kodlari as $fk) {
            $insPerm->execute([':yid' => $adm['id'], ':fkodu' => $fk]);
        }
    }

} catch(PDOException $e) {
    die("Veritabanı bağlantı hatası: " . $e->getMessage());
}
?>