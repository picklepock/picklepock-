/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sport-green': '#059669', // Emerald 600 (Plus foncé & pro)
                'sport-beige': '#F5F2EE', // Beige doux et sobre
                'sport-navy': '#0F172A', // Bleu marine profond
                'sport-sand': '#E7E2D8', // Beige d'accent pour les cartes
            },
        },
    },
    plugins: [],
}
