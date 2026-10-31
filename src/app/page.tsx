import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="site-container landing-header-inner">
          <Link href="/" aria-label="AduAI, beranda">
            <Image
              src="/icon.png"
              alt="AduAI"
              width={78}
              height={78}
              className="landing-brand"
              priority
            />
          </Link>
          <nav aria-label="Navigasi beranda">
            <a href="#tentang">Tentang</a>
            <Link href="/laporan/lacak">Lacak laporan</Link>
            <Link href="/admin/login">Admin</Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="site-container landing-hero">
          <div className="landing-hero-copy">
            <h1>
              Ada yang perlu diperbaiki?<span>Mulai dari cerita Anda.</span>
            </h1>
            <p className="landing-lead">
              Jalan rusak, lampu padam, atau masalah di sekitar Anda. Ceritakan
              dengan nyaman, lalu susun aduan bersama asisten AduAI.
            </p>
            <div className="hero-actions">
              <Link href="/laporan/chat" className="button-primary">
                Mulai percakapan <span aria-hidden="true">→</span>
              </Link>
              <Link href="/laporan/lacak" className="button-text">
                Lacak laporan <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <div
            className="landing-conversation"
            aria-label="Contoh percakapan dengan AduAI"
          >
            <div className="landing-conversation-header">
              <span className="landing-avatar">A</span>
              <div>
                <strong>Asisten AduAI</strong>
                <small>Siap mendengarkan cerita Anda</small>
              </div>
            </div>
            <div className="landing-conversation-body">
              <p className="landing-message user-message">
                Jalan di dekat rumah saya berlubang dan berbahaya saat hujan.
              </p>
              <p className="landing-message assistant-message">
                Terima kasih sudah bercerita. Mari kita catat masalahnya
                bersama. Bisa ceritakan di mana lokasinya?
              </p>
            </div>
          </div>
        </section>
        <section id="tentang" className="landing-about">
          <div className="site-container landing-about-inner">
            <div>
              <p className="eyebrow">Tentang AduAI</p>
              <h2>Aduan dimulai dari percakapan.</h2>
            </div>
            <div>
              <p>
                AduAI membantu Anda menyampaikan masalah di lingkungan sekitar
                tanpa bingung harus memulai dari mana.
              </p>
              <p>
                Ceritakan yang terjadi, dapatkan masukan sementara, dan periksa
                kembali ringkasan sebelum aduan dikirim.
              </p>
            </div>
          </div>
        </section>
        <section className="site-container landing-cta">
          <div>
            <p className="eyebrow">Suara Anda berarti</p>
            <h2>Siap menceritakan masalah di sekitar Anda?</h2>
            <p>
              Mulai percakapan dan sampaikan hal yang perlu mendapat perhatian.
            </p>
          </div>
          <Link href="/laporan/chat" className="button-primary">
            Mulai percakapan <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
      <footer className="landing-site-footer">
        <div className="site-container">
          <span>© AduAI · Ruang pengaduan warga</span>
          <Link href="/admin/login">Ruang admin</Link>
        </div>
      </footer>
    </div>
  );
}
