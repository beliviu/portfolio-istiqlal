function hashRef(ref) {
  let hash = 0x811c9dc5;
  for (const character of ref) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

export const experience = [
  {
    ref: "GL-04",
    branch: "release/akuntansi",
    judul: "S1 Akuntansi Syariah",
    instansi: "Universitas Tazkia",
    mulai: "2026-01",
    selesai: null,
    akun: "Accounting",
    deskripsi: "Mempelajari akuntansi keuangan dan perpajakan syariah untuk kebutuhan bisnis.",
    pencapaian: ["TODO: isi pencapaian akademik 1", "TODO: isi pencapaian akademik 2", "TODO: isi pencapaian akademik 3"],
    skills: ["TODO: isi skill akuntansi 1", "TODO: isi skill akuntansi 2"],
    milestones: [
      { tahun: 2026, bulan: 3, label: "TODO: isi milestone semester awal" },
      { tahun: 2026, bulan: 9, label: "TODO: isi milestone semester berjalan" },
    ],
  },
  {
    ref: "GL-03",
    branch: "feature/indomedia",
    judul: "Management Office Website",
    instansi: "PT Indomedia Global Mandiri",
    mulai: "2025-01",
    selesai: "2026-12",
    akun: "Programming",
    deskripsi: "Memasukan data ke website dan mengelola konten perusahaan.",
    pencapaian: ["TODO: isi pencapaian pekerjaan 1", "TODO: isi pencapaian pekerjaan 2", "TODO: isi pencapaian pekerjaan 3"],
    skills: ["TODO: isi skill pekerjaan 1", "TODO: isi skill pekerjaan 2"],
    milestones: [
      { tahun: 2025, bulan: 6, label: "TODO: isi milestone pekerjaan 1" },
      { tahun: 2026, bulan: 6, label: "TODO: isi milestone pekerjaan 2" },
    ],
  },
  {
    ref: "GL-02",
    branch: "feature/organisasi",
    judul: "Sekretaris Organisasi",
    instansi: "MPPK SMKN 1 Cibinong",
    mulai: "2024-01",
    selesai: "2026-12",
    akun: "Organization",
    deskripsi: "Mempelajari dasar organisasi, kerja sama tim, dan mengurus surat persuratan organisasi.",
    pencapaian: ["TODO: isi pencapaian organisasi 1", "TODO: isi pencapaian organisasi 2", "TODO: isi pencapaian organisasi 3"],
    skills: ["TODO: isi skill organisasi 1", "TODO: isi skill organisasi 2"],
    milestones: [
      { tahun: 2024, bulan: 6, label: "TODO: isi milestone organisasi 1" },
      { tahun: 2025, bulan: 9, label: "TODO: isi milestone organisasi 2" },
    ],
  },
  {
    ref: "GL-01",
    branch: "main",
    judul: "Rekayasa Perangkat Lunak",
    instansi: "SMKN 1 Cibinong",
    mulai: "2023-01",
    selesai: "2026-12",
    akun: "Programming",
    deskripsi: "Mempelajari Dasar Pemrograman, Basis Data, Jaringan Komputer, dan Teknologi Informasi.",
    pencapaian: ["TODO: isi pencapaian sekolah 1", "TODO: isi pencapaian sekolah 2", "TODO: isi pencapaian sekolah 3"],
    skills: ["TODO: isi skill sekolah 1", "TODO: isi skill sekolah 2"],
    milestones: [
      { tahun: 2023, bulan: 6, label: "TODO: isi milestone sekolah 1" },
      { tahun: 2024, bulan: 6, label: "TODO: isi milestone sekolah 2" },
    ],
  },
].map((entry) => ({ ...entry, hash: hashRef(entry.ref) }));
