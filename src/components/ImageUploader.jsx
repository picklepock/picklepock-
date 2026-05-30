import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Camera, Check, AlertCircle } from 'lucide-react';

const ImageUploader = ({ onUploadSuccess, bucketName = 'club_images', folderPath = 'logos', currentImageUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentImageUrl || null);
    const [error, setError] = useState(null);

    const compressAndConvertToWebP = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Définir des dimensions maximales pour optimiser l'espace de stockage
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Conversion en blob au format WebP avec qualité de 0.8
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error("La conversion en WebP a échoué."));
                            }
                        },
                        'image/webp',
                        0.8
                    );
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setUploading(true);

        try {
            // 1. Conversion et compression en WebP
            const webpBlob = await compressAndConvertToWebP(file);

            // 2. Générer un nom de fichier unique avec extension .webp
            const fileExt = 'webp';
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${folderPath}/${fileName}`;

            // 3. Upload vers Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, webpBlob, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 4. Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            setPreviewUrl(publicUrl);
            if (onUploadSuccess) {
                onUploadSuccess(publicUrl);
            }
        } catch (err) {
            console.error("Erreur lors de l'upload de l'image:", err);
            setError(err.message || "Impossible de charger l'image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-6">
                <div className="relative w-24 h-24 rounded-2xl bg-sport-sky border border-sport-sand flex items-center justify-center overflow-hidden group shadow-inner">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                        <Camera size={28} className="text-slate-300" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-sport-navy/70 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center px-5 py-3 bg-sport-navy text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-sport-navy/90 transition-all cursor-pointer active:scale-95 shadow-md">
                        <Upload size={14} className="mr-2" />
                        <span>{uploading ? 'Chargement...' : 'Choisir une photo'}</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                    <p className="text-[10px] text-slate-400 italic">Format WebP automatique, compressé et optimisé pour le stockage.</p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-300">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
