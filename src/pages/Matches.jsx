import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trophy, Calendar, MapPin, Users, Filter, X, Check, Clock, Send, MessageSquare, Lock, Unlock, LogOut, Loader2 } from 'lucide-react';
import { joinMatch, leaveMatch } from '../lib/matchHelpers';

// COMPOSANT CHAT DE MATCH EN TEMPS RÉEL (MODAL DYNAMIQUE)
const MatchChatModal = ({ match, onClose, session }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('match_messages')
            .select('*, user:profiles(username, avatar_url)')
            .eq('match_id', match.id)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel(`match_messages:${match.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'match_messages',
                filter: `match_id=eq.${match.id}`
            }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [match.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !session) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('match_messages')
                .insert([{
                    match_id: match.id,
                    user_id: session.user.id,
                    content: newMessage.trim()
                }]);
            if (error) throw error;
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-sport-beige rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/20 flex flex-col h-[550px]">
                {/* Header */}
                <div className="p-6 bg-sport-navy text-white flex justify-between items-center border-b border-white/10 shrink-0">
                    <div>
                        <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                            <MessageSquare size={16} className="text-sport-green animate-pulse" />
                            <span>Chat du Match</span>
                        </h3>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-bold">📍 {match.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white/40 shadow-inner">
                    {messages.length > 0 ? (
                        messages.map((msg) => {
                            const isMe = msg.user_id === session?.user?.id;
                            return (
                                <div key={msg.id} className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full border border-sport-sand overflow-hidden shrink-0 bg-white shadow-sm">
                                        <img 
                                            src={msg.user?.avatar_url || `https://avatar.vercel.sh/${msg.user?.username}`} 
                                            className="w-full h-full object-cover" 
                                            alt={msg.user?.username}
                                        />
                                    </div>
                                    <div className={`p-3.5 rounded-2xl text-xs max-w-[75%] font-medium leading-relaxed shadow-sm ${
                                        isMe 
                                            ? 'bg-sport-navy text-white rounded-tr-none' 
                                            : 'bg-white text-sport-navy rounded-tl-none border border-sport-sand'
                                    }`}>
                                        {!isMe && <p className="text-[9px] font-black text-sport-green uppercase tracking-wider mb-1">{msg.user?.username || 'Joueur'}</p>}
                                        <p>{msg.content}</p>
                                        <span className={`text-[8px] block text-right mt-1.5 ${isMe ? 'text-white/50' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
                            <span className="text-3xl">💬</span>
                            <p className="text-xs font-bold text-sport-navy uppercase tracking-widest">Aucun message</p>
                            <p className="text-[11px] text-slate-500 italic">Discutez ici pour organiser le match (rdv, couleur de t-shirt, etc.) !</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-sport-sand flex space-x-3 shrink-0">
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-grow bg-sport-beige/30 border border-sport-sand/50 rounded-2xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:border-sport-green/50 placeholder:text-slate-400"
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !newMessage.trim()}
                        className="w-12 h-12 bg-sport-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sport-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Matches = ({ session }) => {
    const [view, setView] = useState('matchs');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [clubs, setClubs] = useState([]);
    const [matches, setMatches] = useState([]);
    const [activeChatMatch, setActiveChatMatch] = useState(null);
    const [matchData, setMatchData] = useState({
        date: '',
        time: '',
        location: '',
        players_count: '2',
        category: 'Intermédiaire',
        requires_approval: false
    });

    useEffect(() => {
        fetchClubs();
        fetchMatches();
    }, []);

    const fetchClubs = async () => {
        const { data } = await supabase.from('clubs').select('*').order('name');
        if (data) setClubs(data);
    };

    const fetchMatches = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    creator:profiles(username, avatar_url),
                    participants:match_participants(
                        status,
                        team,
                        user:profiles(id, username, avatar_url)
                    )
                `)
                .in('status', ['open', 'full'])
                .order('date', { ascending: true });
            
            if (error) throw error;
            if (data) setMatches(data);
        } catch (err) {
            console.error("Erreur chargement matchs:", err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleCreateMatch = async (e) => {
        e.preventDefault();
        if (!matchData.location || matchData.location === "") {
            alert("Erreur : Vous devez obligatoirement choisir un club officiel.");
            return;
        }

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
                    requires_approval: matchData.requires_approval,
                    status: 'open'
                }
            ]);
            if (error) throw error;
            
            setIsCreateModalOpen(false);
            alert('Match publié sur le circuit !');
            
            // Recharger la liste et réinitialiser
            fetchMatches();
            setMatchData({
                date: '',
                time: '',
                location: '',
                players_count: '2',
                category: 'Intermédiaire',
                requires_approval: false
            });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (match) => {
        if (!session) {
            alert("Veuillez vous connecter pour rejoindre un match.");
            return;
        }
        try {
            const res = await joinMatch(match, session.user);
            alert(res.message);
            fetchMatches();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLeave = async (match) => {
        if (!session) return;
        if (!window.confirm("Voulez-vous vraiment vous désinscrire de ce match ?")) return;
        try {
            await leaveMatch(match, session.user);
            alert("Vous vous êtes désinscrit.");
            fetchMatches();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-8 max-w-lg mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-sport-navy tracking-tight">Circuit</h1>
                    <p className="text-slate-500 mt-1 italic font-medium">Trouvez un défi à votre taille.</p>
                </div>
                {session && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-sport-green text-white p-3 rounded-2xl shadow-xl shadow-sport-green/20 active:scale-95 transition-all flex items-center space-x-2"
                    >
                        <PlusCircle size={20} />
                        <span className="text-sm font-bold pr-1">Créer</span>
                    </button>
                )}
            </header>

            <div className="flex bg-sport-sand/40 p-1.5 rounded-[2rem] border border-sport-sand">
                <button
                    onClick={() => setView('matchs')}
                    className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${view === 'matchs' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                >
                    Matchs
                </button>
                <button
                    onClick={() => setView('tournois')}
                    className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${view === 'tournois' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                >
                    Tournois {view === 'tournois' && <span className="text-[9px] ml-1 bg-white/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest font-black italic">Soon</span>}
                </button>
            </div>

            {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement du circuit...</p>
                </div>
            ) : view === 'matchs' ? (
                <div className="space-y-4">
                    {matches.length > 0 ? (
                        matches.map((match) => {
                            const limit = match.type === 'Simple' ? 2 : 4;
                            const confirmed = match.participants?.filter(p => p.status === 'confirmed') || [];
                            const isCreator = match.creator_id === session?.user?.id;
                            
                            const myParticipantInfo = match.participants?.find(p => p.user?.id === session?.user?.id);
                            const isConfirmedParticipant = myParticipantInfo?.status === 'confirmed';
                            const isPendingParticipant = myParticipantInfo?.status === 'pending';

                            return (
                                <div key={match.id} className="bg-white p-6 rounded-[2.5rem] border border-sport-sand shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-2xl bg-sport-beige overflow-hidden border border-sport-sand shadow-inner">
                                                <img 
                                                    src={match.creator?.avatar_url || `https://avatar.vercel.sh/${match.creator?.username}`} 
                                                    className="w-full h-full object-cover"
                                                    alt="Créateur"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-sport-navy group-hover:text-sport-green transition-colors">{match.creator?.username || 'Joueur'}</p>
                                                <div className="flex items-center space-x-1.5 mt-0.5">
                                                    <span className="text-[10px] text-sport-green font-bold uppercase tracking-widest">{match.category}</span>
                                                    {match.requires_approval && (
                                                        <span className="text-[9px] text-slate-400 font-bold flex items-center">
                                                            • <Lock size={10} className="ml-1 mr-0.5" /> Approbation
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold bg-sport-sand text-sport-navy px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white">
                                            {match.type}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-6 px-1">
                                        <div className="flex items-center text-slate-600 space-x-3">
                                            <div className="w-8 h-8 rounded-xl bg-sport-beige flex items-center justify-center text-sport-navy shadow-sm">
                                                <MapPin size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{match.location}</p>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center text-slate-400 space-x-2">
                                                <Calendar size={14} className="text-sport-green" />
                                                <span className="text-xs font-bold uppercase tracking-tighter">{new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <div className="flex items-center text-slate-400 space-x-2">
                                                <Clock size={14} className="text-sport-green" />
                                                <span className="text-xs font-bold uppercase tracking-tighter">{match.time.slice(0, 5)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* LISTE DES PARTICIPANTS DYNAMIQUE (AVATARS) */}
                                    <div className="mt-4 mb-6 px-1 border-t border-sport-sand/40 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                Participants confirmés ({confirmed.length} / {limit})
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3.5">
                                            {Array.from({ length: limit }).map((_, idx) => {
                                                const participant = confirmed[idx];
                                                if (participant) {
                                                    const isSelf = participant.user?.id === session?.user?.id;
                                                    return (
                                                        <div key={idx} className="flex flex-col items-center space-y-1 relative group">
                                                            <div className={`w-10 h-10 rounded-full border-2 p-0.5 bg-white shadow-sm overflow-hidden flex items-center justify-center ${isSelf ? 'border-sport-green' : 'border-sport-sand'}`}>
                                                                <img
                                                                    src={participant.user?.avatar_url || `https://avatar.vercel.sh/${participant.user?.username}`}
                                                                    className="w-full h-full object-cover rounded-full"
                                                                    alt={participant.user?.username}
                                                                />
                                                            </div>
                                                            <span className={`text-[8px] font-bold truncate max-w-[50px] ${isSelf ? 'text-sport-green' : 'text-sport-navy'}`}>
                                                                {isSelf ? 'Moi' : (participant.user?.username || 'Joueur')}
                                                            </span>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div key={idx} className="flex flex-col items-center space-y-1 opacity-40">
                                                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs bg-sport-sand/10">
                                                                +
                                                            </div>
                                                            <span className="text-[8px] font-bold text-slate-400">
                                                                Libre
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>
                                    </div>

                                    {/* ACTIONS DU MATCH */}
                                    <div className="flex space-x-3 pt-2">
                                        {/* Bouton Chat : Réservé aux participants confirmés (ou créateur) */}
                                        {(isConfirmedParticipant || isCreator) && session && (
                                            <button 
                                                onClick={() => setActiveChatMatch(match)}
                                                className="px-4 bg-sport-navy hover:bg-sport-navy/90 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-md shadow-sport-navy/10"
                                                title="Discuter avec les participants"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                        )}

                                        {/* Action principale d'inscription / désinscription */}
                                        {!session ? (
                                            <button 
                                                onClick={() => window.location.href = '/login'}
                                                className="flex-1 py-4 bg-sport-beige hover:bg-sport-green hover:text-white text-sport-navy rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-sport-sand"
                                            >
                                                Se connecter pour rejoindre
                                            </button>
                                        ) : isCreator ? (
                                            <span className="flex-1 py-4 bg-sport-sand/40 text-sport-navy rounded-2xl font-bold text-[10px] uppercase tracking-widest text-center border border-sport-sand/60 select-none flex items-center justify-center">
                                                👑 Mon match (Créateur)
                                            </span>
                                        ) : isConfirmedParticipant ? (
                                            <button 
                                                onClick={() => handleLeave(match)}
                                                className="flex-1 py-4 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-rose-100 flex items-center justify-center space-x-2 active:scale-95"
                                            >
                                                <LogOut size={14} />
                                                <span>Quitter le match</span>
                                            </button>
                                        ) : isPendingParticipant ? (
                                            <button 
                                                onClick={() => handleLeave(match)}
                                                className="flex-1 py-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-amber-100 flex items-center justify-center space-x-1.5 active:scale-95"
                                            >
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping mr-1"></span>
                                                <span>Annuler la demande</span>
                                            </button>
                                        ) : confirmed.length >= limit ? (
                                            <span className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest text-center select-none">
                                                Complet
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleJoin(match)}
                                                className="flex-1 py-4 bg-sport-green hover:bg-sport-green/90 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-sport-green/10 active:scale-95 flex items-center justify-center space-x-2"
                                            >
                                                {match.requires_approval ? <Lock size={14} /> : <Unlock size={14} />}
                                                <span>{match.requires_approval ? "Demander à rejoindre" : "Rejoindre le match"}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-sport-sand/30 rounded-[3rem] flex items-center justify-center text-3xl opacity-50 grayscale border border-sport-sand">🏸</div>
                            <h2 className="text-lg font-bold text-sport-navy">Aucun match ici</h2>
                            <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1 italic font-medium">Soyez le premier à lancer un défi !</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-sport-sand/30 rounded-[3rem] flex items-center justify-center text-3xl opacity-50 grayscale border border-sport-sand">🏆</div>
                    <h2 className="text-lg font-bold text-sport-navy">Tournois à venir</h2>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1 italic font-medium">La saison compétitive arrive bientôt. Restez branchés !</p>
                </div>
            )}

            {/* MODAL CREATION MATCH */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-sport-beige rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/20">
                        <div className="p-8 border-b border-sport-sand/50 flex justify-between items-center bg-white/50">
                            <div>
                                <h2 className="text-2xl font-bold text-sport-navy tracking-tight">Créer un match</h2>
                                <p className="text-slate-500 text-xs mt-1 italic">Remplissez les détails du défi officiel.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-sport-navy transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMatch} className="p-10 space-y-8 bg-white/30">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={matchData.date}
                                        onChange={e => setMatchData({ ...matchData, date: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Heure</label>
                                    <input
                                        type="time"
                                        required
                                        value={matchData.time}
                                        onChange={e => setMatchData({ ...matchData, time: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Lieu (Club PicklePock)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-sport-green" size={18} />
                                    <select
                                        required
                                        value={matchData.location}
                                        onChange={e => setMatchData({ ...matchData, location: e.target.value })}
                                        className="w-full pl-12 pr-10 py-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all appearance-none font-bold text-sm text-sport-navy cursor-pointer shadow-sm"
                                    >
                                        <option value="">Choisir un club officiel...</option>
                                        {clubs.length > 0 ? clubs.map(club => (
                                            <option key={club.id} value={club.name}>{club.name} ({club.city})</option>
                                        )) : (
                                            <option disabled>Aucun club disponible</option>
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <Filter size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Format</label>
                                    <select
                                        value={matchData.players_count}
                                        onChange={e => setMatchData({ ...matchData, players_count: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    >
                                        <option value="2">Simple (1 vs 1)</option>
                                        <option value="4">Double (2 vs 2)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Niveau</label>
                                    <select
                                        value={matchData.category}
                                        onChange={e => setMatchData({ ...matchData, category: e.target.value })}
                                        className="w-full p-4 bg-white border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy shadow-sm"
                                    >
                                        <option>Débutant</option>
                                        <option>Intermédiaire</option>
                                        <option>Avancé</option>
                                        <option>Pro</option>
                                    </select>
                                </div>
                            </div>

                            {/* TOGGLE APPROBATION REQUISE */}
                            <div className="flex items-center space-x-3.5 bg-white p-4 rounded-2xl border border-sport-sand shadow-sm">
                                <input
                                    type="checkbox"
                                    id="requires_approval"
                                    checked={matchData.requires_approval}
                                    onChange={e => setMatchData({ ...matchData, requires_approval: e.target.checked })}
                                    className="w-5 h-5 text-sport-green border-sport-sand rounded focus:ring-sport-green focus:ring-2 focus:ring-offset-2 cursor-pointer"
                                />
                                <label htmlFor="requires_approval" className="text-xs font-bold text-sport-navy cursor-pointer select-none">
                                    🔒 Approbation requise pour rejoindre ce match
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-sport-navy text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-sport-navy/30 active:scale-95 transition-all flex items-center justify-center space-x-3 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                        <span>Publier sur le circuit</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CHAT */}
            {activeChatMatch && (
                <MatchChatModal
                    match={activeChatMatch}
                    session={session}
                    onClose={() => setActiveChatMatch(null)}
                />
            )}
        </div>
    );
};

export default Matches;
