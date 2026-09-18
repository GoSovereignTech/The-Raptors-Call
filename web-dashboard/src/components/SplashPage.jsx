// src/components/SplashPage.jsx
// The landing / education page shown before the map.
// Mobile-first, scrollable, animated.

import { useState } from 'react';
import {
  Shield, Users, Zap, AlertTriangle, Radio, MapPin, Lock,
  Bell, ExternalLink, CheckCircle2, ArrowRight, Github
} from 'lucide-react';
import { STATS, LOADOUTS, MORE_LOADOUTS } from '../lib/stats.js';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import RaptorMark from './RaptorMark.jsx';

// ─── Scroll-animated wrapper ───
function Reveal({ children, delay = 0 }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Individual section ───
function Section({ id, children, className = '' }) {
  return (
    <section
      id={id}
      className={`min-h-[80vh] flex flex-col justify-center px-5 py-14 sm:px-8 ${className}`}
    >
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </section>
  );
}

export default function SplashPage({ onEnterPrecise, onEnterDemo }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosConfirmed, setTosConfirmed] = useState(false);
  const canProceed = ageConfirmed && tosConfirmed;

  return (
    <div className="min-h-screen bg-raptor-void text-slate-100 overflow-x-hidden">
      {/* ─── SECTION 1: HERO ─── */}
      <Section id="hero">
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <RaptorMark className="h-10 w-10" />
            <div>
              <div className="text-sm font-bold tracking-[0.25em] text-slate-200">
                THE RAPTOR'S CALL
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-raptor-cyan">
                Off-Grid Community Defense
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="text-3xl font-black leading-tight text-slate-50 sm:text-5xl">
            <span className="text-rose-400">ATTACKED?</span>{' '}
            <span className="text-rose-400">SCARED?</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
              PRESS THE BUTTON.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-5 text-base text-slate-300 sm:text-lg">
            Help arrives in seconds — no cell service required.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-raptor-line bg-raptor-bg2 px-3 py-1 text-slate-400">
              Works offline
            </span>
            <span className="rounded-full border border-raptor-line bg-raptor-bg2 px-3 py-1 text-slate-400">
              No monthly fees
            </span>
            <span className="rounded-full border border-raptor-line bg-raptor-bg2 px-3 py-1 text-slate-400">
              No data sold
            </span>
            <span className="rounded-full border border-raptor-line bg-raptor-bg2 px-3 py-1 text-slate-400">
              Vetted community
            </span>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
            <ArrowRight className="h-3 w-3" />
            <span>Scroll to see why this matters</span>
          </div>
        </Reveal>
      </Section>

      {/* ─── SECTION 2: THE REALITY ─── */}
      <Section id="reality" className="bg-raptor-bg/30">
        <Reveal>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-rose-400">
            The Reality
          </div>
          <h2 className="mb-8 text-2xl font-bold text-slate-50 sm:text-3xl">
            Every year, in America:
          </h2>
        </Reveal>

        <div className="space-y-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.id} delay={i * 100}>
              <div className="rounded-xl border border-raptor-line bg-raptor-bg2/60 p-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-black text-amber-400 sm:text-3xl">
                    {stat.number}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">{stat.label}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      Source:{' '}
                      {stat.sourceUrl ? (
                        <a
                          href={stat.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-raptor-cyan underline underline-offset-2"
                        >
                          {stat.source}
                        </a>
                      ) : (
                        stat.source
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={500}>
          <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
              <p className="text-sm text-amber-100">
                In nearly every case, the victim was <strong>alone</strong>. No witness.
                No camera. No ally within reach.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ─── SECTION 3: WHAT THIS IS ─── */}
      <Section id="what-is-this">
        <Reveal>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-raptor-cyan">
            What This Is
          </div>
          <h2 className="mb-6 text-2xl font-bold text-slate-50 sm:text-3xl">
            It's not vs. Instagram.
            <br />
            <span className="text-raptor-cyan">It runs alongside everything else.</span>
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <p className="text-base text-slate-300">
            You install it once. It sits in the background like your weather app. It
            doesn't interrupt you. It doesn't sell your data. It doesn't advertise.
          </p>
        </Reveal>

        <Reveal delay={250}>
          <p className="mt-4 text-base text-slate-300">
            It just watches for danger. And when something happens, it tells you —
            and your team.
          </p>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Shield, title: 'See them first', body: 'Detect people before they see you' },
              { icon: Users, title: 'Team awareness', body: 'Your team sees what you see' },
              { icon: Bell, title: 'Instant alerts', body: 'One button — everyone knows' },
              { icon: Lock, title: 'Your data is yours', body: 'No subscriptions, no tracking' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-raptor-line bg-raptor-bg2/60 p-4"
              >
                <item.icon className="mb-2 h-5 w-5 text-raptor-cyan" />
                <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                <div className="mt-0.5 text-xs text-slate-400">{item.body}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ─── SECTION 4: HOW IT WORKS ─── */}
      <Section id="how-it-works" className="bg-raptor-bg/30">
        <Reveal>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-raptor-cyan">
            How It Works
          </div>
          <h2 className="mb-8 text-2xl font-bold text-slate-50 sm:text-3xl">
            Three things, working together.
          </h2>
        </Reveal>

        <div className="space-y-6">
          {[
            {
              n: '01',
              title: 'Detect',
              body: 'Sensor nodes and your phone see people through walls, foliage, and darkness — before they see you.',
            },
            {
              n: '02',
              title: 'Connect',
              body: 'Everyone vetted in your community is on the same private mesh. Encrypted. Off-grid. No cellular towers.',
            },
            {
              n: '03',
              title: 'Respond',
              body: 'One person presses the button. Everyone sees the location. Everyone comes.',
            },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 150}>
              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-raptor-cyan/50 bg-raptor-cyan/10 text-sm font-bold text-raptor-cyan">
                  {step.n}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-100">{step.title}</div>
                  <p className="mt-1 text-sm text-slate-400">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─── SECTION 5: PRIVACY & TRUST ─── */}
      <Section id="privacy">
        <Reveal>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
            Privacy & Trust
          </div>
          <h2 className="mb-6 text-2xl font-bold text-slate-50 sm:text-3xl">
            Here's exactly how your location is handled.
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <div className="space-y-3">
            {[
              {
                icon: CheckCircle2,
                color: 'text-emerald-400',
                title: 'Only vetted members see you',
                body: 'Before anyone can see your location on their map, they go through an in-person verification and background check. Known abusers are refused.',
              },
              {
                icon: Lock,
                color: 'text-raptor-cyan',
                title: 'No names attached to dots',
                body: 'Your map presence is an anonymous ID, not your name. Nobody knows who is who except by your own choice to reveal.',
              },
              {
                icon: Users,
                color: 'text-amber-400',
                title: 'You see them too',
                body: 'Visibility is reciprocal. If you can see a teammate, they can see you. There is no one-way surveillance.',
              },
              {
                icon: Shield,
                color: 'text-emerald-400',
                title: 'No company, no algorithm',
                body: 'This is not a product. There is no central server watching you. Your data stays on your device and inside the community.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-raptor-line bg-raptor-bg2/60 p-4"
              >
                <item.icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${item.color}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                  <p className="mt-1 text-xs text-slate-400">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-6 rounded-xl border border-raptor-line bg-raptor-bg2/60 p-4 text-xs text-slate-400">
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-raptor-cyan underline underline-offset-2"
            >
              Read the full privacy policy <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Reveal>
      </Section>

      {/* ─── SECTION 6: LOADOUTS ─── */}
      <Section id="loadouts" className="bg-raptor-bg/30">
        <Reveal>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-raptor-cyan">
            Choose Your Loadout
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-50 sm:text-3xl">
            The dashboard is free.
          </h2>
          <p className="mb-8 text-sm text-slate-400">
            The loadouts are what make it work in the real world — detection, alerts,
            and full mesh coverage.
          </p>
        </Reveal>

        <div className="space-y-4">
          {LOADOUTS.map((lo, i) => (
            <Reveal key={lo.id} delay={i * 150}>
              <a
                href={lo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-raptor-line bg-raptor-bg2/60 p-5 transition-all hover:border-raptor-cyan/50 hover:bg-raptor-bg2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-raptor-cyan">
                      Loadout #{lo.id}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-100">
                      {lo.name}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{lo.tagline}</p>
                    <ul className="mt-3 space-y-1">
                      {lo.benefits.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-amber-400">
                      {lo.priceLabel}
                    </div>
                    <div className="text-[10px] text-slate-500">and up</div>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={600}>
          <div className="mt-6 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              Also available
            </div>
            {MORE_LOADOUTS.map((lo) => (
              <a
                key={lo.id}
                href={lo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-raptor-line bg-raptor-bg2/40 px-4 py-2 text-xs text-slate-300 hover:border-raptor-cyan/50"
              >
                <span>{lo.name}</span>
                <span className="font-bold text-amber-400">{lo.priceLabel}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ─── SECTION 7: NOTIFICATIONS ─── */}
      <Section id="notifications">
        <Reveal>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-raptor-cyan">
            Notifications
          </div>
          <h2 className="mb-6 text-2xl font-bold text-slate-50 sm:text-3xl">
            It works even when the app is closed.
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <p className="text-base text-slate-300">
            You don't have to watch the screen all day. The app runs in the background.
            It sends you a notification when it matters.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-6 space-y-3">
            {[
              { title: 'Someone coming through the trees', body: 'Friend or stranger? Confirm with one tap.' },
              { title: 'You stopped walking and started driving', body: 'Expected, or do you need help?' },
              { title: 'A teammate pressed the alarm', body: 'See their position and go.' },
              { title: 'You pressed the alarm', body: 'Your entire team gets the alert.' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-raptor-line bg-raptor-bg2/60 p-4"
              >
                <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-raptor-cyan" />
                <div>
                  <div className="text-sm font-medium text-slate-100">{item.title}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-6 rounded-xl border border-raptor-line bg-raptor-bg2/40 p-4 text-xs text-slate-400">
            <strong className="text-slate-200">Browser support:</strong> Currently
            optimized for <strong>Chrome on Android</strong>. For full feature parity
            (background operation, hardened storage), a Google Pixel with GrapheneOS is
            available in the Full System loadout.
          </div>
        </Reveal>
      </Section>

      {/* ─── SECTION 8: THE MOVEMENT ─── */}
      <Section id="movement" className="bg-raptor-bg/30">
        <Reveal>
          <h2 className="text-2xl font-black leading-tight text-slate-50 sm:text-4xl">
            It's that simple.
            <br />
            <span className="text-raptor-cyan">A community safety system.</span>
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 text-lg text-slate-300">
            Let's end our statistics of missing persons, lynchings, and hate crimes.
          </p>
        </Reveal>

        <Reveal delay={350}>
          <p className="mt-3 text-xl font-bold text-amber-400">
            See the enemy before they can see you.
          </p>
        </Reveal>
      </Section>

      {/* ─── SECTION 9: ENTER APP ─── */}
      <Section id="enter">
        <Reveal>
          <h2 className="mb-4 text-2xl font-bold text-slate-50 sm:text-3xl">
            Ready to see it?
          </h2>
        </Reveal>

        {/* Age + ToS gating */}
        <Reveal delay={150}>
          <div className="space-y-3 rounded-xl border border-raptor-line bg-raptor-bg2/60 p-4">
            <label className="flex items-start gap-3 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-raptor-cyan"
              />
              <span>
                I confirm I am <strong>13 years or older</strong>. Users under 18
                require parental consent.
              </span>
            </label>
            <label className="flex items-start gap-3 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={tosConfirmed}
                onChange={(e) => setTosConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-raptor-cyan"
              />
              <span>
                I have read and agree to the{' '}
                <a
                  href="/privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-raptor-cyan underline underline-offset-2"
                >
                  privacy policy
                </a>{' '}
                and understand that my location will be visible to vetted members
                of my community.
              </span>
            </label>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <button
            disabled={!canProceed}
            onClick={onEnterPrecise}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-raptor-cyan to-raptor-blue px-6 py-4 text-sm font-bold text-raptor-void shadow-raptor-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
          >
            <MapPin className="h-4 w-4" />
            Enter with precise location
          </button>
        </Reveal>

        <Reveal delay={400}>
          <button
            disabled={!canProceed}
            onClick={onEnterDemo}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-raptor-line bg-raptor-bg2 px-6 py-4 text-sm font-medium text-slate-300 transition hover:border-raptor-cyan/50 hover:text-raptor-cyan disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Zap className="h-4 w-4" />
            Try Demo Mode (no location shared)
          </button>
        </Reveal>

        <Reveal delay={500}>
          <p className="mt-4 text-center text-[10px] text-slate-500">
            Demo Mode uses a static map. No GPS is requested.
          </p>
        </Reveal>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-raptor-line bg-raptor-void px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <RaptorMark className="h-6 w-6" />
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                The Raptor's Call
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-raptor-cyan"
              >
                Privacy
              </a>
              <a
                href="/affiliate.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-raptor-cyan"
              >
                Become an Affiliate
              </a>
              <a
                href="mailto:DrSutherlandMD@proton.me"
                className="text-slate-400 hover:text-raptor-cyan"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-[10px] text-slate-600">
            <span>Chrome on Android recommended</span>
            <span>•</span>
            <span>No data sold</span>
            <span>•</span>
            <span>No subscription fees</span>
          </div>
        </div>
      </footer>
    </div>
  );
}