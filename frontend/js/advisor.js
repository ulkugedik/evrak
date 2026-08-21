/**
 * ==========================================================================
 * Admin & Danışman Paneli - advisor.js
 * Yönetim Paneli, Toplu Onay/Red, Çöp Kutusu ve Dinamik Seçenek Yönetimi
 * ==========================================================================
 */

(function() {
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('tr-TR');
    }

    window.initDanismanPortali = function(container, userRole) {
        if (!container) return;

        const role = userRole || 'superadmin';

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
            chestXray: "Akciğer Grafisi Raporu",
            hepatitisTest: "Hepatit B Tetkik Raporu",
            vaccineCard: "Hepatit B Aşı Kartı"
        };

        function getApplications() {
            try {
                let apps = [];
                if (window.AppDB && window.AppDB.getAllApplications) {
                    apps = window.AppDB.getAllApplications();
                } else {
                    const stored = localStorage.getItem('db_applications');
                    const parsed = stored ? JSON.parse(stored) : [];
                    apps = Array.isArray(parsed) ? parsed : [];
                }

                // Filter applications if logged in user is admin (non-superadmin)
                if (role !== 'superadmin') {
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    if (currentUser && currentUser.displayName) {
                        const loggedInName = currentUser.displayName;
                        apps = apps.filter(app => app.academicAdvisor === loggedInName);
                    }
                }
                return apps;
            } catch (e) {
                console.error('getApplications error:', e);
                return [];
            }
        }

        function saveApps(apps) {
            if (window.AppDB) {
                window.AppDB.applications = apps;
                window.AppDB.saveApplicationsToStorage();
            } else {
                localStorage.setItem('db_applications', JSON.stringify(apps));
            }
        }

        function dataURLtoBlob(dataurl) {
            try {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            } catch (e) {
                console.error('Error converting data URL to Blob:', e);
                return null;
            }
        }

        function getFileLinkHtml(doc) {
            if (!doc) return '—';
            if (doc.fileUrl && doc.fileUrl.startsWith('IndexedDB:')) {
                const storageKey = doc.fileUrl.split(':')[1];
                return `<a href="#" class="doc-link view-file-btn" data-storage-key="${storageKey}" data-file-name="${doc.fileName || 'belge'}">${doc.fileName || 'Dosyayı İncele/İndir'}</a>`;
            } else if (doc.fileUrl || doc.fileName) {
                return `<a href="${doc.fileUrl || '#'}" target="_blank" download="${doc.fileName || 'belge'}" class="doc-link">${doc.fileName || 'Dosyayı İncele/İndir'}</a>`;
            } else {
                return `<span style="color: var(--text-muted); font-style: italic;">Dosya Bağlantısı Yok</span>`;
            }
        }

        function renderDashboard() {
            container.innerHTML = `
                <div class="admin-panel-header" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
                                Yönetim Paneli
                            </h3>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">
                                Öğrenci staj başvuruları, toplu onay/red, çöp kutusu ve sistem seçeneklerini yönetin.
                            </p>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm btn-refresh-admin" style="font-weight: 600;">
                            Listeyi Yenile
                        </button>
                    </div>

                    <!-- Admin Ana Sekmeleri -->
                    <div class="admin-tabs" style="display: flex; gap: 8px; flex-wrap: wrap; border-bottom: 2px solid var(--border); padding-bottom: 10px;">
                        <button type="button" class="btn ${activeAdminTab === 'applications' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="applications">
                            Aktif Başvurular
                        </button>
                        <button type="button" class="btn ${activeAdminTab === 'archive' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="archive">
                            Arşiv (Reddedilenler)
                        </button>
                        <button type="button" class="btn ${activeAdminTab === 'trash' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="trash">
                            Çöp Kutusu
                        </button>
                        ${role === 'superadmin' ? `
                        <button type="button" class="btn ${activeAdminTab === 'admins' ? 'btn-primary' : 'btn-secondary'} admin-nav-btn" data-tab="admins">
                            Yetkili Yönetimi
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
                        ` : ''}
                    </div>
                </div>

                <div id="admin-tab-content"></div>
            `;

            const refreshBtn = container.querySelector('.btn-refresh-admin');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    renderDashboard();
                });
            }

            container.querySelectorAll('.admin-nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    activeAdminTab = btn.getAttribute('data-tab');
                    renderDashboard();
                });
            });

            const contentDiv = document.getElementById('admin-tab-content');

            if (activeAdminTab === 'applications') {
                renderActiveApplicationsTab(contentDiv);
            } else if (activeAdminTab === 'archive') {
                renderArchiveTab(contentDiv);
            } else if (activeAdminTab === 'trash') {
                renderTrashTab(contentDiv);
            } else if (activeAdminTab === 'admins') {
                renderAdminsTab(contentDiv);
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
            const activeApps = allApps.filter(a => !a.isArchive && !a.isTrash);

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
                                <option value="Fizyoterapi ve Rehabilitasyon" ${filterDepartment === 'Fizyoterapi ve Rehabilitasyon' ? 'selected' : ''}>Fizyoterapi ve Rehabilitasyon</option>
                                <option value="Beslenme ve Diyetetik" ${filterDepartment === 'Beslenme ve Diyetetik' ? 'selected' : ''}>Beslenme ve Diyetetik</option>
                                <option value="Tıp Fakültesi" ${filterDepartment === 'Tıp Fakültesi' ? 'selected' : ''}>Tıp Fakültesi</option>
                                <option value="Gerontoloji" ${filterDepartment === 'Gerontoloji' ? 'selected' : ''}>Gerontoloji</option>
                                <option value="İlk ve Acil Yardım" ${filterDepartment === 'İlk ve Acil Yardım' ? 'selected' : ''}>İlk ve Acil Yardım</option>
                                <option value="Dijital Sağlık Sistemleri Teknikerliği" ${filterDepartment === 'Dijital Sağlık Sistemleri Teknikerliği' ? 'selected' : ''}>Dijital Sağlık Sistemleri Teknikerliği</option>
                                <option value="Tıbbi Dokümantasyon ve Sekreterlik" ${filterDepartment === 'Tıbbi Dokümantasyon ve Sekreterlik' ? 'selected' : ''}>Tıbbi Dokümantasyon ve Sekreterlik</option>
                                <option value="Laborant ve Veteriner Sağlık" ${filterDepartment === 'Laborant ve Veteriner Sağlık' ? 'selected' : ''}>Laborant ve Veteriner Sağlık</option>
                            </select>
                        </div>
                        <div>
                            <select id="adv-filter-class">
                                <option value="">-- Tüm Sınıflar --</option>
                                <option value="1. Sınıf" ${filterClass === '1. Sınıf' ? 'selected' : ''}>1. Sınıf</option>
                                <option value="2. Sınıf" ${filterClass === '2. Sınıf' ? 'selected' : ''}>2. Sınıf</option>
                                <option value="3. Sınıf" ${filterClass === '3. Sınıf' ? 'selected' : ''}>3. Sınıf</option>
                                <option value="4. Sınıf" ${filterClass === '4. Sınıf' ? 'selected' : ''}>4. Sınıf</option>
                                <option value="5. Sınıf" ${filterClass === '5. Sınıf' ? 'selected' : ''}>5. Sınıf</option>
                                <option value="6. Sınıf" ${filterClass === '6. Sınıf' ? 'selected' : ''}>6. Sınıf</option>
                                <option value="Yüksek Lisans" ${filterClass === 'Yüksek Lisans' ? 'selected' : ''}>Yüksek Lisans</option>
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

            const filteredApps = (activeApps || []).filter(app => {
                if (!app) return false;
                const fullName = String(app.fullName || '').toLowerCase();
                const studentNo = String(app.studentNo || '');
                const q = (searchQuery || '').toLowerCase().trim();

                const nameMatch = !q || fullName.includes(q) || studentNo.includes(q);
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
                const activeKeys = keys.filter(k => statuses[k].status !== 'Yüklenmedi');
                const totalDocs = activeKeys.length;
                const approvedCount = activeKeys.filter(k => statuses[k].status === 'Onaylandı').length;

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

                        <!-- Genel & İdari Belgeler Listesi -->
                        <div class="docs-review-section">
                            <h5 style="margin-top: 10px; margin-bottom: 12px; font-weight: 700; color: var(--primary);">
                                Genel & İdari Belgeler
                            </h5>
                            <table class="docs-table" style="margin-bottom: 24px;">
                                <thead>
                                    <tr>
                                        <th>Belge Adı</th>
                                        <th>Belge Detayı / Tarih</th>
                                        <th>Dosya / Link</th>
                                        <th>Durum</th>
                                        <th style="text-align: right; width: 180px;">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${["isgCertificate", "privacyAgreement", "idCard"].map(key => {
                                        const doc = statuses[key] || { status: 'Yüklenmedi' };
                                        let detail = '—';
                                        if (key === 'isgCertificate' && doc.date) detail = `Tarih: ${formatDate(doc.date)}`;
                                        else if (key === 'privacyAgreement' && doc.physicalCount) detail = `Fiziksel: ${doc.physicalCount} Adet`;
                                        else if (doc.date) detail = `Tarih: ${formatDate(doc.date)}`;

                                        let statusBadgeClass = 'badge-pending';
                                        if (doc.status === 'Onaylandı') statusBadgeClass = 'badge-approved';
                                        else if (doc.status === 'Reddedildi') statusBadgeClass = 'badge-rejected';
                                        else if (doc.status === 'Yüklenmedi') statusBadgeClass = 'optional-badge';

                                        let fileAction = getFileLinkHtml(doc);

                                        let actionButtons = '—';
                                        if (doc.status !== 'Yüklenmedi') {
                                            actionButtons = `
                                                <button type="button" class="btn btn-success btn-sm btn-approve-doc" data-student-id="${app.id}" data-doc-key="${key}" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;">
                                                    Onayla
                                                </button>
                                                <button type="button" class="btn btn-danger btn-sm btn-reject-doc" data-student-id="${app.id}" data-doc-key="${key}" style="padding: 4px 8px; font-size: 0.75rem;">
                                                    Reddet
                                                </button>
                                            `;
                                        }

                                        return `
                                            <tr>
                                                <td style="font-weight: 600;">${docNames[key]}</td>
                                                <td>${detail}</td>
                                                <td>${fileAction}</td>
                                                <td>
                                                    <span class="badge ${statusBadgeClass}">${doc.status}</span>
                                                    ${doc.rejectionReason ? `<div style="font-size: 0.725rem; color: var(--danger); margin-top: 4px; line-height: 1.2;">Neden: ${doc.rejectionReason}</div>` : ''}
                                                </td>
                                                <td style="text-align: right; white-space: nowrap;">${actionButtons}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>

                            <!-- Sağlık & Tetkik Belgeleri Listesi -->
                            <h5 style="margin-top: 20px; margin-bottom: 12px; font-weight: 700; color: var(--danger);">
                                Sağlık & Tetkik Belgeleri
                            </h5>
                            <table class="docs-table">
                                <thead>
                                    <tr>
                                        <th>Belge Adı</th>
                                        <th>Belge Detayı / Tarih</th>
                                        <th>Dosya / Link</th>
                                        <th>Durum</th>
                                        <th style="text-align: right; width: 180px;">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${["medicalForm", "hemogram", "elisa", "chestXray", "hepatitisTest", "vaccineCard"].map(key => {
                                        const doc = statuses[key] || { status: 'Yüklenmedi' };
                                        let detail = '—';
                                        if (key === 'medicalForm' && doc.date) detail = `Muayene: ${formatDate(doc.date)}`;
                                        else if (doc.date) detail = `Tarih: ${formatDate(doc.date)}`;

                                        let statusBadgeClass = 'badge-pending';
                                        if (doc.status === 'Onaylandı') statusBadgeClass = 'badge-approved';
                                        else if (doc.status === 'Reddedildi') statusBadgeClass = 'badge-rejected';
                                        else if (doc.status === 'Yüklenmedi') statusBadgeClass = 'optional-badge';

                                        let fileAction = getFileLinkHtml(doc);

                                        let actionButtons = '—';
                                        if (doc.status !== 'Yüklenmedi') {
                                            actionButtons = `
                                                <button type="button" class="btn btn-success btn-sm btn-approve-doc" data-student-id="${app.id}" data-doc-key="${key}" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;">
                                                    Onayla
                                                </button>
                                                <button type="button" class="btn btn-danger btn-sm btn-reject-doc" data-student-id="${app.id}" data-doc-key="${key}" style="padding: 4px 8px; font-size: 0.75rem;">
                                                    Reddet
                                                </button>
                                            `;
                                        }

                                        return `
                                            <tr>
                                                <td style="font-weight: 600;">${docNames[key]}</td>
                                                <td>${detail}</td>
                                                <td>${fileAction}</td>
                                                <td>
                                                    <span class="badge ${statusBadgeClass}">${doc.status}</span>
                                                    ${doc.rejectionReason ? `<div style="font-size: 0.725rem; color: var(--danger); margin-top: 4px; line-height: 1.2;">Neden: ${doc.rejectionReason}</div>` : ''}
                                                </td>
                                                <td style="text-align: right; white-space: nowrap;">${actionButtons}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Hepatit B & Aşı Takip Bilgileri -->
                        <div class="health-tracking-section" style="margin-top: 20px; border-top: 1px dashed var(--border); padding-top: 20px;">
                            <h5 style="margin-bottom: 12px;">Hepatit B & Aşı Takip Bilgileri</h5>
                            
                            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Hepatit B Tetkiki Yapıldı mı?</label>
                                        <div style="font-weight: 700; font-size: 0.95rem; color: ${app.hepatitisTested === 'Evet' ? 'green' : 'red'};">
                                            ${app.hepatitisTested === 'Evet' ? 'Evet, Yapıldı' : 'Hayır, Yapılmadı'}
                                        </div>
                                    </div>
                                    
                                    ${app.hepatitisTested === 'Evet' ? `
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Tetkik Tarihi</label>
                                        <div style="font-size: 0.95rem;">${formatDate(app.hepatitisTestDate)}</div>
                                    </div>
                                    ` : ''}
                                    
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Tetkik Değerlendirme Durumu</label>
                                        <select class="select-hep-eval" data-student-id="${app.id}" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;">
                                            <option value="Sonuç bekleniyor" ${app.tetkikDegerlendirmeDurumu === 'Sonuç bekleniyor' ? 'selected' : ''}>Sonuç bekleniyor</option>
                                            <option value="Bağışık" ${app.tetkikDegerlendirmeDurumu === 'Bağışık' ? 'selected' : ''}>Bağışık</option>
                                            <option value="Aşı gerekli" ${app.tetkikDegerlendirmeDurumu === 'Aşı gerekli' ? 'selected' : ''}>Aşı gerekli</option>
                                            <option value="Ek değerlendirme gerekli" ${app.tetkikDegerlendirmeDurumu === 'Ek değerlendirme gerekli' ? 'selected' : ''}>Ek değerlendirme gerekli</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Aşı Listesine Dahil mi?</label>
                                        <select class="select-vaccine-list" data-student-id="${app.id}" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem;">
                                            <option value="Hayır" ${app.asiListesineDahilMi === 'Hayır' ? 'selected' : ''}>Hayır</option>
                                            <option value="Evet" ${app.asiListesineDahilMi === 'Evet' ? 'selected' : ''}>Evet</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div style="border-top: 1px solid var(--border); padding-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                                    <div>
                                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); display: block;">Öğrenci Aşı Kartı:</span>
                                        ${statuses.vaccineCard ? getFileLinkHtml(statuses.vaccineCard) : `
                                            <span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">Henüz dosya yüklenmedi</span>
                                        `}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Aşı Kartı Kontrolü:</span>
                                        <select class="select-vaccine-card-status" data-student-id="${app.id}" style="padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem;">
                                            <option value="Bekliyor" ${(statuses.vaccineCard && statuses.vaccineCard.status === 'Bekliyor') ? 'selected' : ''}>Bekliyor</option>
                                            <option value="Uygun" ${(statuses.vaccineCard && statuses.vaccineCard.status === 'Uygun') ? 'selected' : ''}>Uygun</option>
                                            <option value="Eksik-Hatalı" ${(statuses.vaccineCard && statuses.vaccineCard.status === 'Eksik-Hatalı') ? 'selected' : ''}>Eksik-Hatalı</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Aşı Dozları Listesi -->
                            <div class="vaccine-doses-wrapper" style="display: ${app.asiListesineDahilMi === 'Evet' ? 'block' : 'none'};">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <h6 style="margin: 0; font-size: 0.9rem; color: var(--text-main);">Aşı Doz Geçmişi / Planı</h6>
                                    <button type="button" class="btn btn-outline btn-sm btn-add-dose" data-student-id="${app.id}">
                                        Doz Ekle
                                    </button>
                                </div>
                                
                                <div class="doses-table-container">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;" class="doses-table">
                                        <thead>
                                            <tr style="background: #f1f5f9; border-bottom: 2px solid var(--border);">
                                                <th style="padding: 8px; width: 120px;">Doz No</th>
                                                <th style="padding: 8px; width: 140px;">Aşı Tarihi</th>
                                                <th style="padding: 8px;">Yapıldığı Kurum</th>
                                                <th style="padding: 8px; text-align: right; width: 60px;">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${(app.vaccineDoses && app.vaccineDoses.length > 0) ? app.vaccineDoses.map((dose, doseIndex) => `
                                                <tr style="border-bottom: 1px solid var(--border);">
                                                    <td style="padding: 8px; font-weight: 600;">
                                                        <select class="select-dose-no" data-student-id="${app.id}" data-dose-index="${doseIndex}" style="padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; width: 100%;">
                                                            <option value="1. Doz" ${dose.doseNo === '1. Doz' ? 'selected' : ''}>1. Doz</option>
                                                            <option value="2. Doz" ${dose.doseNo === '2. Doz' ? 'selected' : ''}>2. Doz</option>
                                                            <option value="3. Doz" ${dose.doseNo === '3. Doz' ? 'selected' : ''}>3. Doz</option>
                                                            <option value="Ek Doz" ${dose.doseNo === 'Ek Doz' ? 'selected' : ''}>Ek Doz</option>
                                                        </select>
                                                    </td>
                                                    <td style="padding: 8px;">
                                                        <input type="date" class="input-dose-date" data-student-id="${app.id}" data-dose-index="${doseIndex}" value="${dose.date || ''}" style="padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; width: 100%;">
                                                    </td>
                                                    <td style="padding: 8px;">
                                                        <select class="select-dose-inst" data-student-id="${app.id}" data-dose-index="${doseIndex}" style="padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; width: 100%;">
                                                            <option value="Aile Sağlığı Merkezi (ASM)" ${dose.institution === 'Aile Sağlığı Merkezi (ASM)' ? 'selected' : ''}>Aile Sağlığı Merkezi (ASM)</option>
                                                            <option value="İl Sağlık Müdürlüğü" ${dose.institution === 'İl Sağlık Müdürlüğü' ? 'selected' : ''}>İl Sağlık Müdürlüğü</option>
                                                            <option value="Üniversite Hastanesi" ${dose.institution === 'Üniversite Hastanesi' ? 'selected' : ''}>Üniversite Hastanesi</option>
                                                            <option value="Özel Hastane" ${dose.institution === 'Özel Hastane' ? 'selected' : ''}>Özel Hastane</option>
                                                            <option value="Diğer" ${dose.institution === 'Diğer' ? 'selected' : ''}>Diğer</option>
                                                        </select>
                                                    </td>
                                                    <td style="padding: 8px; text-align: right;">
                                                        <button type="button" class="btn btn-danger btn-sm btn-del-dose" data-student-id="${app.id}" data-dose-index="${doseIndex}" style="padding: 3px 6px; font-size: 0.75rem;">
                                                            Sil
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="4" style="padding: 12px; text-align: center; color: var(--text-muted); font-style: italic;">
                                                        Kayıtlı aşı dozu bulunmamaktadır.
                                                    </td>
                                                </tr>
                                            `}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Staj / İşlem Onaylama Kararı -->
                        <div class="bulk-action-card" style="background: #f8fafc; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-top: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                            <div>
                                <strong style="font-size: 0.95rem; color: var(--text-main);">Staj Başvuru Kararı:</strong>
                                <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">Öğrencinin tüm staj işlemlerini nihai olarak onaylayabilir veya reddederek Çöp Kutusuna (reddedilenlere) taşıyabilirsiniz.</span>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button type="button" class="btn btn-success btn-bulk-approve" data-student-id="${app.id}" style="font-weight: 600; padding: 10px 16px;">
                                    Stajı Onayla
                                </button>
                                <button type="button" class="btn btn-danger btn-bulk-reject" data-student-id="${app.id}" style="font-weight: 600; padding: 10px 16px;">
                                    Stajı Reddet (Arşive Al)
                                </button>
                            </div>
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
                        renderDashboard();
                    }
                });
            });

            // Toplu Red Buton Dinleyicisi (Çöpe Atma)
            listContainer.querySelectorAll('.btn-bulk-reject').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const reason = prompt("Staj başvurusunu reddetme gerekçesini giriniz:", "Evraklar staj kurallarına uygun değildir.");
                    if (reason !== null) {
                        if (window.AppDB && window.AppDB.bulkRejectApplication) {
                            window.AppDB.bulkRejectApplication(studentId, reason);
                            renderDashboard();
                        }
                    }
                });
            });

            // Tekil Belge Onaylama
            listContainer.querySelectorAll('.btn-approve-doc').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const docKey = btn.getAttribute('data-doc-key');
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app && app.documentsStatus && app.documentsStatus[docKey]) {
                        app.documentsStatus[docKey].status = 'Onaylandı';
                        delete app.documentsStatus[docKey].rejectionReason;
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Tekil Belge Reddetme
            listContainer.querySelectorAll('.btn-reject-doc').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const docKey = btn.getAttribute('data-doc-key');
                    const reason = prompt("Belgeyi reddetme gerekçesini giriniz:", "Belge uygun görülmedi veya okunamıyor.");
                    if (reason !== null) {
                        const apps = getApplications();
                        const app = apps.find(a => a.id === studentId);
                        if (app && app.documentsStatus && app.documentsStatus[docKey]) {
                            app.documentsStatus[docKey].status = 'Reddedildi';
                            app.documentsStatus[docKey].rejectionReason = reason;
                            saveApps(apps);
                            renderDashboard();
                        }
                    }
                });
            });

            // IndexedDB Dosya Görüntüleme/İndirme Butonları
            listContainer.querySelectorAll('.view-file-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const key = btn.getAttribute('data-storage-key');
                    const fileName = btn.getAttribute('data-file-name');
                    if (window.FileStorage) {
                        window.FileStorage.getFile(key).then(fileData => {
                            if (fileData && (fileData.url || fileData.dataUrl)) {
                                const link = document.createElement('a');
                                link.href = fileData.dataUrl || fileData.url;
                                link.download = fileName || 'dosya';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            } else {
                                alert('Dosya veritabanında bulunamadı!');
                            }
                        }).catch(err => {
                            console.error(err);
                            alert('Dosya yüklenirken hata oluştu!');
                        });
                    }
                });
            });

            // Tetkik Değerlendirme Değişikliği
            listContainer.querySelectorAll('.select-hep-eval').forEach(select => {
                select.addEventListener('change', e => {
                    const studentId = select.getAttribute('data-student-id');
                    const val = e.target.value;
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app) {
                        app.tetkikDegerlendirmeDurumu = val;
                        if (val === 'Aşı gerekli') {
                            app.asiListesineDahilMi = 'Evet';
                        }
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Aşı Listesi Katılım Değişikliği
            listContainer.querySelectorAll('.select-vaccine-list').forEach(select => {
                select.addEventListener('change', e => {
                    const studentId = select.getAttribute('data-student-id');
                    const val = e.target.value;
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app) {
                        app.asiListesineDahilMi = val;
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Aşı Kartı Kontrol Durumu Değişikliği
            listContainer.querySelectorAll('.select-vaccine-card-status').forEach(select => {
                select.addEventListener('change', e => {
                    const studentId = select.getAttribute('data-student-id');
                    const val = e.target.value;
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app) {
                        if (!app.documentsStatus) app.documentsStatus = {};
                        if (!app.documentsStatus.vaccineCard) app.documentsStatus.vaccineCard = { status: 'Bekliyor' };
                        app.documentsStatus.vaccineCard.status = val;
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Doz Ekleme
            listContainer.querySelectorAll('.btn-add-dose').forEach(btn => {
                btn.addEventListener('click', e => {
                    const studentId = btn.getAttribute('data-student-id');
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app) {
                        if (!app.vaccineDoses) app.vaccineDoses = [];
                        const nextDoseNum = app.vaccineDoses.length + 1;
                        const nextDoseLabel = nextDoseNum <= 3 ? `${nextDoseNum}. Doz` : 'Ek Doz';
                        app.vaccineDoses.push({
                            doseNo: nextDoseLabel,
                            date: '',
                            institution: 'Aile Sağlığı Merkezi (ASM)',
                            status: 'Bekliyor'
                        });
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Doz Silme
            listContainer.querySelectorAll('.btn-del-dose').forEach(btn => {
                btn.addEventListener('click', e => {
                    const studentId = btn.getAttribute('data-student-id');
                    const doseIndex = parseInt(btn.getAttribute('data-dose-index'));
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app && app.vaccineDoses) {
                        app.vaccineDoses.splice(doseIndex, 1);
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Doz No Değişikliği
            listContainer.querySelectorAll('.select-dose-no').forEach(select => {
                select.addEventListener('change', e => {
                    const studentId = select.getAttribute('data-student-id');
                    const doseIndex = parseInt(select.getAttribute('data-dose-index'));
                    const val = e.target.value;
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app && app.vaccineDoses && app.vaccineDoses[doseIndex]) {
                        app.vaccineDoses[doseIndex].doseNo = val;
                        saveApps(apps);
                    }
                });
            });

            // Aşı Tarihi Değişikliği
            listContainer.querySelectorAll('.input-dose-date').forEach(input => {
                input.addEventListener('change', e => {
                    const studentId = input.getAttribute('data-student-id');
                    const doseIndex = parseInt(input.getAttribute('data-dose-index'));
                    const val = e.target.value;
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app && app.vaccineDoses && app.vaccineDoses[doseIndex]) {
                        app.vaccineDoses[doseIndex].date = val;
                        saveApps(apps);
                    }
                });
            });

            // Aşı Kurumu Değişikliği
            listContainer.querySelectorAll('.select-dose-inst').forEach(select => {
                select.addEventListener('change', e => {
                    const studentId = select.getAttribute('data-student-id');
                    const doseIndex = parseInt(select.getAttribute('data-dose-index'));
                    const val = e.target.value;
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app && app.vaccineDoses && app.vaccineDoses[doseIndex]) {
                        app.vaccineDoses[doseIndex].institution = val;
                        saveApps(apps);
                    }
                });
            });

            // Tekil Belge Onaylama
            listContainer.querySelectorAll('.btn-approve-doc').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const docKey = btn.getAttribute('data-doc-key');
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app && app.documentsStatus && app.documentsStatus[docKey]) {
                        app.documentsStatus[docKey].status = 'Onaylandı';
                        delete app.documentsStatus[docKey].rejectionReason;
                        saveApps(apps);
                        renderDashboard();
                    }
                });
            });

            // Tekil Belge Reddetme
            listContainer.querySelectorAll('.btn-reject-doc').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const docKey = btn.getAttribute('data-doc-key');
                    const reason = prompt("Belgeyi reddetme gerekçesini giriniz:", "Belge uygun görülmedi veya okunamıyor.");
                    if (reason !== null) {
                        const apps = getApplications();
                        const app = apps.find(a => a.id === studentId);
                        if (app && app.documentsStatus && app.documentsStatus[docKey]) {
                            app.documentsStatus[docKey].status = 'Reddedildi';
                            app.documentsStatus[docKey].rejectionReason = reason;
                            saveApps(apps);
                            renderDashboard();
                        }
                    }
                });
            });

            // IndexedDB Dosya Görüntüleme/İndirme Butonları
            listContainer.querySelectorAll('.view-file-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const key = btn.getAttribute('data-storage-key');
                    const fileName = btn.getAttribute('data-file-name');
                    if (window.FileStorage) {
                        window.FileStorage.getFile(key).then(fileData => {
                            if (fileData && fileData.url) {
                                let url = fileData.url;
                                if (url.startsWith('data:')) {
                                    const blob = dataURLtoBlob(url);
                                    if (blob) {
                                        url = URL.createObjectURL(blob);
                                    }
                                }
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = fileName || 'dosya';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            } else {
                                alert('Dosya veritabanında bulunamadı!');
                            }
                        }).catch(err => {
                            console.error(err);
                            alert('Dosya yüklenirken hata oluştu!');
                        });
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME: ARŞİV (REDDEDİLENLER)
        // ------------------------------------------------------------------
        function renderArchiveTab(target) {
            const allApps = getApplications();
            const archiveApps = allApps.filter(a => a.isArchive && !a.isTrash);

            if (archiveApps.length === 0) {
                target.innerHTML = `
                    <div class="no-records" style="padding: 50px; text-align: center;">
                        <h4>Arşiv Boş</h4>
                        <p style="color: var(--text-muted);">Arşivlenmiş (reddedilmiş) başvuru bulunmamaktadır.</p>
                    </div>
                `;
                return;
            }

            let archiveHtml = `
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 1.1rem; color: var(--primary);">Arşivlenmiş (Reddedilen) Başvurular</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Burada reddedilen staj başvuruları yer alır. Başvuruları aktife geri yükleyebilir veya silebilirsiniz (çöp kutusuna gönderebilirsiniz).</p>
                </div>
                <div class="archive-list" style="display: flex; flex-direction: column; gap: 12px;">
            `;

            archiveApps.forEach(app => {
                archiveHtml += `
                    <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <h4 style="font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">${app.fullName} (${app.studentNo})</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">
                                ${app.department} • ${app.courseNameCode} • ${app.institution}
                            </p>
                            <div style="font-size: 0.8rem; color: var(--danger); font-weight: 600;">
                                Red Nedeni: ${app.rejectionReason || 'Belirtilmedi'}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn-outline btn-restore-archive" data-student-id="${app.id}">
                                Aktife Geri Yükle
                            </button>
                            <button type="button" class="btn btn-danger btn-move-trash" data-student-id="${app.id}">
                                Sil (Çöpe At)
                            </button>
                        </div>
                    </div>
                `;
            });

            archiveHtml += `</div>`;
            target.innerHTML = archiveHtml;

            // Aktife Geri Yükle Dinleyicisi
            target.querySelectorAll('.btn-restore-archive').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-student-id');
                    if (window.AppDB && window.AppDB.restoreFromArchive) {
                        window.AppDB.restoreFromArchive(id);
                        alert('Başvuru Aktif Başvurulara geri taşındı ve reddedilen belgeler inceleme bekliyor durumuna getirildi.');
                        renderDashboard();
                    }
                });
            });

            // Sil (Çöpe At) Dinleyicisi
            target.querySelectorAll('.btn-move-trash').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-student-id');
                    if (window.AppDB && window.AppDB.moveToTrash) {
                        window.AppDB.moveToTrash(id);
                        alert('Başvuru çöp kutusuna gönderildi.');
                        renderDashboard();
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME 2: ÇÖP KUTUSU
        // ------------------------------------------------------------------
        function renderTrashTab(target) {
            const allApps = getApplications();
            const trashApps = allApps.filter(a => a.isTrash);

            if (trashApps.length === 0) {
                target.innerHTML = `
                    <div class="no-records" style="padding: 50px; text-align: center;">
                        <h4>Çöp Kutusu Boş</h4>
                        <p style="color: var(--text-muted);">Çöp kutusunda başvuru bulunmamaktadır.</p>
                    </div>
                `;
                return;
            }

            let trashListHtml = `
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 1.1rem; color: var(--danger);">Çöp Kutusu</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Silinen başvurular burada saklanır. Arşive geri yükleyebilir veya kalıcı olarak silebilirsiniz.</p>
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
                                Arşive Geri Yükle
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
                        alert('Başvuru Çöp Kutusundan çıkarıldı ve Arşive geri taşındı.');
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
                            if (window.FileStorage) {
                                const fileKeys = ['doc1_file', 'doc2_file', 'doc3_file', 'doc4_file', 'doc5_file', 'doc6_file', 'doc7_file', 'hepatitisTestFile', 'vaccineCardFile'];
                                fileKeys.forEach(k => {
                                    window.FileStorage.deleteFile(`${id}_${k}`).catch(console.error);
                                });
                            }
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
        // SEKME: YETKİLİ YÖNETİMİ (Sadece Süper Admin)
        // ------------------------------------------------------------------
        function renderAdminsTab(target) {
            const admins = window.AppDB ? window.AppDB.getAdmins() : [];

            let html = `
                <div style="max-width: 650px;">
                    <h4 style="font-size: 1.1rem; margin-bottom: 12px;">Yetkili (Yönetici) Yönetimi</h4>
                    
                    <form id="form-add-admin" style="background: #ffffff; padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 24px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Unvan</label>
                                <select id="admin-title-input" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); background-color: #fff;">
                                    <option value="Prof. Dr.">Prof. Dr.</option>
                                    <option value="Doç. Dr.">Doç. Dr.</option>
                                    <option value="Dr. Öğr. Üyesi">Dr. Öğr. Üyesi</option>
                                    <option value="Öğr. Gör.">Öğr. Gör.</option>
                                    <option value="Arş. Gör. Dr.">Arş. Gör. Dr.</option>
                                    <option value="Arş. Gör.">Arş. Gör.</option>
                                    <option value="Uzman">Uzman</option>
                                    <option value="Memur">Memur</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Adı Soyadı</label>
                                <input type="text" id="admin-name-input" placeholder="Örn: Kemal Sunal" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">T.C. Kimlik No</label>
                                <input type="text" id="admin-tc-input" placeholder="11 Haneli Rakam" required maxlength="11" pattern="[0-9]{11}" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">E-posta Adresi</label>
                                <input type="email" id="admin-email-input" placeholder="isim@balikesir.edu.tr" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                            </div>
                            <div style="grid-column: span 2;">
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-main);">Giriş Şifresi</label>
                                <input type="password" id="admin-password-input" placeholder="Şifre" required style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; font-weight: 600; padding: 10px;">Yetkili Ekle</button>
                    </form>

                    <div class="admins-list" style="display: flex; flex-direction: column; gap: 8px;">
            `;

            admins.forEach(adm => {
                const displayName = `${adm.title || ''} ${adm.name}`;
                const displayMeta = `TC: ${adm.tc || '—'} • E-posta: ${adm.email || '—'} • Şifre: ${adm.password || '—'}`;
                const deleteKey = adm.email;

                html += `
                    <div style="background: #ffffff; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <div>
                            <span style="font-weight: 600; color: var(--text-main); display: block;">${displayName}</span>
                            <small style="color: var(--text-muted); font-size: 0.8rem;">${displayMeta}</small>
                        </div>
                        <div style="display: flex;">
                            <button type="button" class="btn btn-outline btn-sm btn-edit-admin" data-key="${deleteKey}" style="margin-right: 6px; font-weight: 600; padding: 4px 10px;">Düzenle</button>
                            <button type="button" class="btn btn-danger btn-sm btn-del-admin" data-key="${deleteKey}">Sil</button>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
            target.innerHTML = html;

            // TC mask for add form
            const tcInput = document.getElementById('admin-tc-input');
            if (tcInput) {
                tcInput.addEventListener('input', e => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                });
            }

            const form = document.getElementById('form-add-admin');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    const title = document.getElementById('admin-title-input').value;
                    const name = document.getElementById('admin-name-input').value.trim();
                    const tc = document.getElementById('admin-tc-input').value.trim();
                    const email = document.getElementById('admin-email-input').value.trim();
                    const password = document.getElementById('admin-password-input').value;

                    if (tc.length !== 11) {
                        alert('T.C. Kimlik Numarası 11 haneli olmalıdır.');
                        return;
                    }

                    const adminObj = { title, name, tc, email, password };

                    if (window.AppDB && window.AppDB.addAdmin(adminObj)) {
                        alert('Yeni yetkili başarıyla eklendi.');
                        renderDashboard();
                    } else {
                        alert('Bu yetkili zaten mevcut veya bilgileri geçersiz.');
                    }
                });
            }

            // Edit Modal & Listeners Setup
            const editModal = document.getElementById('editAdminModal');
            const closeEditBtn = document.getElementById('btn-close-edit-admin');
            const editForm = document.getElementById('form-edit-admin');

            if (closeEditBtn && editModal) {
                closeEditBtn.onclick = () => {
                    editModal.classList.remove('active');
                };
            }

            // Edit button click listeners
            target.querySelectorAll('.btn-edit-admin').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    const adminObj = admins.find(a => a.email === key);
                    if (adminObj && editModal) {
                        document.getElementById('edit-admin-old-email').value = adminObj.email;
                        document.getElementById('edit-admin-title').value = adminObj.title || '';
                        document.getElementById('edit-admin-name').value = adminObj.name || '';
                        document.getElementById('edit-admin-tc').value = adminObj.tc || '';
                        document.getElementById('edit-admin-email').value = adminObj.email || '';
                        document.getElementById('edit-admin-password').value = adminObj.password || '';
                        editModal.classList.add('active');
                    }
                });
            });

            // TC mask for edit form
            const editTcInput = document.getElementById('edit-admin-tc');
            if (editTcInput) {
                editTcInput.addEventListener('input', e => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                });
            }

            // Submit listener on edit form
            if (editForm) {
                editForm.onsubmit = e => {
                    e.preventDefault();
                    const oldEmail = document.getElementById('edit-admin-old-email').value;
                    const title = document.getElementById('edit-admin-title').value;
                    const name = document.getElementById('edit-admin-name').value.trim();
                    const tc = document.getElementById('edit-admin-tc').value.trim();
                    const email = document.getElementById('edit-admin-email').value.trim();
                    const password = document.getElementById('edit-admin-password').value;

                    if (tc.length !== 11) {
                        alert('T.C. Kimlik Numarası 11 haneli olmalıdır.');
                        return;
                    }

                    const adminObj = { title, name, tc, email, password };

                    if (window.AppDB && window.AppDB.updateAdmin(oldEmail, adminObj)) {
                        alert('Yetkili bilgileri başarıyla güncellendi.');
                        if (editModal) editModal.classList.remove('active');
                        renderDashboard();
                    } else {
                        alert('Güncelleme başarısız. Bu e-posta, T.C. veya isim başka bir yetkili tarafından kullanılıyor olabilir.');
                    }
                };
            }

            target.querySelectorAll('.btn-del-admin').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    if (confirm(`Bu yetkiliyi silmek istediğinize emin misiniz?`)) {
                        window.AppDB.deleteAdmin(key);
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
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="course-codename-input" placeholder="Ders Kodu ve Adı (Örn: HEM301 - Klinik Hemşirelik I)" required style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                            <button type="submit" class="btn btn-primary">Ders Ekle</button>
                        </div>
                    </form>

                    <div class="courses-list" style="display: flex; flex-direction: column; gap: 8px;">
            `;

            if (courses.length === 0) {
                html += `<div style="color: var(--text-muted); font-style: italic;">Henüz tanımlanmış ders bulunmamaktadır.</div>`;
            } else {
                courses.forEach(c => {
                    html += `
                        <div style="background: #ffffff; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-weight: 700; color: var(--primary); font-size: 0.85rem;">[${c.department} - ${c.term}]</span>
                                <span style="font-weight: 600; color: var(--text-main); margin-left: 8px;">${c.codeName}</span>
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
                    const codeName = document.getElementById('course-codename-input').value.trim();

                    if (dept && term && codeName && window.AppDB.addCourse(dept, term, codeName)) {
                        alert('Yeni ders eklendi.');
                        renderDashboard();
                    } else {
                        alert('Bu ders zaten ekli veya bilgiler eksik.');
                    }
                });
            }

            target.querySelectorAll('.btn-del-course').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`Bu dersi silmek istediğinize emin misiniz?`)) {
                        window.AppDB.deleteCourse(id);
                        renderDashboard();
                    }
                });
            });
        }

        // ------------------------------------------------------------------
        // SEKME 5: SORMULU ÖĞRETİM ELEMANI YÖNETİMİ (Ekle / Sil)
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

            instructors.forEach(inst => {
                html += `
                    <div style="background: #ffffff; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: var(--text-main);">${inst}</span>
                        <button type="button" class="btn btn-danger btn-sm btn-del-instructor" data-name="${inst}">Sil</button>
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
        renderDashboard(); 
    };
})();
