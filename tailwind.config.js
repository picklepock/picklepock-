/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sport-green': '#059669', // Emerald 600
                'sport-mint': '#10B981',  // Mint logo
                'sport-blue': '#85C1E9',  // Sky blue logo
                'sport-sky': '#F0F7FF',   // Nouveau fond ultra-clair (Logo vibe)
                'sport-beige': '#F5F2EE', // Accent sable
                'sport-navy': '#0F172A',  // Texte & Prestige
                'sport-sand': '#E7E2D8',  // Bordures
            },
        },
    },
    plugins: [],
}
