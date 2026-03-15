import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { HelpCircle, Send, MessageSquare, ShieldAlert, ArrowRight } from 'lucide-react';

const Help = ({ session }) => {
    const [category, setCategory] = useState('Général');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const categories = [
        { id: 'Technique', icon: '🛠️', label: 'Problème technique' },
        { id: 'Classement', icon: '🏆', label: 'Compétition' },
        { id: 'Signalement', icon: '🛡️', label: 'Signalement' },
        { id: 'Général', icon: '💬', label: 'Autre' }
    ];

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
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
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

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                {sent ? (
                    <div className="py-8 text-center space-y-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                            <Send size={28} />
                        </div>
                        <p className="font-bold text-emerald-600">Message envoyé !</p>
                        <p className="text-slate-400 text-sm">L'équipe PicklePock traitera votre demande sous peu.</p>
                        <button onClick={() => setSent(false)} className="text-sky-400 font-bold text-sm">Nouvel envoi</button>
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
                )}
            </section>
        </div>
    );
};

export default Help;
