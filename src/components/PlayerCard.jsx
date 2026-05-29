import React from 'react';
import { Trophy, MessageSquare, ShieldAlert, Award, MapPin } from 'lucide-react';
import Button from './Button';

/**
 * PlayerCard réutilisable démontrant la dualité Amical (Clair) vs Compétitif (Sombre)
 * 
 * @param {Object} player - Informations sur le joueur ({ username, level, wins, matches_played, points, rank, region })
 * @param {boolean} isDarkContext - Active le mode "Compétitif" (Sombre/Glow) au lieu du mode "Amical" (Clair/Beige)
 * @param {Function} onMessage - Callback pour envoyer un message
 * @param {Function} onChallenge - Callback pour lancer un défi
 */
const PlayerCard = ({ 
    player = {}, 
    isDarkContext = false, 
    onMessage, 
    onChallenge 
}) => {
    // Joueur de démonstration par défaut
    const defaultPlayer = {
        username: 'Alex_Pickle',
        level: 'Intermédiaire',
        wins: 14,
        matches_played: 20,
        points: 420,
        rank: 1,
        region: 'Île-de-France',
        avatar_url: 'https://avatar.vercel.sh/Alex_Pickle',
        ...player
    };

    const { username, level, wins, matches_played, points, rank, region, avatar_url } = defaultPlayer;
    const winRate = matches_played > 0 ? Math.round((wins / matches_played) * 100) : 0;

    // Rendu en mode "Compétitif" (Sombre, Violet, Lime, Lueur)
    if (isDarkContext) {
        return (
            <div className="bg-bg-dark border border-brand-green/20 rounded-2xl p-5 shadow-xl hover:border-brand-green/50 hover:glow-green transition-all duration-300 relative overflow-hidden max-w-sm w-full mx-auto">
                {/* Lueur d'arrière-plan */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-green/10 rounded-full blur-xl pointer-events-none" />
                
                {/* En-tête : Classement et Niveau */}
                <div className="flex justify-between items-center mb-4">
                    <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-brand-green/10 border border-brand-green/25 text-brand-green text-[9px] font-black uppercase tracking-wider rounded-lg">
                        <Trophy size={10} className="text-brand-green" />
                        <span>Rang #{rank}</span>
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <MapPin size={10} className="text-brand-green" />
                        <span>{region}</span>
                    </span>
                </div>

                {/* Profil principal */}
                <div className="flex items-center space-x-4 mb-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-brand-green to-transparent overflow-hidden">
                            <img 
                                src={avatar_url} 
                                alt={username} 
                                className="w-full h-full object-cover rounded-full bg-slate-900"
                            />
                        </div>
                        {rank === 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-bg-dark p-0.5 rounded-full shadow-lg">
                                <Award size={12} className="fill-bg-dark" />
                            </span>
                        )}
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white leading-tight tracking-tight flex items-center space-x-1.5">
                            <span>{username}</span>
                        </h4>
                        <p className="text-[10px] font-black tracking-widest text-brand-green uppercase mt-0.5">
                            {level}
                        </p>
                    </div>
                </div>

                {/* Statistiques Compétitives */}
                <div className="grid grid-cols-3 gap-2.5 bg-black/30 rounded-xl p-3.5 mb-5 border border-white/5">
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Points</p>
                        <p className="text-sm font-black text-white mt-0.5">{points} XP</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ratio</p>
                        <p className="text-sm font-black text-brand-green mt-0.5">{winRate}%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Matchs</p>
                        <p className="text-sm font-black text-white mt-0.5">{matches_played}</p>
                    </div>
                </div>

                {/* CTA Action Compétitive */}
                <div className="flex space-x-2">
                    <Button 
                        variant="primary" 
                        className="flex-1 py-3 text-[10px]"
                        onClick={onChallenge}
                    >
                        <span>Défier</span>
                    </Button>
                    <button 
                        onClick={onMessage}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 active:scale-95 transition-all"
                        aria-label="Message"
                    >
                        <MessageSquare size={16} className="text-brand-green" />
                    </button>
                </div>
            </div>
        );
    }

    // Rendu en mode "Amical" (Clair, Doux, Bords ultra arrondis, Beige/Blanc)
    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 max-w-sm w-full mx-auto">
            {/* En-tête : Badge amical */}
            <div className="flex justify-between items-center mb-5">
                <span className="px-3 py-1 bg-bg-light text-brand-blue text-[9px] font-bold uppercase tracking-widest rounded-full border border-slate-100">
                    Niveau : {level}
                </span>
                <span className="text-[9px] font-bold text-slate-400 flex items-center space-x-1">
                    <MapPin size={10} className="text-brand-blue" />
                    <span>{region}</span>
                </span>
            </div>

            {/* Profil principal */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-bg-light shadow-sm">
                    <img 
                        src={avatar_url} 
                        alt={username} 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h4 className="text-lg font-black text-brand-blue leading-tight tracking-tight">
                        {username}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                        Passionné de Pickleball 🎾
                    </p>
                </div>
            </div>

            {/* Statistiques amicales */}
            <div className="grid grid-cols-2 gap-3 bg-bg-light rounded-[1.5rem] p-4 mb-6 border border-slate-100/50">
                <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-blue/5 flex items-center justify-center">
                        <Trophy size={14} className="text-brand-blue" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Victoires</p>
                        <p className="text-xs font-black text-brand-blue">{wins} parties</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-blue/5 flex items-center justify-center">
                        <MessageSquare size={14} className="text-brand-blue" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</p>
                        <p className="text-xs font-black text-brand-blue">{points} Pts</p>
                    </div>
                </div>
            </div>

            {/* Boutons d'action Amical */}
            <div className="flex space-x-2.5">
                <Button 
                    variant="secondary" 
                    isDarkContext={false}
                    className="flex-1 py-3 text-[10px]"
                    onClick={onMessage}
                >
                    <MessageSquare size={14} />
                    <span>Discuter</span>
                </Button>
                <Button 
                    variant="outline" 
                    isDarkContext={false}
                    className="py-3 text-[10px] px-4"
                    onClick={onChallenge}
                >
                    <span>Défier</span>
                </Button>
            </div>
        </div>
    );
};

export default PlayerCard;
