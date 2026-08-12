import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShoppingBag, Calendar, MapPin, Tag, Award, Sparkles, BookOpen, Shield } from 'lucide-react';

const ARTICLES = [
    {
        id: 1,
        category: 'Matériel & Équipement',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        title: 'Guide d\'achat 2026 : Top 5 des meilleures raquettes & Boutiques',
        subtitle: 'Comparatif technique approfondi et liens vers les revendeurs agréés.',
        date: '10 Août 2026',
        author: 'Staff PicklePock Pro',
        image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80',
        shopUrl: 'https://www.joolausa.com/pickleball',
        shopName: 'Boutique JOOLA Pickleball',
        content: `Le marché des raquettes de Pickleball a franchi une nouvelle étape avec l'homologation des revêtements en carbone brut thermoformé de 3ème génération.

1. JOOLA Perseus 3S 16mm
• Points forts : Sweet-spot élargi, contrôle exceptionnel au dink, excellente restitution d'énergie.
• Profil recommandé : Joueur intermédiaire à compétition.
• Prix moyen : 249 €

2. Selkirk Vanguard Control Air
• Points forts : Design sans bordure (edgeless), aérodynamique extrême et prise en main ultra-rapide à la volée.
• Prix moyen : 229 €

3. ProLite SpinMaster Carbon
• Points forts : Surface haute friction assurant un spin maximal au service et lors des tirs attaqués.`,
        tags: ['Raquettes', 'Matériel', 'Test 2026', 'Boutique']
    },
    {
        id: 2,
        category: 'Tournois & Événements',
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        title: 'Open National PicklePock 2026 à Paris',
        subtitle: 'Inscriptions officielles ouvertes — 128 équipes attendues à la Halle Carpentier.',
        date: '08 Août 2026',
        author: 'Comité d\'Organisation FFT / PicklePock',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
        eventUrl: 'https://www.ff-pickleball.fr',
        eventName: 'Plateforme d\'Inscription Officielle',
        content: `Le plus grand rassemblement de Pickleball de la saison 2026 rassemble les compétiteurs de toute la France et d'Europe.

Planning du week-end :
• Vendredi 22 Octobre : Épreuves Simples Hommes & Dames.
• Samedi 23 Octobre : Épreuves Doubles Hommes & Doubles Dames.
• Dimanche 24 Octobre : Épreuve Double Mixte & Phases Finales Pro.

Dotations & Points :
Plus de 5 000 € de cash-prize ainsi que des points comptant pour le classement officiel PicklePock Circuit Elite.`,
        tags: ['Tournoi', 'Paris', 'Circuit Elite', 'Inscription']
    },
    {
        id: 3,
        category: 'Nouveaux Clubs',
        badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        title: 'Inauguration du Pickleball Club Lyon Lumière',
        subtitle: 'Un complexe 100% dédié avec 4 courts extérieurs couverts et éclairage LED pro.',
        date: '05 Août 2026',
        author: 'Fédération Régionale',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
        clubUrl: '/clubs',
        clubName: 'Fiche du club sur PicklePock',
        content: `La région Rhône-Alpes s'enrichit d'une infrastructure haut de gamme dédiée exclusivement à notre sport.

• 4 courts avec revêtement synthétique professionnel.
• Club-House panoramique et boutique de matériel sur place.
• École de Pickleball pour jeunes et adultes dispensée par des entraîneurs certifiés.`,
        tags: ['Lyon', 'Club', 'Inauguration']
    },
    {
        id: 4,
        category: 'Règles & Astuces',
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        title: 'Analyse Tactique : Dominer la zone de non-volée (Cuisine)',
        subtitle: 'Les clés biomécaniques et stratégiques des joueurs du Top 10 mondial.',
        date: '01 Août 2026',
        author: 'Coach Pro Alex',
        image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=800&q=80',
        sourceUrl: 'https://www.usapickleball.org',
        sourceName: 'Règlement Officiel USA Pickleball',
        content: `La zone de non-volée ("The Kitchen") est le lieu stratégique par excellence où se décident la majorité des points.

1. La posture de garde à la cuisine
Gardez la raquette haute à hauteur de poitrine, le centre de gravité bas avec les genoux légèrement fléchis.

2. Le Dink "Cross-Court" (Diagonale)
Privilégiez les dinks croisés : ils offrent une marge de hauteur de filet supérieure et forcent l'adversaire à se déplacer hors de son centre de court.

3. La détection du "Speed-Up"
Attendez que la balle adverse rebondisse au-dessus de la ligne du filet avant d'accélérer l'échange.`,
        tags: ['Coaching Pro', 'Stratégie', 'Dink']
    }
];

const Actualites = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Tous');
    const [activeArticle, setActiveArticle] = useState(null);

    const categories = ['Tous', 'Matériel & Équipement', 'Tournois & Événements', 'Nouveaux Clubs', 'Règles & Astuces'];

    const filteredArticles = selectedCategory === 'Tous'
        ? ARTICLES
        : ARTICLES.filter(a => a.category === selectedCategory);

    return (
        <div className="min-h-full pb-28 px-4 pt-4 space-y-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center border border-[var(--navy)]/10 bg-white/80 dark:bg-white/10 dark:border-white/10 text-[var(--navy)] dark:text-white shadow-sm shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <span className="pp-section-label text-xs uppercase font-bold text-slate-400 block">Magazine & Actualités</span>
                    <h1 className="text-2xl font-black tracking-tight text-[var(--navy)] dark:text-white">
                        L'univers Pickleball
                    </h1>
                </div>
            </div>

            {/* Filtres de catégories */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            selectedCategory === cat
                                ? 'bg-[var(--navy)] text-white dark:bg-[var(--lime)] dark:text-[var(--navy)] shadow-md'
                                : 'bg-white/90 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Liste des articles */}
            <div className="space-y-5">
                {filteredArticles.map((art) => (
                    <article
                        key={art.id}
                        onClick={() => setActiveArticle(art)}
                        className="pp-card rounded-[28px] overflow-hidden cursor-pointer group hover:border-blue-500/40 transition-all duration-300 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-md"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={art.image}
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/85 via-transparent to-transparent" />
                            <div className="absolute top-3.5 left-3.5">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border backdrop-blur-md ${art.badgeColor}`}>
                                    {art.category}
                                </span>
                            </div>
                            <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                                <span className="text-xs font-semibold opacity-90">{art.date} • {art.author}</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-3">
                            <h2 className="font-black text-lg leading-snug text-[var(--navy)] dark:text-white group-hover:text-blue-600 dark:group-hover:text-[var(--lime)] transition-colors">
                                {art.title}
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                                {art.subtitle}
                            </p>

                            <div className="pt-2 flex items-center justify-between">
                                <div className="flex gap-2 flex-wrap">
                                    {art.tags.map(t => (
                                        <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-blue-600 dark:text-[var(--lime)] flex items-center gap-1.5 shrink-0">
                                    Lire l'article <ExternalLink size={14} />
                                </span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* Modal Détail Article Grande Taille Lisible */}
            {activeArticle && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[var(--void-mid)] rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${activeArticle.badgeColor}`}>
                                {activeArticle.category}
                            </span>
                            <button
                                onClick={() => setActiveArticle(null)}
                                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-base hover:bg-slate-200"
                            >
                                ✕
                            </button>
                        </div>

                        <h2 className="text-2xl font-black text-[var(--navy)] dark:text-white leading-tight">
                            {activeArticle.title}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Publié le {activeArticle.date} • <span className="text-slate-800 dark:text-slate-200 font-bold">{activeArticle.author}</span>
                        </p>

                        <div className="rounded-2xl overflow-hidden h-52 my-3 shadow-md">
                            <img src={activeArticle.image} alt="" className="w-full h-full object-cover" />
                        </div>

                        {/* Contenu d'article en texte 14px lisible */}
                        <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed space-y-4 font-medium">
                            {activeArticle.content}
                        </div>

                        {/* Liens externes vers la boutique / tournoi / source officielle */}
                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                            {activeArticle.shopUrl && (
                                <a
                                    href={activeArticle.shopUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-emerald-700 transition-all"
                                >
                                    <ShoppingBag size={18} />
                                    Accéder à la boutique : {activeArticle.shopName}
                                </a>
                            )}

                            {activeArticle.eventUrl && (
                                <a
                                    href={activeArticle.eventUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-amber-700 transition-all"
                                >
                                    <Calendar size={18} />
                                    Inscriptions : {activeArticle.eventName}
                                </a>
                            )}

                            {activeArticle.clubUrl && (
                                <button
                                    onClick={() => {
                                        setActiveArticle(null);
                                        navigate(activeArticle.clubUrl);
                                    }}
                                    className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-blue-700 transition-all"
                                >
                                    <Shield size={18} />
                                    Voir les détails du club sur PicklePock
                                </button>
                            )}

                            {activeArticle.sourceUrl && (
                                <a
                                    href={activeArticle.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-purple-700 transition-all"
                                >
                                    <BookOpen size={18} />
                                    Consulter la source officielle
                                </a>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setActiveArticle(null)}
                                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-black text-sm uppercase tracking-wider"
                            >
                                Fermer l'article
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Actualites;
