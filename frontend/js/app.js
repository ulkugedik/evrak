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

    // 3. Taslak Kaydetme (localStorage)
    const btnDraftSave = document.getElementById('btnDraftSave');
    if (btnDraftSave && studentForm) {
        btnDraftSave.addEventListener('click', () => {
            const formData = new FormData(studentForm);
            const dataObj = {};
            formData.forEach((value, key) => {
                if (typeof value === 'string') dataObj[key] = value;
            });
            localStorage.setItem('student_form_draft', JSON.stringify(dataObj));
            alert('Form taslağınız başarıyla kaydedildi.');
        });

        // Restore draft if exists
        const savedDraft = localStorage.getItem('student_form_draft');
        if (savedDraft) {
            try {
                const data = JSON.parse(savedDraft);
                Object.keys(data).forEach(key => {
                    const el = studentForm.querySelector(`[name="${key}"]`);
                    if (el && el.type !== 'file') el.value = data[key];
                });
                window.updateProgress();
            } catch (e) {
                console.error('Draft restore failed', e);
            }
        }
    }

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
});
