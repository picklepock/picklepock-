# Audit de sécurité — PicklePock

Date : 5 août 2026. Périmètre : code du dépôt et configuration de déploiement. Aucun test intrusif n'a été effectué contre un service externe.

## Correctifs livrés

- Correction de l'accès « gérant » qui était affiché à tous les visiteurs.
- Validation client des images (type, taille, nom imprévisible) ; les mêmes limites sont prévues côté Supabase Storage.
- Mot de passe minimal de 12 caractères côté interface.
- Suppression du script Google Translate tiers injecté à l'exécution.
- CSP, HSTS, anti-iframe, anti-sniffing, politique de référent et permissions navigateur sur Vercel et Cloudflare Pages.
- Protection des RPC de score : l'identité déclarée doit être celle du JWT et les fonctions `SECURITY DEFINER` reçoivent un `search_path` sûr.
- Migration RLS/SQL pour interdire l'auto-promotion administrateur, la falsification directe des scores, la création de réservations déjà payées et l'écriture Storage hors de son dossier.

## À appliquer avant le prochain déploiement

Dans cet ordre, dans **Supabase > SQL Editor**, sur une sauvegarde ou un environnement de préproduction :

1. Exécuter `supabase_matchmaking_setup.sql` mis à jour.
2. Exécuter `supabase_social_v2_setup.sql` mis à jour.
3. Exécuter `supabase_security_hardening.sql` **une seule fois**.
4. Vérifier que la requête finale retourne `rowsecurity = true` pour toutes les tables applicatives.

Dans Supabase Auth, activer la confirmation d'e-mail, la protection contre les mots de passe compromis, CAPTCHA et la limitation des tentatives de connexion/réinitialisation. Limiter les URL de redirection à vos domaines de production et de préproduction exacts.

## Risques restant à traiter

- Les réservations sont créées côté client : leur prix et la prévention des chevauchements doivent être déplacés dans une RPC transactionnelle ou un backend, avec un vrai webhook de paiement signé. Ne jamais utiliser `payment_status = 'paid'` depuis le navigateur.
- Les scores doivent aussi vérifier que les deux équipes contiennent exactement tous les participants confirmés ; la migration bloque l'usurpation d'identité, mais une RPC plus stricte est nécessaire pour la règle métier complète.
- Les publications, messages et demandes peuvent être spammés. Ajouter rate limiting et CAPTCHA/Turnstile côté Edge Function ou fournisseur d'authentification.
- La clé Supabase `anon`/`publishable` est censée être publique. La clé `service_role` ne doit jamais être dans Vite, Git, le navigateur ou une application mobile. Une ancienne clé publishable figure dans l'historique Git ; aucune clé de service n'a été trouvée, mais le nettoyage/rotation éventuel de l'historique doit être décidé selon votre politique de dépôt.
- `npm audit --omit=dev` signale encore React Router 7.18.2. L'alerte concerne le mode RSC, non utilisé par cette SPA Vite, mais la version recommandée par l'audit est 7.11.0 ; la mise à jour n'a pas été installée car l'autorisation a été refusée.

## Exploitation et réponse à incident

- Activer les journaux Supabase Auth, Database et Storage ; définir des alertes sur changement d'e-mail, mot de passe, rôle administrateur, créations de comptes et erreurs 4xx/5xx inhabituelles.
- Utiliser MFA pour les comptes Supabase, Vercel/Cloudflare, GitHub et e-mail ; conserver les secrets dans le gestionnaire de secrets de chaque plateforme.
- Prévoir des sauvegardes, tester la restauration et documenter qui peut révoquer sessions, clés et accès en cas d'incident.
