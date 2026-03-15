# PicklePock - Spécification de Design UI (Bêta)

## 1. Identité Visuelle

### Palette de Couleurs (Tailwind CSS)
| Élément | Couleur / Classe | Hex | Utilisation |
| :--- | :--- | :--- | :--- |
| **Fond Principal** | `bg-white` | `#FFFFFF` | Fond de page par défaut |
| **Fond Secondaire** | `bg-slate-50` | `#F8FAFC` | Délimitation des sections, fonds de cartes |
| **Primaire (Sport)** | `text-emerald-400`, `bg-emerald-400` | `#4ADE80` | Actions principales (CTA), icônes actives, accents |
| **Secondaire (Info)** | `text-sky-400`, `bg-sky-400` | `#38BDF8` | Liens, badges de niveau, statistiques |
| **Texte Titre** | `text-slate-900` | `#0F172A` | Titres (H1, H2, H3), texte important |
| **Texte Corps** | `text-slate-600` | `#475569` | Texte secondaire, descriptions |
| **Bordures** | `border-slate-100` | `#F1F5F9` | Séparateurs, bordures de cartes |
| **Admin Badge** | `bg-amber-400`, `text-amber-600` | `#FBBF24` | Badge de rôle administrateur |

### Typographie
- **Police** : Use "Inter" or "Plus Jakarta Sans" for a modern app feel.
- **Poids** : 
  - Titres : Bold (700) / Semi-bold (600)
  - Corps : Regular (400) / Medium (500)

### Formes et Rayons (Border Radius)
- **Cartes & Conteneurs** : `rounded-2xl` (1rem)
- **Boutons & Inputs** : `rounded-xl` (0.75rem)
- **Petits éléments** : `rounded-lg` (0.5rem)

### Effets de Profondeur
- **Shadows** : Utiliser `shadow-sm` pour les cartes sur fond `bg-slate-50` ou `shadow-md` pour les éléments flottants.

---

## 2. Composants Clés

### Navigation Basse (Bottom Bar)
- **Style** : Fond blanc pur (`bg-white`), bordure haute fine (`border-t border-slate-100`).
- **Interaction** : 
  - Icône active : Couleur Vert Clair (`emerald-400`).
  - Indicateur : Petit point (dot) de 4px en dessous de l'icône active.
  - Texte : `text-[10px]` ou `text-xs`, gris moyen si inactif.

### Cartes de Profil / Dashboard
- **Style** : `bg-white`, `p-6`, `shadow-sm`, `rounded-2xl`.
- **Contenu** : Marges généreuses pour éviter l'effet "tassé".

### Boutons
- **Principal** : `bg-emerald-400`, `text-white`, `font-semibold`, `rounded-xl`, `transition-all`.
- **Lien/Secondaire** : `text-sky-400`, `hover:underline`.

---

## 3. Ressources & Images
- **Avatar par défaut** : Utiliser `https://avatar.vercel.sh/[username]` ou une image de racket de Pickleball.
- **Placeholders Dashboard** : 
  - Tournoi : `https://images.unsplash.com/photo-1626225965071-8231c1ca9248?q=80&w=600&h=400&auto=format&fit=crop` (Image de Pickleball/Tennis)
  - Club : `https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=600&h=400&auto=format&fit=crop` (Court de sport)

---

## 4. Principes UX
- **Mobile-First** : Priorité absolue à l'affichage smartphone.
- **Aération** : Padding minimum `p-4` sur les conteneurs de page.
- **Micro-interactions** : Transitions douces sur les survols et changements d'état.
utiliser cette image pour le logo ![alt text](1772799964894.png)
