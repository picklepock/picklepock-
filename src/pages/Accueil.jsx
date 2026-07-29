import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, X, Trophy, Users, AlertTriangle, ArrowRight, Zap, Hand, MapPin, Crown, CalendarDays, Medal } from 'lucide-react';
import { approveJoinRequest, rejectJoinRequest } from '../lib/matchHelpers';

const Accueil = ({ session }) => {
    const navigate = useNavigate();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingScores, setPendingScores] = useState([]);
    const [loadingActions, setLoadingActions] = useState(false);

    useEffect(() => {
        if (session) fetchActions();
    }, [session]);

    const fetchActions = async () => {
        setLoadingActions(true);
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
        } finally {
            setLoadingActions(false);
        }
    };

    const handleAcceptRequest = async (req) => {
        try {
            await approveJoinRequest(req.match, req.user_id, session);
            alert("Joueur accepté !");
            fetchActions();
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
            alert("Score validé, vos points ont été ajoutés ! 🏆");
            fetchActions();
        } catch (err) { alert(err.message); }
    };

    const handleRejectScore = async (matchId) => {
        try {
            const { error } = await supabase.rpc('reject_match_score', {
                match_uuid: matchId, rejecter_uuid: session.user.id
            });
            if (error) throw error;
            alert("Score contesté. L'organisateur a été notifié.");
            fetchActions();
        } catch (err) { alert(err.message); }
    };

    const hasActions = pendingRequests.length > 0 || pendingScores.length > 0;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <div className="min-h-full pb-28 px-4 pt-4 space-y-5 max-w-lg mx-auto">

            {/* ── HERO GREETING ── */}
            <section className="pp-animate-float pp-card rounded-[28px] overflow-hidden" style={{animationDelay:'0s'}}>
                <div className="pp-bg-hero relative p-6 overflow-hidden">
                    {/* Orbes décoratifs */}
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20"
                        style={{background:'radial-gradient(circle, #C6F432 0%, transparent 70%)'}} />
                    <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full opacity-10"
                        style={{background:'radial-gradient(circle, #60a5fa 0%, transparent 70%)'}} />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">PicklePock Circuit Elite</p>
                            <h1 className="text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                                {greeting} <Hand size={22} className="inline-block" style={{color:'var(--lime)'}}/>
                            </h1>
                            <p className="text-white/50 text-xs mt-1.5 font-medium">
                                Prêt pour votre prochain match ?
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0"
                            style={{border:'1px solid rgba(198,244,50,0.2)', background:'rgba(255,255,255,0.05)'}}>
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                    </div>

                    {/* Stats rapides */}
                    <div className="relative z-10 mt-5 flex gap-3">
                        {[
                            { label: 'Matchs joués', value: '—' },
                            { label: 'Rang', value: '—' },
                            { label: 'Club', value: '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex-1 rounded-2xl px-3 py-2.5 text-center"
                                style={{background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.08)'}}>
                                <div className="text-base font-black text-white">{value}</div>
                                <div className="text-[8px] font-bold uppercase tracking-wider text-white/35 mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ACTIONS REQUISES ── */}
            {session && hasActions && (
                <section className="space-y-3 pp-animate-float" style={{animationDelay:'0.05s'}}>
                    <div className="flex items-center gap-2 px-1">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        <span className="pp-section-label">Actions requises</span>
                        <span className="ml-auto pp-badge pp-badge-navy text-[8px] px-2 py-0.5">
                            {pendingRequests.length + pendingScores.length}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {/* Demandes de participation */}
                        {pendingRequests.map((req, i) => (
                            <div key={req.id}
                                className="pp-card rounded-2xl p-4 pp-animate-float"
                                style={{animationDelay:`${i * 0.05}s`, borderLeft:'3px solid rgba(244,63,94,0.4)'}}>
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.15)'}}>
                                        <Users size={16} className="text-rose-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[11px] text-[var(--navy)] tracking-tight">Demande d'inscription</h4>
                                        <p className="text-[10px] mt-1 leading-relaxed" style={{color:'rgba(23,37,84,0.5)'}}>
                                            <span className="font-bold text-[var(--navy)]">{req.user?.username || 'Joueur'}</span>{' '}
                                            souhaite rejoindre votre match du{' '}
                                            {new Date(req.match.date).toLocaleDateString('fr-FR')} à {req.match.time?.slice(0,5)}{' '}
                                            <span className="inline-flex items-center gap-1"><MapPin size={9} className="inline"/> {req.match.location}</span>
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => handleAcceptRequest(req)}
                                                className="pp-btn-lime text-[8px] px-3 py-1.5 flex items-center gap-1">
                                                <Check size={9} strokeWidth={3} /><span>Accepter</span>
                                            </button>
                                            <button onClick={() => handleRejectRequest(req)}
                                                className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-rose-500 flex items-center gap-1"
                                                style={{background:'rgba(244,63,94,0.07)', border:'1px solid rgba(244,63,94,0.14)'}}>
                                                <X size={9} strokeWidth={3} /><span>Refuser</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Validation de scores */}
                        {pendingScores.map((scorePart, i) => (
                            <div key={scorePart.id}
                                className="pp-card rounded-2xl p-4 pp-animate-float"
                                style={{animationDelay:`${(pendingRequests.length + i) * 0.05}s`, borderLeft:'3px solid rgba(245,158,11,0.4)'}}>
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.18)'}}>
                                        <Trophy size={16} className="text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[11px] text-[var(--navy)] tracking-tight">Score à valider</h4>
                                        <p className="text-[10px] mt-1 leading-relaxed" style={{color:'rgba(23,37,84,0.5)'}}>
                                            Score{' '}
                                            <span className="font-bold text-[var(--navy)]">
                                                {scorePart.match.score_team_a} — {scorePart.match.score_team_b}
                                            </span>{' '}
                                            • {new Date(scorePart.match.date).toLocaleDateString('fr-FR')} <span className="inline-flex items-center gap-1"><MapPin size={9} className="inline"/> {scorePart.match.location}</span>
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => handleValidateScore(scorePart.match_id)}
                                                className="pp-btn-lime text-[8px] px-3 py-1.5 flex items-center gap-1">
                                                <Check size={9} strokeWidth={3} /><span>Valider</span>
                                            </button>
                                            <button onClick={() => handleRejectScore(scorePart.match_id)}
                                                className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-amber-600 flex items-center gap-1"
                                                style={{background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)'}}>
                                                <AlertTriangle size={9} strokeWidth={2.5} /><span>Contester</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── ÉVÉNEMENTS À LA UNE ── */}
            <section className="space-y-3 pp-animate-float" style={{animationDelay:'0.1s'}}>
                <div className="flex items-center justify-between px-1">
                    <span className="pp-section-label">Événements à la une</span>
                    <button className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                        style={{color:'var(--lime-dim)'}}>
                        Voir tout <ArrowRight size={10} strokeWidth={3} />
                    </button>
                </div>

                <div className="pp-card rounded-[24px] overflow-hidden group cursor-pointer"
                    style={{transition:'all 0.3s var(--transition-smooth)'}}>
                    <div className="relative h-40 overflow-hidden">
                        <img
                            src="/assets/images/tournament.png"
                            alt="Tournoi de Pickleball"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.style.background = 'linear-gradient(150deg, #172554 0%, #1e3a8a 100%)';
                            }}
                        />
                        <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(23,37,84,0.6) 0%, transparent 60%)'}} />
                        <div className="absolute top-3 left-3">
                            <span className="pp-badge pp-badge-lime">Bientôt</span>
                        </div>
                    </div>
                    <div className="p-5">
                        <h3 className="text-lg font-black text-[var(--navy)] tracking-tight">Open Régional 2026</h3>
                        <p className="text-[11px] mt-1 leading-relaxed" style={{color:'rgba(23,37,84,0.5)'}}>
                            Inscriptions ouvertes pour le circuit amateur de printemps.
                        </p>
                        <div className="mt-3 flex items-center gap-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{color:'rgba(23,37,84,0.4)'}}>
                                <CalendarDays size={11}/> 22 Mars
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{color:'rgba(23,37,84,0.4)'}}>
                                <MapPin size={11}/> Paris Sud
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── RACCOURCIS ── */}
            <section className="space-y-3 pp-animate-float" style={{animationDelay:'0.15s'}}>
                <span className="pp-section-label px-1 block">Raccourcis</span>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { Icon: Trophy, label: 'Mes Matchs',    path: '/profil',  accent: 'rgba(198,244,50,0.1)', accentBorder: 'rgba(198,244,50,0.2)', iconColor:'var(--lime-dim)' },
                        { Icon: MapPin, label: 'Clubs Proches', path: '/clubs',   accent: 'rgba(96,165,250,0.1)', accentBorder: 'rgba(96,165,250,0.2)', iconColor:'#60a5fa' },
                        { Icon: Zap,    label: 'Nouveau Match', path: '/matches', accent: 'rgba(244,63,94,0.08)', accentBorder: 'rgba(244,63,94,0.15)', iconColor:'#f43f5e' },
                        { Icon: Crown,  label: 'Classement',    path: '/ranking', accent: 'rgba(245,158,11,0.1)', accentBorder: 'rgba(245,158,11,0.2)', iconColor:'#f59e0b' },
                    ].map(({ Icon, label, path, accent, accentBorder, iconColor }, i) => (
                        <button key={path}
                            onClick={() => navigate(path)}
                            className="pp-card pp-press rounded-2xl p-4 flex flex-col items-center gap-3 pp-animate-float"
                            style={{animationDelay:`${0.15 + i * 0.04}s`}}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{background: accent, border:`1px solid ${accentBorder}`}}>
                                <Icon size={22} style={{color: iconColor}} strokeWidth={1.8} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--navy)]">{label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── CTA PRO ── */}
            <section className="pp-animate-float" style={{animationDelay:'0.2s'}}>
                <div className="pp-bg-hero rounded-[24px] p-6 relative overflow-hidden">
                    {/* Orbe */}
                    <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full"
                        style={{background:'radial-gradient(circle, rgba(198,244,50,0.15) 0%, transparent 70%)'}} />
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center font-black text-white/10 text-2xl select-none italic">P</div>

                    <div className="relative z-10">
                        <div className="pp-badge pp-badge-lime mb-3">Circuit Pro</div>
                        <h2 className="text-xl font-black text-white tracking-tight mb-1">Devenir Pro ?</h2>
                        <p className="text-white/45 text-[11px] mb-5 max-w-[180px] leading-relaxed">
                            Rejoignez le classement national et défiez les meilleurs joueurs.
                        </p>
                        <button onClick={() => navigate('/ranking')}
                            className="pp-btn-lime flex items-center gap-2">
                            <Zap size={12} strokeWidth={2.5} />
                            En savoir plus
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Accueil;
