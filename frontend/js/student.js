/**
 * ==========================================================================
 * Öğrenci Uygulama Evrakları Portalı - student.js
 * Geliştirici 1 Sorumluluk Alanı: Öğrenci Portalı & Belge Yükleme Mantığı
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');

    // 1. İşe Giriş / Periyodik Muayene Formu - 1 Yıllık Geçerlilik Bitiş Hesabı
    const doc2ExamDate = document.getElementById('doc2_examDate');
    const doc2ExpiryDate = document.getElementById('doc2_expiryDate');

    if (doc2ExamDate && doc2ExpiryDate) {
        doc2ExamDate.addEventListener('change', (e) => {
            if (e.target.value) {
                const examDate = new Date(e.target.value);
                const expiryDate = new Date(examDate);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                
                // Format YYYY-MM-DD
                const yyyy = expiryDate.getFullYear();
                const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
                const dd = String(expiryDate.getDate()).padStart(2, '0');
                doc2ExpiryDate.value = `${yyyy}-${mm}-${dd}`;
            } else {
                doc2ExpiryDate.value = '';
            }
            if (window.updateProgress) window.updateProgress();
        });
    }

    // 2. Yüklenen Dosyalar İçin Özel Görsel Vurgu ve Dosya İsmi Gösterimi
    function initFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const box = e.target.closest('.file-upload-box');
                const nameDisplay = box ? box.querySelector('.file-name-display') : null;

                if (e.target.files && e.target.files.length > 0) {
                    const fileName = e.target.files[0].name;
                    if (nameDisplay) nameDisplay.textContent = fileName;
                    if (box) box.classList.add('has-file');
                } else {
                    if (nameDisplay) nameDisplay.textContent = 'Dosya Seçiniz veya Sürükleyiniz';
                    if (box) box.classList.remove('has-file');
                }
                if (window.updateProgress) window.updateProgress();
            });
        });
    }
    initFileUploads();

    // 3. Öğrenci Formu Gönderimi ve Özet Oluşturma
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Zorunlu alan kontrolü
            const requiredInputs = studentForm.querySelectorAll('[required]');
            let isValid = true;

            requiredInputs.forEach(input => {
                if (!input.value || input.value.trim() === '') {
                    isValid = false;
                    input.style.borderColor = 'var(--danger)';
                } else {
                    input.style.borderColor = '';
                }
            });

            if (!isValid) {
                alert('Lütfen zorunlu tüm alanları eksiksiz doldurunuz.');
                return;
            }

            // Verileri topla (Mock DB / db.js entegrasyonu)
            const formData = new FormData(studentForm);
            const studentRecord = {
                studentNo: formData.get('studentNo'),
                fullName: formData.get('fullName'),
                department: formData.get('department'),
                studentClass: formData.get('studentClass'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                academicAdvisor: formData.get('academicAdvisor'),
                academicYear: formData.get('academicYear'),
                term: formData.get('term'),
                courseNameCode: formData.get('courseNameCode'),
                institution: formData.get('institution'),
                unitName: formData.get('unitName'),
                applicationDays: formData.get('applicationDays'),
                responsibleInstructor: formData.get('responsibleInstructor'),
                submissionDate: new Date().toISOString()
            };

            // db.js varsa mock DB'ye kaydet
            if (window.AppDB && window.AppDB.saveStudentApplication) {
                window.AppDB.saveStudentApplication(studentRecord);
            }

            // Özet Penceresini (Modal) Doldur ve Göster
            const summaryContent = document.getElementById('summaryContent');
            const successModal = document.getElementById('successModal');

            if (summaryContent) {
                summaryContent.innerHTML = `
                    <div class="summary-item">
                        <span class="summary-label">Öğrenci No / Ad Soyad:</span>
                        <span class="summary-val">${studentRecord.studentNo} - ${studentRecord.fullName}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Bölüm / Sınıf:</span>
                        <span class="summary-val">${studentRecord.department} (${studentRecord.studentClass})</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Dönem & Ders:</span>
                        <span class="summary-val">${studentRecord.academicYear} ${studentRecord.term} - ${studentRecord.courseNameCode}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Uygulama Kurumu:</span>
                        <span class="summary-val">${studentRecord.institution}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Akademik Danışman:</span>
                        <span class="summary-val">${studentRecord.academicAdvisor}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Sorumlu Öğretim Elemanı:</span>
                        <span class="summary-val">${studentRecord.responsibleInstructor}</span>
                    </div>
                `;
            }

            if (successModal) successModal.classList.add('active');
        });
    }
});
