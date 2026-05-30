import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { X, Moon, Sun, Volume2, Bell, Globe, Crown, User, LogOut, Trash2 } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();

    // -- États des Paramètres
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notifMessages, setNotifMessages] = useState(true);
    const [notifFollowers, setNotifFollowers] = useState(true);
    const [notifPosts, setNotifPosts] = useState(true);

    // -- Gestion du Thème Sombre / Clair
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    if (!isOpen) return null;

    const handleUpgrade = () => {
        alert("Redirection vers Stripe pour l'offre PicklePock Premium...");
        // Logique de paiement future
    };

    const handleLogout = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
            await supabase.auth.signOut();
            onClose();
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("⚠️ Attention : La suppression du compte est définitive. Voulez-vous continuer ?")) {
            // Note: Normalement géré par une fonction SQL ou un endpoint admin Supabase.
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
                const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                if (error) {
                    alert("Erreur lors de la suppression de la ligne profil: " + error.message);
                } else {
                    await supabase.auth.signOut();
                    alert("Votre compte a été supprimé.");
                    onClose();
                }
            }
        }
    };

    const languages = [
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'it', label: 'Italiano', flag: '🇮🇹' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
    ];

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-sport-navy/90 backdrop-blur-md" onClick={onClose}></div>
            
            {/* Modal Box */}
            <div className="relative bg-sport-beige dark:bg-slate-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 border border-sport-sand dark:border-slate-800">
                
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-b border-sport-sand dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-sport-navy dark:text-white uppercase tracking-tight">{t('settings.title')}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 bg-sport-sky dark:bg-slate-800 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* SECTION 1: Préférences Générales */}
                    <div className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-sport-sand dark:border-slate-800 space-y-4">
                        <h3 className="text-[10px] font-black text-sport-green dark:text-sport-mint uppercase tracking-wider mb-2 flex items-center">
                            <Volume2 size={12} className="mr-1.5" />
                            {t('settings.preferences')}
                        </h3>
                        
                        {/* Thème Sombre Toggle */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-3">
                                {darkMode ? <Moon size={18} className="text-sport-mint" /> : <Sun size={18} className="text-amber-500" />}
                                <div>
                                    <p className="text-xs font-bold text-sport-navy dark:text-white">{t('settings.theme')}</p>
                                    <p className="text-[10px] text-slate-400">{t('settings.theme_desc')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${darkMode ? 'bg-sport-green' : 'bg-slate-200'}`}
                            >
                                <span className={`w-5 h-5 rounded-full bg-white absolute transition-transform shadow ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* Effets Sonores Toggle */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-3">
                                <Volume2 size={18} className="text-slate-400" />
                                <div>
                                    <p className="text-xs font-bold text-sport-navy dark:text-white">{t('settings.sounds')}</p>
                                    <p className="text-[10px] text-slate-400">{t('settings.sounds_desc')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${soundEnabled ? 'bg-sport-green' : 'bg-slate-200'}`}
                            >
                                <span className={`w-5 h-5 rounded-full bg-white absolute transition-transform shadow ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* Notifications Toggles */}
                        <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
                                <Bell size={10} className="mr-1" />
                                {t('settings.notifications')}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs font-medium pl-1">
                                <span className="text-slate-600 dark:text-slate-300">{t('settings.notif_messages')}</span>
                                <input 
                                    type="checkbox" 
                                    checked={notifMessages} 
                                    onChange={(e) => setNotifMessages(e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-700 text-sport-green focus:ring-sport-green"
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs font-medium pl-1">
                                <span className="text-slate-600 dark:text-slate-300">{t('settings.notif_followers')}</span>
                                <input 
                                    type="checkbox" 
                                    checked={notifFollowers} 
                                    onChange={(e) => setNotifFollowers(e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-700 text-sport-green focus:ring-sport-green"
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs font-medium pl-1">
                                <span className="text-slate-600 dark:text-slate-300">{t('settings.notif_posts')}</span>
                                <input 
                                    type="checkbox" 
                                    checked={notifPosts} 
                                    onChange={(e) => setNotifPosts(e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-700 text-sport-green focus:ring-sport-green"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Langues (i18n) */}
                    <div className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-sport-sand dark:border-slate-800 space-y-4">
                        <h3 className="text-[10px] font-black text-sport-green dark:text-sport-mint uppercase tracking-wider mb-2 flex items-center">
                            <Globe size={12} className="mr-1.5" />
                            {t('settings.languages')}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => i18n.changeLanguage(lang.code)}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                                        i18n.language === lang.code 
                                            ? 'bg-sport-navy text-white border-sport-navy dark:bg-sport-mint dark:text-slate-900 dark:border-sport-mint' 
                                            : 'bg-sport-sky/30 text-slate-600 border-sport-sand hover:bg-sport-sky/50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    <span>{lang.label}</span>
                                    <span>{lang.flag}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3: Section "PicklePock Premium" */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-slate-800/50 p-6 rounded-[2.5rem] border-2 border-amber-300 dark:border-amber-500/30 shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                                <Crown size={22} className="animate-pulse" />
                                <h3 className="text-base font-black uppercase tracking-tight">{t('settings.premium_title')}</h3>
                            </div>
                            
                            <p className="text-xs text-amber-800 dark:text-slate-300 font-medium leading-relaxed">
                                {t('settings.premium_desc')}
                            </p>

                            <button
                                onClick={handleUpgrade}
                                className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                            >
                                {t('settings.premium_btn')}
                            </button>
                        </div>
                    </div>

                    {/* SECTION 4: Compte (Utilitaires) */}
                    <div className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-sport-sand dark:border-slate-800 space-y-3">
                        <h3 className="text-[10px] font-black text-sport-green dark:text-sport-mint uppercase tracking-wider mb-2 flex items-center">
                            <User size={12} className="mr-1.5" />
                            {t('settings.account')}
                        </h3>

                        {/* Modifier le profil */}
                        <button
                            onClick={() => {
                                window.location.href = '/profil';
                                onClose();
                            }}
                            className="w-full py-3 bg-sport-sky/20 dark:bg-slate-800 hover:bg-sport-sky/40 dark:hover:bg-slate-700/60 rounded-xl text-xs font-bold text-sport-navy dark:text-white transition-colors flex items-center justify-center space-x-2"
                        >
                            <User size={14} />
                            <span>{t('settings.edit_profile')}</span>
                        </button>

                        {/* Déconnexion */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center space-x-2"
                        >
                            <LogOut size={14} />
                            <span>{t('settings.logout')}</span>
                        </button>

                        {/* Supprimer le compte */}
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full py-3 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 transition-colors flex items-center justify-center space-x-2 border border-rose-100 dark:border-rose-950/40"
                        >
                            <Trash2 size={14} />
                            <span>{t('settings.delete_account')}</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
