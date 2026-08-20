/**
 * ==========================================================================
 * Veri Tabanı & Veri Şeması Modelleri - db.js
 * ==========================================================================
 */

window.AppDB = {
    // Öğrenci Başvuruları Koleksiyonu
    applications: JSON.parse(localStorage.getItem('db_applications') || '[]'),

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
            id: 'APP-' + Date.now(),
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
if (!localStorage.getItem('db_advisors')) {
    localStorage.setItem('db_advisors', JSON.stringify(window.AppDB.advisors));
}
if (!localStorage.getItem('db_instructors')) {
    localStorage.setItem('db_instructors', JSON.stringify(window.AppDB.instructors));
}
if (!localStorage.getItem('db_courses')) {
    localStorage.setItem('db_courses', JSON.stringify(window.AppDB.courses));
}
