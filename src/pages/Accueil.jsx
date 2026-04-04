const Accueil = () => {
    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-sport-navy tracking-tight">Bonjour 👋</h1>
                    <p className="text-slate-500 mt-1 italic font-medium">Prêt pour votre prochain match ?</p>
                </div>
                <div className="p-2 bg-white rounded-2xl shadow-sm border border-sport-sand">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
            </header>

            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Événements à la une</h2>
                    <button className="text-sport-green text-sm font-bold hover:underline transition-all">Voir tout</button>
                </div>

                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-sport-sand group cursor-pointer transition-all hover:shadow-lg hover:border-sport-green/20">
                    <div className="relative h-48 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1626225965071-8231c1ca9248?q=80&w=600&h=400&auto=format&fit=crop"
                            alt="Tournoi de Pickleball"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 bg-sport-green text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-sport-green/20">Bientôt</div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-2xl font-bold text-sport-navy mb-1">Open Régional 2026</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">Inscriptions ouvertes pour le circuit amateur de printemps.</p>
                        <div className="flex items-center text-xs font-bold text-slate-400 space-x-6">
                            <span className="flex items-center">🟢 22 Mars</span>
                            <span className="flex items-center">📍 Paris Sud</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Raccourcis</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white p-6 rounded-[2rem] shadow-sm border border-sport-sand flex flex-col items-center justify-center space-y-4 hover:shadow-md hover:border-sport-green/20 transition-all active:scale-95 group">
                        <div className="w-14 h-14 bg-sport-beige rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-sport-green group-hover:text-white transition-all">🏆</div>
                        <span className="font-bold text-sport-navy text-xs uppercase tracking-wider">Mes Matchs</span>
                    </button>
                    <button className="bg-white p-6 rounded-[2rem] shadow-sm border border-sport-sand flex flex-col items-center justify-center space-y-4 hover:shadow-md hover:border-sport-green/20 transition-all active:scale-95 group">
                        <div className="w-14 h-14 bg-sport-beige rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-sport-green group-hover:text-white transition-all">📍</div>
                        <span className="font-bold text-sport-navy text-xs uppercase tracking-wider">Clubs Proches</span>
                    </button>
                </div>
            </section>

            <section className="bg-sport-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-sport-navy/10 ring-1 ring-white/10">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2 tracking-tight">Devenir Pro ?</h2>
                    <p className="text-slate-300 text-xs mb-8 max-w-[180px] leading-relaxed opacity-80">Rejoignez le classement national et défiez les meilleurs joueurs.</p>
                    <button className="bg-sport-green text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-sport-green/20 hover:scale-105 active:scale-95 transition-all">En savoir plus</button>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-sport-green/10 rounded-full blur-3xl"></div>
                <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center italic font-bold text-white/20 select-none text-2xl">P</div>
            </section>
        </div>
    );
};


export default Accueil;
