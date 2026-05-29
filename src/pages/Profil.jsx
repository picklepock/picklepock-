import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, UserCircle, Edit3, X, Check, Camera, ShieldAlert, HelpCircle, ArrowLeft, Send, MapPin, Phone, Clock, Image as ImageIcon, Trash2, ShieldCheck, MessageSquare, Calendar, Users, Award, AlertTriangle, ChevronRight, Trophy } from 'lucide-react';
import Login from './Login';

const Profil = ({ session }) => {
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get('id') || session?.user?.id;
    const isOwnProfile = targetUserId === session?.user?.id;

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

    // États pour le système social (Abonnements & Publications)
    const [followersCount, setFollowersCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);

    // États pour la messagerie privée éphémère (Direct Messages)
    const [isDmOpen, setIsDmOpen] = useState(false);
    const [dmMessages, setDmMessages] = useState([]);
    const [newDmText, setNewDmText] = useState('');
    const [sendingDm, setSendingDm] = useState(false);

    // États pour le matchmaking & saisie de score
    const [userMatches, setUserMatches] = useState([]);
    const [fetchingMatches, setFetchingMatches] = useState(false);
    const [activeMatchTab, setActiveMatchTab] = useState('venir');
    const [selectedMatchForScore, setSelectedMatchForScore] = useState(null);
    const [reportingScore, setReportingScore] = useState(false);
    const [scoreForm, setScoreForm] = useState({
        scoreA: '',
        scoreB: '',
        teamAPlayers: [],
        teamBPlayers: []
    });
    const [selectedMatchChat, setSelectedMatchChat] = useState(null);

    const fetchFollowersCount = async () => {
        if (!targetUserId) return;
        const { count, error } = await supabase
            .from('profiles_followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', targetUserId);
        if (!error && count !== null) {
            setFollowersCount(count);
        }
    };

    const fetchFollowStatus = async () => {
        if (!session?.user?.id || isOwnProfile || !targetUserId) return;
        const { data, error } = await supabase
            .from('profiles_followers')
            .select('*')
            .eq('follower_id', session.user.id)
            .eq('following_id', targetUserId)
            .maybeSingle();
        if (!error) {
            setIsFollowing(!!data);
        }
    };

    const fetchPlayerPosts = async () => {
        if (!targetUserId) return;
        const { data, error } = await supabase
            .from('player_posts')
            .select('*')
            .eq('author_id', targetUserId)
            .order('created_at', { ascending: false });
        if (!error && data) {
            setPosts(data);
        }
    };

    const ensureOwnProfileExists = async () => {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!data) {
            const newProfile = {
                id: session.user.id,
                email: session.user.email || null,
                username: session.user.email ? session.user.email.split('@')[0] : (session.user.phone || 'Joueur_' + session.user.id.slice(0, 4)),
                level: 'Débutant',
                matches_played: 0,
                wins: 0,
                points: 0
            };
            const { error: createError } = await supabase
                .from('profiles')
                .insert([newProfile]);
            if (createError) throw createError;
        }
    };

    const handleFollowToggle = async () => {
        if (!session) {
            alert("Veuillez vous connecter pour vous abonner à ce joueur.");
            return;
        }
        try {
            await ensureOwnProfileExists();
            if (isFollowing) {
                const { error } = await supabase
                    .from('profiles_followers')
                    .delete()
                    .eq('follower_id', session.user.id)
                    .eq('following_id', targetUserId);
                if (error) throw error;
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                const { error } = await supabase
                    .from('profiles_followers')
                    .insert([
                        { follower_id: session.user.id, following_id: targetUserId }
                    ]);
                if (error) throw error;
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err) {
            alert("Erreur lors de l'abonnement : " + err.message);
        }
    };

    const handlePublishPost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        if (newPostContent.length > 280) {
            alert("Votre publication ne peut pas dépasser 280 caractères.");
            return;
        }
        setPosting(true);
        try {
            await ensureOwnProfileExists();
            const { error } = await supabase
                .from('player_posts')
                .insert([
                    { author_id: session.user.id, content: newPostContent.trim() }
                ]);
            if (error) throw error;
            setNewPostContent('');
            fetchPlayerPosts();
        } catch (err) {
            alert("Erreur lors de la publication : " + err.message);
        } finally {
            setPosting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette publication ?")) return;
        try {
            const { error } = await supabase
                .from('player_posts')
                .delete()
                .eq('id', postId);
            if (error) throw error;
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            alert("Erreur lors de la suppression : " + err.message);
        }
    };

    const handleToggleReaction = async (post, emoji) => {
        if (!session) {
            alert("Veuillez vous connecter pour réagir aux publications.");
            return;
        }
        const userId = session.user.id;
        const currentReactions = post.reactions || {};
        const users = currentReactions[emoji] || [];
        let newUsers;
        if (users.includes(userId)) {
            newUsers = users.filter(id => id !== userId);
        } else {
            newUsers = [...users, userId];
        }
        const updatedReactions = { ...currentReactions, [emoji]: newUsers };

        // Mises à jour optimistes de l'UI
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, reactions: updatedReactions } : p));

        const { error } = await supabase
            .from('player_posts')
            .update({ reactions: updatedReactions })
            .eq('id', post.id);
        
        if (error) {
            console.error("Erreur réaction:", error.message);
            fetchPlayerPosts();
        }
    };

    const fetchDirectMessages = async () => {
        if (!session?.user?.id || !targetUserId) return;
        const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${session.user.id})`)
            .order('created_at', { ascending: true });
        
        if (!error && data) {
            setDmMessages(data);
        }
    };

    const handleSendDirectMessage = async (e) => {
        e.preventDefault();
        if (!newDmText.trim() || !session?.user?.id || !targetUserId) return;
        if (newDmText.length > 500) {
            alert("Votre message ne peut pas dépasser 500 caractères.");
            return;
        }
        setSendingDm(true);
        try {
            await ensureOwnProfileExists();
            const { error } = await supabase
                .from('direct_messages')
                .insert([
                    {
                        sender_id: session.user.id,
                        receiver_id: targetUserId,
                        message: newDmText.trim()
                    }
                ]);
            if (error) throw error;
            setNewDmText('');
            fetchDirectMessages();
        } catch (err) {
            alert("Erreur lors de l'envoi du message : " + err.message);
        } finally {
            setSendingDm(false);
        }
    };

    useEffect(() => {
        if (!isDmOpen || !session?.user?.id || !targetUserId) return;

        fetchDirectMessages();

        const channel = supabase
            .channel(`dm_changes:${session.user.id}:${targetUserId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages'
            }, (payload) => {
                const newMsg = payload.new;
                if (
                    (newMsg.sender_id === session.user.id && newMsg.receiver_id === targetUserId) ||
                    (newMsg.sender_id === targetUserId && newMsg.receiver_id === session.user.id)
                ) {
                    setDmMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isDmOpen, session?.user?.id, targetUserId]);

    useEffect(() => {
        if (!targetUserId) {
            setLoading(false);
            return;
        }

        fetchProfile();
        fetchFollowersCount();
        fetchFollowStatus();
        fetchPlayerPosts();

        // Abonnement temps réel pour les changements de participation ou de matchs
        const channel = supabase
            .channel(`user_matches_changes:${targetUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'match_participants',
                filter: `user_id=eq.${targetUserId}`
            }, () => {
                fetchUserMatches(targetUserId);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'matches'
            }, () => {
                fetchUserMatches(targetUserId);
                // Rafraîchir aussi le profil si ses stats changent
                supabase.from('profiles').select('*').eq('id', targetUserId).single().then(({ data }) => {
                    if (data) {
                        setProfile(data);
                        if (isOwnProfile) {
                            setEditForm(data);
                        }
                    }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [targetUserId, session?.user?.id]);

    const fetchProfile = async () => {
        try {
            if (!targetUserId) {
                setLoading(false);
                return;
            }
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .single();

            if (error && error.code === 'PGRST116' && isOwnProfile && session?.user?.id) {
                const newProfile = {
                    id: session.user.id,
                    email: session.user.email || null,
                    username: session.user.email ? session.user.email.split('@')[0] : (session.user.phone || 'Joueur_' + session.user.id.slice(0, 4)),
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
                fetchManagedClubs(session.user.id);
                fetchUserMatches(session.user.id);
            } else if (error) {
                throw error;
            } else {
                setProfile(data);
                if (isOwnProfile) {
                    setEditForm(data);
                    if (data.role === 'admin') {
                        fetchAdminData();
                    }
                    fetchManagedClubs(targetUserId);
                }
                fetchUserMatches(targetUserId);
            }
        } catch (err) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserMatches = async (userId) => {
        setFetchingMatches(true);
        try {
            const { data, error } = await supabase
                .from('match_participants')
                .select(`
                    match_id,
                    status,
                    team,
                    match:matches(
                        *,
                        creator:profiles!matches_creator_id_fkey(id, username, avatar_url),
                        participants:match_participants(
                            user_id,
                            status,
                            team,
                            user:profiles(id, username, avatar_url)
                        )
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'confirmed');
            
            if (error) throw error;
            if (data) {
                const matches = data.map(item => item.match).filter(Boolean);
                setUserMatches(matches);
            }
        } catch (err) {
            console.error("Erreur chargement matchs utilisateur:", err.message);
        } finally {
            setFetchingMatches(false);
        }
    };

    const handleValidateScore = async (matchId) => {
        if (!window.confirm("Voulez-vous vraiment valider ce score ? Les points seront attribués et le match sera clôturé.")) return;
        try {
            const { error } = await supabase.rpc('validate_match_score', {
                match_uuid: matchId,
                validator_uuid: session.user.id
            });
            if (error) throw error;
            alert("Score validé, vos points ont été mis à jour ! 🏆");
            fetchProfile();
        } catch (err) {
            alert("Erreur lors de la validation : " + err.message);
        }
    };

    const handleRejectScore = async (matchId) => {
        const comment = window.prompt("Indiquez la raison de la contestation (optionnel) :");
        if (comment === null) return;
        try {
            const { error } = await supabase.rpc('reject_match_score', {
                match_uuid: matchId,
                rejecter_uuid: session.user.id
            });
            if (error) throw error;
            
            if (comment.trim()) {
                await supabase.from('match_messages').insert([{
                    match_id: matchId,
                    user_id: session.user.id,
                    content: `⚠️ Score contesté : "${comment.trim()}"`
                }]);
            }
            
            alert("Score contesté. L'organisateur a été notifié.");
            fetchProfile();
        } catch (err) {
            alert("Erreur lors de la contestation : " + err.message);
        }
    };

    const isPastMatch = (match) => {
        if (!match.date) return false;
        const matchDateTime = new Date(`${match.date}T${match.time || '00:00:00'}`);
        return matchDateTime < new Date();
    };

    const getMatchOutcome = (match, userId) => {
        const userPart = match.participants.find(p => p.user_id === userId);
        if (!userPart || !userPart.team) return 'draw';
        
        const scoreA = match.score_team_a || 0;
        const scoreB = match.score_team_b || 0;
        
        if (scoreA === scoreB) return 'draw';
        
        if (userPart.team === 'A') {
            return scoreA > scoreB ? 'win' : 'loss';
        } else if (userPart.team === 'B') {
            return scoreB > scoreA ? 'win' : 'loss';
        }
        
        return 'draw';
    };

    const handleOpenScoreModal = (match) => {
        setSelectedMatchForScore(match);
        
        if (match.type === 'Simple') {
            const creatorId = match.creator_id;
            const opponent = match.participants.find(p => p.user_id !== creatorId && p.status === 'confirmed');
            const opponentId = opponent ? opponent.user_id : null;
            
            setScoreForm({
                scoreA: '',
                scoreB: '',
                teamAPlayers: [creatorId],
                teamBPlayers: opponentId ? [opponentId] : []
            });
        } else {
            const creatorId = match.creator_id;
            setScoreForm({
                scoreA: '',
                scoreB: '',
                teamAPlayers: [creatorId],
                teamBPlayers: []
            });
        }
    };

    const handleSubmitScore = async (e) => {
        e.preventDefault();
        if (!selectedMatchForScore) return;
        
        const { scoreA, scoreB, teamAPlayers, teamBPlayers } = scoreForm;
        
        if (scoreA === '' || scoreB === '') {
            alert("Veuillez saisir les scores des deux équipes.");
            return;
        }
        
        const sA = parseInt(scoreA, 10);
        const sB = parseInt(scoreB, 10);
        if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
            alert("Les scores doivent être des nombres positifs.");
            return;
        }
        
        const limit = selectedMatchForScore.type === 'Simple' ? 2 : 4;
        const confirmedParticipants = selectedMatchForScore.participants.filter(p => p.status === 'confirmed');
        
        if (confirmedParticipants.length < limit) {
            alert(`Le match n'est pas complet (requis : ${limit} joueurs). Vous ne pouvez pas saisir le score.`);
            return;
        }
        
        if (selectedMatchForScore.type === 'Simple') {
            if (teamAPlayers.length !== 1 || teamBPlayers.length !== 1) {
                alert("Erreur dans la configuration des équipes.");
                return;
            }
        } else {
            if (teamAPlayers.length !== 2 || teamBPlayers.length !== 2) {
                alert("Pour un match de Double, chaque équipe doit avoir exactement 2 joueurs.");
                return;
            }
        }
        
        setReportingScore(true);
        try {
            const { error } = await supabase.rpc('report_match_score', {
                match_uuid: selectedMatchForScore.id,
                reporter_uuid: session.user.id,
                score_a: sA,
                score_b: sB,
                team_a_players: teamAPlayers,
                team_b_players: teamBPlayers
            });
            
            if (error) throw error;
            
            alert("Score enregistré avec succès ! L'adversaire a été notifié pour validation.");
            setSelectedMatchForScore(null);
            fetchProfile();
        } catch (err) {
            alert("Erreur lors de l'enregistrement du score : " + err.message);
        } finally {
            setReportingScore(false);
        }
    };

    const renderEmptyState = (title, description) => (
        <div className="text-center py-10 px-6 border-2 border-dashed border-sport-sand rounded-[2rem] bg-sport-beige/10">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p>
            <p className="text-[11px] text-slate-400 italic leading-relaxed">{description}</p>
        </div>
    );

    const renderPastMatchOutcome = (match) => {
        const outcome = getMatchOutcome(match, session.user.id);
        const userPart = match.participants.find(p => p.user_id === session.user.id);
        const myScore = userPart?.team === 'A' ? match.score_team_a : match.score_team_b;
        const oppScore = userPart?.team === 'A' ? match.score_team_b : match.score_team_a;
        
        if (outcome === 'win') {
            return (
                <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">🏆</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        Victoire {myScore} - {oppScore}
                    </span>
                </div>
            );
        } else if (outcome === 'loss') {
            return (
                <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px]">📉</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Défaite {myScore} - {oppScore}
                    </span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">🤝</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Égalité {myScore} - {oppScore}
                    </span>
                </div>
            );
        }
    };

    const renderMatchCard = (match, category) => {
        const isCreator = match.creator_id === session.user.id;
        const confirmedParts = match.participants.filter(p => p.status === 'confirmed');
        const limit = match.type === 'Simple' ? 2 : 4;
        
        return (
            <div key={match.id} className="bg-white p-5 rounded-[2rem] border border-sport-sand shadow-sm hover:border-sport-green/20 transition-all space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                            <Calendar size={12} className="text-sport-green" />
                            <span>{new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span>•</span>
                            <Clock size={12} className="text-sport-green" />
                            <span>{match.time.slice(0, 5)}</span>
                        </div>
                        <p className="text-xs font-bold text-sport-navy flex items-center space-x-1">
                            <MapPin size={12} className="text-slate-300" />
                            <span className="truncate max-w-[180px]">{match.location}</span>
                        </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border ${
                        match.type === 'Simple' 
                            ? 'bg-sport-sky/10 text-sport-sky border-sport-sky/20' 
                            : 'bg-sport-green/10 text-sport-green border-sport-green/20'
                    }`}>
                        {match.type}
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-b border-sport-sand/40 py-3">
                    <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Joueurs :</span>
                        <div className="flex -space-x-2.5 overflow-hidden">
                            {confirmedParts.map(p => (
                                <div key={p.user_id} className="w-6 h-6 rounded-full border border-white overflow-hidden bg-white shadow-sm" title={p.user?.username}>
                                    <img 
                                        src={p.user?.avatar_url || `https://avatar.vercel.sh/${p.user?.username}`} 
                                        className="w-full h-full object-cover" 
                                        alt={p.user?.username}
                                    />
                                </div>
                            ))}
                            {Array.from({ length: limit - confirmedParts.length }).map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[8px] text-slate-400 font-bold" title="Slot libre">
                                    +
                                </div>
                            ))}
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                        {confirmedParts.length}/{limit} places
                    </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                    {category === 'venir' && (
                        <>
                            <button
                                onClick={() => setSelectedMatchChat(match)}
                                className="flex items-center space-x-1.5 px-4 py-2 bg-sport-navy text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-sport-green transition-colors"
                            >
                                <MessageSquare size={12} />
                                <span>Chat</span>
                            </button>
                            <span className="text-[9px] font-bold text-sport-green bg-sport-green/5 px-2.5 py-1 rounded-lg border border-sport-green/10">
                                Match à venir
                            </span>
                        </>
                    )}

                    {category === 'saisir' && (
                        <>
                            <button
                                onClick={() => setSelectedMatchChat(match)}
                                className="p-2 bg-sport-beige text-sport-navy rounded-xl hover:bg-sport-sand transition-colors"
                                title="Chat du match"
                            >
                                <MessageSquare size={14} />
                            </button>
                            <button
                                onClick={() => handleOpenScoreModal(match)}
                                className="flex items-center space-x-1.5 px-5 py-2.5 bg-sport-green text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-sport-green/20 hover:scale-102 active:scale-98 transition-all"
                            >
                                <Trophy size={12} />
                                <span>Saisir score</span>
                            </button>
                        </>
                    )}

                    {category === 'valider' && (
                        <div className="w-full space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-sport-navy p-3 bg-sport-beige/35 rounded-xl border border-sport-sand">
                                <span>Score proposé :</span>
                                <span className="font-black text-sport-green bg-white px-2 py-0.5 rounded-lg border shadow-sm text-sm">
                                    {match.score_team_a} - {match.score_team_b}
                                </span>
                            </div>
                            
                            {match.score_reporter_id === session.user.id ? (
                                <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-100 text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                                    ⏳ En attente de validation
                                </div>
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleValidateScore(match.id)}
                                        className="flex-1 py-2.5 bg-sport-green text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md flex items-center justify-center space-x-1 active:scale-95 transition-all"
                                    >
                                        <Check size={12} />
                                        <span>Valider</span>
                                    </button>
                                    <button
                                        onClick={() => handleRejectScore(match.id)}
                                        className="py-2.5 px-4 bg-white text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 flex items-center justify-center active:scale-95 transition-all"
                                        title="Contester le score"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {category === 'passes' && (
                        <div className="w-full flex justify-between items-center">
                            {renderPastMatchOutcome(match)}
                            <button
                                onClick={() => setSelectedMatchChat(match)}
                                className="p-2 bg-sport-beige text-slate-400 rounded-xl hover:text-sport-navy hover:bg-sport-sand transition-colors"
                                title="Voir le chat"
                            >
                                <MessageSquare size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
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

    const upcomingMatches = userMatches.filter(m => !isPastMatch(m) && (!m.score_status || m.score_status === 'rejected'));
    const toReportMatches = userMatches.filter(m => isPastMatch(m) && (!m.score_status || m.score_status === 'rejected'));
    const toValidateMatches = userMatches.filter(m => m.score_status === 'pending');
    const pastMatches = userMatches.filter(m => m.score_status === 'validated');

    if (loading && !isEditing) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-sport-green border-t-transparent rounded-full animate-spin"></div></div>;
    if (!session && !searchParams.get('id')) return <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]"><div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6"><UserCircle size={48} /></div><h2 className="text-xl font-bold text-gray-900 mb-2">Compte non connecté</h2><Login /></div>;

    return (
        <div className="p-6 max-w-lg mx-auto pb-24 text-sport-navy">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold tracking-tight text-sport-navy">
                    {isEditing ? 'Éditer le profil' : isOwnProfile ? 'Mon Profil' : 'Profil Joueur'}
                </h1>
                <div className="flex space-x-3">
                    {!isEditing && isOwnProfile ? (
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
                    ) : isEditing ? (
                        <button onClick={() => setIsEditing(false)} className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-sport-sand active:scale-95 transition-all">
                            <X size={18} />
                        </button>
                    ) : !isOwnProfile && (
                        <button onClick={() => window.history.back()} className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-sport-sand active:scale-95 transition-all" title="Retour">
                            <ArrowLeft size={18} />
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
                        
                        {/* Abonnement et followers */}
                        <div className="flex items-center space-x-6 mt-6">
                            <div className="text-center">
                                <span className="block text-xl font-black text-sport-navy leading-none">{followersCount}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">Abonnés</span>
                            </div>
                            {!isOwnProfile && (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleFollowToggle}
                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md ${
                                            isFollowing
                                                ? 'bg-sport-sand text-sport-navy border border-sport-sand'
                                                : 'bg-sport-green text-white shadow-sport-green/20'
                                        }`}
                                    >
                                        {isFollowing ? "Abonné" : "S'abonner"}
                                    </button>
                                    {session && (
                                        <button
                                            onClick={() => setIsDmOpen(true)}
                                            className="p-3 bg-sport-navy text-white rounded-2xl active:scale-95 transition-all shadow-md shadow-sport-navy/10 flex items-center justify-center"
                                            title="Envoyer un message privé"
                                        >
                                            <MessageSquare size={16} />
                                        </button>
                                    )}
                                </div>
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

                        {/* MES MATCHS CIRCUIT */}
                        <div className="bg-white p-8 rounded-[3rem] border border-sport-sand shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase tracking-tight text-sport-navy flex items-center space-x-2">
                                    <Trophy size={20} className="text-sport-green animate-pulse" />
                                    <span>{isOwnProfile ? "Mes Matchs Circuit" : "Matchs Circuit"}</span>
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-sport-beige px-3 py-1 rounded-lg">
                                    Bêta 2026
                                </span>
                            </div>

                            {/* Navigation des Onglets */}
                            <div className="flex bg-sport-sand/35 p-1 rounded-2xl border border-sport-sand overflow-x-auto scrollbar-hide">
                                {[
                                    { id: 'venir', label: 'À venir', count: upcomingMatches.length },
                                    { id: 'saisir', label: 'À saisir', count: toReportMatches.length },
                                    { id: 'valider', label: 'À valider', count: toValidateMatches.length },
                                    { id: 'passes', label: 'Passés', count: pastMatches.length }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveMatchTab(tab.id)}
                                        className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${
                                            activeMatchTab === tab.id 
                                                ? 'bg-sport-navy text-white shadow-md' 
                                                : 'text-slate-400 hover:text-sport-navy'
                                        }`}
                                    >
                                        <span className="block truncate">{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center border shadow-sm ${
                                                activeMatchTab === tab.id 
                                                    ? 'bg-sport-green text-white border-sport-navy' 
                                                    : 'bg-sport-navy text-white border-white'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Liste des Matchs */}
                            <div className="space-y-4">
                                {fetchingMatches ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-5 h-5 border-2 border-sport-green border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        {activeMatchTab === 'venir' && (
                                            upcomingMatches.length > 0 ? (
                                                upcomingMatches.map(m => renderMatchCard(m, 'venir'))
                                            ) : (
                                                renderEmptyState("Aucun match à venir.", "Inscrivez-vous à des matchs sur la page Matches pour commencer à grimper au classement !")
                                            )
                                        )}

                                        {activeMatchTab === 'saisir' && (
                                            toReportMatches.length > 0 ? (
                                                toReportMatches.map(m => renderMatchCard(m, 'saisir'))
                                            ) : (
                                                renderEmptyState("Aucun score à saisir.", "Vos matchs passés n'attendent aucune saisie de score.")
                                            )
                                        )}

                                        {activeMatchTab === 'valider' && (
                                            toValidateMatches.length > 0 ? (
                                                toValidateMatches.map(m => renderMatchCard(m, 'valider'))
                                            ) : (
                                                renderEmptyState("Aucun score à valider.", "Aucun match n'est en attente de validation.")
                                            )
                                        )}

                                        {activeMatchTab === 'passes' && (
                                            pastMatches.length > 0 ? (
                                                pastMatches.map(m => renderMatchCard(m, 'passes'))
                                            ) : (
                                                renderEmptyState("Aucun match passé.", "Terminez et validez des matchs pour voir l'historique de vos victoires.")
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* PUBLICATIONS / FIL D'ACTUALITÉ */}
                        <div className="bg-white p-8 rounded-[3rem] border border-sport-sand shadow-sm space-y-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-sport-navy flex items-center space-x-2">
                                <MessageSquare size={20} className="text-sport-green" />
                                <span>{isOwnProfile ? "Mes Publications" : "Publications de " + (profile?.username || 'Joueur')}</span>
                            </h3>

                            {/* Formulaire de publication pour le propriétaire */}
                            {isOwnProfile && session && (
                                <form onSubmit={handlePublishPost} className="space-y-3 bg-sport-beige/15 p-4 rounded-[2rem] border border-sport-sand/65">
                                    <div className="relative">
                                        <textarea
                                            maxLength={280}
                                            value={newPostContent}
                                            onChange={e => setNewPostContent(e.target.value)}
                                            placeholder="Partagez quelque chose avec le circuit... (max 280 car.)"
                                            rows={3}
                                            className="w-full p-4 bg-white border border-sport-sand rounded-2xl resize-none focus:outline-none focus:border-sport-green transition-all text-xs font-bold shadow-inner placeholder:text-slate-400"
                                        />
                                        <span className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-400">
                                            {280 - newPostContent.length} / 280
                                        </span>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={posting || !newPostContent.trim()}
                                            className="px-5 py-2.5 bg-sport-navy text-white text-[10px] font-bold rounded-xl uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
                                        >
                                            {posting ? "Publication..." : "Publier"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Liste des publications */}
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-none">
                                {posts.length > 0 ? (
                                    posts.map(post => (
                                        <div key={post.id} className="p-5 bg-sport-sand/15 rounded-3xl border border-sport-sand/40 relative group">
                                            <p className="text-xs text-sport-navy font-bold leading-relaxed whitespace-pre-wrap">
                                                {post.content}
                                            </p>

                                            {/* Réactions émojis */}
                                            <div className="flex items-center space-x-2 mt-4">
                                                {['👍', '🔥', '👏', '😂'].map(emoji => {
                                                    const reactors = post.reactions?.[emoji] || [];
                                                    const hasReacted = session && reactors.includes(session.user.id);
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleToggleReaction(post, emoji)}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all flex items-center space-x-1 ${
                                                                hasReacted 
                                                                    ? 'bg-sport-green/10 text-sport-green border border-sport-green/20' 
                                                                    : 'bg-sport-sand/30 text-slate-500 hover:bg-sport-sand/55 hover:text-sport-navy border border-sport-sand/40'
                                                            }`}
                                                        >
                                                            <span>{emoji}</span>
                                                            {reactors.length > 0 && <span className="text-[10px]">{reactors.length}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-sport-sand/30">
                                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {new Date(post.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {isOwnProfile && (
                                                    <button
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                                        title="Supprimer la publication"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400 italic text-xs">
                                        Aucune publication pour le moment.
                                    </div>
                                )}
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

            {/* MODAL DE SAISIE DE SCORE */}
            {selectedMatchForScore && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/20">
                        {/* Header */}
                        <div className="p-6 bg-sport-navy text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                                    <Trophy size={16} className="text-sport-green" />
                                    <span>Saisir le score du match</span>
                                </h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-bold">📍 {selectedMatchForScore.location}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedMatchForScore(null)} 
                                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmitScore} className="p-6 space-y-6">
                            {selectedMatchForScore.type === 'Double' ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-sport-beige/30 rounded-2xl border border-sport-sand">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Composition des équipes (Double)</p>
                                        <p className="text-[10px] text-slate-500 italic mb-4 leading-relaxed">
                                            Assignez chaque joueur à son équipe. Chaque équipe doit compter exactement 2 joueurs.
                                        </p>
                                        
                                        <div className="space-y-3">
                                            {selectedMatchForScore.participants
                                                .filter(p => p.status === 'confirmed')
                                                .map(p => {
                                                    const inA = scoreForm.teamAPlayers.includes(p.user_id);
                                                    const inB = scoreForm.teamBPlayers.includes(p.user_id);
                                                    
                                                    return (
                                                        <div key={p.user_id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-sport-sand shadow-sm">
                                                            <div className="flex items-center space-x-2.5">
                                                                <div className="w-8 h-8 rounded-full border border-sport-sand overflow-hidden shrink-0">
                                                                    <img 
                                                                        src={p.user?.avatar_url || `https://avatar.vercel.sh/${p.user?.username}`} 
                                                                        className="w-full h-full object-cover" 
                                                                        alt={p.user?.username}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-bold text-sport-navy truncate max-w-[130px]">
                                                                    {p.user?.username || 'Joueur'}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex bg-sport-beige/50 p-0.5 rounded-lg border border-sport-sand">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        let newA = scoreForm.teamAPlayers.filter(id => id !== p.user_id);
                                                                        let newB = scoreForm.teamBPlayers.filter(id => id !== p.user_id);
                                                                        newA.push(p.user_id);
                                                                        setScoreForm({ ...scoreForm, teamAPlayers: newA, teamBPlayers: newB });
                                                                    }}
                                                                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                                                                        inA 
                                                                            ? 'bg-sport-green text-white shadow-sm' 
                                                                            : 'text-slate-400 hover:text-sport-navy'
                                                                    }`}
                                                                >
                                                                    Équipe A
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        let newA = scoreForm.teamAPlayers.filter(id => id !== p.user_id);
                                                                        let newB = scoreForm.teamBPlayers.filter(id => id !== p.user_id);
                                                                        newB.push(p.user_id);
                                                                        setScoreForm({ ...scoreForm, teamAPlayers: newA, teamBPlayers: newB });
                                                                    }}
                                                                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                                                                        inB 
                                                                            ? 'bg-sport-sky text-sport-navy shadow-sm' 
                                                                            : 'text-slate-400 hover:text-sport-navy'
                                                                    }`}
                                                                >
                                                                    Équipe B
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-4 text-[9px] font-bold">
                                            <span className={scoreForm.teamAPlayers.length === 2 ? 'text-sport-green' : 'text-rose-500'}>
                                                Équipe A : {scoreForm.teamAPlayers.length}/2
                                            </span>
                                            <span className={scoreForm.teamBPlayers.length === 2 ? 'text-sport-sky' : 'text-rose-500'}>
                                                Équipe B : {scoreForm.teamBPlayers.length}/2
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-sport-beige/30 rounded-2xl border border-sport-sand text-center">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Match Simple (Singles)</p>
                                    <p className="text-xs font-bold text-sport-navy">
                                        {selectedMatchForScore.creator?.username || 'Équipe A'} vs {selectedMatchForScore.participants.find(p => p.user_id !== selectedMatchForScore.creator_id)?.user?.username || 'Équipe B'}
                                    </p>
                                </div>
                            )}

                            {/* Inputs de Scores */}
                            <div className="grid grid-cols-2 gap-6 bg-sport-beige/10 p-6 rounded-[2.5rem] border border-sport-sand">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Score Équipe A</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={scoreForm.scoreA}
                                        onChange={e => setScoreForm({ ...scoreForm, scoreA: e.target.value })}
                                        className="w-full text-center py-4 bg-white border border-sport-sand rounded-2xl text-2xl font-black text-sport-navy focus:outline-none focus:border-sport-green focus:ring-4 focus:ring-sport-green/5 shadow-inner"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Score Équipe B</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={scoreForm.scoreB}
                                        onChange={e => setScoreForm({ ...scoreForm, scoreB: e.target.value })}
                                        className="w-full text-center py-4 bg-white border border-sport-sand rounded-2xl text-2xl font-black text-sport-navy focus:outline-none focus:border-sport-green focus:ring-4 focus:ring-sport-green/5 shadow-inner"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={reportingScore}
                                className="w-full py-5 bg-sport-green text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-2xl shadow-sport-green/20 hover:scale-102 active:scale-98 disabled:opacity-50 transition-all"
                            >
                                {reportingScore ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        <span>Soumettre le score</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CHAT DU MATCH */}
            {selectedMatchChat && (
                <MatchChatModal
                    match={selectedMatchChat}
                    onClose={() => setSelectedMatchChat(null)}
                    session={session}
                />
            )}

            {/* MODAL MESSAGERIE PRIVÉE ÉPHÉMÈRE */}
            {isDmOpen && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/20 flex flex-col h-[500px]">
                        {/* Header */}
                        <div className="p-6 bg-sport-navy text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                                    <MessageSquare size={16} className="text-sport-green" />
                                    <span>Discussion privée éphémère</span>
                                </h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-bold">Avec {profile?.username || 'Joueur'}</p>
                            </div>
                            <button 
                                onClick={() => setIsDmOpen(false)} 
                                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-sport-beige/25 shadow-inner scrollbar-none">
                            {dmMessages.length > 0 ? (
                                dmMessages.map(msg => {
                                    const isMe = msg.sender_id === session?.user?.id;
                                    return (
                                        <div 
                                            key={msg.id} 
                                            className={`max-w-[80%] p-4 rounded-3xl text-xs font-bold leading-relaxed whitespace-pre-wrap ${
                                                isMe 
                                                    ? 'bg-sport-navy text-white rounded-tr-none ml-auto shadow-md' 
                                                    : 'bg-white text-sport-navy rounded-tl-none border border-sport-sand shadow-sm'
                                            }`}
                                        >
                                            <p>{msg.message}</p>
                                            <span className={`block text-[7px] mt-1.5 uppercase ${isMe ? 'text-white/40 text-right' : 'text-slate-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                                    <span className="text-2xl">💬</span>
                                    <p className="text-xs text-slate-400 italic">Aucun message. Les discussions s'autodétruisent après 7 jours.</p>
                                </div>
                            )}
                        </div>

                        {/* Send Input */}
                        <form onSubmit={handleSendDirectMessage} className="p-4 bg-white border-t border-sport-sand flex space-x-3 shrink-0">
                            <input
                                maxLength={500}
                                value={newDmText}
                                onChange={e => setNewDmText(e.target.value)}
                                placeholder="Écrire un message privé..."
                                className="flex-1 bg-sport-beige/30 border-none rounded-2xl px-4 py-3.5 text-xs focus:ring-2 focus:ring-sport-green/20 placeholder:text-slate-400 font-bold"
                            />
                            <button 
                                type="submit" 
                                disabled={sendingDm || !newDmText.trim()}
                                className="w-12 h-12 bg-sport-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sport-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// COMPOSANT CHAT DE MATCH EN TEMPS RÉEL
// ==========================================
const MatchChatModal = ({ match, onClose, session }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('match_messages')
            .select('*, user:profiles(username, avatar_url)')
            .eq('match_id', match.id)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel(`match_messages:${match.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'match_messages',
                filter: `match_id=eq.${match.id}`
            }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [match.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !session) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('match_messages')
                .insert([{
                    match_id: match.id,
                    user_id: session.user.id,
                    content: newMessage.trim()
                }]);
            if (error) throw error;
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-sport-beige rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/20 flex flex-col h-[550px]">
                {/* Header */}
                <div className="p-6 bg-sport-navy text-white flex justify-between items-center border-b border-white/10 shrink-0">
                    <div>
                        <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                            <MessageSquare size={16} className="text-sport-green animate-pulse" />
                            <span>Chat du Match</span>
                        </h3>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-bold">📍 {match.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white/40 shadow-inner">
                    {messages.length > 0 ? (
                        messages.map((msg) => {
                            const isMe = msg.user_id === session?.user?.id;
                            return (
                                <div key={msg.id} className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full border border-sport-sand overflow-hidden shrink-0 bg-white shadow-sm">
                                        <img 
                                            src={msg.user?.avatar_url || `https://avatar.vercel.sh/${msg.user?.username}`} 
                                            className="w-full h-full object-cover" 
                                            alt={msg.user?.username}
                                        />
                                    </div>
                                    <div className={`p-3.5 rounded-2xl text-xs max-w-[75%] font-medium leading-relaxed shadow-sm ${
                                        isMe 
                                            ? 'bg-sport-navy text-white rounded-tr-none' 
                                            : 'bg-white text-sport-navy rounded-tl-none border border-sport-sand'
                                    }`}>
                                        {!isMe && <p className="text-[9px] font-black text-sport-green uppercase tracking-wider mb-1">{msg.user?.username || 'Joueur'}</p>}
                                        <p>{msg.content}</p>
                                        <span className={`text-[8px] block text-right mt-1.5 ${isMe ? 'text-white/50' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
                            <span className="text-3xl">💬</span>
                            <p className="text-xs font-bold text-sport-navy uppercase tracking-widest">Aucun message</p>
                            <p className="text-[11px] text-slate-500 italic">Discutez ici pour organiser le match (rdv, couleur de t-shirt, etc.) !</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-sport-sand flex space-x-3 shrink-0">
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-grow bg-sport-beige/30 border border-sport-sand/50 rounded-2xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:border-sport-green/50 placeholder:text-slate-400"
                    />
                    <button type="submit" disabled={loading} className="p-4 bg-sport-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sport-green/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shrink-0">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profil;
