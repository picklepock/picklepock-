import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { CircleUser, LayoutDashboard, Zap, Crown, Compass, Bell, BellOff, X, Check, Users, Trophy, MessageSquare, AlertTriangle, Settings, Calendar } from 'lucide-react';
import { supabase } from './lib/supabase';
import Profil from './pages/Profil';
import Accueil from './pages/Accueil';
import Matches from './pages/Matches';
import Agenda from './pages/Agenda';
import Ranking from './pages/Ranking';
import Clubs from './pages/Clubs';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Help from './pages/Help';
import ClubDetail from './pages/ClubDetail';
import SettingsModal from './components/SettingsModal';

import Actualites from './pages/Actualites';

function App() {
    const navigate = useNavigate();
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
            <div className="h-screen w-screen flex items-center justify-center" style={{background: 'linear-gradient(160deg, #f8f5ef 0%, #edf4ff 100%)'}}>
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-14 h-14">
                        <img src="/logo.png" alt="PicklePock" className="w-14 h-14 object-contain" />
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#C6F432]/30 animate-ping" />
                    </div>
                    <div className="w-6 h-0.5 bg-[#C6F432]/30 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C6F432] rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="flex flex-col h-screen overflow-hidden font-['Plus_Jakarta_Sans']">
                
                {/* ── HEADER PREMIUM ── */}
                <header className="pp-header fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-5 z-[60] safe-top" style={{minHeight: '4rem'}}>
                    <div className="flex items-center gap-3">
                        {/* Settings */}
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="pp-press w-9 h-9 rounded-2xl flex items-center justify-center text-[var(--navy)] dark:text-white/70"
                            style={{background:'rgba(23,37,84,0.06)', border:'1px solid rgba(23,37,84,0.09)'}}
                            title="Paramètres"
                        >
                            <Settings size={17} strokeWidth={2} />
                        </button>

                        {/* Logo + Nom */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center" style={{background:'rgba(23,37,84,0.05)', border:'1px solid rgba(23,37,84,0.08)'}}>
                                <img src="/logo.png" alt="PicklePock" className="w-full h-full object-contain" />
                            </div>
                            <div className="leading-none">
                                <div className="text-[13px] font-black tracking-tight text-[var(--navy)] dark:text-white">PicklePock</div>
                                <div className="text-[8px] font-bold uppercase tracking-[0.18em] mt-0.5" style={{color:'var(--lime-dim)'}}>Circuit Elite</div>
                            </div>
                        </div>
                    </div>

                    {/* Bell */}
                    {session ? (
                        <button 
                            onClick={() => setIsNotifDrawerOpen(true)}
                            className="pp-press relative w-9 h-9 rounded-2xl flex items-center justify-center text-[var(--navy)] dark:text-white/70"
                            style={{background:'rgba(23,37,84,0.06)', border:'1px solid rgba(23,37,84,0.09)'}}
                        >
                            <Bell size={17} strokeWidth={2} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center" style={{border:'2px solid var(--sand)'}}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    ) : (
                        <div className="w-9 h-9" />
                    )}
                </header>

                <main className="flex-grow overflow-y-auto mt-16 pb-32 scrollbar-none">
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
                        <Route path="/actualites" element={<Actualites />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                {/* ── DOCK NAVIGATION PREMIUM ── */}
                <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 z-50 pointer-events-none">
                    <nav className="pp-dock max-w-xs mx-auto h-[4rem] rounded-[2rem] flex items-center justify-around px-3 pointer-events-auto">

                        {[  
                            { to: '/profil',  Icon: CircleUser,      label: 'Profil' },
                            { to: '/',        Icon: LayoutDashboard, label: 'Accueil' },
                            { to: '/matches', Icon: Zap,             label: 'Matchs' },
                            { to: '/ranking', Icon: Crown,           label: 'Ranks' },
                            { to: '/clubs',   Icon: Compass,         label: 'Clubs' },
                        ].map(({ to, Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                className="bottom-nav-item flex-1"
                            >
                                {({ isActive }) => (
                                    <div className={`relative flex flex-col items-center gap-0.5 transition-all duration-300 ${
                                        isActive ? 'scale-110' : 'opacity-40 hover:opacity-60'
                                    }`}>
                                        <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                                            isActive
                                                ? 'pp-nav-active text-[var(--navy)]'
                                                : 'text-white'
                                        }`}>
                                            <Icon
                                                size={20}
                                                strokeWidth={isActive ? 2.5 : 1.8}
                                                className={isActive ? 'animate-bounce-subtle' : ''}
                                            />
                                        </div>
                                        {isActive && (
                                            <span className="text-[7px] font-black uppercase tracking-widest" style={{color:'var(--lime)'}}>
                                                {label}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* ── NOTIFICATION DRAWER PREMIUM ── */}
                {isNotifDrawerOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex justify-end"
                        style={{background:'rgba(11,4,28,0.55)', backdropFilter:'blur(12px)'}}
                        onClick={(e) => e.target === e.currentTarget && setIsNotifDrawerOpen(false)}
                    >
                        <div className="pp-animate-slide w-full max-w-sm h-full flex flex-col" style={{background:'var(--sand)', borderLeft:'1px solid rgba(23,37,84,0.08)'}}>
                            {/* Header drawer */}
                            <div className="px-5 py-5 flex items-center justify-between" style={{borderBottom:'1px solid rgba(23,37,84,0.07)', background:'rgba(255,255,255,0.7)', backdropFilter:'blur(20px)'}}>
                                <div>
                                    <h2 className="text-base font-black text-[var(--navy)] tracking-tight">Notifications</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] mt-0.5" style={{color:'rgba(23,37,84,0.35)'}}>Fil d'activité</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={handleMarkAllAsRead}
                                            className="pp-btn-lime text-[8px] px-3 py-1.5"
                                        >
                                            Tout lire
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setIsNotifDrawerOpen(false)}
                                        className="pp-press w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{background:'rgba(23,37,84,0.06)', border:'1px solid rgba(23,37,84,0.08)'}}
                                    >
                                        <X size={15} strokeWidth={2.5} className="text-[var(--navy)]/50" />
                                    </button>
                                </div>
                            </div>

                            {/* Liste notifications */}
                            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-2.5">
                                {notifications.length > 0 ? (
                                    notifications.map((notif, i) => (
                                        <div 
                                            key={notif.id}
                                            className={`pp-card rounded-2xl p-4 transition-all pp-animate-float`}
                                            style={{animationDelay:`${i*0.04}s`, opacity: notif.is_read ? 0.55 : 1}}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icône */}
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(23,37,84,0.06)', border:'1px solid rgba(23,37,84,0.07)'}}>
                                                    {notif.type === 'join_request'   && <Users size={16} style={{color:'var(--navy-mid)'}} />}
                                                    {notif.type === 'join_confirmed' && <Check size={16} style={{color:'var(--lime-dim)'}} />}
                                                    {notif.type === 'leave_match'    && <AlertTriangle size={16} className="text-amber-500" />}
                                                    {notif.type === 'score_validation' && <Trophy size={16} className="text-amber-500" />}
                                                    {notif.type === 'score_validated'  && <Trophy size={16} style={{color:'var(--lime-dim)'}} />}
                                                    {notif.type === 'score_rejected'   && <AlertTriangle size={16} className="text-rose-500" />}
                                                    {notif.type === 'request_approved' && <Check size={16} style={{color:'var(--lime-dim)'}} />}
                                                    {notif.type === 'request_rejected' && <X size={16} className="text-rose-500" />}
                                                    {notif.type === 'new_post' && <MessageSquare size={16} style={{color:'var(--lime-dim)'}} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-bold text-[11px] text-[var(--navy)] dark:text-white truncate">{notif.title}</h3>
                                                        <span className="text-[8px] font-bold uppercase tracking-wider shrink-0" style={{color:'rgba(23,37,84,0.3)'}}>
                                                            {new Date(notif.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] mt-1 leading-relaxed" style={{color:'rgba(23,37,84,0.5)'}}>{notif.content}</p>

                                                    {!notif.is_read && (
                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {notif.type === 'join_request' && (
                                                                <>
                                                                    <button onClick={() => handleApproveJoin(notif)} className="pp-btn-lime text-[8px] px-3 py-1.5 flex items-center gap-1">
                                                                        <Check size={9} strokeWidth={3} /><span>Accepter</span>
                                                                    </button>
                                                                    <button onClick={() => handleRejectJoin(notif)} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-rose-500 transition-all flex items-center gap-1" style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.15)'}}>
                                                                        <X size={9} strokeWidth={3}/><span>Refuser</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {notif.type === 'score_validation' && (
                                                                <>
                                                                    <button onClick={() => handleValidateScore(notif)} className="pp-btn-lime text-[8px] px-3 py-1.5 flex items-center gap-1">
                                                                        <Check size={9} strokeWidth={3}/><span>Valider</span>
                                                                    </button>
                                                                    <button onClick={() => handleRejectScore(notif)} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-amber-600 transition-all flex items-center gap-1" style={{background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)'}}>
                                                                        <X size={9} strokeWidth={3}/><span>Contester</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {notif.type === 'new_post' && (
                                                                <button onClick={async () => { await handleMarkAsRead(notif.id); setIsNotifDrawerOpen(false); navigate(`/profil?id=${notif.actor_id}`); }} className="pp-btn-lime text-[8px] px-3 py-1.5">
                                                                    Voir le profil
                                                                </button>
                                                            )}
                                                            {!['join_request','score_validation','new_post'].includes(notif.type) && (
                                                                <button onClick={() => handleMarkAsRead(notif.id)} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all" style={{background:'rgba(23,37,84,0.06)', border:'1px solid rgba(23,37,84,0.08)', color:'rgba(23,37,84,0.5)'}}>
                                                                    Marquer comme lu
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:'rgba(23,37,84,0.05)', border:'1px solid rgba(23,37,84,0.07)'}}>
                                            <BellOff size={24} style={{color:'rgba(23,37,84,0.2)'}} strokeWidth={1.5}/>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--navy)]">Rien pour l'instant</h3>
                                            <p className="text-[11px] mt-1 max-w-[180px] mx-auto" style={{color:'rgba(23,37,84,0.4)'}}>Vos alertes d'inscription et de scores apparaîtront ici.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </div>
        );
}

export default App;
