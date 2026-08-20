(function() {
/**
 * Öğrenci Uygulama Evrakları ve Sağlık/Aşılama Takip Sistemi
 * 3. Geliştirici: Akademik Danışman Form Takip ve Onay Ekranı
 */

// Global Veri Tabanı Yardımcısı (Öğrencilerin gönderdiği formları okur)
const getDB = () => {
    let db = localStorage.getItem('ogrenci_takip_db');
    if (db) {
        try {
            let parsed = JSON.parse(db);
            if (parsed.length > 0 && !parsed[0].hasOwnProperty('reviewStatus')) {
                localStorage.removeItem('ogrenci_takip_db');
                db = null;
            }
        } catch(e) {
            localStorage.removeItem('ogrenci_takip_db');
            db = null;
        }
    }
    if (!db) {
        // Varsayılan mock başvurular (Öğrencilerin gönderdiği formlar simülasyonu)
        const mockStudents = [
            {
                id: "2026001",
                name: "Zeynep Yılmaz",
                department: "Hemşirelik",
                class: "3",
                phone: "0555-123-4567",
                email: "zeynep.yilmaz@ogr.edu.tr",
                advisor: "Dr. Ahmet Kaya",
                academicYear: "2026-2027",
                semester: "Güz",
                courseCode: "HEM301",
                institution: "Şehir Hastanesi",
                unit: "Kardiyoloji",
                days: ["Pazartesi", "Salı"],
                instructor: "Doç. Dr. Ayşe Can",
                submissionDate: "2026-08-20",
                reviewStatus: "Yeni Başvuru", // Yeni Başvuru, Eksik Belgeli, Onaylandı
                documents: {
                    isg: { file: "isg_belgesi.pdf", date: "2026-01-10", uploadDate: "2026-08-15", status: "Bekliyor" },
                    muayene: { file: "muayene_formu.pdf", date: "2026-08-01", validityEnd: "2027-08-01", status: "Bekliyor" },
                    gizlilik: { file: "gizlilik_sozlesmesi.pdf", date: "2026-08-14", uploadDate: "2026-08-14", physicalCount: 0, status: "Bekliyor" },
                    kimlik: { file: "kimlik_fotokopisi.jpg", date: "2026-08-15", uploadDate: "2026-08-15", status: "Bekliyor" },
                    hemogram: { file: "hemogram.pdf", date: "2026-08-10", uploadDate: "2026-08-10", status: "Bekliyor" },
                    elisa: { file: "elisa_raporu.pdf", date: "2026-08-10", uploadDate: "2026-08-10", status: "Bekliyor" },
                    akciger: { file: "akciger_grafisi.pdf", date: "2026-08-10", uploadDate: "2026-08-10", status: "Bekliyor" }
                },
                health: {
                    hepatitisTestDone: true,
                    testDate: "2026-08-10",
                    testFile: "elisa_raporu.pdf",
                    evaluationStatus: "Sonuç bekleniyor",
                    inVaccineList: false,
                    doses: []
                }
            },
            {
                id: "2026002",
                name: "Can Demir",
                department: "Ebelik",
                class: "4",
                phone: "0532-987-6543",
                email: "can.demir@ogr.edu.tr",
                advisor: "Dr. Ahmet Kaya",
                academicYear: "2026-2027",
                semester: "Güz",
                courseCode: "EBE402",
                institution: "Zeynep Kamil Hastanesi",
                unit: "Doğumhane",
                days: ["Çarşamba", "Perşembe"],
                instructor: "Doç. Dr. Fatma Şen",
                submissionDate: "2026-08-18",
                reviewStatus: "Eksik Belgeli",
                documents: {
                    isg: { file: "isg_belgesi.pdf", date: "2025-11-20", uploadDate: "2026-08-10", status: "Uygun" },
                    muayene: { file: "muayene_formu.pdf", date: "2025-05-10", validityEnd: "2026-05-10", status: "Eksik-Hatalı", note: "Muayene geçerlilik süresi dolmuş." },
                    gizlilik: { file: "gizlilik_sozlesmesi.pdf", date: "2026-08-11", uploadDate: "2026-08-11", physicalCount: 2, status: "Uygun" },
                    kimlik: { file: "", date: "", uploadDate: "", status: "Yüklenmedi" },
                    hemogram: { file: "", date: "", uploadDate: "", status: "Yüklenmedi" },
                    elisa: { file: "", date: "", uploadDate: "", status: "Yüklenmedi" },
                    akciger: { file: "", date: "", uploadDate: "", status: "Yüklenmedi" }
                },
                health: {
                    hepatitisTestDone: false,
                    testDate: "",
                    testFile: "",
                    evaluationStatus: "Sonuç Bekleniyor",
                    inVaccineList: false,
                    doses: []
                }
            }
        ];
        localStorage.setItem('ogrenci_takip_db', JSON.stringify(mockStudents));
        db = localStorage.getItem('ogrenci_takip_db');
    }
    return JSON.parse(db);
};

const saveDB = (data) => {
    localStorage.setItem('ogrenci_takip_db', JSON.stringify(data));
};

let activeStudentId = null;

window.initDanismanPortali = function(container) {
    injectStyles();

    container.innerHTML = `
        <div class="form-tracking-layout">
            <!-- Sol Sütun: Gelen Form Başvuruları Listesi -->
            <aside class="inbox-panel glass-card animate-fade-in">
                <div class="inbox-header">
                    <h2>📥 Gelen Öğrenci Formları</h2>
                    <span class="inbox-count" id="lbl-inbox-count">0 Başvuru</span>
                </div>
                <div class="inbox-search">
                    <input type="text" id="inbox-search-input" placeholder="Öğrenci Adı veya No Ara...">
                </div>
                <ul class="inbox-list" id="inbox-student-list">
                    <!-- Başvuru listesi buraya eklenecek -->
                </ul>
            </aside>

            <!-- Sağ Sütun: Form Detayları ve Onay Paneli -->
            <main class="details-panel glass-card animate-fade-in" id="form-details-pane">
                <div class="empty-state">
                    <span>📝</span>
                    <h3>Başvuru Formu İnceleme</h3>
                    <p>Detayları görmek, evrakları onaylamak ve işlem yapmak için soldaki gelen kutusundan bir öğrenci formu seçin.</p>
                </div>
            </main>
        </div>
    `;

    // Arama dinleyicisi
    document.getElementById('inbox-search-input').addEventListener('input', renderInboxList);

    // Listeyi yükle
    renderInboxList();
};

// Gelen Kutusu Listesini Yükle
function renderInboxList() {
    const students = getDB();
    // Giriş yapan Dr. Ahmet Kaya'nın öğrencilerini filtrele
    const myStudents = students.filter(s => s.advisor === "Dr. Ahmet Kaya");
    
    const searchQuery = document.getElementById('inbox-search-input').value.toLowerCase();
    const filtered = myStudents.filter(s => s.name.toLowerCase().includes(searchQuery) || s.id.includes(searchQuery));
    
    document.getElementById('lbl-inbox-count').innerText = `${filtered.length} Başvuru`;
    
    const listContainer = document.getElementById('inbox-student-list');
    listContainer.innerHTML = '';

    if (filtered.length === 0) {
        listContainer.innerHTML = '<li class="no-inbox-item">Arama kriterlerine uygun form bulunamadı.</li>';
        return;
    }

    filtered.forEach(s => {
        const li = document.createElement('li');
        li.className = `inbox-item ${activeStudentId === s.id ? 'active' : ''}`;
        
        let statusClass = 'status-new';
        if (s.reviewStatus === 'Eksik Belgeli') statusClass = 'status-err';
        if (s.reviewStatus === 'Onaylandı') statusClass = 'status-ok';

        li.innerHTML = `
            <div class="inbox-item-header">
                <strong class="student-name">${s.name}</strong>
                <span class="status-dot-badge ${statusClass}">${s.reviewStatus}</span>
            </div>
            <div class="inbox-item-body">
                <span>No: ${s.id} | Bölüm: ${s.department}</span>
                <small class="submission-date">Gönderim: ${s.submissionDate || 'Bilinmiyor'}</small>
            </div>
        `;

        li.addEventListener('click', () => {
            activeStudentId = s.id;
            // Aktif sınıfını güncelle
            document.querySelectorAll('.inbox-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            
            loadStudentFormDetails(s.id);
        });

        listContainer.appendChild(li);
    });

    // Eğer aktif bir öğrenci varsa ve listede hala varsa detay panelini güncel tut
    if (activeStudentId && filtered.find(s => s.id === activeStudentId)) {
        loadStudentFormDetails(activeStudentId);
    }
}

// Seçilen formun tüm detaylarını sağ panele yükler
function loadStudentFormDetails(studentId) {
    const student = getDB().find(s => s.id === studentId);
    const pane = document.getElementById('form-details-pane');
    if (!student) return;

    pane.innerHTML = `
        <div class="details-wrapper animate-fade-in">
            <header class="details-header">
                <div>
                    <h2>${student.name} - Başvuru Formu</h2>
                    <span class="student-no-badge">Öğrenci Numarası: ${student.id}</span>
                </div>
                <div class="overall-status-box">
                    <label>Genel Onay Durumu:</label>
                    <span class="overall-status-badge ${student.reviewStatus === 'Onaylandı' ? 'green' : (student.reviewStatus === 'Eksik Belgeli' ? 'red' : 'yellow')}">${student.reviewStatus}</span>
                </div>
            </header>

            <div class="details-grid">
                <!-- Kart 1: Öğrenci Temel Bilgileri (Table 1 & 2) -->
                <section class="details-section">
                    <h3>📋 1. Başvuru ve Kurum Bilgileri</h3>
                    <div class="details-info-table">
                        <div class="info-row"><span class="lbl">T.C. Kimlik:</span> <span class="val">${student.id} (Maskeli)</span></div>
                        <div class="info-row"><span class="lbl">Bölüm / Sınıf:</span> <span class="val">${student.department} / ${student.class}. Sınıf</span></div>
                        <div class="info-row"><span class="lbl">Telefon / E-Posta:</span> <span class="val">${student.phone} / ${student.email}</span></div>
                        <div class="info-row"><span class="lbl">Ders Kodu / Adı:</span> <span class="val">${student.courseCode}</span></div>
                        <div class="info-row"><span class="lbl">Uygulama Kurumu:</span> <span class="val">${student.institution}</span></div>
                        <div class="info-row"><span class="lbl">Uygulama Birimi / Günleri:</span> <span class="val">${student.unit || 'Belirtilmemiş'} / ${student.days.join(', ')}</span></div>
                        <div class="info-row"><span class="lbl">Sorumlu Öğretim El.:</span> <span class="val">${student.instructor}</span></div>
                    </div>
                </section>

                <!-- Kart 2: Yüklenen Evraklar Formu (Table 3) -->
                <section class="details-section">
                    <h3>📂 2. Evrak Değerlendirme ve Onay Formu</h3>
                    <div class="docs-form-list" id="docs-form-list-container">
                        <!-- Evrak satırları dinamik yerleştirilecek -->
                    </div>
                </section>
            </div>

            <!-- Kaydetme ve Durum Atama Paneli -->
            <footer class="details-footer">
                <div class="review-status-selection">
                    <label for="overall-review-status">Genel Başvuru Sonucu:</label>
                    <select id="overall-review-status" class="details-select-input">
                        <option value="Yeni Başvuru" ${student.reviewStatus === 'Yeni Başvuru' ? 'selected' : ''}>⏳ Yeni Başvuru (İncelemede)</option>
                        <option value="Eksik Belgeli" ${student.reviewStatus === 'Eksik Belgeli' ? 'selected' : ''}>❌ Eksik Belgeli (Düzeltme İstendi)</option>
                        <option value="Onaylandı" ${student.reviewStatus === 'Onaylandı' ? 'selected' : ''}>✅ Form Onaylandı (Staja Uygundur)</option>
                    </select>
                </div>
                <button class="btn-save-details" id="btn-save-evaluation">Değerlendirmeyi Kaydet</button>
            </footer>
        </div>
    `;

    // Evrak form satırlarını oluştur
    const docsContainer = document.getElementById('docs-form-list-container');
    const docLabels = {
        isg: "16 Saatlik İSG Eğitim Belgesi",
        muayene: "İşe Giriş / Periyodik Muayene Formu",
        gizlilik: "Gizlilik Sözleşmesi Belgesi",
        kimlik: "Kimlik Fotokopisi",
        hemogram: "Hemogram Raporu",
        elisa: "ELISA Raporu",
        akciger: "Akciğer Grafisi"
    };

    Object.keys(student.documents).forEach(key => {
        const doc = student.documents[key];
        const item = document.createElement('div');
        item.className = `doc-form-item ${doc.status === 'Bekliyor' ? 'pending-alert' : ''}`;

        let docMetaHTML = '';
        
        if (key === 'muayene') {
            docMetaHTML = `
                <div class="doc-meta-row">
                    <div class="meta-field"><label>Muayene Tarihi:</label> <input type="date" id="date-muayene" class="small-meta-input" value="${doc.date || ''}"></div>
                    <div class="meta-field"><label>Geçerlilik Bitiş (1 Yıl):</label> <input type="date" id="valid-muayene" class="small-meta-input" value="${doc.validityEnd || ''}"></div>
                </div>
            `;
        }

        if (key === 'gizlilik') {
            docMetaHTML = `
                <div class="doc-meta-row">
                    <div class="meta-field"><label>Fiziksel Kopya Teslim Adedi:</label> <input type="number" id="physical-gizlilik" class="small-meta-input count-input" value="${doc.physicalCount || 0}" min="0"></div>
                </div>
            `;
        }

        if (['hemogram', 'elisa', 'akciger'].includes(key)) {
            docMetaHTML = `
                <div class="doc-meta-row">
                    <div class="meta-field"><label>Tetkik Tarihi:</label> <input type="date" id="date-${key}" class="small-meta-input" value="${doc.date || ''}"></div>
                </div>
            `;
        }

        item.innerHTML = `
            <div class="doc-form-row-header">
                <div class="doc-info-block">
                    <span class="file-icon-span">${doc.file ? '📕' : '❌'}</span>
                    <div class="file-info-text">
                        <strong>${docLabels[key]}</strong>
                        <span class="file-name-sub">${doc.file ? `📄 ${doc.file}` : 'Dosya yüklenmedi'}</span>
                    </div>
                </div>
                <div class="doc-action-block">
                    ${doc.file ? `<button class="btn-text-preview" onclick="alert('${doc.file} dosyası açılıyor...'); return false;">👁 Önizle</button>` : ''}
                    <select class="doc-status-select-form" data-key="${key}">
                        <option value="Yüklenmedi" ${doc.status === 'Yüklenmedi' ? 'selected' : ''} disabled>Yüklenmedi</option>
                        <option value="Bekliyor" ${doc.status === 'Bekliyor' ? 'selected' : ''}>⏳ Bekliyor</option>
                        <option value="Uygun" ${doc.status === 'Uygun' ? 'selected' : ''}>✓ Uygun</option>
                        <option value="Eksik-Hatalı" ${doc.status === 'Eksik-Hatalı' ? 'selected' : ''}>⚠ Eksik-Hatalı</option>
                    </select>
                </div>
            </div>
            ${docMetaHTML}
            <div class="doc-error-input-wrapper ${doc.status === 'Eksik-Hatalı' ? '' : 'hidden'}" id="error-input-div-${key}">
                <input type="text" id="note-${key}" class="doc-error-input-field" placeholder="Lütfen eksiklik/red nedenini belirtin..." value="${doc.note || ''}">
            </div>
        `;

        const select = item.querySelector('.doc-status-select-form');
        select.addEventListener('change', (e) => {
            const errDiv = document.getElementById(`error-input-div-${key}`);
            if (e.target.value === 'Eksik-Hatalı') {
                errDiv.classList.remove('hidden');
                errDiv.querySelector('input').focus();
            } else {
                errDiv.classList.add('hidden');
            }
        });

        docsContainer.appendChild(item);
    });

    // Kaydetme Etkinliğini Bağla
    document.getElementById('btn-save-evaluation').addEventListener('click', saveEvaluationData);
}

// Değerlendirme Verilerini Kaydet
function saveEvaluationData() {
    if (!activeStudentId) return;

    const students = getDB();
    const studentIndex = students.findIndex(s => s.id === activeStudentId);
    if (studentIndex === -1) return;

    const student = students[studentIndex];
    const docSelects = document.querySelectorAll('.doc-status-select-form');

    docSelects.forEach(select => {
        const key = select.getAttribute('data-key');
        const status = select.value;

        student.documents[key].status = status;

        if (status === 'Eksik-Hatalı') {
            const noteInput = document.getElementById(`note-${key}`);
            student.documents[key].note = noteInput ? noteInput.value : '';
        } else {
            delete student.documents[key].note;
        }

        // Özel Alanlar
        if (key === 'muayene') {
            student.documents.muayene.date = document.getElementById('date-muayene').value;
            student.documents.muayene.validityEnd = document.getElementById('valid-muayene').value;
        }
        if (key === 'gizlilik') {
            const physicalCount = document.getElementById('physical-gizlilik').value;
            student.documents.gizlilik.physicalCount = parseInt(physicalCount) || 0;
        }
        if (['hemogram', 'elisa', 'akciger'].includes(key)) {
            student.documents[key].date = document.getElementById(`date-${key}`).value;
        }
    });

    // Genel onay durumunu kaydet
    student.reviewStatus = document.getElementById('overall-review-status').value;

    students[studentIndex] = student;
    saveDB(students);

    showToast(`${student.name} isimli öğrencinin başvuru formu güncellendi.`);
    renderInboxList(); // Listeyi güncelle
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert animate-slide-in-top';
    toast.innerHTML = `💬 ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.className = 'toast-alert animate-fade-out';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function injectStyles() {
    if (document.getElementById('danisman-inbox-styles')) return;

    const style = document.createElement('style');
    style.id = 'danisman-inbox-styles';
    style.innerHTML = `
        .form-tracking-layout {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 20px;
            font-family: 'Inter', sans-serif;
            color: #e2e8f0;
            max-width: 1300px;
            margin: 0 auto;
            padding: 20px 10px;
            height: calc(100vh - 120px);
            box-sizing: border-box;
        }
        @media (max-width: 900px) {
            .form-tracking-layout {
                grid-template-columns: 1fr;
                height: auto;
            }
        }

        .glass-card {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Gelen Kutusu Sol Sütun */
        .inbox-panel {
            border-right: 1px solid rgba(255,255,255,0.05);
        }
        .inbox-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
        }
        .inbox-header h2 { margin: 0; font-size: 1.15rem; color: #60a5fa; font-weight: 600; }
        .inbox-count { font-size: 0.75rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 3px 8px; border-radius: 10px; }
        
        .inbox-search input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(0,0,0,0.25);
            color: #fff;
            outline: none;
            font-size: 0.85rem;
            margin-bottom: 14px;
            box-sizing: border-box;
        }
        .inbox-search input:focus { border-color: #3b82f6; }

        .inbox-list {
            list-style: none;
            padding: 0;
            margin: 0;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .inbox-item {
            padding: 12px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .inbox-item:hover { background: rgba(59,130,246,0.05); border-color: rgba(59,130,246,0.15); }
        .inbox-item.active { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.35); }
        
        .inbox-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .student-name { font-size: 0.9rem; color: #fff; }
        .status-dot-badge {
            font-size: 0.7rem;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
        }
        .status-new { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .status-err { background: rgba(239,68,68,0.15); color: #f87171; }
        .status-ok { background: rgba(16,185,129,0.15); color: #34d399; }

        .inbox-item-body {
            display: flex;
            flex-direction: column;
            font-size: 0.75rem;
            color: #94a3b8;
            gap: 4px;
        }
        .submission-date { color: #64748b; align-self: flex-end; }
        
        .no-inbox-item { text-align: center; color: #64748b; padding: 20px 0; font-size: 0.8rem; }

        /* Sağ Detay Paneli */
        .details-panel {
            overflow-y: auto;
        }
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #64748b;
            text-align: center;
        }
        .empty-state span { font-size: 3rem; display: block; margin-bottom: 12px; }
        .empty-state h3 { margin: 0 0 6px 0; color: #94a3b8; }
        .empty-state p { font-size: 0.85rem; max-width: 320px; margin: 0; }

        .details-wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: 100%;
        }
        .details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding-bottom: 14px;
        }
        .details-header h2 { margin: 0; font-size: 1.4rem; color: #fff; }
        .student-no-badge { font-family: monospace; font-size: 0.8rem; color: #3b82f6; }
        .overall-status-box { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .overall-status-box label { font-size: 0.75rem; color: #64748b; }
        
        .overall-status-badge {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
        }
        .overall-status-badge.green { background: rgba(16,185,129,0.15); color: #34d399; }
        .overall-status-badge.yellow { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .overall-status-badge.red { background: rgba(239,68,68,0.15); color: #f87171; }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr;
            gap: 20px;
            flex: 1;
            overflow-y: auto;
            padding-right: 5px;
        }
        @media (max-width: 768px) {
            .details-grid { grid-template-columns: 1fr; }
        }

        .details-section {
            background: rgba(0,0,0,0.15);
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(255,255,255,0.02);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .details-section h3 { margin: 0 0 8px 0; font-size: 0.95rem; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }

        /* Bilgi Tablosu */
        .details-info-table { display: flex; flex-direction: column; gap: 10px; }
        .info-row { display: flex; justify-content: space-between; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 8px; }
        .info-row .lbl { color: #64748b; }
        .info-row .val { color: #e2e8f0; font-weight: 500; text-align: right; }

        /* Evrak Onay Formu Listesi */
        .docs-form-list { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
        .doc-form-item {
            background: rgba(15,23,42,0.4);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .doc-form-item.pending-alert { border-color: rgba(245,158,11,0.25); background: rgba(245,158,11,0.02); }
        .doc-form-row-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .doc-info-block { display: flex; align-items: center; gap: 10px; }
        .file-icon-span { font-size: 1.3rem; }
        .file-info-text { display: flex; flex-direction: column; }
        .file-info-text strong { font-size: 0.85rem; color: #fff; }
        .file-name-sub { font-size: 0.7rem; color: #64748b; margin-top: 1px; }

        .doc-action-block { display: flex; align-items: center; gap: 8px; }
        .btn-text-preview { background: rgba(255,255,255,0.05); color: #60a5fa; border: none; font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
        .doc-status-select-form { background: #1e293b; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer; outline: none; }

        .doc-meta-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; }
        .meta-field { display: flex; flex-direction: column; gap: 4px; }
        .meta-field label { font-size: 0.7rem; color: #94a3b8; }
        .small-meta-input { background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #fff; padding: 4px 6px; font-size: 0.75rem; outline: none; }
        .small-meta-input.count-input { width: 50px; }

        .doc-error-input-wrapper { display: flex; flex-direction: column; }
        .doc-error-input-field { background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.75rem; outline: none; width: 100%; box-sizing: border-box; }
        .doc-error-input-field:focus { border-color: #ef4444; }

        /* Kaydetme footerı */
        .details-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 14px;
            gap: 16px;
            flex-wrap: wrap;
        }
        .review-status-selection { display: flex; align-items: center; gap: 10px; }
        .review-status-selection label { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
        .details-select-input { background: #1e293b; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; cursor: pointer; outline: none; }
        
        .btn-save-details { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); transition: all 0.2s; }
        .btn-save-details:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35); }

        .toast-alert {
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(8px);
            border: 1px solid #3b82f6;
            color: #fff;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 2000;
        }

        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);
}
})();
