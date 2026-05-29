import React from 'react';

/**
 * Composant Button réutilisable haut de gamme pour l'application mobile PicklePock.
 * 
 * @param {'primary' | 'secondary' | 'outline'} variant - Le style du bouton
 * @param {boolean} isDarkContext - Définit si le bouton est dans un contexte compétitif (Sombre)
 * @param {React.ReactNode} children - Le contenu du bouton
 */
const Button = ({ 
    variant = 'primary', 
    isDarkContext = false,
    children, 
    className = '', 
    ...props 
}) => {
    // Styles de base inspirés d'une UI d'application native moderne
    const baseStyles = 'px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none select-none';
    
    // Configuration des variantes graphiques
    let variantStyles = '';
    
    if (variant === 'primary') {
        variantStyles = 'bg-brand-green text-brand-blue shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 hover:glow-green-sm';
    } else if (variant === 'secondary') {
        if (isDarkContext) {
            // Dans le mode compétitif sombre
            variantStyles = 'bg-white text-bg-dark shadow-md';
        } else {
            // Dans le mode amical clair
            variantStyles = 'bg-brand-blue text-bg-light shadow-md shadow-brand-blue/15';
        }
    } else if (variant === 'outline') {
        if (isDarkContext) {
            variantStyles = 'border-2 border-brand-green text-brand-green bg-transparent hover:bg-brand-green/10';
        } else {
            variantStyles = 'border-2 border-brand-blue text-brand-blue bg-transparent hover:bg-brand-blue/5';
        }
    }

    return (
        <button 
            className={`${baseStyles} ${variantStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
