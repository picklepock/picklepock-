import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberMe') === 'true');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail && rememberMe) {
            setEmail(savedEmail);
        }
    }, []);

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

                if (rememberMe) {
                    localStorage.setItem('savedEmail', email);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('savedEmail');
                    localStorage.setItem('rememberMe', 'false');
                }

                navigate('/profil');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sport-beige">
            <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl shadow-sport-navy/10 border border-sport-sand animate-in fade-in zoom-in duration-700">
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-sport-sand p-4 group transition-transform hover:rotate-3">
                        <img
                            src="/logo.png"
                            alt="PicklePock Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-black text-sport-navy uppercase tracking-tighter italic">PicklePock</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Le circuit compétitif amateur</p>
                </div>

                <div className="mb-10">
                    {isForgotPassword && (
                        <button
                            onClick={() => { setIsForgotPassword(false); setError(null); setMessage(null); }}
                            className="flex items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 hover:text-sport-navy transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" /> Retour
                        </button>
                    )}
                    <h2 className="text-3xl font-bold text-sport-navy tracking-tight">
                        {isForgotPassword ? 'Récupération' : isSignUp ? 'Inscription' : 'Connexion'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 italic font-medium leading-relaxed opacity-70">
                        {isForgotPassword
                            ? 'Entrez votre email pour recevoir votre sésame.'
                            : isSignUp ? 'Rejoignez le circuit et entrez dans la légende.' : 'Ravi de vous revoir sur les courts.'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Email Officiel</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sport-green transition-colors" size={20} />
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-sport-beige/20 border border-sport-sand rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-sport-green/5 focus:border-sport-green transition-all text-sport-navy font-bold placeholder:text-slate-300 shadow-inner"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                    </div>

                    {!isForgotPassword && (
                        <div>
                            <div className="flex justify-between items-center mb-3 ml-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Code Secret</label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(true)}
                                        className="text-[9px] font-black text-sport-green uppercase tracking-widest hover:text-sport-navy transition-colors"
                                    >
                                        Oublié ?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sport-green transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete={isSignUp ? "new-password" : "current-password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-14 py-5 bg-sport-beige/20 border border-sport-sand rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-sport-green/5 focus:border-sport-green transition-all text-sport-navy font-bold placeholder:text-slate-300 shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-sport-navy transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {!isForgotPassword && !isSignUp && (
                        <div className="flex items-center ml-1">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-all duration-300 ${rememberMe ? 'bg-sport-green shadow-lg shadow-sport-green/20' : 'bg-slate-200'}`}></div>
                                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${rememberMe ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-sport-navy transition-colors">
                                    Rester connecté
                                </span>
                            </label>
                        </div>
                    )}

                    {error && (
                        <div className="p-5 bg-rose-50 text-rose-600 text-[11px] font-bold rounded-[1.5rem] border border-rose-100 flex items-center shadow-sm animate-shake">
                            <ShieldCheck size={18} className="mr-3 shrink-0" />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-5 bg-sport-green/10 text-sport-green text-[11px] font-bold rounded-[1.5rem] border border-sport-green/20 flex items-center shadow-sm animate-in zoom-in duration-300">
                            <ShieldCheck size={18} className="mr-3 shrink-0" />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-6 rounded-[2.5rem] font-bold text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl ${loading ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-sport-navy text-white hover:bg-sport-green active:scale-95 shadow-sport-navy/20'
                            }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                        ) : isForgotPassword ? 'Envoyer le lien' : isSignUp ? 'Ouvrir mon compte' : 'Accéder au Circuit'}
                    </button>
                </form>

                <div className="mt-12 text-center pt-8 border-t border-sport-sand/50">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setError(null); setMessage(null); }}
                        className="text-sport-green text-[10px] font-black uppercase tracking-[0.2em] hover:text-sport-navy transition-colors"
                    >
                        {isSignUp ? 'Membre certifié ? Se connecter' : 'Nouveau au club ? S\'inscrire'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
