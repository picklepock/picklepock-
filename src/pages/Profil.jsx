import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, UserCircle, Edit3, X, Check, Camera, ShieldAlert, HelpCircle, ArrowLeft, Send, MapPin, Phone, Clock, Image as ImageIcon, Trash2, ShieldCheck } from 'lucide-react';
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
    const [clubRequests, setClubRequests] = useState([]);
    const [adminSubTab, setAdminSubTab] = useState('reports');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [managedClubs, setManagedClubs] = useState([]);

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
                    fetchManagedClubs(user.id);
                }
            }
        } catch (err) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagedClubs = async (userId) => {
        try {
            const { data } = await supabase
                .from('clubs')
                .select('*')
                .eq('manager_id', userId);
            if (data) setManagedClubs(data);
        } catch (err) {
            console.error("Erreur managed clubs:", err);
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
            
            const { data: clubRequestsData } = await supabase
                .from('club_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (messagesData) setSupportMessages(messagesData);
            if (reportsData) setReports(reportsData);
            if (clubRequestsData) setClubRequests(clubRequestsData);
        } catch (err) {
            console.error("Erreur admin:", err);
        }
    };

    const handleApproveClub = async (req) => {
        if (!window.confirm(`Approuver officiellement le club "${req.club_name}" ?`)) return;

        try {
            // 1. Créer le club
            const { data: newClub, error: clubError } = await supabase
                .from('clubs')
                .insert([{
                    name: req.club_name,
                    description: req.club_description || req.bio,
                    bio: req.bio,
                    address: req.address,
                    city: req.city,
                    country: req.country,
                    phone: req.phone,
                    opening_hours: req.opening_hours,
                    manager_id: req.user_id,
                    contact_email: req.contact_email,
                    latitude: 46.2276, 
                    longitude: 2.2137,
                    is_active: true
                }])
                .select()
                .single();

            if (clubError) throw clubError;

            // 2. Insérer les photos
            if (req.photo_urls && req.photo_urls.length > 0) {
                const photoInserts = req.photo_urls.map(url => ({
                    club_id: newClub.id,
                    url: url
                }));
                const { error: photoError } = await supabase.from('club_photos').insert(photoInserts);
                if (photoError) throw photoError;
            }

            // 2.5 Ajouter le manager comme membre/manager du club
            await supabase.from('club_members').insert([{
                user_id: req.user_id,
                club_id: newClub.id,
                role: 'manager'
            }]);

            // 3. Marquer la demande comme validée
            await supabase.from('club_requests').update({ status: 'approved' }).eq('id', req.id);

            alert(`Club "${req.club_name}" créé avec succès !`);
            fetchAdminData();
        } catch (err) {
            alert("Erreur approbation : " + err.message);
        }
    };

    const handleRejectClub = async (reqId) => {
        if (!window.confirm("Refuser cette demande de club ?")) return;
        try {
            await supabase.from('club_requests').update({ status: 'rejected' }).eq('id', reqId);
            fetchAdminData();
        } catch (err) {
            alert(err.message);
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
        if (!window.confirm("Voulez-vous vraiment supprimer définitivement ce ticket et tous les messages associés ?")) return;

        try {
            // 1. Supprimer toutes les réponses associées
            const { error: repliesError } = await supabase
                .from('support_replies')
                .delete()
                .eq('message_id', messageId);
            
            if (repliesError) throw repliesError;

            // 2. Supprimer le message principal
            const { error: msgError } = await supabase
                .from('support_messages')
                .delete()
                .eq('id', messageId);

            if (msgError) throw msgError;

            fetchAdminData();
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
                setReplies([]);
            }
            alert("Ticket et historique supprimés avec succès.");
        } catch (err) {
            alert("Erreur lors de la suppression : " + err.message);
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

            // Utilisation d'UPSERT pour plus de robustesse (crée si absent, met à jour si présent)
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    username: editForm.username,
                    level: editForm.level,
                    gender: editForm.gender,
                    region: editForm.region,
                    bio: editForm.bio,
                    avatar_url: editForm.avatar_url,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' }) // Indispensable pour l'upsert par ID
                .select();

            if (error) throw error;
            
            if (!data || data.length === 0) {
                throw new Error(`Échec critique : aucun profil trouvé ou créé (votre ID: ${session.user.id.slice(0, 8)}...)`);
            }
            
            setProfile(data[0]);
            setIsEditing(false);
            alert('Profil enregistré avec succès !');
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
        <div className="p-6 max-w-lg mx-auto pb-24 text-sport-navy">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold tracking-tight text-sport-navy">
                    {isEditing ? 'Éditer le profil' : 'Mon Profil'}
                </h1>
                <div className="flex space-x-3">
                    {!isEditing ? (
                        <>
                            {profile?.role === 'admin' && (
                                <button
                                    onClick={() => { setAdminView(!adminView); setSelectedMessage(null); }}
                                    className={`px-4 py-2 rounded-2xl shadow-sm border border-sport-sand transition-all flex items-center space-x-2 ${adminView ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'bg-white text-rose-500'}`}
                                    title="Centre d'administration"
                                >
                                    <ShieldAlert size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-3 bg-white text-sport-green rounded-2xl shadow-sm border border-sport-sand active:scale-95 transition-all shadow-sport-green/5"
                                title="Modifier le profil"
                            >
                                <Edit3 size={18} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-sport-sand hover:text-rose-500 transition-colors"
                                title="Se déconnecter"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(false)} className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-sport-sand active:scale-95 transition-all">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                /* FORMULAIRE D'ÉDITION */
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center border-2 border-dashed border-sport-sand overflow-hidden shadow-xl shadow-sport-navy/5 relative">
                                {editForm.avatar_url ? (
                                    <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://avatar.vercel.sh/${editForm.username || 'user'}`} className="w-full h-full object-cover opacity-50" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-sport-green border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <label className="mt-4 flex flex-col items-center cursor-pointer">
                                <span className="text-[10px] font-bold text-sport-green bg-sport-green/5 px-6 py-2.5 rounded-xl hover:bg-sport-green hover:text-white transition-all uppercase tracking-widest border border-sport-green/10">
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

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-sport-sand shadow-sm space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pseudo de joueur</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-sport-beige/20 rounded-2xl border border-sport-sand focus:outline-none focus:ring-4 focus:ring-sport-green/5 focus:border-sport-green transition-all font-bold text-sm"
                                    value={editForm.username || ''}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Niveau</label>
                                    <select
                                        className="w-full p-4 bg-sport-beige/20 rounded-2xl border border-sport-sand appearance-none focus:outline-none focus:border-sport-green transition-all font-bold text-sm"
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
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Genre</label>
                                    <div className="flex bg-sport-beige/30 p-1 rounded-2xl border border-sport-sand">
                                        <button onClick={() => setEditForm({ ...editForm, gender: 'H' })} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${editForm.gender === 'H' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400'}`}>H</button>
                                        <button onClick={() => setEditForm({ ...editForm, gender: 'F' })} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${editForm.gender === 'F' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400'}`}>F</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-sport-sand shadow-sm space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Région</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-sport-beige/20 rounded-2xl border border-sport-sand focus:outline-none focus:border-sport-green transition-all font-bold text-sm shadow-inner"
                                    value={editForm.region || ''}
                                    onChange={e => setEditForm({ ...editForm, region: e.target.value })}
                                    placeholder="Ex: Île-de-France"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio / Style de jeu</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-4 bg-sport-beige/20 rounded-2xl border border-sport-sand resize-none focus:outline-none focus:border-sport-green transition-all font-bold text-sm shadow-inner"
                                    value={editForm.bio || ''}
                                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Décrivez votre style de jeu..."
                                />
                            </div>
                        </div>
                    </div>

                    <button onClick={handleUpdateProfile} className="w-full py-5 bg-sport-green text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-2xl shadow-sport-green/20 active:scale-95 transition-all">
                        <Check size={20} />
                        <span>Enregistrer le profil</span>
                    </button>
                </div>
            ) : adminView && profile?.role === 'admin' ? (
                /* VUE ADMIN - STYLE SOBRE */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                    {!selectedMessage ? (
                        <>
                            <div className="bg-sport-navy border border-white/10 p-8 rounded-[2.5rem] flex items-center space-x-6 shadow-2xl shadow-sport-navy/20">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-inner ring-1 ring-white/20">
                                    <ShieldAlert size={28} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg tracking-tight">Poste de Contrôle</h3>
                                    <p className="text-xs text-white/50 italic">Modération et assistance circuit.</p>
                                </div>
                            </div>

                            <div className="flex bg-sport-sand/30 p-1 rounded-2xl border border-sport-sand overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setAdminSubTab('reports')}
                                    className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${adminSubTab === 'reports' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Rapports ({reports.length})
                                </button>
                                <button
                                    onClick={() => setAdminSubTab('messages')}
                                    className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${adminSubTab === 'messages' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Tickets ({supportMessages.length})
                                </button>
                                <button
                                    onClick={() => setAdminSubTab('clubs')}
                                    className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${adminSubTab === 'clubs' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Clubs ({clubRequests.length})
                                </button>
                            </div>

                            <div className="space-y-4">
                                {adminSubTab === 'reports' ? (
                                    reports.length > 0 ? reports.map(r => (
                                        <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-sport-sand shadow-sm flex flex-col space-y-3 hover:border-rose-200 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] bg-rose-50 text-rose-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest border border-rose-100">{r.type || 'SIGNALEMENT'}</span>
                                                <span className="text-[9px] font-bold text-slate-300">ID: {r.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-xs font-bold text-sport-navy">Source: <span className="text-slate-400">UID_{r.reporter_id?.slice(0, 6)}</span></p>
                                            <p className="text-xs text-slate-500 bg-sport-beige/50 p-4 rounded-2xl italic font-medium">"{r.reason || r.content || 'Pas de détail'}"</p>
                                        </div>
                                    )) : <p className="text-center text-slate-300 py-12 italic font-medium">Aucun rapport en attente.</p>
                                ) : adminSubTab === 'messages' ? (
                                    supportMessages.length > 0 ? supportMessages.map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => {
                                                setSelectedMessage(m);
                                                fetchReplies(m.id);
                                            }}
                                            className={`bg-white p-6 rounded-[2rem] border shadow-sm space-y-4 cursor-pointer hover:border-sport-green transition-all group ${m.status === 'resolved' ? 'opacity-50 border-sport-sand grayscale' : 'border-sport-sand'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-black text-sport-navy uppercase tracking-tighter">Utilisateur: <span className="text-sport-green italic">UID_{m.user_id?.slice(0, 6)}</span></p>
                                                <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border ${m.status === 'unread' ? 'bg-sport-green text-white border-sport-green shadow-lg shadow-sport-green/20' : m.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {m.status === 'unread' ? 'Urgent' : m.status === 'in_progress' ? 'En cours' : 'Fermé'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 italic font-medium leading-relaxed">"{m.content}"</p>
                                        </div>
                                    )) : <p className="text-center text-slate-300 py-12 italic font-medium">Boîte de réception vide.</p>
                                ) : (
                                    /* ONGLET CLUBS */
                                    clubRequests.length > 0 ? clubRequests.map(req => (
                                        <div key={req.id} className="bg-white rounded-[2.5rem] border border-sport-sand shadow-sm overflow-hidden animate-in fade-in duration-500">
                                            <div className="p-6 bg-sport-beige/20 border-b border-sport-sand">
                                                <h4 className="text-lg font-black text-sport-navy uppercase tracking-tighter">{req.club_name}</h4>
                                                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                    <MapPin size={12} className="mr-1 text-sport-green" />
                                                    {req.city}, {req.country}
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center space-x-3 text-xs">
                                                        <Phone size={14} className="text-sport-navy" />
                                                        <span className="font-bold">{req.phone || 'Non renseigné'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3 text-xs">
                                                        <Clock size={14} className="text-sport-navy" />
                                                        <span className="font-bold">{req.opening_hours?.weekdays || 'Non renseigné'}</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 italic bg-white p-4 rounded-2xl border border-sport-sand">"{req.bio || 'Pas de bio'}"</p>
                                                
                                                {/* Photos de la demande */}
                                                <div className="grid grid-cols-4 gap-2">
                                                    {req.photo_urls?.map((url, i) => (
                                                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-sport-sand shadow-inner bg-sport-beige">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex space-x-3 pt-2">
                                                    <button 
                                                        onClick={() => handleApproveClub(req)}
                                                        className="flex-1 py-4 bg-sport-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sport-green/20 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                                                    >
                                                        <Check size={16} />
                                                        <span>Approuver</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRejectClub(req.id)}
                                                        className="px-6 py-4 bg-white text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 active:scale-95 transition-all"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <p className="text-center text-slate-300 py-12 italic font-medium">Aucune demande de club en attente.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* CHAT ADMIN PREMIUM */
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <button onClick={() => setSelectedMessage(null)} className="flex items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-sport-navy transition-colors">
                                <ArrowLeft size={16} className="mr-2" /> Retour au poste
                            </button>
                            <div className="bg-white rounded-[2.5rem] border border-sport-sand shadow-2xl overflow-hidden flex flex-col h-[500px]">
                                <div className="p-6 bg-sport-navy text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight">Ticket Assistance</h3>
                                        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">UID_{selectedMessage.user_id?.slice(0, 8)}</p>
                                    </div>
                                    {selectedMessage.status !== 'resolved' && (
                                        <button onClick={() => handleResolveMessage(selectedMessage.id)} className="text-[9px] font-black text-white bg-rose-600 px-4 py-2 rounded-xl active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-rose-600/30">Clôturer</button>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-sport-beige/20 shadow-inner">
                                    <div className="bg-white p-4 rounded-3xl rounded-tl-none text-xs text-sport-navy max-w-[85%] shadow-sm border border-sport-sand font-medium leading-relaxed">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase mb-2">Message Utilisateur</p>
                                        {selectedMessage.content}
                                    </div>
                                    {replies.map(r => (
                                        <div key={r.id} className="bg-sport-navy text-white p-4 rounded-3xl rounded-tr-none text-xs ml-auto max-w-[85%] shadow-xl shadow-sport-navy/10 font-medium leading-relaxed">
                                            <p className="text-[9px] font-bold text-white/40 uppercase mb-2">Ma réponse (Admin)</p>
                                            {r.content}
                                        </div>
                                    ))}
                                </div>
                                {selectedMessage.status !== 'resolved' && (
                                    <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-sport-sand flex space-x-3">
                                        <input
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Tapez votre réponse officielle..."
                                            className="flex-1 bg-sport-beige/30 border-none rounded-2xl p-4 text-xs focus:ring-2 focus:ring-sport-green/20 placeholder:text-slate-400 font-bold"
                                        />
                                        <button type="submit" className="w-14 h-14 bg-sport-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sport-green/20 hover:scale-105 active:scale-95 transition-all"><Send size={20} /></button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* VUE PROFIL NORMALE */
                <>
                    <div className="flex flex-col items-center mb-12 animate-in fade-in duration-700">
                        <div className="w-40 h-40 bg-white rounded-[3.5rem] flex items-center justify-center p-1.5 border border-sport-sand shadow-2xl shadow-sport-navy/5 overflow-hidden mb-8 transition-transform hover:scale-105 relative group">
                            <img
                                src={profile?.avatar_url || `https://avatar.vercel.sh/${profile?.username || 'user'}`}
                                className="w-full h-full object-cover rounded-[3rem]"
                                alt="Profile"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[3rem]"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-sport-navy tracking-tight">{profile?.username || 'Joueur'}</h2>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            <span className="px-5 py-2 bg-sport-green text-white text-[10px] font-bold rounded-xl uppercase tracking-widest shadow-lg shadow-sport-green/20">
                                {profile?.level || 'Débutant'}
                            </span>
                            <span className="px-5 py-2 bg-white text-sport-navy text-[10px] font-bold rounded-xl uppercase tracking-widest border border-sport-sand shadow-sm">
                                {profile?.region || 'National'}
                            </span>
                            {profile?.role === 'admin' && (
                                <span className="px-5 py-2 bg-sport-navy text-white text-[10px] font-bold rounded-xl uppercase tracking-widest flex items-center shadow-lg shadow-sport-navy/20">
                                    <ShieldAlert size={12} className="mr-2" /> Admin
                                </span>
                            )}
                            {managedClubs.length > 0 && (
                                <span className="px-5 py-2 bg-amber-500 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest flex items-center shadow-lg shadow-amber-500/20">
                                    <ShieldCheck size={12} className="mr-2" /> Gérant Club
                                </span>
                            )}
                        </div>
                        {profile?.bio && <p className="mt-8 text-center text-slate-500 text-sm italic px-10 leading-relaxed max-w-md opacity-80 font-medium">"{profile.bio}"</p>}
                    </div>

                    <div className="space-y-8">
                        {/* STATISTIQUES CARTE - STYLE CLUB PRIVE */}
                        <div className="bg-sport-navy p-10 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-sport-navy/20">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-110"></div>
                            <div className="absolute bottom-4 right-8 opacity-10 font-black text-6xl italic select-none">PP</div>
                            
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-10 relative z-10">Performances Circuit</h3>
                            
                            <div className="grid grid-cols-3 gap-8 relative z-10">
                                <div className="space-y-1">
                                    <p className="text-3xl font-bold tracking-tighter">{profile?.matches_played || 0}</p>
                                    <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">Matchs</p>
                                </div>
                                <div className="space-y-1 border-x border-white/10 px-4">
                                    <p className="text-3xl font-bold tracking-tighter text-sport-green">{profile?.matches_played > 0 ? Math.round((profile.wins / profile.matches_played) * 100) : 0}%</p>
                                    <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">Victoires</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-3xl font-bold tracking-tighter text-white">{profile?.points || 0}</p>
                                    <p className="text-[9px] text-white/50 uppercase font-black tracking-widest text-right">Points</p>
                                </div>
                            </div>
                        </div>

                        {/* INFOS COMPLEMENTAIRES */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-8 bg-white border border-sport-sand rounded-[2rem] shadow-sm flex flex-col space-y-4">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] block">Genre</p>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-sport-beige rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                        {profile?.gender === 'F' ? '👩' : '👨'}
                                    </div>
                                    <p className="font-bold text-sport-navy text-sm uppercase">{profile?.gender === 'F' ? 'Femme' : 'Homme'}</p>
                                </div>
                            </div>
                            <div className="p-8 bg-white border border-sport-sand rounded-[2rem] shadow-sm flex flex-col space-y-4 group cursor-pointer hover:border-sport-green/30 transition-all">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] block">Rang National</p>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-sport-beige rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-sport-green group-hover:text-white transition-all">
                                        🥇
                                    </div>
                                    <p className="font-bold text-sport-navy text-sm uppercase tracking-tighter">Non Classé</p>
                                </div>
                            </div>
                            {/* AIDE & SUPPORT */}
                            <div
                                onClick={() => window.location.href = '/help'}
                                className="col-span-2 bg-white px-8 py-6 rounded-[2.5rem] border border-sport-sand shadow-sm flex items-center space-x-6 cursor-pointer hover:border-sport-green transition-all group"
                            >
                                <div className="w-14 h-14 bg-sport-beige rounded-[1.5rem] flex items-center justify-center text-sport-green group-hover:bg-sport-green group-hover:text-white transition-all shadow-inner">
                                    <HelpCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sport-navy text-sm uppercase tracking-tight">Support & Assistance</p>
                                    <p className="text-[11px] text-slate-400 italic">Une question ? Notre équipe est là.</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-sport-beige flex items-center justify-center text-slate-300 group-hover:text-sport-green group-hover:rotate-45 transition-all">
                                    →
                                </div>
                            </div>
                            
                            {/* CLUBS GÉRÉS */}
                            {managedClubs.length > 0 && (
                                <div className="col-span-2 space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mt-4">Clubs que vous gérez</h3>
                                    {managedClubs.map(club => (
                                        <div 
                                            key={club.id}
                                            onClick={() => window.location.href = `/clubs/${club.id}`}
                                            className="bg-white p-6 rounded-[2.5rem] border border-sport-sand shadow-sm flex items-center justify-between group cursor-pointer hover:border-amber-400 transition-all"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-sport-navy rounded-2xl flex items-center justify-center text-white overflow-hidden shadow-inner">
                                                    {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-cover" /> : "🎾"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sport-navy text-sm uppercase">{club.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{club.city}</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                Gérer
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profil;
