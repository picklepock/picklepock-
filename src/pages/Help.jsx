import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HelpCircle, Send, MessageSquare, ShieldAlert, ArrowRight, Clock, CheckCircle2, MessageCircle } from 'lucide-react';

const Help = ({ session }) => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
    const [category, setCategory] = useState('Général');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    
    // Pour l'historique
    const [myMessages, setMyMessages] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replies, setReplies] = useState([]);

    const categories = [
        { id: 'Technique', icon: '🛠️', label: 'Problème technique' },
        { id: 'Classement', icon: '🏆', label: 'Compétition' },
        { id: 'Signalement', icon: '🛡️', label: 'Signalement' },
        { id: 'Général', icon: '💬', label: 'Autre' }
    ];

    useEffect(() => {
        if (session && activeTab === 'history') {
            fetchMyMessages();
        }
    }, [session, activeTab]);

    const fetchMyMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setMyMessages(data || []);
        } catch (err) {
            console.error("Erreur historique:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchReplies = async (messageId) => {
        try {
            const { data, error } = await supabase
                .from('support_replies')
                .select('*')
                .eq('message_id', messageId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setReplies(data || []);
        } catch (err) {
            console.error("Erreur réponses:", err.message);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!session) {
            alert("Veuillez vous connecter pour envoyer un message.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.from('support_messages').insert([
                {
                    user_id: session.user.id,
                    content: message,
                    category: category,
                    status: 'unread'
                }
            ]);
            if (error) throw error;
            setSent(true);
            setMessage('');
            setTimeout(() => {
                setSent(false);
                setActiveTab('history');
            }, 2000);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openTicket = (ticket) => {
        setSelectedTicket(ticket);
        fetchReplies(ticket.id);
    };

    return (
        <div className="p-6 pb-24 space-y-8 max-w-lg mx-auto">
            <header>
                <div className="w-16 h-16 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
                    <HelpCircle size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centre d'Aide</h1>
                <p className="text-slate-500 mt-2">Comment pouvons-nous vous aider aujourd'hui ?</p>
            </header>

            {/* TABS UPGRADE */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                    onClick={() => { setActiveTab('new'); setSelectedTicket(null); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'new' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                >
                    Nouveau message
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                >
                    Mes demandes {myMessages.length > 0 && `(${myMessages.length})`}
                </button>
            </div>

            <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[300px]">
                {activeTab === 'new' ? (
                    sent ? (
                        <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <Send size={28} />
                            </div>
                            <p className="font-bold text-emerald-600">Message envoyé !</p>
                            <p className="text-slate-400 text-sm">Nous traiterons votre demande sous peu.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Catégorie</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`p-4 rounded-2xl border text-left transition-all ${category === cat.id
                                                ? 'bg-emerald-400 border-emerald-400 text-white shadow-lg shadow-emerald-400/20'
                                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-emerald-200'
                                                }`}
                                        >
                                            <span className="block text-xl mb-1">{cat.icon}</span>
                                            <span className="text-xs font-bold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    placeholder="Décrivez votre situation..."
                                    rows="5"
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/10 focus:border-emerald-400 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !message}
                                className={`w-full py-5 rounded-[2rem] font-bold flex items-center justify-center space-x-2 transition-all shadow-xl ${loading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-400 text-white shadow-emerald-400/20 active:scale-95'
                                    }`}
                            >
                                <Send size={18} />
                                <span>{loading ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
                            </button>
                        </form>
                    )
                ) : selectedTicket ? (
                    /* VUE DETAIL TICKET (CHAT) */
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <button onClick={() => setSelectedTicket(null)} className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <ArrowRight size={14} className="rotate-180 mr-1" /> Retour
                        </button>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${selectedTicket.status === 'unread' ? 'bg-sky-100 text-sky-500' : 'bg-emerald-100 text-emerald-500'}`}>
                                    {selectedTicket.status === 'unread' ? 'En attente' : 'Répondu'}
                                </span>
                                <span className="text-[10px] text-slate-300">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {/* Message utilisateur */}
                                <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none max-w-[90%]">
                                    <p className="text-sm text-slate-700">{selectedTicket.content}</p>
                                </div>

                                {/* Réponses Admin */}
                                {replies.map(rep => (
                                    <div key={rep.id} className="bg-emerald-400 text-white p-4 rounded-2xl rounded-tr-none max-w-[90%] ml-auto">
                                        <div className="flex items-center space-x-1 mb-1 opacity-80">
                                            <ShieldAlert size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-tighter">Support Admin</span>
                                        </div>
                                        <p className="text-sm">{rep.content}</p>
                                    </div>
                                ))}

                                {replies.length === 0 && (
                                    <p className="text-center text-[11px] text-slate-400 py-4 italic">Aucune réponse pour le moment.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* LISTE DES TICKETS */
                    <div className="space-y-4">
                        {loading && myMessages.length === 0 ? (
                            <p className="text-center text-slate-400 py-10 italic">Chargement...</p>
                        ) : myMessages.length > 0 ? (
                            myMessages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    onClick={() => openTicket(msg)}
                                    className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-emerald-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
                                            {msg.category}
                                        </span>
                                        {msg.status === 'in_progress' ? (
                                            <span className="flex items-center text-emerald-500 text-[10px] font-bold">
                                                <MessageCircle size={12} className="mr-1" /> Nouvelle réponse
                                            </span>
                                        ) : msg.status === 'unread' ? (
                                            <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest flex items-center">
                                                <Clock size={12} className="mr-1" /> En attente
                                            </span>
                                        ) : (
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                        {msg.content}
                                    </p>
                                    <p className="text-[10px] text-slate-300 mt-2">{new Date(msg.created_at).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-3">
                                <MessageSquare className="mx-auto text-slate-200" size={48} />
                                <p className="text-slate-400 text-sm">Vous n'avez pas encore envoyé de demande.</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Help;
