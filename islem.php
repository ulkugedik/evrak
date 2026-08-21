<?php
session_start();
require_once 'baglan.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['form_kodu'])) {
    
    $form_kodu = $_POST['form_kodu'] ?? '';
    $form_adi  = $_POST['form_adi'] ?? '';
    
    // Rastgele Güvenli Takip Numarası Üretme (Örn: 2026230593)
    $takip_no = date('Y') . random_int(100000, 999999);

    // Ortak alanları otomatik tespit etme
    $tc_no    = $_POST['tc_no'] ?? $_POST['personel_tc_no'] ?? ($_POST['eimza_tc'][0] ?? '');
    $ad_soyad = $_POST['ad_soyad'] ?? $_POST['personel_ad_soyad'] ?? $_POST['sorumlu_ad_soyad'] ?? ($_POST['eimza_ad'][0] ?? '');
    $telefon  = $_POST['telefon'] ?? $_POST['irtibat_telefonu'] ?? '';
    $eposta   = $_POST['eposta'] ?? $_POST['personel_eposta'] ?? $_POST['diger_eposta'] ?? '';
    $birim    = $_POST['birim'] ?? $_POST['fakulte_birim'] ?? $_POST['birim_adi'] ?? $_POST['gorev_ogrenim_yeri'] ?? '';

    // Fotoğraf Yükleme İşlemi (Varsa)
    $fotograf_yolu = NULL;
    if (isset($_FILES['fotograf']) && $_FILES['fotograf']['error'] === UPLOAD_ERR_OK) {
        $dosyaTmp   = $_FILES['fotograf']['tmp_name'];
        $dosyaAdi   = $_FILES['fotograf']['name'];
        $uzanti     = strtolower(pathinfo($dosyaAdi, PATHINFO_EXTENSION));
        
        $izinVerilenler = ['jpg', 'jpeg', 'png'];
        if (in_array($uzanti, $izinVerilenler)) {
            $hedefKlasor = 'uploads/';
            if (!is_dir($hedefKlasor)) {
                mkdir($hedefKlasor, 0777, true);
            }
            $yeniDosyaAdi = ($tc_no != '' ? $tc_no : time()) . '_' . uniqid() . '.' . $uzanti;
            $hedefYol = $hedefKlasor . $yeniDosyaAdi;
            
            if (move_uploaded_file($dosyaTmp, $hedefYol)) {
                $fotograf_yolu = $hedefYol;
            }
        }
    }

    // Dekont Yükleme İşlemi (F-54 Kayıp Kart veya diğerleri için)
    $dekont_yolu = NULL;
    if (isset($_FILES['dekont']) && $_FILES['dekont']['error'] === UPLOAD_ERR_OK) {
        $dosyaTmp   = $_FILES['dekont']['tmp_name'];
        $dosyaAdi   = $_FILES['dekont']['name'];
        $uzanti     = strtolower(pathinfo($dosyaAdi, PATHINFO_EXTENSION));
        
        $izinVerilenler = ['pdf', 'jpg', 'jpeg', 'png'];
        if (in_array($uzanti, $izinVerilenler)) {
            $hedefKlasor = 'uploads/';
            if (!is_dir($hedefKlasor)) {
                mkdir($hedefKlasor, 0777, true);
            }
            $yeniDosyaAdi = 'dekont_' . ($tc_no != '' ? $tc_no : time()) . '_' . uniqid() . '.' . $uzanti;
            $hedefYol = $hedefKlasor . $yeniDosyaAdi;
            
            if (move_uploaded_file($dosyaTmp, $hedefYol)) {
                $dekont_yolu = $hedefYol;
            }
        }
    }

    // Ekstra Dinamik Dosya Yüklemeleri (Varsa)
    if (isset($_FILES) && is_array($_FILES)) {
        foreach ($_FILES as $input_key => $file_info) {
            if (strpos($input_key, 'dyn_file_') === 0 && $file_info['error'] === UPLOAD_ERR_OK) {
                $hash = str_replace('dyn_file_', '', $input_key);
                $label = $_POST['dyn_file_label_' . $hash] ?? $input_key;
                
                $dosyaTmp   = $file_info['tmp_name'];
                $dosyaAdi   = $file_info['name'];
                $uzanti     = strtolower(pathinfo($dosyaAdi, PATHINFO_EXTENSION));
                $hedefKlasor = 'uploads/';
                if (!is_dir($hedefKlasor)) {
                    mkdir($hedefKlasor, 0777, true);
                }
                $yeniDosyaAdi = 'dyn_' . ($tc_no != '' ? $tc_no : time()) . '_' . uniqid() . '.' . $uzanti;
                $hedefYol = $hedefKlasor . $yeniDosyaAdi;
                
                if (move_uploaded_file($dosyaTmp, $hedefYol)) {
                    $post_verileri[$label] = $hedefYol;
                }
            }
        }
    }

    // Tüm POST verilerini kaybetmeden JSON olarak saklıyoruz
    $post_verileri = $_POST;
    unset($post_verileri['form_gonder']);

    // Dinamik alanları ana JSON seviyesine çıkarma ve temizleme
    if (isset($_POST['dyn_field']) && is_array($_POST['dyn_field'])) {
        foreach ($_POST['dyn_field'] as $df_key => $df_val) {
            $post_verileri[$df_key] = $df_val;
        }
        unset($post_verileri['dyn_field']);
    }
    foreach ($post_verileri as $k => $v) {
        if (strpos($k, 'dyn_file_label_') === 0) {
            unset($post_verileri[$k]);
        }
    }

    $form_verileri_json = json_encode($post_verileri, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    try {
        $query = $db->prepare("INSERT INTO basvurular 
            (form_kodu, form_adi, takip_no, tc_no, ad_soyad, telefon, eposta, birim, fotograf_yolu, dekont_yolu, form_verileri, durum, kayit_tarihi) 
            VALUES (:form_kodu, :form_adi, :takip_no, :tc_no, :ad_soyad, :telefon, :eposta, :birim, :fotograf_yolu, :dekont_yolu, :form_verileri, 'Beklemede', NOW())");

        $query->execute([
            ':form_kodu'      => $form_kodu,
            ':form_adi'       => $form_adi,
            ':takip_no'       => $takip_no,
            ':tc_no'          => $tc_no,
            ':ad_soyad'       => $ad_soyad,
            ':telefon'        => $telefon,
            ':eposta'         => $eposta,
            ':birim'          => $birim,
            ':fotograf_yolu'  => $fotograf_yolu,
            ':dekont_yolu'    => $dekont_yolu,
            ':form_verileri'  => $form_verileri_json
        ]);

        header("Location: index.php?durum=basarili&takip_no={$takip_no}");
        exit;
    } catch (PDOException $e) {
        header("Location: index.php?durum=hata&mesaj=" . urlencode($e->getMessage()));
        exit;
    }
} else {
    header("Location: index.php");
    exit;
}
?>