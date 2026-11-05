// src/components/SplashPage.jsx
import { useState } from 'react';
import { Shield, Zap, MapPin, CheckCircle2, ChevronRight, Lock, Users } from 'lucide-react';
import RaptorMark from './RaptorMark.jsx';

import './../styles/themes.css';
// --- TARGET AUDIENCE DATA ---
const AUDIENCES = {
  greek: {
    label: '🎓 Sororities & Fraternities',
    headline: 'Walk home together. Even when you are alone.',
    pitch: 'Campus life is unpredictable. Whether it’s a late-night walk from the library or a party off-campus, The Raptor’s Call ensures your brothers and sisters see the moment you are in danger. No cell service? No problem.',
    image: '/explainerImages/visuals/frats-and-soros.jpeg',
    stat: '1 in 3 women experience assault. Never walk alone again.'
  },
  community: {
    label: '🏘️ Community Defense Groups',
    headline: 'Organize your neighborhood. Before the police arrive.',
    pitch: '911 is reactive. We are proactive. Build a private, encrypted mesh network with your vetted neighbors. When a threat is detected or an alarm is pulled, you are not waiting for strangers—you are activating your own rescue team.',
    image: '/explainerImages/visuals/celebrate-1.jpeg',
    stat: '600,000+ people go missing in the US every year.'
  },
  leaders: {
    label: '⛪ Community Leaders',
    headline: 'Protect your flock. Coordinate your safety team.',
    pitch: 'You care for your congregation or organization. Don’t just hope they get home safe—know it. Equip your most vulnerable members with disguised alarms and give your security team a real-time tactical map.',
    image: '/explainerImages/stop-the-lynchings.dxfz.jpeg',
    stat: 'Ensure every member is seen and heard, even off-grid.'
  },
  gunclub: {
    label: '🎯 Gun Clubs & Enthusiasts',
    headline: 'Situational awareness is your best weapon.',
    pitch: 'You are trained for the fight, but you cannot shoot what you cannot see. Extend your perimeter with 24GHz radar and thermal sensors. See threats through walls and foliage before they ever step into your line of sight.',
    image: '/explainerImages/rescued-lady.jpeg',
    stat: 'Never be ambushed. Know who is approaching.'
  },
  partners: {
    label: '🤝 Partners & Supporters',
    headline: 'Invest in the future of community safety.',
    pitch: 'We are building the infrastructure for decentralized, sovereign defense. No corporate surveillance, no monthly fees. Help us equip the neighborhoods that need it most and build a safer world for everyone.',
    image: '/explainerImages/visuals/community.jpeg',
    stat: 'Join a movement to stop hate crimes and violence.'
  }
};

export default function SplashPage({ onEnterPrecise, onEnterDemo }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosConfirmed, setTosConfirmed] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState('community'); // Default
  
  const canProceed = ageConfirmed && tosConfirmed;
  const activeAudience = AUDIENCES[selectedAudience];

  return (
    <div className="min-h-screen bg-[#0C1A28] text-slate-100 overflow-x-hidden pb-48">
      
      {/* ─── HEADER ─── */}
      <header className="px-6 py-6 flex items-center gap-3 max-w-5xl mx-auto">
        <RaptorMark className="h-10 w-10" />
        <div>
          <div className="text-sm font-bold tracking-[0.25em] text-slate-200">THE RAPTOR'S CALL</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#39E0C4]">Off-Grid Community Defense</div>
        </div>
      </header>

      {/* ─── HERO & CAROUSEL ─── */}
      <section className="max-w-5xl mx-auto px-6 pt-4 pb-12">
        {/* Dynamic Image Placeholder based on Audience */}
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 border border-slate-700 shadow-2xl relative">
          <img 
            src={activeAudience.image} 
            alt={activeAudience.label} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C1A28] to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
             <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
               {activeAudience.headline}
             </h1>
          </div>
        </div>

        {/* Audience Selector */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select your group to learn more:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AUDIENCES).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedAudience(key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  selectedAudience === key 
                    ? 'bg-[#39E0C4] text-[#0C1A28] border-[#39E0C4]' 
                    : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-[#39E0C4]'
                }`}
              >
                {data.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tailored Pitch */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 backdrop-blur">
          <p className="text-lg md:text-xl leading-relaxed text-slate-200">
            {activeAudience.pitch}
          </p>
          <div className="mt-6 flex items-center gap-3 text-[#F0701A] font-bold text-lg">
            <Zap className="h-5 w-5" />
            {activeAudience.stat}
          </div>
        </div>
      </section>

      {/* ─── THE REALITY (Hard Hitting Stats) ─── */}
      <section className="bg-slate-900 py-12 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-center text-2xl font-bold mb-8">Every year in America:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
              <div className="text-4xl font-black text-[#F0701A] mb-2">600,000+</div>
              <div className="text-sm text-slate-400">People reported missing in the U.S.</div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
              <div className="text-4xl font-black text-[#F0701A] mb-2">11,679</div>
              <div className="text-sm text-slate-400">Hate crimes reported to the FBI</div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
              <div className="text-4xl font-black text-[#F0701A] mb-2">50,654</div>
              <div className="text-sm text-slate-400">Abductions and kidnappings</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREE VS PAID ─── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <h3 className="text-xl font-bold text-emerald-200">The Web App (Free)</h3>
            </div>
            <ul className="space-y-2 text-sm text-emerald-100/80">
              <li>• Full map simulation & demo scenarios</li>
              <li>• Test the mesh network interface</li>
              <li>• No signup or credit card required</li>
            </ul>
          </div>
          
          <div className="bg-amber-900/20 border border-amber-500/30 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-[#0C1A28] text-[10px] font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-6 w-6 text-amber-400" />
              <h3 className="text-xl font-bold text-amber-200">The Loadouts (Real)</h3>
            </div>
            <p className="text-sm text-amber-100/80 mb-4">
              Buying a hardware loadout makes the app real. This is the difference between watching a map and detecting threats in the real world.
            </p>
            <a href="https://sparklesnovel.gumroad.com" target="_blank" rel="noreferrer" className="inline-block bg-amber-500 text-[#0C1A28] font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-400 transition">
              View Loadouts →
            </a>
          </div>
        </div>
      </section>

      {/* ─── STICKY CTA FOOTER ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0C1A28]/95 backdrop-blur-lg border-t border-slate-700 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-3xl mx-auto">
          {/* Checkboxes */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mb-4 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="h-4 w-4 accent-[#39E0C4]" />
              I am 13 years or older
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={tosConfirmed} onChange={(e) => setTosConfirmed(e.target.checked)} className="h-4 w-4 accent-[#39E0C4]" />
              I agree to the <a href="/privacy.html" target="_blank" className="text-[#39E0C4] underline">Privacy Policy</a>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={!canProceed}
              onClick={onEnterPrecise}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#39E0C4] to-teal-500 px-6 py-3 text-sm font-bold text-[#0C1A28] shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MapPin className="h-4 w-4" />
              Use Precise Location
            </button>
            <button
              disabled={!canProceed}
              onClick={onEnterDemo}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-800 px-6 py-3 text-sm font-bold text-slate-200 transition hover:border-[#39E0C4] hover:text-[#39E0C4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              Try Demo (No GPS)
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}