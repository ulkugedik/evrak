/**
 * ==========================================================================
 * Veri Tabanı & Veri Şeması Modelleri - db.js
 * ==========================================================================
 */

window.AppDB = {
    // Öğrenci Başvuruları Koleksiyonu
    applications: JSON.parse(localStorage.getItem('db_applications') || JSON.stringify([
        {
            id: 'APP-1700000000001',
            isTrash: false,
            studentNo: '2024105001',
            fullName: 'Ayşe Yılmaz',
            tcNo: '12345678901',
            department: 'Hemşirelik',
            studentClass: '3. Sınıf',
            phone: '0555 123 45 67',
            email: 'ayse.yilmaz@ogrenci.edu.tr',
            academicAdvisor: 'Prof. Dr. Ahmet Yılmaz',
            academicYear: '2026-2027',
            term: 'Güz',
            courseNameCode: 'HEM301 - Klinik Hemşirelik Uygulaması I',
            institution: 'Üniversite Eğitim ve Araştırma Hastanesi',
            unitName: 'Dahiliye Servisi',
            applicationDays: 'Pazartesi, Salı',
            responsibleInstructor: 'Prof. Dr. Fatma Yıldız',
            hepatitisTested: 'Evet',
            hepatitisTestDate: '2026-01-15',
            tetkikDegerlendirmeDurumu: 'Sonuç bekleniyor',
            asiListesineDahilMi: 'Hayır',
            vaccineDoses: [],
            documentsStatus: {
                isgCertificate: { status: 'Bekliyor', date: '2026-01-10', fileName: 'isg_sertifikasi.pdf' },
                medicalForm: { status: 'Bekliyor', date: '2026-01-12', expiryDate: '2027-01-12', fileName: 'ise_giris_formu.pdf' },
                privacyAgreement: { status: 'Bekliyor', physicalCount: 1, fileName: 'gizlilik_sozlesmesi.pdf' },
                idCard: { status: 'Bekliyor', fileName: 'kimlik_fotokopisi.jpg' },
                hemogram: { status: 'Bekliyor', date: '2026-01-15', fileName: 'hemogram_sonuc.pdf' },
                elisa: { status: 'Bekliyor', date: '2026-01-15', fileName: 'elisa_sonuc.pdf' },
                chestXray: { status: 'Bekliyor', date: '2026-01-15', fileName: 'akciger_grafi.pdf' },
                hepatitisTest: { status: 'Bekliyor', date: '2026-01-15', fileName: 'hepatitis_sonuc.pdf' },
                vaccineCard: { status: 'Yüklenmedi' }
            },
            submissionDate: '2026-01-16T10:00:00.000Z'
        }
    ])),

    // Danışman Listesi
    advisors: JSON.parse(localStorage.getItem('db_advisors') || JSON.stringify([
        "Prof. Dr. Ahmet Yılmaz",
        "Doç. Dr. Ayşe Kaya",
        "Dr. Öğr. Üyesi Mehmet Demir",
        "Dr. Öğr. Üyesi Zeynep Şahin",
        "Öğr. Gör. Elif Arslan"
    ])),

    // Sorumlu Öğretim Elemanı Listesi
    instructors: JSON.parse(localStorage.getItem('db_instructors') || JSON.stringify([
        "Prof. Dr. Fatma Yıldız",
        "Doç. Dr. Murat Can",
        "Dr. Öğr. Üyesi Sevgi Kılıç",
        "Arş. Gör. Burak Çelik"
    ])),

    // Bölüm & Dönem Bazlı Dersler Listesi
    courses: JSON.parse(localStorage.getItem('db_courses') || JSON.stringify([
        { id: 'c1', department: 'Hemşirelik', term: 'Güz', codeName: 'HEM301 - Klinik Hemşirelik Uygulaması I' },
        { id: 'c2', department: 'Hemşirelik', term: 'Bahar', codeName: 'HEM402 - İntörn Hemşirelik Sahası' },
        { id: 'c3', department: 'Ebelik', term: 'Güz', codeName: 'EBE204 - Doğum Sahası Uygulaması' },
        { id: 'c4', department: 'Fizyoterapi ve Rehabilitasyon', term: 'Bahar', codeName: 'FTR401 - Klinik Fizyoterapi Stajı' },
        { id: 'c5', department: 'Tıp Fakültesi', term: 'Yaz Okulu / Staj', codeName: 'TIP501 - İç Hastalıkları Stajı' }
    ])),

    // Akademik Danışman İşlemleri
    getAdvisors: function() {
        return this.advisors;
    },
    addAdvisor: function(name) {
        if (!name || this.advisors.includes(name)) return false;
        this.advisors.push(name);
        localStorage.setItem('db_advisors', JSON.stringify(this.advisors));
        return true;
    },
    deleteAdvisor: function(name) {
        this.advisors = this.advisors.filter(a => a !== name);
        localStorage.setItem('db_advisors', JSON.stringify(this.advisors));
        return true;
    },

    // Sorumlu Öğretim Elemanı İşlemleri
    getInstructors: function() {
        return this.instructors;
    },
    addInstructor: function(name) {
        if (!name || this.instructors.includes(name)) return false;
        this.instructors.push(name);
        localStorage.setItem('db_instructors', JSON.stringify(this.instructors));
        return true;
    },
    deleteInstructor: function(name) {
        this.instructors = this.instructors.filter(i => i !== name);
        localStorage.setItem('db_instructors', JSON.stringify(this.instructors));
        return true;
    },

    // Ders İşlemleri
    getAllCourses: function() {
        return this.courses;
    },
    getCoursesByDeptAndTerm: function(department, term) {
        if (!department || !term) return [];
        return this.courses.filter(c => c.department === department && c.term === term);
    },
    addCourse: function(department, term, codeName) {
        if (!department || !term || !codeName) return false;
        const exists = this.courses.some(c => c.department === department && c.term === term && c.codeName === codeName);
        if (exists) return false;

        const newCourse = {
            id: 'c-' + Date.now(),
            department: department,
            term: term,
            codeName: codeName
        };
        this.courses.push(newCourse);
        localStorage.setItem('db_courses', JSON.stringify(this.courses));
        return true;
    },
    deleteCourse: function(id) {
        this.courses = this.courses.filter(c => c.id !== id);
        localStorage.setItem('db_courses', JSON.stringify(this.courses));
        return true;
    },

    // Yeni Öğrenci Uygulama Başvurusu Kaydet
    saveStudentApplication: function(data) {
        const record = {
            id: data.id || 'APP-' + Date.now(),
            isTrash: false,
            ...data,
            tetkikDegerlendirmeDurumu: 'Sonuç bekleniyor',
            asiListesineDahilMi: 'Hayır',
            vaccineDoses: [],
            documentsStatus: {
                isgCertificate: { status: 'Bekliyor', date: data.doc1_date || null, fileName: data.doc1_file_name || null, fileUrl: data.doc1_file_url || null },
                medicalForm: { status: 'Bekliyor', date: data.doc2_examDate || null, expiryDate: data.doc2_expiryDate || null, fileName: data.doc2_file_name || null, fileUrl: data.doc2_file_url || null },
                privacyAgreement: { status: 'Bekliyor', physicalCount: data.doc3_physicalCount || 0, fileName: data.doc3_file_name || null, fileUrl: data.doc3_file_url || null },
                idCard: { status: 'Bekliyor', fileName: data.doc4_file_name || null, fileUrl: data.doc4_file_url || null },
                hemogram: { status: 'Bekliyor', date: data.doc5_date || null, fileName: data.doc5_file_name || null, fileUrl: data.doc5_file_url || null },
                elisa: { status: 'Bekliyor', date: data.doc6_date || null, fileName: data.doc6_file_name || null, fileUrl: data.doc6_file_url || null },
                chestXray: { status: 'Bekliyor', date: data.doc7_date || null, fileName: data.doc7_file_name || null, fileUrl: data.doc7_file_url || null },
                hepatitisTest: { status: data.hepatitisTested === 'Evet' ? 'Bekliyor' : 'Yüklenmedi', date: data.hepatitisTestDate || null, fileName: data.hepatitisTest_file_name || null, fileUrl: data.hepatitisTest_file_url || null },
                vaccineCard: { status: data.vaccineCard_file_name ? 'Bekliyor' : 'Yüklenmedi', fileName: data.vaccineCard_file_name || null, fileUrl: data.vaccineCard_file_url || null }
            },
            createdAt: new Date().toISOString()
        };

        this.applications.push(record);
        this.saveApplicationsToStorage();
        console.log('[DB] Yeni başvuru kaydedildi:', record);
        return record;
    },

    // Tüm Başvuruları Getir
    getAllApplications: function() {
        return this.applications;
    },

    saveApplicationsToStorage: function() {
        localStorage.setItem('db_applications', JSON.stringify(this.applications));
    },

    // Toplu Onaylama
    bulkApproveApplication: function(studentId) {
        const app = this.applications.find(a => a.id === studentId);
        if (app && app.documentsStatus) {
            Object.keys(app.documentsStatus).forEach(k => {
                if (app.documentsStatus[k].fileName || app.documentsStatus[k].date || app.documentsStatus[k].status !== 'Yüklenmedi') {
                    app.documentsStatus[k].status = 'Onaylandı';
                    delete app.documentsStatus[k].rejectionReason;
                }
            });
            this.saveApplicationsToStorage();
            return true;
        }
        return false;
    },

    // Toplu Reddetme ve Çöp Kutusuna Gönderme
    bulkRejectApplication: function(studentId, reason) {
        const app = this.applications.find(a => a.id === studentId);
        if (app) {
            app.isTrash = true;
            app.rejectionReason = reason || 'Belgeler uygun görülmedi.';
            if (app.documentsStatus) {
                Object.keys(app.documentsStatus).forEach(k => {
                    app.documentsStatus[k].status = 'Reddedildi';
                    app.documentsStatus[k].rejectionReason = reason || 'Belge uygun görülmedi.';
                });
            }
            this.saveApplicationsToStorage();
            return true;
        }
        return false;
    },

    // Çöp Kutusundan Geri Yükle
    restoreApplication: function(studentId) {
        const app = this.applications.find(a => a.id === studentId);
        if (app) {
            app.isTrash = false;
            delete app.rejectionReason;
            if (app.documentsStatus) {
                Object.keys(app.documentsStatus).forEach(k => {
                    app.documentsStatus[k].status = 'Bekliyor';
                    delete app.documentsStatus[k].rejectionReason;
                });
            }
            this.saveApplicationsToStorage();
            return true;
        }
        return false;
    },

    // Kalıcı Olarak Sil
    deletePermanently: function(studentId) {
        this.applications = this.applications.filter(a => a.id !== studentId);
        this.saveApplicationsToStorage();
        return true;
    }
};

// Sayfa ilk açıldığında varsayılan verileri localStorage'a kaydet
if (!localStorage.getItem('db_applications')) {
    localStorage.setItem('db_applications', JSON.stringify(window.AppDB.applications));
}
if (!localStorage.getItem('db_advisors')) {
    localStorage.setItem('db_advisors', JSON.stringify(window.AppDB.advisors));
}
if (!localStorage.getItem('db_instructors')) {
    localStorage.setItem('db_instructors', JSON.stringify(window.AppDB.instructors));
}
if (!localStorage.getItem('db_courses')) {
    localStorage.setItem('db_courses', JSON.stringify(window.AppDB.courses));
}

// IndexedDB Dosya Depolama Sistemi (5MB Sınırını Aşmak İçin)
window.FileStorage = {
    dbName: 'StudentEvrakStorage',
    dbVersion: 1,
    storeName: 'files',
    db: null,

    init: function() {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve(this.db);
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    },

    saveFile: function(key, fileData) {
        return this.init().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(fileData, key);
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });
        });
    },

    getFile: function(key) {
        return this.init().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);
                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = (event) => reject(event.target.error);
            });
        });
    },

    deleteFile: function(key) {
        return this.init().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });
        });
    },

    clearAll: function() {
        return this.init().then(() => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });
        });
    }
};

// IndexedDB Başlat
window.FileStorage.init().catch(console.error);
