import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, 
    Trophy, Users, Check, X, MessageSquare, Plus, Sparkles, Zap, Shield, Flame
} from 'lucide-react';
import MyMatchesAgenda from '../components/MyMatchesAgenda';

const Agenda = ({ session }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDateMatches, setSelectedDateMatches] = useState(null);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' ou 'list'

    // État pour modal de score
    const [matchForScore, setMatchForScore] = useState(null);
    const [scoreA, setScoreA] = useState(11);
    const [scoreB, setScoreB] = useState(9);
    const [submittingScore, setSubmittingScore] = useState(false);

    // Profil joueur pour XP
    const [userProfile, setUserProfile] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const fetchMatches = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            // Récupérer le profil
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (prof) setUserProfile(prof);

            // Récupérer tous les matchs du joueur
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
                            user:profiles(id, username, avatar_url)
                        )
                    )
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'confirmed');

            if (error) throw error;
            if (parts) {
                const list = parts.map(p => p.match).filter(Boolean);
                setMatches(list);
            }
        } catch (err) {
            console.error("Erreur chargement matchs agenda:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [session?.user?.id]);

    // Calcul du calendrier du mois
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Décalage pour démarrer le Lundi (0 = Lundi, 6 = Dimanche)
    let startingDayIndex = firstDayOfMonth.getDay() - 1;
    if (startingDayIndex === -1) startingDayIndex = 6; // Dimanche devient 6

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Formater une date YYYY-MM-DD
    const formatDateKey = (dayNum) => {
        const m = (month + 1).toString().padStart(2, '0');
        const d = dayNum.toString().padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    // Trouver les matchs pour un jour donné
    const getMatchesForDay = (dayNum) => {
        const dateKey = formatDateKey(dayNum);
        return matches.filter(m => {
            if (!m.date) return false;
            // Support formats YYYY-MM-DD or ISO
            const mDate = m.date.slice(0, 10);
            return mDate === dateKey;
        });
    };

    // Soumission de score
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
            setMatchForScore(null);
            fetchMatches();
            alert("Score enregistré et envoyé pour confirmation ! 🏆");
        } catch (err) {
            alert("Erreur : " + err.message);
        } finally {
            setSubmittingScore(false);
        }
    };

    return (
        <div className="min-h-screen bg-sport-sand p-4 sm:p-8 pb-28 text-sport-navy">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* EN-TÊTE ÉDITORIAL & LUXE */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sport-navy/10 pb-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sport-navy/40">
                            PicklePock Circuit 2026
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-serif italic text-sport-navy tracking-tight mt-1">
                            Mon Agenda
                        </h1>
                    </div>

                    {/* Mode d'affichage */}
                    <div className="flex bg-white/60 p-1.5 rounded-2xl border border-sport-navy/10 shadow-sm">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                viewMode === 'calendar' 
                                    ? 'bg-sport-navy text-white shadow-md' 
                                    : 'text-slate-400 hover:text-sport-navy'
                            }`}
                        >
                            Vue Calendrier
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                viewMode === 'list' 
                                    ? 'bg-sport-navy text-white shadow-md' 
                                    : 'text-slate-400 hover:text-sport-navy'
                            }`}
                        >
                            Vue Liste
                        </button>
                    </div>
                </div>

                {/* VUE CALENDRIER GRILLE MOIS */}
                {viewMode === 'calendar' ? (
                    <div className="bg-white rounded-[3rem] p-6 sm:p-10 border border-sport-navy/10 shadow-2xl space-y-8">
                        {/* Navigation du mois */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-3xl sm:text-5xl font-serif text-sport-navy tracking-tight">
                                    {monthNames[month]}
                                </h2>
                                <span className="text-2xl sm:text-3xl font-light text-slate-400 font-serif">
                                    {year}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={prevMonth}
                                    className="p-3 bg-sport-sand/50 rounded-2xl text-sport-navy hover:bg-sport-navy hover:text-white transition-all shadow-sm active:scale-95"
                                    title="Mois précédent"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    onClick={nextMonth}
                                    className="p-3 bg-sport-sand/50 rounded-2xl text-sport-navy hover:bg-sport-navy hover:text-white transition-all shadow-sm active:scale-95"
                                    title="Mois suivant"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Grille du Calendrier */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                {/* En-tête des jours de la semaine (Style éditorial) */}
                                <div className="grid grid-cols-7 border-b border-sport-navy/20 pb-3 mb-2 text-center">
                                    {daysOfWeek.map((day, idx) => (
                                        <div key={idx} className="font-serif italic text-sm text-slate-500 font-medium">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Grille des jours (5 ou 6 semaines) */}
                                <div className="grid grid-cols-7 border-t border-l border-sport-navy/10 rounded-2xl overflow-hidden">
                                    {/* Cases vides début de mois */}
                                    {Array.from({ length: startingDayIndex }).map((_, i) => (
                                        <div 
                                            key={`empty-start-${i}`} 
                                            className="h-28 sm:h-36 border-r border-b border-sport-navy/10 bg-sport-sand/20"
                                        />
                                    ))}

                                    {/* Cases des jours du mois */}
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
                                                className={`h-28 sm:h-36 border-r border-b border-sport-navy/10 p-2 sm:p-3 flex flex-col justify-between transition-all group ${
                                                    dayMatches.length > 0 
                                                        ? 'hover:bg-sport-lime/10 cursor-pointer' 
                                                        : 'hover:bg-white'
                                                } ${isToday ? 'bg-sport-lime/15 ring-2 ring-sport-green/40' : 'bg-white'}`}
                                            >
                                                {/* Numéro du jour */}
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs sm:text-sm font-mono ${
                                                        isToday 
                                                            ? 'w-7 h-7 bg-sport-navy text-sport-lime rounded-full flex items-center justify-center font-bold shadow-md' 
                                                            : 'text-sport-navy/70 font-semibold'
                                                    }`}>
                                                        {dayNum.toString().padStart(2, '0')}
                                                    </span>

                                                    {dayMatches.length > 0 && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-sport-green text-sport-navy px-1.5 py-0.5 rounded-md shadow-sm">
                                                            {dayMatches.length} match{dayMatches.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Vignettes des matchs du jour */}
                                                <div className="space-y-1 overflow-y-auto max-h-20 scrollbar-hide">
                                                    {dayMatches.map((m) => (
                                                        <div 
                                                            key={m.id}
                                                            className={`p-1.5 rounded-xl border text-[9px] font-bold leading-tight flex items-center justify-between transition-transform group-hover:scale-102 ${
                                                                m.status === 'validated' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                                m.status === 'pending_validation' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                                'bg-sport-navy text-white border-sport-navy shadow-sm'
                                                            }`}
                                                        >
                                                            <span className="truncate max-w-[80px] sm:max-w-[100px]">
                                                                📍 {m.location || 'Terrain'}
                                                            </span>
                                                            <span className="font-mono text-[8px] opacity-75">
                                                                {m.time || '18:00'}
                                                            </span>
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
                    /* VUE LISTE AGENDA */
                    <div className="bg-white rounded-[3rem] p-6 sm:p-10 border border-sport-navy/10 shadow-2xl">
                        <MyMatchesAgenda session={session} />
                    </div>
                )}

            </div>

            {/* MODAL MATCHS DU JOUR SÉLECTIONNÉ */}
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

                        {/* Liste des matchs du jour */}
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

                                    {/* Statut & Score */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-500">Statut : <strong className="text-sport-navy">{m.status}</strong></span>
                                        {m.score_team_a !== null && (
                                            <span className="font-black text-sport-navy bg-white px-3 py-1 rounded-xl border shadow-sm">
                                                {m.score_team_a} - {m.score_team_b}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action score si terminé */}
                                    {(m.status === 'played' || m.status === 'scheduled') && (
                                        <button 
                                            onClick={() => {
                                                setMatchForScore(m);
                                                setSelectedDateMatches(null);
                                            }}
                                            className="w-full py-3 bg-sport-green text-sport-navy font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:bg-lime-400 transition-all"
                                        >
                                            Saisir / Modifier le score
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE SAISIE DE SCORE DÉDIÉ */}
            {matchForScore && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-sport-navy/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-6 sm:p-8 space-y-6 border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-sport-navy tracking-tight uppercase">Saisie du Score</h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">Entrez le résultat officiel</p>
                            </div>
                            <button 
                                onClick={() => setMatchForScore(null)}
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
                            className="w-full py-4 bg-sport-navy text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
                        >
                            Soumettre le score
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
