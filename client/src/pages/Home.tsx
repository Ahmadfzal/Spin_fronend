import { SpinWheel } from "@/components/SpinWheel";
import { SpinHistory } from "@/components/SpinHistory";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-16 flex flex-col gap-12">
        {/* HEADER */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient bg-[length:200%_auto]">
            LUCKY SPIN
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-lg mx-auto">
            Test your luck! Spin the wheel to win amazing virtual rewards or... get ZONKED!
          </p>
        </header>

        {/* MAIN GAME AREA */}
        <main className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <SpinWheel />
        </main>

        {/* FOOTER / HISTORY */}
        <section className="pb-12">
          <SpinHistory />
        </section>
      </div>
    </div>
  );
}
