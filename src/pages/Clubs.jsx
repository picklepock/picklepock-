import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import {
    X, MapPin, Globe, Mail, Phone, ChevronRight,
    Trophy, Users, Send, CheckCircle, Clock, Compass, AlertCircle
} from 'lucide-react';

// Composant pour recentrer la carte de maniere securisee
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
            map.flyTo(center, 14, { animate: true, duration: 1.5 });
        }
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
        // Fix icone Leaflet par defaut
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        fetchClubs();
        if (session) fetchMyRequests();
    }, [session]);

    async function fetchClubs() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clubs')
                .select('*')
                .eq('is_active', true);
            
            if (error) throw error;
            
            // FILTRAGE ULTRA-STRICT pour eviter le crash LatLng undefined
            const validClubs = (data || []).filter(c => 
                typeof c.latitude === 'number' && 
                typeof c.longitude === 'number'
            );
            
            console.log("Clubs valides charges:", validClubs.length, validClubs);
            setClubs(validClubs);
        } catch (err) {
            console.error("Erreur chargement clubs:", err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMyRequests() {
        if (!session?.user?.id) return;
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
        if (typeof club.latitude === 'number' && typeof club.longitude === 'number') {
            setMapCenter([club.latitude, club.longitude]);
        }
    }

    // Icone personnalisee
    const clubIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width: 40px; height: 40px; background: #0F172A; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #10B981; box-shadow: 0 4px 20px rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center;"><div style="width: 16px; height: 16px; background: white; border-radius: 50%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; font-size: 9px;">🎾</div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -45],
    });

    return (
        <div className="flex flex-col min-h-full bg-sport-beige overflow-x-hidden">
            
            {/* diagnostic header */}
            <div className="bg-sport-navy text-white px-6 py-3 shrink-0 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                    <Compass size={16} className="text-sport-mint" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">PicklePock Explorer</span>
                </div>
                <div className="text-[10px] font-bold text-sport-blue uppercase">{clubs.length} Clubs</div>
            </div>

            {/* Carte Leaflet - Hauteur pixel FIXE */}
            <div className="w-full h-[450px] bg-slate-200 border-b border-sport-sand relative z-10">
                <MapContainer
                    center={[46.2276, 2.2137]}
                    zoom={5}
                    className="w-full h-full"
                    zoomControl={false}
                    style={{ height: '450px', width: '100%', background: '#F5F2EE' }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
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
                            <Popup>
                                <div className="font-bold text-sport-navy">{club.name}</div>
                                <div className="text-xs text-slate-500">{club.city}</div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-sport-beige/60 backdrop-blur-sm z-[500]">
                        <div className="w-8 h-8 border-4 border-sport-navy border-t-sport-mint rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Panneau du bas */}
            <div className="flex-1 bg-sport-beige p-6 space-y-6 pb-40">
                <div className="flex space-x-3">
                    {session ? (
                        <>
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="flex-1 py-4 bg-sport-navy text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
                            >
                                <Send size={14} />
                                <span>Inscrire un club</span>
                            </button>
                            <button
                                onClick={() => setShowMyRequests(true)}
                                className="p-4 bg-white border border-sport-sand text-sport-navy rounded-2xl shadow-sm active:scale-95 transition-all"
                            >
                                <Clock size={16} />
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 py-4 bg-white border border-sport-sand rounded-2xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-6 flex items-center justify-center space-x-2">
                            <AlertCircle size={14} />
                            <span>Connexion requise pour inscrire un club</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {clubs.map(club => (
                        <div
                            key={club.id}
                            onClick={() => handleClubClick(club)}
                            className="flex items-center p-4 bg-white border border-sport-sand rounded-[2rem] shadow-sm hover:border-sport-mint/30 transition-all cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-sport-navy flex items-center justify-center text-white mr-4 overflow-hidden">
                                {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-cover" /> : "🎾"}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-sport-navy">{club.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{club.city}, {club.country}</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>
                    ))}
                    {clubs.length === 0 && !loading && (
                        <div className="text-center py-10 opacity-40">
                            <Compass size={40} className="mx-auto mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest">Aucun club sur la carte</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals simplifiees */}
            {selectedClub && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center p-4 pb-10" onClick={() => setSelectedClub(null)}>
                    <div className="absolute inset-0 bg-sport-navy/60 backdrop-blur-sm"></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-sport-navy leading-none">{selectedClub.name}</h2>
                            <button onClick={() => setSelectedClub(null)} className="p-2 bg-sport-beige rounded-full"><X size={18} /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 italic">{selectedClub.description || 'Pas de description.'}</p>
                        <div className="bg-sport-beige p-5 rounded-2xl">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Localisation</p>
                            <p className="text-xs font-bold text-sport-navy">{selectedClub.address || '—'}, {selectedClub.city}</p>
                        </div>
                    </div>
                </div>
            )}

            {showRequestForm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-sport-navy/80" onClick={() => setShowRequestForm(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-sport-navy mb-1 uppercase tracking-tight">Inscription</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 tracking-widest">Envoi de demande au circuit</p>
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <input 
                                placeholder="Nom du Club" 
                                className="w-full p-4 bg-sport-beige rounded-2xl border-none text-sm font-bold placeholder:text-slate-300"
                                value={form.club_name}
                                onChange={e => setForm({...form, club_name: e.target.value})}
                                required
                            />
                            <input 
                                placeholder="Email de contact" 
                                type="email"
                                className="w-full p-4 bg-sport-beige rounded-2xl border-none text-sm font-bold placeholder:text-slate-300"
                                value={form.contact_email}
                                onChange={e => setForm({...form, contact_email: e.target.value})}
                                required
                            />
                            <button className="w-full py-4 bg-sport-navy text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-lg">Envoyer la demande</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clubs;
