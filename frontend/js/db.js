/**
 * ==========================================================================
 * Mock Veri Tabanı & Veri Şeması Modelleri - db.js
 * Geliştirici 2 Sorumluluk Alanı (Backend / Database)
 * ==========================================================================
 */

window.AppDB = {
    // Öğrenci Başvuruları Koleksiyonu
    applications: JSON.parse(localStorage.getItem('db_applications') || '[]'),

    // Yeni Öğrenci Uygulama Başvurusu Kaydet
    saveStudentApplication: function(data) {
        const record = {
            id: 'APP-' + Date.now(),
            ...data,
            documentsStatus: {
                isgCertificate: { status: 'Bekliyor', date: data.doc1_date || null },
                medicalForm: { status: 'Bekliyor', date: data.doc2_examDate || null, expiryDate: data.doc2_expiryDate || null },
                privacyAgreement: { status: 'Bekliyor', physicalCount: data.doc3_physicalCount || 0 },
                idCard: { status: 'Bekliyor' },
                hemogram: { status: 'Bekliyor', date: data.doc5_date || null },
                elisa: { status: 'Bekliyor', date: data.doc6_date || null },
                chestXray: { status: 'Bekliyor', date: data.doc7_date || null }
            },
            createdAt: new Date().toISOString()
        };

        this.applications.push(record);
        localStorage.setItem('db_applications', JSON.stringify(this.applications));
        console.log('[DB] Yeni başvuru kaydedildi:', record);
        return record;
    },

    // Tüm Başvuruları Getir
    getAllApplications: function() {
        return this.applications;
    }
};
