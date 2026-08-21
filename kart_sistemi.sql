CREATE DATABASE IF NOT EXISTS `kart_sistemi` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kart_sistemi`;

-- Başvurular Tablosu
CREATE TABLE IF NOT EXISTS `basvurular` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_kodu` VARCHAR(50) NOT NULL,
  `form_adi` VARCHAR(255) NOT NULL,
  `tc_no` VARCHAR(11) DEFAULT NULL,
  `ad_soyad` VARCHAR(255) DEFAULT NULL,
  `telefon` VARCHAR(50) DEFAULT NULL,
  `eposta` VARCHAR(255) DEFAULT NULL,
  `birim` VARCHAR(255) DEFAULT NULL,
  `fotograf_yolu` VARCHAR(255) DEFAULT NULL,
  `form_verileri` LONGTEXT DEFAULT NULL,
  `durum` VARCHAR(50) DEFAULT 'Beklemede',
  `kayit_tarihi` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Yönetici Tablosu
CREATE TABLE IF NOT EXISTS `yoneticiler` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kullanici_adi` VARCHAR(50) NOT NULL UNIQUE,
  `sifre` VARCHAR(255) NOT NULL,
  `olusturma_tarihi` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Varsayılan Yönetici Hesabı Ekleme (Kullanıcı Adı: admin | Şifre: 123456)
-- Şifre bcrypt hash ile saklanır.
INSERT INTO `yoneticiler` (`kullanici_adi`, `sifre`) 
VALUES ('admin', '$2y$10$w8Lg6/9P6zK8s1U7z/rve.bXm9cZ/UvMh7G/O3E3D6.1H6eF8w4iW')
ON DUPLICATE KEY UPDATE `kullanici_adi`=`kullanici_adi`;
