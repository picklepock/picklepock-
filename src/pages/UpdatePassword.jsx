import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle, Eye, EyeOff } from 'lucide-react';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Vérifier si nous avons une session (le lien de reset connecte l'utilisateur automatiquement)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Si pas de session, on attend un peu pour laisser Supabase traiter le hash de l'URL
                setTimeout(async () => {
                    const { data: { secondSession } } = await supabase.auth.getSession();
                    if (!secondSession) {
                        setError("Votre lien de réinitialisation semble invalide ou a expiré.");
                    }
                    setVerifying(false);
                }, 1000);
            } else {
                setVerifying(false);
            }
        };

        checkSession();
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit faire au moins 6 caractères.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sport-beige">
            <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-sport-navy/10 border border-sport-sand text-center animate-in fade-in zoom-in duration-700">
                <div className="mb-12">
                     <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl border border-sport-sand p-4 group transition-transform hover:rotate-3">
                        <img
                            src="/logo.png"
                            alt="PicklePock Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-sport-navy tracking-tight">Sécurisation</h2>
                    <p className="text-slate-500 text-sm mt-3 italic font-medium opacity-70 leading-relaxed">Choisissez un code secret de compétition pour votre accès au club.</p>
                </div>

                {success ? (
                    <div className="space-y-8 py-10 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-sport-green text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-sport-green/30">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <p className="text-sport-green font-black text-xl uppercase tracking-tighter">Code Certifié !</p>
                            <p className="text-slate-400 text-xs mt-3 italic font-medium">Préparation du court, redirection imminente...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-8 text-left">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nouveau Code</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sport-green transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
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

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Confirmation</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sport-green transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-14 pr-14 py-5 bg-sport-beige/20 border border-sport-sand rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-sport-green/5 focus:border-sport-green transition-all text-sport-navy font-bold placeholder:text-slate-300 shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-5 bg-rose-50 text-rose-600 text-[11px] font-bold rounded-[1.5rem] border border-rose-100 flex items-center shadow-sm animate-shake">
                                <ShieldCheck size={18} className="mr-3 shrink-0" />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !!(error && !password)}
                            className={`w-full py-6 rounded-[2.5rem] font-bold text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl ${loading || (error && !password) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-sport-navy text-white hover:bg-sport-green active:scale-95 shadow-sport-navy/20'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : 'Valider mon nouveau code'}
                        </button>

                        {error && !password && (
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-sport-navy transition-colors italic uppercase tracking-widest"
                            >
                                Retour au hall de connexion
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdatePassword;

