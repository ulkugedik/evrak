<?php
session_start();
require_once 'baglan.php';

$hata = "";

// Yönetici Giriş Kontrolü (Veritabanından)
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $kullanici = trim($_POST['kullanici_adi'] ?? '');
    $sifre = trim($_POST['sifre'] ?? '');

    if (!empty($kullanici) && !empty($sifre)) {
        $stmt = $db->prepare("SELECT * FROM yoneticiler WHERE kullanici_adi = :kadi");
        $stmt->execute([':kadi' => $kullanici]);
        $user = $stmt->fetch();

        if ($user && (password_verify($sifre, $user['sifre']) || $sifre === $user['sifre'])) {
            $_SESSION['admin_giris']     = true;
            $_SESSION['admin_id']        = $user['id'];
            $_SESSION['admin_kullanici'] = $user['kullanici_adi'];
            $_SESSION['admin_ad_soyad']   = $user['ad_soyad'];
            $_SESSION['admin_rol']        = $user['rol'];

            header("Location: panel.php");
            exit;
        } else {
            $hata = "Hatalı kullanıcı adı veya şifre girdiniz!";
        }
    } else {
        $hata = "Lütfen kullanıcı adı ve şifrenizi giriniz!";
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yönetici Girişi - BAÜN Form İşlem Merkezi</title>
    <style>
        /* Genel Sayfa Ayarları */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        
        /* Üst Menü (Navbar) */
        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; background-color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .navbar-logo { display: flex; align-items: center; gap: 15px; font-weight: bold; color: #1b656e; font-size: 18px; text-decoration: none; transition: opacity 0.3s; }
        .navbar-logo:hover { opacity: 0.8; }
        .navbar-link { font-size: 14px; color: #555; text-decoration: none; transition: color 0.3s; }
        .navbar-link:hover { color: #1b656e; }
        
        /* Banner Alanı */
        .banner { background-color: rgb(3, 149, 159); color: white; text-align: center; padding: 80px 20px 120px 20px; border-bottom-left-radius: 50% 20%; border-bottom-right-radius: 50% 20%; margin-bottom: -40px; }
        .banner h1 { font-size: 36px; margin: 0 0 10px 0; }
        .banner p { font-size: 14px; opacity: 0.9; }
        
        /* Yönetici Giriş Kutusu Tasarımı */
        .login-kutusu { 
            background: white; 
            max-width: 400px; 
            margin: 0 auto; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            position: relative; 
            z-index: 10; 
            text-align: center;
        }
        
        .login-kutusu h2 { color: #1b656e; margin-top: 0; margin-bottom: 25px; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        
        .form-grup { margin-bottom: 20px; text-align: left; }
        .form-grup label { display: block; font-weight: bold; margin-bottom: 5px; color: #555; font-size: 14px; }
        .form-grup input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; font-size: 15px; transition: border-color 0.3s; }
        .form-grup input:focus { border-color: #1b656e; outline: none; }
        
        .btn-tamam { background-color: #1b656e; color: white; border: none; padding: 15px; font-size: 16px; font-weight: bold; border-radius: 5px; cursor: pointer; transition: background 0.3s; width: 100%; margin-top: 10px; }
        .btn-tamam:hover { background-color: rgb(3, 149, 159); }
        
        .hata-mesaji { color: #d93025; background: #fce8e6; padding: 10px; border-radius: 5px; font-size: 14px; margin-bottom: 20px; font-weight: bold; display: block; border-left: 3px solid #d93025; text-align: left; }
    </style>
</head>
<body>

    <!-- Üst Menü -->
    <div class="navbar">
        <a href="index.php" class="navbar-logo">
            <img src="https://baunwebapi.balikesir.edu.tr/uploads/1729083231270.png" alt="BAÜN Logo" height="50">
            BALIKESİR ÜNİVERSİTESİ
        </a>
        <div>
            <a href="index.php" class="navbar-link">BİLGİ İŞLEM DAİRE BAŞKANLIĞI | Form İşlem Merkezi</a>
        </div>
    </div>

    <!-- Banner -->
    <div class="banner">
        <h1>Yönetici Giriş Paneli</h1>
        <p>ANASAYFA > YÖNETİCİ GİRİŞİ</p>
    </div>

    <!-- Yönetici Giriş Kutusu -->
    <div class="login-kutusu">
        <h2>Sisteme Giriş Yapın</h2>
        
        <?php if(!empty($hata)): ?>
            <div class="hata-mesaji">
                Uyarı: <?php echo $hata; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="form-grup">
                <label>Kullanıcı Adı</label>
                <input type="text" name="kullanici_adi" placeholder="Kullanıcı adınızı giriniz (superadmin, admin1, admin2)" required autocomplete="off">
            </div>
            
            <div class="form-grup">
                <label>Şifre</label>
                <input type="password" name="sifre" placeholder="Şifrenizi giriniz" required>
            </div>
            
            <button type="submit" class="btn-tamam">Giriş Yap</button>
        </form>
    </div>

</body>
</html>