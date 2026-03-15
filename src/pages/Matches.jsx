import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trophy, Calendar, MapPin, Users, Filter, X, Check, ShieldAlert, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

const Matches = ({ session }) => {
    const [view, setView] = useState('matchs');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [supportMessages, setSupportMessages] = useState([]);
    const [adminSubTab, setAdminSubTab] = useState('reports');

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');

    const [matchData, setMatchData] = useState({
        date: '',
        time: '',
        location: '',
        players_count: '2',
        category: 'Intermédiaire'
    });

    useEffect(() => {
        if (session?.user) {
            fetchUserRole();
        }
    }, [session]);

    const fetchUserRole = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        if (data?.role === 'admin') {
            setIsAdmin(true);
            fetchAdminData();
        }
    };

    const fetchAdminData = async () => {
        try {
            const { data: messagesData, error: mError } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: reportsData, error: rError } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (mError) console.error("Erreur messages:", mError);
            if (rError) console.error("Erreur rapports:", rError);

            if (messagesData) setSupportMessages(messagesData);
            if (reportsData) setReports(reportsData);
        } catch (err) {
            console.error("Erreur:", err);
        }
    };

    const fetchReplies = async (messageId) => {
        const { data, error } = await supabase
            .from('support_replies')
            .select('*')
            .eq('message_id', messageId)
            .order('created_at', { ascending: true });
        if (!error) setReplies(data);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const { error: replyError } = await supabase
                .from('support_replies')
                .insert([
                    { message_id: selectedMessage.id, admin_id: session.user.id, content: replyText }
                ]);
            if (replyError) throw replyError;

            await supabase
                .from('support_messages')
                .update({ status: 'in_progress' })
                .eq('id', selectedMessage.id);

            setReplyText('');
            fetchReplies(selectedMessage.id);
            fetchAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleResolveMessage = async (messageId) => {
        try {
            const { error } = await supabase
                .from('support_messages')
                .update({ status: 'resolved' })
                .eq('id', messageId);
            if (error) throw error;
            fetchAdminData();
            if (selectedMessage?.id === messageId) setSelectedMessage(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateMatch = async (e) => {
        e.preventDefault();
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
                    status: 'open'
                }
            ]);
            if (error) throw error;
            setIsCreateModalOpen(false);
            alert('Match créé avec succès !');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compétition</h1>
                    <p className="text-slate-500 mt-1">Trouvez ou créez un match.</p>
                </div>
                {!selectedMessage && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-emerald-400 text-white p-3 rounded-2xl shadow-lg shadow-emerald-400/20 active:scale-95 transition-all flex items-center space-x-2"
                    >
                        <PlusCircle size={20} />
                        <span className="text-sm font-bold pr-1">Créer</span>
                    </button>
                )}
            </header>

            {!selectedMessage ? (
                <>
                    <div className="flex bg-slate-100 p-1.5 rounded-[2rem] mx-auto max-w-sm">
                        <button
                            onClick={() => setView('matchs')}
                            className={`flex-1 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${view === 'matchs' ? 'bg-white text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Matchs
                        </button>
                        <button
                            onClick={() => setView('tournois')}
                            className={`flex-1 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${view === 'tournois' ? 'bg-white text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Tournois
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setView('admin')}
                                className={`flex-1 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${view === 'admin' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Admin
                            </button>
                        )}
                    </div>

                    {view === 'admin' && isAdmin ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center space-x-4">
                                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Centre Modération</h3>
                                    <p className="text-xs text-slate-500">Gérez les signalements et le support.</p>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setAdminSubTab('reports')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${adminSubTab === 'reports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                                >
                                    Signalements ({reports.length})
                                </button>
                                <button
                                    onClick={() => setAdminSubTab('messages')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${adminSubTab === 'messages' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                                >
                                    Messages Support ({supportMessages.length})
                                </button>
                            </div>

                            <div className="space-y-4">
                                {adminSubTab === 'reports' ? (
                                    reports.length > 0 ? reports.map(r => (
                                        <div key={r.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] bg-rose-50 text-rose-400 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">{r.type || 'SIGNALEMENT'}</span>
                                                <span className="text-[10px] text-slate-300">#{r.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">Utilisateur: {r.reporter_id?.slice(0, 8)}...</p>
                                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">{r.reason || r.content || 'Pas de détail'}</p>
                                        </div>
                                    )) : (
                                        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-50 shadow-sm text-center">
                                            <p className="text-slate-400 italic">Aucun signalement trouvé.</p>
                                        </div>
                                    )
                                ) : (
                                    supportMessages.length > 0 ? supportMessages.map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => {
                                                setSelectedMessage(m);
                                                fetchReplies(m.id);
                                            }}
                                            className={`bg-white p-6 rounded-3xl border shadow-sm space-y-3 cursor-pointer hover:border-emerald-200 transition-all ${m.status === 'resolved' ? 'opacity-60 border-slate-100' : 'border-slate-100'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-bold text-slate-900">De: {m.user_id?.slice(0, 8)}...</p>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">{m.category || 'Général'}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {m.status === 'resolved' ? (
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-500 px-2 py-1 rounded-lg font-bold uppercase">Traité</span>
                                                    ) : (
                                                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${m.status === 'unread' ? 'bg-sky-50 text-sky-400' :
                                                            m.status === 'in_progress' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
                                                            }`}>
                                                            {m.status === 'unread' ? 'Nouveau' : m.status === 'in_progress' ? 'En cours' : 'Lu'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 italic">"{m.content}"</p>
                                            <div className="flex justify-between items-center pt-2">
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-1">Ouvrir le chat →</p>
                                                {m.status !== 'resolved' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResolveMessage(m.id);
                                                        }}
                                                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 uppercase tracking-widest pl-1"
                                                    >
                                                        Archiver
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-50 shadow-sm text-center">
                                            <p className="text-slate-400 italic">Aucun message de support.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-3xl opacity-50 grayscale">
                                {view === 'matchs' ? '🏸' : '🏆'}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Aucun {view === 'matchs' ? 'match prévu' : 'tournoi trouvé'}</h2>
                                <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-1">Revenez bientôt pour voir les nouvelles dates.</p>
                            </div>
                            <button className={`mt-4 px-6 py-3 rounded-xl font-bold text-sm ${view === 'matchs' ? 'text-emerald-400' : 'text-sky-400'} bg-white border border-slate-100 shadow-sm`}>
                                Explorer les {view}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col h-full space-y-6 animate-in slide-in-from-right duration-300">
                    <button
                        onClick={() => setSelectedMessage(null)}
                        className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" /> Retour à la liste
                    </button>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        {/* Header Chat */}
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900">Chat Support</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedMessage.category} • #{selectedMessage.id.slice(0, 8)}</p>
                            </div>
                            {selectedMessage.status !== 'resolved' && (
                                <button
                                    onClick={() => handleResolveMessage(selectedMessage.id)}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-sm shadow-emerald-500/10"
                                >
                                    Marquer comme traité
                                </button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Message Original du Joueur */}
                            <div className="flex flex-col items-start max-w-[80%]">
                                <span className="text-[10px] font-bold text-slate-400 ml-3 mb-1 uppercase tracking-tight">Joueur</span>
                                <div className="bg-slate-100 text-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-200 shadow-sm">
                                    <p className="text-sm">{selectedMessage.content}</p>
                                </div>
                            </div>

                            {/* Réponses */}
                            {replies.map(reply => (
                                <div key={reply.id} className="flex flex-col items-end max-w-[80%] ml-auto">
                                    <span className="text-[10px] font-bold text-emerald-400 mr-3 mb-1 uppercase tracking-tight">Admin (Vous)</span>
                                    <div className="bg-emerald-400 text-white p-4 rounded-3xl rounded-tr-none shadow-md shadow-emerald-400/20">
                                        <p className="text-sm">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        {selectedMessage.status !== 'resolved' ? (
                            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-50 flex items-center space-x-3">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Écrivez votre réponse..."
                                    className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!replyText.trim()}
                                    className="w-12 h-12 bg-emerald-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/20 active:scale-90 transition-all disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        ) : (
                            <div className="p-6 bg-slate-50 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cette discussion est clôturée.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL CREATION MATCH */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Créer un match</h2>
                                <p className="text-slate-500 text-sm mt-1">Remplissez les détails du défi.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMatch} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={matchData.date}
                                        onChange={e => setMatchData({ ...matchData, date: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Heure</label>
                                    <input
                                        type="time"
                                        required
                                        value={matchData.time}
                                        onChange={e => setMatchData({ ...matchData, time: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Lieu (Club / Terrain)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Vortex Sports Club"
                                        value={matchData.location}
                                        onChange={e => setMatchData({ ...matchData, location: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Format</label>
                                    <select
                                        value={matchData.players_count}
                                        onChange={e => setMatchData({ ...matchData, players_count: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    >
                                        <option value="2">Simple (1 vs 1)</option>
                                        <option value="4">Double (2 vs 2)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Niveau Requis</label>
                                    <select
                                        value={matchData.category}
                                        onChange={e => setMatchData({ ...matchData, category: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-400 transition-all"
                                    >
                                        <option>Débutant</option>
                                        <option>Intermédiaire</option>
                                        <option>Pro</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-emerald-400 text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-emerald-400/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                {loading ? 'Création...' : (
                                    <>
                                        <Check size={20} />
                                        <span>Publier le match</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Matches;
