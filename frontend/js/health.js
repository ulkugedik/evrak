(function() {
/**
 * ==========================================================================
 * Sağlık ve Aşılama Takip Portalı Mantığı - health.js
 * Geliştirici 3 Sorumluluk Alanı (Hepatit & Aşı Takip Ekranları)
 * ==========================================================================
 */

// Global Veri Tabanı Yardımcısı (Geliştirici 1 & 2'nin db.js yapısıyla entegre)
const getDB = () => {
    let db = localStorage.getItem('db_applications');
    if (!db || JSON.parse(db).length === 0) {
        // Eğer veritabanı boş ise test edebilmek için mock başvurular ekleyelim (Danışman ile senkronize)
        const seedStudents = [
            {
                id: "APP-1700000000001",
                studentNo: "2026001",
                fullName: "Zeynep Yılmaz",
                department: "Hemşirelik",
                studentClass: "3. Sınıf",
                phone: "0555-123-4567",
                email: "zeynep.yilmaz@ogr.edu.tr",
                academicAdvisor: "Prof. Dr. Ahmet Yılmaz",
                academicYear: "2026-2027",
                term: "Güz",
                courseNameCode: "HEM301 - Klinik Hemşirelik Uygulaması I",
                institution: "Şehir Hastanesi",
                unitName: "Kardiyoloji",
                applicationDays: "Pazartesi, Salı",
                responsibleInstructor: "Prof. Dr. Fatma Yıldız",
                submissionDate: new Date().toISOString(),
                reviewStatus: "Yeni Başvuru",
                documentsStatus: {
                    isgCertificate: { status: "Bekliyor", date: "2026-01-10", file: "isg_belgesi.pdf" },
                    medicalForm: { status: "Bekliyor", date: "2026-08-01", expiryDate: "2027-08-01", file: "muayene_formu.pdf" },
                    privacyAgreement: { status: "Bekliyor", physicalCount: 0, file: "gizlilik_sozlesmesi.pdf" },
                    idCard: { status: "Bekliyor", file: "kimlik_fotokopisi.jpg" },
                    hemogram: { status: "Bekliyor", date: "2026-08-10", file: "hemogram.pdf" },
                    elisa: { status: "Bekliyor", date: "2026-08-10", file: "elisa_raporu.pdf" },
                    chestXray: { status: "Bekliyor", date: "2026-08-10", file: "akciger_grafisi.pdf" }
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
                id: "APP-1700000000002",
                studentNo: "2026002",
                fullName: "Can Demir",
                department: "Sağlık Yönetimi",
                studentClass: "4. Sınıf",
                phone: "0532-987-6543",
                email: "can.demir@ogr.edu.tr",
                academicAdvisor: "Prof. Dr. Ahmet Yılmaz",
                academicYear: "2026-2027",
                term: "Güz",
                courseNameCode: "HEM402 - İntörn Hemşirelik Sahası",
                institution: "Zeynep Kamil Hastanesi",
                unitName: "Doğumhane",
                applicationDays: "Çarşamba, Perşembe",
                responsibleInstructor: "Doç. Dr. Murat Can",
                submissionDate: new Date().toISOString(),
                reviewStatus: "Eksik Belgeli",
                documentsStatus: {
                    isgCertificate: { status: "Uygun", date: "2025-11-20", file: "isg_belgesi.pdf" },
                    medicalForm: { status: "Eksik-Hatalı", date: "2025-05-10", expiryDate: "2026-05-10", file: "muayene_formu.pdf", note: "Muayene geçerlilik süresi dolmuş." },
                    privacyAgreement: { status: "Uygun", physicalCount: 2, file: "gizlilik_sozlesmesi.pdf" },
                    idCard: { status: "Yüklenmedi", file: "" },
                    hemogram: { status: "Yüklenmedi", file: "" },
                    elisa: { status: "Yüklenmedi", file: "" },
                    chestXray: { status: "Yüklenmedi", file: "" }
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
        localStorage.setItem('db_applications', JSON.stringify(seedStudents));
        db = localStorage.getItem('db_applications');
    }
    return JSON.parse(db);
};

const saveDB = (data) => {
    localStorage.setItem('db_applications', JSON.stringify(data));
    if (window.AppDB) {
        window.AppDB.applications = data;
    }
};

let activeStudentId = null;
let currentTabFilter = "all";

window.initSaglikPortali = function(container) {
    injectStyles();

    container.innerHTML = `
        <div class="form-tracking-layout">
            <!-- Sol Sütun: Sağlık Formları Gelen Kutusu -->
            <aside class="inbox-panel glass-card">
                <div class="inbox-header">
                    <h2>🩺 Sağlık Onay Formları</h2>
                    <span class="inbox-count" id="lbl-health-count">0 Form</span>
                </div>
                <div class="inbox-tabs">
                    <button class="tab-btn active" id="tab-btn-all">Tümü</button>
                    <button class="tab-btn" id="tab-btn-pending">Tetkik Bekleyenler</button>
                    <button class="tab-btn" id="tab-btn-vaccine">Aşı Listesi</button>
                </div>
                <ul class="inbox-list" id="health-student-list">
                    <!-- Dinamik Öğrenci Listesi -->
                </ul>
            </aside>

            <!-- Sağ Sütun: Form Detayları ve Sağlık/Aşı Girişi -->
            <main class="details-panel glass-card" id="health-details-pane">
                <div class="empty-state">
                    <span>🩺</span>
                    <h3>Sağlık Formu İnceleme</h3>
                    <p>Öğrencinin Hepatit tetkik durumunu değerlendirmek ve aşı takvimini yönetmek için soldan bir form seçin.</p>
                </div>
            </main>
        </div>
    `;

    // Tab Dinleyicileri
    document.getElementById('tab-btn-all').addEventListener('click', () => switchTab('all'));
    document.getElementById('tab-btn-pending').addEventListener('click', () => switchTab('eval-pending'));
    document.getElementById('tab-btn-vaccine').addEventListener('click', () => switchTab('vaccine-list'));

    renderHealthInboxList();
};

function switchTab(tab) {
    currentTabFilter = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-btn-${tab === 'all' ? 'all' : (tab === 'eval-pending' ? 'pending' : 'vaccine')}`).classList.add('active');
    renderHealthInboxList();
}

function renderHealthInboxList() {
    const students = getDB();
    
    // Sağlık objesini güvenli bir şekilde initialize et
    students.forEach(s => {
        if (!s.health) {
            s.health = {
                hepatitisTestDone: false,
                testDate: "",
                testFile: s.documentsStatus?.elisa?.file || "",
                evaluationStatus: "Sonuç bekleniyor",
                inVaccineList: false,
                doses: []
            };
        }
    });

    let filtered = students;
    if (currentTabFilter === 'eval-pending') {
        filtered = students.filter(s => s.health.hepatitisTestDone && s.health.evaluationStatus === 'Sonuç bekleniyor');
    } else if (currentTabFilter === 'vaccine-list') {
        filtered = students.filter(s => s.health.inVaccineList);
    }

    document.getElementById('lbl-health-count').innerText = `${filtered.length} Öğrenci`;

    const listContainer = document.getElementById('health-student-list');
    listContainer.innerHTML = '';

    if (filtered.length === 0) {
        listContainer.innerHTML = '<li class="no-inbox-item">Listelenecek sağlık formu bulunamadı.</li>';
        return;
    }

    filtered.forEach(s => {
        const li = document.createElement('li');
        li.className = `inbox-item ${activeStudentId === s.id ? 'active' : ''}`;
        
        let statusClass = 'status-new';
        if (s.health.evaluationStatus === 'Bağışık') statusClass = 'status-ok';
        if (s.health.evaluationStatus === 'Aşı Gerekli') statusClass = 'status-err';

        li.innerHTML = `
            <div class="inbox-item-header">
                <strong class="student-name">${s.fullName}</strong>
                <span class="status-dot-badge ${statusClass}">${s.health.evaluationStatus}</span>
            </div>
            <div class="inbox-item-body">
                <span>No: ${s.studentNo} | Aşı Dozu: ${s.health.doses.length}</span>
                <small class="submission-date">Hepatit: ${s.health.hepatitisTestDone ? 'Tetkik Yapıldı' : 'Tetkik Yok'}</small>
            </div>
        `;

        li.addEventListener('click', () => {
            activeStudentId = s.id;
            document.querySelectorAll('.inbox-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            loadHealthFormDetails(s.id);
        });

        listContainer.appendChild(li);
    });

    if (activeStudentId && filtered.find(s => s.id === activeStudentId)) {
        loadHealthFormDetails(activeStudentId);
    }
}

function loadHealthFormDetails(studentId) {
    const student = getDB().find(s => s.id === studentId);
    const pane = document.getElementById('health-details-pane');
    if (!student) return;

    if (!student.health) {
        student.health = {
            hepatitisTestDone: false,
            testDate: "",
            testFile: student.documentsStatus?.elisa?.file || "",
            evaluationStatus: "Sonuç bekleniyor",
            inVaccineList: false,
            doses: []
        };
    }

    pane.innerHTML = `
        <div class="details-wrapper animate-fade-in">
            <header class="details-header">
                <div>
                    <h2>${student.fullName} - Sağlık Onay Formu</h2>
                    <span class="student-no-badge">Öğrenci No: ${student.studentNo} | Bölüm: ${student.department}</span>
                </div>
                <div class="overall-status-box">
                    <label>Aşı Listesi Durumu:</label>
                    <span class="overall-status-badge ${student.health.inVaccineList ? 'red' : 'green'}">${student.health.inVaccineList ? 'Aşı Gerekli (Listede)' : 'Aşı Gerekmiyor'}</span>
                </div>
            </header>

            <div class="details-grid">
                <!-- Kart 1: Hepatit Tetkik Değerlendirme Formu -->
                <section class="details-section">
                    <h3>🧬 1. Hepatit Tetkik Formu Değerlendirmesi</h3>
                    
                    <div class="form-group border-bottom-divider">
                        <label class="checkbox-container">
                            <input type="checkbox" id="chk-hepatit-done" ${student.health.hepatitisTestDone ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Hepatit Tetkiki Yapıldı mı?
                        </label>
                    </div>

                    <div id="hepatit-form-fields" class="${student.health.hepatitisTestDone ? '' : 'hidden'}">
                        <div class="input-field margin-bottom-12">
                            <label>Tetkik/Rapor Tarihi:</label>
                            <input type="date" id="input-tetkik-date" class="small-meta-input-full" value="${student.health.testDate || ''}">
                        </div>

                        <div class="input-field margin-bottom-12">
                            <label>Tetkik Rapor Dosyası:</label>
                            <div class="file-action-row">
                                <span class="file-name-text">${student.health.testFile || student.documentsStatus?.elisa?.file || '📄 elisa_raporu.pdf'}</span>
                                <button class="btn-text-preview" onclick="alert('Rapor dosyası açılıyor (Simülasyon)...'); return false;">👁 Önizle</button>
                            </div>
                        </div>

                        <div class="input-field margin-bottom-12">
                            <label for="select-eval-status">Tetkik Değerlendirme Sonucu:</label>
                            <select id="select-eval-status" class="details-select-input-full">
                                <option value="Sonuç bekleniyor" ${student.health.evaluationStatus === 'Sonuç bekleniyor' ? 'selected' : ''}>⏳ Sonuç Bekleniyor</option>
                                <option value="Bağışık" ${student.health.evaluationStatus === 'Bağışık' ? 'selected' : ''}>🛡️ Bağışık (Aşı Gerekmiyor)</option>
                                <option value="Aşı Gerekli" ${student.health.evaluationStatus === 'Aşı Gerekli' ? 'selected' : ''}>⚠ Aşı Gerekli (Listeye Al)</option>
                                <option value="Ek değerlendirme gerekli" ${student.health.evaluationStatus === 'Ek değerlendirme gerekli' ? 'selected' : ''}>🔎 Ek Değerlendirme Gerekli</option>
                            </select>
                        </div>

                        <div class="form-group margin-top-16">
                            <label class="checkbox-container">
                                <input type="checkbox" id="chk-vaccine-list-in" ${student.health.inVaccineList ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Aşı Listesine Dahil mi?
                            </label>
                        </div>
                    </div>

                    <button class="btn-save-details margin-top-12" id="btn-save-health-eval">Değerlendirmeyi Forma Kaydet</button>
                </section>

                <!-- Kart 2: Aşı Takvimi ve Doz Girişi Formu -->
                <section class="details-section" id="vaccine-timeline-card">
                    <h3>💉 2. Aşı Doz Takip Formu</h3>
                    
                    <div class="doses-table-box">
                        <label>Öğrenci Aşı Geçmişi:</label>
                        <div id="doses-table-container-form">
                            <!-- Tablo eklenecek -->
                        </div>
                    </div>

                    <!-- Yeni Doz Ekleme -->
                    <div class="new-dose-form-box">
                        <h4>➕ Yeni Doz Kaydı Ekle</h4>
                        <div class="form-row-2">
                            <div class="input-field">
                                <label>Doz Sırası:</label>
                                <select id="new-dose-no-val" class="details-select-input-full">
                                    <option value="1">1. Doz</option>
                                    <option value="2">2. Doz</option>
                                    <option value="3">3. Doz</option>
                                    <option value="Ek Doz">Ek Doz (Hatırlatma)</option>
                                </select>
                            </div>
                            <div class="input-field">
                                <label>Aşı Tarihi:</label>
                                <input type="date" id="new-dose-date-val" class="small-meta-input-full" value="${new Date().toISOString().substring(0, 10)}">
                            </div>
                        </div>

                        <div class="form-row-2 margin-top-8">
                            <div class="input-field">
                                <label>Yapıldığı Kurum:</label>
                                <select id="new-dose-inst-val" class="details-select-input-full">
                                    <option value="İl Sağlık Müdürlüğü">İl Sağlık Müdürlüğü</option>
                                    <option value="Aile Sağlığı Merkezi (ASM)">Aile Sağlığı Merkezi (ASM)</option>
                                    <option value="Üniversite Hastanesi">Üniversite Hastanesi</option>
                                    <option value="Şehir Hastanesi">Şehir Hastanesi</option>
                                </select>
                            </div>
                            <div class="input-field">
                                <label>Aşı Kart Onay Durumu:</label>
                                <select id="new-dose-status-val" class="details-select-input-full">
                                    <option value="Bekliyor">Onay Bekliyor</option>
                                    <option value="Uygun">Uygun</option>
                                    <option value="Eksik-Hatalı">Eksik-Hatalı</option>
                                </select>
                            </div>
                        </div>

                        <button class="btn-save-details btn-secondary-form margin-top-12" id="btn-add-dose-val">Doz Bilgisini Forma Ekle</button>
                    </div>
                </section>
            </div>
        </div>
    `;

    document.getElementById('chk-hepatit-done').addEventListener('change', (e) => {
        const fields = document.getElementById('hepatit-form-fields');
        if (e.target.checked) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    });

    document.getElementById('select-eval-status').addEventListener('change', (e) => {
        const chkList = document.getElementById('chk-vaccine-list-in');
        if (e.target.value === 'Aşı Gerekli') {
            chkList.checked = true;
        }
    });

    renderDosesList(student.health.doses);

    const vaccineCard = document.getElementById('vaccine-timeline-card');
    if (student.health.inVaccineList || student.health.doses.length > 0) {
        vaccineCard.classList.remove('hidden');
    } else {
        vaccineCard.classList.add('hidden');
    }

    document.getElementById('btn-save-health-eval').addEventListener('click', saveHepatitEvaluation);
    document.getElementById('btn-add-dose-val').addEventListener('click', addNewDose);
}

function renderDosesList(doses) {
    const container = document.getElementById('doses-table-container-form');
    if (doses.length === 0) {
        container.innerHTML = `<p class="no-doses-msg">Kayıtlı aşı dozu bulunamadı.</p>`;
        return;
    }

    let rowsHTML = '';
    doses.forEach((dose, index) => {
        rowsHTML += `
            <tr>
                <td><strong>${dose.doseNo}. Doz</strong></td>
                <td>${dose.date}</td>
                <td>${dose.institution}</td>
                <td>
                    <select class="form-inline-status-dose" data-index="${index}">
                        <option value="Bekliyor" ${dose.status === 'Bekliyor' ? 'selected' : ''}>Onay Bekliyor</option>
                        <option value="Uygun" ${dose.status === 'Uygun' ? 'selected' : ''}>Uygun</option>
                        <option value="Eksik-Hatalı" ${dose.status === 'Eksik-Hatalı' ? 'selected' : ''}>Eksik-Hatalı</option>
                    </select>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <table class="doses-table-form">
            <thead>
                <tr>
                    <th>Doz</th>
                    <th>Tarih</th>
                    <th>Kurum</th>
                    <th>Onay</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;

    container.querySelectorAll('.form-inline-status-dose').forEach(select => {
        select.addEventListener('change', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            updateDoseStatus(index, e.target.value);
        });
    });
}

function updateDoseStatus(index, newStatus) {
    const students = getDB();
    const studentIndex = students.findIndex(s => s.id === activeStudentId);
    if (studentIndex === -1) return;

    students[studentIndex].health.doses[index].status = newStatus;
    saveDB(students);

    showToast(`Aşı dozu durumu '${newStatus}' olarak kaydedildi.`);
    renderHealthInboxList();
}

function saveHepatitEvaluation() {
    const students = getDB();
    const studentIndex = students.findIndex(s => s.id === activeStudentId);
    if (studentIndex === -1) return;

    const student = students[studentIndex];
    const testDone = document.getElementById('chk-hepatit-done').checked;

    student.health.hepatitisTestDone = testDone;

    if (testDone) {
        student.health.testDate = document.getElementById('input-tetkik-date').value;
        student.health.evaluationStatus = document.getElementById('select-eval-status').value;
        student.health.inVaccineList = document.getElementById('chk-vaccine-list-in').checked;
    } else {
        student.health.testDate = "";
        student.health.evaluationStatus = "Sonuç bekleniyor";
        student.health.inVaccineList = false;
        student.health.doses = [];
    }

    students[studentIndex] = student;
    saveDB(students);

    showToast(`${student.fullName} için Hepatit sağlık bilgileri güncellendi.`);
    renderHealthInboxList();
}

function addNewDose() {
    const students = getDB();
    const studentIndex = students.findIndex(s => s.id === activeStudentId);
    if (studentIndex === -1) return;

    const student = students[studentIndex];
    const doseNo = document.getElementById('new-dose-no-val').value;
    const date = document.getElementById('new-dose-date-val').value;
    const inst = document.getElementById('new-dose-inst-val').value;
    const status = document.getElementById('new-dose-status-val').value;

    const newDose = {
        doseNo: doseNo,
        date: date,
        institution: inst,
        file: "asi_kart_belgesi.pdf",
        status: status
    };

    student.health.doses.push(newDose);
    students[studentIndex] = student;
    saveDB(students);

    showToast(`${student.fullName} için ${doseNo}. Doz aşı formu eklendi.`);
    renderHealthInboxList();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert';
    toast.innerHTML = `💬 ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function injectStyles() {
    if (document.getElementById('saglik-inbox-styles')) return;

    const style = document.createElement('style');
    style.id = 'saglik-inbox-styles';
    style.innerHTML = `
        .form-tracking-layout {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 20px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #e2e8f0;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px 0;
            height: 700px;
            box-sizing: border-box;
        }
        @media (max-width: 900px) {
            .form-tracking-layout {
                grid-template-columns: 1fr;
                height: auto;
            }
        }

        .glass-card {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Sekmeler (Tabs) */
        .inbox-tabs {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 4px;
            margin-bottom: 12px;
            background: rgba(0,0,0,0.2);
            padding: 4px;
            border-radius: 8px;
        }
        .tab-btn {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 0.72rem;
            padding: 8px 4px;
            cursor: pointer;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s;
            text-align: center;
        }
        .tab-btn.active {
            background: #10b981;
            color: #fff;
        }

        /* Gelen Kutusu */
        .inbox-panel {
            border-right: 1px solid rgba(255,255,255,0.05);
        }
        .inbox-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
        }
        .inbox-header h2 { margin: 0; font-size: 1.15rem; color: #10b981; font-weight: 600; }
        .inbox-count { font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 3px 8px; border-radius: 10px; }

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
        .inbox-item:hover { background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.15); }
        .inbox-item.active { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.35); }
        
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

        /* Detay Paneli */
        .details-panel { overflow-y: auto; }
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

        .details-wrapper { display: flex; flex-direction: column; gap: 20px; height: 100%; }
        .details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding-bottom: 14px;
        }
        .details-header h2 { margin: 0; font-size: 1.4rem; color: #fff; }
        .student-no-badge { font-family: monospace; font-size: 0.8rem; color: #10b981; }
        .overall-status-box { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .overall-status-box label { font-size: 0.75rem; color: #64748b; }
        
        .overall-status-badge {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
        }
        .overall-status-badge.green { background: rgba(16,185,129,0.15); color: #34d399; }
        .overall-status-badge.red { background: rgba(239,68,68,0.15); color: #f87171; }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
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
            overflow-y: auto;
        }
        .details-section h3 { margin: 0 0 8px 0; font-size: 0.95rem; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }

        .form-group { display: flex; flex-direction: column; }
        .border-bottom-divider { border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 14px; margin-bottom: 10px; }
        .input-field { display: flex; flex-direction: column; gap: 6px; }
        .input-field label { font-size: 0.75rem; color: #94a3b8; }
        
        .small-meta-input-full, .details-select-input-full {
            background: #111827;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 6px;
            color: #fff;
            padding: 8px 12px;
            font-size: 0.8rem;
            outline: none;
            width: 100%;
            box-sizing: border-box;
        }
        .details-select-input-full option { background: #1e293b; }

        .file-action-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.2);
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
        }
        .file-name-text { color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
        .btn-text-preview { background: rgba(255,255,255,0.05); color: #10b981; border: none; font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; cursor: pointer; }

        .checkbox-container {
            display: flex;
            align-items: center;
            position: relative;
            padding-left: 28px;
            cursor: pointer;
            font-size: 0.85rem;
            user-select: none;
            color: #fff;
        }
        .checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
        .checkmark { position: absolute; top: 50%; left: 0; transform: translateY(-50%); height: 16px; width: 16px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); }
        .checkbox-container input:checked ~ .checkmark { background-color: #10b981; border-color: #10b981; }
        .checkmark:after { content: ""; position: absolute; display: none; }
        .checkbox-container input:checked ~ .checkmark:after { display: block; }
        .checkbox-container .checkmark:after { left: 5px; top: 2px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }

        .doses-table-box { display: flex; flex-direction: column; gap: 6px; }
        .doses-table-box label { font-size: 0.75rem; color: #94a3b8; }
        .no-doses-msg { font-size: 0.75rem; color: #64748b; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 6px; text-align: center; }

        .doses-table-form { width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left; }
        .doses-table-form th { color: #64748b; padding: 6px 8px; border-bottom: 2px solid rgba(255,255,255,0.06); }
        .doses-table-form td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #e2e8f0; }
        .form-inline-status-dose { background: #1f2937; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 2px 4px; font-size: 0.7rem; outline: none; cursor: pointer; }

        .new-dose-form-box {
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 14px;
            margin-top: 10px;
        }
        .new-dose-form-box h4 { margin: 0 0 10px 0; font-size: 0.85rem; color: #fff; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .form-row-2.margin-top-8 { margin-top: 8px; }

        .btn-save-details { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-save-details:hover { transform: translateY(-1px); }
        .btn-save-details.btn-secondary-form { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; }

        .toast-alert {
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid #3b82f6;
            color: #fff;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 2000;
            transition: opacity 0.5s ease;
        }

        .hidden { display: none !important; }
        .margin-bottom-12 { margin-bottom: 12px; }
        .margin-top-12 { margin-top: 12px; }
        .margin-top-16 { margin-top: 16px; }
    `;
    document.head.appendChild(style);
}
})();
