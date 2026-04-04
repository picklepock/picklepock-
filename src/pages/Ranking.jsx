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
        <div className="p-6 pb-24 space-y-10 max-w-lg mx-auto text-sport-navy">
            <header className="animate-in fade-in slide-in-from-top duration-700 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-sport-navy leading-tight">Le Circuit<br />Mondial</h1>
                    <p className="text-slate-500 mt-2 text-sm italic font-medium opacity-70">Gagnez des matchs pour gravir les échelons.</p>
                </div>
                <div className="w-16 h-16 bg-sport-beige rounded-[2rem] flex items-center justify-center text-sport-green shadow-inner border border-sport-sand">
                    <Trophy size={28} />
                </div>
            </header>

            <div className="flex bg-sport-sand/30 p-1.5 rounded-[2rem] border border-sport-sand overflow-x-auto scrollbar-hide -mx-6 px-6">
                <button className="flex-1 bg-sport-navy text-white px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-sport-navy/20 whitespace-nowrap">Mondial</button>
                <button className="flex-1 text-slate-400 px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap hover:text-sport-navy transition-colors">Régional</button>
                <button className="flex-1 text-slate-400 px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap hover:text-sport-navy transition-colors">Ma Ligue</button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                    <div className="w-10 h-10 border-4 border-sport-green border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Calcul des scores...</p>
                </div>
            ) : players.length > 0 ? (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {players.map((player, index) => {
                        const pos = index + 1;
                        return (
                            <div
                                key={player.id}
                                className={`flex items-center p-6 bg-white border border-sport-sand rounded-[2.5rem] shadow-sm transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-sport-navy/5 ${pos === 1 ? 'ring-2 ring-sport-green/20 border-sport-green/30' : ''}`}
                            >
                                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-sm mr-6 shadow-sm border border-sport-sand ${pos === 1 ? 'bg-amber-400 text-white shadow-xl shadow-amber-400/20' :
                                    pos === 2 ? 'bg-slate-200 text-slate-600' :
                                        pos === 3 ? 'bg-orange-100 text-orange-600' :
                                            'bg-sport-beige text-slate-400'
                                    }`}>
                                    {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                                </div>

                                <div className="flex-1 flex items-center space-x-5">
                                    <div className="w-12 h-12 rounded-2xl bg-sport-beige overflow-hidden border border-sport-sand p-1 relative shadow-inner">
                                        <img 
                                            src={player.avatar_url || `https://avatar.vercel.sh/${player.username}`} 
                                            className="w-full h-full object-cover rounded-xl"
                                            alt={player.username}
                                        />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl"></div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sport-navy text-lg tracking-tight -mb-1">{player.username || 'Joueur'}</p>
                                        <div className="flex items-center space-x-3 mt-1 opacity-80 decoration-slate-300">
                                            <span className="text-[10px] text-sport-green font-black uppercase tracking-widest">{player.points || 0} pts</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{player.region || 'FR'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="flex flex-col items-end group">
                                        <span className="text-xl font-black text-sport-navy tracking-tighter group-hover:scale-110 transition-transform">{player.wins || 0}W</span>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest -mt-1 italic">Victoires</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-sport-beige rounded-[3rem] flex items-center justify-center text-4xl opacity-30 shadow-inner border border-sport-sand">🏅</div>
                    <div>
                        <h2 className="text-xl font-bold text-sport-navy">Pas encore de classement</h2>
                        <p className="text-slate-400 text-sm max-w-[220px] mx-auto mt-2 italic font-medium opacity-60">Les premiers matchs créeront le circuit officiel.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ranking;

