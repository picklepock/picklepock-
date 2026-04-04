import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { CircleUser, LayoutDashboard, Zap, Crown, Compass } from 'lucide-react';
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

                {/* Bottom Navigation Moderne - CLUB HOUSE PRESTIGE */}
                <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-sport-sand flex items-center justify-around px-2 z-50 shadow-2xl shadow-sport-navy/10 sm:h-20">
                    <NavLink to="/profil" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20 -translate-y-2' : 'text-slate-300 hover:bg-sport-beige'}`}>
                                    <CircleUser size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                                <span className={`text-[8px] font-black mt-1 uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-sport-navy opacity-100' : 'opacity-0 -translate-y-2'}`}>Profil</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20 -translate-y-2' : 'text-slate-300 hover:bg-sport-beige'}`}>
                                    <LayoutDashboard size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                                <span className={`text-[8px] font-black mt-1 uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-sport-navy opacity-100' : 'opacity-0 -translate-y-2'}`}>Club</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/matches" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20 -translate-y-2' : 'text-slate-300 hover:bg-sport-beige'}`}>
                                    <Zap size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                                <span className={`text-[8px] font-black mt-1 uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-sport-navy opacity-100' : 'opacity-0 -translate-y-2'}`}>Action</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/ranking" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20 -translate-y-2' : 'text-slate-300 hover:bg-sport-beige'}`}>
                                    <Crown size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                                <span className={`text-[8px] font-black mt-1 uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-sport-navy opacity-100' : 'opacity-0 -translate-y-2'}`}>Elite</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/clubs" className={({ isActive }) => `bottom-nav-item sm:h-full ${isActive ? 'active' : ''}`}>
                        {({ isActive }) => (
                            <>
                                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20 -translate-y-2' : 'text-slate-300 hover:bg-sport-beige'}`}>
                                    <Compass size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-bounce-subtle' : ''} />
                                </div>
                                <span className={`text-[8px] font-black mt-1 uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-sport-navy opacity-100' : 'opacity-0 -translate-y-2'}`}>Spots</span>
                            </>
                        )}
                    </NavLink>
                </nav>
            </div>
        </Router>
    );
}

export default App;
