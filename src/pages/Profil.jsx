import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, UserCircle, Edit3, X, Check, Camera, ShieldAlert, HelpCircle } from 'lucide-react';
import Login from './Login';

const Profil = ({ session }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // États pour le formulaire d'édition
    const [editForm, setEditForm] = useState({
        username: '',
        level: 'Débutant',
        gender: 'H',
        region: '',
        bio: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (session) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const user = session.user;
            if (user) {
                let { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    const newProfile = {
                        id: user.id,
                        email: user.email,
                        level: 'Débutant',
                        matches_played: 0,
                        wins: 0,
                        points: 0,
                        username: user.email.split('@')[0]
                    };
                    const { data: created, error: createError } = await supabase
                        .from('profiles')
                        .insert([newProfile])
                        .select().single();

                    if (createError) throw createError;
                    setProfile(created);
                    setEditForm(created);
                } else if (error) {
                    throw error;
                } else {
                    setProfile(data);
                    setEditForm(data);
                }
            }
        } catch (err) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: editForm.username,
                    level: editForm.level,
                    gender: editForm.gender,
                    region: editForm.region,
                    bio: editForm.bio,
                    avatar_url: editForm.avatar_url,
                    updated_at: new Date()
                })
                .eq('id', session.user.id);

            if (error) throw error;
            setProfile({ ...profile, ...editForm });
            setIsEditing(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (loading && !isEditing) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-sport-green border-t-transparent rounded-full animate-spin"></div></div>;
    if (!session) return <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]"><div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6"><UserCircle size={48} /></div><h2 className="text-xl font-bold text-gray-900 mb-2">Compte non connecté</h2><Login /></div>;

    return (
        <div className="p-6 max-w-lg mx-auto pb-24 text-slate-900">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {isEditing ? 'Éditer le profil' : 'Mon Profil'}
                </h1>
                <div className="flex space-x-3">
                    {!isEditing ? (
                        <>
                            {session.user.id === profile?.id ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-3 bg-white text-emerald-400 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all"
                                    title="Modifier le profil"
                                >
                                    <Edit3 size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Voulez-vous signaler ce profil ? L'équipe de modération sera avertie.")) {
                                            const { error } = await supabase.from('reports').insert([
                                                { reporter_id: session.user.id, target_id: profile.id, type: 'profile', reason: 'Signalement via bouton profil' }
                                            ]);
                                            if (!error) alert('Signalement envoyé. Merci de nous aider à garder PicklePock sûr.');
                                        }
                                    }}
                                    className="p-3 bg-white text-rose-400 rounded-2xl shadow-sm border border-slate-100 hover:bg-rose-50 transition-colors"
                                    title="Signaler un problème"
                                >
                                    <ShieldAlert size={18} />
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:text-red-500 transition-colors"
                                title="Se déconnecter"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(false)} className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                /* FORMULAIRE D'ÉDITION */
                <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                            <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden shadow-sm">
                                {editForm.avatar_url ? (
                                    <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://avatar.vercel.sh/${editForm.username || 'user'}`} className="w-full h-full object-cover opacity-50" />
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Lien URL de la photo"
                                className="mt-4 w-full text-xs p-3 bg-white rounded-xl border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition-all placeholder:text-slate-400"
                                value={editForm.avatar_url || ''}
                                onChange={e => setEditForm({ ...editForm, avatar_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Pseudo</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/10 focus:border-emerald-400 transition-all"
                                    value={editForm.username || ''}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Niveau</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 appearance-none focus:outline-none focus:border-emerald-400 transition-all"
                                        value={editForm.level}
                                        onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                                    >
                                        <option>Débutant</option>
                                        <option>Intermédiaire</option>
                                        <option>Avancé</option>
                                        <option>Pro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Genre</label>
                                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                                        <button onClick={() => setEditForm({ ...editForm, gender: 'H' })} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${editForm.gender === 'H' ? 'bg-white text-emerald-400 shadow-sm' : 'text-slate-400'}`}>H</button>
                                        <button onClick={() => setEditForm({ ...editForm, gender: 'F' })} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${editForm.gender === 'F' ? 'bg-white text-emerald-400 shadow-sm' : 'text-slate-400'}`}>F</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Région</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:border-emerald-400 transition-all"
                                    value={editForm.region || ''}
                                    onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                                    placeholder="Ex: Île-de-France"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Bio</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 resize-none focus:outline-none focus:border-emerald-400 transition-all"
                                    value={editForm.bio || ''}
                                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Votre style de jeu..."
                                />
                            </div>
                        </div>
                    </div>

                    <button onClick={handleUpdateProfile} className="w-full py-5 bg-emerald-400 text-white rounded-[2rem] font-bold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-emerald-400/20 active:scale-95 transition-all">
                        <Check size={20} />
                        <span>Enregistrer les modifications</span>
                    </button>
                </div>
            ) : (
                /* VUE PROFIL NORMALE */
                <>
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center p-1 border-4 border-white shadow-xl shadow-slate-200/50 overflow-hidden mb-6 transition-transform hover:scale-105">
                            <img
                                src={profile?.avatar_url || `https://avatar.vercel.sh/${profile?.username || 'user'}`}
                                className="w-full h-full object-cover rounded-[2.5rem]"
                                alt="Profile"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{profile?.username || 'Joueur'}</h2>
                        <div className="flex space-x-2 mt-3">
                            <span className="px-4 py-1.5 bg-emerald-400/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-400/20">
                                {profile?.level || 'Débutant'}
                            </span>
                            <span className="px-4 py-1.5 bg-sky-400/10 text-sky-500 text-xs font-bold rounded-full border border-sky-400/20">
                                {profile?.region || 'National'}
                            </span>
                            {profile?.role === 'admin' && (
                                <span className="px-4 py-1.5 bg-amber-400/10 text-amber-600 text-xs font-bold rounded-full border border-amber-400/20 flex items-center">
                                    <span className="mr-1">🛡️</span> Admin
                                </span>
                            )}
                        </div>
                        {profile?.bio && <p className="mt-6 text-center text-slate-500 text-sm italic px-8 leading-relaxed max-w-sm">"{profile.bio}"</p>}
                    </div>

                    <div className="space-y-6">
                        {/* STATISTIQUES CARTE */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Performances</h3>
                            <div className="grid grid-cols-3 gap-4 relative z-10">
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{profile?.matches_played || 0}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Matchs</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-400">{profile?.matches_played > 0 ? Math.round((profile.wins / profile.matches_played) * 100) : 0}%</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Victoires</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-sky-400">{profile?.points || 0}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Points</p>
                                </div>
                            </div>
                        </div>

                        {/* INFOS COMPLEMENTAIRES */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-wider">Genre</p>
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">{profile?.gender === 'F' ? '👩' : '👨'}</span>
                                    <p className="font-bold text-slate-700">{profile?.gender === 'F' ? 'Femme' : 'Homme'}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm group cursor-pointer hover:border-emerald-400/30 transition-colors">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-wider">Rang</p>
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">🥇</span>
                                    <p className="font-bold text-slate-700">#---</p>
                                </div>
                            </div>
                            {/* AIDE & SUPPORT */}
                            <div
                                onClick={() => window.location.href = '/help'}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4 cursor-pointer hover:border-sky-400/30 transition-all group"
                            >
                                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all">
                                    <HelpCircle size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 text-sm">Centre d'Aide</p>
                                    <p className="text-xs text-slate-400">Questions, support et signalements.</p>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-sky-500 transition-colors">
                                    →
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profil;
