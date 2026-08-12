import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
    Calendar as CalendarIcon, Clock, MapPin, Trophy, Users, Check, X, AlertCircle, 
    ChevronRight, ChevronLeft, Sparkles, Shield, Flame, Award, MessageSquare, Zap, Loader2, LayoutGrid, List
} from 'lucide-react';

const MyMatchesAgenda = ({ session, onOpenChat }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Mode de vue dans le profil : 'calendar' (grille mois) ou 'categories' (liste onglets)
    const [viewMode, setViewMode] = useState('calendar');
    const [activeTab, setActiveTab] = useState('upcoming'); 

    // État pour la navigation du mois dans le calendrier
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateMatches, setSelectedDateMatches] = useState(null);
    const [selectedDateStr, setSelectedDateStr] = useState('');

    // État du modal de saisie de score
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [matchForScore, setMatchForScore] = useState(null);
    const [scoreA, setScoreA] = useState(11);
    const [scoreB, setScoreB] = useState(9);
    const [submittingScore, setSubmittingScore] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Profil du joueur connecté pour XP / Level / Fair-play
    const [userProfile, setUserProfile] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const fetchProfileAndMatches = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            // 1. Récupérer profil
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (prof) setUserProfile(prof);

            // 2. Récupérer les matchs où l'utilisateur participe
            const { data: parts, error } = await supabase
                .from('match_participants')
                .select(`
                    match_id,
                    team,
                    status,
                    match:matches(
                        *,
                        creator:profiles!matches_creator_id_fkey(id, username, avatar_url),
                        participants:match_participants(
                            user_id,
                            team,
                            status,
                            user:profiles(id, username, avatar_url, fair_play_score, level)
                        ),
                        confirmations:match_confirmations(*)
                    )
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'confirmed');

            if (error) throw error;
            if (parts) {
                const userMatchList = parts
                    .map(p => ({ ...p.match, userTeam: p.team }))
                    .filter(Boolean);

                setMatches(userMatchList);
            }
        } catch (err) {
            console.error("Erreur chargement agenda:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileAndMatches();
    }, [session?.user?.id]);

    // Filtrage des matchs selon les 4 catégories d'agenda
    const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'open' || m.status === 'full');
    const pendingScoreMatches = matches.filter(m => m.status === 'played');
    const pendingValidationMatches = matches.filter(m => m.status === 'pending_validation');
    const historyMatches = matches.filter(m => m.status === 'validated' || m.status === 'disputed');

    // Calcul de l'XP requise pour le niveau suivant
    const currentLevel = userProfile?.level || 1;
    const currentXp = userProfile?.xp || 0;
    const nextLevelXp = (currentLevel + 1) * 200;
    const levelProgress = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

    // Calculs grille calendrier
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    let startingDayIndex = firstDayOfMonth.getDay() - 1;
    if (startingDayIndex === -1) startingDayIndex = 6;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const formatDateKey = (dayNum) => {
        const m = (month + 1).toString().padStart(2, '0');
        const d = dayNum.toString().padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const getMatchesForDay = (dayNum) => {
        const dateKey = formatDateKey(dayNum);
        return matches.filter(m => {
            if (!m.date) return false;
            return m.date.slice(0, 10) === dateKey;
        });
    };

    // Soumission du score
    const handleSubmitScore = async () => {
        if (!matchForScore) return;
        setSubmittingScore(true);
        try {
            const { error } = await supabase.rpc('submit_match_score', {
                p_match_id: matchForScore.id,
                p_score_team_a: parseInt(scoreA),
                p_score_team_b: parseInt(scoreB)
            });

            if (error) throw error;

            setShowScoreModal(false);
            setMatchForScore(null);
            await fetchProfileAndMatches();
            alert("Score envoyé ! En attente de confirmation par l'adversaire. ⏳");
        } catch (err) {
            alert("Erreur lors de la soumission : " + err.message);
        } finally {
            setSubmittingScore(false);
        }
    };

    // Validation du score par l'adversaire
    const handleConfirmScore = async (matchId) => {
        setActionLoading(true);
        try {
            const { error } = await supabase.rpc('confirm_match_score', {
                p_match_id: matchId
            });
            if (error) throw error;
            await fetchProfileAndMatches();
            alert("Match confirmé avec succès ! Vous avez gagné vos XP ! 🎉");
        } catch (err) {
            alert("Erreur confirmation : " + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Header Gamification : XP, Niveau, Fair-Play */}
            <div className="relative overflow-hidden bg-gradient-to-br from-sport-navy via-sport-navy/95 to-slate-900 text-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sport-green/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Level & Avatar info */}
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sport-green to-lime-300 p-1 shadow-lg shadow-sport-green/30 flex items-center justify-center text-sport-navy font-black text-2xl">
                                {userProfile?.level || 1}
                            </div>
                            <span className="absolute -bottom-2 -right-1 px-2 py-0.5 bg-sport-green text-sport-navy text-[9px] font-black uppercase tracking-widest rounded-full shadow-md border border-white">
                                NIVEAU
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white">
                                    {userProfile?.username || 'Joueur'}
                                </h2>
                                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-sport-green border border-white/10">
                                    <Sparkles size={12} />
                                    <span>{userProfile?.xp || 0} XP</span>
                                </span>
                            </div>
                            
                            {/* Progress bar towards next level */}
                            <div className="mt-3 w-48 sm:w-64">
                                <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1">
                                    <span>Progression</span>
                                    <span>{userProfile?.xp || 0} / {nextLevelXp} XP</span>
                                </div>
                                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-sport-green to-lime-300 rounded-full transition-all duration-500 shadow-sm" 
                                        style={{ width: `${levelProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Fair-Play Badge */}
                    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
                        <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 min-w-[110px] flex flex-col items-center justify-center text-center">
                            <div className="flex items-center space-x-1 text-sport-green font-black text-lg">
                                <Shield size={16} />
                                <span>{userProfile?.fair_play_score || 100}%</span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 mt-0.5">
                                Fair-Play
                            </span>
                        </div>

                        <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 min-w-[110px] flex flex-col items-center justify-center text-center">
                            <div className="flex items-center space-x-1 text-white font-black text-lg">
                                <Trophy size={16} className="text-amber-400" />
                                <span>{userProfile?.matches_won || 0} / {userProfile?.matches_played || 0}</span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 mt-0.5">
                                Victoires
                            </span>
                        </div>

                        <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 min-w-[100px] flex flex-col items-center justify-center text-center">
                            <div className="flex items-center space-x-1 text-rose-400 font-black text-lg">
                                <Flame size={16} />
                                <span>{userProfile?.win_streak || 0} V</span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 mt-0.5">
                                Série
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRE DE SWITCH ENTRE VUE CALENDRIER DU MOIS ET VUE LISTE */}
            <div className="flex items-center justify-between bg-white p-2 rounded-[2rem] border border-sport-sand shadow-sm">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            viewMode === 'calendar'
                                ? 'bg-sport-navy text-white shadow-lg'
                                : 'text-slate-400 hover:text-sport-navy'
                        }`}
                    >
                        <LayoutGrid size={14} />
                        <span>Calendrier du Mois</span>
                    </button>
                    <button
                        onClick={() => setViewMode('categories')}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            viewMode === 'categories'
                                ? 'bg-sport-navy text-white shadow-lg'
                                : 'text-slate-400 hover:text-sport-navy'
                        }`}
                    >
                        <List size={14} />
                        <span>Vue Liste ({matches.length})</span>
                    </button>
                </div>
            </div>

            {/* CONTENU : VUE 1 - CALENDRIER MOIS STYLE ÉDITORIAL LUXE (IMAGE USER) */}
            {viewMode === 'calendar' ? (
                <div className="bg-white rounded-[3rem] p-6 sm:p-8 border border-sport-sand shadow-sm space-y-6">
                    {/* Header du Mois (Titre élégant style magazine) */}
                    <div className="flex items-center justify-between border-b border-sport-sand pb-4">
                        <div className="flex items-baseline space-x-3">
                            <h3 className="text-3xl sm:text-4xl font-serif text-sport-navy tracking-tight">
                                {monthNames[month]}
                            </h3>
                            <span className="text-xl font-serif italic text-slate-400">
                                {year}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={prevMonth}
                                className="p-2.5 bg-sport-sand/40 rounded-xl text-sport-navy hover:bg-sport-navy hover:text-white transition-all active:scale-95"
                                title="Mois précédent"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={nextMonth}
                                className="p-2.5 bg-sport-sand/40 rounded-xl text-sport-navy hover:bg-sport-navy hover:text-white transition-all active:scale-95"
                                title="Mois suivant"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Grille du Calendrier */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[650px]">
                            {/* Jours de la semaine */}
                            <div className="grid grid-cols-7 border-b border-slate-200 pb-2 mb-1 text-center">
                                {daysOfWeek.map((day, idx) => (
                                    <div key={idx} className="font-serif italic text-xs text-slate-500 font-medium">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Cases jours */}
                            <div className="grid grid-cols-7 border-t border-l border-slate-200 rounded-2xl overflow-hidden">
                                {Array.from({ length: startingDayIndex }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-24 sm:h-28 border-r border-b border-slate-200 bg-slate-50/50" />
                                ))}

                                {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                                    const dayNum = dayIdx + 1;
                                    const dayMatches = getMatchesForDay(dayNum);
                                    const isToday = 
                                        dayNum === new Date().getDate() && 
                                        month === new Date().getMonth() && 
                                        year === new Date().getFullYear();

                                    return (
                                        <div
                                            key={`day-${dayNum}`}
                                            onClick={() => {
                                                if (dayMatches.length > 0) {
                                                    setSelectedDateMatches(dayMatches);
                                                    setSelectedDateStr(`${dayNum} ${monthNames[month]} ${year}`);
                                                }
                                            }}
                                            className={`h-24 sm:h-28 border-r border-b border-slate-200 p-2 flex flex-col justify-between transition-all ${
                                                dayMatches.length > 0 
                                                    ? 'hover:bg-sport-green/10 cursor-pointer bg-emerald-50/20' 
                                                    : 'bg-white'
                                            } ${isToday ? 'bg-sport-green/15 ring-2 ring-sport-green/40' : ''}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs font-mono ${
                                                    isToday 
                                                        ? 'w-6 h-6 bg-sport-navy text-sport-green rounded-full flex items-center justify-center font-bold' 
                                                        : 'text-slate-500 font-bold'
                                                }`}>
                                                    {dayNum.toString().padStart(2, '0')}
                                                </span>

                                                {dayMatches.length > 0 && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-sport-green text-sport-navy px-1.5 py-0.5 rounded shadow-sm">
                                                        {dayMatches.length} M
                                                    </span>
                                                )}
                                            </div>

                                            {/* Matches mini vignettes */}
                                            <div className="space-y-1 overflow-y-auto max-h-16 scrollbar-hide">
                                                {dayMatches.map((m) => (
                                                    <div 
                                                        key={m.id}
                                                        className="p-1 rounded-lg bg-sport-navy text-white text-[8px] font-bold leading-none truncate flex justify-between items-center"
                                                    >
                                                        <span className="truncate">{m.location || 'Match'}</span>
                                                        <span className="text-sport-green font-mono text-[7px] ml-1">{m.time || '18h'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* CONTENU : VUE 2 - ONGLETS PAR CATÉGORIE */
                <div className="space-y-6">
                    <div className="flex bg-white/70 backdrop-blur-md p-1.5 rounded-[2rem] border border-sport-sand shadow-sm overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                                activeTab === 'upcoming' ? 'bg-sport-navy text-white shadow-xl' : 'text-slate-500'
                            }`}
                        >
                            <CalendarIcon size={12} />
                            <span>À Venir ({upcomingMatches.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('pending_validation')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                                activeTab === 'pending_validation' ? 'bg-sport-navy text-white shadow-xl' : 'text-slate-500'
                            }`}
                        >
                            <Zap size={12} className="text-amber-400" />
                            <span>À Valider ({pendingValidationMatches.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('pending_score')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                                activeTab === 'pending_score' ? 'bg-sport-navy text-white shadow-xl' : 'text-slate-500'
                            }`}
                        >
                            <Trophy size={12} />
                            <span>Saisir ({pendingScoreMatches.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                                activeTab === 'history' ? 'bg-sport-navy text-white shadow-xl' : 'text-slate-500'
                            }`}
                        >
                            <Clock size={12} />
                            <span>Historique ({historyMatches.length})</span>
                        </button>
                    </div>

                    {/* Liste des cartes selon l'onglet activeTab */}
                    <div className="space-y-4">
                        {activeTab === 'upcoming' && (
                            upcomingMatches.length > 0 ? (
                                upcomingMatches.map(m => <MatchCard key={m.id} match={m} type="upcoming" onChat={() => onOpenChat && onOpenChat(m)} />)
                            ) : <EmptyAgendaState message="Aucun match à venir." />
                        )}

                        {activeTab === 'pending_validation' && (
                            pendingValidationMatches.length > 0 ? (
                                pendingValidationMatches.map(m => (
                                    <MatchCard 
                                        key={m.id} 
                                        match={m} 
                                        type="pending_validation" 
                                        session={session}
                                        onConfirm={() => handleConfirmScore(m.id)}
                                        actionLoading={actionLoading}
                                    />
                                ))
                            ) : <EmptyAgendaState message="Aucun score en attente de validation." />
                        )}

                        {activeTab === 'pending_score' && (
                            pendingScoreMatches.length > 0 ? (
                                pendingScoreMatches.map(m => (
                                    <MatchCard 
                                        key={m.id} 
                                        match={m} 
                                        type="pending_score" 
                                        onOpenScoreModal={() => {
                                            setMatchForScore(m);
                                            setShowScoreModal(true);
                                        }}
                                    />
                                ))
                            ) : <EmptyAgendaState message="Aucun match prêt pour la saisie de score." />
                        )}

                        {activeTab === 'history' && (
                            historyMatches.length > 0 ? (
                                historyMatches.map(m => <MatchCard key={m.id} match={m} type="history" />)
                            ) : <EmptyAgendaState message="Historique vide." />
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DU JOUR SÉLECTIONNÉ DANS LA GRILLE */}
            {selectedDateMatches && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-sport-navy/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-6 sm:p-8 space-y-6 border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-sport-green bg-sport-green/10 px-3 py-1 rounded-full">
                                    Matchs du jour
                                </span>
                                <h3 className="text-xl font-serif italic text-sport-navy tracking-tight mt-1">
                                    {selectedDateStr}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setSelectedDateMatches(null)}
                                className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                            {selectedDateMatches.map((m) => (
                                <div key={m.id} className="bg-sport-beige/40 p-5 rounded-3xl border border-sport-sand space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <MapPin size={16} className="text-sport-green" />
                                            <h4 className="font-bold text-sport-navy text-sm">{m.location || 'Terrain Pickleball'}</h4>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-400">
                                            ⏰ {m.time || '18:00'}
                                        </span>
                                    </div>

                                    {(m.status === 'played' || m.status === 'scheduled') && (
                                        <button 
                                            onClick={() => {
                                                setMatchForScore(m);
                                                setShowScoreModal(true);
                                                setSelectedDateMatches(null);
                                            }}
                                            className="w-full py-3 bg-sport-green text-sport-navy font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:bg-lime-400 transition-all"
                                        >
                                            Saisir le score
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE SAISIE DU SCORE */}
            {(showScoreModal || matchForScore) && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-sport-navy/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-6 sm:p-8 space-y-6 border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-sport-navy tracking-tight uppercase">Saisie du Score</h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">Indiquez le score final de la partie</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowScoreModal(false);
                                    setMatchForScore(null);
                                }}
                                className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-sport-beige/40 p-5 rounded-3xl border border-sport-sand flex flex-col items-center space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Équipe A</span>
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                                        className="w-10 h-10 rounded-2xl bg-white shadow-md font-black text-lg text-sport-navy"
                                    >
                                        -
                                    </button>
                                    <span className="text-3xl font-black text-sport-navy w-12 text-center">{scoreA}</span>
                                    <button 
                                        onClick={() => setScoreA(scoreA + 1)}
                                        className="w-10 h-10 rounded-2xl bg-sport-green text-sport-navy shadow-md font-black text-lg"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="bg-sport-beige/40 p-5 rounded-3xl border border-sport-sand flex flex-col items-center space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Équipe B</span>
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                                        className="w-10 h-10 rounded-2xl bg-white shadow-md font-black text-lg text-sport-navy"
                                    >
                                        -
                                    </button>
                                    <span className="text-3xl font-black text-sport-navy w-12 text-center">{scoreB}</span>
                                    <button 
                                        onClick={() => setScoreB(scoreB + 1)}
                                        className="w-10 h-10 rounded-2xl bg-sport-green text-sport-navy shadow-md font-black text-lg"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmitScore}
                            disabled={submittingScore}
                            className="w-full py-4 bg-sport-navy text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                        >
                            {submittingScore ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            <span>Soumettre pour validation</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MatchCard = ({ match, type, session, onChat, onOpenScoreModal, onConfirm, actionLoading }) => {
    const isSubmittedByMe = match.score_submitted_by === session?.user?.id;

    return (
        <div className="bg-white rounded-3xl p-5 border border-sport-sand shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-sport-beige flex items-center justify-center text-sport-navy font-bold shadow-inner">
                        <CalendarIcon size={18} />
                    </div>
                    <div>
                        <h4 className="font-black text-sport-navy text-sm tracking-tight">{match.location || 'Terrain de Pickleball'}</h4>
                        <div className="flex items-center text-[10px] text-slate-400 font-bold space-x-2 mt-0.5">
                            <span className="flex items-center space-x-1">
                                <Clock size={12} />
                                <span>{match.date || 'Date à définir'} à {match.time || '18:00'}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                    {type === 'upcoming' ? 'À Venir' : type === 'pending_validation' ? 'En Validation' : type === 'pending_score' ? 'À Saisir' : 'Terminé'}
                </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {onChat && (
                    <button onClick={onChat} className="p-2 bg-sport-beige text-sport-navy rounded-xl hover:bg-sport-sand text-xs flex items-center space-x-1.5 font-bold">
                        <MessageSquare size={14} />
                        <span>Chat</span>
                    </button>
                )}

                {type === 'pending_score' && onOpenScoreModal && (
                    <button onClick={onOpenScoreModal} className="px-4 py-2 bg-sport-green text-sport-navy rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                        Saisir le score
                    </button>
                )}

                {type === 'pending_validation' && (
                    isSubmittedByMe ? (
                        <span className="text-[10px] font-bold text-amber-600 italic">⏳ En attente de l'adversaire</span>
                    ) : (
                        <button onClick={onConfirm} disabled={actionLoading} className="px-4 py-2 bg-sport-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center space-x-1">
                            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            <span>Confirmer le score</span>
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

const EmptyAgendaState = ({ message }) => (
    <div className="bg-white/50 border border-dashed border-slate-200 rounded-[2.5rem] p-10 text-center space-y-2">
        <CalendarIcon size={28} className="mx-auto text-slate-300" />
        <p className="text-xs font-bold text-slate-400">{message}</p>
    </div>
);

export default MyMatchesAgenda;
