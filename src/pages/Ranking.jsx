import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, MapPin, Award, Search, Filter } from 'lucide-react';

const Ranking = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('points', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) setPlayers(data);
        } catch (err) {
            console.error("Erreur classement:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-8 max-w-lg mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Le Circuit</h1>
                    <p className="text-slate-500 mt-1">Gagnez des matchs pour monter.</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Trophy size={24} />
                </div>
            </header>

            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                <button className="bg-emerald-400 text-white px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shadow-lg shadow-emerald-400/20">Mondial</button>
                <button className="bg-white text-slate-500 border border-slate-100 px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shadow-sm">Régional</button>
                <button className="bg-white text-slate-500 border border-slate-100 px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shadow-sm">Ma Ligue</button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calcul des scores...</p>
                </div>
            ) : players.length > 0 ? (
                <div className="space-y-4">
                    {players.map((player, index) => {
                        const pos = index + 1;
                        return (
                            <div
                                key={player.id}
                                className={`flex items-center p-5 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm transition-all hover:scale-[1.02] ${pos === 1 ? 'ring-2 ring-emerald-400/20 border-emerald-400/30' : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm mr-4 ${pos === 1 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
                                    pos === 2 ? 'bg-slate-200 text-slate-600' :
                                        pos === 3 ? 'bg-orange-100 text-orange-600' :
                                            'bg-slate-50 text-slate-400'
                                    }`}>
                                    {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                                </div>

                                <div className="flex-1 flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/50">
                                        <img 
                                            src={player.avatar_url || `https://avatar.vercel.sh/${player.username}`} 
                                            className="w-full h-full object-cover"
                                            alt={player.username}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{player.username || 'Joueur'}</p>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.1em]">{player.points || 0} pts</span>
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{player.region || 'FR'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-900">{player.wins || 0}W</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter opacity-50">Victoires</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-3xl opacity-50 grayscale">🏅</div>
                    <h2 className="text-lg font-bold text-slate-900">Pas encore de classement</h2>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1">Les premiers matchs créeront le circuit mondial.</p>
                </div>
            )}
        </div>
    );
};

export default Ranking;

