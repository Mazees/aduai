import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import LandingHeader from "@/components/LandingHeader";

export default function HomePage() {
  return (
    <div className="bg-[var(--canvas)] text-dark">
      <LandingHeader />

      <main>
        <section id="beranda" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-[73px] md:pt-[89px]">
          <Image src="/lingkungan-warga.png" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-dark/75" />
          <div className="mx-auto w-full max-w-[1200px] px-5 py-[60px] md:py-[clamp(60px,7vw,96px)]">
          <div className="min-w-0">
            <h1 className="m-0 max-w-[730px] text-[clamp(2.45rem,8vw,3.5rem)] font-bold leading-[1.1] tracking-[-.045em] text-white md:text-[clamp(3rem,4.4vw,4.5rem)] [&_em]:not-italic [&_em]:text-white">Lebih dekat dengan warga, <em>lebih jelas tindak lanjutnya.</em></h1>
            <p className="mb-[30px] mt-[26px] max-w-[520px] text-[.97rem] leading-[1.85] text-white/90 md:text-[1.05rem]">AduAI membantu pemerintah desa menerima aduan, menindaklanjutinya, dan memberi kabar kepada warga melalui satu sistem yang mudah digunakan.</p>
            <div className="flex flex-wrap items-center gap-[13px]">
              <Link href="#alur" className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[9px] bg-white px-5 py-3.5 text-sm font-semibold text-primary no-underline transition hover:-translate-y-0.5 hover:bg-white/90 motion-reduce:transition-none">Lihat cara kerja <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link href="/admin/login" className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[9px] border border-white/50 bg-transparent px-5 py-3.5 text-sm font-semibold text-white no-underline transition hover:bg-white/10">Masuk sebagai admin</Link>
            </div>
          </div>


          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-end gap-[22px] px-5 pb-[75px] pt-[75px] md:grid-cols-[minmax(0,1.55fr)_minmax(0,.65fr)] md:gap-[clamp(20px,4vw,55px)] md:pb-[clamp(75px,9vw,120px)]" aria-label="Lingkungan tempat kita tinggal">
          <div className="relative min-h-[240px] overflow-hidden rounded-[4px_48px_4px_4px] bg-[var(--surface-soft)] [&_img]:object-cover md:min-h-[390px] md:rounded-[4px_72px_4px_4px]"><Image src="/cerita-warga.png" alt="Warga beraktivitas di lingkungan permukiman yang rindang" fill sizes="(max-width: 760px) 100vw, 60vw" /></div>
          <div className="grid grid-cols-2 items-center gap-5 [&_p]:max-w-[280px] [&_p]:text-[1.05rem] [&_p]:font-semibold [&_p]:leading-[1.45] [&_p]:tracking-tight [&_p]:text-primary md:flex md:flex-col md:items-stretch md:gap-6 md:[&_p]:text-[clamp(1.15rem,1.8vw,1.5rem)]"><p>Mendengarkan warga adalah langkah awal untuk membangun desa yang lebih baik.</p><div className="relative min-h-[130px] overflow-hidden rounded-[4px_4px_4px_45px] bg-[var(--surface-soft)] [&_img]:object-cover md:min-h-[200px]"><Image src="/lingkungan-warga.png" alt="Jalan lingkungan permukiman pada pagi hari" fill sizes="(max-width: 760px) 55vw, 30vw" /></div></div>
        </section>
        <section id="tentang" className="border-y border-[var(--line)] bg-white">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-7 px-5 py-[72px] md:grid-cols-[1fr_.8fr] md:gap-[clamp(45px,9vw,140px)] md:py-[clamp(72px,8vw,110px)]">
            <div><p className="mb-6 flex items-center gap-[18px] text-[.68rem] font-bold tracking-[.1em] text-primary [&_span]:text-secondary">TENTANG ADUAI <span>01</span></p><h2 className="m-0 text-[clamp(2rem,3.2vw,3.1rem)] font-bold leading-[1.15] tracking-[-.04em] [&_em]:not-italic [&_em]:text-primary">Lebih mudah mendengar warga.<br /><em>Lebih mudah menindaklanjuti.</em></h2></div>
            <div className="text-base leading-[1.85] text-[var(--muted)] [&_a]:mt-6 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2.5 [&_a]:font-semibold [&_a]:text-primary [&_a]:no-underline [&_p+p]:mt-[15px]"><p>Setiap masukan warga membantu desa memahami apa yang perlu diperhatikan. AduAI menyediakan ruang bagi warga untuk menyampaikan masalah dan bagi perangkat desa untuk mengelola laporannya.</p><p>Asisten AI membantu warga menyusun aduan melalui percakapan. Setelah dikirim, petugas dapat meninjau laporan, memperbarui status, dan menyertakan bukti penanganan.</p><Link href="/laporan/chat">Coba percakapan warga <ArrowRight size={17} aria-hidden="true" /></Link></div>
          </div>
        </section>

        <section id="alur" className="bg-[var(--surface-soft)] py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <div className="max-w-[650px]"><p className="mb-5 text-xs font-bold tracking-[.1em] text-primary">CARA KERJA ADUAI</p><h2 className="text-[clamp(2rem,3.5vw,3.1rem)] font-bold leading-[1.15] tracking-[-.04em]">Dari suara warga hingga tindak lanjut desa.</h2><p className="mt-5 text-base leading-8 text-[var(--muted)]">Warga bisa mulai dengan bercerita. AduAI membantu merapikan aduan, kemudian petugas desa dapat menangani laporan dan memberi kabar perkembangannya.</p></div>
            <div className="mt-12 grid gap-8 border-t border-primary/20 pt-8 md:grid-cols-3 md:gap-12">
              <article><p className="text-sm font-bold text-secondary">01 / Warga bercerita</p><h3 className="mt-4 text-lg font-bold">Aduan dimulai dari percakapan</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Warga menyampaikan masalah dengan bahasa sehari-hari. Asisten mendengarkan, memberi masukan sementara, dan menanyakan detail yang diperlukan.</p></article>
              <article><p className="text-sm font-bold text-secondary">02 / Petugas menindaklanjuti</p><h3 className="mt-4 text-lg font-bold">Laporan siap ditangani</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Warga memeriksa ringkasan sebelum mengirim. Laporan yang masuk kemudian dapat ditinjau dan diperbarui statusnya oleh petugas desa.</p></article>
              <article><p className="text-sm font-bold text-secondary">03 / Warga mendapat kabar</p><h3 className="mt-4 text-lg font-bold">Perkembangan bisa diikuti</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Warga mendapat nomor tiket untuk melihat status dan bukti tindak lanjut. Pembaruan status juga dikirim melalui WhatsApp.</p></article>
            </div>
          </div>
        </section>

        <section id="fitur" className="py-[76px] md:py-[clamp(76px,9vw,124px)]">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <div className="mb-[35px] gap-10 [&>p]:mt-5 [&>p]:max-w-[370px] [&>p]:leading-[1.8] [&>p]:text-[var(--muted)] md:mb-[50px] md:flex md:items-end md:justify-between"><div><p className="mb-6 flex items-center gap-[18px] text-[.68rem] font-bold tracking-[.1em] text-primary [&_span]:text-secondary">FITUR ADUAI <span>02</span></p><h2 className="m-0 text-[clamp(2rem,3.2vw,3.1rem)] font-bold leading-[1.15] tracking-[-.04em] [&_em]:not-italic [&_em]:text-primary">Dari laporan sampai tindak lanjut,<br /><em>semuanya lebih mudah diikuti.</em></h2></div><p>Satu tempat untuk menerima cerita warga, mengelola laporan, dan menunjukkan perkembangan penanganannya.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-[clamp(40px,7vw,100px)] [&_article]:grid [&_article]:grid-cols-[42px_1fr] [&_article]:gap-[15px] [&_article]:border-t [&_article]:border-[var(--line)] [&_article]:pb-8 [&_article]:pt-7 [&_h3]:mb-2.5 [&_h3]:text-lg [&_h3]:font-bold [&_p]:max-w-[470px] [&_p]:text-[.92rem] [&_p]:leading-[1.8] [&_p]:text-[var(--muted)]">
              <article><span className="pt-1 text-xs font-bold text-secondary">01</span><div><h3>Melapor lewat percakapan</h3><p>Warga dapat bercerita dengan bahasa sehari-hari. Asisten membantu melengkapi informasi dan memberi masukan sementara yang relevan.</p></div></article>
              <article><span className="pt-1 text-xs font-bold text-secondary">02</span><div><h3>Warga memeriksa sebelum mengirim</h3><p>Warga dapat membaca dan memperbaiki ringkasan aduan sebelum menyetujuinya. Petugas menerima laporan yang lebih mudah dipahami.</p></div></article>
              <article><span className="pt-1 text-xs font-bold text-secondary">03</span><div><h3>Penanganan yang bisa dipantau</h3><p>Petugas memperbarui status dengan menyertakan bukti. Warga dapat melihat status dan riwayat penanganan menggunakan nomor tiket.</p></div></article>
              <article><span className="pt-1 text-xs font-bold text-secondary">04</span><div><h3>Kabar langsung ke WhatsApp</h3><p>Setiap pembaruan status dikirim ke WhatsApp pelapor, bersama tautan untuk melihat bukti tindak lanjut dari petugas.</p></div></article>
              <article><span className="pt-1 text-xs font-bold text-secondary">05</span><div><h3>Tanpa akun untuk melapor</h3><p>Warga dapat melapor dan melacak status tanpa membuat akun. Nomor WhatsApp digunakan untuk mengirim kabar dan tidak ditampilkan kepada admin.</p></div></article>
              <article><span className="pt-1 text-xs font-bold text-secondary">06</span><div><h3>Terus belajar mendengarkan</h3><p>Asisten dapat mencari informasi layanan dari pengetahuan yang tersedia. Setelah laporan dibuat, ia juga meninjau cara merespons agar bisa berkomunikasi lebih baik.</p></div></article>
            </div>
          </div>
        </section>
        <section id="tindak-lanjut" className="border-y border-[var(--line)] bg-white py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 md:grid-cols-[.9fr_1fr] md:items-center md:gap-20">
            <div className="relative min-h-[260px] overflow-hidden rounded-[4px_60px_4px_4px] md:min-h-[390px]"><Image src="/cerita-warga.png" alt="Warga beraktivitas di lingkungan tempat tinggal" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>
            <div><p className="mb-5 text-xs font-bold tracking-[.1em] text-primary">SETELAH LAPORAN DIKIRIM</p><h2 className="text-[clamp(2rem,3.2vw,3rem)] font-bold leading-[1.15] tracking-[-.04em]">Tunjukkan perkembangan penanganan kepada warga.</h2><p className="mt-5 text-base leading-8 text-[var(--muted)]">Melalui nomor tiket, warga dapat melihat status dan riwayat penanganan. Setiap perubahan status disertai bukti yang diunggah oleh petugas desa.</p><p className="mt-4 text-base leading-8 text-[var(--muted)]">Ketika status berubah, warga mendapat kabar melalui WhatsApp beserta tautan bukti. Warga tidak perlu menyebutkan nama untuk membuat aduan, dan nomor WhatsApp pelapor tidak ditampilkan kepada admin.</p><Link href="/laporan/lacak" className="mt-7 inline-flex items-center gap-2 font-semibold text-primary hover:underline">Lihat halaman pelacakan <ArrowRight size={17} aria-hidden="true" /></Link></div>
          </div>
        </section>

        <section id="mulai" className="mx-auto flex w-full max-w-[1200px] items-end justify-between gap-5 border-t border-[var(--line)] px-5 pb-[95px] pt-[76px] [&_div>p:last-child]:mt-[18px] [&_div>p:last-child]:text-[var(--muted)]">
          <div><p className="mb-6 flex items-center gap-[18px] text-[.68rem] font-bold tracking-[.1em] text-primary [&_span]:text-secondary">MARI MULAI <span>03</span></p><h2 className="m-0 text-[clamp(2rem,3.2vw,3.1rem)] font-bold leading-[1.15] tracking-[-.04em] [&_em]:not-italic [&_em]:text-primary">Ingin melihat cara AduAI bekerja untuk desa?</h2><p>Coba langsung pengalaman warga saat menyampaikan aduan.</p></div>
          <Link href="/laporan/chat" className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-primary text-white transition hover:translate-x-1 hover:bg-dark motion-reduce:transition-none md:h-16 md:w-16" aria-label="Coba percakapan warga"><ArrowRight size={26} aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className="bg-dark text-xs text-white/80 [&>div]:flex [&>div]:justify-between [&>div]:gap-5 [&>div]:py-[26px] [&_a]:text-white"><div className="mx-auto w-full max-w-[1200px] px-5"><span>© AduAI · Sistem pengaduan untuk desa</span><Link href="/admin/login">Ruang admin</Link></div></footer>
    </div>
  );
}
