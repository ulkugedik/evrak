/**
 * ==========================================================================
 * Genel Uygulama Mantığı & Navigasyon - app.js
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const studentForm = document.getElementById('studentForm');

    // 1. Sekmeler Arası Geçiş Yönetimi
    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) switchTab(target);
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) switchTab(target);
        });
    });

    // 2. Canlı İlerleme Çubuğu Hesaplama
    window.updateProgress = function() {
        if (!studentForm) return;

        const requiredInputs = studentForm.querySelectorAll('[required]');
        let filledCount = 0;

        requiredInputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                filledCount++;
            }
        });

        const uploadedFiles = studentForm.querySelectorAll('input[type="file"]');
        let fileCount = 0;
        uploadedFiles.forEach(fileInput => {
            if (fileInput.files && fileInput.files.length > 0) fileCount++;
        });

        const totalItems = requiredInputs.length + Math.max(uploadedFiles.length, 1);
        const currentScore = filledCount + fileCount;
        let percent = Math.round((currentScore / totalItems) * 100);
        percent = Math.min(percent, 100);

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
    };

    if (studentForm) {
        studentForm.addEventListener('input', window.updateProgress);
        studentForm.addEventListener('change', window.updateProgress);
        window.updateProgress();
    }

    // 3. Form Selectlerini Dinamik Doldurma (Danışman ve Sorumlu Öğretim Elemanı)
    window.populateDynamicFormSelects = function() {
        // Danışmanlar
        const advisorSelect = document.getElementById('academicAdvisor');
        if (advisorSelect && window.AppDB) {
            const currentVal = advisorSelect.value;
            const advisors = [...window.AppDB.getAdvisors()];
            
            // Add dynamic admin names as selectable advisors
            const admins = window.AppDB.getAdmins ? window.AppDB.getAdmins() : [];
            admins.forEach(adm => {
                const fullName = `${adm.title || ''} ${adm.name}`;
                if (!advisors.includes(fullName)) {
                    advisors.push(fullName);
                }
            });

            advisorSelect.innerHTML = '<option value="">-- Akademik Danışmanınızı Seçiniz --</option>';
            advisors.forEach(adv => {
                const opt = document.createElement('option');
                opt.value = adv;
                opt.textContent = adv;
                if (adv === currentVal) opt.selected = true;
                advisorSelect.appendChild(opt);
            });
        }

        // Sorumlu Öğretim Elemanı
        const instructorSelect = document.getElementById('responsibleInstructor');
        if (instructorSelect && window.AppDB) {
            const currentVal = instructorSelect.value;
            const instructors = window.AppDB.getInstructors();
            instructorSelect.innerHTML = '<option value="">-- Öğretim Elemanı Seçiniz --</option>';
            instructors.forEach(ins => {
                const opt = document.createElement('option');
                opt.value = ins;
                opt.textContent = ins;
                if (ins === currentVal) opt.selected = true;
                instructorSelect.appendChild(opt);
            });
        }
    };

    window.populateDynamicFormSelects();

    // 4. Modal Buton Yönetimi
    const successModal = document.getElementById('successModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnPrintSummary = document.getElementById('btnPrintSummary');

    if (btnCloseModal && successModal) {
        btnCloseModal.addEventListener('click', () => successModal.classList.remove('active'));
    }

    if (btnPrintSummary) {
        btnPrintSummary.addEventListener('click', () => window.print());
    }

    // 5. Yetkili Giriş & Görünüm Yönlendirme
    const btnLoginTrigger = document.getElementById('btn-login-trigger');
    const btnLogout = document.getElementById('btn-logout');
    const loginModal = document.getElementById('loginModal');
    const btnCloseLogin = document.getElementById('btn-close-login');
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    
    const dashboardContainer = document.getElementById('dashboard-container');
    const progressCard = document.querySelector('.progress-bar-card');
    const navTabs = document.querySelector('.nav-tabs');

    // Yetkili Giriş Modalı Aç/Kapa
    if (btnLoginTrigger && loginModal) {
        btnLoginTrigger.addEventListener('click', () => {
            loginUsernameInput.value = '';
            loginPasswordInput.value = '';
            if (loginErrorMsg) {
                loginErrorMsg.classList.add('hidden');
                loginErrorMsg.style.display = 'none';
            }
            loginModal.classList.add('active');
        });
    }

    if (btnCloseLogin && loginModal) {
        btnCloseLogin.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }

    // Yetkili Giriş Yap
    if (btnSubmitLogin) {
        btnSubmitLogin.addEventListener('click', () => {
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;

            let role = null;
            let displayName = "";
            if ((username === 'admin' || username === 'danisman' || username === 'saglik') && (password === 'admin' || password === '123')) {
                role = 'superadmin';
                displayName = "Süper Yönetici (Sistem Yöneticisi)";
            } else if (window.AppDB) {
                const adminsList = window.AppDB.getAdmins ? window.AppDB.getAdmins() : [];
                const adminObj = adminsList.find(a => (a.email === username || a.tc === username) && a.password === password);
                if (adminObj) {
                    role = 'admin';
                    displayName = `${adminObj.title || ''} ${adminObj.name}`;
                }
            }

            if (role) {
                localStorage.setItem('currentUser', JSON.stringify({ role: role, username: username, displayName: displayName }));
                loginModal.classList.remove('active');
                if (btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
                if (btnLogout) btnLogout.classList.remove('hidden');
                showAuthorizedView(role);
            } else {
                if (loginErrorMsg) {
                    loginErrorMsg.classList.remove('hidden');
                    loginErrorMsg.style.display = 'flex';
                }
            }
        });

        // Enter tuşu ile giriş
        loginPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnSubmitLogin.click();
        });
    }

    // Çıkış Yap
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (btnLoginTrigger) btnLoginTrigger.classList.remove('hidden');
            if (btnLogout) btnLogout.classList.add('hidden');
            showAuthorizedView('student');
        });
    }

    function showAuthorizedView(role) {
        const userInfoDisplay = document.getElementById('user-info-display');
        if (role === 'student') {
            localStorage.removeItem('currentUser');
            if (userInfoDisplay) {
                userInfoDisplay.classList.add('hidden');
                userInfoDisplay.textContent = '';
            }
            if (studentForm) studentForm.classList.remove('hidden');
            if (progressCard) progressCard.classList.remove('hidden');
            if (navTabs) navTabs.classList.remove('hidden');
            if (dashboardContainer) {
                dashboardContainer.classList.add('hidden');
                dashboardContainer.innerHTML = '';
            }
            window.populateDynamicFormSelects();
        } else {
            // Öğrenci formu alanlarını gizle, takip panelini aç
            if (studentForm) studentForm.classList.add('hidden');
            if (progressCard) progressCard.classList.add('hidden');
            if (navTabs) navTabs.classList.add('hidden');
            if (dashboardContainer) {
                dashboardContainer.classList.remove('hidden');
                dashboardContainer.innerHTML = '';
            }

            if (userInfoDisplay) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                userInfoDisplay.textContent = currentUser.displayName || 'Yetkili';
                userInfoDisplay.classList.remove('hidden');
            }

            if (window.initDanismanPortali) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                window.initDanismanPortali(dashboardContainer, currentUser.role);
            } else {
                dashboardContainer.innerHTML = '<div class="system-notice"><p>Yönetim paneli yüklenemedi.</p></div>';
            }
        }
    }
});
