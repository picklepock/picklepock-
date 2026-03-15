const Accueil = () => {
    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bonjour 👋</h1>
                    <p className="text-slate-500 mt-1">Prêt pour votre prochain match ?</p>
                </div>
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            </header>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Événements à la une</h2>
                    <button className="text-emerald-400 text-sm font-semibold">Voir tout</button>
                </div>

                <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group cursor-pointer transition-all hover:shadow-md">
                    <div className="relative h-48 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1626225965071-8231c1ca9248?q=80&w=600&h=400&auto=format&fit=crop"
                            alt="Tournoi de Pickleball"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4 bg-emerald-400 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Bientôt</div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Open Régional 2026</h3>
                        <p className="text-slate-500 text-sm mb-4">Inscriptions ouvertes pour le circuit amateur.</p>
                        <div className="flex items-center text-xs font-semibold text-slate-400 space-x-4">
                            <span className="flex items-center">📅 22 Mars</span>
                            <span className="flex items-center">📍 Paris Sud</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Raccourcis</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3 hover:shadow-md transition-all active:scale-95 group">
                        <div className="w-12 h-12 bg-sky-400/10 rounded-2xl flex items-center justify-center text-sky-400 group-hover:bg-sky-400 group-hover:text-white transition-colors">🏆</div>
                        <span className="font-bold text-slate-700 text-sm text-center">Mes Matchs</span>
                    </button>
                    <button className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-3 hover:shadow-md transition-all active:scale-95 group">
                        <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-white transition-colors">📍</div>
                        <span className="font-bold text-slate-700 text-sm text-center">Clubs Proches</span>
                    </button>
                </div>
            </section>

            <section className="bg-emerald-400 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-400/20">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Devenir Pro ?</h2>
                    <p className="text-emerald-50 opacity-90 text-sm mb-6 max-w-[200px]">Rejoignez le classement national et défiez les meilleurs.</p>
                    <button className="bg-white text-emerald-400 px-6 py-3 rounded-xl font-bold text-sm shadow-lg">En savoir plus</button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
            </section>
        </div>
    );
};

export default Accueil;
