import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Page = 'overview' | 'profile' | 'resume' | 'skills' | 'guidance' | 'jobs' | 'notifications' | 'settings';
type AuthMode = 'signin' | 'signup';

type Profile = {
  id: string;
  full_name: string;
  headline: string;
  location: string;
  target_role: string;
  bio: string;
  skills: string[];
  preferred_language: string;
};

type Resume = {
  id: string;
  title: string;
  file_name: string | null;
  ats_score: number | null;
  status: string;
  created_at: string;
};

const emptyProfile: Omit<Profile, 'id'> = {
  full_name: '',
  headline: '',
  location: '',
  target_role: '',
  bio: '',
  skills: [],
  preferred_language: 'English',
};

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; section?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'My profile', icon: UserRound },
  { id: 'resume', label: 'Resume & ATS', icon: FileText },
  { id: 'skills', label: 'Skill gap', icon: Target },
  { id: 'guidance', label: 'Career guidance', icon: BookOpen },
  { id: 'jobs', label: 'Find opportunities', icon: BriefcaseBusiness },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<Page>('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id) {
      setProfile(null);
      setResumes([]);
      return;
    }
    const loadWorkspace = async () => {
      setError('');
      const [{ data: profileData, error: profileError }, { data: resumeData, error: resumeError }] = await Promise.all([
        supabase.from('worknext_profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('worknext_resumes').select('id, title, file_name, ats_score, status, created_at').order('created_at', { ascending: false }),
      ]);
      if (profileError || resumeError) {
        setError('We could not load your workspace. Please refresh and try again.');
        return;
      }
      setProfile(profileData);
      setResumes(resumeData ?? []);
    };
    void loadWorkspace();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPage('overview');
  };

  const [showAuth, setShowAuth] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<AuthMode>('signin');
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAvatarMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) setIsAvatarMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAvatarMenuOpen]);

  const openAuth = (mode: AuthMode) => {
    setInitialAuthMode(mode);
    setShowAuth(true);
  };

  if (isLoading) return <div className="loading-screen"><div className="loader-mark">W</div><span>Preparing your workspace</span></div>;
  if (!session) return showAuth ? <AuthScreen initialMode={initialAuthMode} onBack={() => setShowAuth(false)} /> : <LandingPage onSignIn={() => openAuth('signin')} onSignUp={() => openAuth('signup')} />;

  const activeProfile = profile ?? { id: session.user.id, ...emptyProfile };
  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><div className="brand-symbol">W</div><div><strong>work<span>next</span></strong><small>Shape what comes next.</small></div></div>
        <button className="mobile-close" onClick={() => setIsMobileNavOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'notifications' && <span className="nav-dot" />}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="language-pill"><Globe2 size={15} /><span>English</span><ChevronRight size={15} /></div>
          <button className="signout-button" onClick={handleSignOut}><LogOut size={17} /> Sign out</button>
          <div className="sidebar-note"><Sparkles size={16} /><span>Your next chapter starts with one small step.</span></div>
        </div>
      </aside>
      {isMobileNavOpen && <button className="mobile-scrim" onClick={() => setIsMobileNavOpen(false)} aria-label="Close navigation" />}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setIsMobileNavOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="notification-button" onClick={() => navigate('notifications')} aria-label="Notifications"><Bell size={19} /><span /></button><div className="avatar-menu-wrapper" ref={avatarMenuRef}><button className="avatar-button" onClick={() => setIsAvatarMenuOpen((open) => !open)} aria-label="Account menu" aria-expanded={isAvatarMenuOpen}>{getInitials(activeProfile.full_name || session.user.email || 'WN')}</button>{isAvatarMenuOpen && <div className="avatar-dropdown" role="menu"><div className="avatar-dropdown-header"><strong>{activeProfile.full_name || 'Your account'}</strong><span>{session.user.email}</span></div><button className="avatar-dropdown-item" onClick={() => { navigate('profile'); setIsAvatarMenuOpen(false); }} role="menuitem"><UserRound size={17} /> Profile</button><button className="avatar-dropdown-item danger" onClick={() => { handleSignOut(); setIsAvatarMenuOpen(false); }} role="menuitem"><LogOut size={17} /> Log Out</button></div>}</div></div>
        </header>
        {error && <div className="global-error" role="alert">{error}</div>}
        <div className="page-wrap">
          {page === 'overview' && <Overview profile={activeProfile} resumes={resumes} onNavigate={navigate} />}
          {page === 'profile' && <ProfilePage profile={activeProfile} session={session} onSaved={setProfile} />}
          {page === 'resume' && <ResumePage resumes={resumes} onCreated={(resume) => setResumes((current) => [resume, ...current])} />}
          {page === 'skills' && <FeaturePage eyebrow="THE SKILL GAP" title="Know what to learn next." body="Compare your current strengths with the roles you want. Build a focused learning path instead of collecting random courses." icon={<Target />} action="Add your target role" onAction={() => navigate('profile')} />}
          {page === 'guidance' && <FeaturePage eyebrow="CAREER GUIDANCE" title="A clearer route forward." body="Get thoughtful, practical direction for your next move—from choosing a role to preparing for the conversation that opens the door." icon={<BookOpen />} action="Complete your profile" onAction={() => navigate('profile')} />}
          {page === 'jobs' && <FeaturePage eyebrow="OPPORTUNITIES" title="Find work that fits your direction." body="Your future opportunities will appear here once we know what you are looking for. Start with a target role and location." icon={<BriefcaseBusiness />} action="Set your preferences" onAction={() => navigate('profile')} />}
          {page === 'notifications' && <FeaturePage eyebrow="NOTIFICATIONS" title="You are all caught up." body="Important updates about your profile, applications and career path will show up here." icon={<Bell />} action="Return to overview" onAction={() => navigate('overview')} />}
          {page === 'settings' && <FeaturePage eyebrow="SETTINGS" title="Make WorkNext yours." body="Language, privacy and account controls will live here. Your account is currently using English." icon={<Settings />} action="Edit my profile" onAction={() => navigate('profile')} />}
        </div>
        <footer className="site-footer"><div className="footer-brand"><img src="/images/WhatsApp_Image_2026-09-13_at_2.40.52_PM-removebg-preview.png" alt="JSL Works" /><span>Project done by the team The Bachelors.</span></div><span className="footer-right">© {new Date().getFullYear()} WorkNext</span></footer>
      </main>
    </div>
  );
}

function LandingPage({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand-lockup dark"><div className="brand-symbol">W</div><div><strong>work<span>next</span></strong><small>Shape what comes next.</small></div></div>
        <div className="landing-nav-actions">
          <button className="ghost-button" onClick={onSignIn}>Sign In</button>
          <button className="primary-button" onClick={onSignUp}>Sign Up <ArrowUpRight size={16} /></button>
        </div>
      </header>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">AI-POWERED CAREER PLATFORM</p>
          <h1 className="landing-title">Work<em>Next</em></h1>
          <p className="landing-tagline">Empowering India&rsquo;s Workforce</p>
          <p className="landing-desc">An AI-powered career platform helping students and job seekers build skills, create better resumes, find opportunities, and grow their careers.</p>
          <div className="landing-cta-row">
            <button className="primary-button large" onClick={onSignUp}>Start your journey <ArrowUpRight size={18} /></button>
            <button className="ghost-button large" onClick={onSignIn}>Sign In</button>
          </div>
        </div>
        <div className="landing-hero-art">
          <div className="landing-orbit orbit-outer" />
          <div className="landing-orbit orbit-inner" />
          <div className="landing-star star-a">&#10022;</div>
          <div className="landing-star star-b">&#10038;</div>
          <div className="landing-badge"><span>01</span><div className="badge-line" /><strong>EMPOWER<br /><em>INDIA</em></strong></div>
        </div>
      </section>
      <section className="landing-features">
        <div className="landing-feature"><Target size={22} /><h3>Build skills</h3><p>Identify your gaps and follow a focused learning path.</p></div>
        <div className="landing-feature"><FileText size={22} /><h3>Create resumes</h3><p>Craft ATS-ready resumes that get past the filters.</p></div>
        <div className="landing-feature"><BriefcaseBusiness size={22} /><h3>Find opportunities</h3><p>Discover roles aligned with your direction and strengths.</p></div>
        <div className="landing-feature"><Sparkles size={22} /><h3>Grow careers</h3><p>Get thoughtful guidance for every step forward.</p></div>
      </section>
      <footer className="site-footer landing-footer"><div className="footer-brand"><img src="/images/WhatsApp_Image_2026-09-13_at_2.40.52_PM-removebg-preview.png" alt="JSL Works" /><span>Project done by the team The Bachelors.</span></div><span className="footer-right">&copy; {new Date().getFullYear()} WorkNext</span></footer>
    </div>
  );
}

function AuthScreen({ initialMode, onBack }: { initialMode: AuthMode; onBack: () => void }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true); setError(''); setMessage('');
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (result.error) setError(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Check your inbox to confirm your email, then come back to sign in.');
    setIsSubmitting(false);
  };

  return <div className="auth-layout"><div className="auth-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-star star-one">✦</div><div className="art-star star-two">✧</div><div className="art-copy"><button className="brand-lockup light back-to-landing" onClick={onBack} type="button"><div className="brand-symbol">W</div><div><strong>work<span>next</span></strong><small>Shape what comes next.</small></div></button><div className="art-statement">Your work is<br /><em>more</em> than a title.</div><p>Find the direction, confidence and tools to make your next move count.</p></div><div className="art-footer">BUILT FOR THE AMBITIOUS<br /><span>From first step to next chapter.</span></div></div><div className="auth-panel"><div className="auth-panel-inner"><button className="back-link" onClick={onBack} type="button"><ChevronRight size={15} className="back-icon" /> Back to home</button><div className="auth-topline"><span>WORKNEXT / 01</span><span>INDIA, WORLDWIDE</span></div><div className="auth-heading"><p className="eyebrow">WELCOME TO YOUR NEXT</p><h1>{mode === 'signin' ? 'Come on in.' : 'Start your next.'}</h1><p>{mode === 'signin' ? 'Your career workspace is waiting.' : 'Create a workspace that moves with you.'}</p></div><form className="auth-form" onSubmit={submit}>{mode === 'signup' && <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" /></label>}<label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<button className="primary-button full-width" disabled={isSubmitting}>{isSubmitting ? 'Opening your workspace…' : mode === 'signin' ? 'Sign in' : 'Create account'}<ArrowUpRight size={18} /></button></form><div className="auth-switch"><span>{mode === 'signin' ? 'New to WorkNext?' : 'Already have an account?'}</span><button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in instead'}</button></div><div className="auth-legal">By continuing, you agree to build a career that feels like yours.</div></div></div></div>;
}

function Overview({ profile, resumes, onNavigate }: { profile: Profile; resumes: Resume[]; onNavigate: (page: Page) => void }) {
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'there';
  const profilePercent = [profile.full_name, profile.headline, profile.location, profile.target_role, profile.bio].filter(Boolean).length * 20;
  return <div className="overview-page"><section className="hero-section"><div><p className="eyebrow">MONDAY, YOUR NEXT MOVE</p><h1>Good to see you,<br /><em>{firstName}.</em></h1><p className="hero-lede">A meaningful career is not found. It is shaped—one intentional move at a time.</p></div><div className="hero-shape"><span>01</span><div className="shape-line" /><strong>MAKE<br />IT<br /><em>YOURS</em></strong></div></section><section className="progress-card"><div className="progress-copy"><span className="section-kicker">YOUR STARTING POINT</span><h2>Build a profile<br />that sounds like <em>you.</em></h2><p>Tell us a little about where you are headed so WorkNext can make the path more relevant.</p><button className="text-button" onClick={() => onNavigate('profile')}>{profilePercent ? 'Keep building' : 'Begin your profile'} <ArrowUpRight size={17} /></button></div><div className="progress-visual"><div className="progress-ring" style={{ '--progress': `${profilePercent * 3.6}deg` } as React.CSSProperties}><div><strong>{profilePercent}%</strong><span>complete</span></div></div><div className="progress-list">{[['Your name', Boolean(profile.full_name)], ['Your direction', Boolean(profile.target_role)], ['Your story', Boolean(profile.bio)]].map(([label, done]) => <div key={String(label)}><span className={done ? 'done' : ''}>{done ? <Check size={13} /> : <span />}</span>{String(label)}</div>)}</div></div></section><section className="tools-section"><div className="section-heading"><div><span className="section-kicker">YOUR TOOLS</span><h2>Move with intention.</h2></div><span className="section-count">{resumes.length} resumes added</span></div><div className="tool-grid"><ToolCard number="01" title="Resume & ATS" description="Make your experience impossible to overlook." icon={<FileText />} onClick={() => onNavigate('resume')} /><ToolCard number="02" title="Skill gap" description="See the skills between you and your next role." icon={<Target />} onClick={() => onNavigate('skills')} /><ToolCard number="03" title="Career guidance" description="Turn uncertainty into a thoughtful plan." icon={<BookOpen />} onClick={() => onNavigate('guidance')} /></div></section></div>;
}

function ToolCard({ number, title, description, icon, onClick }: { number: string; title: string; description: string; icon: React.ReactNode; onClick: () => void }) { return <button className="tool-card" onClick={onClick}><span className="tool-number">{number}</span><div className="tool-icon">{icon}</div><h3>{title}</h3><p>{description}</p><span className="card-arrow"><ArrowUpRight size={18} /></span></button>; }

function ProfilePage({ profile, session, onSaved }: { profile: Profile; session: Session; onSaved: (profile: Profile) => void }) {
  const [form, setForm] = useState(profile);
  const [skillInput, setSkillInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof Profile, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent) => { event.preventDefault(); setError(''); const { data, error: saveError } = await supabase.from('worknext_profiles').upsert({ ...form, id: session.user.id }).select().maybeSingle(); if (saveError || !data) setError('Your profile could not be saved. Please try again.'); else { onSaved(data); setSaved(true); window.setTimeout(() => setSaved(false), 2400); } };
  const addSkill = (event: FormEvent) => { event.preventDefault(); const skill = skillInput.trim(); if (skill && !form.skills.includes(skill)) setForm((current) => ({ ...current, skills: [...current.skills, skill] })); setSkillInput(''); };
  return <div className="inner-page"><div className="page-intro"><p className="eyebrow">YOUR PROFILE</p><h1>Make it <em>personal.</em></h1><p>Your profile is the beginning of every good recommendation. Keep it honest, specific and unmistakably yours.</p></div><form className="profile-form" onSubmit={save}><div className="form-block"><div className="block-heading"><span>01</span><div><h2>The basics</h2><p>Start with the details people use to find you.</p></div></div><div className="input-grid"><label>Full name<input value={form.full_name} onChange={(event) => update('full_name', event.target.value)} placeholder="Your full name" /></label><label>Where are you based?<input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="City, country" /></label><label className="wide">Professional headline<input value={form.headline} onChange={(event) => update('headline', event.target.value)} placeholder="What do you do, or want to do?" /></label><label className="wide">Target role<input value={form.target_role} onChange={(event) => update('target_role', event.target.value)} placeholder="The role you are moving towards" /></label></div></div><div className="form-block"><div className="block-heading"><span>02</span><div><h2>Your story</h2><p>Give your future a little context.</p></div></div><label>Short bio<textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} placeholder="What are you curious about? What kind of impact do you want to make?" rows={5} /></label></div><div className="form-block"><div className="block-heading"><span>03</span><div><h2>Your strengths</h2><p>Add the skills you want to be known for.</p></div></div><form className="skill-add" onSubmit={addSkill}><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} placeholder="Add a skill" /><button aria-label="Add skill"><Plus size={18} /></button></form><div className="skill-chips">{form.skills.map((skill) => <button type="button" key={skill} onClick={() => setForm((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }))}>{skill}<X size={13} /></button>)}</div></div>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="submit" className="primary-button">{saved ? 'Saved' : 'Save profile'} {saved ? <Check size={17} /> : <ArrowUpRight size={17} />}</button></div></form></div>;
}

function ResumePage({ resumes, onCreated }: { resumes: Resume[]; onCreated: (resume: Resume) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const createResume = async (event: FormEvent) => { event.preventDefault(); if (!title.trim()) return; const { data, error } = await supabase.from('worknext_resumes').insert({ title: title.trim() }).select('id, title, file_name, ats_score, status, created_at').maybeSingle(); if (error || !data) setMessage('We could not create that resume. Please try again.'); else { onCreated(data); setTitle(''); setMessage('Resume workspace created. Add your file when ready.'); } };
  return <div className="inner-page"><div className="page-intro split-intro"><div><p className="eyebrow">RESUME & ATS</p><h1>Put your best<br /><em>work forward.</em></h1><p>One clear resume can change the conversation. Upload yours or start a focused version for a specific role.</p></div><div className="intro-stamp"><FileText size={23} /><span>ATS<br /><strong>READY</strong></span></div></div><section className="resume-create"><div><span className="section-kicker">START A NEW VERSION</span><h2>What should we call this resume?</h2><p>Name it for the role or direction it is built around.</p></div><form onSubmit={createResume}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Product design roles" /><button className="primary-button" type="submit">Create workspace <ArrowUpRight size={17} /></button></form></section>{message && <p className="form-success">{message}</p>}<section className="resume-list"><div className="section-heading"><div><span className="section-kicker">YOUR RESUMES</span><h2>Nothing hidden.</h2></div></div>{resumes.length === 0 ? <div className="empty-panel"><FileText size={24} /><h3>Your resumes will live here.</h3><p>Create a workspace above, then upload or build your resume inside it.</p></div> : <div className="resume-rows">{resumes.map((resume) => <div className="resume-row" key={resume.id}><div className="resume-row-icon"><FileText size={20} /></div><div><h3>{resume.title}</h3><p>{resume.file_name ?? 'No file uploaded yet'} · {resume.status}</p></div><span className="resume-score">{resume.ats_score ? `${resume.ats_score}/100` : 'Not scored'}</span><ChevronRight size={18} /></div>)}</div>}</section></div>;
}

function FeaturePage({ eyebrow, title, body, icon, action, onAction }: { eyebrow: string; title: string; body: string; icon: React.ReactNode; action: string; onAction: () => void }) { return <div className="feature-page"><div className="feature-copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{body}</p><button className="primary-button" onClick={onAction}>{action} <ArrowUpRight size={17} /></button></div><div className="feature-art"><div className="feature-art-circle" /><div className="feature-icon">{icon}</div><span>COMING<br /><em>INTO<br />FOCUS</em></span></div></div>; }

function getInitials(value: string) { return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

export default App;
