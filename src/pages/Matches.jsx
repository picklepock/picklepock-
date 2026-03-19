import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trophy, Calendar, MapPin, Users, Filter, X, Check, CheckCircle2 } from 'lucide-react';

const Matches = ({ session }) => {
    const [view, setView] = useState('matchs');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState({
        date: '',
        time: '',
        location: '',
        players_count: '2',
        category: 'Intermédiaire'
    });

    const handleCreateMatch = async (e) => {
        e.preventDefault();
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
            alert('Match créé avec succès !');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compétition</h1>
                    <p className="text-slate-500 mt-1">Trouvez ou créez un match.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-400 text-white p-3 rounded-2xl shadow-lg shadow-emerald-400/20 active:scale-95 transition-all flex items-center space-x-2"
                >
                    <PlusCircle size={20} />
                    <span className="text-sm font-bold pr-1">Créer</span>
                </button>
            </header>

            <div className="flex bg-slate-100 p-1.5 rounded-[2rem] mx-auto max-w-sm">
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
                    Tournois
                </button>
            </div>

            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-3xl opacity-50 grayscale">
                    {view === 'matchs' ? '🏸' : '🏆'}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Aucun {view === 'matchs' ? 'match prévu' : 'tournoi trouvé'}</h2>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1">Revenez bientôt pour voir les nouvelles dates.</p>
                </div>
                <button className={`mt-4 px-6 py-3 rounded-xl font-bold text-sm ${view === 'matchs' ? 'text-emerald-400' : 'text-sky-400'} bg-white border border-slate-100 shadow-sm`}>
                    Explorer les {view}
                </button>
            </div>

            {/* MODAL CREATION MATCH */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
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
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Heure</label>
                                    <input
                                        type="time"
                                        required
                                        value={matchData.time}
                                        onChange={e => setMatchData({ ...matchData, time: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Lieu (Club / Terrain)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Vortex Sports Club"
                                        value={matchData.location}
                                        onChange={e => setMatchData({ ...matchData, location: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Format</label>
                                    <select
                                        value={matchData.players_count}
                                        onChange={e => setMatchData({ ...matchData, players_count: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
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
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    >
                                        <option>Débutant</option>
                                        <option>Intermédiaire</option>
                                        <option>Pro</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-emerald-400 text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-emerald-400/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                {loading ? 'Création...' : (
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
