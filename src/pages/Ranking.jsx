const Ranking = () => {
    return (
        <div className="p-6 pb-24 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Classement</h1>
                <p className="text-slate-500 mt-1">Les meilleurs joueurs du circuit.</p>
            </header>

            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                <button className="bg-emerald-400 text-white px-5 py-2.5 rounded-[1.25rem] text-xs font-bold whitespace-nowrap shadow-lg shadow-emerald-400/20">Mondial</button>
                <button className="bg-white text-slate-500 border border-slate-100 px-5 py-2.5 rounded-[1.25rem] text-xs font-bold whitespace-nowrap shadow-sm">Régional</button>
                <button className="bg-white text-slate-500 border border-slate-100 px-5 py-2.5 rounded-[1.25rem] text-xs font-bold whitespace-nowrap shadow-sm">H / F</button>
            </div>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((pos) => (
                    <div
                        key={pos}
                        className={`flex items-center p-5 bg-white border border-slate-50 rounded-[2rem] shadow-sm transition-transform active:scale-98 ${pos === 1 ? 'ring-2 ring-emerald-400/20 border-emerald-400/30' : ''}`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm mr-4 ${pos === 1 ? 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/20' :
                                pos === 2 ? 'bg-slate-100 text-slate-600' :
                                    pos === 3 ? 'bg-orange-50 text-orange-400' :
                                        'text-slate-400'
                            }`}>
                            {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                        </div>

                        <div className="flex-1">
                            <p className="font-bold text-slate-900">Joueur {pos === 1 ? 'Elite' : pos}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{1500 - pos * 120} pts</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[10px] text-slate-400 uppercase font-medium">Paris, FR</span>
                            </div>
                        </div>

                        <div className="flex -space-x-2">
                            {[1, 2].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                                    <img src={`https://avatar.vercel.sh/player${pos}${i}`} alt="avatar" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Ranking;
