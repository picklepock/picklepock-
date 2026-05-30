import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { CircleUser, LayoutDashboard, Zap, Crown, Compass, Bell, X, Check, Users, Trophy, MessageSquare, AlertTriangle, Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import Profil from './pages/Profil';
import Accueil from './pages/Accueil';
import Matches from './pages/Matches';
import Ranking from './pages/Ranking';
import Clubs from './pages/Clubs';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Help from './pages/Help';
import ClubDetail from './pages/ClubDetail';
import SettingsModal from './components/SettingsModal';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    const fetchNotifications = async (userId) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(0, 19);
        if (data) setNotifications(data);
    };

    useEffect(() => {
        if (!session) {
            setNotifications([]);
            return;
        }

        fetchNotifications(session.user.id);

        const channel = supabase
            .channel(`notifications:${session.user.id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${session.user.id}`
            }, () => {
                fetchNotifications(session.user.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const handleMarkAsRead = async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        if (!session) return;
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleApproveJoin = async (notif) => {
        try {
            const { data: match, error: matchErr } = await supabase
                .from('matches')
                .select('*')
                .eq('id', notif.match_id)
                .single();
            if (matchErr) throw matchErr;

            const { approveJoinRequest } = await import('./lib/matchHelpers');
            await approveJoinRequest(match, notif.actor_id, session);
            await handleMarkAsRead(notif.id);
            alert("Inscription approuvée !");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRejectJoin = async (notif) => {
        try {
            const { data: match, error: matchErr } = await supabase
                .from('matches')
                .select('*')
                .eq('id', notif.match_id)
                .single();
            if (matchErr) throw matchErr;

            const { rejectJoinRequest } = await import('./lib/matchHelpers');
            await rejectJoinRequest(match, notif.actor_id, session);
            await handleMarkAsRead(notif.id);
            alert("Inscription refusée.");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleValidateScore = async (notif) => {
        try {
            const { error } = await supabase.rpc('validate_match_score', {
                match_uuid: notif.match_id,
                validator_uuid: session.user.id
            });
            if (error) throw error;
            await handleMarkAsRead(notif.id);
            alert("Score validé et points attribués ! 🏆");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRejectScore = async (notif) => {
        try {
            const { error } = await supabase.rpc('reject_match_score', {
                match_uuid: notif.match_id,
                rejecter_uuid: session.user.id
            });
            if (error) throw error;
            await handleMarkAsRead(notif.id);
            alert("Score contesté. L'organisateur a été notifié.");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-sport-sky">
                <div className="w-10 h-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <Router>
            <div className="flex flex-col h-screen overflow-hidden bg-sport-sky font-['Plus_Jakarta_Sans']">
                
                {/* Header Fixe Native App */}
                <header className="fixed top-0 left-0 right-0 h-20 bg-sport-sky/95 backdrop-blur-xl border-b border-sport-sand flex items-center justify-between px-6 z-[60] safe-top">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-10 h-10 bg-white rounded-full border border-sport-sand flex items-center justify-center text-sport-navy shadow-sm active:scale-90 transition-transform"
                            title="Paramètres"
                        >
                            <Settings size={20} />
                        </button>
                        <div className="w-10 h-10 bg-white rounded-2xl p-1.5 shadow-sm border border-sport-sand flex items-center justify-center">
                            <img src="/logo.png" alt="PicklePock Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-sport-navy tracking-tight uppercase leading-none">PicklePock</h1>
                            <p className="text-[9px] font-bold text-sport-mint uppercase tracking-[0.1em] mt-0.5 opacity-80">Circuit Elite</p>
                        </div>
                    </div>
                    {session ? (
                        <button 
                            onClick={() => setIsNotifDrawerOpen(true)}
                            className="w-10 h-10 bg-white rounded-full border border-sport-sand flex items-center justify-center text-sport-navy shadow-sm active:scale-90 transition-transform relative"
                        >
                            <Bell size={20} strokeWidth={2.5} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ) : (
                        <div className="w-10 h-10" />
                    )}
                </header>

                <main className="flex-grow overflow-y-auto mt-20 pb-32 scrollbar-none bg-sport-sky">
                    <Routes>
                        <Route path="/" element={<Accueil session={session} />} />
                        <Route path="/profil" element={<Profil session={session} />} />
                        <Route path="/matches" element={<Matches session={session} />} />
                        <Route path="/ranking" element={<Ranking />} />
                        <Route path="/clubs" element={<Clubs session={session} />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/update-password" element={<UpdatePassword />} />
                        <Route path="/help" element={<Help session={session} />} />
                        <Route path="/clubs/:id" element={<ClubDetail session={session} />} />
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

                {/* NOTIFICATION SLIDE-OVER DRAWER */}
                {isNotifDrawerOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="w-full max-w-md bg-sport-beige h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-white/10">
                            <div className="p-6 border-b border-sport-sand flex items-center justify-between bg-white/70">
                                <div>
                                    <h2 className="text-xl font-bold text-sport-navy tracking-tight">Notifications</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Votre fil d'actualité</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={handleMarkAllAsRead}
                                            className="text-[9px] font-black text-sport-green uppercase tracking-widest bg-sport-green/10 px-3 py-2 rounded-xl hover:bg-sport-green hover:text-white transition-all"
                                        >
                                            Tout lire
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setIsNotifDrawerOpen(false)}
                                        className="p-2.5 bg-white rounded-2xl text-slate-400 hover:text-sport-navy transition-colors shadow-sm"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-5 rounded-3xl border transition-all ${
                                                notif.is_read 
                                                    ? 'bg-white/40 border-sport-sand/40 opacity-70' 
                                                    : 'bg-white border-sport-sand shadow-md shadow-sport-navy/5'
                                            }`}
                                        >
                                            <div className="flex items-start space-x-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-sport-beige flex items-center justify-center text-xl shrink-0 shadow-inner">
                                                    {notif.type === 'join_request' && <Users size={18} className="text-sport-blue" />}
                                                    {notif.type === 'join_confirmed' && <Check size={18} className="text-sport-green" />}
                                                    {notif.type === 'leave_match' && <AlertTriangle size={18} className="text-amber-500" />}
                                                    {notif.type === 'score_validation' && <Trophy size={18} className="text-amber-500" />}
                                                    {notif.type === 'score_validated' && <Trophy size={18} className="text-sport-green" />}
                                                    {notif.type === 'score_rejected' && <AlertTriangle size={18} className="text-rose-500" />}
                                                    {notif.type === 'request_approved' && <Check size={18} className="text-sport-green" />}
                                                    {notif.type === 'request_rejected' && <X size={18} className="text-rose-500" />}
                                                    {notif.type === 'new_post' && <MessageSquare size={18} className="text-sport-green" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-xs text-sport-navy tracking-tight truncate">{notif.title}</h3>
                                                        <span className="text-[8px] text-slate-400 font-bold uppercase shrink-0 ml-2">
                                                            {new Date(notif.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{notif.content}</p>

                                                    {/* ACTION BUTTONS */}
                                                    {!notif.is_read && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {notif.type === 'join_request' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleApproveJoin(notif)}
                                                                        className="px-3.5 py-1.5 bg-sport-green text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sport-green/90 transition-all flex items-center space-x-1"
                                                                    >
                                                                        <Check size={10} strokeWidth={3} />
                                                                        <span>Accepter</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleRejectJoin(notif)}
                                                                        className="px-3.5 py-1.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all flex items-center space-x-1"
                                                                    >
                                                                        <X size={10} strokeWidth={3} />
                                                                        <span>Refuser</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {notif.type === 'score_validation' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleValidateScore(notif)}
                                                                        className="px-3.5 py-1.5 bg-sport-green text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sport-green/90 transition-all flex items-center space-x-1"
                                                                    >
                                                                        <Check size={10} strokeWidth={3} />
                                                                        <span>Valider</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleRejectScore(notif)}
                                                                        className="px-3.5 py-1.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all flex items-center space-x-1"
                                                                    >
                                                                        <X size={10} strokeWidth={3} />
                                                                        <span>Contester</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {notif.type === 'new_post' ? (
                                                                <button 
                                                                    onClick={async () => {
                                                                        await handleMarkAsRead(notif.id);
                                                                        setIsNotifDrawerOpen(false);
                                                                        window.location.href = `/profil?id=${notif.actor_id}`;
                                                                    }}
                                                                    className="px-3 py-1 bg-sport-green text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sport-green/90 transition-all shadow-sm"
                                                                >
                                                                    Voir le profil
                                                                </button>
                                                            ) : (
                                                                !['join_request', 'score_validation'].includes(notif.type) && (
                                                                    <button 
                                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                                        className="px-3 py-1 bg-sport-sand text-sport-navy text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sport-sand/80 transition-all"
                                                                    >
                                                                        Marquer comme lu
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-sport-sand/30 rounded-[2.5rem] flex items-center justify-center text-2xl opacity-40 grayscale border border-sport-sand">🔔</div>
                                        <h3 className="text-sm font-bold text-sport-navy">Rien pour l'instant</h3>
                                        <p className="text-slate-400 text-xs max-w-[200px] italic">Vous recevrez des alertes d'inscription et de scores ici.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </div>
        </Router>
    );
}

export default App;
