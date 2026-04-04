/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sport-green': '#059669', // Emerald 600 (Sérieux)
                'sport-mint': '#10B981',  // Mint iconique (Logo)
                'sport-blue': '#85C1E9',  // Sky blue (Logo)
                'sport-beige': '#F5F2EE', // Fond Club
                'sport-navy': '#0F172A',  // Texte & Prestige
                'sport-sand': '#E7E2D8',  // Bordures/Ombres
            },
        },
    },
    plugins: [],
}
