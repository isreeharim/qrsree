import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, ArrowRight, RefreshCw, BarChart3, Shield, Users, MapPin, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Cursor-reactive QR Grid Canvas Background ──────────────────────── */
function QRInteractiveBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = canvas.width = parent.scrollWidth || window.innerWidth;
        height = canvas.height = parent.scrollHeight || window.innerHeight;
      }
    };

    updateSize();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', updateSize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const cellSize = 32;
    const dotSize = 3;
    const finders = [];
    const numFinders = 16;

    for (let i = 0; i < numFinders; i++) {
      finders.push({
        x: Math.random() * (window.innerWidth - 100) + 50,
        y: Math.random() * (window.innerHeight * 2.5 - 100) + 50,
        size: 28,
        rotation: Math.random() * Math.PI * 2,
        speed: (Math.random() - 0.5) * 0.003,
      });
    }

    const drawFinderPattern = (ctx, x, y, size, opacity, glowColor) => {
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = opacity;
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
      const innerSize = size * 0.45;
      ctx.fillStyle = glowColor;
      ctx.fillRect(x - innerSize / 2, y - innerSize / 2, innerSize, innerSize);
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * cellSize + cellSize / 2;
          const y = r * cellSize + cellSize / 2;

          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let currentSize = dotSize;
          let opacity = 0.04;
          let color = 'rgba(20, 250, 200, ';

          if (mouse.active && dist < 180) {
            const factor = 1 - dist / 180;
            opacity = 0.04 + factor * 0.5;
            currentSize = dotSize + factor * 4.5;
            const isSky = (c + r) % 2 === 0;
            color = isSky ? 'rgba(56, 189, 248, ' : 'rgba(20, 250, 200, ';
          }

          ctx.fillStyle = color + opacity + ')';
          ctx.fillRect(x - currentSize / 2, y - currentSize / 2, currentSize, currentSize);
        }
      }

      finders.forEach((finder) => {
        finder.rotation += finder.speed;

        if (finder.x > width) finder.x = Math.random() * width;
        if (finder.y > height) finder.y = Math.random() * height;

        const dx = finder.x - mouse.x;
        const dy = finder.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let opacity = 0.08;
        let glowColor = 'rgb(20, 250, 200)';

        if (mouse.active && dist < 220) {
          const factor = 1 - dist / 220;
          opacity = 0.08 + factor * 0.6;
          glowColor = `rgb(20, ${Math.floor(210 + factor * 45)}, ${Math.floor(210 + factor * 45)})`;
        }

        ctx.save();
        ctx.translate(finder.x, finder.y);
        ctx.rotate(finder.rotation);
        drawFinderPattern(ctx, 0, 0, finder.size, opacity, glowColor);
        ctx.restore();
      });

      if (mouse.active) {
        ctx.save();
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 20, mouse.x, mouse.y, 200);
        gradient.addColorStop(0, 'rgba(20, 250, 200, 0.08)');
        gradient.addColorStop(1, 'rgba(20, 250, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

/* ─── Cursor-aware QR mockup card ─────────────────────────────────────── */
function QRHeroCard() {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50, visible: false });

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // tilt max ±12deg
    const tiltX = -(dy / (rect.height / 2)) * 12;
    const tiltY = (dx / (rect.width / 2)) * 12;
    // spotlight position as %
    const glowX = ((e.clientX - rect.left) / rect.width) * 100;
    const glowY = ((e.clientY - rect.top) / rect.height) * 100;
    setTilt({ x: tiltX, y: tiltY });
    setGlow({ x: glowX, y: glowY, visible: true });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlow((g) => ({ ...g, visible: false }));
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: glow.visible ? 'transform 0.08s linear' : 'transform 0.45s ease',
      }}
      className="relative w-72 sm:w-80 h-[450px] rounded-[40px] cursor-none select-none"
    >
      <div
        className="absolute inset-0 rounded-[40px] pointer-events-none z-20 transition-opacity duration-300"
        style={{
          opacity: glow.visible ? 1 : 0,
          background: `radial-gradient(200px circle at ${glow.x}% ${glow.y}%, rgba(20,250,200,0.18) 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-[40px] pointer-events-none z-20 transition-opacity duration-300"
        style={{
          opacity: glow.visible ? 1 : 0,
          boxShadow: `0 0 0 1.5px rgba(20,250,200,0.35), 0 0 40px 4px rgba(20,250,200,0.12)`,
        }}
      />

      {glow.visible && (
        <div
          className="absolute z-30 pointer-events-none w-5 h-5 rounded-full border-2 border-teal-400/80 bg-teal-400/20 backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 transition-none"
          style={{ left: `${glow.x}%`, top: `${glow.y}%` }}
        />
      )}

      <div className="absolute inset-0 rounded-[40px] border-4 border-navy-700 bg-navy-900 p-3 shadow-2xl overflow-hidden z-10">
        <div className="absolute top-0 inset-x-0 h-6 bg-navy-900 flex justify-center items-center z-10">
          <div className="w-20 h-4 bg-navy-950 rounded-full" />
        </div>

        <div className="h-full rounded-[30px] bg-navy-950 border border-navy-800 p-5 pt-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Dynamic QR</span>
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            </div>

            <div className="bg-navy-900/80 border border-navy-800 rounded-2xl p-4 flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-xl relative overflow-hidden transition-shadow">
                <div className="grid grid-cols-7 gap-[2.5px] h-28 w-28">
                  {[
                    1,1,1,0,1,1,1,
                    1,0,1,0,1,0,1,
                    1,1,1,0,1,1,1,
                    0,0,0,0,0,1,0,
                    1,0,1,1,0,0,1,
                    0,1,0,1,1,0,0,
                    1,1,0,0,1,1,1,
                  ].map((filled, i) => (
                    <span
                      key={i}
                      className={`rounded-[1.5px] ${filled ? 'bg-navy-950' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200"
                  style={{
                    opacity: glow.visible ? 0.7 : 0,
                    background: `radial-gradient(80px circle at ${glow.x}% ${glow.y}%, rgba(20,250,200,0.15) 0%, transparent 80%)`,
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-mono text-teal-400">/q/xY8zT2</p>
                <p className="text-xs text-slate-400 mt-1">Printed on poster</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-slate-400">Current Destination:</div>
            <div className="bg-navy-900 border border-navy-800 rounded-xl p-3 text-xs font-mono truncate text-sky-400">
              https://qr.sreeharim.site/
            </div>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 text-[10px] text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full animate-bounce">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Redirects Instantly
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Home page ────────────────────────────────────────────────────── */
export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-navy-950 text-white font-sans overflow-x-hidden relative">
      {/* Interactive Cursor-Following QR Grid Background */}
      <QRInteractiveBackground />

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-navy-800 bg-navy-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrLogoMark />
            <span className="font-display font-semibold text-white text-lg tracking-tight">
              QR Manager
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-teal-400 active:scale-95 transition-all shadow-glow"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-navy-950 hover:bg-teal-400 active:scale-95 transition-all shadow-glow"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 sm:pt-32 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-400">
              <Zap className="h-3 w-3 fill-current" />
              Next-Gen Dynamic QR Codes
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Print Once. <br />
              <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">
                Redirect Anywhere,
              </span>{' '}
              Anytime.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
              Never re-print a QR code again. Change the destination link of your printed QR codes dynamically on the fly, track scan analytics, and capture exact user geolocation.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-semibold text-navy-950 hover:bg-teal-400 active:scale-95 transition-all shadow-glow"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-900/60 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white hover:border-navy-600 transition-all"
                >
                  Live Demo Sign In
                </Link>
              )}
            </div>
          </div>

          {/* ← Cursor-overlay QR hero card */}
          <div className="lg:col-span-5 flex justify-center animate-fade-in">
            <QRHeroCard />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-navy-900/40 border-y border-navy-800/60 py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered with High-Performance Features
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Manage your company campaigns, product packages, and departments inside a single unified dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-6 space-y-4 hover:border-teal-500/30 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Dynamic Redirects</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Update destination links instantly at any time. The QR image on posters, flyers, or labels remains identical and active forever.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-6 space-y-4 hover:border-sky-500/30 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Geo-Scan Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Record exact country, region, and city values via IP mapping instantly. Ask for GPS permission to lock down coordinates.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-6 space-y-4 hover:border-purple-500/30 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-User Collaboration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Role management built-in. Grant your departments dedicated workspace portals to separate project codes seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 sm:py-28 max-w-4xl mx-auto text-center px-4 space-y-6">
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Ready to streamline your campaign codes?
        </h2>
        <p className="text-slate-300 text-sm sm:text-lg max-w-xl mx-auto">
          Start generating dynamic QR codes, organizing by departments, and viewing location logs in minutes.
        </p>
        <div className="pt-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-sm font-semibold text-navy-950 hover:bg-teal-400 active:scale-95 transition-all shadow-glow"
          >
            Create Your Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-10 bg-navy-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center gap-2.5">
            <QrLogoMark />
            <span className="font-display font-semibold text-slate-400 tracking-tight">
              QR Manager
            </span>
          </div>
          <p>© {new Date().getFullYear()} QR Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function QrLogoMark() {
  const cells = [1, 0, 1, 0, 1, 1, 1, 0, 1];
  return (
    <div className="grid grid-cols-3 gap-[2px] h-6 w-6 flex-shrink-0">
      {cells.map((filled, i) => (
        <span
          key={i}
          className={`rounded-[1px] ${filled ? 'bg-teal-500' : 'bg-transparent'}`}
        />
      ))}
    </div>
  );
}
