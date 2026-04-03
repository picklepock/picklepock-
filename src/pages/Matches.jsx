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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Circuit</h1>
                    <p className="text-slate-500 mt-1">Trouvez un défi à votre taille.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-400 text-white p-3 rounded-2xl shadow-lg shadow-emerald-400/20 active:scale-95 transition-all flex items-center space-x-2"
                >
                    <PlusCircle size={20} />
                    <span className="text-sm font-bold pr-1">Créer</span>
                </button>
            </header>

            <div className="flex bg-slate-100 p-1.5 rounded-[2rem]">
                <button
                    onClick={() => setView('matchs')}
                    className={`flex-1 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${view === 'matchs' ? 'bg-white text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Matchs
                </button>
                <button
                    onClick={() => setView('tournois')}
                    className={`flex-1 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${view === 'tournois' ? 'bg-white text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Tournois {view === 'tournois' && <span className="text-[10px] ml-1 bg-sky-50 px-1.5 py-0.5 rounded-md uppercase">Bientôt</span>}
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
                            <div key={match.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                                            <img 
                                                src={match.creator?.avatar_url || `https://avatar.vercel.sh/${match.creator?.username}`} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{match.creator?.username || 'Joueur'}</p>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{match.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-xl uppercase tracking-tighter">
                                        {match.type}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-slate-600 space-x-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{match.location}</p>
                                    </div>
                                    <div className="flex items-center space-x-6 pl-1">
                                        <div className="flex items-center text-slate-400 space-x-2">
                                            <Calendar size={14} />
                                            <span className="text-xs font-semibold">{new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center text-slate-400 space-x-2">
                                            <Clock size={14} />
                                            <span className="text-xs font-semibold">{match.time.slice(0, 5)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-slate-50 hover:bg-emerald-400 hover:text-white text-slate-600 rounded-2xl font-bold text-sm transition-all border border-slate-100/50 group-hover:border-emerald-400/20">
                                    Rejoindre le match
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-3xl opacity-50 grayscale">🏸</div>
                            <h2 className="text-lg font-bold text-slate-900">Aucun match ici</h2>
                            <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1">Soyez le premier à lancer un défi !</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-3xl opacity-50 grayscale">🏆</div>
                    <h2 className="text-lg font-bold text-slate-900">Tournois à venir</h2>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1">La saison compétitive arrive bientôt. Restez branchés !</p>
                </div>
            )}

            {/* MODAL CREATION MATCH */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 font-['Outfit']">
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Créer un match</h2>
                                <p className="text-slate-500 text-sm mt-1">Remplissez les détails du défi.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMatch} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={matchData.date}
                                        onChange={e => setMatchData({ ...matchData, date: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all font-semibold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Heure</label>
                                    <input
                                        type="time"
                                        required
                                        value={matchData.time}
                                        onChange={e => setMatchData({ ...matchData, time: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all font-semibold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Lieu (Club PicklePock)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select
                                        required
                                        value={matchData.location}
                                        onChange={e => setMatchData({ ...matchData, location: e.target.value })}
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all appearance-none font-bold text-slate-700 cursor-pointer"
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
                                {clubs.length === 0 && (
                                    <p className="mt-2 text-[10px] text-amber-500 font-bold bg-amber-50 p-2 rounded-lg">⚠️ Aucun club officiel chargé. Vérifiez votre base de données.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Format</label>
                                    <select
                                        value={matchData.players_count}
                                        onChange={e => setMatchData({ ...matchData, players_count: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all font-semibold text-slate-700"
                                    >
                                        <option value="2">Simple (1 vs 1)</option>
                                        <option value="4">Double (2 vs 2)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Niveau Requis</label>
                                    <select
                                        value={matchData.category}
                                        onChange={e => setMatchData({ ...matchData, category: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all font-semibold text-slate-700"
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
                                className="w-full py-5 bg-emerald-400 text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-emerald-400/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Check size={20} />
                                        <span>Publier le match</span>
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
