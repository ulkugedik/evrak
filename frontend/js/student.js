/**
 * ==========================================================================
 * Öğrenci Uygulama Evrakları Portalı - student.js
 * Geliştirici 1 Sorumluluk Alanı: Form Doğrulama & Karakter Sınırlamaları
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');

    // ----------------------------------------------------------------------
    // KARAKTER VE FORMAT SINIRLAMALARI (INPUT MASKS & CONSTRAINTS)
    // ----------------------------------------------------------------------

    // 1. T.C. Kimlik No: Sadece 11 Haneli Rakam (Harf & Sembol Engelleme)
    const tcNoInput = document.getElementById('tcNo');
    if (tcNoInput) {
        tcNoInput.addEventListener('input', (e) => {
            // Sadece rakam tut, fazlasını sil
            let val = e.target.value.replace(/[^0-9]/g, '');
            if (val.length > 11) val = val.substring(0, 11);
            e.target.value = val;
        });

        tcNoInput.addEventListener('blur', (e) => {
            const val = e.target.value.trim();
            if (val.length > 0 && val.length !== 11) {
                e.target.style.borderColor = 'var(--danger)';
                alert('T.C. Kimlik Numarası tam olarak 11 haneli rakamlardan oluşmalıdır.');
            } else {
                e.target.style.borderColor = '';
            }
        });
    }

    // 2. Telefon Numarası Maskeleme: Format 05XX XXX XX XX
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Sadece rakamları al
            let digits = e.target.value.replace(/[^0-9]/g, '');
            
            // Maksimum 11 hane (05XXXXXXXXX)
            if (digits.length > 11) digits = digits.substring(0, 11);

            // Formatlama: 05XX XXX XX XX
            let formatted = '';
            if (digits.length > 0) {
                // Eğer başı 0 ile başlamıyorsa 05 eklemeye zorla veya 0 ile başlat
                if (!digits.startsWith('0')) digits = '0' + digits;
                if (digits.length > 1 && !digits.startsWith('05')) {
                    // Eğer 0 ile başlayıp ikinci rakam 5 değilse (örn 03), yine 05 yapabiliriz
                    digits = '05' + digits.substring(2);
                }

                if (digits.length <= 4) {
                    formatted = digits; // 05XX
                } else if (digits.length <= 7) {
                    formatted = `${digits.substring(0, 4)} ${digits.substring(4)}`; // 05XX XXX
                } else if (digits.length <= 9) {
                    formatted = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`; // 05XX XXX XX
                } else {
                    formatted = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`; // 05XX XXX XX XX
                }
            }

            e.target.value = formatted;
        });

        phoneInput.addEventListener('blur', (e) => {
            const val = e.target.value.trim();
            // Tam format: 05XX XXX XX XX (15 karakter uzunluğu)
            if (val.length > 0 && val.length < 15) {
                e.target.style.borderColor = 'var(--danger)';
                alert('Telefon numarası "05XX XXX XX XX" formatında ve 11 haneli olmalıdır.');
            } else {
                e.target.style.borderColor = '';
            }
        });
    }

    // 3. Öğrenci Numarası: Sadece Rakamlar (Maksimum 12 hane)
    const studentNoInput = document.getElementById('studentNo');
    if (studentNoInput) {
        studentNoInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^0-9]/g, '');
            if (val.length > 12) val = val.substring(0, 12);
            e.target.value = val;
        });
    }

    // 4. Adı Soyadı: Sadece Harfler ve Boşluk (Rakam/Rakam Engelleme)
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', (e) => {
            // Sadece Türkçe/İngilizce harfler ve boşluk
            e.target.value = e.target.value.replace(/[^a-zA-ZğĞüÜşŞıİöÖçÇ\s]/g, '');
        });
    }

    // 5. Kurumsal E-posta: Format ve .edu.tr Kontrolü
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', (e) => {
            const val = e.target.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (val.length > 0 && !emailRegex.test(val)) {
                e.target.style.borderColor = 'var(--danger)';
                alert('Lütfen geçerli bir kurumsal e-posta adresi giriniz (Örn: ogrenci@ogrenci.edu.tr).');
            } else {
                e.target.style.borderColor = '';
            }
        });
    }

    // ----------------------------------------------------------------------
    // OTOMATİK TARİH HESABI (İşe Giriş / Periyodik Muayene - 1 Yıl Bitiş)
    // ----------------------------------------------------------------------
    const doc2ExamDate = document.getElementById('doc2_examDate');
    const doc2ExpiryDate = document.getElementById('doc2_expiryDate');

    if (doc2ExamDate && doc2ExpiryDate) {
        doc2ExamDate.addEventListener('change', (e) => {
            if (e.target.value) {
                const examDate = new Date(e.target.value);
                const expiryDate = new Date(examDate);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                
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

    // ----------------------------------------------------------------------
    // YÜKLENEN 7 BELGE İÇİN DOSYA ADI VE VURGU
    // ----------------------------------------------------------------------
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

    // ----------------------------------------------------------------------
    // FORM GÖNDERİMİ & DOĞRULAMA
    // ----------------------------------------------------------------------
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

            // T.C. Kimlik kontrolü (eğer girilmişse 11 hane olmak zorunda)
            const tcVal = tcNoInput ? tcNoInput.value.trim() : '';
            if (tcVal.length > 0 && tcVal.length !== 11) {
                isValid = false;
                if (tcNoInput) tcNoInput.style.borderColor = 'var(--danger)';
                alert('T.C. Kimlik Numarası 11 haneli rakam olmalıdır.');
                return;
            }

            // Telefon kontrolü (15 karakter: 05XX XXX XX XX)
            const phoneVal = phoneInput ? phoneInput.value.trim() : '';
            if (phoneVal.length < 15) {
                isValid = false;
                if (phoneInput) phoneInput.style.borderColor = 'var(--danger)';
                alert('Telefon numarası eksik! "05XX XXX XX XX" formatında doldurunuz.');
                return;
            }

            if (!isValid) {
                alert('Lütfen tüm zorunlu alanları doğru ve eksiksiz doldurunuz.');
                return;
            }

            // Form verilerini al
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

            // DB'ye kaydet
            if (window.AppDB && window.AppDB.saveStudentApplication) {
                window.AppDB.saveStudentApplication(studentRecord);
            }

            // Özet Modal Göster
            const summaryContent = document.getElementById('summaryContent');
            const successModal = document.getElementById('successModal');

            if (summaryContent) {
                summaryContent.innerHTML = `
                    <div class="summary-item">
                        <span class="summary-label">Öğrenci No / Ad Soyad:</span>
                        <span class="summary-val">${studentRecord.studentNo} - ${studentRecord.fullName}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Telefon:</span>
                        <span class="summary-val">${studentRecord.phone}</span>
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
                `;
            }

            if (successModal) successModal.classList.add('active');
        });
    }
});
