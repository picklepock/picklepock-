import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trophy, Calendar, MapPin, Users, Filter, X, Check, Clock } from 'lucide-react';

const Matches = ({ session }) => {
    const [view, setView] = useState('matchs');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [clubs, setClubs] = useState([]);
    const [matches, setMatches] = useState([]);
    const [matchData, setMatchData] = useState({
        date: '',
        time: '',
        location: '',
        players_count: '2',
        category: 'Intermédiaire'
    });

    useEffect(() => {
        fetchClubs();
        fetchMatches();
    }, []);

    const fetchClubs = async () => {
        const { data } = await supabase.from('clubs').select('*').order('name');
        if (data) setClubs(data);
    };

    const fetchMatches = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    creator:profiles(username, avatar_url)
                `)
                .eq('status', 'open')
                .order('date', { ascending: true });
            
            if (error) throw error;
            if (data) setMatches(data);
        } catch (err) {
            console.error("Erreur chargement matchs:", err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleCreateMatch = async (e) => {
        e.preventDefault();
        if (!matchData.location || matchData.location === "") {
            alert("Erreur : Vous devez obligatoirement choisir un club officiel.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('matches').insert([
                {
                    creator_id: session.user.id,
                    date: matchData.date,
                    time: matchData.time,
                    location: matchData.location,
                    type: matchData.players_count === '2' ? 'Simple' : 'Double',
                    category: matchData.category,
                    status: 'open'
                }
            ]);
            if (error) throw error;
            
            setIsCreateModalOpen(false);
            alert('Match publié sur le circuit !');
            
            // Recharger la liste et réinitialiser
            fetchMatches();
            setMatchData({
                date: '',
                time: '',
                location: '',
                players_count: '2',
                category: 'Intermédiaire'
            });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-8 max-w-lg mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-sport-navy tracking-tight">Circuit</h1>
                    <p className="text-slate-500 mt-1 italic font-medium">Trouvez un défi à votre taille.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-sport-green text-white p-3 rounded-2xl shadow-xl shadow-sport-green/20 active:scale-95 transition-all flex items-center space-x-2"
                >
                    <PlusCircle size={20} />
                    <span className="text-sm font-bold pr-1">Créer</span>
                </button>
            </header>

            <div className="flex bg-sport-sand/40 p-1.5 rounded-[2rem] border border-sport-sand">
                <button
                    onClick={() => setView('matchs')}
                    className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${view === 'matchs' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                >
                    Matchs
                </button>
                <button
                    onClick={() => setView('tournois')}
                    className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${view === 'tournois' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                >
                    Tournois {view === 'tournois' && <span className="text-[9px] ml-1 bg-white/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest font-black italic">Soon</span>}
                </button>
            </div>

            {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement du circuit...</p>
                </div>
            ) : view === 'matchs' ? (
                <div className="space-y-4">
                    {matches.length > 0 ? (
                        matches.map((match) => (
                            <div key={match.id} className="bg-white p-6 rounded-[2.5rem] border border-sport-sand shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-sport-beige overflow-hidden border border-sport-sand shadow-inner">
                                            <img 
                                                src={match.creator?.avatar_url || `https://avatar.vercel.sh/${match.creator?.username}`} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-sport-navy group-hover:text-sport-green transition-colors">{match.creator?.username || 'Joueur'}</p>
                                            <p className="text-[10px] text-sport-green font-bold uppercase tracking-widest">{match.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold bg-sport-sand text-sport-navy px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white">
                                        {match.type}
                                    </span>
                                </div>

                                <div className="space-y-4 mb-8 px-1">
                                    <div className="flex items-center text-slate-600 space-x-3">
                                        <div className="w-8 h-8 rounded-xl bg-sport-beige flex items-center justify-center text-sport-navy shadow-sm">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{match.location}</p>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center text-slate-400 space-x-2">
                                            <Calendar size={14} className="text-sport-green" />
                                            <span className="text-xs font-bold uppercase tracking-tighter">{new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center text-slate-400 space-x-2">
                                            <Clock size={14} className="text-sport-green" />
                                            <span className="text-xs font-bold uppercase tracking-tighter">{match.time.slice(0, 5)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-5 bg-sport-beige hover:bg-sport-green hover:text-white text-sport-navy rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-sport-sand shadow-sm active:scale-95">
                                    Rejoindre le match
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-sport-sand/30 rounded-[3rem] flex items-center justify-center text-3xl opacity-50 grayscale border border-sport-sand">🏸</div>
                            <h2 className="text-lg font-bold text-sport-navy">Aucun match ici</h2>
                            <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1 italic font-medium">Soyez le premier à lancer un défi !</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-sport-sand/30 rounded-[3rem] flex items-center justify-center text-3xl opacity-50 grayscale border border-sport-sand">🏆</div>
                    <h2 className="text-lg font-bold text-sport-navy">Tournois à venir</h2>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1 italic font-medium">La saison compétitive arrive bientôt. Restez branchés !</p>
                </div>
            )}

            {/* MODAL CREATION MATCH */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-sport-beige rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/20">
                        <div className="p-8 border-b border-sport-sand/50 flex justify-between items-center bg-white/50">
                            <div>
                                <h2 className="text-2xl font-bold text-sport-navy tracking-tight">Créer un match</h2>
                                <p className="text-slate-500 text-xs mt-1 italic">Remplissez les détails du défi officiel.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-sport-navy transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMatch} className="p-10 space-y-8 bg-white/30">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={matchData.date}
                                        onChange={e => setMatchData({ ...matchData, date: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Heure</label>
                                    <input
                                        type="time"
                                        required
                                        value={matchData.time}
                                        onChange={e => setMatchData({ ...matchData, time: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Lieu (Club PicklePock)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-sport-green" size={18} />
                                    <select
                                        required
                                        value={matchData.location}
                                        onChange={e => setMatchData({ ...matchData, location: e.target.value })}
                                        className="w-full pl-12 pr-10 py-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all appearance-none font-bold text-sm text-sport-navy cursor-pointer shadow-sm"
                                    >
                                        <option value="">Choisir un club officiel...</option>
                                        {clubs.length > 0 ? clubs.map(club => (
                                            <option key={club.id} value={club.name}>{club.name} ({club.city})</option>
                                        )) : (
                                            <option disabled>Aucun club disponible</option>
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <Filter size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Format</label>
                                    <select
                                        value={matchData.players_count}
                                        onChange={e => setMatchData({ ...matchData, players_count: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    >
                                        <option value="2">Simple (1 vs 1)</option>
                                        <option value="4">Double (2 vs 2)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Niveau</label>
                                    <select
                                        value={matchData.category}
                                        onChange={e => setMatchData({ ...matchData, category: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    >
                                        <option>Débutant</option>
                                        <option>Intermédiaire</option>
                                        <option>Avancé</option>
                                        <option>Pro</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-sport-navy text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-sport-navy/30 active:scale-95 transition-all flex items-center justify-center space-x-3 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                        <span>Publier sur le circuit</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Matches;
