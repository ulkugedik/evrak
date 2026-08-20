/**
 * ==========================================================================
 * Öğrenci Uygulama Evrakları Portalı - student.js
 * Form Doğrulama, Dinamik Ders Filtreleme ve Dosya Bağlantıları
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');

    // ----------------------------------------------------------------------
    // KARAKTER VE FORMAT SINIRLAMALARI (INPUT MASKS & CONSTRAINTS)
    // ----------------------------------------------------------------------

    // 1. T.C. Kimlik No: Sadece 11 Haneli Rakam
    const tcNoInput = document.getElementById('tcNo');
    if (tcNoInput) {
        tcNoInput.addEventListener('input', (e) => {
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
            let digits = e.target.value.replace(/[^0-9]/g, '');
            if (digits.length > 11) digits = digits.substring(0, 11);

            let formatted = '';
            if (digits.length > 0) {
                if (!digits.startsWith('0')) digits = '0' + digits;
                if (digits.length > 1 && !digits.startsWith('05')) {
                    digits = '05' + digits.substring(2);
                }

                if (digits.length <= 4) {
                    formatted = digits;
                } else if (digits.length <= 7) {
                    formatted = `${digits.substring(0, 4)} ${digits.substring(4)}`;
                } else if (digits.length <= 9) {
                    formatted = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
                } else {
                    formatted = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
                }
            }
            e.target.value = formatted;
        });

        phoneInput.addEventListener('blur', (e) => {
            const val = e.target.value.trim();
            if (val.length > 0 && val.length < 14) {
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

    // 4. Adı Soyadı: Sadece Harfler ve Boşluk
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', (e) => {
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

    // 6. Sınıf Seçim Kısıtlaması
    const departmentSelect = document.getElementById('department');
    const studentClassSelect = document.getElementById('studentClass');
    const termSelect = document.getElementById('term');
    const courseSelect = document.getElementById('courseNameCode');

    if (departmentSelect && studentClassSelect) {
        const updateClassOptions = () => {
            const selectedDept = departmentSelect.value;
            const classOptions = studentClassSelect.querySelectorAll('option');

            const twoYearDepts = [
                "İlk ve Acil Yardım",
                "Dijital Sağlık Sistemleri Teknikerliği",
                "Tıbbi Dokümantasyon ve Sekreterlik",
                "Laborant ve Veteriner Sağlık"
            ];
            const sixYearDepts = [
                "Tıp Fakültesi"
            ];

            classOptions.forEach(opt => {
                const val = opt.value;
                if (!val) return;

                let shouldDisable = false;
                if (val === '5. Sınıf' || val === '6. Sınıf') {
                    if (!sixYearDepts.includes(selectedDept)) shouldDisable = true;
                } else if (val === '3. Sınıf' || val === '4. Sınıf' || val === 'Yüksek Lisans') {
                    if (twoYearDepts.includes(selectedDept)) shouldDisable = true;
                }

                if (shouldDisable) {
                    opt.disabled = true;
                    opt.style.display = 'none';
                    if (studentClassSelect.value === val) studentClassSelect.value = '';
                } else {
                    opt.disabled = false;
                    opt.style.display = 'block';
                }
            });
        };

        departmentSelect.addEventListener('change', updateClassOptions);
        updateClassOptions();
    }

    // ----------------------------------------------------------------------
    // 7. BÖLÜM VE DÖNEME GÖRE DERS LİSTESİ FİLTRELEME (ADMIN TARAFINDAN EKLENEN)
    // ----------------------------------------------------------------------
    function updateCourseOptions() {
        if (!departmentSelect || !termSelect || !courseSelect) return;

        const selectedDept = departmentSelect.value;
        const selectedTerm = termSelect.value;
        const currentCourseVal = courseSelect.value;

        if (!selectedDept || !selectedTerm) {
            courseSelect.innerHTML = '<option value="">-- Uygulama Dersini Seçiniz (Önce Bölüm ve Dönem Seçin) --</option>';
            return;
        }

        const filteredCourses = window.AppDB ? window.AppDB.getCoursesByDeptAndTerm(selectedDept, selectedTerm) : [];

        if (filteredCourses.length === 0) {
            courseSelect.innerHTML = `<option value="">-- "${selectedDept}" - "${selectedTerm}" için henüz ders eklenmedi --</option>`;
        } else {
            courseSelect.innerHTML = '<option value="">-- Uygulama Dersini Seçiniz --</option>';
            filteredCourses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.codeName;
                opt.textContent = c.codeName;
                if (c.codeName === currentCourseVal) opt.selected = true;
                courseSelect.appendChild(opt);
            });
        }
    }

    if (departmentSelect) departmentSelect.addEventListener('change', updateCourseOptions);
    if (termSelect) termSelect.addEventListener('change', updateCourseOptions);
    updateCourseOptions();

    // ----------------------------------------------------------------------
    // HEPATİT TETKİKİ YAPILDI MI KONTROLÜ & ALAN GÖSTERİMİ
    // ----------------------------------------------------------------------
    const hepatitisTestedSelect = document.getElementById('hepatitisTested');
    const groupHepDate = document.getElementById('group-hep-date');
    const groupHepFile = document.getElementById('group-hep-file');
    const hepatitisTestDateInput = document.getElementById('hepatitisTestDate');
    const hepatitisTestFileInput = document.getElementById('hepatitisTestFile');

    if (hepatitisTestedSelect) {
        const toggleHepatitisFields = () => {
            const val = hepatitisTestedSelect.value;
            if (val === 'Evet') {
                if (groupHepDate) groupHepDate.style.display = 'block';
                if (groupHepFile) groupHepFile.style.display = 'block';
                if (hepatitisTestDateInput) hepatitisTestDateInput.setAttribute('required', 'true');
                if (hepatitisTestFileInput) hepatitisTestFileInput.setAttribute('required', 'true');
            } else {
                if (groupHepDate) groupHepDate.style.display = 'none';
                if (groupHepFile) groupHepFile.style.display = 'none';
                if (hepatitisTestDateInput) {
                    hepatitisTestDateInput.removeAttribute('required');
                    hepatitisTestDateInput.value = '';
                }
                if (hepatitisTestFileInput) {
                    hepatitisTestFileInput.removeAttribute('required');
                    hepatitisTestFileInput.value = '';
                    const box = hepatitisTestFileInput.closest('.file-upload-box');
                    if (box) {
                        box.classList.remove('has-file');
                        const display = box.querySelector('.file-name-display');
                        if (display) display.textContent = 'Tetkik Sonuç Belgesi Seçiniz (PDF/JPG)';
                    }
                    delete uploadedFileMap['hepatitisTestFile'];
                }
            }
            if (window.updateProgress) window.updateProgress();
        };

        hepatitisTestedSelect.addEventListener('change', toggleHepatitisFields);
        toggleHepatitisFields();
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
    // YÜKLENEN 7 BELGE İÇİN DOSYA ADI VE BAĞLANTI (URL) HAZIRLAMA
    // ----------------------------------------------------------------------
    const uploadedFileMap = {};

    function initFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const box = e.target.closest('.file-upload-box');
                const nameDisplay = box ? box.querySelector('.file-name-display') : null;
                const fileId = input.id;

                if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const fileName = file.name;
                    const fileUrl = URL.createObjectURL(file);

                    uploadedFileMap[fileId] = {
                        name: fileName,
                        url: fileUrl
                    };

                    if (nameDisplay) nameDisplay.textContent = fileName;
                    if (box) box.classList.add('has-file');
                } else {
                    delete uploadedFileMap[fileId];
                    if (nameDisplay) nameDisplay.textContent = 'Dosya Seçiniz veya Sürükleyiniz';
                    if (box) box.classList.remove('has-file');
                }
                if (window.updateProgress) window.updateProgress();
            });
        });
    }
    initFileUploads();

    // ----------------------------------------------------------------------
    // FORM GÖNDERİMİ, ÖZET & TEK SAYFA PDF İÇİN DOSYA LİNKLERİ
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

            const tcVal = tcNoInput ? tcNoInput.value.trim() : '';
            if (tcVal.length > 0 && tcVal.length !== 11) {
                isValid = false;
                if (tcNoInput) tcNoInput.style.borderColor = 'var(--danger)';
                alert('T.C. Kimlik Numarası 11 haneli rakam olmalıdır.');
                return;
            }

            const phoneVal = phoneInput ? phoneInput.value.trim() : '';
            if (phoneVal.length < 14) {
                isValid = false;
                if (phoneInput) phoneInput.style.borderColor = 'var(--danger)';
                alert('Telefon numarası eksik! "05XX XXX XX XX" formatında doldurunuz.');
                return;
            }

            if (!isValid) {
                alert('Lütfen tüm zorunlu alanları doğru ve eksiksiz doldurunuz.');
                return;
            }

            const formData = new FormData(studentForm);
            const studentRecord = {
                studentNo: formData.get('studentNo'),
                fullName: formData.get('fullName'),
                tcNo: formData.get('tcNo'),
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

                // Hepatit B Bilgileri
                hepatitisTested: formData.get('hepatitisTested'),
                hepatitisTestDate: formData.get('hepatitisTestDate'),

                // Belge Detayları & Dosya Bağlantıları
                doc1_date: formData.get('doc1_date'),
                doc1_file_name: uploadedFileMap['doc1_file'] ? uploadedFileMap['doc1_file'].name : null,
                doc1_file_url: uploadedFileMap['doc1_file'] ? uploadedFileMap['doc1_file'].url : null,

                doc2_examDate: formData.get('doc2_examDate'),
                doc2_expiryDate: formData.get('doc2_expiryDate'),
                doc2_file_name: uploadedFileMap['doc2_file'] ? uploadedFileMap['doc2_file'].name : null,
                doc2_file_url: uploadedFileMap['doc2_file'] ? uploadedFileMap['doc2_file'].url : null,

                doc3_physicalCount: formData.get('doc3_physicalCount'),
                doc3_file_name: uploadedFileMap['doc3_file'] ? uploadedFileMap['doc3_file'].name : null,
                doc3_file_url: uploadedFileMap['doc3_file'] ? uploadedFileMap['doc3_file'].url : null,

                doc4_file_name: uploadedFileMap['doc4_file'] ? uploadedFileMap['doc4_file'].name : null,
                doc4_file_url: uploadedFileMap['doc4_file'] ? uploadedFileMap['doc4_file'].url : null,

                doc5_date: formData.get('doc5_date'),
                doc5_file_name: uploadedFileMap['doc5_file'] ? uploadedFileMap['doc5_file'].name : null,
                doc5_file_url: uploadedFileMap['doc5_file'] ? uploadedFileMap['doc5_file'].url : null,

                doc6_date: formData.get('doc6_date'),
                doc6_file_name: uploadedFileMap['doc6_file'] ? uploadedFileMap['doc6_file'].name : null,
                doc6_file_url: uploadedFileMap['doc6_file'] ? uploadedFileMap['doc6_file'].url : null,

                doc7_date: formData.get('doc7_date'),
                doc7_file_name: uploadedFileMap['doc7_file'] ? uploadedFileMap['doc7_file'].name : null,
                doc7_file_url: uploadedFileMap['doc7_file'] ? uploadedFileMap['doc7_file'].url : null,

                // Hepatit B Dosyaları
                hepatitisTest_file_name: uploadedFileMap['hepatitisTestFile'] ? uploadedFileMap['hepatitisTestFile'].name : null,
                hepatitisTest_file_url: uploadedFileMap['hepatitisTestFile'] ? uploadedFileMap['hepatitisTestFile'].url : null,
                vaccineCard_file_name: uploadedFileMap['vaccineCardFile'] ? uploadedFileMap['vaccineCardFile'].name : null,
                vaccineCard_file_url: uploadedFileMap['vaccineCardFile'] ? uploadedFileMap['vaccineCardFile'].url : null,

                submissionDate: new Date().toISOString()
            };

            // DB'ye kaydet
            if (window.AppDB && window.AppDB.saveStudentApplication) {
                window.AppDB.saveStudentApplication(studentRecord);
            }

            // Dosya Linkleri Listesi HTML'i Hazırla (PDF çıktısı için)
            const docTitles = {
                doc1_file: "16 Saatlik İSG Eğitimi Belgesi",
                doc2_file: "İşe Giriş / Periyodik Muayene Formu",
                doc3_file: "Gizlilik Sözleşmesi",
                doc4_file: "Kimlik Fotokopisi",
                doc5_file: "Hemogram Tetkik Belgesi",
                doc6_file: "ELISA Tetkik Belgesi",
                doc7_file: "Akciğer Grafisi / Raporu",
                hepatitisTestFile: "Hepatit B Tetkik Belgesi",
                vaccineCardFile: "Hepatit B Aşı Kartı"
            };

            let fileLinksHtml = '<ul class="print-file-links-list" style="margin-top: 8px; padding-left: 20px;">';
            let hasAnyFile = false;

            Object.keys(docTitles).forEach(key => {
                if (uploadedFileMap[key]) {
                    hasAnyFile = true;
                    const item = uploadedFileMap[key];
                    fileLinksHtml += `
                        <li style="margin-bottom: 4px;">
                            <strong>${docTitles[key]}:</strong> 
                            <a href="${item.url}" target="_blank" download="${item.name}" class="doc-pdf-link" style="color: #2563eb; font-weight: 600; text-decoration: underline;">
                                ${item.name} (Dosyayı İndir/Aç)
                            </a>
                        </li>
                    `;
                }
            });

            if (!hasAnyFile) {
                fileLinksHtml += '<li style="color: #64748b; font-style: italic;">Yüklenmiş dosya bulunmamaktadır.</li>';
            }
            fileLinksHtml += '</ul>';

            // Özet Modal İçeriğini Doldur
            const summaryContent = document.getElementById('summaryContent');
            const successModal = document.getElementById('successModal');

            if (summaryContent) {
                let hepStatusText = studentRecord.hepatitisTested === 'Evet' 
                    ? `Evet (Tarih: ${new Date(studentRecord.hepatitisTestDate).toLocaleDateString('tr-TR')})` 
                    : 'Hayır, Yapılmadı';

                summaryContent.innerHTML = `
                    <div class="pdf-print-container" style="font-size: 0.85rem; line-height: 1.4;">
                        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; text-align: center;">
                            <h3 style="font-size: 1.1rem; color: #0f172a; margin: 0;">Sağlık Bilimleri Uygulama ve Staj Formu</h3>
                            <span style="font-size: 0.75rem; color: #64748b;">Balıkesir Üniversitesi - Başvuru Kayıt Raporu</span>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; width: 35%; background: #f8fafc;">Öğrenci Adı Soyadı:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.fullName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Öğrenci No / T.C.:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.studentNo} / ${studentRecord.tcNo || '—'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Bölüm / Sınıf:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.department} (${studentRecord.studentClass})</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">İletişim (Tel / E-posta):</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.phone} • ${studentRecord.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Akademik Danışman:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.academicAdvisor}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Dönem / Ders:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.academicYear} ${studentRecord.term} - ${studentRecord.courseNameCode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Kurum / Birim:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.institution} (${studentRecord.unitName || 'Genel'})</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Uygulama Günleri / Sorumlu:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">${studentRecord.applicationDays} / ${studentRecord.responsibleInstructor}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Hepatit B Tetkiki:</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: ${studentRecord.hepatitisTested === 'Evet' ? 'green' : 'red'};">${hepStatusText}</td>
                            </tr>
                        </table>

                        <div style="margin-top: 8px;">
                            <h4 style="font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
                                Yüklenen Belgeler ve Bağlantıları (Linkler):
                            </h4>
                            ${fileLinksHtml}
                        </div>
                    </div>
                `;
            }

            if (successModal) successModal.classList.add('active');
        });
    }
});
