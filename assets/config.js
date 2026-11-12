// ====== PENGATURAN SITUS — ubah di sini saja ======
window.SITE = {
  namaKelas: "Digify Motion Course",
  harga: "Rp 199rb",            // GANTI: harga jual
  hargaCoret: "Rp 399rb",       // kosongkan "" kalau tidak pakai harga coret
  instagram: "digify.product",
  // Tautan pembayaran (Lynk.id / Mayar / Midtrans Payment Link / Scalev). Sementara diarahkan ke DM.
  linkBeli: "https://digify-product.myscalev.com/p/digify-motion-course",
  // Link Checkout Flow Scalev (form + metode pembayaran langsung). Ditanam di checkout.html.
  // Kosong = checkout.html memakai linkBeli (halaman produk).
  linkCheckout: "https://digify-product.myscalev.com/checkout-flow-baru",
  // Checkout kustom (Storefront API Scalev). Bila key kosong, checkout.html memakai linkCheckout di atas.
  // Key ini "publishable" (sfpk_...), memang aman di browser. Store → Storefront API → Public API Keys.
  scalevStoreId: "store_dJ0Xi7aequ9ANKgZJ5tgNtVT",
  scalevStorefrontKey: "sfpk_aM6AZa00IUboDDcC1y5pMWNffAqwq9owg88HRAz8iR5oOpQ2oBaFOj6QrXoQ3enh",
  scalevProductSlug: "digify-motion-course",
  scalevVariantId: 643898,

  // ---- Supabase (login & materi khusus pembeli) ----
  // Supabase → Project Settings → API. Dua nilai ini memang aman ditaruh di website.
  // JANGAN pernah menaruh "service_role" key di sini.
  // Kosong = mode demo lokal (email apa pun bisa masuk, materi dari assets/data.js).
  supabaseUrl: "https://swwplmkgppejrppprtjl.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3d3BsbWtncHBlanJwcHBydGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMDgyMjcsImV4cCI6MjEwOTg4NDIyN30.QNZj5gY7f7kKqUQyZbYHhI1Utw1271Rre5go5JBF7lY",

  // Link grup komunitas & zip skill sekarang disimpan di tabel "secrets" Supabase (khusus member).
  versiSkill: "v1.0.0",
  // Template email Supabase sudah memuat {{ .Token }} (SMTP Gmail aktif), jadi kolom kode ditampilkan.
  loginKode: true,
};
