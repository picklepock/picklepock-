/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sport-green': '#4ADE80', // Emerald 400
                'light-blue': '#38BDF8', // Sky 400
            },
        },
    },
    plugins: [],
}
