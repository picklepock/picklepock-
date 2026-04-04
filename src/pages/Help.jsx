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
        <div className="p-6 pb-24 space-y-10 max-w-lg mx-auto text-sport-navy">
            <header className="animate-in fade-in slide-in-from-top duration-700">
                <div className="w-20 h-20 bg-sport-sand rounded-[2.5rem] flex items-center justify-center text-sport-green mb-8 shadow-inner border border-white/50">
                    <HelpCircle size={36} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-sport-navy leading-tight">Centre<br />d'Assistance</h1>
                <p className="text-slate-500 mt-3 text-sm italic font-medium">Comment pouvons-nous vous aider aujourd'hui ?</p>
            </header>

            {/* TABS UPGRADE */}
            <div className="flex bg-sport-sand/30 p-1.5 rounded-[2rem] border border-sport-sand">
                <button 
                    onClick={() => { setActiveTab('new'); setSelectedTicket(null); }}
                    className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'new' ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20' : 'text-slate-400'}`}
                >
                    Nouveau Ticket
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'history' ? 'bg-sport-navy text-white shadow-xl shadow-sport-navy/20' : 'text-slate-400'}`}
                >
                    Historique {myMessages.length > 0 && `(${myMessages.length})`}
                </button>
            </div>

            <section className="animate-in fade-in duration-500">
                {activeTab === 'new' ? (
                    sent ? (
                        <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500 bg-white rounded-[3rem] border border-sport-sand shadow-sm">
                            <div className="w-20 h-20 bg-sport-green text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-sport-green/30">
                                <Send size={32} />
                            </div>
                            <div>
                                <p className="font-bold text-xl text-sport-navy tracking-tight">Transmission réussie !</p>
                                <p className="text-slate-400 text-xs mt-2 italic">Nous traiterons votre demande sous peu.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="space-y-10">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 mb-6 block">Nature du problème</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`p-6 rounded-[2rem] border text-left transition-all duration-300 group ${category === cat.id
                                                ? 'bg-sport-green border-sport-green text-white shadow-2xl shadow-sport-green/20 scale-[1.02]'
                                                : 'bg-white border-sport-sand text-sport-navy hover:border-sport-green/50 opacity-70 hover:opacity-100 shadow-sm'
                                                }`}
                                        >
                                            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 mb-4 block">Votre message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    placeholder="Décrivez votre situation avec précision..."
                                    rows="5"
                                    className="w-full p-8 bg-sport-beige/20 border border-sport-sand rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-sport-green/5 focus:border-sport-green transition-all text-sport-navy placeholder:text-slate-400 font-bold text-sm shadow-inner"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !message}
                                className={`w-full py-6 rounded-[2.5rem] font-bold uppercase tracking-[0.3em] text-[10px] flex items-center justify-center space-x-3 transition-all duration-500 shadow-2xl ${loading || !message ? 'bg-slate-100 text-slate-300' : 'bg-sport-navy text-white shadow-sport-navy/30 hover:bg-sport-green active:scale-95'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Soumettre au Circuit</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )
                ) : selectedTicket ? (
                    /* CHAT TICKET PREMIUM */
                    <div className="space-y-8 animate-in slide-in-from-right duration-500">
                        <button onClick={() => setSelectedTicket(null)} className="flex items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-sport-navy transition-colors">
                            <ArrowRight size={16} className="rotate-180 mr-2" /> Retour à l'historique
                        </button>
                        
                        <div className="bg-white rounded-[3rem] border border-sport-sand shadow-2xl overflow-hidden flex flex-col h-[500px]">
                            <div className="p-8 bg-sport-navy text-white flex justify-between items-center">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full animate-pulse ${selectedTicket.status === 'unread' ? 'bg-sky-400' : 'bg-sport-green'}`}></span>
                                        <h3 className="font-bold text-sm tracking-tight">{selectedTicket.category}</h3>
                                    </div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Ticket #{selectedTicket.id.slice(0, 8)}</p>
                                </div>
                                <span className="text-[10px] text-white/50 font-black italic">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-sport-beige/20 shadow-inner">
                                <div className="bg-white p-6 rounded-[2rem] rounded-tl-none max-w-[90%] shadow-sm border border-sport-sand font-medium text-sm leading-relaxed text-sport-navy">
                                    <p className="text-[9px] font-black text-slate-300 uppercase mb-3 tracking-widest">Ma demande</p>
                                    {selectedTicket.content}
                                </div>

                                {replies.map(rep => (
                                    <div key={rep.id} className="bg-sport-navy text-white p-6 rounded-[2rem] rounded-tr-none max-w-[90%] ml-auto shadow-xl shadow-sport-navy/10 font-medium text-sm leading-relaxed border border-white/5 relative group">
                                        <div className="flex items-center space-x-2 mb-3 opacity-60">
                                            <ShieldAlert size={12} className="text-sport-green" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Assistance PicklePock</span>
                                        </div>
                                        <p>{rep.content}</p>
                                    </div>
                                ))}

                                {replies.length === 0 && (
                                    <div className="text-center py-12 flex flex-col items-center space-y-3 opacity-30">
                                        <Clock size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Analyse en cours...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* LISTE DES TICKETS PREMIUM */
                    <div className="space-y-4">
                        {loading && myMessages.length === 0 ? (
                            <div className="py-20 text-center opacity-20"><div className="w-8 h-8 border-2 border-sport-navy border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                        ) : myMessages.length > 0 ? (
                            myMessages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    onClick={() => openTicket(msg)}
                                    className="p-8 bg-white border border-sport-sand rounded-[2.5rem] shadow-sm hover:border-sport-green hover:shadow-xl hover:shadow-sport-navy/5 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[9px] font-black text-sport-green uppercase tracking-[0.2em] bg-sport-green/5 px-3 py-1.5 rounded-lg border border-sport-green/10">
                                            {msg.category}
                                        </span>
                                        {msg.status === 'in_progress' ? (
                                            <span className="flex items-center text-sport-green text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                <MessageCircle size={14} className="mr-2" /> Message reçu
                                            </span>
                                        ) : msg.status === 'unread' ? (
                                            <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest flex items-center">
                                                <Clock size={14} className="mr-2" /> En attente
                                            </span>
                                        ) : (
                                            <CheckCircle2 size={18} className="text-sport-green" />
                                        )}
                                    </div>
                                    <p className="text-sm text-sport-navy font-bold line-clamp-1 group-hover:text-sport-navy transition-colors tracking-tight">
                                        {msg.content}
                                    </p>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-sport-sand/50">
                                        <p className="text-[10px] text-slate-300 font-bold italic">{new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                        <ArrowRight size={14} className="text-slate-200 group-hover:text-sport-green group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center space-y-6 opacity-30 flex flex-col items-center">
                                <div className="w-20 h-20 bg-sport-beige rounded-[2.5rem] flex items-center justify-center text-sport-green shadow-inner border border-sport-sand">
                                    <MessageSquare size={40} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucune demande ouverte</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Help;
