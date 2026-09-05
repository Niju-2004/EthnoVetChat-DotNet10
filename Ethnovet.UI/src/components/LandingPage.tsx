import React from 'react';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import type { User } from '../types';

interface LandingPageProps {
  language: 'en' | 'ta';
  currentUser: User | null;
  onStartConsultation: (initialPrompt?: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  currentUser,
  onStartConsultation,
  onOpenAuth,
}) => {
  const isTa = language === 'ta';

  const capabilities = [
    {
      icon: '🐄',
      title: isTa ? 'மாடு & பால் கால்நடை பராமரிப்பு' : 'Cattle & Dairy Livestock',
      desc: isTa
        ? 'வயிறு உப்பசம் (Bloat / Tympani), கழிச்சல், மடி நோய் (Mastitis), காய்ச்சல் மற்றும் பால் பெருக்கத்திற்கான பாரம்பரிய மூலிகை முறைகள்.'
        : 'Herbal first-aid for bloat, acute diarrhea, mastitis, milk drop, foot rot, and digestive sluggishness.',
      badge: isTa ? 'முதன்மையானது' : 'Primary Scope',
      color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20',
    },
    {
      icon: '🐐',
      title: isTa ? 'ஆடு & செம்மறி ஆடு நலம்' : 'Goat & Sheep Triage',
      desc: isTa
        ? 'ஆடுகளுக்கான இயற்கை குடற்புழு நீக்கம், கழிச்சல் கட்டுப்பாடு, சளி மற்றும் செரிமான கோளாறுகள்.'
        : 'Natural deworming, watery dung management, respiratory distress, and seasonal weakness.',
      badge: isTa ? 'ஆடுகள்' : 'Caprine Care',
      color: 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20',
    },
    {
      icon: '🐔',
      title: isTa ? 'கோழி & நாட்டுக்கோழி பராமரிப்பு' : 'Poultry & Backyard Flocks',
      desc: isTa
        ? 'கோழிகளுக்கு அம்மை நோய் (Fowl Pox), கொத்து காயங்கள், புண்கள் மற்றும் இயற்கை நோய் எதிர்ப்பு சக்தி மருந்துகள்.'
        : 'Herbal remedies for chicken pox, pecking wounds, eye irritations, and natural immune boosters.',
      badge: isTa ? 'கோழிகள்' : 'Avian Support',
      color: 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20',
    },
    {
      icon: '🛡️',
      title: isTa ? 'நாய்களுக்கான பாதுகாப்பு எச்சரிக்கை' : 'Canine Safety Guard',
      desc: isTa
        ? 'கால்நடைகளுக்கான கற்பூரம் போன்ற சில மூலிகைகள் நாய்களுக்கு நஞ்சாகலாம். இந்த AI அதனை முன்கூட்டியே எச்சரிக்கும்.'
        : 'Actively flags and prevents administering toxic ruminant concoctions (e.g. camphor) to dogs or cats.',
      badge: isTa ? 'பாதுகாப்பு' : 'Safety Engine',
      color: 'border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20',
    },
    {
      icon: '🌿',
      title: isTa ? '51 சரிபார்க்கப்பட்ட மூலிகை மருந்துகள்' : '51 Verified Compendium Remedies',
      desc: isTa
        ? 'மஞ்சள், பூண்டு, மிளகு, வேப்பிலை, கற்றாழை, வெந்தயம் போன்ற எளிய வீட்டுப் பொருட்களைக் கொண்டு தயாரிக்கும் முறைகள்.'
        : 'Formulations grounded in ethnoveterinary compendiums using farm ingredients: turmeric, neem, aloe, black pepper.',
      badge: isTa ? 'பாரம்பரியம்' : 'Zero-Lag RAG',
      color: 'border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/20',
    },
    {
      icon: '⚡',
      title: isTa ? 'மின்னல் வேக பதில்கள் (<15ms)' : 'Sub-15ms Triage & Streaming',
      desc: isTa
        ? 'பொதுவான வாழ்த்துகள் மற்றும் விலங்கு தேர்வுகளுக்கு உடனடியாகப் பதில், மருத்துவக் கேள்விகளுக்கு நிகழ்நேர உரை உருவாக்கம்.'
        : 'Instant fast-path triage for non-medical turns with token-by-token Server-Sent Events (SSE) streaming.',
      badge: isTa ? 'வேகம்' : 'Instant AI',
      color: 'border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/20',
    },
  ];

  const steps = [
    {
      step: '01',
      title: isTa ? 'பதிவு அல்லது உள்நுழைவு' : 'Sign In or Register',
      desc: isTa
        ? '3 எளிய படிகளில் கணக்கை உருவாக்கி, தமிழ் அல்லது ஆங்கில மொழி விருப்பத்தைத் தேர்வு செய்யுங்கள்.'
        : 'Quick 3-stage setup to secure your account and set your preferred language.',
    },
    {
      step: '02',
      title: isTa ? 'விலங்கு & அறிகுறிகள் கூறுங்கள்' : 'Specify Animal & Symptoms',
      desc: isTa
        ? 'மாடு, ஆடு அல்லது கோழியைத் தேர்ந்தெடுத்து, என்ன பிரச்சனை என்பதைத் தட்டச்சு செய்யுங்கள் அல்லது பேசுங்கள்.'
        : 'Select your target animal and speak or type symptoms (e.g. bloat, fever, diarrhea).',
    },
    {
      step: '03',
      title: isTa ? 'மூலிகை செய்முறையைப் பெறுங்கள்' : 'Receive Verified Herbal Guidance',
      desc: isTa
        ? 'துல்லியமான மூலிகைகள், அரைக்கும் முறை, கொடுக்கும் அளவு மற்றும் அவசர எச்சரிக்கைகளைப் பெறுங்கள்.'
        : 'Get exact ingredient ratios, preparation steps, dosage frequency, and veterinary cautions.',
    },
  ];

  const sampleQueries = [
    {
      animal: '🐄 Cow',
      query: isTa ? 'மாட்டுக்கு வயிறு உப்பசம் மற்றும் மூச்சுத்திணறல்' : 'Cow has stomach bloat and breathing trouble',
    },
    {
      animal: '🐐 Goat',
      query: isTa ? 'ஆட்டுக்கு நீர் போன்ற கழிச்சல் / பேதி' : 'Goat with severe watery diarrhea',
    },
    {
      animal: '🥛 Milk Yield',
      query: isTa ? 'மாட்டுக்கு பால் உற்பத்தி அதிகரிக்க மூலிகை மருந்து' : 'How to increase milk yield in cows naturally?',
    },
    {
      animal: '🐔 Poultry',
      query: isTa ? 'கோழிக்கு காயம் மற்றும் ரத்தப்போக்கு' : 'Chicken with pecking injuries and wounds',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isTa ? 'நிஜு (Niju) உருவாக்கிய AI ஆப்' : 'Created by Niju • Niju App'}</span>
          <span className="text-slate-400">•</span>
          <span>{isTa ? 'பாரம்பரிய கால்நடை வழிகாட்டி' : 'Traditional EthnoVet AI'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {isTa ? (
            <>
              பாரம்பரிய மூலிகை மருத்துவம்,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                நவீன AI தொழில்நுட்பத்துடன்
              </span>
            </>
          ) : (
            <>
              Traditional Livestock Healing,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Powered by Modern AI
              </span>
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isTa
            ? 'எத்னோவெட் சாட் (EthnoVet Chat / Niju App) என்பது விவசாயிகள் மற்றும் கால்நடை வளர்ப்போருக்கான சிறப்பு AI உதவியாளர். மாடு, ஆடு, கோழிகளுக்கான முதலுதவி மூலிகை சிகிச்சைகள், மருந்தளவு மற்றும் பாதுகாப்பு குறிப்புகளை உடனடியாகப் பெறுங்கள்.'
            : 'EthnoVet Chat (Niju Chat App) is a clinically safe AI companion designed for rural farmers and animal owners. Get instant traditional remedies, herbal preparations, dosage guidance, and species toxicity warnings.'}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onStartConsultation()}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 group"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isTa ? 'ஆலோசனையைத் தொடங்கு' : 'Start Veterinary Chat'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {!currentUser && (
            <button
              onClick={() => onOpenAuth('register')}
              className="px-5 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{isTa ? 'புதிய விவசாயி பதிவு' : 'Free Farmer Sign Up'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isTa ? 'இந்த AI என்ன செய்யும்? (முக்கிய அம்சங்கள்)' : 'What This AI Is Capable Of'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isTa
              ? 'விவசாயிகளுக்கு களத்தில் உடனடியாக உதவும் வகையில் வடிவமைக்கப்பட்ட மருத்துவ வசதிகள்'
              : 'Engineered specifically for livestock welfare, indigenous wisdom, and clinical safety'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((c, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-sm ${c.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                  {c.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{c.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isTa ? 'எளிய 3 படிகளில் ஆலோசனை' : 'How It Works in 3 Simple Steps'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isTa ? 'எந்த சிக்கலும் இல்லாமல் உடனே ஆலோசனை பெறலாம்' : 'Zero learning curve — intuitive for farmers of all backgrounds'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="w-10 h-10 rounded-full bg-emerald-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                {s.step}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">{s.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed m-0">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Questions to Try */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {isTa ? 'நீங்கள் கேட்கக்கூடிய சில உதாரணங்கள்' : 'Try Asking These Example Consultations'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isTa ? 'கீழே உள்ள கேள்விகளில் ஒன்றை கிளிக் செய்து சோதிக்கலாம்' : 'Click any card to start a live consultation with this symptom'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onStartConsultation(item.query)}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all cursor-pointer group shadow-2xs flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  {item.animal}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  "{item.query}"
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
            </button>
          ))}
        </div>
      </section>

      {/* Clinical Disclaimer & Safety Alert */}
      <section className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs leading-relaxed">
          <h4 className="font-bold m-0">
            {isTa ? 'மருத்துவப் பொறுப்புத் துறப்பு (Clinical Disclaimer)' : 'Important Veterinary Safety Notice'}
          </h4>
          <p className="m-0 text-amber-800 dark:text-amber-300">
            {isTa
              ? 'பாரம்பரிய மூலிகை சிகிச்சைகள் கிராமப்புற முதலுதவி மற்றும் பொதுவான உபாதைகளுக்கானவை. கடுமையான ரத்தப்போக்கு, எலும்பு முறிவு, தீவிர மூச்சுத்திணறல் அல்லது விஷக்கடி போன்ற அவசர நிலைகளில் தாமதிக்காமல் உடனடியாக அரசு அல்லது பதிவுபெற்ற கால்நடை மருத்துவரை அணுகவும்.'
              : 'Traditional ethnoveterinary remedies serve as supportive natural first-aid for rural livestock owners. Acute emergencies, severe infections, poisoning, or fractures require immediate clinical intervention by a licensed veterinarian.'}
          </p>
        </div>
      </section>

      {/* Creator Attribution Footer Card */}
      <footer className="text-center pt-2 pb-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
          {isTa ? (
            <>
              வடிவமைத்து உருவாக்கியவர்: <b className="text-emerald-700 dark:text-emerald-400">நிஜு (Niju)</b> • EthnoVet Chat (Niju App) • பாரம்பரிய கால்நடை மருத்துவப் பாதுகாப்பு
            </>
          ) : (
            <>
              Engineered with care by <b className="text-emerald-700 dark:text-emerald-400">Niju</b> • EthnoVet Chat (Niju App / Niju Chat App) • Preserving Traditional Ethnoveterinary Knowledge
            </>
          )}
        </p>
      </footer>
    </div>
  );
};