import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { User, Home, Trophy, BarChart3, MapPin } from 'lucide-react';
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
            <div className="min-h-screen flex items-center justify-center bg-sport-beige">
                <div className="w-8 h-8 border-4 border-sport-green border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-sport-beige pb-20">
                <main className="flex-grow">
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

                {/* Bottom Navigation Moderne - CLUB HOUSE STYLE */}
                <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-sport-sand flex items-center justify-around px-2 z-50 shadow-2xl shadow-sport-navy/10 sm:h-20">
                    <NavLink to="/profil" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <User size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-sport-green transition-all scale-110' : 'text-slate-300'} />
                                <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] transition-all ${isActive ? 'text-sport-navy' : 'text-slate-300'}`}>Profil</span>
                                <div className="nav-dot bg-sport-green"></div>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <Home size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-sport-green transition-all scale-110' : 'text-slate-300'} />
                                <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] transition-all ${isActive ? 'text-sport-navy' : 'text-slate-300'}`}>Club</span>
                                <div className="nav-dot bg-sport-green"></div>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/matches" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <Trophy size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-sport-green transition-all scale-110' : 'text-slate-300'} />
                                <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] transition-all ${isActive ? 'text-sport-navy' : 'text-slate-300'}`}>Matchs</span>
                                <div className="nav-dot bg-sport-green"></div>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/ranking" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <BarChart3 size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-sport-green transition-all scale-110' : 'text-slate-300'} />
                                <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] transition-all ${isActive ? 'text-sport-navy' : 'text-slate-300'}`}>Circuit</span>
                                <div className="nav-dot bg-sport-green"></div>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/clubs" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <MapPin size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-sport-green transition-all scale-110' : 'text-slate-300'} />
                                <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] transition-all ${isActive ? 'text-sport-navy' : 'text-slate-300'}`}>Mapping</span>
                                <div className="nav-dot bg-sport-green"></div>
                            </>
                        )}
                    </NavLink>
                </nav>
            </div>
        </Router>
    );
}

export default App;
