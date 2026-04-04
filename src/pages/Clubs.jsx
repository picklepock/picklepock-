import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import {
    X, MapPin, Globe, Mail, Phone, ChevronRight,
    Trophy, Users, Send, CheckCircle, Clock, Compass
} from 'lucide-react';

// Fix icone Leaflet par defaut (probleme courant avec Webpack/Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icone personnalisee pour les clubs PicklePock
const clubIcon = L.divIcon({
    className: '',
    html: `
        <div style="
            width: 40px; height: 40px;
            background: #0F172A;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid #10B981;
            box-shadow: 0 4px 20px rgba(15,23,42,0.4);
            display: flex; align-items: center; justify-content: center;
        ">
            <div style="
                width: 16px; height: 16px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
                display: flex; align-items: center; justify-content: center;
                font-size: 9px;
            ">🎾</div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -45],
});

// Composant pour recentrer la carte
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

const Clubs = ({ session }) => {
    const [clubs, setClubs] = useState([]);
    const [selectedClub, setSelectedClub] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [showMyRequests, setShowMyRequests] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [mapCenter, setMapCenter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [form, setForm] = useState({
        club_name: '', club_description: '', contact_email: '',
        address: '', city: '', country: '', website: ''
    });

    useEffect(() => {
        fetchClubs();
        if (session) fetchMyRequests();
    }, [session]);

    async function fetchClubs() {
        setLoading(true);
        const { data } = await supabase
            .from('clubs')
            .select('*')
            .eq('is_active', true);
        setClubs(data || []);
        setLoading(false);
    }

    async function fetchMyRequests() {
        const { data } = await supabase
            .from('club_requests')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        setMyRequests(data || []);
    }

    async function handleSubmitRequest(e) {
        e.preventDefault();
        if (!session) return;
        const { error } = await supabase.from('club_requests').insert({
            ...form,
            user_id: session.user.id,
        });
        if (!error) {
            setSubmitSuccess(true);
            fetchMyRequests();
            setTimeout(() => {
                setShowRequestForm(false);
                setSubmitSuccess(false);
                setForm({ club_name: '', club_description: '', contact_email: '', address: '', city: '', country: '', website: '' });
            }, 2500);
        }
    }

    function handleClubClick(club) {
        setSelectedClub(club);
        setMapCenter([club.latitude, club.longitude]);
    }

    const statusConfig = {
        pending: { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock size={12} /> },
        approved: { label: 'Approuvée', color: 'text-sport-green', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={12} /> },
        rejected: { label: 'Refusée', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', icon: <X size={12} /> },
    };

    return (
        <div className="flex flex-col h-full">
            {/* Carte Leaflet Interactive - occupe tout l'espace disponible */}
            <div className="relative flex-1 min-h-[55vh]">
                <MapContainer
                    center={[46.2276, 2.2137]}
                    zoom={5}
                    className="w-full h-full"
                    zoomControl={false}
                    style={{ background: '#F5F2EE' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />

                    {mapCenter && <MapController center={mapCenter} />}

                    {clubs.map(club => (
                        <Marker
                            key={club.id}
                            position={[club.latitude, club.longitude]}
                            icon={clubIcon}
                            eventHandlers={{ click: () => handleClubClick(club) }}
                        >
                            <Popup className="picklepock-popup">
                                <div className="font-bold text-sport-navy text-sm">{club.name}</div>
                                <div className="text-xs text-slate-500 mt-1">{club.city}, {club.country}</div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Badge compteur clubs */}
                <div className="absolute top-4 left-4 z-[500] bg-sport-navy text-white text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-full shadow-xl flex items-center space-x-2">
                    <Compass size={12} className="text-sport-mint" />
                    <span>{clubs.length} Club{clubs.length !== 1 ? 's' : ''} sur le circuit</span>
                </div>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-sport-beige/80 backdrop-blur-sm z-[500]">
                        <div className="w-8 h-8 border-4 border-sport-navy border-t-sport-mint rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Panneau du bas - scrollable */}
            <div className="bg-sport-beige overflow-y-auto scrollbar-none" style={{ maxHeight: '45vh' }}>
                <div className="p-5 space-y-4">

                    {/* Actions */}
                    <div className="flex space-x-3">
                        {session && (
                            <>
                                <button
                                    onClick={() => { setShowRequestForm(true); setShowMyRequests(false); }}
                                    className="flex-1 py-3.5 bg-sport-navy text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
                                >
                                    <Send size={14} />
                                    <span>Inscrire mon club</span>
                                </button>
                                <button
                                    onClick={() => { setShowMyRequests(true); setShowRequestForm(false); }}
                                    className="py-3.5 px-4 bg-white border border-sport-sand text-sport-navy text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-sm flex items-center space-x-2 active:scale-95 transition-all"
                                >
                                    <Clock size={14} />
                                    <span>Mes demandes</span>
                                </button>
                            </>
                        )}
                        {!session && (
                            <div className="flex-1 py-3 bg-white border border-sport-sand rounded-2xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Connecte-toi pour inscrire ton club
                            </div>
                        )}
                    </div>

                    {/* Liste des clubs */}
                    {clubs.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Clubs sur le circuit</p>
                            {clubs.map(club => (
                                <div
                                    key={club.id}
                                    onClick={() => handleClubClick(club)}
                                    className="flex items-center p-4 bg-white border border-sport-sand rounded-2xl shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    {club.logo_url ? (
                                        <img src={club.logo_url} alt={club.name} className="w-12 h-12 rounded-xl object-cover mr-4 shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-sport-navy flex items-center justify-center mr-4 shadow-sm">
                                            <span className="text-white text-lg">🎾</span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sport-navy text-sm truncate">{club.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">{club.city}, {club.country}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}

                    {clubs.length === 0 && !loading && (
                        <div className="text-center py-8 space-y-2">
                            <div className="text-4xl">🌍</div>
                            <p className="font-black text-sport-navy text-sm">Carte vierge</p>
                            <p className="text-xs text-slate-400 italic">Les clubs rejoindront bientôt le circuit.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Profil Club */}
            {selectedClub && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center" onClick={() => setSelectedClub(null)}>
                    <div className="absolute inset-0 bg-sport-navy/60 backdrop-blur-sm"></div>
                    <div
                        className="relative w-full max-w-md bg-white rounded-t-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Cover image ou gradient */}
                        <div className="h-36 relative overflow-hidden">
                            {selectedClub.cover_url ? (
                                <img src={selectedClub.cover_url} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-sport-navy via-sport-navy to-sport-mint/30 flex items-center justify-center">
                                    <span className="text-5xl opacity-30">🎾</span>
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedClub(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 -mt-8 relative">
                            {/* Logo flottant */}
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border-2 border-sport-sand flex items-center justify-center mb-4 overflow-hidden">
                                {selectedClub.logo_url ? (
                                    <img src={selectedClub.logo_url} alt={selectedClub.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">🎾</span>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-sport-navy tracking-tight">{selectedClub.name}</h2>
                            <div className="flex items-center space-x-2 mt-1 mb-4">
                                <MapPin size={12} className="text-sport-mint" />
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{selectedClub.city}, {selectedClub.country}</span>
                            </div>

                            {selectedClub.description && (
                                <p className="text-sm text-slate-500 leading-relaxed mb-4 italic">{selectedClub.description}</p>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-sport-beige rounded-2xl p-4 flex items-center space-x-3">
                                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <Trophy size={16} className="text-sport-navy" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Terrains</p>
                                        <p className="font-black text-sport-navy">{selectedClub.courts_count || '—'}</p>
                                    </div>
                                </div>
                                <div className="bg-sport-beige rounded-2xl p-4 flex items-center space-x-3">
                                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <Users size={16} className="text-sport-navy" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Circuit</p>
                                        <p className="font-black text-sport-navy text-xs">Officiel ✓</p>
                                    </div>
                                </div>
                            </div>

                            {/* Liens */}
                            <div className="space-y-2">
                                {selectedClub.website && (
                                    <a href={selectedClub.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 bg-sport-beige rounded-xl text-sport-navy font-bold text-xs hover:bg-sport-sand transition-all">
                                        <Globe size={14} className="text-sport-mint" />
                                        <span>{selectedClub.website}</span>
                                    </a>
                                )}
                                {selectedClub.contact_email && (
                                    <a href={`mailto:${selectedClub.contact_email}`} className="flex items-center space-x-3 p-3 bg-sport-beige rounded-xl text-sport-navy font-bold text-xs hover:bg-sport-sand transition-all">
                                        <Mail size={14} className="text-sport-mint" />
                                        <span>{selectedClub.contact_email}</span>
                                    </a>
                                )}
                                {selectedClub.address && (
                                    <div className="flex items-center space-x-3 p-3 bg-sport-beige rounded-xl text-slate-500 text-xs">
                                        <MapPin size={14} className="text-slate-400 shrink-0" />
                                        <span>{selectedClub.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Formulaire de Demande */}
            {showRequestForm && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center" onClick={() => setShowRequestForm(false)}>
                    <div className="absolute inset-0 bg-sport-navy/60 backdrop-blur-sm"></div>
                    <div
                        className="relative w-full max-w-md bg-white rounded-t-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-sport-sand flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-sport-navy">Inscrire mon club</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Un admin validera ta demande</p>
                            </div>
                            <button onClick={() => setShowRequestForm(false)} className="w-10 h-10 rounded-full bg-sport-beige flex items-center justify-center">
                                <X size={18} className="text-sport-navy" />
                            </button>
                        </div>

                        <div className="overflow-y-auto scrollbar-none flex-1">
                            {submitSuccess ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                        <CheckCircle size={40} className="text-sport-green" />
                                    </div>
                                    <p className="font-black text-sport-navy text-lg">Demande envoyée !</p>
                                    <p className="text-sm text-slate-400 italic text-center px-8">Notre équipe examinera ta demande et te contactera sous peu.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                                    {[
                                        { key: 'club_name', label: 'Nom du Club *', placeholder: 'PicklePock Paris Est', required: true },
                                        { key: 'contact_email', label: 'Email de Contact *', placeholder: 'contact@monclub.fr', required: true, type: 'email' },
                                        { key: 'club_description', label: 'Description', placeholder: 'Notre club accueille...', textarea: true },
                                        { key: 'address', label: 'Adresse', placeholder: '12 rue des courts' },
                                        { key: 'city', label: 'Ville', placeholder: 'Paris' },
                                        { key: 'country', label: 'Pays', placeholder: 'France' },
                                        { key: 'website', label: 'Site Web', placeholder: 'https://monclub.fr' },
                                    ].map(field => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{field.label}</label>
                                            {field.textarea ? (
                                                <textarea
                                                    value={form[field.key]}
                                                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                                    placeholder={field.placeholder}
                                                    rows={3}
                                                    className="w-full px-4 py-3.5 bg-sport-beige border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-navy text-sport-navy text-sm font-medium placeholder:text-slate-300 resize-none"
                                                />
                                            ) : (
                                                <input
                                                    type={field.type || 'text'}
                                                    required={field.required}
                                                    value={form[field.key]}
                                                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3.5 bg-sport-beige border border-sport-sand rounded-2xl focus:outline-none focus:border-sport-navy text-sport-navy text-sm font-medium placeholder:text-slate-300"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-sport-navy text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-[2rem] shadow-xl active:scale-95 transition-all mt-2"
                                    >
                                        Envoyer ma demande
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Mes Demandes */}
            {showMyRequests && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center" onClick={() => setShowMyRequests(false)}>
                    <div className="absolute inset-0 bg-sport-navy/60 backdrop-blur-sm"></div>
                    <div
                        className="relative w-full max-w-md bg-white rounded-t-[3rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-sport-sand flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-sport-navy">Mes Demandes</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{myRequests.length} demande{myRequests.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={() => setShowMyRequests(false)} className="w-10 h-10 rounded-full bg-sport-beige flex items-center justify-center">
                                <X size={18} className="text-sport-navy" />
                            </button>
                        </div>
                        <div className="overflow-y-auto scrollbar-none p-6 space-y-3">
                            {myRequests.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-3xl mb-3">📋</p>
                                    <p className="font-bold text-sport-navy">Aucune demande</p>
                                    <p className="text-xs text-slate-400 mt-1">Tu n'as pas encore soumis de demande d'inscription.</p>
                                </div>
                            )}
                            {myRequests.map(req => {
                                const s = statusConfig[req.status] || statusConfig.pending;
                                return (
                                    <div key={req.id} className="p-4 bg-sport-beige rounded-2xl border border-sport-sand">
                                        <div className="flex items-start justify-between">
                                            <p className="font-black text-sport-navy text-sm">{req.club_name}</p>
                                            <span className={`flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
                                                {s.icon}
                                                <span className="ml-1">{s.label}</span>
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">{req.city}, {req.country}</p>
                                        {req.admin_note && (
                                            <p className="text-xs text-slate-500 mt-2 italic bg-white rounded-xl p-3 border border-sport-sand">
                                                💬 {req.admin_note}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clubs;
