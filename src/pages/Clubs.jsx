const Clubs = () => {
    return (
        <div className="p-6 pb-24 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clubs & Terrains</h1>
                <p className="text-slate-500 mt-1">Trouvez un court près de chez vous.</p>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative min-h-[350px] flex flex-col group cursor-pointer">
                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                    {/* Placeholder for map */}
                    <div className="relative w-full h-full opacity-40">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
                    </div>
                </div>

                <div className="mt-auto p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-10 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-slate-900">Carte Interactive</p>
                        <p className="text-xs text-slate-500">Chargement des 12 clubs proches...</p>
                    </div>
                    <button className="bg-emerald-400 text-white p-3 rounded-2xl shadow-lg shadow-emerald-400/20 active:scale-95 transition-all">
                        📍
                    </button>
                </div>
            </div>

            <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Clubs populaires</h3>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-4 bg-white border border-slate-50 rounded-[2rem] flex items-center shadow-sm hover:shadow-md transition-all group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden mr-4">
                                <img
                                    src={i === 1 ? "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=200&h=200&auto=format&fit=crop" : "https://images.unsplash.com/photo-1626225965071-8231c1ca9248?q=80&w=200&h=200&auto=format&fit=crop"}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt="Club"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">{i === 1 ? 'Vortex Sports Club' : 'Pickle Arena'}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{i === 1 ? '3.2 km' : '5.1 km'}</span>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <span className="text-[10px] text-slate-400 font-medium">4 Terrains dispos</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-400 transition-colors">
                                →
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Clubs;
