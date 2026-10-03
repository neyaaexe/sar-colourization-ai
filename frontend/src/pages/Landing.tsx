import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'none' | 'login' | 'signup';

export const Landing: React.FC = () => {
  const { loginDemo } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('none');

  // =========================
  // AUTH PAGES
  // =========================
  if (authMode !== 'none') {
    return (
      <div className="min-h-screen bg-[#F5F6F1]">
        <div className="min-h-screen grid lg:grid-cols-2">

          {/* LEFT PANEL */}
          <section className="hidden lg:flex bg-[#123D2D] text-white p-12 xl:p-16 flex-col justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#E5B94A] flex items-center justify-center">
                  <span className="text-[#123D2D] text-xl font-bold">
                    S
                  </span>
                </div>

                <div>
                  <p className="text-lg font-semibold">
                    SAR Analysis
                  </p>

                  <p className="text-sm text-white/60">
                    Earth observation workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-lg">
              <p className="text-sm font-semibold tracking-[0.18em] uppercase text-[#E5B94A] mb-5">
                Earth observation
              </p>

              <h2 className="text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight">
                See more in
                <br />
                every radar image.
              </h2>

              <p className="mt-7 text-lg leading-8 text-white/70 max-w-md">
                Analyse SAR imagery through colourization,
                terrain classification, and image statistics.
              </p>

              <div className="mt-12 max-w-md rounded-2xl bg-[#1B503D] border border-white/10 p-6">
                <p className="text-xs uppercase tracking-[0.15em] text-white/45">
                  Analysis pipeline
                </p>

                <div className="mt-4 flex items-center gap-3 text-sm text-white/85">
                  <span>SAR</span>
                  <span className="text-white/30">→</span>
                  <span>Optical</span>
                  <span className="text-white/30">→</span>
                  <span>Terrain</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-white/40">
              SAR image analysis · 2026
            </p>

          </section>

          {/* RIGHT PANEL */}
          <main className="min-h-screen flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">

            <div className="w-full max-w-[500px]">

              {/* Mobile branding */}
              <div className="lg:hidden mb-10">
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-[#123D2D] flex items-center justify-center">
                    <span className="text-[#E5B94A] font-bold">
                      S
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold text-lg text-[#123D2D]">
                      SAR Analysis
                    </p>

                    <p className="text-sm text-[#718078]">
                      Earth observation workspace
                    </p>
                  </div>

                </div>
              </div>

              {/* BACK TO OVERVIEW */}
              <button
                type="button"
                onClick={() => setAuthMode('none')}
                className="mb-12 text-sm text-[#587067] hover:text-[#123D2D] transition-colors"
              >
                ← Back to overview
              </button>

              {authMode === 'login' ? (
                <LoginForm
                  onSwitchToSignup={() => setAuthMode('signup')}
                  onExploreDemo={loginDemo}
                />
              ) : (
                <SignupForm
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}

            </div>

          </main>

        </div>
      </div>
    );
  }

  // =========================
  // OVERVIEW PAGE
  // =========================
  return (
    <div className="min-h-screen bg-[#F5F6F1] text-[#123D2D]">

      {/* HEADER */}
      <header className="border-b border-[#DCE3DD]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-6">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-[#123D2D] flex items-center justify-center">
                <span className="text-[#E5B94A] text-xl font-bold">
                  S
                </span>
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight">
                  SAR Analysis
                </p>

                <p className="text-sm text-[#718078]">
                  Earth observation workspace
                </p>
              </div>

            </div>

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="px-5 py-2.5 text-sm font-semibold text-[#176B4B] hover:text-[#0F5239]"
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="px-5 py-2.5 rounded-lg bg-[#176B4B] hover:bg-[#12583E] text-white text-sm font-semibold"
              >
                Create account
              </button>

            </div>

          </div>

        </div>
      </header>


      {/* HERO */}
      <main>

        <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">

          <div className="min-h-[calc(100vh-95px)] grid lg:grid-cols-2 gap-16 items-center">

            {/* HERO TEXT */}
            <div className="py-20 lg:py-24">

              <p className="text-sm font-semibold tracking-[0.18em] uppercase text-[#18704F] mb-6">
                SAR image analysis
              </p>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.02] text-[#123D2D]">
                Turn radar imagery
                <br />
                into something
                <br />
                you can see.
              </h1>

              <p className="mt-8 text-lg sm:text-xl leading-8 text-[#718078] max-w-xl">
                Upload a SAR image, generate a colourized optical
                view, and analyse the terrain captured in the scene.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">

                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="px-7 py-4 rounded-xl bg-[#176B4B] hover:bg-[#12583E] text-white font-semibold"
                >
                  Get started
                  <span className="ml-2">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="px-7 py-4 rounded-xl border border-[#CBD7D0] bg-white hover:border-[#176B4B] text-[#176B4B] font-semibold"
                >
                  Sign in
                </button>

              </div>

              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#718078]">
                <span>✓ SAR-to-optical translation</span>
                <span>✓ Terrain classification</span>
                <span>✓ Image statistics</span>
              </div>

            </div>


            {/* RIGHT VISUAL */}
            <div className="hidden lg:block">

              <div className="h-[500px] rounded-[28px] bg-[#123D2D] overflow-hidden shadow-[0_24px_70px_rgba(18,61,45,0.18)] p-8 flex flex-col justify-between">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                      Analysis workspace
                    </p>

                    <p className="mt-2 text-lg font-medium text-white">
                      From radar to insight
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center">
                    <span className="text-[#E5B94A] text-xl">
                      +
                    </span>
                  </div>

                </div>


                {/* Radar illustration */}
                <div className="flex items-center justify-center">

                  <div className="relative w-[300px] h-[300px] rounded-full border border-white/10">

                    <div className="absolute inset-[40px] rounded-full border border-white/10" />

                    <div className="absolute inset-[80px] rounded-full border border-white/10" />

                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />

                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />

                    <div className="absolute left-[65%] top-[30%] w-3 h-3 rounded-full bg-[#E5B94A]" />

                    <div className="absolute left-[25%] top-[65%] w-2 h-2 rounded-full bg-white/60" />

                  </div>

                </div>


                <div className="rounded-2xl bg-white/10 border border-white/10 p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-white/45">
                    Processing pipeline
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-sm text-white/85">
                    <span>SAR</span>
                    <span className="text-white/30">→</span>
                    <span>Optical</span>
                    <span className="text-white/30">→</span>
                    <span>Terrain</span>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* FEATURES */}
        <section className="border-t border-[#DCE3DD] bg-white">

          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-20">

            <div className="max-w-2xl">

              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#18704F]">
                What happens next
              </p>

              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#123D2D]">
                One image. Three useful views.
              </h2>

            </div>


            <div className="mt-12 grid md:grid-cols-3 gap-6">

              <div className="rounded-2xl border border-[#DCE3DD] bg-[#F8F9F6] p-7">

                <div className="w-10 h-10 rounded-lg bg-[#DDEDE5] text-[#176B4B] flex items-center justify-center font-semibold">
                  01
                </div>

                <h3 className="mt-6 text-xl font-semibold text-[#123D2D]">
                  Optical translation
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#718078]">
                  Generate a colourized optical representation
                  from your uploaded SAR image.
                </p>

              </div>


              <div className="rounded-2xl border border-[#DCE3DD] bg-[#F8F9F6] p-7">

                <div className="w-10 h-10 rounded-lg bg-[#EDE8D2] text-[#7D6820] flex items-center justify-center font-semibold">
                  02
                </div>

                <h3 className="mt-6 text-xl font-semibold text-[#123D2D]">
                  Terrain analysis
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#718078]">
                  Classify the scene and identify the terrain
                  represented in the generated image.
                </p>

              </div>


              <div className="rounded-2xl border border-[#DCE3DD] bg-[#F8F9F6] p-7">

                <div className="w-10 h-10 rounded-lg bg-[#E5E8DF] text-[#45604F] flex items-center justify-center font-semibold">
                  03
                </div>

                <h3 className="mt-6 text-xl font-semibold text-[#123D2D]">
                  Image statistics
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#718078]">
                  Review useful image measurements and statistics
                  from the processed result.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="border-t border-[#DCE3DD]">

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">

          <p className="text-sm text-[#87938C]">
            SAR Analysis Workspace
          </p>

          <p className="text-sm text-[#87938C]">
            Earth observation · SAR imagery
          </p>

        </div>

      </footer>

    </div>
  );
};

export default Landing;