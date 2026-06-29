---
name: design-system
description: "WAJIB dibaca di setiap fase yang melibatkan UI. Berisi aturan visual: warna, tipografi, border radius, spacing, dan komponen dasar, termasuk aturan khusus untuk modal dan alert. Berlaku di semua halaman dan role (admin, dosen, mahasiswa)."
---

# Design System — SIAKAD

> Sumber gaya: diadaptasi dari style reference "Awesomic" (rounded midnight marketplace — graduated neutral scale, single custom typeface, dark filled CTA). Bahasa visualnya (palet, tipografi weight-driven, badge style) DIPERTAHANKAN, tapi **radius dikalibrasi ulang jadi kecil-konsisten di seluruh sistem** (bukan 28-36px seperti referensi aslinya) karena SIAKAD adalah sistem data-heavy (tabel, form panjang, modal berisi banyak field) — radius besar membuat tabel dan modal terasa tidak rapi dan tidak institusional.

## Prinsip Umum

Ini adalah sistem **data-heavy** (tabel, form, dashboard angka) — bukan landing page marketing. Prioritaskan **clarity dan scanability** di atas dekorasi visual. Warna netral graduated dan tipografi weight-driven menghasilkan hierarki visual, BUKAN ukuran radius atau efek dekoratif.

## Tokens — Colors

Palet netral graduated diadaptasi langsung dari referensi, dipakai apa adanya karena cocok untuk UI institusional (kontras tinggi, terbaca jelas di tabel padat). Tambahan warna semantik akademik (success/warning/destructive) yang tidak ada di referensi asli, karena SIAKAD butuh status visual (lulus/pending/ditolak, hadir/izin/alpa).

```css
:root {
  /* Neutral scale — dari referensi, dipakai langsung */
  --color-obsidian: #09090b;      /* teks heading utama, fill button primary */
  --color-ink: #18181b;           /* body text, teks nav */
  --color-graphite: #3f3f46;      /* border, badge background (dark variant) */
  --color-slate: #52525b;         /* icon fill, secondary elements */
  --color-steel: #71717a;         /* muted text, caption, label sekunder */
  --color-ash: #a1a1aa;           /* placeholder, teks subdued */
  --color-pebble: #d4d4d8;        /* hairline divider, border ringan */
  --color-fog: #ececee;           /* card surface sekunder, hover state */
  --color-mist: #f4f4f5;          /* page canvas / background utama */
  --color-snow: #ffffff;          /* card surface utama, input background */

  /* Semantic — ditambahkan khusus untuk konteks akademik, TIDAK ADA di referensi asli */
  --color-success: #15803d;       /* hadir, disetujui, lulus */
  --color-success-bg: #f0fdf4;
  --color-warning: #a16207;       /* pending, diajukan, menunggu approval */
  --color-warning-bg: #fefce8;
  --color-destructive: #b91c1c;   /* ditolak, alpa, tidak lulus */
  --color-destructive-bg: #fef2f2;
  --color-info: #1d4ed8;          /* info netral, draft */
  --color-info-bg: #eff6ff;

  /* Role/alias semantik untuk dipakai di komponen */
  --color-primary: var(--color-obsidian);
  --color-primary-foreground: var(--color-snow);
  --color-background: var(--color-mist);
  --color-surface: var(--color-snow);
  --color-surface-muted: var(--color-fog);
  --color-border: var(--color-pebble);
  --color-foreground: var(--color-ink);
  --color-muted-foreground: var(--color-steel);
}
```

**Aksen vivid (Ember `#ff5a00`, Orchid Flash `#fe45e2`) dari referensi asli TIDAK DIPAKAI** di SIAKAD — keduanya berfungsi sebagai aksen dekoratif/branding marketplace (badge YC, card showcase) yang tidak relevan untuk sistem akademik. Status visual SIAKAD memakai warna semantik standar (success/warning/destructive) di atas, bukan warna vivid sembarangan.

## Tokens — Typography

Mengadopsi prinsip **single typeface, weight-driven hierarchy** dari referensi — satu font dipakai dari label 10px sampai heading terbesar, hierarki dibentuk oleh **weight**, bukan ganti-ganti font.

```css
:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  /* [ASUMSI]: Inter sebagai pengganti Cosmica (font custom di referensi tidak tersedia untuk lisensi umum).
     Inter dipilih karena punya range weight 300-700 yang sama dan dirancang untuk UI data-heavy / tabel angka.
     Ganti token ini kalau kampus punya font identitas sendiri. */
}
```

| Role | Size | Line Height | Weight | Token |
|------|------|-------------|--------|-------|
| caption | 11px | 1.5 | 500 | `--text-caption` |
| body-sm | 13px | 1.5 | 400 | `--text-body-sm` |
| body | 14px | 1.55 | 400 | `--text-body` |
| body-lg | 16px | 1.5 | 400 | `--text-body-lg` |
| label | 13px | 1.4 | 500 | `--text-label` |
| heading-sm | 18px | 1.35 | 600 | `--text-heading-sm` |
| heading | 22px | 1.3 | 600 | `--text-heading` |
| heading-lg | 28px | 1.25 | 700 | `--text-heading-lg` |
| display | 36px | 1.2 | 700 | `--text-display` |

Catatan adaptasi dari referensi:
- Skala ukuran **diperkecil dan dipadatkan** dibanding referensi (yang naik sampai 64px untuk display hero) — SIAKAD tidak punya halaman hero marketing, heading terbesar yang dibutuhkan adalah judul halaman dashboard (~28-36px), bukan headline promosi.
- Body text default tetap **13-14px**, sesuai prinsip referensi untuk density tinggi (cocok untuk tabel dengan banyak kolom).
- Letter-spacing tetap normal di semua ukuran (prinsip referensi dipertahankan) — jangan tracking-out heading manapun.
- Angka penting (NIM, NIDN, nilai, IPK, SKS) pakai weight 600 (`font-semibold`), bukan ukuran lebih besar, untuk penekanan tanpa mengganggu alignment tabel.

## Border Radius — PERBEDAAN UTAMA dari Referensi

> Referensi asli pakai radius ekstrem (36-48px untuk card, pill 10000px untuk button). **Ini SENGAJA TIDAK diikuti.** Untuk SIAKAD, semua radius dikecilkan jadi konsisten kecil di seluruh sistem. Tidak ada elemen pill, tidak ada radius di atas 12px di manapun.

```css
:root {
  --radius-sm: 4px;     /* badge, tag, input kecil */
  --radius-md: 6px;     /* default — button, input, card kecil */
  --radius-lg: 8px;     /* card utama, dropdown, popover */
  --radius-xl: 10px;    /* modal/dialog container — radius terbesar yang dipakai di seluruh sistem */
}
```

**Aturan tegas:**
- TIDAK ADA pill shape (`border-radius: 9999px` atau sejenisnya) di manapun, termasuk button.
- TIDAK ADA radius di atas **10px**, di komponen apapun, tanpa terkecuali — termasuk modal yang melebar (lihat section Modal & Alert di bawah).
- Card dashboard, tabel container, dan panel pakai `--radius-lg` (8px).
- Button dan input pakai `--radius-md` (6px).
- Badge dan tag pakai `--radius-sm` (4px).
- Modal/dialog pakai `--radius-xl` (10px) — radius PALING BESAR di seluruh sistem, dan hanya dipakai di sana.

## Spacing & Shapes

Base unit 4px (sama seperti referensi), tapi skala dipadatkan untuk konteks form/tabel:

```css
:root {
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
}
```

- Card padding: 20-24px (bukan 24-28px referensi — sedikit lebih padat untuk density data)
- Element gap (form, list): 8-12px
- Section gap (antar blok dashboard): 32-40px (jauh lebih kecil dari 80px referensi — SIAKAD tidak punya section sebesar landing page)
- Padding cell tabel: `px-4 py-2.5`

## Shadows

Mengikuti prinsip referensi: **card TIDAK pakai drop shadow** untuk depth (depth dibentuk dari step warna surface), shadow hanya untuk elemen yang benar-benar mengambang (modal, dropdown, popover, toast).

```css
:root {
  --shadow-border-inset: rgb(228, 228, 231) 0px 1px 0px 0px inset; /* hairline bawah, untuk header tabel/card */
  --shadow-elevated: rgba(0, 0, 0, 0.08) 0px 4px 16px 0px, rgba(0, 0, 0, 0.04) 0px 1px 2px 0px; /* untuk modal, dropdown, popover yang mengambang di atas konten */
  --shadow-md: rgba(0, 0, 0, 0.04) 0px 4px 12px 0px; /* dropdown ringan, tooltip */
}
```

- Card surface (white di atas mist canvas): **tanpa shadow**, depth dari `--color-snow` vs `--color-mist`.
- Modal, dropdown menu, popover, toast: pakai `--shadow-elevated` karena ini benar-benar melayang di atas layer lain.

---

## Modal & Alert — Aturan Khusus

> Ini bagian paling kritis untuk dipatuhi konsisten. SIAKAD punya banyak modal berisi form panjang (tambah mahasiswa, setup komponen nilai, dst) dan butuh alert/dialog konfirmasi yang sering dipakai (approve/reject KRS, hapus data, dst). Dua jenis ini punya aturan ukuran dan radius yang BERBEDA dari komponen lain.

### Prinsip Dasar

1. **Radius modal & alert SELALU `--radius-xl` (10px)** — ini SATU-SATUNYA tempat radius 10px dipakai. Tidak lebih besar dari ini, sesuai aturan global "tidak ada radius di atas 10px di manapun".
2. **Lebar modal mengikuti BANYAKNYA KONTEN, bukan satu ukuran fixed untuk semua modal.** Jangan pakai satu width tetap untuk semua dialog — pilih varian sesuai kompleksitas form di dalamnya.
3. Alert/confirmation dialog (konfirmasi ya/tidak, tanpa form kompleks) SELALU pakai varian sempit — JANGAN dilebarkan meski bisa.

### Varian Lebar Modal

| Varian | Max-width | Kapan Dipakai |
|--------|-----------|----------------|
| `alert` | 400px | Konfirmasi aksi (hapus, approve, reject, logout) — hanya judul, deskripsi singkat, 2 tombol aksi. TIDAK ADA form di dalamnya. |
| `modal-sm` | 480px | Form sangat sederhana, 1-3 field (misal: reset password, tolak KRS dengan catatan) |
| `modal-md` | 640px | Form sedang, 4-8 field dalam 1 kolom (misal: tambah mata kuliah, tambah komponen nilai) |
| `modal-lg` | 880px | Form kompleks, banyak field — gunakan grid 2 kolom di dalamnya (misal: tambah mahasiswa lengkap dengan semua atribut, form jadwal dengan validasi bentrok) |
| `modal-xl` | 1100px | Konten berupa tabel di dalam modal, atau form multi-section (misal: input nilai banyak mahasiswa sekaligus dalam satu modal, preview import CSV sebelum konfirmasi) |

**Aturan pemilihan varian:** hitung jumlah field/kompleksitas konten dulu sebelum membuat modal — JANGAN selalu pakai `modal-md` sebagai default malas. Modal yang kontennya terlalu sempit untuk lebarnya akan terlihat kosong dan tidak rapi; modal yang kontennya terlalu padat untuk lebarnya akan terasa sesak dan field-nya bertumpuk vertikal terlalu panjang.

```css
:root {
  --modal-width-alert: 400px;
  --modal-width-sm: 480px;
  --modal-width-md: 640px;
  --modal-width-lg: 880px;
  --modal-width-xl: 1100px;
  --modal-radius: var(--radius-xl); /* 10px, satu-satunya tempat radius ini dipakai */
}
```

### Struktur Internal Modal

- Header: judul (`--text-heading-sm`, weight 600) + deskripsi singkat opsional (`--text-body-sm`, `--color-steel`) + tombol close di kanan atas
- Body: padding 20-24px, scroll internal jika konten lebih panjang dari viewport (`max-height: 85vh`, `overflow-y: auto` pada body modal, BUKAN pada seluruh modal termasuk header/footer)
- Footer: tombol aksi rata kanan, urutan **tombol sekunder (Batal) di kiri, tombol primer (Simpan/Submit) di kanan**, dipisahkan border atas tipis (`--shadow-border-inset`)
- Untuk `modal-lg` dan `modal-xl` dengan banyak field: gunakan grid 2 kolom (`grid-cols-2 gap-4`) di body, JANGAN biarkan semua field stack 1 kolom vertikal memanjang — ini alasan utama varian lebar ini ada

### Alert / Confirmation Dialog

Berbeda dari modal form — ini selalu pendek dan tidak pernah dilebarkan, terlepas dari isi pesannya:

- Width tetap `--modal-width-alert` (400px), TIDAK PERNAH diubah meski pesan konfirmasi panjang (kalau pesan panjang, persingkat teksnya, jangan lebarkan dialognya)
- Struktur: ikon status (opsional, ukuran kecil ~20px) + judul singkat + deskripsi 1-2 baris + dua tombol aksi sejajar di bawah
- Warna tombol aksi primer mengikuti semantik aksi: aksi destruktif (hapus, tolak, nonaktifkan) pakai `--color-destructive` sebagai background tombol; aksi netral/approval pakai `--color-primary` (obsidian)
- SELALU ada tombol "Batal" di sisi kiri sebagai escape hatch, tidak ada alert tanpa opsi batal kecuali benar-benar tidak bisa dibatalkan (jarang terjadi di SIAKAD)

### Toast Notification (Pelengkap, Bukan Pengganti Alert)

- Dipakai untuk feedback aksi yang sudah selesai (berhasil simpan, gagal validasi) — BUKAN untuk konfirmasi sebelum aksi (itu tugas alert dialog)
- Radius `--radius-lg` (8px, BUKAN `--radius-xl` — toast bukan modal)
- Posisi: top-right atau bottom-right, auto-dismiss 3-4 detik untuk sukses, tidak auto-dismiss untuk error (user harus dismiss manual supaya pesan error tidak terlewat)

---

## Komponen Dasar & Aturannya

- **Tabel data** (komponen paling sering dipakai di sistem ini): harus mendukung sorting, pagination, dan search/filter sejak awal. Gunakan `@tanstack/table` di atas shadcn Table jika kompleksitas tinggi. Radius container tabel: `--radius-lg` (8px), header row pakai `--color-fog` sebagai background dengan teks `--color-steel` weight 500.
- **Button primer**: background `--color-obsidian`, teks putih, radius `--radius-md` (6px) — TIDAK pill seperti referensi asli. Weight label 500.
- **Button sekunder/outline**: background `--color-snow`, border `--color-graphite`, radius `--radius-md` (6px) sama dengan primer untuk konsistensi.
- **Form**: label jelas di atas input (bukan placeholder-only), error inline di bawah field, input radius `--radius-md` (6px).
- **Status/Badge**: warna semantik KONSISTEN — "Disetujui/Hadir/Lulus" selalu `--color-success`, "Diajukan/Pending/Izin" selalu `--color-warning`, "Ditolak/Alpa/Tidak Lulus" selalu `--color-destructive`. Radius badge `--radius-sm` (4px), padding `4px 8px`, `--text-caption` weight 500 — mengikuti prinsip ukuran kompak dari referensi tapi dengan radius kecil bukan 12px.
- **Dashboard card** (ringkasan angka): angka besar (`--text-heading-lg` atau `--text-display`, weight 700, `--color-obsidian`) + label kecil di bawah (`--text-caption`, `--color-steel`) langsung di atas background card, tanpa border/shadow berlebihan — prinsip "raw typographic emphasis" dari referensi dipertahankan.
- **Sidebar navigasi**: pola visual sama di semua role, hanya isi menu yang beda. Item aktif pakai background `--color-fog` dengan radius `--radius-md`, teks weight 500.

## Hal yang Dilarang Secara Visual

- Tidak ada pill shape/radius besar di manapun (lihat section Border Radius) — ini adaptasi paling signifikan dari referensi asli
- Tidak ada gradient
- Tidak ada warna vivid/aksen sembarangan (Ember, Orchid Flash dari referensi asli TIDAK dipakai) — hanya neutral scale + 4 warna semantik yang didefinisikan
- Tidak ada animasi bouncy/overshoot spring (referensi asli punya easing spring untuk entrance) — SIAKAD pakai transisi linear/ease singkat saja (`transition-colors`, 150-200ms), karena ini sistem kerja, bukan landing page yang butuh kesan playful
- Tidak ada emoji di UI produksi
- Tidak ada warna di luar token yang didefinisikan — semua warna baru harus ditambahkan sebagai token dulu, bukan inline arbitrary value
- Modal TIDAK PERNAH melebihi `--modal-width-xl` (1100px) — kalau konten lebih kompleks dari itu, pertimbangkan jadikan halaman penuh, bukan modal