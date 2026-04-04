import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { CircleUser, LayoutDashboard, Zap, Crown, Compass, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';
import Profil from './pages/Profil';
import Accueil from './pages/Accueil';
import Matches from './pages/Matches';
import Ranking from './pages/Ranking';
import Clubs from './pages/Clubs';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Help from './pages/Help';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-sport-beige">
                <div className="w-10 h-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Router>
            <div className="flex flex-col h-screen overflow-hidden bg-sport-beige font-['Plus_Jakarta_Sans']">
                
                {/* Header Fixe Native App */}
                <header className="fixed top-0 left-0 right-0 h-20 bg-sport-beige/95 backdrop-blur-xl border-b border-sport-sand flex items-center justify-between px-6 z-[60] safe-top">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white rounded-2xl p-1.5 shadow-sm border border-sport-sand flex items-center justify-center">
                            <img src="/logo.png" alt="PicklePock Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-sport-navy tracking-tight uppercase leading-none">PicklePock</h1>
                            <p className="text-[9px] font-bold text-sport-mint uppercase tracking-[0.1em] mt-0.5 opacity-80">Circuit Elite</p>
                        </div>
                    </div>
                    <button className="w-10 h-10 bg-white rounded-full border border-sport-sand flex items-center justify-center text-sport-navy shadow-sm active:scale-90 transition-transform">
                        <Bell size={20} strokeWidth={2.5} />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto mt-20 pb-32 scrollbar-none">
                    <Routes>
                        <Route path="/" element={<Accueil />} />
                        <Route path="/profil" element={<Profil session={session} />} />
                        <Route path="/matches" element={<Matches session={session} />} />
                        <Route path="/ranking" element={<Ranking />} />
                        <Route path="/clubs" element={<Clubs />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/update-password" element={<UpdatePassword />} />
                        <Route path="/help" element={<Help session={session} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                {/* Bottom Navigation Dock Native style */}
                <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 z-50 pointer-events-none">
                    <nav className="max-w-md mx-auto h-[4.5rem] bg-sport-navy/95 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-around px-2 shadow-2xl border border-white/5 pointer-events-auto">
                        <NavLink to="/profil" className={({ isActive }) => `bottom-nav-item h-full flex flex-col items-center justify-center flex-1 transition-all`}>
                            {({ isActive }) => (
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white text-sport-navy shadow-lg scale-110' : 'text-white/40'}`}>
                                    <CircleUser size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                            )}
                        </NavLink>

                        <NavLink to="/" className={({ isActive }) => `bottom-nav-item h-full flex flex-col items-center justify-center flex-1 transition-all`}>
                            {({ isActive }) => (
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white text-sport-navy shadow-lg scale-110' : 'text-white/40'}`}>
                                    <LayoutDashboard size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                            )}
                        </NavLink>

                        <NavLink to="/matches" className={({ isActive }) => `bottom-nav-item h-full flex flex-col items-center justify-center flex-1 transition-all`}>
                            {({ isActive }) => (
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white text-sport-navy shadow-lg scale-110' : 'text-white/40'}`}>
                                    <Zap size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                            )}
                        </NavLink>

                        <NavLink to="/ranking" className={({ isActive }) => `bottom-nav-item h-full flex flex-col items-center justify-center flex-1 transition-all`}>
                            {({ isActive }) => (
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white text-sport-navy shadow-lg scale-110' : 'text-white/40'}`}>
                                    <Crown size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                            )}
                        </NavLink>

                        <NavLink to="/clubs" className={({ isActive }) => `bottom-nav-item h-full flex flex-col items-center justify-center flex-1 transition-all`}>
                            {({ isActive }) => (
                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white text-sport-navy shadow-lg scale-110' : 'text-white/40'}`}>
                                    <Compass size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                            )}
                        </NavLink>
                    </nav>
                </div>
            </div>
        </Router>
    );
}

export default App;
