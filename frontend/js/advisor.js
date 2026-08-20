/**
 * ==========================================================================
 * Akademik Danışman Portalı Mantığı - advisor.js (Birleşik Tek Panel Sürümü)
 * Geliştirici 3 Sorumluluk Alanı (Danışman Paneli & Belge/Sağlık/Aşılama Onaylama)
 * ==========================================================================
 */

(function() {
    // Portali ilklendirme fonksiyonu
    window.initDanismanPortali = function(container) {
        if (!container) return;

        let expandedCardId = null; // Genişletilmiş kartın ID'sini tutar
        let searchQuery = '';
        let filterDepartment = '';
        let filterClass = '';
        let filterStatus = 'all';

        // Evrak İsimleri Eşleşmesi
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
            if (window.AppDB && window.AppDB.applications) {
                return window.AppDB.applications;
            }
            return JSON.parse(localStorage.getItem('db_applications') || '[]');
        }

        function saveApplications(apps) {
            if (window.AppDB) {
                window.AppDB.applications = apps;
            }
            localStorage.setItem('db_applications', JSON.stringify(apps));
        }

        function calculateStats() {
            const apps = getApplications();
            let total = apps.length;
            let fullyApproved = 0;
            let pendingDocsCount = 0;

            apps.forEach(app => {
                let allApproved = true;
                const statuses = app.documentsStatus || {};
                
                Object.keys(statuses).forEach(key => {
                    const status = statuses[key].status;
                    if (status === 'Bekliyor') {
                        pendingDocsCount++;
                    }
                    if (status !== 'Onaylandı') {
                        allApproved = false;
                    }
                });

                if (allApproved && Object.keys(statuses).length > 0) {
                    fullyApproved++;
                }
            });

            return { total, fullyApproved, pendingDocs: pendingDocsCount };
        }

        function renderDashboard() {
            const stats = calculateStats();
            
            container.innerHTML = `
                <div class="dashboard-header-inner" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">
                            <i class="fa-solid fa-graduation-cap" style="color: var(--primary); margin-right: 8px;"></i>
                            Yetkili Evrak Değerlendirme & Sağlık Takip Paneli
                        </h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Tüm öğrenci staj belgelerini, sağlık evraklarını ve aşı takibini tek bir yerden yönetin.</p>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" id="btn-reset-db" style="background-color: var(--danger); color: #ffffff; padding: 8px 14px; font-size: 0.8rem; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-trash-can"></i> Tüm Kayıtları Sıfırla
                    </button>
                </div>

                <!-- İstatistik Kartları -->
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-info">
                            <div class="stat-val">${stats.total}</div>
                            <div class="stat-label">Toplam Başvuru</div>
                        </div>
                        <div class="stat-icon primary">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <div class="stat-val">${stats.fullyApproved}</div>
                            <div class="stat-label">Tüm Belgeleri Onaylanan</div>
                        </div>
                        <div class="stat-icon success">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <div class="stat-val">${stats.pendingDocs}</div>
                            <div class="stat-label">Onay Bekleyen Toplam Evrak</div>
                        </div>
                        <div class="stat-icon warning">
                            <i class="fa-solid fa-clock"></i>
                        </div>
                    </div>
                </div>

                <!-- Filtreleme Alanı -->
                <div class="filters-card">
                    <div class="filters-grid">
                        <div class="search-input-wrapper">
                            <i class="fa-solid fa-magnifying-glass"></i>
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
                                <option value="rejected" ${filterStatus === 'rejected' ? 'selected' : ''}>Reddedilen Var</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Liste -->
                <div class="list-container" id="adv-student-list"></div>
            `;

            // Event listener'ları bağla
            document.getElementById('adv-search').addEventListener('input', function(e) {
                searchQuery = e.target.value;
                renderStudentList();
            });

            document.getElementById('adv-filter-dept').addEventListener('change', function(e) {
                filterDepartment = e.target.value;
                renderStudentList();
            });

            document.getElementById('adv-filter-class').addEventListener('change', function(e) {
                filterClass = e.target.value;
                renderStudentList();
            });

            document.getElementById('adv-filter-status').addEventListener('change', function(e) {
                filterStatus = e.target.value;
                renderStudentList();
            });

            const resetBtn = document.getElementById('btn-reset-db');
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    if (confirm("Sistemdeki tüm kayıtlı staj başvurularını ve aşı verilerini sıfırlamak (silmek) istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
                        localStorage.removeItem('db_applications');
                        if (window.AppDB) {
                            window.AppDB.applications = [];
                        }
                        renderDashboard();
                    }
                });
            }

            renderStudentList();
        }

        function renderStudentList() {
            const listContainer = document.getElementById('adv-student-list');
            if (!listContainer) return;

            const apps = getApplications();
            
            // Filtreleme mantığı
            const filteredApps = apps.filter(app => {
                const nameMatch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  app.studentNo.includes(searchQuery);
                const deptMatch = !filterDepartment || app.department === filterDepartment;
                const classMatch = !filterClass || app.studentClass === filterClass;
                
                // Durum filtresi
                let statusMatch = true;
                if (filterStatus !== 'all') {
                    const statuses = Object.values(app.documentsStatus || {}).map(d => d.status);
                    if (filterStatus === 'pending') {
                        statusMatch = statuses.includes('Bekliyor');
                    } else if (filterStatus === 'approved') {
                        statusMatch = statuses.length > 0 && statuses.every(s => s === 'Onaylandı');
                    } else if (filterStatus === 'rejected') {
                        statusMatch = statuses.includes('Reddedildi');
                    }
                }

                return nameMatch && deptMatch && classMatch && statusMatch;
            });

            if (apps.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-records" style="padding: 60px 20px;">
                        <i class="fa-solid fa-users-slash" style="color: #cbd5e1; font-size: 3.5rem; margin-bottom: 16px; display: block;"></i>
                        <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Henüz Başvuru Yapılmadı</h4>
                        <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 400px; margin: 0 auto;">Sisteme kayıtlı staj başvurusu bulunmamaktadır. Öğrenciler form doldurup gönderdikçe kayıtlar burada listelenecektir.</p>
                    </div>
                `;
                return;
            }

            if (filteredApps.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-records" style="padding: 60px 20px;">
                        <i class="fa-solid fa-magnifying-glass" style="color: #cbd5e1; font-size: 3.5rem; margin-bottom: 16px; display: block;"></i>
                        <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Sonuç Bulunamadı</h4>
                        <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 400px; margin: 0 auto;">Arama veya filtreleme kriterlerinize uygun öğrenici kaydı bulunamadı.</p>
                    </div>
                `;
                return;
            }

            listContainer.innerHTML = '';

            filteredApps.forEach(app => {
                // Öğrencinin onay ilerlemesini hesapla (X/7)
                const statuses = app.documentsStatus || {};
                const keys = Object.keys(statuses);
                const totalDocs = keys.length;
                const approvedCount = keys.filter(k => statuses[k].status === 'Onaylandı').length;
                const pendingCount = keys.filter(k => statuses[k].status === 'Bekliyor').length;
                const rejectedCount = keys.filter(k => statuses[k].status === 'Reddedildi').length;

                let progressBadgeClass = 'badge-pending';
                let progressBadgeText = `${approvedCount}/${totalDocs} Onaylandı`;
                if (approvedCount === totalDocs && totalDocs > 0) {
                    progressBadgeClass = 'badge-approved';
                    progressBadgeText = 'Tümü Onaylandı';
                } else if (rejectedCount > 0) {
                    progressBadgeClass = 'badge-rejected';
                    progressBadgeText = `${rejectedCount} Reddedildi`;
                } else if (pendingCount > 0) {
                    progressBadgeClass = 'badge-pending';
                    progressBadgeText = `${pendingCount} Bekliyor`;
                }

                // Aşı Dozları Bilgisi (Kaydedilmiş veri varsa yükle, yoksa varsayılan başlat)
                const vaxData = app.vaccinationData || getInitVaxData();

                const initials = app.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const isActive = app.id === expandedCardId ? 'active' : '';

                const card = document.createElement('div');
                card.className = `student-list-card ${isActive}`;
                card.setAttribute('data-id', app.id);
                
                card.innerHTML = `
                    <div class="student-card-header">
                        <div class="student-meta">
                            <div class="student-avatar">${initials}</div>
                            <div class="student-title">
                                <h4>${app.fullName}</h4>
                                <p>${app.studentNo} • ${app.department} • ${app.studentClass}</p>
                            </div>
                        </div>
                        <div class="student-summary-status">
                            <span class="badge ${progressBadgeClass}">${progressBadgeText}</span>
                            <i class="fa-solid fa-chevron-down card-toggle-icon"></i>
                        </div>
                    </div>
                    <div class="student-card-body">
                        <!-- Öğrenci Detay Grid -->
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

                        <!-- Evraklar Listesi -->
                        <div class="docs-review-section" style="margin-bottom: 24px;">
                            <h5><i class="fa-solid fa-file-shield"></i> Yüklenen Belgelerin İnceleme ve Onay Durumu</h5>
                            <table class="docs-table">
                                <thead>
                                    <tr>
                                        <th>Belge Adı</th>
                                        <th>Belge Detayı / Tarih</th>
                                        <th>Dosya</th>
                                        <th>Onay Durumu</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.keys(docNames).map(key => {
                                        const doc = statuses[key] || { status: 'Yüklenmedi' };
                                        
                                        // Detay bilgileri oluştur
                                        let detail = '—';
                                        if (key === 'isgCertificate' && doc.date) {
                                            detail = `Belge Tarihi: ${formatDate(doc.date)}`;
                                        } else if (key === 'medicalForm' && doc.date) {
                                            detail = `Muayene: ${formatDate(doc.date)}<br><small style="color: var(--text-muted)">Bitiş: ${formatDate(doc.expiryDate)}</small>`;
                                        } else if (key === 'privacyAgreement' && doc.physicalCount) {
                                            detail = `Fiziksel Teslim: ${doc.physicalCount} Adet`;
                                        } else if ((key === 'hemogram' || key === 'elisa' || key === 'chestXray') && doc.date) {
                                            detail = `Tetkik Tarihi: ${formatDate(doc.date)}`;
                                        }

                                        let statusBadgeClass = 'badge-pending';
                                        if (doc.status === 'Onaylandı') statusBadgeClass = 'badge-approved';
                                        else if (doc.status === 'Reddedildi') statusBadgeClass = 'badge-rejected';
                                        else if (doc.status === 'Yüklenmedi') statusBadgeClass = 'optional-badge';

                                        const fileAction = doc.status !== 'Yüklenmedi' 
                                            ? `<a href="#" class="doc-link btn-view-file-mock" data-file="${key}" data-student="${app.fullName}"><i class="fa-solid fa-file-pdf"></i> İncele</a>`
                                            : `<span style="color: var(--text-muted); font-style: italic;">Dosya Yok</span>`;

                                        const actionButtons = doc.status !== 'Yüklenmedi' 
                                            ? `
                                                <div class="btn-group">
                                                    <button class="btn-action btn-approve" data-student-id="${app.id}" data-doc-key="${key}" title="Belgeyi Onayla">
                                                        <i class="fa-solid fa-check"></i> Onayla
                                                    </button>
                                                    <button class="btn-action btn-reject" data-student-id="${app.id}" data-doc-key="${key}" title="Belgeyi Reddet">
                                                        <i class="fa-solid fa-xmark"></i> Reddet
                                                    </button>
                                                </div>
                                              `
                                            : `—`;

                                        return `
                                            <tr>
                                                <td style="font-weight: 600; color: var(--text-main);">${docNames[key]}</td>
                                                <td>${detail}</td>
                                                <td>${fileAction}</td>
                                                <td><span class="badge ${statusBadgeClass}">${doc.status}</span></td>
                                                <td>${actionButtons}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Hepatit ve Aşı Takip Bölümü (YENİ BİRLEŞİK EK) -->
                        <div class="vax-section" style="border-top: 1px solid var(--border); padding-top: 20px;">
                            <h5 style="color: var(--primary); margin-bottom: 16px;">
                                <i class="fa-solid fa-syringe" style="margin-right: 8px;"></i>
                                Hepatit B Aşılama ve Bağışıklık Durum Takibi
                            </h5>
                            
                            <div class="form-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 16px;">
                                <div class="form-group">
                                    <label>Hepatit B Bağışıklık Durumu</label>
                                    <select class="select-vax-status" data-student-id="${app.id}">
                                        <option value="Belirsiz" ${vaxData.hepatitisStatus === 'Belirsiz' ? 'selected' : ''}>Belirsiz (Test Sonucu Bekleniyor)</option>
                                        <option value="Bağışık" ${vaxData.hepatitisStatus === 'Bağışık' ? 'selected' : ''}>Bağışık (Aşı Gerekli Değil)</option>
                                        <option value="Aşı Gerekli" ${vaxData.hepatitisStatus === 'Aşı Gerekli' ? 'selected' : ''}>Bağışık Değil (Aşı Gerekli)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Aşı Listesine Dahil mi?</label>
                                    <select class="select-vax-included" data-student-id="${app.id}">
                                        <option value="Hayır" ${vaxData.vaccineIncluded === 'Hayır' ? 'selected' : ''}>Hayır</option>
                                        <option value="Evet" ${vaxData.vaccineIncluded === 'Evet' ? 'selected' : ''}>Evet (Aşı Takip Listesinde)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="vax-dose-table">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div class="vax-dose-title">Aşı Dozları Takip Tablosu</div>
                                    <button class="btn btn-outline btn-sm btn-add-dose" data-student-id="${app.id}">
                                        <i class="fa-solid fa-plus"></i> Doz Ekle
                                    </button>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                                    ${vaxData.doses.map((dose, idx) => `
                                        <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <input type="checkbox" class="chk-dose-completed" data-student-id="${app.id}" data-idx="${idx}" ${dose.completed ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                                                <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${dose.name}</span>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <input type="date" class="input-dose-date" data-student-id="${app.id}" data-idx="${idx}" value="${dose.date || ''}" style="width: 140px; padding: 4px 8px; font-size: 0.8rem;">
                                                <button class="btn-remove-dose btn-delete-dose" data-student-id="${app.id}" data-idx="${idx}" style="color: var(--danger); font-size: 0.9rem; border: none; background: transparent; cursor: pointer;">
                                                    <i class="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                    </div>
                `;

                // Toggling body on header click
                card.querySelector('.student-card-header').addEventListener('click', () => {
                    const isExpanded = card.classList.contains('active');
                    
                    // Collapse previously active card
                    const activeCard = listContainer.querySelector('.student-list-card.active');
                    if (activeCard) {
                        activeCard.classList.remove('active');
                        activeCard.querySelector('.student-card-body').style.display = 'none';
                    }

                    if (!isExpanded) {
                        card.classList.add('active');
                        card.querySelector('.student-card-body').style.display = 'block';
                        expandedCardId = app.id;
                    } else {
                        expandedCardId = null;
                    }
                });

                listContainer.appendChild(card);
            });

            // Dosya görüntüleme mock olayı
            listContainer.querySelectorAll('.btn-view-file-mock').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const student = btn.getAttribute('data-student');
                    const file = docNames[btn.getAttribute('data-file')];
                    alert(`[Mock Görüntüleyici]\n\nÖğrenci: ${student}\nBelge: ${file}\n\nDosya doğrulandı, okuma yetkisi başarılı.`);
                });
            });

            // Belge onaylama olayı
            listContainer.querySelectorAll('.btn-approve').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const docKey = btn.getAttribute('data-doc-key');
                    updateDocStatus(studentId, docKey, 'Onaylandı');
                });
            });

            // Belge reddetme olayı
            listContainer.querySelectorAll('.btn-reject').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const docKey = btn.getAttribute('data-doc-key');
                    
                    const reason = prompt("Reddetme gerekçesini giriniz:", "Belge üzerindeki bilgiler okunamıyor.");
                    if (reason !== null) {
                        updateDocStatus(studentId, docKey, 'Reddedildi', reason);
                    }
                });
            });

            // Aşı Durumu Seçimi
            listContainer.querySelectorAll('.select-vax-status').forEach(select => {
                select.addEventListener('change', function() {
                    const studentId = select.getAttribute('data-student-id');
                    const val = select.value;
                    let autoIncluded = null;
                    if (val === 'Aşı Gerekli') {
                        autoIncluded = 'Evet';
                    }
                    updateVaccinationData(studentId, {
                        hepatitisStatus: val,
                        ...(autoIncluded ? { vaccineIncluded: autoIncluded } : {})
                    });
                });
            });

            listContainer.querySelectorAll('.select-vax-included').forEach(select => {
                select.addEventListener('change', function() {
                    const studentId = select.getAttribute('data-student-id');
                    updateVaccinationData(studentId, { vaccineIncluded: select.value });
                });
            });

            // Aşı Checkbox Durumu
            listContainer.querySelectorAll('.chk-dose-completed').forEach(chk => {
                chk.addEventListener('change', function() {
                    const studentId = chk.getAttribute('data-student-id');
                    const idx = parseInt(chk.getAttribute('data-idx'));
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app) {
                        if (!app.vaccinationData) app.vaccinationData = getInitVaxData();
                        app.vaccinationData.doses[idx].completed = chk.checked;
                        saveApplications(apps);
                    }
                });
            });

            // Aşı Tarihi
            listContainer.querySelectorAll('.input-dose-date').forEach(input => {
                input.addEventListener('change', function() {
                    const studentId = input.getAttribute('data-student-id');
                    const idx = parseInt(input.getAttribute('data-idx'));
                    const apps = getApplications();
                    const app = apps.find(a => a.id === studentId);
                    if (app) {
                        if (!app.vaccinationData) app.vaccinationData = getInitVaxData();
                        app.vaccinationData.doses[idx].date = input.value;
                        saveApplications(apps);
                    }
                });
            });

            // Aşı / Doz Ekleme
            listContainer.querySelectorAll('.btn-add-dose').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const name = prompt("Aşı veya doz adını girin (Örn: 4. Doz veya Tetanoz 1. Doz):", "Ek Doz");
                    if (name) {
                        const apps = getApplications();
                        const app = apps.find(a => a.id === studentId);
                        if (app) {
                            if (!app.vaccinationData) app.vaccinationData = getInitVaxData();
                            app.vaccinationData.doses.push({
                                name: name,
                                date: '',
                                completed: false
                            });
                            saveApplications(apps);
                            // Yenile
                            renderDashboard();
                        }
                    }
                });
            });

            // Aşı / Doz Silme
            listContainer.querySelectorAll('.btn-delete-dose').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const studentId = btn.getAttribute('data-student-id');
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    if (confirm("Bu aşı dozunu silmek istediğinize emin misiniz?")) {
                        const apps = getApplications();
                        const app = apps.find(a => a.id === studentId);
                        if (app && app.vaccinationData) {
                            app.vaccinationData.doses.splice(idx, 1);
                            saveApplications(apps);
                            // Yenile
                            renderDashboard();
                        }
                    }
                });
            });
        }

        function getInitVaxData() {
            return {
                hepatitisStatus: 'Belirsiz',
                vaccineIncluded: 'Hayır',
                doses: [
                    { name: '1. Doz', date: '', completed: false },
                    { name: '2. Doz', date: '', completed: false },
                    { name: '3. Doz', date: '', completed: false }
                ]
            };
        }

        function updateVaccinationData(studentId, data) {
            const apps = getApplications();
            const idx = apps.findIndex(a => a.id === studentId);
            if (idx !== -1) {
                if (!apps[idx].vaccinationData) apps[idx].vaccinationData = getInitVaxData();
                apps[idx].vaccinationData = { ...apps[idx].vaccinationData, ...data };
                saveApplications(apps);
                renderDashboard();
            }
        }

        function updateDocStatus(studentId, docKey, status, reason = '') {
            const apps = getApplications();
            const appIndex = apps.findIndex(a => a.id === studentId);
            
            if (appIndex !== -1) {
                if (!apps[appIndex].documentsStatus) apps[appIndex].documentsStatus = {};
                if (!apps[appIndex].documentsStatus[docKey]) apps[appIndex].documentsStatus[docKey] = {};
                
                apps[appIndex].documentsStatus[docKey].status = status;
                if (reason) {
                    apps[appIndex].documentsStatus[docKey].rejectionReason = reason;
                } else {
                    delete apps[appIndex].documentsStatus[docKey].rejectionReason;
                }

                saveApplications(apps);
                
                // Dashboard ve listeyi güncelle
                const stats = calculateStats();
                // Kartı açık tutarak listeyi yeniden çiz
                renderDashboard();
            }
        }

        function formatDate(dateStr) {
            if (!dateStr) return '—';
            try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
                }
                return new Date(dateStr).toLocaleDateString('tr-TR');
            } catch (e) {
                return dateStr;
            }
        }

        // İlk yükleme
        renderDashboard();
    };
})();
