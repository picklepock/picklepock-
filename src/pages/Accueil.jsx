import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Trophy, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { approveJoinRequest, rejectJoinRequest } from '../lib/matchHelpers';

const Accueil = ({ session }) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingScores, setPendingScores] = useState([]);
    const [loadingActions, setLoadingActions] = useState(false);

    useEffect(() => {
        if (session) {
            fetchActions();
        }
    }, [session]);

    const fetchActions = async () => {
        setLoadingActions(true);
        try {
            // 1. Demandes en attente pour les matchs créés par le user
            const { data: reqs } = await supabase
                .from('match_participants')
                .select('*, match:matches!inner(*), user:profiles(username, avatar_url)')
                .eq('status', 'pending')
                .eq('match.creator_id', session.user.id);

            // 2. Scores à valider (match joué par le user, reporter != user)
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
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRejectRequest = async (req) => {
        try {
            await rejectJoinRequest(req.match, req.user_id, session);
            alert("Demande refusée.");
            fetchActions();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleValidateScore = async (matchId) => {
        try {
            const { error } = await supabase.rpc('validate_match_score', {
                match_uuid: matchId,
                validator_uuid: session.user.id
            });
            if (error) throw error;
            alert("Score validé, vos points ont été ajoutés ! 🏆");
            fetchActions();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRejectScore = async (matchId) => {
        try {
            const { error } = await supabase.rpc('reject_match_score', {
                match_uuid: matchId,
                rejecter_uuid: session.user.id
            });
            if (error) throw error;
            alert("Score contesté. L'organisateur a été notifié.");
            fetchActions();
        } catch (err) {
            alert(err.message);
        }
    };

    const hasActions = pendingRequests.length > 0 || pendingScores.length > 0;

    return (
        <div className="p-6 pb-24 space-y-8 max-w-lg mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-sport-navy tracking-tight">Bonjour 👋</h1>
                    <p className="text-slate-500 mt-1 italic font-medium">Prêt pour votre prochain match ?</p>
                </div>
                <div className="p-2 bg-white rounded-2xl shadow-sm border border-sport-sand">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
            </header>

            {/* SECTION ACTIONS REQUISES */}
            {session && hasActions && (
                <section className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center space-x-2 px-1">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Actions requises</h2>
                    </div>

                    <div className="space-y-3">
                        {/* Demandes de participation */}
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="bg-white p-5 rounded-3xl border border-rose-100 shadow-md shadow-rose-500/5 flex items-start space-x-4">
                                <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                    <Users size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-xs text-sport-navy tracking-tight">Demande d'inscription</h4>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        <span className="font-bold text-sport-navy">{req.user?.username || 'Joueur'}</span> souhaite rejoindre votre match du {new Date(req.match.date).toLocaleDateString('fr-FR')} à {req.match.time.slice(0, 5)} (📍 {req.match.location}).
                                    </p>
                                    <div className="mt-4 flex space-x-2">
                                        <button 
                                            onClick={() => handleAcceptRequest(req)}
                                            className="px-4 py-2 bg-sport-green text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sport-green/90 transition-all flex items-center space-x-1"
                                        >
                                            <Check size={12} strokeWidth={3} />
                                            <span>Accepter</span>
                                        </button>
                                        <button 
                                            onClick={() => handleRejectRequest(req)}
                                            className="px-4 py-2 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all flex items-center space-x-1"
                                        >
                                            <X size={12} strokeWidth={3} />
                                            <span>Refuser</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Validation de scores */}
                        {pendingScores.map((scorePart) => (
                            <div key={scorePart.id} className="bg-white p-5 rounded-3xl border border-amber-100 shadow-md shadow-amber-500/5 flex items-start space-x-4">
                                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                    <Trophy size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-xs text-sport-navy tracking-tight">Score à valider</h4>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Un score de <span className="font-bold text-sport-navy">{scorePart.match.score_team_a} - {scorePart.match.score_team_b}</span> a été saisi pour votre match du {new Date(scorePart.match.date).toLocaleDateString('fr-FR')} (📍 {scorePart.match.location}).
                                    </p>
                                    <div className="mt-4 flex space-x-2">
                                        <button 
                                            onClick={() => handleValidateScore(scorePart.match_id)}
                                            className="px-4 py-2 bg-sport-green text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sport-green/90 transition-all flex items-center space-x-1"
                                        >
                                            <Check size={12} strokeWidth={3} />
                                            <span>Valider le score</span>
                                        </button>
                                        <button 
                                            onClick={() => handleRejectScore(scorePart.match_id)}
                                            className="px-4 py-2 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all flex items-center space-x-1"
                                        >
                                            <AlertTriangle size={12} strokeWidth={2.5} />
                                            <span>Contester</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Événements à la une</h2>
                    <button className="text-sport-green text-sm font-bold hover:underline transition-all">Voir tout</button>
                </div>

                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-sport-sand group cursor-pointer transition-all hover:shadow-lg hover:border-sport-green/20">
                    <div className="relative h-48 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1626225965071-8231c1ca9248?q=80&w=600&h=400&auto=format&fit=crop"
                            alt="Tournoi de Pickleball"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 bg-sport-green text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-sport-green/20">Bientôt</div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-2xl font-bold text-sport-navy mb-1">Open Régional 2026</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">Inscriptions ouvertes pour le circuit amateur de printemps.</p>
                        <div className="flex items-center text-xs font-bold text-slate-400 space-x-6">
                            <span className="flex items-center">🟢 22 Mars</span>
                            <span className="flex items-center">📍 Paris Sud</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Raccourcis</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => window.location.href = '/profil'}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-sport-sand flex flex-col items-center justify-center space-y-4 hover:shadow-md hover:border-sport-green/20 transition-all active:scale-95 group"
                    >
                        <div className="w-14 h-14 bg-sport-beige rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-sport-green group-hover:text-white transition-all">🏆</div>
                        <span className="font-bold text-sport-navy text-xs uppercase tracking-wider">Mes Matchs</span>
                    </button>
                    <button 
                        onClick={() => window.location.href = '/clubs'}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-sport-sand flex flex-col items-center justify-center space-y-4 hover:shadow-md hover:border-sport-green/20 transition-all active:scale-95 group"
                    >
                        <div className="w-14 h-14 bg-sport-beige rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-sport-green group-hover:text-white transition-all">📍</div>
                        <span className="font-bold text-sport-navy text-xs uppercase tracking-wider">Clubs Proches</span>
                    </button>
                </div>
            </section>

            <section className="bg-sport-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-sport-navy/10 ring-1 ring-white/10">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2 tracking-tight">Devenir Pro ?</h2>
                    <p className="text-slate-300 text-xs mb-8 max-w-[180px] leading-relaxed opacity-80">Rejoignez le classement national et défiez les meilleurs joueurs.</p>
                    <button 
                        onClick={() => window.location.href = '/ranking'}
                        className="bg-sport-green text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-sport-green/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        En savoir plus
                    </button>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-sport-green/10 rounded-full blur-3xl"></div>
                <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center italic font-bold text-white/20 select-none text-2xl">P</div>
            </section>
        </div>
    );
};

export default Accueil;

