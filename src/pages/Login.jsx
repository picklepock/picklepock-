import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password`,
                });
                if (error) throw error;
                setMessage('Un lien de réinitialisation a été envoyé à votre adresse email.');
            } else if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Vérifiez vos emails pour confirmer l\'inscription !');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/profil');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="text-center mb-10">
                    <img
                        src="/logo.png"
                        alt="PicklePock Logo"
                        className="w-32 h-32 mx-auto mb-4 object-contain"
                    />
                    <p className="text-slate-500 text-sm">Le circuit compétitif amateur</p>
                </div>

                <div className="mb-8">
                    {isForgotPassword && (
                        <button
                            onClick={() => { setIsForgotPassword(false); setError(null); setMessage(null); }}
                            className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest mb-4 hover:text-emerald-400 transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" /> Retour
                        </button>
                    )}
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isForgotPassword ? 'Réinitialisation' : isSignUp ? 'Créer un compte' : 'Connexion'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {isForgotPassword
                            ? 'Entrez votre email pour recevoir un lien.'
                            : isSignUp ? 'Rejoignez la communauté PicklePock.' : 'Heureux de vous revoir !'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                    </div>

                    {!isForgotPassword && (
                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="block text-xs font-semibold text-slate-600">Mot de passe</label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(true)}
                                        className="text-xs font-bold text-sky-400 hover:text-sky-500"
                                    >
                                        Oublié ?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all text-slate-900 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100 flex items-center">
                            <ShieldCheck size={16} className="mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-4 bg-emerald-50 text-emerald-600 text-xs rounded-xl border border-emerald-100 flex items-center">
                            <ShieldCheck size={16} className="mr-2 shrink-0" />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-400 text-white active:scale-95 shadow-emerald-400/20 hover:bg-emerald-500'
                            }`}
                    >
                        {loading ? 'Chargement...' : isForgotPassword ? 'Envoyer le lien' : isSignUp ? 'Créer un compte' : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-slate-50 pt-8">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setError(null); setMessage(null); }}
                        className="text-sky-400 text-sm font-semibold hover:text-sky-500 transition-colors"
                    >
                        {isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Pas encore de compte ? Inscrivez-vous'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
