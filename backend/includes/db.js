// backend/includes/db.js
// Mock veri tabanı - localStorage tabanlı CRUD

const DB_KEYS = {
  OGRENCILER: 'ogrenciler',
  DONEM_KAYITLARI: 'donem_kayitlari',
  BELGELER: 'belgeler',
  HEPATIT_ASI: 'hepatit_asi_takip',
  ASI_DOZLARI: 'asi_dozlari'
};

// --- Yardımcı fonksiyonlar ---
function _getTable(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function _saveTable(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function _nextId(table) {
  return table.length ? Math.max(...table.map(r => r.id)) + 1 : 1;
}

// --- Öğrenci CRUD ---
function ogrenciEkle(data) {
  const tablo = _getTable(DB_KEYS.OGRENCILER);
  const yeni = {
    id: _nextId(tablo),
    ogrenci_no: data.ogrenci_no,
    tc_kimlik: data.tc_kimlik || null,
    ad_soyad: data.ad_soyad,
    bolum: data.bolum,
    sinif: data.sinif,
    telefon: data.telefon,
    kurumsal_eposta: data.eposta,
    akademik_danisman: data.danisman,
    created_at: new Date().toISOString()
  };
  tablo.push(yeni);
  _saveTable(DB_KEYS.OGRENCILER, tablo);
  return yeni.id;
}

function ogrenciGetir(id) {
  return _getTable(DB_KEYS.OGRENCILER).find(o => o.id === id) || null;
}

function tumOgrenciler() {
  return _getTable(DB_KEYS.OGRENCILER);
}

// --- Dönem kaydı CRUD ---
function donemKaydiEkle(ogrenciId, data) {
  const tablo = _getTable(DB_KEYS.DONEM_KAYITLARI);
  const yeni = {
    id: _nextId(tablo),
    ogrenci_id: ogrenciId,
    akademik_yil: data.akademik_yil,
    donem: data.donem,
    ders_adi_kodu: data.ders_adi_kodu,
    uygulama_kurumu: data.uygulama_kurumu,
    uygulama_birimi: data.uygulama_birimi || null,
    uygulama_gunleri: data.uygulama_gunleri,
    sorumlu_ogretim_elemani: data.sorumlu_ogretim_elemani
  };
  tablo.push(yeni);
  _saveTable(DB_KEYS.DONEM_KAYITLARI, tablo);
  return yeni.id;
}

function donemKayitlariByOgrenci(ogrenciId) {
  return _getTable(DB_KEYS.DONEM_KAYITLARI).filter(d => d.ogrenci_id === ogrenciId);
}

// --- Belge CRUD ---
function belgeEkle(donemKayitId, belgeTipi, dosyaAdi) {
  const tablo = _getTable(DB_KEYS.BELGELER);
  const yeni = {
    id: _nextId(tablo),
    donem_kayit_id: donemKayitId,
    belge_tipi: belgeTipi,
    dosya_adi: dosyaAdi,
    belge_tarihi: new Date().toISOString().split('T')[0],
    gecerlilik_bitis: null,
    kontrol_durumu: 'bekliyor'
  };
  tablo.push(yeni);
  _saveTable(DB_KEYS.BELGELER, tablo);
  return yeni.id;
}

function belgeDurumGuncelle(belgeId, yeniDurum) {
  const tablo = _getTable(DB_KEYS.BELGELER);
  const belge = tablo.find(b => b.id === belgeId);
  if (belge) {
    belge.kontrol_durumu = yeniDurum;
    _saveTable(DB_KEYS.BELGELER, tablo);
    return true;
  }
  return false;
}

function belgelerByDonemKayit(donemKayitId) {
  return _getTable(DB_KEYS.BELGELER).filter(b => b.donem_kayit_id === donemKayitId);
}

// --- Hepatit/Aşı takip ---
function hepatitTakipEkle(donemKayitId, data) {
  const tablo = _getTable(DB_KEYS.HEPATIT_ASI);
  const yeni = {
    id: _nextId(tablo),
    donem_kayit_id: donemKayitId,
    hepatit_tetkik_yapildi: data.tetkik_yapildi || false,
    tetkik_tarihi: data.tetkik_tarihi || null,
    degerlendirme_durumu: null,
    asi_listesine_dahil: false
  };
  tablo.push(yeni);
  _saveTable(DB_KEYS.HEPATIT_ASI, tablo);
  return yeni.id;
}

function asiDozuEkle(takipId, dozNo, tarih, kurum) {
  const tablo = _getTable(DB_KEYS.ASI_DOZLARI);
  const yeni = { id: _nextId(tablo), takip_id: takipId, doz_no: dozNo, asi_tarihi: tarih, yapildigi_kurum: kurum };
  tablo.push(yeni);
  _saveTable(DB_KEYS.ASI_DOZLARI, tablo);
  return yeni.id;
}

function asiYapilacakOgrenciListesi() {
  const takipler = _getTable(DB_KEYS.HEPATIT_ASI).filter(t => t.asi_listesine_dahil === true);
  return takipler.map(t => {
    const donem = _getTable(DB_KEYS.DONEM_KAYITLARI).find(d => d.id === t.donem_kayit_id);
    const ogrenci = donem ? ogrenciGetir(donem.ogrenci_id) : null;
    return { ogrenci, takip: t };
  }).filter(item => item.ogrenci !== null);
}

// --- Test verisi (geliştirme kolaylığı için) ---
function seedData() {
  const id1 = ogrenciEkle({
    ogrenci_no: '2022123456',
    ad_soyad: 'Ayşe Yılmaz',
    bolum: 'Hemşirelik',
    sinif: '3',
    telefon: '05551112233',
    eposta: 'ayse.yilmaz@bau.edu.tr',
    danisman: 'Dr. Öğr. Üyesi Ali Kaya'
  });
  const donemId = donemKaydiEkle(id1, {
    akademik_yil: '2026-2027',
    donem: 'Güz',
    ders_adi_kodu: 'Klinik Uygulama I',
    uygulama_kurumu: 'Balıkesir Devlet Hastanesi',
    uygulama_gunleri: 'Pazartesi-Çarşamba',
    sorumlu_ogretim_elemani: 'Dr. Öğr. Üyesi Ali Kaya'
  });
  console.log('Seed tamamlandı:', { id1, donemId });
}

// Tarayıcıda modül olarak import edilecekse:
export {
  DB_KEYS,
  ogrenciEkle, ogrenciGetir, tumOgrenciler,
  donemKaydiEkle, donemKayitlariByOgrenci,
  belgeEkle, belgeDurumGuncelle, belgelerByDonemKayit,
  hepatitTakipEkle, asiDozuEkle, asiYapilacakOgrenciListesi,
  seedData
};