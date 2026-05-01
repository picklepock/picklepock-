import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import {
    X, MapPin, Globe, Mail, Phone, ChevronRight,
    Trophy, Users, Send, CheckCircle, Clock, Compass, AlertCircle, Camera, Upload, Trash2
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
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    
    // État du formulaire étendu
    const [form, setForm] = useState({
        club_name: '',
        club_description: '',
        bio: '',
        phone: '',
        contact_email: '',
        address: '',
        city: '',
        country: 'France',
        website: '',
        opening_hours: {
            weekdays: '08:00 - 22:00',
            weekend: '09:00 - 20:00'
        }
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

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
            
            const validClubs = (data || []).filter(c => 
                typeof c.latitude === 'number' && 
                typeof c.longitude === 'number'
            );
            
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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const newPreviews = [];

        if (selectedFiles.length + files.length > 4) {
            alert("Maximum 4 photos autorisées.");
            return;
        }

        files.forEach(file => {
            if (file.size > 3 * 1024 * 1024) {
                alert(`Le fichier ${file.name} dépasse 3 Mo.`);
                return;
            }
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        setSelectedFiles([...selectedFiles, ...validFiles]);
        setPreviews([...previews, ...newPreviews]);
    };

    const removeFile = (index) => {
        const newFiles = [...selectedFiles];
        const newPreviews = [...previews];
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
    };

    async function handleSubmitRequest(e) {
        e.preventDefault();
        if (!session) return;
        
        setSubmitting(true);
        try {
            const photo_urls = [];

            // 1. Upload des photos
            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `requests/${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('clubs')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('clubs')
                    .getPublicUrl(filePath);
                
                photo_urls.push(publicUrl);
            }

            // 2. Insertion de la demande
            const { error } = await supabase.from('club_requests').insert({
                ...form,
                photo_urls,
                user_id: session.user.id,
                status: 'pending'
            });

            if (error) throw error;

            setSubmitSuccess(true);
            fetchMyRequests();
            setTimeout(() => {
                setShowRequestForm(false);
                setSubmitSuccess(false);
                setForm({
                    club_name: '', club_description: '', bio: '', phone: '',
                    contact_email: '', address: '', city: '', country: 'France', website: '',
                    opening_hours: { weekdays: '08:00 - 22:00', weekend: '09:00 - 20:00' }
                });
                setSelectedFiles([]);
                setPreviews([]);
            }, 2500);

        } catch (err) {
            alert("Erreur lors de l'envoi : " + err.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleClubClick(club) {
        setSelectedClub(club);
        if (typeof club.latitude === 'number' && typeof club.longitude === 'number') {
            setMapCenter([club.latitude, club.longitude]);
        }
    }

    // Icone personnalisee (Vibe Sky)
    const clubIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width: 40px; height: 40px; background: #0F172A; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #10B981; box-shadow: 0 4px 20px rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center;"><div style="width: 16px; height: 16px; background: white; border-radius: 50%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; font-size: 9px;">🎾</div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -45],
    });

    return (
        <div className="flex flex-col min-h-full bg-sport-sky overflow-x-hidden">
            
            {/* Header diagnostic subtil en Sky */}
            <div className="bg-sport-navy text-white px-6 py-3 shrink-0 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                    <Compass size={16} className="text-sport-mint" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">PicklePock Explorer</span>
                </div>
                <div className="text-[10px] font-bold text-sport-blue uppercase">{clubs.length} Clubs</div>
            </div>

            {/* Carte Leaflet */}
            <div className="w-full h-[400px] bg-slate-200 border-b border-sport-sand relative z-10">
                <MapContainer
                    center={[46.2276, 2.2137]}
                    zoom={5}
                    className="w-full h-full"
                    zoomControl={false}
                    style={{ height: '400px', width: '100%', background: '#F0F7FF' }}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-sport-sky/60 backdrop-blur-sm z-[500]">
                        <div className="w-8 h-8 border-4 border-sport-navy border-t-sport-mint rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Panneau du bas en Sky Blue */}
            <div className="flex-1 bg-sport-sky p-6 space-y-6 pb-40">
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
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clubs à proximité</h2>
                    {clubs.map(club => (
                        <div
                            key={club.id}
                            onClick={() => handleClubClick(club)}
                            className="flex items-center p-5 bg-white border border-sport-sand rounded-[2rem] shadow-sm hover:border-sport-mint/30 transition-all cursor-pointer group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-sport-navy flex items-center justify-center text-white mr-5 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-cover" /> : "🎾"}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-sport-navy text-lg leading-tight">{club.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{club.city}, {club.country}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-sport-sky flex items-center justify-center text-slate-300 group-hover:bg-sport-navy group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))}
                    {clubs.length === 0 && !loading && (
                        <div className="text-center py-10 opacity-30">
                            <Compass size={40} className="mx-auto mb-3" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em]">Horizon vide pour l'instant</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de demande d'inscription - VERSION ÉTENDUE */}
            {showRequestForm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-sport-navy/90 backdrop-blur-md" onClick={() => !submitting && setShowRequestForm(false)}></div>
                    <div className="relative bg-sport-beige w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in duration-300">
                        
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-8 border-b border-sport-sand flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-sport-navy uppercase tracking-tighter">Inscription Club</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rejoignez le circuit PicklePock</p>
                            </div>
                            <button onClick={() => setShowRequestForm(false)} className="p-3 bg-sport-sky rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {submitSuccess ? (
                            <div className="p-20 text-center space-y-6">
                                <div className="w-20 h-20 bg-sport-green text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-sport-green/20">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-sport-navy">Demande envoyée !</h3>
                                <p className="text-slate-500 italic">Notre équipe va analyser votre dossier.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitRequest} className="p-8 space-y-8 pb-12">
                                
                                {/* Section Identité */}
                                <div className="bg-white p-6 rounded-[2rem] border border-sport-sand space-y-6">
                                    <h3 className="text-[10px] font-black text-sport-green uppercase tracking-widest border-b border-sport-sand pb-4 mb-4">1. Identité du Club</h3>
                                    <div className="space-y-4">
                                        <input 
                                            placeholder="Nom du Club" 
                                            className="w-full p-4 bg-sport-sky/20 rounded-2xl border-none text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-sport-green outline-none"
                                            value={form.club_name}
                                            onChange={e => setForm({...form, club_name: e.target.value})}
                                            required
                                        />
                                        <textarea 
                                            placeholder="Bio / Histoire du club" 
                                            rows="3"
                                            className="w-full p-4 bg-sport-sky/20 rounded-2xl border-none text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-sport-green outline-none resize-none"
                                            value={form.bio}
                                            onChange={e => setForm({...form, bio: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Section Contact & Localisation */}
                                <div className="bg-white p-6 rounded-[2rem] border border-sport-sand space-y-6">
                                    <h3 className="text-[10px] font-black text-sport-green uppercase tracking-widest border-b border-sport-sand pb-4 mb-4">2. Localisation & Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input 
                                            placeholder="Adresse" 
                                            className="w-full p-4 bg-sport-sky/20 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-sport-green outline-none"
                                            value={form.address}
                                            onChange={e => setForm({...form, address: e.target.value})}
                                            required
                                        />
                                        <input 
                                            placeholder="Ville" 
                                            className="w-full p-4 bg-sport-sky/20 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-sport-green outline-none"
                                            value={form.city}
                                            onChange={e => setForm({...form, city: e.target.value})}
                                            required
                                        />
                                        <input 
                                            placeholder="Email" 
                                            type="email"
                                            className="w-full p-4 bg-sport-sky/20 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-sport-green outline-none"
                                            value={form.contact_email}
                                            onChange={e => setForm({...form, contact_email: e.target.value})}
                                            required
                                        />
                                        <input 
                                            placeholder="Téléphone" 
                                            type="tel"
                                            className="w-full p-4 bg-sport-sky/20 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-sport-green outline-none"
                                            value={form.phone}
                                            onChange={e => setForm({...form, phone: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Section Photos */}
                                <div className="bg-white p-6 rounded-[2rem] border border-sport-sand space-y-6">
                                    <div className="flex justify-between items-center border-b border-sport-sand pb-4 mb-4">
                                        <h3 className="text-[10px] font-black text-sport-green uppercase tracking-widest">3. Photos du Club (Max 4)</h3>
                                        <span className="text-[10px] font-bold text-slate-400">{selectedFiles.length}/4</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {previews.map((src, index) => (
                                            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                        {selectedFiles.length < 4 && (
                                            <label className="aspect-square rounded-2xl border-2 border-dashed border-sport-sand flex flex-col items-center justify-center cursor-pointer hover:border-sport-green hover:bg-sport-green/5 transition-all text-slate-300 hover:text-sport-green">
                                                <Camera size={24} />
                                                <span className="text-[8px] font-black uppercase mt-2">Ajouter</span>
                                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic">Format JPG/PNG, Max 3 Mo par photo.</p>
                                </div>

                                {/* Section Horaires */}
                                <div className="bg-white p-6 rounded-[2rem] border border-sport-sand space-y-6">
                                    <h3 className="text-[10px] font-black text-sport-green uppercase tracking-widest border-b border-sport-sand pb-4 mb-4">4. Horaires</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-[10px] font-bold text-slate-400 w-24 uppercase">Semaine :</span>
                                            <input 
                                                className="flex-1 p-3 bg-sport-sky/20 rounded-xl border-none text-xs font-bold"
                                                value={form.opening_hours.weekdays}
                                                onChange={e => setForm({...form, opening_hours: {...form.opening_hours, weekdays: e.target.value}})}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-[10px] font-bold text-slate-400 w-24 uppercase">Week-end :</span>
                                            <input 
                                                className="flex-1 p-3 bg-sport-sky/20 rounded-xl border-none text-xs font-bold"
                                                value={form.opening_hours.weekend}
                                                onChange={e => setForm({...form, opening_hours: {...form.opening_hours, weekend: e.target.value}})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    disabled={submitting}
                                    className="w-full py-5 bg-sport-navy text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-sport-navy/30 active:scale-95 transition-all flex items-center justify-center space-x-3"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            <span>Envoyer le dossier</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Mes Demandes */}
            {showMyRequests && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-sport-navy/90" onClick={() => setShowMyRequests(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-sport-navy uppercase tracking-tighter">Mes Demandes</h2>
                            <button onClick={() => setShowMyRequests(false)} className="text-slate-400 hover:text-sport-navy"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            {myRequests.map(req => (
                                <div key={req.id} className="p-5 bg-sport-sky/20 rounded-2xl border border-sport-sand">
                                    <p className="font-black text-sport-navy text-sm">{req.club_name}</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${req.status === 'pending' ? 'bg-amber-100 text-amber-600' : req.status === 'approved' ? 'bg-sport-green text-white' : 'bg-rose-100 text-rose-500'}`}>
                                            {req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Validé' : 'Refusé'}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400">{new Date(req.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {myRequests.length === 0 && <p className="text-center text-slate-400 italic text-xs py-10">Aucune demande en cours.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Détails Club (Optionnel pour voir l'impact du design) */}
            {selectedClub && (
                <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 pb-10" onClick={() => setSelectedClub(null)}>
                    <div className="absolute inset-0 bg-sport-navy/60 backdrop-blur-sm"></div>
                    <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 animate-in slide-in-from-bottom duration-500 border-t border-sport-sky" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-sport-navy tracking-tighter leading-none">{selectedClub.name}</h2>
                                <p className="text-[10px] text-sport-green font-bold uppercase tracking-[0.2em] mt-2">Club Officiel PicklePock</p>
                            </div>
                            <button onClick={() => setSelectedClub(null)} className="p-3 bg-sport-sky rounded-2xl text-slate-400"><X size={20} /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-8 italic leading-relaxed">{selectedClub.description || 'Pas de description.'}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-sport-sky/30 p-5 rounded-2xl border border-sport-sand">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Localisation</p>
                                <p className="text-xs font-bold text-sport-navy">{selectedClub.city}</p>
                            </div>
                            <div className="bg-sport-sky/30 p-5 rounded-2xl border border-sport-sand">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terrains</p>
                                <p className="text-xs font-bold text-sport-navy">{selectedClub.courts_count || '?'}</p>
                            </div>
                        </div>

                        <button className="w-full py-5 bg-sport-navy text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">Voir la fiche complète</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clubs;
