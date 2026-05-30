/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Design System Antigravity 2.1
                'brand-green': '#C6F432', // Vert lime électrique / action principale
                'brand-blue': '#172554',  // Bleu marine profond
                'bg-light': '#FDFBF7',    // Sable / Beige très clair amical
                'bg-dark': '#0B041C',     // Violet spatial très sombre compétitif
                
                // Rétrocompatibilité (si besoin)
                'sport-green': '#C6F432',
                'sport-navy': '#172554',
                'sport-sky': '#FDFBF7',
                'sport-beige': '#F5F2EE',
                'sport-sand': '#E7E2D8',
            },
        },
    },
    plugins: [],
}
