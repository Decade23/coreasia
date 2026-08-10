# CoreAsia — Review Proteksi Legal (Terms/Privacy/Refund)

> Draf klausa hasil review adversarial (5 lensa). Untuk di-review owner + idealnya konsultan hukum
> sebelum dipublikasikan. Belum diterapkan ke situs.

# Penguatan Legal CAD — FINAL
## CoreAsia Download Manager · PT Inti Asia Teknologi (CoreAsia) · Merchant of Record: FastSpring

**Placeholder global:** `{company}` = PT Inti Asia Teknologi (CoreAsia) · `{email}` = alamat kontak resmi (gunakan turunan: `legal@{domain}`, `privacy@{domain}`, `copyright@{domain}`). Ganti seluruh "PT Inti Asia" lama → `{company}`.

**Dua keputusan struktural yang mengikat seluruh dokumen (bukan opsi):**

1. **Pemisahan peran (paling fundamental).** Definisikan sekali, lalu konsisten: **FastSpring = penjual sah (Merchant of Record / seller of record)**; **{company} = pemberi lisensi (licensor)** perangkat lunak. Kewajiban konsumen yang melekat pada *seller* (refund, withdrawal, garansi/conformity, pajak) dipenuhi melalui FastSpring; {company} hanya bertanggung jawab atas lisensi & fungsi perangkat lunak. Ini menambal akar masalah cap "jumlah dibayar ke MoR" dan kerancuan penanggung jawab statutori.
2. **Klausa dua-jalur Konsumen vs Bisnis.** Untuk pengecualian/pembatasan paling sensitif (indemnifikasi, cap nominal, batas waktu klaim, forum), berlaku **set penuh hanya untuk pengguna bisnis/komersial**, dan **set minimal pro-konsumen untuk konsumen**. Carve-out untuk konsumen dirumuskan **afirmatif** ("klausa ini TIDAK berlaku bagi konsumen sejauh hukum wajib melarang"), bukan sekadar "sejauh diizinkan".

---

## 1. TABEL RINGKAS — Paparan, Dokumen, Severity, Cara Ditutup

| # | Paparan ditemukan | Dokumen | Severity | Cara ditutup |
|---|---|---|---|---|
| 1 | Indemnifikasi konsumen Indonesia berpotensi batal demi hukum (Ps. 18 ay.(3) UU 8/1999) | Terms §7A | Kritis | Indemnifikasi **dihapus untuk konsumen**; hanya berlaku untuk pengguna bisnis (klausa dua-jalur T1) |
| 2 | Cap nominal "12 bulan" = klausula eksonerasi, rentan batal utk konsumen (UU 8/1999; Dir. 93/13) | Terms §10 | Kritis | Cap dipisah: berlaku utk bisnis; utk konsumen carve-out **afirmatif** + tunduk hak statutori (T2) |
| 3 | Cap diukur dari "dibayar ke MoR" rapuh — konsumen tak berkontrak beli dgn {company} | Terms §10 | Kritis | Pemisahan peran seller/licensor; cap diikat ke biaya lisensi yg diterima {company}, bukan harga jual FastSpring (T2 + T0) |
| 4 | Forum "pengadilan Jakarta" menafikan hak forum domisili/BPSK konsumen Indonesia | Terms §12 | Kritis | Forum Jakarta dibatasi **hanya utk pengguna bisnis**; konsumen → BPSK/PN domisili (T6) |
| 5 | Batas waktu klaim 1 thn perpendek daluwarsa hak konsumen | Terms §12 | Kritis | 1 thn berlaku utk bisnis; carve-out afirmatif konsumen (garansi statutori EU 2 thn, dst) (T6) |
| 6 | Class-action waiver illegal utk EU (Dir. 2020/1828) & rentan di ID | Terms §12 | Kritis | **Keputusan: TIDAK dipasang.** Dinyatakan eksplisit, bukan opsi (T6) |
| 7 | Governing language "versi ID yang berlaku" mengikat konsumen asing pada makna tak dipahami | Terms §15(f) | Mayor | Konsumen: versi bahasanya sendiri yang mengikat; "versi ID berlaku" hanya antar-bisnis (T7) |
| 8 | Diagnostik default ON tanpa consent = ilegal ePrivacy/GDPR & misrepresentasi vs kebijakan | Privacy §7 | Kritis | **Keputusan: Opsi A — default OFF / prior consent.** Kebijakan + kode disinkronkan (P3) |
| 9 | Over-promise privasi absolut ("tidak mengumpulkan apa pun") = misrepresentasi | Privacy §1/§3/§5/§7 | Kritis | Hedge: pemrosesan lokal "untuk fungsi inti, KECUALI…"; istilah pseudonim (P1) |
| 10 | Pemakaian pasca-refund disebut "pelanggaran" — bentrok hak refund statutori | Terms §11 / Refund | Mayor | Carve-out: tidak berlaku utk refund yang merupakan hak hukum konsumen (T5) |
| 11 | Tak ada indemnifikasi sama sekali (eksposur finansial terbesar) | Terms | Kritis | §7A baru (bisnis-only) + §1A sifat-alat/tanpa-hosting (T1, T0) |
| 12 | Liabilitas tak ada cap agregat | Terms §10 | Kritis | Cap agregat baru (bisnis) + pengecualian kerugian (semua) (T2) |
| 13 | Disclaimer jaminan tersirat tak eksplisit | Terms §9 | Mayor | Disclaimer implied warranties eksplisit + carve-out konsumen (T2-a) |
| 14 | Tak ada forum/penyelesaian sengketa bertahap | Terms §12 | Mayor | Penyelesaian bertahap + forum dua-jalur (T6) |
| 15 | Tak ada DMCA/kebijakan hak cipta & repeat-infringer | Terms | Kritis | §12A: stance jujur (tak host → 512(c) tak penuh) + repeat-infringer nyata (T8) |
| 16 | Tak ada boilerplate (severability, entire agreement, force majeure, notice, dll) | Terms | Mayor | §15 konsolidasi (T7) |
| 17 | Tak ada controller/processor, lawful basis, transfer lintas negara | Privacy | Mayor | Klausa baru P4–P5 (peran, dasar, transfer) |
| 18 | Tak ada klausa keamanan + tenggat breach (3×24 jam UU PDP / 72 jam GDPR) | Privacy | Kritis | P6: keamanan + tenggat eksplisit |
| 19 | Hak subjek data (GDPR/PDP) belum lengkap + otoritas pengaduan | Privacy §9 | Mayor | P7: hak data + Lembaga PDP/DPA |
| 20 | Retensi data tak diatur | Privacy | Minor | P8: periode retensi diagnostik/aktivasi |
| 21 | Sub-processor/penerima data tak diungkap | Privacy | Minor | P9: daftar kategori penerima |
| 22 | Refund tak punya governing law & rujukan silang | Refund | Mayor | R1: governing law + integrasi + hierarki |
| 23 | Waiver withdrawal EU/UK bersandar UI yang belum ada | Refund / non-legal | Kritis | R2 menegaskan 3 elemen + jadikan **blocking go-live** (lihat §4 & §5) |
| 24 | Tak ada klausa sanksi/ekspor & batas yurisdiksi | Terms | Mayor | §6A: kepatuhan sanksi/ekspor + ketersediaan per-yurisdiksi (T9) |
| 25 | Acceptable Use kurang larangan circumvent DRM (anti-inducement) | Terms §6 | Mayor | T-AU: perkuat kewajiban legalitas + larangan bypass DRM (T10) |
| 26 | Terminologi lintas dokumen tak identik (contra proferentem) | Semua | Minor | Standardisasi frasa kunci (C2) |

---

## 2. KLAUSA FINAL PER DOKUMEN (siap tempel, ID + EN)

> Konvensi label: **[BARU]** = pasal/klausa baru · **[UBAH]** = ganti teks pasal yang ada · **[TAMBAH]** = sisipkan ke pasal yang ada.

---

# A. TERMS (Ketentuan Penggunaan)

### T0. [BARU] Pasal 1A — Sifat Alat, Tanpa Hosting, & Peran Para Pihak — *(BARU; kritis — fondasi pertahanan IP + privity)*

**ID:**
> **1A. Sifat Alat, Tanpa Hosting, & Peran Para Pihak.** CAD adalah alat berfungsi-ganda (general-purpose) yang dijalankan dan diproses sepenuhnya di perangkat Anda. {company} tidak meng-host, menyimpan ke server kami, menyalin, mengindeks, men-cache, mem-mirror/proxy, mengunggah ulang, maupun mendistribusikan konten apa pun yang Anda akses atau unduh melalui CAD. Seluruh konten ditransfer langsung dari sumber pihak ketiga ke perangkat Anda; kami bukan perantara, penyedia, atau penerbit konten tersebut. CAD memiliki kegunaan sah yang substansial, termasuk mengunduh konten milik Anda sendiri, konten berlisensi terbuka, atau konten yang telah Anda peroleh izinnya.
>
> **Peran para pihak.** {company} adalah **pemberi lisensi (licensor)** perangkat lunak CAD. **FastSpring adalah penjual sah (Merchant of Record / seller of record)** atas transaksi pembelian Anda; FastSpring—bukan {company}—yang berkontrak jual-beli dengan Anda, serta menangani pembayaran, faktur, pajak, dan kewajiban penjual menurut hukum yang berlaku. Ketentuan dan kebijakan FastSpring mengatur transaksi jual-beli tersebut. Kebijakan refund {company} merupakan kebijakan tambahan (good-will) di atas hak statutori Anda yang dipenuhi melalui FastSpring.

**EN:**
> **1A. Nature of the Tool, No Hosting, & Roles of the Parties.** CAD is a general-purpose, dual-use tool that runs and processes entirely on your device. {company} does not host, store on our servers, copy, index, cache, mirror/proxy, re-upload, or distribute any content you access or download through CAD. All content is transferred directly from third-party sources to your device; we are not an intermediary, provider, or publisher of that content. CAD has substantial lawful uses, including downloading content you own, openly licensed content, or content for which you have obtained permission.
>
> **Roles of the parties.** {company} is the **licensor** of the CAD software. **FastSpring is the seller of record (Merchant of Record)** for your purchase; FastSpring—not {company}—is your counterparty to the sale and handles payment, invoicing, taxes, and seller obligations under applicable law. FastSpring's terms and policies govern that sale. {company}'s refund policy is an additional good-will policy layered on top of your statutory rights, which are fulfilled through FastSpring.

---

### T1. [BARU] Pasal 7A — Ganti Rugi (Indemnifikasi) — Hanya Pengguna Bisnis — *(BARU; kritis — eksposur finansial, dua-jalur)*

**ID:**
> **7A. Ganti Rugi (Indemnifikasi) — Pengguna Bisnis.** Klausul ini **hanya berlaku bagi pengguna bisnis/komersial** dan **tidak berlaku bagi konsumen** (orang perseorangan yang menggunakan CAD di luar kegiatan usaha atau profesinya). Sejauh diizinkan hukum yang berlaku, jika Anda pengguna bisnis, Anda setuju membela, mengganti rugi, dan membebaskan {company} beserta afiliasi, direktur, dan karyawannya dari segala klaim, tuntutan, gugatan, kerugian, kewajiban, denda, kerusakan, biaya, dan ongkos pihak ketiga (termasuk biaya hukum yang wajar) yang timbul dari atau berkaitan dengan: (a) penggunaan CAD oleh Anda; (b) konten yang Anda unduh, simpan, atau distribusikan menggunakan CAD; (c) pelanggaran Anda atas Ketentuan ini atau Pasal 6 (Penggunaan yang Dapat Diterima); atau (d) pelanggaran Anda atas hak cipta, merek, privasi, atau hak pihak ketiga lain, maupun Ketentuan Layanan situs/layanan pihak ketiga. Kewajiban ini tetap berlaku setelah lisensi berakhir.
>
> **Konsumen.** Jika Anda konsumen, Anda tidak menanggung kewajiban indemnifikasi apa pun berdasarkan Ketentuan ini. Hal ini tidak menghapus tanggung jawab Anda berdasarkan hukum atas perbuatan Anda sendiri yang melanggar hukum.

**EN:**
> **7A. Indemnification — Business Users.** This clause **applies only to business/commercial users** and **does not apply to consumers** (natural persons using CAD outside their trade or profession). To the extent permitted by applicable law, if you are a business user, you agree to defend, indemnify, and hold harmless {company} and its affiliates, directors, and employees from any third-party claims, demands, suits, losses, liabilities, fines, damages, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of CAD; (b) content you download, store, or distribute using CAD; (c) your breach of these Terms or Section 6 (Acceptable Use); or (d) your infringement of any third party's copyright, trademark, privacy, or other rights, or of any third-party site/service's Terms of Service. This obligation survives termination of your license.
>
> **Consumers.** If you are a consumer, you bear no indemnification obligation under these Terms. This does not relieve you of liability under law for your own unlawful acts.

---

### T2. [UBAH] Pasal 9 & 10 — Tanpa Jaminan & Batasan Tanggung Jawab (dua-jalur + carve-out afirmatif) — *(UBAH; kritis — ganti penuh §9 & §10)*

**ID — Pasal 9 (pengganti penuh):**
> **9. Tanpa Jaminan (As-Is).** CAD disediakan "sebagaimana adanya" (as-is) dan "sebagaimana tersedia" (as-available), tanpa jaminan apa pun, tersurat maupun tersirat. Sejauh maksimum diizinkan hukum yang berlaku, kami secara **TEGAS MENOLAK** seluruh jaminan tersirat, termasuk jaminan kelayakan untuk diperdagangkan (merchantability), kesesuaian untuk tujuan tertentu (fitness for a particular purpose), tidak adanya pelanggaran hak (non-infringement), kepemilikan (title), dan kenikmatan tanpa gangguan (quiet enjoyment). Kami tidak menjamin CAD bebas error, tidak terputus, aman, atau kompatibel dengan setiap situs, layanan, atau konfigurasi perangkat.
>
> **Penyelamat hak konsumen (afirmatif).** Jika Anda konsumen, tidak ada dalam Pasal ini yang mengecualikan, membatasi, atau memengaruhi jaminan dan hak statutori Anda yang tidak dapat dikesampingkan menurut hukum perlindungan konsumen di negara tempat tinggal Anda — termasuk UU No. 8 Tahun 1999 dan, bila berlaku bagi Anda, hukum konsumen Uni Eropa/Inggris (termasuk hak atas kesesuaian/conformity konten digital). Pengecualian dalam Pasal ini **tidak berlaku bagi konsumen sejauh hukum wajib tersebut melarangnya.** Kewajiban kesesuaian/garansi penjual dipenuhi melalui FastSpring sebagai penjual sah (lihat Pasal 1A).

**ID — Pasal 10 (pengganti penuh):**
> **10. Batasan Tanggung Jawab.**
> **(1) Pengecualian kerugian (berlaku umum, dgn carve-out konsumen).** Sejauh diizinkan hukum yang berlaku, {company} tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau punitif, termasuk kehilangan data, kehilangan keuntungan, atau gangguan usaha, yang timbul dari penggunaan atau ketidakmampuan menggunakan CAD.
> **(2) Plafon agregat (cap) — hanya pengguna bisnis.** Bagi pengguna bisnis/komersial, sejauh diizinkan hukum, tanggung jawab total dan agregat {company} yang timbul dari atau terkait CAD, lisensi, atau Ketentuan ini—dalam kontrak, perbuatan melawan hukum (termasuk kelalaian), maupun dasar lain—tidak melebihi jumlah biaya lisensi yang benar-benar diterima {company} atas produk terkait dalam 12 (dua belas) bulan sebelum peristiwa yang menimbulkan klaim. Batas ini bersifat akumulatif atas seluruh klaim dan tidak diperbarui per kejadian.
> **(3) Konsumen (afirmatif).** Plafon agregat pada ayat (2) **tidak berlaku bagi konsumen.** Tanggung jawab kami kepada konsumen ditentukan oleh hukum yang berlaku; tidak ada dalam Pasal ini yang membatasi tanggung jawab kepada konsumen di bawah batas yang dijamin hukum konsumen wajib (termasuk UU No. 8 Tahun 1999 dan, bila berlaku, hukum konsumen Uni Eropa/Inggris).
> **(4) Carve-out non-derogable & keterpisahan.** Tidak ada dalam Pasal 9 dan 10 yang mengecualikan atau membatasi tanggung jawab yang tidak dapat dikecualikan menurut hukum, termasuk atas: (i) kematian atau cedera badan akibat kelalaian kami; (ii) penipuan atau pernyataan keliru yang disengaja; (iii) kelalaian berat (gross negligence) atau kesalahan yang disengaja; dan (iv) hak statutori konsumen yang tidak dapat dikesampingkan. Apabila suatu pembatasan dinyatakan tidak berlaku, pembatasan tersebut dipisahkan (severable) dan sisanya tetap berlaku penuh.

**EN — Section 9 (full replacement):**
> **9. Disclaimer of Warranties (As-Is).** CAD is provided "as-is" and "as-available," without warranties of any kind, express or implied. To the maximum extent permitted by applicable law, we **EXPRESSLY DISCLAIM** all implied warranties, including merchantability, fitness for a particular purpose, non-infringement, title, and quiet enjoyment. We do not warrant that CAD will be error-free, uninterrupted, secure, or compatible with every site, service, or device configuration.
>
> **Consumer safeguard (affirmative).** If you are a consumer, nothing in this Section excludes, limits, or affects your statutory warranties and rights that cannot be waived under the consumer-protection law of your country of residence — including Indonesia's Law No. 8 of 1999 and, where applicable to you, EU/UK consumer law (including rights to conformity of digital content). The exclusions in this Section **do not apply to consumers to the extent such mandatory law prohibits them.** Seller conformity/warranty obligations are fulfilled through FastSpring as seller of record (see Section 1A).

**EN — Section 10 (full replacement):**
> **10. Limitation of Liability.**
> **(1) Exclusion of damages (general, with consumer carve-out).** To the extent permitted by applicable law, {company} is not liable for indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of profits, or business interruption, arising from use of or inability to use CAD.
> **(2) Aggregate cap — business users only.** For business/commercial users, to the extent permitted by law, {company}'s total aggregate liability arising out of or relating to CAD, the license, or these Terms—whether in contract, tort (including negligence), or otherwise—shall not exceed the license fees actually received by {company} for the relevant product in the 12 (twelve) months preceding the event giving rise to the claim. This cap is cumulative across all claims and does not reset per event.
> **(3) Consumers (affirmative).** The aggregate cap in (2) **does not apply to consumers.** Our liability to consumers is determined by applicable law; nothing in this Section limits liability to consumers below the levels guaranteed by mandatory consumer law (including Indonesia's Law No. 8 of 1999 and, where applicable, EU/UK consumer law).
> **(4) Non-derogable carve-out & severability.** Nothing in Sections 9 and 10 excludes or limits liability that cannot be excluded under law, including for: (i) death or personal injury caused by our negligence; (ii) fraud or fraudulent misrepresentation; (iii) gross negligence or willful misconduct; and (iv) non-waivable consumer statutory rights. If any limitation is held unenforceable, it is severable and the remainder stays in full force.

---

### T-AU. [TAMBAH] Pasal 6 — Penggunaan yang Dapat Diterima (perkuat anti-inducement + larangan circumvent DRM) — *(TAMBAH ke §6; mayor)*

**ID:**
> Anda bertanggung jawab penuh memastikan bahwa setiap pengunduhan adalah sah di yurisdiksi Anda dan tidak melanggar hak pihak ketiga. Anda wajib mematuhi Ketentuan Layanan situs/layanan sumber serta seluruh hukum hak cipta yang berlaku. Anda dilarang menggunakan CAD untuk membongkar, menghindari, atau mengakali (circumvent) tindakan pengamanan teknologi/manajemen hak digital (DRM) atau kontrol akses, sejauh hal itu dilarang oleh hukum yang berlaku (termasuk Pasal 52 UU Hak Cipta dan ketentuan anti-circumvention serupa). CAD tidak ditujukan dan tidak boleh digunakan untuk menembus paywall, DRM, atau pembatasan akses berbayar tanpa hak.

**EN:**
> You are solely responsible for ensuring that each download is lawful in your jurisdiction and does not infringe third-party rights. You must comply with the Terms of Service of the source site/service and all applicable copyright laws. You must not use CAD to remove, bypass, or circumvent technological protection measures / digital rights management (DRM) or access controls, to the extent prohibited by applicable law (including Article 52 of Indonesia's Copyright Law and comparable anti-circumvention provisions). CAD is not intended for, and must not be used to, defeat paywalls, DRM, or paid-access restrictions without authorization.

---

### T9. [BARU] Pasal 6A — Kepatuhan Sanksi/Ekspor & Ketersediaan per Yurisdiksi — *(BARU; mayor)*

**ID:**
> **6A. Kepatuhan Sanksi/Ekspor & Ketersediaan.** Anda menyatakan bahwa Anda tidak berada di, dan tidak menggunakan CAD untuk kepentingan pihak di, yurisdiksi atau daftar yang dikenai sanksi atau pembatasan ekspor yang melarang penyediaan perangkat lunak ini, dan bahwa penggunaan Anda mematuhi hukum pengendalian ekspor dan sanksi yang berlaku. {company} dapat membatasi atau menghentikan ketersediaan CAD di yurisdiksi tertentu untuk mematuhi hukum.

**EN:**
> **6A. Sanctions/Export Compliance & Availability.** You represent that you are not located in, and do not use CAD for or on behalf of any party in, any jurisdiction or list subject to sanctions or export restrictions that prohibit provision of this software, and that your use complies with applicable export-control and sanctions laws. {company} may restrict or discontinue availability of CAD in certain jurisdictions to comply with law.

---

### T3. [TAMBAH] Pasal 2 — Pemberian Lisensi (pengalihan + tautan pengakhiran) — *(TAMBAH ke §2; mayor)*

**ID:**
> Lisensi berlaku selama hak Anda tidak berakhir berdasarkan Pasal 11 (Penghentian) atau karena refund/chargeback sebagaimana diatur dalam Kebijakan Refund. **Pengalihan.** Anda tidak dapat mengalihkan hak/kewajiban berdasarkan Ketentuan ini tanpa persetujuan tertulis kami. Kami dapat mengalihkan Ketentuan ini, seluruhnya atau sebagian, kepada afiliasi atau dalam rangka merger, akuisisi, reorganisasi, atau penjualan aset, dengan tetap menghormati hak Anda berdasarkan hukum konsumen wajib.

**EN:**
> The license remains valid for as long as your rights are not terminated under Section 11 (Termination) or by refund/chargeback as set out in the Refund Policy. **Assignment.** You may not assign your rights or obligations under these Terms without our written consent. We may assign these Terms, in whole or in part, to an affiliate or in connection with a merger, acquisition, reorganization, or sale of assets, while respecting your rights under mandatory consumer law.

---

### T4. [TAMBAH] Pasal 4 — Pembayaran (harga non-retroaktif + MoR seller of record) — *(TAMBAH ke §4; minor)*

**ID:**
> Harga dapat berubah sewaktu-waktu untuk pembelian baru; perubahan harga tidak memengaruhi lisensi yang telah Anda beli. Produk Lifetime adalah pembayaran satu kali tanpa biaya berlangganan berulang. Penjual sah (Merchant of Record / seller of record) untuk transaksi adalah **FastSpring**, yang berkontrak jual-beli dengan Anda serta memproses pembayaran, faktur, dan pajak sesuai kebijakannya; pajak yang berlaku dapat ditampilkan atau ditambahkan sesuai yurisdiksi Anda saat checkout.

**EN:**
> Prices may change at any time for new purchases; price changes do not affect a license you have already bought. The Lifetime product is a one-time payment with no recurring subscription fees. The seller of record (Merchant of Record) for the transaction is **FastSpring**, which is your counterparty to the sale and processes payment, invoicing, and taxes per its policies; applicable taxes may be shown or added based on your jurisdiction at checkout.

---

### T5. [TAMBAH] Pasal 11 — Penghentian (pengakhiran refund/chargeback + carve-out hak refund statutori + key offline) — *(TAMBAH ke §11; mayor)*

**ID:**
> Lisensi juga berakhir secara otomatis dan seketika apabila pembayaran Anda di-refund, dibatalkan, atau di-chargeback. Karena alasan teknis, kunci lisensi luring (offline) tidak selalu dapat dinonaktifkan dari jarak jauh; setiap penggunaan CAD setelah pengakhiran yang sah merupakan penggunaan tanpa lisensi dan melanggar Ketentuan ini. **Pengecualian hak konsumen.** Ketentuan ini tidak berlaku bagi—dan tidak menjadikan "pelanggaran"—penggunaan yang sah dalam rangka Anda menjalankan hak refund atau hak pembatalan (withdrawal) statutori Anda; selama dan sepanjang hak tersebut berlaku, penggunaan Anda tetap sah hingga refund/pembatalan tuntas diproses.

**EN:**
> The license also terminates automatically and immediately if your payment is refunded, reversed, or charged back. For technical reasons, offline license keys cannot always be deactivated remotely; any use of CAD after valid termination is unlicensed use and breaches these Terms. **Consumer-rights exception.** This does not apply to—and does not render a "breach"—lawful use in the course of exercising your statutory refund or withdrawal rights; while and to the extent those rights apply, your use remains licensed until the refund/withdrawal is fully processed.

---

### T6. [UBAH] Pasal 12 — Hukum yang Berlaku & Penyelesaian Sengketa (forum dua-jalur + tahapan + batas waktu + no class-waiver) — *(UBAH; kritis — ganti penuh §12)*

**ID (pengganti penuh):**
> **12. Hukum yang Berlaku & Penyelesaian Sengketa.** Ketentuan ini diatur oleh hukum Republik Indonesia tanpa memperhatikan kaidah konflik hukum.
>
> **Penyelesaian bertahap.** Setiap sengketa terlebih dahulu diupayakan diselesaikan secara musyawarah melalui kontak resmi kami dalam waktu 30 (tiga puluh) hari sebelum menempuh jalur formal.
>
> **Forum — pengguna bisnis.** Bagi pengguna bisnis/komersial, sengketa yang tidak terselesaikan tunduk pada yurisdiksi eksklusif pengadilan yang berwenang di Jakarta, Indonesia, dan setiap klaim harus diajukan dalam waktu 1 (satu) tahun sejak peristiwa yang menimbulkannya, sejauh diizinkan hukum.
>
> **Forum & batas waktu — konsumen (afirmatif).** Ketentuan forum Jakarta dan batas waktu 1 (satu) tahun di atas **tidak berlaku bagi konsumen.** Konsumen Indonesia berhak menempuh penyelesaian sengketa konsumen melalui Badan Penyelesaian Sengketa Konsumen (BPSK) dan/atau Pengadilan Negeri di tempat domisilinya, sesuai UU No. 8 Tahun 1999. Konsumen Uni Eropa/Inggris dan yurisdiksi lain dapat mengandalkan ketentuan wajib dan berperkara di pengadilan domisilinya, serta menikmati jangka waktu klaim/garansi yang dijamin hukumnya (misalnya garansi statutori 2 tahun di Uni Eropa). Tidak ada dalam Pasal ini yang memperpendek jangka waktu yang dijamin hukum konsumen wajib.
>
> **Tanpa pelepasan gugatan kelompok.** Kami **tidak** mewajibkan arbitrase dan **tidak** memberlakukan pelepasan hak gugatan kelompok (class-action waiver) terhadap konsumen. Hak konsumen atas upaya hukum kolektif yang dijamin hukum (termasuk Directive (EU) 2020/1828) tetap utuh.

**EN (full replacement):**
> **12. Governing Law & Dispute Resolution.** These Terms are governed by the laws of the Republic of Indonesia, without regard to conflict-of-laws rules.
>
> **Tiered resolution.** Any dispute shall first be addressed amicably via our official contact within 30 (thirty) days before any formal proceedings.
>
> **Forum — business users.** For business/commercial users, unresolved disputes are subject to the exclusive jurisdiction of the competent courts in Jakarta, Indonesia, and any claim must be brought within 1 (one) year of the event giving rise to it, to the extent permitted by law.
>
> **Forum & time limit — consumers (affirmative).** The Jakarta forum and the 1 (one) year time limit above **do not apply to consumers.** Indonesian consumers may pursue consumer dispute resolution through the Consumer Dispute Resolution Body (BPSK) and/or the District Court of their domicile, under Law No. 8 of 1999. EU/UK and other consumers may rely on the mandatory provisions and bring proceedings in the courts of their domicile, and enjoy the claim/warranty periods guaranteed by their law (e.g., the 2-year statutory guarantee in the EU). Nothing in this Section shortens any period guaranteed by mandatory consumer law.
>
> **No class-action waiver.** We do **not** require arbitration and do **not** impose a class-action waiver on consumers. Consumers' rights to collective redress guaranteed by law (including Directive (EU) 2020/1828) remain intact.

---

### T8. [BARU] Pasal 12A — Kebijakan Hak Cipta & Pelanggar Berulang — *(BARU; kritis — stance jujur, bukan over-claim DMCA)*

**ID:**
> **12A. Kebijakan Hak Cipta & Pelanggar Berulang.** {company} menghormati hak kekayaan intelektual. CAD tidak meng-host konten apa pun (lihat Pasal 1A); karena itu, mekanisme notice-and-takedown DMCA §512(c) untuk konten yang di-host **tidak berlaku penuh** bagi kami. Pemegang hak yang meyakini CAD digunakan untuk melanggar haknya dapat mengirim pemberitahuan tertulis ke `copyright@{email}` yang memuat: (a) identifikasi karya; (b) dasar klaim; (c) data kontak; dan (d) pernyataan itikad baik. Tindakan kami terbatas pada langkah wajar atas kendali kami. **Kebijakan pelanggar berulang.** Kami dapat menangguhkan atau menghentikan lisensi pengguna yang, berdasarkan pemberitahuan yang sah dan/atau bukti yang memadai, terbukti dua kali atau lebih menggunakan CAD untuk pelanggaran hak cipta. Penghentian karena pelanggaran berulang tidak menimbulkan hak refund.

**EN:**
> **12A. Copyright Policy & Repeat Infringers.** {company} respects intellectual property rights. CAD hosts no content (see Section 1A); accordingly, the DMCA §512(c) notice-and-takedown mechanism for hosted content **does not fully apply** to us. A rights holder who believes CAD is being used to infringe its rights may send written notice to `copyright@{email}` including: (a) identification of the work; (b) the basis of the claim; (c) contact details; and (d) a good-faith statement. Our action is limited to reasonable steps within our control. **Repeat-infringer policy.** We may suspend or terminate the license of any user who, based on valid notices and/or adequate evidence, is shown on two or more occasions to have used CAD for copyright infringement. Termination for repeat infringement gives rise to no refund.

---

### T-13. [UBAH] Pasal 13 — Perubahan Ketentuan (pemberitahuan material + non-retroaktif) — *(UBAH; minor — ganti penuh §13)*

**ID:**
> **13. Perubahan Ketentuan.** Kami dapat memperbarui Ketentuan ini dari waktu ke waktu. Perubahan non-material berlaku saat dipublikasikan beserta tanggal revisi. Untuk perubahan material yang merugikan konsumen, kami akan memberi pemberitahuan yang wajar (misalnya melalui aplikasi atau halaman ini) sebelum berlaku, dan Anda dapat berhenti menggunakan CAD bila tidak menyetujuinya. Perubahan tidak berlaku surut atas hak yang telah Anda peroleh atas pembelian yang sudah dilakukan, dan tidak memengaruhi hak konsumen wajib Anda.

**EN:**
> **13. Changes to the Terms.** We may update these Terms from time to time. Non-material changes take effect upon publication with a revision date. For material changes that are adverse to consumers, we will give reasonable notice (e.g., in-app or on this page) before they take effect, and you may stop using CAD if you do not agree. Changes are not retroactive to rights already acquired through purchases already made, and do not affect your mandatory consumer rights.

---

### T7. [BARU] Pasal 15 — Ketentuan Umum (boilerplate + governing language dua-jalur) — *(BARU; mayor/minor)*

**ID:**
> **15. Ketentuan Umum.**
> **(a) Keterpisahan.** Apabila ada ketentuan yang dinyatakan tidak sah atau tidak dapat diberlakukan, ketentuan tersebut ditafsirkan/dibatasi seminimal mungkin agar tetap berlaku; bila tidak mungkin, ketentuan tersebut dipisahkan dan sisanya tetap berlaku penuh.
> **(b) Keseluruhan Perjanjian & Hierarki.** Ketentuan ini bersama Kebijakan Privasi dan Kebijakan Refund merupakan keseluruhan perjanjian terkait CAD dan menggantikan komunikasi sebelumnya. Materi pemasaran bersifat ilustratif dan bukan bagian perjanjian kecuali ditegaskan tertulis. Bila terjadi pertentangan: untuk refund berlaku Kebijakan Refund; untuk data berlaku Kebijakan Privasi; selebihnya Ketentuan ini. Untuk transaksi jual-beli, ketentuan FastSpring sebagai penjual sah yang mengatur. Ketentuan ini tidak mengesampingkan hak konsumen atas informasi yang tidak menyesatkan.
> **(c) Keadaan Kahar.** Kami tidak bertanggung jawab atas keterlambatan/kegagalan akibat keadaan di luar kendali wajar kami (bencana alam, gangguan jaringan, tindakan pemerintah/perubahan hukum, pemblokiran/perubahan situs pihak ketiga). Hal ini tidak menghapus hak refund atau hak statutori konsumen.
> **(d) Tanpa Pengesampingan.** Kelalaian/keterlambatan menegakkan suatu ketentuan bukan pengesampingan; pengesampingan hanya sah bila tertulis oleh wakil kami yang berwenang.
> **(e) Pemberitahuan.** Pemberitahuan hukum kepada kami: `legal@{email}` (atau alamat terdaftar {company}). Pemberitahuan kepada Anda dapat melalui aplikasi, email pembelian, atau halaman ini.
> **(f) Bahasa yang Mengatur.** Ketentuan ini dibuat dalam Bahasa Indonesia; terjemahan disediakan untuk kemudahan. **Antar pengguna bisnis**, bila terdapat perbedaan penafsiran, versi Bahasa Indonesia yang berlaku. **Bagi konsumen**, versi dalam bahasa tempat Ketentuan ini disajikan kepada Anda (atau bahasa yang dapat Anda pahami sesuai hukum wajib setempat) yang mengikat Anda; versi tersebut tidak boleh dipakai untuk mengikat Anda pada makna yang tidak Anda pahami.

**EN:**
> **15. General.**
> **(a) Severability.** If any provision is held invalid or unenforceable, it shall be construed/limited minimally to remain effective; if impossible, it is severed and the remainder stays in full force.
> **(b) Entire Agreement & Hierarchy.** These Terms together with the Privacy Policy and Refund Policy are the entire agreement regarding CAD and supersede prior communications. Marketing materials are illustrative and not part of the agreement unless confirmed in writing. In case of conflict: refund matters are governed by the Refund Policy; data matters by the Privacy Policy; otherwise by these Terms. For the sale transaction, FastSpring's terms as seller of record govern. These Terms do not waive consumers' right to non-misleading information.
> **(c) Force Majeure.** We are not liable for delay/failure due to causes beyond our reasonable control (natural disasters, network outages, government action/legal changes, third-party site blocking/changes). This does not remove refund rights or consumers' statutory rights.
> **(d) No Waiver.** Failure or delay in enforcing a provision is not a waiver; a waiver is valid only if in writing by our authorized representative.
> **(e) Notices.** Legal notices to us: `legal@{email}` (or {company}'s registered address). Notices to you may be given via the app, your purchase email, or this page.
> **(f) Governing Language.** These Terms are made in Bahasa Indonesia; translations are provided for convenience. **Between business users**, the Bahasa Indonesia version prevails in case of discrepancy. **For consumers**, the version in the language in which these Terms were presented to you (or a language you can understand under mandatory local law) binds you; it may not be used to bind you to a meaning you do not understand.

---

# B. PRIVACY (Kebijakan Privasi)

### P1. [UBAH] Ringkasan §1 / §3 / §5 / §7 — Hedge klaim privasi absolut + istilah pseudonim — *(UBAH; kritis)*

**ID (pengganti klaim absolut di §1 & §3):**
> Pemrosesan oleh aplikasi dan extension dilakukan secara lokal di perangkat Anda, dan untuk **fungsi inti** CAD kami tidak mengumpulkan data pribadi Anda ke server kami — **KECUALI** sebagaimana dijelaskan dalam Kebijakan ini, yaitu: (a) data pembelian yang diproses oleh penjual sah/Merchant of Record (FastSpring) sesuai kebijakan privasi mereka; (b) data diagnostik teknis **bila Anda mengaktifkannya** (lihat Diagnostik); (c) data aktivasi/identifikasi lisensi bila validasi lisensi daring diaktifkan pada versi mendatang; dan (d) pengungkapan yang diwajibkan hukum atau perintah resmi yang sah. Selebihnya, kami tidak mengunggah riwayat, isi unduhan, atau URL Anda ke server kami, dan kami tidak menjual data pribadi Anda. Bila kami memperkenalkan fitur berbasis server di masa depan, kami akan memperbarui Kebijakan ini sebelum fitur tersebut aktif.

**EN:**
> Processing by the app and extension happens locally on your device, and for CAD's **core functions** we do not collect your personal data to our servers — **EXCEPT** as described in this Policy: (a) purchase data processed by the seller of record / Merchant of Record (FastSpring) per their privacy policy; (b) technical diagnostics **if you enable them** (see Diagnostics); (c) license activation/identification data if online license validation is introduced in a future version; and (d) disclosures required by law or valid legal process. Otherwise, we do not upload your history, download contents, or URLs to our servers, and we do not sell your personal data. If we introduce server-based features in the future, we will update this Policy before such features become active.

---

### P3. [UBAH] §7 — Diagnostik: Default OFF / Opt-In (Opsi A, keputusan final) — *(UBAH; kritis — sinkron kode wajib)*

**Keputusan final: Opsi A (default OFF / prior consent).** Opsi B (default ON) ditolak karena ilegal untuk EU/UK (ePrivacy/GDPR) dan menjadi misrepresentasi aktif begitu `TELEMETRY_URL` diisi.

**ID (pengganti penuh §7):**
> **7. Diagnostik Opsional (Opt-In).** Diagnostik teknis bersifat **opsional dan MATI secara default**; hanya aktif bila Anda mengaktifkannya sendiri, dan dapat Anda matikan kapan saja. Bila diaktifkan, kami mengirim data teknis terbatas berupa **pengenal instalasi yang di-pseudonimkan** (hash satu-arah yang tidak dapat dikembalikan ke identitas Anda) beserta versi aplikasi, versi sistem operasi, locale, dan zona waktu. Kami **tidak** mengirim riwayat, isi unduhan, atau URL Anda. Data ini hanya digunakan untuk diagnostik dan peningkatan kualitas produk.

**EN:**
> **7. Optional Diagnostics (Opt-In).** Technical diagnostics are **optional and OFF by default**; they are active only if you turn them on yourself, and you can turn them off at any time. When enabled, we send limited technical data: a **pseudonymized installation identifier** (a one-way hash that cannot be reversed to your identity), plus app version, operating-system version, locale, and time zone. We do **not** send your history, download contents, or URLs. This data is used solely for diagnostics and product-quality improvement.

> **Catatan istilah:** Hindari "anonim/acak" absolut (pseudonim = tetap data pribadi per GDPR Recital 26 & UU PDP). Selaraskan copy UI `ui.html:415` "anonymous device ID" → "pseudonymous installation ID".

---

### P2. [UBAH] §5 — Aktivasi Lisensi (hedge fase server) — *(UBAH; minor — ganti penuh §5)*

**ID:**
> **5. Aktivasi Lisensi.** Aktivasi tidak memerlukan akun. Saat ini lisensi divalidasi secara lokal (offline, Ed25519) tanpa mengirim data pribadi ke server kami. Pada versi mendatang, kami dapat memperkenalkan validasi lisensi daring; jika diaktifkan, hanya pengenal lisensi/instalasi minimum yang dikirim untuk mencegah penyalahgunaan, dan Kebijakan ini akan diperbarui sebelum fitur tersebut aktif. Pembelian dan penerbitan lisensi diproses oleh penjual sah (FastSpring) sesuai kebijakan privasi mereka.

**EN:**
> **5. License Activation.** Activation requires no account. Currently licenses are validated locally (offline, Ed25519) without sending personal data to our servers. In a future version, we may introduce online license validation; if enabled, only minimal license/installation identifiers are sent to prevent abuse, and this Policy will be updated before that feature is active. Purchase and license issuance are handled by the seller of record (FastSpring) per their privacy policy.

---

### P4. [BARU] Pengendali Data & Peran — *(BARU; mayor — GDPR Art.13 / UU PDP Ps.21)*

**ID:**
> **Pengendali Data & Peran.** {company}, beralamat di `[alamat terdaftar]`, adalah pengendali data (data controller) untuk data yang diproses oleh aplikasi, diagnostik opsional, dan aktivasi lisensi. Untuk pembelian, FastSpring bertindak sebagai penjual sah (Merchant of Record) dan pengendali/pemroses data pembayaran Anda (nama, email, alamat tagih, data kartu/pajak) sesuai kebijakan privasinya `[tautan]`; {company} tidak menyimpan data kartu Anda. Pertanyaan privasi: `privacy@{email}`.

**EN:**
> **Data Controller & Roles.** {company}, located at `[registered address]`, is the data controller for data processed by the app, optional diagnostics, and license activation. For purchases, FastSpring acts as seller of record (Merchant of Record) and controller/processor of your payment data (name, email, billing address, card/tax data) per its privacy policy `[link]`; {company} does not store your card data. Privacy questions: `privacy@{email}`.

---

### P5. [BARU] Dasar Pemrosesan & Transfer Lintas Negara — *(BARU; mayor — GDPR Art.6 / UU PDP)*

**ID:**
> **Dasar Pemrosesan & Transfer Lintas Negara.** Dasar pemrosesan kami: pelaksanaan kontrak (memproses pembelian dan lisensi Anda), persetujuan (diagnostik opsional), dan kepentingan sah (keamanan serta peningkatan produk). Data pembelian dapat diproses di luar negara tempat tinggal Anda (misalnya melalui FastSpring di Amerika Serikat) dengan perlindungan yang sesuai hukum yang berlaku (mis. klausa kontraktual standar).

**EN:**
> **Legal Bases & Cross-Border Transfers.** Our legal bases: performance of a contract (processing your purchase and license), consent (optional diagnostics), and legitimate interests (security and product improvement). Purchase data may be processed outside your country of residence (e.g., via FastSpring in the United States) with safeguards required by applicable law (e.g., standard contractual clauses).

---

### P6. [BARU] Keamanan Data & Pemberitahuan Pelanggaran (tenggat eksplisit) — *(BARU; kritis — UU PDP 3×24 jam / GDPR 72 jam)*

**ID:**
> **Keamanan Data & Pemberitahuan Pelanggaran.** Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data, namun tidak ada metode transmisi atau penyimpanan yang 100% aman; kami tidak dapat menjamin keamanan absolut. Apabila terjadi kegagalan pelindungan data pribadi yang menimbulkan risiko bagi Anda, kami akan memberitahukan kepada Anda dan otoritas yang berwenang sesuai tenggat hukum yang berlaku — termasuk paling lambat **3×24 jam** berdasarkan UU PDP No. 27 Tahun 2022, dan, bila berlaku, tanpa penundaan yang tidak wajar / dalam **72 jam** berdasarkan GDPR Pasal 33.

**EN:**
> **Data Security & Breach Notification.** We apply reasonable technical and organizational measures to protect data, but no method of transmission or storage is 100% secure; we cannot guarantee absolute security. If a personal-data breach occurs that poses a risk to you, we will notify you and the competent authority within the time limits required by applicable law — including no later than **3×24 hours** under Indonesia's PDP Law No. 27 of 2022, and, where applicable, without undue delay / within **72 hours** under GDPR Article 33.

---

### P7. [TAMBAH] §9 — Hak Anda (hak statutori GDPR/UU PDP + otoritas pengaduan) — *(TAMBAH ke §9; mayor)*

**ID:**
> Tergantung yurisdiksi Anda (mis. Uni Eropa/Inggris di bawah GDPR/UK GDPR, atau Indonesia di bawah UU PDP), Anda berhak: mengakses, memperbaiki, menghapus, membatasi, atau menolak pemrosesan data pribadi Anda, meminta portabilitas, dan menarik persetujuan kapan saja tanpa memengaruhi keabsahan pemrosesan sebelumnya. Karena pemrosesan CAD bersifat lokal, sebagian besar hak ini dapat Anda jalankan langsung (menghapus riwayat/setelan, mematikan diagnostik, atau uninstall). Untuk data pembayaran, ajukan melalui kami atau langsung ke FastSpring. Anda juga berhak mengadu ke otoritas pelindungan data yang berwenang (mis. Lembaga PDP di Indonesia, atau otoritas perlindungan data di Uni Eropa/Inggris). Hubungi `privacy@{email}`.

**EN:**
> Depending on your jurisdiction (e.g., EU/UK under GDPR/UK GDPR, or Indonesia under the PDP Law), you have the right to: access, rectify, erase, restrict, or object to processing of your personal data, request portability, and withdraw consent at any time without affecting prior lawful processing. Because CAD's processing is local, you can exercise most of these directly (deleting history/settings, turning off diagnostics, or uninstalling). For payment data, submit a request through us or directly to FastSpring. You also have the right to lodge a complaint with the competent data-protection authority (e.g., Indonesia's PDP Authority, or an EU/UK data-protection authority). Contact `privacy@{email}`.

---

### P8. [BARU] Retensi Data — *(BARU; minor)*

**ID:**
> **Retensi Data.** Data diagnostik opsional (bila Anda aktifkan) disimpan maksimal `[mis. 12]` bulan, lalu dihapus atau di-anonimkan. Data aktivasi lisensi disimpan selama lisensi berlaku untuk keperluan dukungan dan anti-penyalahgunaan. Data pembelian disimpan oleh FastSpring sesuai kebijakan dan kewajiban pajaknya. Data lokal di perangkat Anda tersimpan hingga Anda menghapusnya.

**EN:**
> **Data Retention.** Optional diagnostics data (if you enable it) is retained for at most `[e.g., 12]` months, then deleted or anonymized. License-activation data is retained for the license term for support and anti-abuse purposes. Purchase data is retained by FastSpring per its policies and tax obligations. Local data on your device is kept until you delete it.

---

### P9. [BARU] Penerima Data / Sub-pemroses — *(BARU; minor — transparansi GDPR/PDP)*

**ID:**
> **Penerima Data / Sub-pemroses.** Kategori penerima data kami terbatas pada: (a) FastSpring (penjual sah / pemroses pembayaran); (b) penyedia analitik/diagnostik kami (hanya untuk data diagnostik opsional yang Anda aktifkan); dan (c) penyedia infrastruktur/hosting yang mendukung layanan terbatas kami. Kami tidak membagikan data pribadi Anda kepada pihak lain selain sebagaimana dijelaskan dalam Kebijakan ini atau diwajibkan hukum.

**EN:**
> **Data Recipients / Sub-processors.** Our categories of data recipients are limited to: (a) FastSpring (seller of record / payment processor); (b) our analytics/diagnostics provider (only for the optional diagnostics data you enable); and (c) infrastructure/hosting providers supporting our limited services. We do not share your personal data with others except as described in this Policy or required by law.

---

### P-X. [TAMBAH] Konten/Situs Pihak Ketiga — *(TAMBAH ke Ringkasan/§Aplikasi Desktop; mayor)*

**ID:**
> Kebijakan ini hanya mengatur penanganan data oleh CAD. Konten, situs, dan layanan pihak ketiga yang Anda akses melalui CAD diatur oleh kebijakan dan ketentuan mereka sendiri, di luar kendali kami. Tanggung jawab atas legalitas konten yang Anda unduh diatur dalam Ketentuan Penggunaan.

**EN:**
> This Policy covers only CAD's handling of data. Third-party content, sites, and services you access through CAD are governed by their own policies and terms, beyond our control. Responsibility for the legality of content you download is governed by the Terms of Use.

---

### P-11. [UBAH] §11 — Perubahan Kebijakan — *(UBAH; minor — ganti penuh §11)*

**ID:**
> **11. Perubahan Kebijakan.** Kami dapat memperbarui Kebijakan ini dari waktu ke waktu, ditandai tanggal revisi pada halaman ini. Untuk perubahan material terhadap cara kami memproses data pribadi, kami akan memberi pemberitahuan yang wajar (di dalam aplikasi atau pada halaman ini) sebelum berlaku, dan — bila diwajibkan hukum — meminta persetujuan baru Anda.

**EN:**
> **11. Changes to this Policy.** We may update this Policy from time to time, marked by a revision date on this page. For material changes to how we process personal data, we will give reasonable notice (in-app or on this page) before they take effect and — where required by law — request your renewed consent.

---

# C. REFUND (Kebijakan Refund)

### R1. [BARU] Bagian penutup — Hukum yang Berlaku, Integrasi & Peran Penjual — *(BARU; mayor)*

**ID:**
> **Hukum yang Berlaku, Keterpaduan & Peran Penjual.** Kebijakan Refund ini merupakan bagian dari dan tunduk pada Ketentuan Penggunaan CAD, dan diatur oleh hukum Republik Indonesia, tanpa mengurangi hak konsumen wajib yang berlaku bagi Anda (termasuk hak pembatalan konsumen Uni Eropa/Inggris dan hak berdasarkan UU No. 8 Tahun 1999). **FastSpring adalah penjual sah (Merchant of Record);** kewajiban statutori penjual atas refund, pembatalan (withdrawal), dan kesesuaian/garansi dipenuhi melalui FastSpring. Kebijakan refund {company} merupakan kebijakan tambahan (good-will) di atas hak statutori tersebut. Apabila terdapat pertentangan mengenai refund antara dokumen ini dan Ketentuan Penggunaan, **Kebijakan Refund ini yang berlaku** untuk hal refund. Konsekuensi pelanggaran, ganti rugi, dan penyelesaian sengketa diatur lebih lanjut dalam Ketentuan Penggunaan (Pasal 7A dan Pasal 12).

**EN:**
> **Governing Law, Integration & Seller Role.** This Refund Policy forms part of and is subject to the CAD Terms of Use, and is governed by the laws of the Republic of Indonesia, without diminishing the mandatory consumer rights applicable to you (including EU/UK consumer withdrawal rights and rights under Law No. 8 of 1999). **FastSpring is the seller of record (Merchant of Record);** the seller's statutory obligations for refunds, withdrawal, and conformity/warranty are fulfilled through FastSpring. {company}'s refund policy is an additional good-will policy layered on top of those statutory rights. If there is any conflict regarding refunds between this document and the Terms of Use, **this Refund Policy prevails** for refund matters. Consequences of breach, indemnification, and dispute resolution are further governed by the Terms of Use (Sections 7A and 12).

---

### R2. [UBAH] Bagian "Konten Digital & Persetujuan Mulai Segera" — Tiga elemen waiver wajib — *(UBAH; kritis — enforceability withdrawal EU/UK)*

**ID:**
> **Konten Digital & Persetujuan Mulai Segera (EU/UK).** Untuk konsumen Uni Eropa/Inggris, hak pembatalan (withdrawal) 14 hari atas konten/layanan digital dapat hilang **hanya bila ketiga syarat berikut terpenuhi sebelum pelaksanaan dimulai:** (a) Anda memberikan **persetujuan eksplisit terlebih dahulu** agar pelaksanaan dimulai segera; (b) Anda **mengakui** bahwa dengan demikian Anda kehilangan hak pembatalan 14 hari; dan (c) Anda menerima **konfirmasi pada media yang tahan lama (durable medium, mis. email).** Konfirmasi durable medium ini disampaikan oleh FastSpring sebagai penjual sah. **Apabila salah satu syarat tidak terpenuhi, pelepasan hak ini batal dan Anda tetap berhak atas pembatalan dan refund penuh sesuai hukum**, meskipun unduhan telah dimulai.

**EN:**
> **Digital Content & Immediate-Start Consent (EU/UK).** For EU/UK consumers, the 14-day right of withdrawal for digital content/services may be lost **only if all three of the following are met before performance begins:** (a) you give **prior explicit consent** for performance to begin immediately; (b) you **acknowledge** that you thereby lose the 14-day right of withdrawal; and (c) you receive **confirmation on a durable medium (e.g., email).** This durable-medium confirmation is provided by FastSpring as seller of record. **If any of these is not met, this waiver is void and you retain the right to withdraw and obtain a full refund as provided by law**, even if the download has begun.

---

### C2. [SELARASKAN] Konsistensi terminologi lintas dokumen — *(SELARASKAN; minor)*

Gunakan frasa **identik kata-per-kata** di ketiga dokumen, untuk menahan contra proferentem:
- "**hak statutori / hak konsumen wajib**" (jangan variasikan)
- "**penjual sah (Merchant of Record / seller of record) — FastSpring**" (selalu sebut "penjual sah", bukan sekadar "penyedia pembayaran/prosesor")
- "**{company} adalah pemberi lisensi (licensor)**"
- "**lisensi berakhir secara hukum**"
- "**pengenal instalasi yang di-pseudonimkan**" (bukan "anonim/acak")
- "**pengguna bisnis/komersial**" vs "**konsumen**" (definisi tunggal, dipakai konsisten)

---

## 3. CARVE-OUT HAK KONSUMEN WAJIB (ringkasan klausa pengecualian — agar tak batal/ilegal)

Setiap klausa pengecualian/pembatasan **wajib** memuat penyelamat berikut. Disertakan **dua rumusan** sesuai sifat klausa:

**Rumusan A — non-derogable (kematian/cedera/fraud/gross negligence):** gunakan bentuk "tidak ada dalam Ketentuan ini yang mengecualikan…". Terpasang di T2 §10(4).

**Rumusan B — afirmatif penyelamat konsumen (cap, indemnity, batas waktu, forum, governing language):** gunakan "**Klausa ini TIDAK berlaku bagi konsumen sejauh hukum wajib melarangnya.**" Terpasang di T1 (indemnity → dihapus utk konsumen), T2 §10(3), T6 (forum & batas waktu), T7(f) (bahasa).

**Teks induk carve-out (siap tempel, bisa dirujuk dari klausa mana pun):**

**ID:**
> **Penyelamat Hak Konsumen.** Tidak ada dalam Ketentuan ini yang mengecualikan, membatasi, atau mengesampingkan hak konsumen yang tidak dapat dikesampingkan menurut hukum perlindungan konsumen wajib yang berlaku bagi Anda — termasuk UU No. 8 Tahun 1999 tentang Perlindungan Konsumen dan, bila berlaku, hukum konsumen Uni Eropa/Inggris. Sejauh suatu ketentuan dalam dokumen ini bertentangan dengan hak wajib tersebut, ketentuan itu **tidak berlaku bagi konsumen** sebatas pertentangan tersebut, dan hak konsumen yang dijamin hukum tetap utuh.

**EN:**
> **Consumer Rights Safeguard.** Nothing in these Terms excludes, limits, or waives any consumer right that cannot be waived under the mandatory consumer-protection law applicable to you — including Indonesia's Law No. 8 of 1999 on Consumer Protection and, where applicable, EU/UK consumer law. To the extent any provision in this document conflicts with such mandatory rights, that provision **does not apply to consumers** to the extent of the conflict, and the consumer rights guaranteed by law remain intact.

Carve-out ini menutup: Ps. 18 UU 8/1999 (klausula baku terlarang/batal demi hukum), Dir. 93/13 (unfair terms), CRD withdrawal, Dir. 2020/1828 (collective redress), serta hak forum BPSK/domisili.

---

## 4. RISIKO RESIDUAL (jujur — yang tetap tak bisa di-cover penuh)

1. **Cap & indemnity tetap tidak berlaku penuh untuk sebagian konsumen.** Klausa dua-jalur membuat cap nominal dan indemnity hanya mengikat pengguna bisnis. Untuk konsumen, **{company} tetap memikul tanggung jawab sesuai hukum tanpa plafon** — ini disengaja agar klausa tidak batal total, tetapi berarti eksposur konsumen tidak tertutup oleh cap. Tidak ada cara legal menutup ini tanpa membuat klausa batal (Ps. 18 UU 8/1999; Dir. 93/13).

2. **Key lisensi offline tidak bisa di-revoke.** Pasca-refund/chargeback, lisensi berakhir secara hukum tetapi salinan terpasang dapat terus berjalan sampai fase validasi server hadir. Pertahanan hanya kontraktual (T5: penggunaan pasca-pengakhiran = pelanggaran), bukan teknis. **Enforcement nyata terbatas** hingga validasi daring diimplementasikan. Risiko abuse low-value diterima sebagai biaya bisnis.

3. **Waiver withdrawal EU/UK bergantung pada checkout FastSpring (di luar kendali penuh {company}).** Validitas waiver butuh 3 elemen yang dirender & direkam oleh **FastSpring**, bukan {company}. Jika checkout FastSpring tidak menampilkan/merekam ketiganya, waiver batal dan konsumen EU/UK berhak refund penuh 14 hari meski sudah unduh. Ini ketergantungan pihak ketiga yang tak bisa dijamin sepihak oleh dokumen legal — harus diverifikasi (lihat §5).

4. **Kerancuan seller (FastSpring) vs licensor ({company}) tak hilang total.** Banyak kewajiban statutori konsumen melekat pada *seller* = FastSpring; sebagian remedi konsumen mungkin harus ditempuh ke FastSpring, bukan {company}. Pemisahan peran (T0) memperjelas, tetapi konsumen yang menuntut {company} atas hal yang sebenarnya kewajiban FastSpring tetap mungkin terjadi; alokasi internal {company}↔FastSpring di luar lingkup dokumen konsumen.

5. **Pertahanan anti-contributory infringement bergantung pada perilaku non-legal.** §1A/§6A/§12A memperkuat posisi "substantial non-infringing use" (doktrin Sony), tetapi **bisa runtuh oleh inducement** (Grokster) jika materi pemasaran mempromosikan bypass paywall/DRM/rip dari layanan berbayar. Dokumen legal tidak bisa menambal materi pemasaran yang melanggar — audit marketing adalah prasyarat eksternal.

6. **DMCA §512(c) safe harbor tetap tidak tersedia.** Karena CAD tak meng-host konten, tidak ada safe harbor host untuk dimanfaatkan; §12A hanya menyatakan posisi jujur + repeat-infringer policy. Ini mengurangi over-claim, tapi tidak memberi perlindungan safe-harbor yang sesungguhnya — hanya itikad baik.

7. **Governing language untuk konsumen melemahkan kepastian {company}.** Memberi konsumen versi bahasanya sendiri (T7-f) wajib secara hukum, tetapi berarti **risiko penafsiran versi terjemahan ada di {company}**, bukan konsumen. Trade-off yang tak terhindarkan.

8. **DSA / Digital Fairness Act / aturan auto-renewal EU = watch-item.** Saat ini aman karena Lifetime one-time. Jika menambah langganan/auto-renew, aturan dark-pattern & cancellation EU akan berlaku dan dokumen ini perlu revisi. Tidak ter-cover sekarang secara sengaja.

9. **Tenggat breach 3×24 jam (UU PDP) menuntut kesiapan operasional.** Klausa P6 menjanjikan tenggat yang **hanya bisa dipenuhi bila ada proses deteksi & pelaporan internal.** Janji legal melampaui kapabilitas operasional saat ini = risiko under-delivery. Perlu runbook incident-response.

---

## 5. PRASYARAT NON-LEGAL (blocking go-live — agar klausa tidak runtuh)

1. **[BLOCKING] Diagnostik default OFF.** Sinkronkan kode dengan keputusan Opsi A: `app.py:210` default `False`; `ui.html:415` hapus class `on` + ganti "anonymous device ID" → "pseudonymous installation ID"; `ui.js` default OFF; jangan kirim event `install` sebelum consent (`app.py:225`). Default ON + teks "MATI default" = misrepresentasi aktif begitu `TELEMETRY_URL` diisi.
2. **[BLOCKING] Verifikasi waiver withdrawal di checkout FastSpring** menampilkan & merekam 3 elemen (R2) + email konfirmasi durable medium. Tanpa bukti ini, **jangan klaim waiver**; konsumen EU/UK tetap berhak refund penuh.
3. **[BLOCKING] MoR konsisten:** perbarui `license.py BUY_URL` dari Paddle → checkout FastSpring agar tombol beli = dokumen legal.
4. **Audit materi pemasaran:** hapus klaim bypass paywall/DRM/rip layanan berbayar (anti-inducement / Grokster).
5. **Isi placeholder:** `legal@`, `privacy@`, `copyright@{email}`, alamat terdaftar {company}, tautan kebijakan privasi/terms/refund FastSpring, periode retensi P8.
6. **Nama entitas:** ganti semua "PT Inti Asia" → `{company}` di ketiga dokumen.
7. **Runbook incident-response** untuk memenuhi janji breach 3×24 jam (UU PDP) / 72 jam (GDPR) di P6.

---

**Penutup.** Seluruh item `unenforceable`, `consumerViolations`, dan `remainingGaps` dari verifikasi telah ditutup atau—bila tak dapat ditutup penuh—dinyatakan jujur di §4. Dua keputusan keras difinalkan (bukan opsi): **diagnostik default OFF (Opsi A)** dan **tanpa class-action waiver/arbitrase wajib**. Struktur **dua-jalur Konsumen vs Bisnis** + **carve-out afirmatif** + **pemisahan seller (FastSpring) / licensor ({company})** adalah tulang punggung yang membuat klausa protektif tanpa menjadi unfair term yang batal demi hukum.

---

## Lampiran: Hasil Verifikasi (mentah)

```json
{
  "unenforceable": [
    "A2 (Pasal 7A Indemnifikasi) terhadap konsumen Indonesia: indemnity luas dari konsumen ke pelaku usaha adalah pengalihan tanggung jawab/pembebanan kewajiban sepihak yang berpotensi BATAL DEMI HUKUM di bawah Pasal 18 ayat (1) huruf a & ayat (3) UU 8/1999. Carve-out yang ada hanya menyebut 'EU/UK' + 'penggunaan melanggar hukum'; tidak cukup. Untuk B2C Indonesia, indemnity konsumen sebaiknya DIHAPUS sama sekali (bukan sekadar dibatasi), dan hanya dipertahankan untuk pengguna business/komersial.",
    "A4(2) CAP agregat 'tidak melebihi yang Anda bayar dalam 12 bulan' terhadap konsumen: pembatasan total liability ke jumlah pembayaran adalah klausula eksonerasi yang dapat dianggap unfair term EU (Dir. 93/13 Annex 1(b): pengecualian/pembatasan hak hukum konsumen atas kerugian akibat wanprestasi) dan klausula baku terlarang Pasal 18 UU 8/1999. Carve-out di A4(3) membantu, tetapi cap nominal terhadap konsumen tetap berisiko batal; perlu pernyataan tegas 'cap ini TIDAK berlaku bagi konsumen sejauh hukum wajib melarang' bukan hanya 'sejauh diizinkan'.",
    "A4(2) frasa 'dibayarkan kepada penyedia pembayaran (Merchant of Record)': karena FastSpring adalah SELLER OF RECORD (penjual sah secara hukum, bukan sekadar prosesor), CoreAsia tidak menerima pembayaran langsung dari konsumen. Cap yang mengukur liability CoreAsia dari 'jumlah yang Anda bayar ke MoR' rapuh: konsumen tidak berkontrak jual-beli dengan CoreAsia melainkan dengan FastSpring, sehingga dasar privity untuk membatasi liability CoreAsia ke angka itu lemah dan bisa diserang.",
    "A9 forum klausa 'pengadilan yang berwenang di Jakarta' terhadap konsumen Indonesia: bertentangan dengan hak konsumen Indonesia. Untuk sengketa konsumen, BPSK adalah kompetensi absolut di luar pengadilan, dan keberatan atas putusan BPSK diajukan ke Pengadilan Negeri di tempat DOMISILI KONSUMEN (bukan Jakarta). Memaksa forum Jakarta menafikan hak forum domisili konsumen -> klausa forum dapat dikesampingkan; carve-out yang ada menyebut BPSK tapi tetap menetapkan Jakarta sebagai default, menimbulkan kontradiksi internal.",
    "A9 batas waktu klaim '1 tahun' terhadap konsumen: memperpendek masa kedaluwarsa hak konsumen di bawah masa yang dijamin hukum (mis. daluwarsa umum KUHPerdata, atau garansi statutori EU 2 tahun) bisa unfair/void bagi konsumen. Perlu carve-out bahwa batas 1 tahun tidak berlaku bila hukum konsumen wajib memberi jangka lebih panjang.",
    "A9 Catatan penyusun class-action waiver: usulan klausa 'Anda melepaskan hak gugatan kelompok' — TIDAK BERLAKU/illegal bagi konsumen EU (collective redress dijamin Dir. (EU) 2020/1828) dan berpotensi klausula baku terlarang di Indonesia. Walau ada carve-out 'tidak berlaku bila dilarang', memasangnya tetap berisiko menjadikan keseluruhan klausa sengketa rentan; rekomendasi draf untuk TIDAK memasang sudah benar dan harus ditegaskan sebagai keputusan, bukan opsi.",
    "A12(f) Governing Language: menetapkan 'versi Bahasa Indonesia yang berlaku' atas konsumen asing dapat bertabrakan dgn hak konsumen EU/lokal atas informasi dalam bahasanya; baris carve-out ada tapi klausa 'versi BI yang berlaku' tetap tidak boleh diberlakukan untuk mengikat konsumen non-Indonesia pada makna yang tak ia pahami.",
    "B3 Opsi B (Diagnostik default ON tanpa consent) untuk pengguna EU/UK: ILEGAL di bawah ePrivacy/GDPR untuk analytics non-esensial — memerlukan consent SEBELUM pengumpulan, bukan opt-out. Klausa kebijakan yang melegitimasi default-ON tanpa prior consent tidak enforceable terhadap pengguna EU dan menimbulkan pelanggaran aktif; hanya Opsi A (default OFF / prior consent) yang sah.",
    "A8 (Pasal 11) 'lisensi offline tidak dapat dinonaktifkan jarak jauh; penggunaan pasca-refund = pelanggaran': enforceable sbg pernyataan kontraktual, tapi terhadap konsumen yang menjalankan hak refund/withdrawal STATUTORI (mis. cancel 14 hari EU), menyebut penggunaan mereka 'tanpa lisensi sah & melanggar' dapat menjadi misrepresentasi hak — perlu carve-out bahwa ini tidak berlaku untuk refund yang menjadi hak hukum konsumen."
  ],
  "consumerViolations": [
    "Pasal 18 UU 8/1999 (pengalihan/pembatasan tanggung jawab pelaku usaha = klausula baku terlarang, batal demi hukum ay.(3)): tersentuh oleh A2 indemnity konsumen, A3/A4 disclaimer & cap liability. Carve-out 'sejauh diizinkan' membantu tapi untuk Indonesia idealnya klausa-klausa ini secara tegas mengecualikan konsumen B2C, bukan sekadar di-hedge.",
    "Hak forum konsumen Indonesia (BPSK kompetensi absolut + keberatan ke PN domisili konsumen): A9 default forum Jakarta menafikan ini. Forum konsumen Indonesia harus = domisili konsumen/BPSK, bukan Jakarta.",
    "EU Dir. 93/13 (unfair terms): cap liability (A4), pembatasan jaminan (A3), batas waktu klaim 1 thn (A9), indemnity (A2), forum jauh dari domisili (A9) semuanya masuk daftar indikatif/ujian unfairness. Carve-out 'mandatory consumer law' ada, namun klausa cap nominal & forum tetap berisiko dinilai unfair => not binding.",
    "EU Consumer Rights Directive (right of withdrawal 14 hari untuk digital content): waiver hanya sah bila ADA prior express consent + acknowledgment kehilangan hak + konfirmasi durable medium (email). Checklist D4 menyebut ini, tapi DRAF Refund hanya 'cross-ref'; bila UI tidak menangkap ketiga elemen, waiver BATAL dan konsumen tetap berhak refund penuh — ini risiko enforceability nyata, bukan teoretis.",
    "UU PDP No.27/2022: (a) kewajiban pemberitahuan kebocoran dalam 3x24 jam ke subjek data DAN lembaga — B6 hanya bilang 'sesuai hukum yang berlaku', tidak mencantumkan tenggat 3x24 jam; (b) hak subjek data (akses, koreksi, hapus, tarik consent, dll) — B7 sudah mencakup; (c) dasar pemrosesan sah — B5 sudah ada. Gap utama: tenggat breach notification & penunjukan lembaga (Lembaga PDP).",
    "GDPR Art.6 lawful basis & ePrivacy consent: B3 Opsi B default-ON melanggar; harus prior consent untuk diagnostik non-esensial (Opsi A)."
  ],
  "remainingGaps": [
    {
      "severity": "kritis",
      "gap": "Kerancuan identitas SELLER/penanggung jawab konsumen. FastSpring adalah Merchant of Record = PENJUAL SAH secara hukum, bukan sekadar prosesor pembayaran. Banyak kewajiban statutori konsumen (refund, withdrawal, garansi, conformity) melekat pada SELLER, yaitu FastSpring — sementara seluruh draf menempatkan CoreAsia sebagai pihak yang men-disclaim & membatasi. Ini menciptakan celah ganda: (1) klausa CoreAsia mungkin tidak menjangkau kewajiban yang sebenarnya ada di FastSpring; (2) cap liability 'jumlah dibayar ke MoR' rapuh karena konsumen tidak berkontrak beli dgn CoreAsia.",
      "fix": "Definisikan secara eksplisit di Terms & Refund: 'FastSpring adalah penjual sah (Merchant of Record/seller of record); CoreAsia adalah pemberi lisensi (licensor) atas perangkat lunak.' Pisahkan dengan jelas kewajiban seller (FastSpring: pembayaran, pajak, refund, withdrawal) vs licensor (CoreAsia: lisensi & fungsi software). Cantumkan tautan ke Terms/Refund/Privacy FastSpring sbg pengikat utama transaksi jual-beli, dan posisikan kebijakan refund CoreAsia sebagai kebijakan good-will di atas hak statutori yang dipenuhi via FastSpring."
    },
    {
      "severity": "kritis",
      "gap": "Tenggat pemberitahuan kebocoran data UU PDP tidak disebut. B6 hanya 'sesuai hukum yang berlaku'. UU PDP No.27/2022 mewajibkan pemberitahuan tertulis paling lambat 3x24 jam kepada subjek data DAN lembaga (Lembaga PDP). Tanpa ini, klausa keamanan under-promise terhadap kewajiban wajib.",
      "fix": "Tambahkan di B6: 'Apabila terjadi kegagalan pelindungan data pribadi, kami akan memberitahukan kepada Anda dan otoritas yang berwenang sesuai tenggat hukum yang berlaku (mis. paling lambat 3x24 jam berdasarkan UU PDP No.27/2022) serta, jika berlaku, tanpa penundaan yang tidak wajar / dalam 72 jam berdasarkan GDPR Art.33.'"
    },
    {
      "severity": "kritis",
      "gap": "Enforceability waiver withdrawal EU/UK bersandar pada implementasi UI yang belum ada (checklist D4). Bila checkout FastSpring tidak menangkap ketiga elemen (prior express consent + acknowledgment hilang hak + konfirmasi durable medium), seluruh waiver di Refund BATAL dan konsumen EU/UK berhak refund penuh 14 hari meski sudah unduh.",
      "fix": "Jadikan D4 syarat go-live blocking, bukan to-do. Verifikasi checkout FastSpring menampilkan checkbox eksplisit 'Saya minta layanan dimulai segera & memahami saya kehilangan hak batal 14 hari' + email konfirmasi yang merekam consent. Karena FastSpring seller, koordinasikan agar konfirmasi durable medium dikirim FastSpring. Tanpa bukti ini, jangan klaim waiver di Refund."
    },
    {
      "severity": "mayor",
      "gap": "Cap liability & indemnity tidak memisahkan KONSUMEN vs BUSINESS user. Draf memakai satu set klausa untuk semua dgn carve-out 'sejauh diizinkan'. Untuk Indonesia, klausa eksonerasi terhadap konsumen berisiko batal total (Pasal 18 ay.3), sedangkan terhadap business user umumnya sah. Pendekatan one-size + hedge meninggalkan ambiguitas yang merugikan saat litigasi (contra proferentem).",
      "fix": "Buat klausul dua-jalur: 'Jika Anda konsumen: [versi minimal — tanpa indemnity, tanpa cap nominal, hanya pengecualian kerugian tidak langsung sejauh diizinkan + carve-out wajib]. Jika Anda pengguna bisnis/komersial: [versi penuh — indemnity + cap 12 bulan + disclaimer luas].' Ini lebih protektif daripada satu klausa yang rentan batal seluruhnya untuk konsumen."
    },
    {
      "severity": "mayor",
      "gap": "Tidak ada klausul kepatuhan sanksi/ekspor & pembatasan yurisdiksi terlarang. Untuk software global, ketiadaan klausa 'tidak digunakan di yurisdiksi yang dilarang / sanksi' & ketiadaan disclaimer ketersediaan per-negara membuka eksposur.",
      "fix": "Tambahkan klausa singkat: pengguna menyatakan tidak berada di yurisdiksi yang dikenai sanksi yang melarang penyediaan software; CoreAsia dapat membatasi ketersediaan per yurisdiksi."
    },
    {
      "severity": "mayor",
      "gap": "Klaim 'kegunaan sah substansial / general-purpose tool' (A1, A10) dibiarkan sebagai pernyataan kontraktual tanpa dukungan disclaimer 'pengguna bertanggung jawab memastikan legalitas & mematuhi ToS situs sumber' yang kuat di Acceptable Use. Pembelaan anti-contributory infringement (doktrin Sony/substantial non-infringing use) lebih kuat bila produk juga tidak secara aktif mempromosikan pelanggaran (Grokster inducement). Materi pemasaran yang menonjolkan 'download dari situs X berbayar' bisa meruntuhkan pembelaan ini.",
      "fix": "Selain A1/A10, audit materi pemasaran agar tidak meng-induce pelanggaran (hapus klaim 'bypass paywall/DRM/rip dari Netflix dll'). Perkuat Acceptable Use: kewajiban tegas pengguna mematuhi ToS situs sumber & hukum hak cipta; larangan circumvent DRM (relevan utk DMCA 1201 / UU Hak Cipta Ps.52)."
    },
    {
      "severity": "mayor",
      "gap": "DMCA counter-notice & repeat-infringer policy tidak lengkap di A10. A10 menyebut takedown notice & 'pelanggar berulang' tapi tidak ada prosedur counter-notice maupun definisi/penegakan repeat-infringer policy yang merupakan syarat safe harbor DMCA 512(i). Karena CoreAsia tidak host konten, safe-harbor 512(c) memang kurang relevan, tapi klaim 'kami menanggapi DMCA' tanpa mekanisme lengkap bisa menyesatkan.",
      "fix": "Sesuaikan ekspektasi: nyatakan jujur bahwa karena tidak meng-host konten, mekanisme notice-and-takedown 512(c) tidak berlaku penuh; yang dilakukan terbatas pada penghentian lisensi pelanggar berulang. Tambahkan kebijakan repeat-infringer yang nyata (kriteria & konsekuensi) bila ingin menyebut DMCA."
    },
    {
      "severity": "minor",
      "gap": "DSA (Digital Services Act) & Digital Fairness Act tidak dipertimbangkan untuk pasar EU. Meski CAD bukan platform/host, kewajiban transparansi tertentu & tren Digital Fairness Act (dark patterns, subscription) relevan bila ada elemen langganan/auto-renew di masa depan.",
      "fix": "Catat sebagai watch-item; bila menambah subscription, patuhi aturan auto-renewal & cancellation EU. Saat ini Lifetime one-time relatif aman."
    },
    {
      "severity": "minor",
      "gap": "Retensi data & penghapusan tidak diatur di Privacy. Tidak ada periode retensi untuk diagnostik & data aktivasi, padahal UU PDP/GDPR mensyaratkan batas retensi + penghapusan saat tujuan tercapai.",
      "fix": "Tambahkan klausa retensi: 'Data diagnostik disimpan maksimal [X] bulan lalu dihapus/anonim; data pembelian disimpan oleh FastSpring sesuai kebijakan & kewajiban pajaknya.'"
    },
    {
      "severity": "minor",
      "gap": "Sub-processor / pihak ketiga (analytics endpoint TELEMETRY_URL, hosting) tidak diungkap di Privacy. GDPR/UU PDP mensyaratkan transparansi penerima data.",
      "fix": "Daftarkan kategori penerima/sub-processor (penyedia analytics, MoR FastSpring, hosting) di Privacy."
    },
    {
      "severity": "minor",
      "gap": "Carve-out konsumen wajib memakai frasa 'sejauh diizinkan oleh hukum' di banyak tempat — ini lemah karena masih memaksa klausa berlaku sampai dibuktikan dilarang. Untuk klausa paling sensitif terhadap konsumen, frasa harus afirmatif: 'Klausa ini TIDAK berlaku bagi konsumen jika/ sejauh hukum wajib melarangnya.'",
      "fix": "Standarkan dua bentuk: (i) untuk pengecualian non-derogable (kematian/cedera/fraud/gross negligence) gunakan 'tidak ada dalam Ketentuan ini yang mengecualikan...'; (ii) untuk cap/indemnity/forum terhadap konsumen gunakan rumusan afirmatif penyelamat konsumen, bukan sekadar 'sejauh diizinkan'."
    }
  ]
}
```
