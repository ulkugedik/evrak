/**
 * ==========================================================================
 * Admin & Danışman Paneli - advisor.js
 * Yönetim Paneli, Toplu Onay/Red, Çöp Kutusu ve Dinamik Seçenek Yönetimi
 * ==========================================================================
 */

(function() {
    window.initDanismanPortali = function(container) {
        if (!container) return;

        let activeAdminTab = 'applications'; // 'applications', 'trash', 'advisors', 'courses', 'instructors'
        let expandedCardId = null;
        let searchQuery = '';
        let filterDepartment = '';
        let filterClass = '';
        let filterStatus = 'all';

        const docNames = {
            isgCertificate: "16 Saatlik İSG Belgesi",
            medicalForm: "İşe Giriş Muayene Formu",
            privacyAgreement: "Gizlilik Sözleşmesi",
            idCard: "Kimlik Fotokopisi",
            hemogram: "Hemogram Tetkik Raporu",
            elisa: "ELISA Tetkik Raporu",
            chestXray: "Akciğer Grafisi Raporu"
        };

        function getApplications() {
            if (window.AppDB && window.AppDB.getAllApplications) {
                return window.AppDB.getAllApplications();
            }
            return JSON.parse(localStorage.getItem('db_applications') || '[]');
        }

        function renderDashboard() {
            container.innerHTML = `
                <div class="admin-panel-header" style="margin-bottom: 20px;">
                    <div style="margin-bottom: 16px;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
                            Yönetim Paneli
                        </h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            Öğrenci staj başvuruları, toplu onay/red, çöp kutusu ve sistem seçeneklerini yönetin.
                        </p>
                    </div>

                    <!-- Admin Ana Sekmeleri -->
                    <div class="admin-tabs" style="display: flex; gap: 8px; flex-wrap: wrap; border-bottom: 2px solid var(--border); padding-bottom: 10px;">
                        <button type="button" class="btn ${activeAdminTab === 'applications' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="applications">
                            Aktif Başvurular
                        </button>
                        <button type="button" class="btn ${activeAdminTab === 'trash' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="trash">
                            Çöp Kutusu (Reddedilenler)
                        </button>
                        <button type="button" class="btn ${activeAdminTab === 'advisors' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="advisors">
                            Danışman Yönetimi
                        </button>
                        <button type="button" class="btn ${activeAdminTab === 'courses' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="courses">
                            Ders Yönetimi
                        </button>
                        <button type="button" class="btn ${activeAdminTab === 'instructors' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="instructors">
                            Öğretim Elemanı Yönetimi
                        </button>
                    </div>
                </div>

                <div id="admin-tab-content"></div>
            `;

            // Sekme değiştirme dinleyicileri
            container.querySelectorAll('.admin-nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    activeAdminTab = btn.getAttribute('data-tab');
                    renderDashboard();
                });
            });

            const contentDiv = document.getElementById('admin-tab-content');

            if (activeAdminTab === 'applications') {
                renderActiveApplicationsTab(contentDiv);
            } else if (activeAdminTab === 'trash') {
                renderTrashTab(contentDiv);
            } else if (activeAdminTab === 'advisors') {
                renderAdvisorsTab(contentDiv);
            } else if (activeAdminTab === 'courses') {
                renderCoursesTab(contentDiv);
            } else if (activeAdminTab === 'instructors') {
                renderInstructorsTab(contentDiv);
            }
        }

        // ------------------------------------------------------------------
        // SEKME 1: AKTİF BAŞVURULAR (Toplu Onay & Toplu Red)
        // ------------------------------------------------------------------
        function renderActiveApplicationsTab(target) {
            const allApps = getApplications();
            const activeApps = allApps.filter(a => !a.isTrash);

            target.innerHTML = `
                <!-- Filtreleme Alanı -->
                <div class="filters-card" style="margin-bottom: 20px;">
                    <div class="filters-grid">
                        <div class="search-input-wrapper">
                            <input type="text" id="adv-search" placeholder="Öğrenci Adı veya No Ara..." value="${searchQuery}">
                        </div>
                        <div>
                            <select id="adv-filter-dept">
                                <option value="">-- Tüm Bölümler --</option>
                                <option value="Hemşirelik" ${filterDepartment === 'Hemşirelik' ? 'selected' : ''}>Hemşirelik</option>
                                <option value="Ebelik" ${filterDepartment === 'Ebelik' ? 'selected' : ''}>Ebelik</option>
                                <option value="Fizyoterapi ve Rehabilitasyon" ${filterDepartment === 'Fizyoterapi ve Rehabilitasyon' ? 'selected' : ''}>Fizyoterapi</option>
                                <option value="Beslenme ve Diyetetik" ${filterDepartment === 'Beslenme ve Diyetetik' ? 'selected' : ''}>Beslenme & Diyetetik</option>
                                <option value="Tıp Fakültesi" ${filterDepartment === 'Tıp Fakültesi' ? 'selected' : ''}>Tıp Fakültesi</option>
                            </select>
                        </div>
                        <div>
                            <select id="adv-filter-class">
                                <option value="">-- Tüm Sınıflar --</option>
                                <option value="1. Sınıf" ${filterClass === '1. Sınıf' ? 'selected' : ''}>1. Sınıf</option>
                                <option value="2. Sınıf" ${filterClass === '2. Sınıf' ? 'selected' : ''}>2. Sınıf</option>
                                <option value="3. Sınıf" ${filterClass === '3. Sınıf' ? 'selected' : ''}>3. Sınıf</option>
                                <option value="4. Sınıf" ${filterClass === '4. Sınıf' ? 'selected' : ''}>4. Sınıf</option>
                            </select>
                        </div>
                        <div>
                            <select id="adv-filter-status">
                                <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>-- Tüm Durumlar --</option>
                                <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Bekleyen Evrak Var</option>
                                <option value="approved" ${filterStatus === 'approved' ? 'selected' : ''}>Tümü Onaylandı</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="list-container" id="adv-student-list"></div>
            `;

            document.getElementById('adv-search').addEventListener('input', e => {
                searchQuery = e.target.value;
                renderStudentCardsList(activeApps);
            });
            document.getElementById('adv-filter-dept').addEventListener('change', e => {
                filterDepartment = e.target.value;
                renderStudentCardsList(activeApps);
            });
            document.getElementById('adv-filter-class').addEventListener('change', e => {
                filterClass = e.target.value;
                renderStudentCardsList(activeApps);
            });
            document.getElementById('adv-filter-status').addEventListener('change', e => {
                filterStatus = e.target.value;
                renderStudentCardsList(activeApps);
            });

            renderStudentCardsList(activeApps);
        }

        function renderStudentCardsList(activeApps) {
            const listContainer = document.getElementById('adv-student-list');
            if (!listContainer) return;

            const filteredApps = activeApps.filter(app => {
                const nameMatch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  app.studentNo.includes(searchQuery);
                const deptMatch = !filterDepartment || app.department === filterDepartment;
                const classMatch = !filterClass || app.studentClass === filterClass;

                let statusMatch = true;
                if (filterStatus !== 'all') {
                    const statuses = Object.values(app.documentsStatus || {}).map(d => d.status);
                    if (filterStatus === 'pending') {
                        statusMatch = statuses.includes('Bekliyor');
                    } else if (filterStatus === 'approved') {
                        statusMatch = statuses.length > 0 && statuses.every(s => s === 'Onaylandı');
                    }
                }
                return nameMatch && deptMatch && classMatch && statusMatch;
            });

            if (filteredApps.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-records" style="padding: 40px; text-align: center; color: var(--text-muted);">
                        <h4>Başvuru Bulunamadı</h4>
                        <p>Kriterlere uygun aktif başvuru bulunmamaktadır.</p>
                    </div>
                `;
                return;
            }

            listContainer.innerHTML = '';

            filteredApps.forEach(app => {
                const statuses = app.documentsStatus || {};
                const keys = Object.keys(statuses);
                const totalDocs = keys.length;
                const approvedCount = keys.filter(k => statuses[k].status === 'Onaylandı').length;
                const pendingCount = keys.filter(k => statuses[k].status === 'Bekliyor').length;

                let progressBadgeClass = 'badge-pending';
                let progressBadgeText = `${approvedCount}/${totalDocs} Onaylandı`;
                if (approvedCount === totalDocs && totalDocs > 0) {
                    progressBadgeClass = 'badge-approved';
                    progressBadgeText = 'Tümü Onaylandı';
                }

                const isActive = app.id === expandedCardId ? 'active' : '';
                const card = document.createElement('div');
                card.className = `student-list-card ${isActive}`;
                card.setAttribute('data-id', app.id);

                card.innerHTML = `
                    <div class="student-card-header">
                        <div class="student-meta">
                            <div class="student-title">
                                <h4>${app.fullName}</h4>
                                <p>${app.studentNo} • ${app.department} • ${app.studentClass}</p>
                            </div>
                        </div>
                        <div class="student-summary-status">
                            <span class="badge ${progressBadgeClass}">${progressBadgeText}</span>
                        </div>
                    </div>

                    <div class="student-card-body" style="display: ${isActive ? 'block' : 'none'};">
                        <div class="student-details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Staj Kurumu / Birimi</span>
                                <span class="detail-val">${app.institution} / ${app.unitName || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Ders / Sorumlu Hoca</span>
                                <span class="detail-val">${app.courseNameCode} / ${app.responsibleInstructor}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Uygulama Günleri</span>
                                <span class="detail-val">${app.applicationDays}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Danışman</span>
                                <span class="detail-val">${app.academicAdvisor}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Telefon & E-posta</span>
                                <span class="detail-val">${app.phone} • ${app.email}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Başvuru Tarihi</span>
                                <span class="detail-val">${new Date(app.submissionDate || app.createdAt).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>

                        <!-- Toplu İşlem Butonları (7. Madde Gereği) -->
                        <div class="bulk-action-card" style="background: #f8fafc; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                            <div>
                                <strong>Gerekli Evrak İşlemleri:</strong>
                                <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">Evrakları toplu olarak onaylayabilir veya toplu reddederek çöp kutusuna gönderebilirsiniz.</span>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button type="button" class="btn btn-success btn-bulk-approve" data-student-id="${app.id}">
                                    Tüm Belgeleri Onayla
                                </button>
                                <button type="button" class="btn btn-danger btn-bulk-reject" data-student-id="${app.id}">
                                    Tüm Belgeleri Reddet (Çöpe At)
                                </button>
                            </div>
                        </div>

                        <!-- Evraklar Listesi -->
                        <div class="docs-review-section">
                            <h5>Yüklenen Belgelerin Detaylı İnceleme Durumu</h5>
                            <table class="docs-table">
                                <thead>
                                    <tr>
                                        <th>Belge Adı</th>
                                        <th>Belge Detayı / Tarih</th>
                                        <th>Dosya / Link</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.keys(docNames).map(key => {
                                        const doc = statuses[key] || { status: 'Yüklenmedi' };
                                        let detail = '—';
                                        if (key === 'isgCertificate' && doc.date) detail = `Tarih: ${formatDate(doc.date)}`;
                                        else if (key === 'medicalForm' && doc.date) detail = `Muayene: ${formatDate(doc.date)}`;
                                        else if (key === 'privacyAgreement' && doc.physicalCount) detail = `Fiziksel: ${doc.physicalCount} Adet`;
                                        else if (doc.date) detail = `Tarih: ${formatDate(doc.date)}`;

                                        let statusBadgeClass = 'badge-pending';
                                        if (doc.status === 'Onaylandı') statusBadgeClass = 'badge-approved';
                                        else if (doc.status === 'Reddedildi') statusBadgeClass = 'badge-rejected';
                                        else if (doc.status === 'Yüklenmedi') statusBadgeClass = 'optional-badge';

                                        let fileAction = '—';
                                        if (doc.fileUrl || doc.fileName) {
                                            fileAction = `<a href="${doc.fileUrl || '#'}" target="_blank" download="${doc.fileName || 'belge'}" class="doc-link">${doc.fileName || 'Dosyayı İncele/İndir'}</a>`;
                                        } else if (doc.status !== 'Yüklenmedi') {
                                            fileAction = `<span style="color: var(--text-muted); font-style: italic;">Dosya Bağlantısı Yok</span>`;
                                        }

                                        return `
                                            <tr>
                                                <td style="font-weight: 600;">${docNames[key]}</td>
                                                <td>${detail}</td>
                                                <td>${fileAction}</td>
                                                <td><span class="badge ${statusBadgeClass}">${doc.status}</span></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

                card.querySelector('.student-card-header').addEventListener('click', () => {
                    const isExp = card.classList.contains('active');
                    const activeCard = listContainer.querySelector('.student-list-card.active');
                    if (activeCard) {
                        activeCard.classList.remove('active');
                        activeCard.querySelector('.student-card-body').style.display = 'none';
                    }
                    if (!isExp) {
                        card.classList.add('active');
                        card.querySelector('.student-card-body').style.display = 'block';
                        expandedCardId = app.id;
                    } else {
                        expandedCardId = null;
                    }
                });

                listContainer.appendChild(card);
            });

            // Toplu Onay Buton Dinleyicisi
            listContainer.querySelectorAll('.btn-bulk-approve').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    if (window.AppDB && window.AppDB.bulkApproveApplication) {
                        window.AppDB.bulkApproveApplication(studentId);
                        alert('Başvuru ve tüm evrakları onaylandı!');
                        renderDashboard();
                    }
                });
            });

            // Toplu Red Buton Dinleyicisi (Çöpe Atma)
            listContainer.querySelectorAll('.btn-bulk-reject').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const reason = prompt("Reddetme ve çöp kutusuna gönderme gerekçesini giriniz:", "Evraklar eksik veya okunamıyor.");
                    if (reason !== null) {
                        if (window.AppDB && window.AppDB.bulkRejectApplication) {
                            window.AppDB.bulkRejectApplication(studentId, reason);
                            alert('Başvuru reddedildi ve Çöp Kutusuna taşındı.');
                            renderDashboard();
                        }
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME 2: ÇÖP KUTUSU (REDDEDİLENLER)
        // ------------------------------------------------------------------
        function renderTrashTab(target) {
            const allApps = getApplications();
            const trashApps = allApps.filter(a => a.isTrash);

            if (trashApps.length === 0) {
                target.innerHTML = `
                    <div class="no-records" style="padding: 50px; text-align: center;">
                        <h4>Çöp Kutusu Boş</h4>
                        <p style="color: var(--text-muted);">Reddedilen veya çöp kutusuna gönderilen başvuru bulunmamaktadır.</p>
                    </div>
                `;
                return;
            }

            let trashListHtml = `
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 1.1rem; color: var(--danger);">Reddedilen Başvurular ve Çöp Kutusu</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Reddedilen başvurular burada saklanır. İstediğiniz zaman geri yükleyebilir veya kalıcı olarak silebilirsiniz.</p>
                </div>
                <div class="trash-list" style="display: flex; flex-direction: column; gap: 12px;">
            `;

            trashApps.forEach(app => {
                trashListHtml += `
                    <div style="background: #ffffff; border: 1px solid var(--danger); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <h4 style="font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">${app.fullName} (${app.studentNo})</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">
                                ${app.department} • ${app.courseNameCode} • ${app.institution}
                            </p>
                            <div style="font-size: 0.8rem; color: var(--danger); font-weight: 600;">
                                Red Neden: ${app.rejectionReason || 'Belirtilmedi'}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn-outline btn-restore" data-student-id="${app.id}">
                                Geri Yükle
                            </button>
                            <button type="button" class="btn btn-danger btn-delete-perm" data-student-id="${app.id}">
                                Kalıcı Sil
                            </button>
                        </div>
                    </div>
                `;
            });

            trashListHtml += `</div>`;
            target.innerHTML = trashListHtml;

            // Geri Yükle Dinleyicisi
            target.querySelectorAll('.btn-restore').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-student-id');
                    if (window.AppDB && window.AppDB.restoreApplication) {
                        window.AppDB.restoreApplication(id);
                        alert('Başvuru Çöp Kutusundan çıkarıldı ve aktif listeye taşındı.');
                        renderDashboard();
                    }
                });
            });

            // Kalıcı Sil Dinleyicisi
            target.querySelectorAll('.btn-delete-perm').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-student-id');
                    if (confirm("Bu başvuruyu KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
                        if (window.AppDB && window.AppDB.deletePermanently) {
                            window.AppDB.deletePermanently(id);
                            renderDashboard();
                        }
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME 3: DANIŞMAN YÖNETİMİ (Ekle / Sil)
        // ------------------------------------------------------------------
        function renderAdvisorsTab(target) {
            const advisors = window.AppDB ? window.AppDB.getAdvisors() : [];

            let html = `
                <div style="max-width: 600px;">
                    <h4 style="font-size: 1.1rem; margin-bottom: 12px;">Akademik Danışman Yönetimi</h4>
                    
                    <form id="form-add-advisor" style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <input type="text" id="input-new-advisor" placeholder="Yeni Danışman Ünvan ve Adı" required style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                        <button type="submit" class="btn btn-primary">Danışman Ekle</button>
                    </form>

                    <div class="advisors-list" style="display: flex; flex-direction: column; gap: 8px;">
            `;

            advisors.forEach(adv => {
                html += `
                    <div style="background: #ffffff; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: var(--text-main);">${adv}</span>
                        <button type="button" class="btn btn-danger btn-sm btn-del-advisor" data-name="${adv}">Sil</button>
                    </div>
                `;
            });

            html += `</div></div>`;
            target.innerHTML = html;

            const form = document.getElementById('form-add-advisor');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    const input = document.getElementById('input-new-advisor');
                    const val = input.value.trim();
                    if (val && window.AppDB.addAdvisor(val)) {
                        alert('Yeni danışman eklendi.');
                        renderDashboard();
                    } else {
                        alert('Bu danışman zaten mevcut veya geçersiz.');
                    }
                });
            }

            target.querySelectorAll('.btn-del-advisor').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.getAttribute('data-name');
                    if (confirm(`"${name}" isimli danışmanı silmek istediğinize emin misiniz?`)) {
                        window.AppDB.deleteAdvisor(name);
                        renderDashboard();
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME 4: DERS YÖNETİMİ (Bölüm ve Döneme Göre Ekle / Sil)
        // ------------------------------------------------------------------
        function renderCoursesTab(target) {
            const courses = window.AppDB ? window.AppDB.getAllCourses() : [];

            let html = `
                <div style="max-width: 750px;">
                    <h4 style="font-size: 1.1rem; margin-bottom: 8px;">Bölüm ve Döneme Göre Ders Yönetimi</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                        Öğrencilerin seçebileceği dersleri belirli Bölüm ve Dönem eşleşmesiyle tanımlayabilirsiniz.
                    </p>
                    
                    <form id="form-add-course" style="background: #ffffff; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 24px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">Bölüm</label>
                                <select id="course-dept-input" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                                    <option value="">-- Bölüm Seçin --</option>
                                    <option value="Hemşirelik">Hemşirelik</option>
                                    <option value="Ebelik">Ebelik</option>
                                    <option value="Fizyoterapi ve Rehabilitasyon">Fizyoterapi ve Rehabilitasyon</option>
                                    <option value="Beslenme ve Diyetetik">Beslenme ve Diyetetik</option>
                                    <option value="Tıp Fakültesi">Tıp Fakültesi</option>
                                    <option value="Gerontoloji">Gerontoloji</option>
                                    <option value="İlk ve Acil Yardım">İlk ve Acil Yardım</option>
                                    <option value="Dijital Sağlık Sistemleri Teknikerliği">Dijital Sağlık Sistemleri Teknikerliği</option>
                                    <option value="Tıbbi Dokümantasyon ve Sekreterlik">Tıbbi Dokümantasyon ve Sekreterlik</option>
                                    <option value="Laborant ve Veteriner Sağlık">Laborant ve Veteriner Sağlık</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">Dönem</label>
                                <select id="course-term-input" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                                    <option value="">-- Dönem Seçin --</option>
                                    <option value="Güz">Güz Dönemi</option>
                                    <option value="Bahar">Bahar Dönemi</option>
                                    <option value="Yaz Okulu / Staj">Yaz Okulu / Staj</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">Ders Kodu ve Adı</label>
                            <input type="text" id="course-code-input" placeholder="Örn: HEM305 - Klinik Staj I" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%;">Ders Ekle</button>
                    </form>

                    <h5 style="font-size: 1rem; margin-bottom: 12px;">Tanımlı Dersler Listesi</h5>
                    <div class="courses-list" style="display: flex; flex-direction: column; gap: 8px;">
            `;

            if (courses.length === 0) {
                html += `<div style="color: var(--text-muted); font-style: italic;">Henüz tanımlanmış ders bulunmamaktadır.</div>`;
            } else {
                courses.forEach(c => {
                    html += `
                        <div style="background: #ffffff; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                            <div>
                                <strong style="color: var(--text-main); font-size: 0.95rem;">${c.codeName}</strong>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${c.department} • ${c.term}</div>
                            </div>
                            <button type="button" class="btn btn-danger btn-sm btn-del-course" data-id="${c.id}">Sil</button>
                        </div>
                    `;
                });
            }

            html += `</div></div>`;
            target.innerHTML = html;

            const form = document.getElementById('form-add-course');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    const dept = document.getElementById('course-dept-input').value;
                    const term = document.getElementById('course-term-input').value;
                    const code = document.getElementById('course-code-input').value.trim();

                    if (dept && term && code && window.AppDB.addCourse(dept, term, code)) {
                        alert('Ders başarıyla eklendi.');
                        renderDashboard();
                    } else {
                        alert('Ders eklenemedi veya zaten tanımlı.');
                    }
                });
            }

            target.querySelectorAll('.btn-del-course').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm("Bu dersi silmek istediğinize emin misiniz?")) {
                        window.AppDB.deleteCourse(id);
                        renderDashboard();
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME 5: SORUMLU ÖĞRETİM ELEMANI YÖNETİMİ (Ekle / Sil)
        // ------------------------------------------------------------------
        function renderInstructorsTab(target) {
            const instructors = window.AppDB ? window.AppDB.getInstructors() : [];

            let html = `
                <div style="max-width: 600px;">
                    <h4 style="font-size: 1.1rem; margin-bottom: 12px;">Sorumlu Öğretim Elemanı Yönetimi</h4>
                    
                    <form id="form-add-instructor" style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <input type="text" id="input-new-instructor" placeholder="Yeni Öğretim Elemanı Ünvan ve Adı" required style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                        <button type="submit" class="btn btn-primary">Öğretim Elemanı Ekle</button>
                    </form>

                    <div class="instructors-list" style="display: flex; flex-direction: column; gap: 8px;">
            `;

            instructors.forEach(ins => {
                html += `
                    <div style="background: #ffffff; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: var(--text-main);">${ins}</span>
                        <button type="button" class="btn btn-danger btn-sm btn-del-instructor" data-name="${ins}">Sil</button>
                    </div>
                `;
            });

            html += `</div></div>`;
            target.innerHTML = html;

            const form = document.getElementById('form-add-instructor');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    const input = document.getElementById('input-new-instructor');
                    const val = input.value.trim();
                    if (val && window.AppDB.addInstructor(val)) {
                        alert('Yeni öğretim elemanı eklendi.');
                        renderDashboard();
                    } else {
                        alert('Bu öğretim elemanı zaten mevcut veya geçersiz.');
                    }
                });
            }

            target.querySelectorAll('.btn-del-instructor').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.getAttribute('data-name');
                    if (confirm(`"${name}" isimli öğretim elemanını silmek istediğinize emin misiniz?`)) {
                        window.AppDB.deleteInstructor(name);
                        renderDashboard();
                    }
                });
            });
        }

        function formatDate(dateStr) {
            if (!dateStr) return '—';
            try {
                const parts = dateStr.split('-');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return new Date(dateStr).toLocaleDateString('tr-TR');
            } catch (e) {
                return dateStr;
            }
        }

        renderDashboard();
    };
})();
