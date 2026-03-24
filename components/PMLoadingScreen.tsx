'use client';

import { useEffect, useState, useRef } from 'react';

// ─── 30 PM jokes — shuffled randomly, never repeat until all shown ────────────
const PM_JOKES = [
  { setup: "Why did the PM cross the road?", punchline: "To align with stakeholders on the other side." },
  { setup: "How many PMs does it take to change a lightbulb?", punchline: "Just one — but first we need to validate the problem, run a discovery sprint, and get design's sign-off." },
  { setup: "A PM walks into a bar.", punchline: "The bar has no idea what its north star metric is." },
  { setup: "What's a PM's favourite movie?", punchline: "The Backlog — it never ends." },
  { setup: "Why don't PMs ever finish their sentences?", punchline: "That's next quarter's scope." },
  { setup: "What did the PM say at the party?", punchline: "Let me take this offline." },
  { setup: "How does a PM say 'I love you'?", punchline: "This is a P0." },
  { setup: "What's the PM's favourite sport?", punchline: "Sprint planning. They love sprinting and never arriving." },
  { setup: "Why was the PM always calm?", punchline: "They learned to say 'let's circle back' to every emergency." },
  { setup: "What do you call a PM without a roadmap?", punchline: "A visionary." },
  { setup: "Why did the PM stare at the spreadsheet all day?", punchline: "Someone said 'keep an eye on the metrics'." },
  { setup: "A junior asked a PM: what's your biggest weakness?", punchline: "Scope creep. Wait — and also accepting scope creep." },
  { setup: "How many engineers does it take to push back on a PM?", punchline: "All of them. In a Slack thread. For three days." },
  { setup: "What's the PM's definition of 'done'?", punchline: "Shipped. Bugs are just undocumented features." },
  { setup: "Why did the PM get a promotion?", punchline: "They put 'drove 10x growth' in their resume and nobody asked follow-up questions." },
  { setup: "What's a PM's bedtime story?", punchline: "'And the OKRs were 100% green.' Nobody believed it, but everyone slept better." },
  { setup: "Why don't PMs ever get lost?", punchline: "They always have a roadmap. Getting there is someone else's problem." },
  { setup: "What did the PM name their dog?", punchline: "Dependency. It blocks everything." },
  { setup: "How does a PM fix a bug?", punchline: "They reframe it as a feature and move it to the icebox." },
  { setup: "What's a PM's least favourite word?", punchline: "'Done.' It means they have to write the next PRD." },
  { setup: "Why did the PM bring a ladder to the meeting?", punchline: "To reach the low-hanging fruit everyone keeps talking about." },
  { setup: "What do PMs and weather forecasters have in common?", punchline: "They're both wrong 40% of the time but sound very confident." },
  { setup: "Why did the PM break up with their calendar?", punchline: "Too many recurring commitments with no clear outcome." },
  { setup: "What's a PM's version of meditation?", punchline: "Staring at the Amplitude dashboard and saying 'the data tells a story'." },
  { setup: "How does a PM answer 'are we there yet?'", punchline: "'We're iterating towards the destination. The journey IS the product.'" },
  { setup: "What did the PM say when their feature flopped?", punchline: "'This is great learnings. Let me document them in a post-mortem nobody will read.'" },
  { setup: "Why did the PM sleep so well?", punchline: "They delegated their anxiety to a Jira ticket." },
  { setup: "What's the PM's favourite restaurant order?", punchline: "MVP — Minimum Viable Pasta. Just enough to not be hungry." },
  { setup: "Why did the PM refuse to take the elevator?", punchline: "They only do elevator pitches, not rides." },
  { setup: "What do you call a PM who codes?", punchline: "A myth. A beautiful, well-documented myth." },
];

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ─── Step definitions per mode ────────────────────────────────────────────────
interface Step { icon: string; label: string; }

const OPTIMIZE_STEPS: Step[] = [
  { icon: '📄', label: 'Reading your resume...' },
  { icon: '🔍', label: 'Understanding the job description...' },
  { icon: '🎯', label: 'Matching your experience to the role...' },
  { icon: '✍️', label: 'Rewriting your summary...' },
  { icon: '⚡', label: 'Strengthening your bullets...' },
  { icon: '🔑', label: 'Weaving in the right keywords...' },
  { icon: '✨', label: 'Polishing your final resume...' },
];

const ANALYSE_STEPS: Step[] = [
  { icon: '📄', label: 'Reading your resume...' },
  { icon: '🔍', label: 'Extracting every bullet point...' },
  { icon: '🎯', label: 'Comparing against the job description...' },
  { icon: '📊', label: 'Checking PM keywords and vocabulary...' },
  { icon: '🧠', label: 'Analysing each bullet individually...' },
  { icon: '💡', label: 'Generating improvement suggestions...' },
  { icon: '✨', label: 'Preparing your full report...' },
];

const COVER_LETTER_STEPS: Step[] = [
  { icon: '📄', label: 'Reading your background...' },
  { icon: '🎯', label: 'Aligning with the role requirements...' },
  { icon: '✍️', label: 'Crafting a compelling opening...' },
  { icon: '💼', label: 'Highlighting your strongest wins...' },
  { icon: '✨', label: 'Polishing your cover letter...' },
];

const DOWNLOAD_STEPS: Step[] = [
  { icon: '📄', label: 'Preparing your document...' },
  { icon: '🎨', label: 'Applying professional formatting...' },
  { icon: '🧾', label: 'Rendering a clean, ATS-friendly PDF...' },
  { icon: '🔒', label: 'Almost ready...' },
];

// ─── Fun facts shown while waiting — feels productive, not slow ───────────────
const FUN_FACTS = [
  "PM resumes with 50%+ quantified bullets get 3× more recruiter callbacks.",
  "The average recruiter spends 6 seconds on a resume before deciding.",
  "Resumes with a tailored summary get 40% more responses than generic ones.",
  "Action verbs like 'drove' and 'launched' outperform 'responsible for' by a wide margin.",
  "JD-keyword alignment is the #1 factor in passing automated screening.",
  "Top PM resumes average 2–3 metrics per job entry.",
  "A resume without a summary forces the recruiter to piece together your story themselves.",
  "Most PM candidates have great experience but frame it as tasks, not outcomes.",
];

// ─── Progress bar that feels smooth even when we don't know actual progress ───
function SmoothProgressBar({ mode }: { mode: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    // Quick initial jump to ~15% (feels responsive)
    const initial = setTimeout(() => setProgress(15), 300);

    // Slow crawl to ~75% (feels like real work is happening)
    const crawl = setInterval(() => {
      setProgress(p => {
        if (p >= 75) { clearInterval(crawl); return p; }
        // Slower as we approach 75% — feels more realistic
        const increment = p < 40 ? 3 : p < 60 ? 1.5 : 0.5;
        return Math.min(75, p + increment);
      });
    }, 600);

    return () => { clearTimeout(initial); clearInterval(crawl); };
  }, [mode]);

  return (
    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-500 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface PMLoadingProps {
  mode?: 'optimize' | 'analyse' | 'cover-letter' | 'download';
  message?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PMLoadingScreen({ mode = 'optimize', message }: PMLoadingProps) {
  const steps = mode === 'analyse'
    ? ANALYSE_STEPS
    : mode === 'cover-letter'
    ? COVER_LETTER_STEPS
    : mode === 'download'
    ? DOWNLOAD_STEPS
    : OPTIMIZE_STEPS;

  // Joke state
  const jokeQueueRef = useRef<typeof PM_JOKES>(shuffle(PM_JOKES));
  const jokeIndexRef = useRef(0);
  const [joke, setJoke] = useState(jokeQueueRef.current[0]!);
  const [jokePhase, setJokePhase] = useState<'setup' | 'punchline'>('setup');
  const [jokeVisible, setJokeVisible] = useState(true);

  // Step state
  const [stepIndex, setStepIndex] = useState(0);
  const [stepVisible, setStepVisible] = useState(true);

  // Fun fact state (NEW — feels productive while waiting)
  const [factIndex, setFactIndex] = useState(Math.floor(Math.random() * FUN_FACTS.length));
  const [factVisible, setFactVisible] = useState(false);
  const [showFact, setShowFact] = useState(false);

  // Dots ticker
  const [dots, setDots] = useState('');

  // ── Dots ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);

  // ── Step ticker (every 3s) ────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setStepVisible(false);
      setTimeout(() => {
        setStepIndex(i => (i + 1) % steps.length);
        setStepVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(id);
  }, [steps.length]);

  // ── Show fun fact after 8 seconds (user is still waiting, give them value) ─
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFact(true);
      setFactVisible(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // ── Rotate fun fact every 12s ─────────────────────────────────────────────
  useEffect(() => {
    if (!showFact) return;
    const id = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex(i => (i + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 500);
    }, 12000);
    return () => clearInterval(id);
  }, [showFact]);

  // ── Joke cycle: setup (5s) → punchline (6s) → next ───────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (jokePhase === 'setup') {
      timer = setTimeout(() => setJokePhase('punchline'), 5000);
    } else {
      timer = setTimeout(() => {
        setJokeVisible(false);
        setTimeout(() => {
          jokeIndexRef.current += 1;
          if (jokeIndexRef.current >= jokeQueueRef.current.length) {
            jokeQueueRef.current = shuffle(PM_JOKES);
            jokeIndexRef.current = 0;
          }
          setJoke(jokeQueueRef.current[jokeIndexRef.current]!);
          setJokePhase('setup');
          setJokeVisible(true);
        }, 600);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [jokePhase]);

  const currentStep = steps[stepIndex]!;

  const modeLabel = mode === 'analyse'
    ? 'Analysing your resume'
    : mode === 'cover-letter'
    ? 'Writing your cover letter'
    : mode === 'download'
    ? 'Preparing your PDF'
    : 'Optimizing your resume';

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">

      {/* ── Top smooth progress bar ── */}
      <div className="px-6 pt-5 pb-0">
        <SmoothProgressBar mode={mode} />
      </div>

      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.95); opacity: 0.7; }
          50%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes jokeFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes punchFadeIn {
          0%   { opacity: 0; transform: scale(0.97) translateY(4px); }
          60%  { transform: scale(1.02) translateY(-1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(28px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
        }
        @keyframes orbitReverse {
          from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
          to   { transform: rotate(-360deg) translateX(20px) rotate(360deg); }
        }
        @keyframes factFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="p-8">

        {/* ── Orb animation ── */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full border-2 border-blue-200"
              style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />
            <div className="absolute w-16 h-16 rounded-full border-2 border-blue-300"
              style={{ animation: 'pulseRing 2s ease-in-out infinite 0.4s' }} />
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-xl"
              style={{ animation: 'floatOrb 3s ease-in-out infinite' }}>
              {mode === 'analyse' ? '🔍' : mode === 'cover-letter' ? '✉️' : mode === 'download' ? '⬇️' : '✨'}
            </div>
            <div className="absolute w-3 h-3 rounded-full bg-blue-400 shadow-sm"
              style={{ animation: 'orbit 3s linear infinite', top: '50%', left: '50%', marginTop: '-6px', marginLeft: '-6px' }} />
            <div className="absolute w-2 h-2 rounded-full bg-blue-400 shadow-sm"
              style={{ animation: 'orbitReverse 2s linear infinite', top: '50%', left: '50%', marginTop: '-4px', marginLeft: '-4px' }} />
          </div>
        </div>

        {/* ── Title ── */}
        <div className="text-center mb-2">
          <p className="font-bold text-slate-900 text-lg">
            {message || modeLabel}
            <span className="text-blue-500 font-normal">{dots}</span>
          </p>
        </div>

        {/* ── Step ticker ── */}
        <div className="flex items-center justify-center gap-2 mb-6 h-6">
          <div style={{
            animation: stepVisible ? 'fadeSlideUp 0.4s ease forwards' : 'fadeSlideDown 0.3s ease forwards',
          }} className="flex items-center gap-2 text-sm text-slate-500">
            <span>{currentStep.icon}</span>
            <span>{currentStep.label}</span>
          </div>
        </div>

        {/* ── Fun fact (appears after 8s — makes wait feel educational) ── */}
        {showFact && (
          <div style={{
            opacity: factVisible ? 1 : 0,
            transform: factVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }} className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">💡 Did you know?</p>
            <p className="text-sm text-blue-800 leading-relaxed">{FUN_FACTS[factIndex]}</p>
          </div>
        )}

        {/* ── Joke card ── */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl p-5 min-h-[110px] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-3 left-4 text-5xl text-blue-100 font-serif leading-none select-none">"</div>

          <div style={{
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            opacity: jokeVisible ? 1 : 0,
            transform: jokeVisible ? 'translateY(0)' : 'translateY(-6px)',
          }}>
            <p className="text-sm text-slate-600 text-center relative z-10 mb-2"
              style={jokePhase !== 'setup' ? {} : { animation: 'jokeFadeIn 0.5s ease forwards' }}>
              {joke.setup}
            </p>
            <div style={{
              transition: 'opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease',
              opacity: jokePhase === 'punchline' ? 1 : 0,
              maxHeight: jokePhase === 'punchline' ? '60px' : '0px',
              overflow: 'hidden',
            }}>
              <p className="text-sm font-bold text-blue-700 text-center"
                style={{ animation: jokePhase === 'punchline' ? 'punchFadeIn 0.5s ease forwards' : 'none' }}>
                {joke.punchline}
              </p>
            </div>
          </div>
        </div>

        {/* ── Progress dots ── */}
        <div className="flex justify-center gap-2 mt-5">
          {steps.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-500"
              style={{
                width: i === stepIndex ? '20px' : '6px',
                height: '6px',
                backgroundColor: i === stepIndex ? '#3b82f6' : '#e2e8f0',
              }} />
          ))}
        </div>

        {/* ── Reassurance line — NO time estimate, just calm reassurance ── */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Our AI is doing the heavy lifting — sit back and relax 🙏
        </p>
      </div>
    </div>
  );
}
