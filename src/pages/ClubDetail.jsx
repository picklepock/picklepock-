import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    MapPin, Globe, Mail, Phone, Users, 
    ArrowLeft, CheckCircle, ShieldCheck, 
    Plus, UserPlus, UserMinus, Clock, 
    ChevronRight, Info, Calendar, DollarSign,
    TrendingUp, PlusCircle, Search, Trash2, CreditCard
} from 'lucide-react';

const ClubDetail = ({ session }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // -- Global States
    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [joining, setJoining] = useState(false);
    const [activeTab, setActiveTab] = useState('about'); // 'about', 'booking', 'dashboard'

    // -- Courts & Bookings States
    const [courts, setCourts] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loadingDbInfo, setLoadingDbInfo] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // -- Manager Dashboard Form/Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddCourtModal, setShowAddCourtModal] = useState(false);
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);
    const [newCourtData, setNewCourtData] = useState({ name: '', sport: 'Pickleball', type: 'Outdoor', hourly_rate: 20 });
    const [newBookingData, setNewBookingData] = useState({ client_name: '', court_id: '', start_time: '', end_time: '', payment_status: 'pending' });

    // -- Client Booking Selector States
    const [bookingDate, setBookingDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [bookingSport, setBookingSport] = useState('Pickleball');
    const [selectedSlot, setSelectedSlot] = useState(null); // { time: '14:00', court: {id, name, hourly_rate} }
    const [showConfirmBookingModal, setShowConfirmBookingModal] = useState(false);

    // -- Mock Fallbacks (If Supabase Tables are not created yet)
    const mockCourts = [
        { id: 'mc-1', name: 'Court Central A', sport: 'Pickleball', type: 'Outdoor', hourly_rate: 15, club_id: id },
        { id: 'mc-2', name: 'Court VIP B', sport: 'Pickleball', type: 'Indoor', hourly_rate: 25, club_id: id },
        { id: 'mc-3', name: 'Court Padel 1', sport: 'Padel', type: 'Indoor', hourly_rate: 30, club_id: id }
    ];

    const mockBookings = [
        {
            id: 'mb-1',
            court_id: 'mc-1',
            client_name: 'Jean Dupont',
            start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // started 15 mins ago
            end_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),   // ends in 45 mins
            status: 'confirmed',
            payment_status: 'paid',
            total_price: 15
        },
        {
            id: 'mb-2',
            court_id: 'mc-2',
            client_name: 'Paul Martin',
            start_time: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // starts in 2 hours
            end_time: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
            status: 'confirmed',
            payment_status: 'pending',
            total_price: 25
        }
    ];

    // -- Fetch Details on Load
    useEffect(() => {
        fetchClubDetails();
        fetchClubMembers();
        fetchCourtsAndBookings();
    }, [id]);

    // -- Clock ticking to refresh occupancy times
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 10000); // tick every 10 seconds
        return () => clearInterval(interval);
    }, []);

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
            console.error("Error fetching club details:", err);
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

    const fetchCourtsAndBookings = async () => {
        setLoadingDbInfo(true);
        try {
            // Fetch Courts
            const { data: courtData, error: courtErr } = await supabase
                .from('courts')
                .select('*')
                .eq('club_id', id)
                .order('name');
            
            if (courtErr) throw courtErr;

            // Fetch Bookings
            const courtIds = (courtData || []).map(c => c.id);
            let bookingData = [];
            if (courtIds.length > 0) {
                const { data: bookData, error: bookErr } = await supabase
                    .from('bookings')
                    .select('*')
                    .in('court_id', courtIds)
                    .order('start_time', { ascending: true });
                if (bookErr) throw bookErr;
                bookingData = bookData || [];
            }

            setCourts(courtData || []);
            setBookings(bookingData);
        } catch (err) {
            console.warn("Database tables 'courts' or 'bookings' missing/inaccessible. Falling back to Mock Data.", err.message);
            setCourts(mockCourts);
            setBookings(mockBookings);
        } finally {
            setLoadingDbInfo(false);
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

    // ============================================================
    // LOGIQUE GÉRANT (ADD / REMOVE / UPDATE)
    // ============================================================

    const handleAddCourt = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('courts')
                .insert([{ ...newCourtData, club_id: id }])
                .select()
                .single();
            if (error) throw error;
            setCourts([...courts, data]);
            alert("Terrain ajouté avec succès !");
            setShowAddCourtModal(false);
        } catch (err) {
            console.warn("Table insert failed, executing mock insertion", err.message);
            const mockNewCourt = { ...newCourtData, id: 'mc-' + Math.random(), club_id: id };
            setCourts([...courts, mockNewCourt]);
            setShowAddCourtModal(false);
        }
    };

    const handleAddBooking = async (e) => {
        e.preventDefault();
        const court = courts.find(c => c.id === newBookingData.court_id);
        const rate = court ? parseFloat(court.hourly_rate) : 20.00;
        const start = new Date(newBookingData.start_time);
        const end = new Date(newBookingData.end_time);
        const hours = Math.max(1, (end - start) / (1000 * 60 * 60));
        const totalPrice = rate * hours;

        try {
            const { data, error } = await supabase
                .from('bookings')
                .insert([{
                    court_id: newBookingData.court_id,
                    client_name: newBookingData.client_name,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    payment_status: newBookingData.payment_status,
                    status: 'confirmed',
                    total_price: totalPrice
                }])
                .select()
                .single();
            if (error) throw error;
            setBookings([...bookings, data]);
            alert("Réservation ajoutée !");
            setShowAddBookingModal(false);
        } catch (err) {
            console.warn("Table insert failed, executing mock insertion", err.message);
            const mockNewBooking = {
                id: 'mb-' + Math.random(),
                court_id: newBookingData.court_id,
                client_name: newBookingData.client_name,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                payment_status: newBookingData.payment_status,
                status: 'confirmed',
                total_price: totalPrice
            };
            setBookings([...bookings, mockNewBooking]);
            setShowAddBookingModal(false);
        }
    };

    const handleTogglePayment = async (bookingId) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        const newStatus = booking.payment_status === 'paid' ? 'pending' : 'paid';

        try {
            const { error } = await supabase
                .from('bookings')
                .update({ payment_status: newStatus })
                .eq('id', bookingId);
            if (error) throw error;
            setBookings(bookings.map(b => b.id === bookingId ? { ...b, payment_status: newStatus } : b));
        } catch (err) {
            console.warn("Table update failed, modifying local state", err.message);
            setBookings(bookings.map(b => b.id === bookingId ? { ...b, payment_status: newStatus } : b));
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Voulez-vous vraiment annuler cette réservation ?")) return;
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);
            if (error) throw error;
            setBookings(bookings.filter(b => b.id !== bookingId));
        } catch (err) {
            console.warn("Table delete failed, modifying local state", err.message);
            setBookings(bookings.filter(b => b.id !== bookingId));
        }
    };

    // ============================================================
    // LOGIQUE RESERVATION CLIENT
    // ============================================================

    // Génère des créneaux de 08:00 à 21:00
    const timeSlots = [];
    for (let h = 8; h <= 21; h++) {
        const timeStr = `${h.toString().padStart(2, '0')}:00`;
        timeSlots.push(timeStr);
    }

    const checkSlotAvailability = (timeStr, courtId) => {
        // Crée des dates de début et de fin pour ce créneau de 1 heure
        const slotStart = new Date(`${bookingDate}T${timeStr}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        // Vérifie si une réservation active chevauche
        return !bookings.some(b => {
            if (b.court_id !== courtId || b.status === 'cancelled') return false;
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);
            return (slotStart < bEnd && slotEnd > bStart);
        });
    };

    const handleSelectSlot = (timeStr, court) => {
        setSelectedSlot({ time: timeStr, court });
        setShowConfirmBookingModal(true);
    };

    const handleConfirmBooking = async () => {
        if (!session) {
            alert("Veuillez vous connecter pour effectuer une réservation.");
            setShowConfirmBookingModal(false);
            return;
        }

        const slotStart = new Date(`${bookingDate}T${selectedSlot.time}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        try {
            const { data, error } = await supabase
                .from('bookings')
                .insert([{
                    court_id: selectedSlot.court.id,
                    user_id: session.user.id,
                    client_name: session.user.email.split('@')[0],
                    start_time: slotStart.toISOString(),
                    end_time: slotEnd.toISOString(),
                    total_price: selectedSlot.court.hourly_rate,
                    payment_status: 'paid', // Simulate pre-paid
                    status: 'confirmed'
                }])
                .select()
                .single();
            
            if (error) throw error;
            setBookings([...bookings, data]);
            alert("Réservation confirmée avec succès ! 🎾");
        } catch (err) {
            console.warn("Table insert failed, simulating confirmation", err.message);
            const mockNewBooking = {
                id: 'mb-' + Math.random(),
                court_id: selectedSlot.court.id,
                client_name: session.user.email ? session.user.email.split('@')[0] : 'Client',
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                total_price: selectedSlot.court.hourly_rate,
                payment_status: 'paid',
                status: 'confirmed'
            };
            setBookings([...bookings, mockNewBooking]);
            alert("Réservation confirmée (Simulation) ! 🎾");
        } finally {
            setShowConfirmBookingModal(false);
            setSelectedSlot(null);
        }
    };

    // ============================================================
    // CALCULS STATISTIQUES TABLEAU DE BORD (GÉRANT)
    // ============================================================

    // 1. Occupation en temps réel
    const getActiveBooking = (courtId) => {
        const now = new Date(currentTime);
        return bookings.find(b => {
            if (b.court_id !== courtId || b.status === 'cancelled') return false;
            const start = new Date(b.start_time);
            const end = new Date(b.end_time);
            return (now >= start && now <= end);
        });
    };

    const occupiedCourtsCount = courts.filter(c => getActiveBooking(c.id)).length;
    const occupancyRate = courts.length > 0 ? Math.round((occupiedCourtsCount / courts.length) * 100) : 0;

    // 2. Revenus du jour (bookings commençant aujourd'hui)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRevenue = bookings
        .filter(b => {
            if (b.status === 'cancelled') return false;
            const bDateStr = new Date(b.start_time).toISOString().split('T')[0];
            return bDateStr === todayStr;
        })
        .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

    // Filtered bookings for datatable
    const filteredBookings = bookings.filter(b => 
        b.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-sport-green border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!club) return null;

    const isManager = session?.user?.id === club.manager_id;

    return (
        <div className="pb-32 bg-sport-sky min-h-screen font-['Plus_Jakarta_Sans']">
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
                    <div className="absolute top-6 right-6 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center space-x-2 border border-white/20">
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
                            <p className="text-lg font-black text-sport-navy">{courts.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Taux d'occupation</p>
                            <p className="text-lg font-black text-sport-navy">{occupancyRate}%</p>
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

            {/* TAB BAR NAVIGATION */}
            <div className="px-6 mt-8">
                <div className="flex bg-sport-sand/40 p-1.5 rounded-[2rem] border border-sport-sand max-w-lg mx-auto">
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${activeTab === 'about' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                    >
                        À propos
                    </button>
                    <button
                        onClick={() => setActiveTab('booking')}
                        className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${activeTab === 'booking' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                    >
                        Réservation
                    </button>
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex-1 py-3 rounded-[1.5rem] text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-sport-navy text-white shadow-lg' : 'text-slate-400 hover:text-sport-navy'}`}
                        >
                            Gérant
                        </button>
                    )}
                </div>
            </div>

            {/* TAB CONTENTS */}
            <div className="px-6 mt-8 space-y-8 max-w-3xl mx-auto">
                
                {/* 1. ABOUT & MEMBERS TAB */}
                {activeTab === 'about' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* About Card */}
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

                        {/* Members Card */}
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
                )}

                {/* 2. CLIENT BOOKING SPACE TAB */}
                {activeTab === 'booking' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Selector Controls Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-sport-sand shadow-sm space-y-6">
                            <h2 className="text-[10px] font-black text-sport-green uppercase tracking-[0.2em]">Sélectionner les détails</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date de réservation</label>
                                    <input 
                                        type="date"
                                        value={bookingDate}
                                        onChange={e => setBookingDate(e.target.value)}
                                        className="w-full p-4 bg-sport-sky/20 rounded-2xl border border-sport-sand focus:outline-none focus:border-sport-green transition-all font-bold text-sm text-sport-navy"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sport</label>
                                    <div className="flex bg-sport-sky/20 p-1 rounded-2xl border border-sport-sand">
                                        {['Pickleball', 'Padel', 'Tennis'].map(sport => (
                                            <button
                                                key={sport}
                                                onClick={() => setBookingSport(sport)}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${bookingSport === sport ? 'bg-sport-navy text-white shadow-md' : 'text-slate-400'}`}
                                            >
                                                {sport}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Availability Grid */}
                        <div className="bg-white rounded-[3rem] p-8 border border-sport-sand shadow-sm space-y-6">
                            <h2 className="text-[10px] font-black text-sport-green uppercase tracking-[0.2em]">Créneaux horaires de 1 Heure</h2>

                            <div className="space-y-6">
                                {courts.filter(c => c.sport === bookingSport).length > 0 ? (
                                    courts.filter(c => c.sport === bookingSport).map(court => (
                                        <div key={court.id} className="border-b border-sport-sand/40 pb-6 last:border-b-0 last:pb-0">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-sm text-sport-navy uppercase tracking-tight">{court.name} <span className="text-[10px] text-slate-400 font-medium normal-case">({court.type})</span></h4>
                                                <span className="text-xs font-black text-sport-green">{court.hourly_rate}€ / h</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                                {timeSlots.map(slot => {
                                                    const available = checkSlotAvailability(slot, court.id);
                                                    return (
                                                        <button
                                                            key={slot}
                                                            disabled={!available}
                                                            onClick={() => handleSelectSlot(slot, court)}
                                                            className={`py-3 rounded-xl text-[11px] font-bold tracking-tight text-center transition-all ${
                                                                available 
                                                                ? 'bg-sport-sky/40 text-sport-navy hover:bg-sport-green hover:text-white active:scale-95 shadow-sm border border-sport-sand' 
                                                                : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-sport-sky rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4 shadow-inner">🎾</div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun terrain disponible pour ce sport</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. MANAGER DASHBOARD TAB (ONLY ACCESSIBLE TO THE MANAGER) */}
                {activeTab === 'dashboard' && isManager && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* 3.1 Overview Statistics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {/* Card 1: Total Terrains */}
                            <div className="bg-white p-6 rounded-[2.5rem] border border-sport-sand shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Terrains Totaux</p>
                                    <h3 className="text-3xl font-black text-sport-navy mt-1">{courts.length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-sport-sky/40 rounded-2xl flex items-center justify-center text-sport-navy">
                                    <Info size={20} />
                                </div>
                            </div>
                            
                            {/* Card 2: Occupancy Rate */}
                            <div className="bg-white p-6 rounded-[2.5rem] border border-sport-sand shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taux d'occupation</p>
                                    <h3 className="text-3xl font-black text-sport-green mt-1">{occupancyRate}%</h3>
                                </div>
                                <div className="w-12 h-12 bg-sport-green/10 rounded-2xl flex items-center justify-center text-sport-green">
                                    <TrendingUp size={20} />
                                </div>
                            </div>

                            {/* Card 3: Today's Revenue */}
                            <div className="bg-white p-6 rounded-[2.5rem] border border-sport-sand shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenus du Jour</p>
                                    <h3 className="text-3xl font-black text-sport-navy mt-1">{todayRevenue}€</h3>
                                </div>
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                        </div>

                        {/* 3.2 Dynamic Terrains Grid */}
                        <div className="bg-white rounded-[3rem] p-8 border border-sport-sand shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-[10px] font-black text-sport-green uppercase tracking-[0.2em]">Suivi temps réel des terrains</h2>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Statut instantané d'occupation des terrains</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddCourtModal(true)}
                                    className="p-2.5 bg-sport-green text-white rounded-xl shadow-md shadow-sport-green/10 hover:scale-105 transition-all flex items-center space-x-1"
                                >
                                    <Plus size={16} />
                                    <span className="text-[10px] font-bold pr-1">Ajouter</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {courts.map(court => {
                                    const activeBooking = getActiveBooking(court.id);
                                    const minutesLeft = activeBooking 
                                        ? Math.max(0, Math.round((new Date(activeBooking.end_time) - currentTime) / 60000)) 
                                        : 0;

                                    return (
                                        <div 
                                            key={court.id} 
                                            className={`p-6 rounded-[2rem] border transition-all flex justify-between items-center ${
                                                activeBooking 
                                                ? 'bg-rose-50/30 border-rose-100 shadow-sm' 
                                                : 'bg-sport-sky/20 border-sport-sand shadow-inner'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-xs uppercase text-sport-navy tracking-tight">{court.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{court.sport} • {court.type}</p>
                                                
                                                {activeBooking ? (
                                                    <div className="flex items-center space-x-1.5 mt-2">
                                                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Loué par : {activeBooking.client_name}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-1.5 mt-2">
                                                        <span className="w-2 h-2 bg-sport-green rounded-full"></span>
                                                        <p className="text-[10px] font-bold text-sport-green uppercase tracking-tighter">Libre</p>
                                                    </div>
                                                )}
                                            </div>

                                            {activeBooking && (
                                                <div className="text-right">
                                                    <span className="block text-2xl font-black text-rose-600 tracking-tight leading-none">{minutesLeft}</span>
                                                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">minutes rest.</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3.3 Datatable reservations */}
                        <div className="bg-white rounded-[3rem] p-8 border border-sport-sand shadow-sm space-y-6 overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-[10px] font-black text-sport-green uppercase tracking-[0.2em]">Gestion globale des réservations</h2>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Historique et planification de l'occupation</p>
                                </div>
                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                    <div className="relative flex-grow sm:flex-grow-0">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Chercher client..."
                                            className="w-full pl-10 pr-4 py-2 bg-sport-sky/20 border border-sport-sand rounded-xl focus:outline-none focus:border-sport-green text-xs font-bold"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setShowAddBookingModal(true)}
                                        className="p-2.5 bg-sport-navy text-white rounded-xl shadow-lg shadow-sport-navy/10 hover:scale-105 transition-all flex items-center space-x-1 whitespace-nowrap"
                                    >
                                        <PlusCircle size={16} />
                                        <span className="text-[10px] font-bold pr-1">Créer Résa</span>
                                    </button>
                                </div>
                            </div>

                            {/* Responsive Table */}
                            <div className="overflow-x-auto -mx-8 px-8">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-sport-sand/40 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="py-4 pr-4">Client</th>
                                            <th className="py-4 px-4">Terrain</th>
                                            <th className="py-4 px-4">Horaires</th>
                                            <th className="py-4 px-4">Paiement</th>
                                            <th className="py-4 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.length > 0 ? (
                                            filteredBookings.map(b => {
                                                const court = courts.find(c => c.id === b.court_id);
                                                const startStr = new Date(b.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                                const endStr = new Date(b.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                                const dateStr = new Date(b.start_time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

                                                return (
                                                    <tr key={b.id} className="border-b border-sport-sand/20 text-xs font-bold text-sport-navy hover:bg-sport-sky/10 transition-colors">
                                                        <td className="py-4 pr-4 uppercase tracking-tight">{b.client_name}</td>
                                                        <td className="py-4 px-4">{court?.name || 'N/A'}</td>
                                                        <td className="py-4 px-4 text-slate-400">Le {dateStr} de {startStr} à {endStr}</td>
                                                        <td className="py-4 px-4">
                                                            <button 
                                                                onClick={() => handleTogglePayment(b.id)}
                                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                                    b.payment_status === 'paid' 
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                                                                    : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                                                                }`}
                                                            >
                                                                {b.payment_status === 'paid' ? 'Payé' : 'En attente'}
                                                            </button>
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <button 
                                                                onClick={() => handleCancelBooking(b.id)}
                                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all inline-flex items-center"
                                                                title="Annuler"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-slate-400 italic">Aucune réservation trouvée.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD COURT MODAL (GÉRANT) */}
            {showAddCourtModal && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-6 bg-sport-navy text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm tracking-tight">Ajouter un Terrain</h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Enregistrer un nouvel équipement</p>
                            </div>
                            <button onClick={() => setShowAddCourtModal(false)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white">✕</button>
                        </div>
                        <form onSubmit={handleAddCourt} className="p-6 space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nom du terrain</label>
                                <input 
                                    type="text" required
                                    value={newCourtData.name}
                                    onChange={e => setNewCourtData({ ...newCourtData, name: e.target.value })}
                                    placeholder="Ex: Court Central A"
                                    className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sport</label>
                                    <select 
                                        value={newCourtData.sport}
                                        onChange={e => setNewCourtData({ ...newCourtData, sport: e.target.value })}
                                        className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                    >
                                        <option>Pickleball</option>
                                        <option>Padel</option>
                                        <option>Tennis</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Type</label>
                                    <select 
                                        value={newCourtData.type}
                                        onChange={e => setNewCourtData({ ...newCourtData, type: e.target.value })}
                                        className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                    >
                                        <option>Outdoor</option>
                                        <option>Indoor</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tarif horaire (€)</label>
                                <input 
                                    type="number" required min="1"
                                    value={newCourtData.hourly_rate}
                                    onChange={e => setNewCourtData({ ...newCourtData, hourly_rate: e.target.value })}
                                    className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-sport-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-sport-green/20">
                                Confirmer la création
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD BOOKING MODAL (GÉRANT) */}
            {showAddBookingModal && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-6 bg-sport-navy text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm tracking-tight">Créer une Réservation</h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Enregistrer manuellement un créneau</p>
                            </div>
                            <button onClick={() => setShowAddBookingModal(false)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white">✕</button>
                        </div>
                        <form onSubmit={handleAddBooking} className="p-6 space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nom du client</label>
                                <input 
                                    type="text" required
                                    value={newBookingData.client_name}
                                    onChange={e => setNewBookingData({ ...newBookingData, client_name: e.target.value })}
                                    placeholder="Ex: Jean Dupont"
                                    className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sélectionner Terrain</label>
                                <select 
                                    required
                                    value={newBookingData.court_id}
                                    onChange={e => setNewBookingData({ ...newBookingData, court_id: e.target.value })}
                                    className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                >
                                    <option value="">Choisir un terrain...</option>
                                    {courts.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.sport})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Début</label>
                                    <input 
                                        type="datetime-local" required
                                        value={newBookingData.start_time}
                                        onChange={e => setNewBookingData({ ...newBookingData, start_time: e.target.value })}
                                        className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-xs focus:outline-none focus:border-sport-green text-sport-navy"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Fin</label>
                                    <input 
                                        type="datetime-local" required
                                        value={newBookingData.end_time}
                                        onChange={e => setNewBookingData({ ...newBookingData, end_time: e.target.value })}
                                        className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-xs focus:outline-none focus:border-sport-green text-sport-navy"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Statut Paiement</label>
                                <select 
                                    value={newBookingData.payment_status}
                                    onChange={e => setNewBookingData({ ...newBookingData, payment_status: e.target.value })}
                                    className="w-full p-4 bg-sport-sky/20 border border-sport-sand rounded-2xl font-bold text-sm focus:outline-none focus:border-sport-green text-sport-navy"
                                >
                                    <option value="pending">En attente (Pending)</option>
                                    <option value="paid">Payé (Paid)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-sport-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-sport-green/20">
                                Enregistrer Réservation
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM BOOKING MODAL (CLIENT) */}
            {showConfirmBookingModal && selectedSlot && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-sport-navy/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-6 bg-sport-navy text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                                    <CreditCard size={18} className="text-sport-green" />
                                    <span>Confirmation Réservation</span>
                                </h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Validation du paiement fictif</p>
                            </div>
                            <button onClick={() => setShowConfirmBookingModal(false)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-sport-sky/30 p-5 rounded-[2rem] border border-sport-sand space-y-3">
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>Club</span>
                                    <span className="text-sport-navy uppercase">{club.name}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>Terrain</span>
                                    <span className="text-sport-navy">{selectedSlot.court.name}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>Créneau</span>
                                    <span className="text-sport-navy">Le {new Date(bookingDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})} à {selectedSlot.time}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 pt-2 border-t border-sport-sand/40">
                                    <span>Tarif Horaire</span>
                                    <span className="text-sport-navy">{selectedSlot.court.hourly_rate}€</span>
                                </div>
                                <div className="flex justify-between text-sm font-black text-sport-navy pt-2">
                                    <span>Montant Total</span>
                                    <span className="text-sport-green">{selectedSlot.court.hourly_rate}€</span>
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 italic text-center">En confirmant, vous acceptez les conditions de réservation du club.</p>

                            <button 
                                onClick={handleConfirmBooking}
                                className="w-full py-5 bg-sport-green text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-sport-green/20 hover:scale-105 transition-all"
                            >
                                Payer & Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubDetail;
