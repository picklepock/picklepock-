const Clubs = () => {
    return (
        <div className="p-6 pb-24 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-sport-navy tracking-tight">Clubs & Terrains</h1>
                <p className="text-slate-500 mt-1 italic font-medium">Trouvez un court près de chez vous.</p>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-sport-sand shadow-sm overflow-hidden relative min-h-[350px] flex flex-col group cursor-pointer transition-all hover:border-sport-green/20">
                <div className="absolute inset-0 bg-sport-beige/30 flex items-center justify-center">
                    {/* Placeholder for map */}
                    <div className="relative w-full h-full opacity-40">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-sport-green rounded-full animate-ping opacity-20"></div>
                        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-sport-green rounded-full shadow-lg shadow-sport-green/50"></div>
                    </div>
                </div>

                <div className="mt-auto p-8 bg-white/90 backdrop-blur-md border-t border-sport-sand z-10 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-sport-navy">Carte Interactive</p>
                        <p className="text-xs text-slate-400 italic">Chargement des 12 clubs proches...</p>
                    </div>
                    <button className="bg-sport-green text-white p-4 rounded-2xl shadow-xl shadow-sport-green/20 active:scale-95 transition-all">
                        📍
                    </button>
                </div>
            </div>

            <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Clubs populaires</h3>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-5 bg-white border border-sport-sand rounded-[2rem] flex items-center shadow-sm hover:shadow-md hover:border-sport-green/20 transition-all group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden mr-5 shadow-inner">
                                <img
                                    src={i === 1 ? "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=200&h=200&auto=format&fit=crop" : "https://images.unsplash.com/photo-1626225965071-8231c1ca9248?q=80&w=200&h=200&auto=format&fit=crop"}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    alt="Club"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sport-navy group-hover:text-sport-green transition-colors">{i === 1 ? 'Vortex Sports Club' : 'Pickle Arena'}</p>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-[10px] text-sport-green font-bold uppercase tracking-wider">{i === 1 ? '3.2 km' : '5.1 km'}</span>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">4 Terrains dispos</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-sport-beige flex items-center justify-center text-slate-300 group-hover:bg-sport-green group-hover:text-white transition-all">
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
