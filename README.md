# Sero — Level 22 Unlocked

Game ulang tahun 3 November: jelajahi taman, kumpulkan 22 bintang, nyalakan lilin dan buka kado. Menggunakan karakter Sero versi off-shoulder dengan baju dalam motif macan dan jeans baggy 3/4 tanpa lipatan.

## Mainkan langsung

Buka `release/Sero-Level-22.html` di Chrome, Edge, Safari atau Firefox modern. Gambar, CSS dan permainan sudah menyatu di file ini. Tidak perlu instalasi. Font Google dimuat saat internet tersedia; tanpa internet, game tetap berjalan dengan font monospace bawaan. Audio disintesis di browser dan dimulai setelah interaksi pengguna.

## Kontrol

- Desktop: WASD / panah untuk berjalan. Space untuk lompat atau interaksi saat dekat kue/kado. E untuk interaksi. Escape untuk jeda.
- Ponsel: D-Pad untuk berjalan, A untuk lompat, B untuk interaksi.
- Peta menunjukkan sisa bintang dan lokasi kue/kado. Ikuti penunjuk kecil di dekat karakter.
- Tombol musik menyalakan/mematikan BGM dan efek suara.
- Progres disimpan di browser/perangkat yang sama; tombol Mulai ulang menghapus progres setelah konfirmasi.
- Q atau tombol Call Kebab memanggil Scoopy merah untuk boncengan 5 detik, dilanjutkan cooldown 10 detik setelah turun. Bergerak lebih cepat dengan WASD/panah/D-Pad, tetap dapat mengumpulkan bintang. Debu jalan dan asap knalpot muncul di belakang motor saat bergerak lalu memudar. Durasi skill membeku saat game dijeda, dialog dibuka, atau tab tidak terlihat.
- Layout tablet dan ponsel landscape memakai D-Pad kiri, layar tengah, tombol A/B dan skill kanan. Ponsel portrait menempatkan kontrol di bawah layar; desktop mendukung keyboard.

## Mengubah aset dan ucapan

Edit `dist/config.js`. `character_sprite_path` menunjuk karakter transparan untuk selebrasi dan cadangan. `directional_sprite` menggunakan `assets/character-walk.png`: grid 4 × 4, baris depan/bawah, kiri, kanan, dan belakang/atas; kolom pertama adalah pose berhenti, keempat kolom membentuk siklus langkah 8 fps. Arah karakter mengikuti keyboard maupun D-Pad dan dipertahankan saat berhenti. Input diagonal mempertahankan arah dengan stabil, dan kaki berhenti melangkah saat gerak terhalang. Lompat mempertahankan arah, sedangkan selebrasi menghadap pemain. Bingkai sprite diratakan ke garis kaki agar pergantian frame tidak bergeser.

Untuk memakai sprite sheet animasi generik, kosongkan `directional_sprite` lalu isi `sprite_sheet` dengan `frameWidth`, `frameHeight`, `frames`, dan `fps`; baris berturut-turut adalah idle, walk, jump, celebrate_cheer. Ubah `memory_photo_path` dan `greeting` untuk foto/pesan lain.

Sumber asli berada di `dist/`. Jalankan `node bundle.cjs` setelah perubahan untuk memperbarui HTML mandiri.

## Pratinjau lokal dan hosting

Dengan Node.js: `npm start`, lalu buka http://127.0.0.1:4173. Situs ini sepenuhnya statis dan tidak memerlukan database atau server aplikasi.

GitHub: https://github.com/wanmuhtd/sero-level-22

GitHub Pages: https://wanmuhtd.github.io/sero-level-22/

Kode sumber berada di branch `codex/sero-birthday`. GitHub Pages membaca branch `codex/pages` pada direktori root. Setelah commit dan push perubahan sumber, jalankan `node deploy.cjs` untuk menerbitkan snapshot `dist/` sambil mempertahankan riwayat Pages yang bersih. GitHub Pages akan membangun situs dari perubahan tersebut. `dist/.nojekyll` menjaga penerbitan statis tanpa pemrosesan Jekyll.

## Verifikasi

`npm run check` memeriksa sintaks. `node verify.cjs` menjalankan integrasi menggunakan logika permainan sebenarnya: pemilihan empat baris sprite dan frame langkah, arah saat berhenti, input diagonal, gerak terhalang dan tombol berlawanan, rendering, gerak, lompat, jeda, tabrakan kolam/jembatan, 22 bintang unik yang dapat dijangkau, pembatasan kue/kado, ucapan, penyimpanan, baca ulang dan reset. Pemeriksaan browser dilakukan pada desktop dan ponsel 390px, termasuk HUD, pengambilan bintang, peta dan dialog foto/ucapan. Keempat tampilan arah diperiksa langsung di browser pada sesi uji terpisah. Fixture uji sudah dihapus dari rilis.

Foto kenangan berasal dari foto yang diberikan pengguna.
