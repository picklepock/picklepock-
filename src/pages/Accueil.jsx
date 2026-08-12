import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Check, X, Trophy, Users, AlertTriangle, ArrowRight, Zap, Hand, MapPin,
    Calendar, Newspaper, Shield, Compass, ChevronRight, Clock, ExternalLink, PlusCircle, Activity, Flame, Sparkles, MessageCircle, Heart, Share2
} from 'lucide-react';
import { approveJoinRequest, rejectJoinRequest } from '../lib/matchHelpers';

// Featured news items for top carousel
const FEATURED_NEWS = [
    {
        id: 1,
        tag: 'Matériel 2026',
        tagColor: 'bg-emerald-500 text-white',
        title: 'Top 5 des meilleures raquettes & Boutiques',
        desc: 'Tests complets, avis pro & accès direct aux boutiques agréées.',
        image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 2,
        tag: 'Événement Pro',
        tagColor: 'bg-amber-500 text-white',
        title: 'Open National PicklePock 2026 à Paris',
        desc: 'Plus de 128 équipes. Inscriptions ouvertes sur le site officiel !',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 3,
        tag: 'Nouveau Club',
        tagColor: 'bg-blue-500 text-white',
        title: 'Inauguration du Club Lyon Lumière',
        desc: '4 courts synthétiques et club-house panoramique.',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'
    }
];

const Accueil = ({ session }) => {
    const navigate = useNavigate();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingScores, setPendingScores] = useState([]);
    const [myUpcomingMatches, setMyUpcomingMatches] = useState([]);
    const [myClub, setMyClub] = useState(null);
    const [loadingClub, setLoadingClub] = useState(true);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [recentCommunityPosts, setRecentCommunityPosts] = useState([]);
    const [activeNewsIndex, setActiveNewsIndex] = useState(0);

    useEffect(() => {
        if (session?.user?.id) {
            fetchActions();
            fetchUserClub();
            fetchUserProfile();
            fetchMyUpcomingMatches();
        }
        fetchCommunityActivity();
    }, [session]);

    // Carousel auto rotation for featured news
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveNewsIndex((prev) => (prev + 1) % FEATURED_NEWS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const fetchUserProfile = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('username, avatar_url, level')
                .eq('id', session.user.id)
                .maybeSingle();
            if (data) setUserProfile(data);
        } catch (e) {
            console.error("Erreur profil accueil:", e);
        }
    };

    const fetchUserClub = async () => {
        setLoadingClub(true);
        try {
            const { data: memberData } = await supabase
                .from('club_members')
                .select('club_id, role, club:clubs(*)')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (memberData?.club) {
                setMyClub({ ...memberData.club, role: memberData.role });
            } else {
                setMyClub(null);
            }
        } catch (err) {
            console.error("Erreur chargement club utilisateur:", err);
            setMyClub(null);
        } finally {
            setLoadingClub(false);
        }
    };

    const fetchActions = async () => {
        try {
            const { data: reqs } = await supabase
                .from('match_participants')
                .select('*, match:matches!inner(*), user:profiles(username, avatar_url)')
                .eq('status', 'pending')
                .eq('match.creator_id', session.user.id);

            const { data: scores } = await supabase
                .from('match_participants')
                .select('*, match:matches!inner(*)')
                .eq('status', 'confirmed')
                .eq('user_id', session.user.id)
                .eq('match.status', 'played')
                .eq('match.score_status', 'pending')
                .neq('match.score_reporter_id', session.user.id);

            if (reqs) setPendingRequests(reqs);
            if (scores) setPendingScores(scores);
        } catch (err) {
            console.error("Erreur chargement actions requises:", err);
        }
    };

    const fetchMyUpcomingMatches = async () => {
        setLoadingMatches(true);
        try {
            const { data: parts, error } = await supabase
                .from('match_participants')
                .select(`
                    status,
                    match:matches(
                        *,
                        creator:profiles!matches_creator_id_fkey(username, avatar_url),
                        participants:match_participants(
                            user_id,
                            status,
                            user:profiles(username, avatar_url)
                        )
                    )
                `)
                .eq('user_id', session.user.id)
                .in('status', ['confirmed', 'pending']);

            if (error) throw error;

            if (parts) {
                const upcoming = parts
                    .map(p => ({
                        ...p.match,
                        myParticipantStatus: p.status
                    }))
                    .filter(m => m && (m.status === 'open' || m.status === 'scheduled' || m.status === 'full'))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 4);

                setMyUpcomingMatches(upcoming);
            }
        } catch (err) {
            console.error("Erreur prochains matchs:", err);
        } finally {
            setLoadingMatches(false);
        }
    };

    const fetchCommunityActivity = async () => {
        try {
            const { data } = await supabase
                .from('player_posts')
                .select('*, author:profiles(username, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(4);

            if (data) setRecentCommunityPosts(data);
        } catch (e) {
            console.error("Erreur post communauté:", e);
        }
    };

    const handleAcceptRequest = async (req) => {
        try {
            await approveJoinRequest(req.match, req.user_id, session);
            alert("Joueur accepté dans la partie !");
            fetchActions();
            fetchMyUpcomingMatches();
        } catch (err) { alert(err.message); }
    };

    const handleRejectRequest = async (req) => {
        try {
            await rejectJoinRequest(req.match, req.user_id, session);
            alert("Demande refusée.");
            fetchActions();
        } catch (err) { alert(err.message); }
    };

    const handleValidateScore = async (matchId) => {
        try {
            const { error } = await supabase.rpc('validate_match_score', {
                match_uuid: matchId, validator_uuid: session.user.id
            });
            if (error) throw error;
            alert("Score validé ! 🏆");
            fetchActions();
        } catch (err) { alert(err.message); }
    };

    const handleRejectScore = async (matchId) => {
        try {
            const { error } = await supabase.rpc('reject_match_score', {
                match_uuid: matchId, rejecter_uuid: session.user.id
            });
            if (error) throw error;
            alert("Score contesté.");
            fetchActions();
        } catch (err) { alert(err.message); }
    };

    const hasActions = pendingRequests.length > 0 || pendingScores.length > 0;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Pickler';
    const currentNews = FEATURED_NEWS[activeNewsIndex];

    return (
        <div className="min-h-full pb-28 px-4 pt-4 space-y-6 max-w-lg mx-auto">

            {/* ── 1. CARROUSEL ACTUALITÉ À LA UNE (TOUT EN HAUT & IMPRESSIONNANT) ── */}
            <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                        <Flame size={18} className="text-amber-500 animate-pulse" />
                        <span className="font-black text-sm uppercase tracking-wider text-[var(--navy)] dark:text-white">
                            À la Une
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/actualites')}
                        className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-[var(--lime)] flex items-center gap-1 hover:underline"
                    >
                        Voir les actus <ArrowRight size={12} />
                    </button>
                </div>

                <div
                    onClick={() => navigate('/actualites')}
                    className="relative rounded-[30px] overflow-hidden cursor-pointer shadow-2xl group border border-white/20 h-56 transition-all duration-500"
                >
                    <img
                        src={currentNews.image}
                        alt={currentNews.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b041c] via-[#0f172a]/60 to-transparent" />

                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${currentNews.tagColor}`}>
                            {currentNews.tag}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/40 backdrop-blur-md text-white border border-white/20">
                            Flashtrend
                        </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                        <h2 className="text-xl font-black leading-tight drop-shadow-md group-hover:text-[var(--lime)] transition-colors">
                            {currentNews.title}
                        </h2>
                        <p className="text-xs text-white/80 font-medium line-clamp-1">
                            {currentNews.desc}
                        </p>
                    </div>

                    <div className="absolute bottom-3 right-4 flex gap-1.5">
                        {FEATURED_NEWS.map((_, idx) => (
                            <span
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNewsIndex(idx);
                                }}
                                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                                    activeNewsIndex === idx ? 'bg-[var(--lime)] w-5' : 'bg-white/40'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 2. BANNER DE BIENVENUE FUN & CHILL (EPURÉE) ── */}
            <section className="rounded-[28px] p-5 relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 text-white shadow-md">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            {greeting}, {username} 👋
                        </h1>
                        <p className="text-white/85 text-xs font-semibold mt-0.5">
                            Prêt pour une session de jeu aujourd'hui ? 🎾
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                        PicklePock Zone
                    </span>
                </div>
            </section>

            {/* ── 3. NOTIFICATIONS (SI REPONSES OU ACTIONS) ── */}
            {session && hasActions && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                        <span className="pp-section-label">Réponses & Notifications</span>
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            {pendingRequests.length + pendingScores.length}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="pp-card rounded-2xl p-4 border-l-4 border-l-rose-500 bg-white dark:bg-white/5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <img
                                        src={req.user?.avatar_url || '/logo.png'}
                                        alt=""
                                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                                        onError={(e)=>{e.target.src='/logo.png'}}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-xs text-[var(--navy)] dark:text-white">Demande de participation</h4>
                                            <span className="text-[10px] text-slate-400 font-semibold">{req.match?.time?.slice(0,5)}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                            <span className="font-black text-[var(--navy)] dark:text-white">{req.user?.username || 'Un joueur'}</span> souhaite rejoindre votre match du <span className="font-bold">{new Date(req.match?.date).toLocaleDateString('fr-FR')}</span> à {req.match?.location}.
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => handleAcceptRequest(req)} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm hover:bg-emerald-700">
                                                <Check size={13} strokeWidth={3} /> Accepter
                                            </button>
                                            <button onClick={() => handleRejectRequest(req)} className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1.5 hover:bg-rose-50">
                                                <X size={13} strokeWidth={3} /> Refuser
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pendingScores.map((scorePart) => (
                            <div key={scorePart.id} className="pp-card rounded-2xl p-4 border-l-4 border-l-amber-500 bg-white dark:bg-white/5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                        <Trophy size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs text-[var(--navy)] dark:text-white">Validation de score requise</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                            Score proposé : <span className="font-black text-[var(--navy)] dark:text-white">{scorePart.match?.score_team_a} — {scorePart.match?.score_team_b}</span> pour le match à {scorePart.match?.location}.
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => handleValidateScore(scorePart.match_id)} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5">
                                                <Check size={13} strokeWidth={3} /> Confirmer le score
                                            </button>
                                            <button onClick={() => handleRejectScore(scorePart.match_id)} className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                                                <AlertTriangle size={13} /> Contester
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── 4. SECTION "MES PROCHAINS MATCHS" (STYLÉE EN RELIEF BLEU ÉLECTRIQUE) ── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <span className="pp-section-label flex items-center gap-1.5">
                        <Calendar size={15} className="text-blue-600 dark:text-blue-400" /> Mes prochains matchs
                    </span>
                    <button
                        onClick={() => navigate('/profil')}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[var(--navy)] dark:hover:text-white flex items-center gap-1"
                    >
                        Mon Agenda <ArrowRight size={10} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        onClick={() => navigate('/matches')}
                        className="py-3 px-4 rounded-2xl bg-[var(--lime)] text-[var(--navy)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[var(--lime-dim)] transition-all shadow-md active:scale-[0.98]"
                    >
                        <Zap size={15} fill="currentColor" />
                        Trouver un match
                    </button>
                    <button
                        onClick={() => navigate('/matches')}
                        className="py-3 px-4 rounded-2xl bg-[var(--navy)] text-white dark:bg-white/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all border border-white/10 active:scale-[0.98]"
                    >
                        <PlusCircle size={15} />
                        Créer une partie
                    </button>
                </div>

                {loadingMatches ? (
                    <div className="pp-card rounded-2xl p-4 text-center text-xs text-slate-400">
                        Chargement de vos matchs programmés...
                    </div>
                ) : myUpcomingMatches.length > 0 ? (
                    <div className="space-y-2">
                        {myUpcomingMatches.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => navigate('/matches')}
                                className="relative rounded-[18px] px-3.5 py-2.5 bg-gradient-to-r from-white via-blue-50/40 to-indigo-50/30 dark:from-white/10 dark:via-white/5 dark:to-blue-950/20 border border-slate-200/80 dark:border-white/15 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden"
                            >
                                {/* Liseré néon bleu sur le côté */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-[18px]" />

                                <div className="pl-1.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm ${
                                                m.myParticipantStatus === 'pending'
                                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                                    : 'bg-blue-600 text-white shadow-blue-500/20'
                                            }`}>
                                                {m.myParticipantStatus === 'pending' ? 'Demande envoyée' : 'Inscrit & Confirmé'}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                {m.type === 'double' ? 'Double 2v2' : 'Simple 1v1'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 flex items-center gap-1">
                                            <Clock size={10} /> {m.time?.slice(0,5)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-0.5">
                                        <div>
                                            <h4 className="font-bold text-xs text-[var(--navy)] dark:text-white group-hover:text-blue-600 transition-colors capitalize">
                                                {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                <MapPin size={10} className="text-blue-500 shrink-0" />
                                                {m.location || 'Terrain non spécifié'}
                                            </p>
                                        </div>

                                        <span className="text-[9px] font-bold text-slate-400">
                                            {m.participants?.length || 1} participant(s)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="pp-card rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Aucun match programmé pour le moment
                        </p>
                    </div>
                )}
            </section>

            {/* ── 5. FIL D'ACTIVITÉ DE LA COMMUNAUTÉ (AVEC RELIEF STYLÉ ÉMERAUDE) ── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <span className="pp-section-label flex items-center gap-1.5">
                        <Activity size={15} className="text-emerald-500" /> Activité récente de la communauté
                    </span>
                    <button
                        onClick={() => navigate('/profil')}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[var(--navy)] dark:hover:text-white flex items-center gap-1"
                    >
                        Fil complet <ArrowRight size={10} />
                    </button>
                </div>

                {recentCommunityPosts.length > 0 ? (
                    <div className="space-y-2.5">
                        {recentCommunityPosts.map((post) => (
                            <div
                                key={post.id}
                                className="relative rounded-[18px] p-3.5 bg-gradient-to-r from-white via-slate-50/80 to-blue-50/40 dark:from-white/10 dark:via-white/5 dark:to-blue-900/10 border border-slate-200/90 dark:border-white/15 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                            >
                                {/* Liseré néon vert émeraude sur le côté */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-l-[18px]" />

                                <div className="pl-1.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[10px] shrink-0 border border-emerald-500/20">
                                                {post.author?.username?.charAt(0)?.toUpperCase() || 'P'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs text-[var(--navy)] dark:text-white group-hover:text-emerald-600 transition-colors">
                                                    {post.author?.username || 'Membre PicklePock'}
                                                </h4>
                                                <span className="text-[9px] font-semibold text-slate-400">
                                                    {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Statut
                                        </span>
                                    </div>

                                    <div className="bg-white/80 dark:bg-black/20 px-3 py-2 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
                                        <p className="text-xs text-slate-800 dark:text-slate-100 leading-snug font-semibold">
                                            "{post.content}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="pp-card rounded-2xl p-5 text-center bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            La communauté est calme. Partagez votre premier statut depuis votre profil !
                        </p>
                    </div>
                )}
            </section>

            {/* ── 6. SECTION "MON CLUB" ── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <span className="pp-section-label flex items-center gap-1.5">
                        <Shield size={14} className="text-emerald-500" /> Mon Club
                    </span>
                    <button
                        onClick={() => navigate('/clubs')}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[var(--navy)] dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                        Tous les clubs <ArrowRight size={10} />
                    </button>
                </div>

                {loadingClub ? (
                    <div className="pp-card rounded-2xl p-5 text-center text-xs text-slate-400">
                        Chargement des informations du club...
                    </div>
                ) : myClub ? (
                    <div
                        onClick={() => navigate(`/clubs/${myClub.id}`)}
                        className="pp-card rounded-2xl p-4 cursor-pointer group hover:border-emerald-500/40 transition-all duration-300 bg-white dark:bg-white/5 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-13 h-13 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-md">
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center">
                                    {myClub.image_url || myClub.logo_url ? (
                                        <img src={myClub.image_url || myClub.logo_url} alt={myClub.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield size={22} className="text-emerald-600 dark:text-emerald-400" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-sm text-[var(--navy)] dark:text-white truncate">
                                        {myClub.name}
                                    </h3>
                                    {myClub.role && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                                            {myClub.role === 'admin' ? 'Organisateur' : 'Membre'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin size={11} className="text-slate-400 shrink-0" />
                                    {myClub.city || myClub.location || 'Club local'}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pp-card rounded-2xl p-4 text-center space-y-2 bg-white/70 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Vous ne faites partie d'aucun club pour le moment.
                        </p>
                        <button
                            onClick={() => navigate('/clubs')}
                            className="py-2 px-4 rounded-xl bg-[var(--navy)] text-white dark:bg-[var(--lime)] dark:text-[var(--navy)] font-bold text-xs inline-flex items-center gap-2 hover:opacity-90 transition-all"
                        >
                            <Compass size={13} />
                            Découvrir les clubs proches
                        </button>
                    </div>
                )}
            </section>

        </div>
    );
};

export default Accueil;
