import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    MapPin, Globe, Mail, Phone, Users, 
    ArrowLeft, CheckCircle, ShieldCheck, 
    Plus, UserPlus, UserMinus, Clock, 
    ChevronRight, Info
} from 'lucide-react';

const ClubDetail = ({ session }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchClubDetails();
        fetchClubMembers();
    }, [id]);

    useEffect(() => {
        if (session && members.length > 0) {
            setIsMember(members.some(m => m.user_id === session.user.id));
        }
    }, [session, members]);

    const fetchClubDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setClub(data);
        } catch (err) {
            console.error("Error fetching club:", err);
            navigate('/clubs');
        } finally {
            setLoading(false);
        }
    };

    const fetchClubMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('club_members')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url,
                        level
                    )
                `)
                .eq('club_id', id);

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error("Error fetching members:", err);
        }
    };

    const handleJoinClub = async () => {
        if (!session) return alert("Vous devez être connecté pour rejoindre un club.");
        setJoining(true);
        try {
            if (isMember) {
                const { error } = await supabase
                    .from('club_members')
                    .delete()
                    .eq('user_id', session.user.id)
                    .eq('club_id', id);
                if (error) throw error;
                setIsMember(false);
            } else {
                const { error } = await supabase
                    .from('club_members')
                    .insert([{ user_id: session.user.id, club_id: id }]);
                if (error) throw error;
                setIsMember(true);
            }
            fetchClubMembers();
        } catch (err) {
            alert(err.message);
        } finally {
            setJoining(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-sport-green border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!club) return null;

    const isManager = session?.user?.id === club.manager_id;

    return (
        <div className="pb-32 bg-sport-sky min-h-screen">
            {/* Header / Hero Section */}
            <div className="relative h-64 w-full overflow-hidden">
                <img 
                    src={club.cover_url || "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&q=80&w=1000"} 
                    className="w-full h-full object-cover"
                    alt="Club Cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sport-navy/80 to-transparent"></div>
                
                <button 
                    onClick={() => navigate('/clubs')}
                    className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all border border-white/10"
                >
                    <ArrowLeft size={20} />
                </button>

                {isManager && (
                    <div className="absolute top-6 right-6 px-4 py-2 bg-sport-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sport-green/20 flex items-center space-x-2 border border-white/20">
                        <ShieldCheck size={14} />
                        <span>Gérant du Club</span>
                    </div>
                )}
            </div>

            {/* Profile Info Overlay */}
            <div className="px-6 -mt-16 relative z-10">
                <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-sport-navy/10 border border-sport-sand">
                    <div className="flex flex-col items-center sm:items-start sm:flex-row sm:justify-between gap-6">
                        <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
                            <div className="w-24 h-24 bg-sport-navy rounded-3xl overflow-hidden shadow-xl border-4 border-white flex items-center justify-center text-white text-3xl">
                                {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-cover" /> : "🎾"}
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-3xl font-black text-sport-navy tracking-tighter leading-none">{club.name}</h1>
                                <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                                    <MapPin size={14} className="text-sport-green" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{club.city}, {club.country}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleJoinClub}
                            disabled={joining}
                            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-2 transition-all active:scale-95 shadow-lg ${
                                isMember 
                                ? 'bg-sport-sky text-slate-400 border border-sport-sand' 
                                : 'bg-sport-green text-white shadow-sport-green/20'
                            }`}
                        >
                            {joining ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : isMember ? (
                                <>
                                    <UserMinus size={18} />
                                    <span>Quitter le club</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Rejoindre</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-sport-sand grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Membres</p>
                            <p className="text-lg font-black text-sport-navy">{members.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Terrains</p>
                            <p className="text-lg font-black text-sport-navy">{club.courts_count || 0}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Note</p>
                            <p className="text-lg font-black text-sport-navy">4.8/5</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Statut</p>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-sport-green rounded-full animate-pulse"></div>
                                <p className="text-xs font-bold text-sport-green uppercase">Ouvert</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs / Sections */}
            <div className="px-6 mt-8 space-y-8">
                {/* About Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-sport-sand shadow-sm">
                    <h2 className="text-[10px] font-black text-sport-green uppercase tracking-[0.2em] mb-6">À propos du club</h2>
                    <p className="text-sm text-slate-500 leading-relaxed italic">
                        {club.description || "Aucune description fournie pour ce club."}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="flex items-center space-x-4 p-4 bg-sport-sky/30 rounded-2xl">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sport-navy shadow-sm">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Horaires</p>
                                <p className="text-xs font-bold text-sport-navy">Lun-Ven: 08:00 - 22:00</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 p-4 bg-sport-sky/30 rounded-2xl">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sport-navy shadow-sm">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                <p className="text-xs font-bold text-sport-navy">{club.contact_email || 'Non spécifié'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members List Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-sport-sand shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-[10px] font-black text-sport-green uppercase tracking-[0.2em]">Membres sur l'App ({members.length})</h2>
                        <Users size={18} className="text-slate-300" />
                    </div>
                    
                    <div className="space-y-4">
                        {members.length > 0 ? members.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-sport-sky/20 rounded-[1.5rem] hover:bg-sport-sky/40 transition-all border border-transparent hover:border-sport-sand group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden shadow-sm border border-sport-sand">
                                        <img 
                                            src={member.profiles?.avatar_url || `https://avatar.vercel.sh/${member.profiles?.username || 'user'}`} 
                                            className="w-full h-full object-cover"
                                            alt={member.profiles?.username}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sport-navy text-sm uppercase">{member.profiles?.username || 'Joueur Anonyme'}</p>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="text-[9px] font-black text-sport-green uppercase tracking-widest">{member.profiles?.level || 'Débutant'}</span>
                                            {member.role === 'manager' && <span className="text-[9px] bg-sport-navy text-white px-2 py-0.5 rounded-md font-bold uppercase">Gérant</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-sport-navy transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-sport-sky rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4 shadow-inner">
                                    <Users size={32} />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun membre pour le moment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDetail;
