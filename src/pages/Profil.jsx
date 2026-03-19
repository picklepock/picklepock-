import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, UserCircle, Edit3, X, Check, Camera, ShieldAlert, HelpCircle, ArrowLeft, Send } from 'lucide-react';
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
    const [uploading, setUploading] = useState(false);
    const [adminView, setAdminView] = useState(false); // To toggle admin panel in profile
    const [reports, setReports] = useState([]);
    const [supportMessages, setSupportMessages] = useState([]);
    const [adminSubTab, setAdminSubTab] = useState('reports');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');

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
                        email: user.email || null,
                        username: user.email ? user.email.split('@')[0] : (user.phone || 'Joueur_' + user.id.slice(0, 4)),
                        level: 'Débutant',
                        matches_played: 0,
                        wins: 0,
                        points: 0
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
                    if (data.role === 'admin') {
                        fetchAdminData();
                    }
                }
            }
        } catch (err) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        try {
            const { data: messagesData } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: reportsData } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (messagesData) setSupportMessages(messagesData);
            if (reportsData) setReports(reportsData);
        } catch (err) {
            console.error("Erreur admin:", err);
        }
    };

    const fetchReplies = async (messageId) => {
        const { data } = await supabase
            .from('support_replies')
            .select('*')
            .eq('message_id', messageId)
            .order('created_at', { ascending: true });
        if (data) setReplies(data);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const { error: replyError } = await supabase
                .from('support_replies')
                .insert([{ message_id: selectedMessage.id, admin_id: session.user.id, content: replyText }]);
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
            await supabase
                .from('support_messages')
                .update({ status: 'resolved' })
                .eq('id', messageId);
            fetchAdminData();
            if (selectedMessage?.id === messageId) setSelectedMessage(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUploadAvatar = async (event) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Vous devez sélectionner une image.');
            }

            const file = event.target.files[0];
            
            // LIMITE DE TAILLE (3 MO)
            if (file.size > 3 * 1024 * 1024) {
                throw new Error('L\'image est trop lourde. Elle doit faire moins de 3 Mo.');
            }

            // SUPPRESSION DE L'ANCIENNE IMAGE (Optionnel mais recommandé pour nettoyer Storage)
            if (editForm.avatar_url && editForm.avatar_url.includes('avatars/')) {
                // On extrait le chemin relatif (tout ce qu'il y a après 'avatars/')
                const oldPath = editForm.avatar_url.split('avatars/').pop();
                if (oldPath) {
                   await supabase.storage.from('avatars').remove([oldPath]);
                }
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;

            // Upload de l'image
            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setEditForm({ ...editForm, avatar_url: publicUrl });
            alert('Image changée avec succès !');

        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            if (!session?.user?.id) throw new Error("Session utilisateur introuvable.");

            const { error } = await supabase
                .from('profiles')
                .update({
                    username: editForm.username,
                    level: editForm.level,
                    gender: editForm.gender,
                    region: editForm.region,
                    bio: editForm.bio,
                    avatar_url: editForm.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);

            if (error) throw error;
            
            setProfile({ ...profile, ...editForm });
            setIsEditing(false);
            alert('Profil mis à jour avec succès !');
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
                            {profile?.role === 'admin' && (
                                <button
                                    onClick={() => { setAdminView(!adminView); setSelectedMessage(null); }}
                                    className={`px-4 py-2 rounded-2xl shadow-sm border border-slate-100 transition-all flex items-center space-x-2 ${adminView ? 'bg-rose-500 text-white' : 'bg-white text-rose-400'}`}
                                    title="Centre d'administration"
                                >
                                    <ShieldAlert size={18} />
                                    <span className="text-xs font-bold">Admin</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-3 bg-white text-emerald-400 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all"
                                title="Modifier le profil"
                            >
                                <Edit3 size={18} />
                            </button>
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
                            <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden shadow-sm relative">
                                {editForm.avatar_url ? (
                                    <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://avatar.vercel.sh/${editForm.username || 'user'}`} className="w-full h-full object-cover opacity-50" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <label className="mt-4 flex flex-col items-center cursor-pointer">
                                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all">
                                    {uploading ? 'Téléchargement...' : 'Changer la photo'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUploadAvatar}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
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
            ) : adminView && profile?.role === 'admin' ? (
                /* VUE ADMIN - TRANSFÉRÉ DEPUIS MATCHES */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
                    {!selectedMessage ? (
                        <>
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
                                    Support ({supportMessages.length})
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
                                            <p className="text-sm font-bold text-slate-900">Origine: {r.reporter_id?.slice(0, 8)}...</p>
                                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">{r.reason || r.content || 'Pas de détail'}</p>
                                        </div>
                                    )) : <p className="text-center text-slate-400 py-10 italic">Aucun signalement.</p>
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
                                                <p className="text-sm font-bold text-slate-900">De: {m.user_id?.slice(0, 8)}...</p>
                                                <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase ${m.status === 'unread' ? 'bg-sky-50 text-sky-400' : m.status === 'in_progress' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                                                    {m.status === 'unread' ? 'Nouveau' : m.status === 'in_progress' ? 'En cours' : m.status === 'resolved' ? 'Fermé' : 'Lu'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">"{m.content}"</p>
                                        </div>
                                    )) : <p className="text-center text-slate-400 py-10 italic">Aucun message.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* CHAT ADMIN IN PROFILE */
                        <div className="space-y-4">
                            <button onClick={() => setSelectedMessage(null)} className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest"><ArrowLeft size={14} className="mr-1" /> Retour</button>
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-sm">Support chat</h3>
                                    {selectedMessage.status !== 'resolved' && (
                                        <button onClick={() => handleResolveMessage(selectedMessage.id)} className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Clôturer</button>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-xs text-slate-700 max-w-[85%]">
                                        {selectedMessage.content}
                                    </div>
                                    {replies.map(r => (
                                        <div key={r.id} className="bg-emerald-400 text-white p-3 rounded-2xl rounded-tr-none text-xs ml-auto max-w-[85%]">
                                            {r.content}
                                        </div>
                                    ))}
                                </div>
                                {selectedMessage.status !== 'resolved' && (
                                    <form onSubmit={handleSendReply} className="p-3 border-t flex space-x-2">
                                        <input
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Répondre..."
                                            className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-1 focus:ring-emerald-400"
                                        />
                                        <button type="submit" className="w-10 h-10 bg-emerald-400 text-white rounded-xl flex items-center justify-center"><Send size={16} /></button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
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
