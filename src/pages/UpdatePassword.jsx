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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-['Outfit']">
            <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
                <div className="mb-8">
                    <img
                        src="/logo.png"
                        alt="PicklePock Logo"
                        className="w-24 h-24 mx-auto mb-4 object-contain"
                    />
                    <h2 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h2>
                    <p className="text-slate-500 text-sm mt-1">Choisissez un mot de passe sécurisé pour votre compte.</p>
                </div>

                {success ? (
                    <div className="space-y-6 py-8">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <p className="text-emerald-600 font-bold">Mot de passe mis à jour !</p>
                            <p className="text-slate-400 text-sm mt-2">Redirection vers la connexion...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-5 text-left">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2 ml-1">Nouveau mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all text-slate-900 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2 ml-1">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all text-slate-900 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100 flex items-center">
                                <ShieldCheck size={16} className="mr-2 shrink-0" />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !!(error && !password)}
                            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${loading || (error && !password) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-400 text-white active:scale-95 shadow-emerald-400/20 hover:bg-emerald-500'
                                }`}
                        >
                            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                        </button>

                        {error && !password && (
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Retour à la connexion
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdatePassword;

