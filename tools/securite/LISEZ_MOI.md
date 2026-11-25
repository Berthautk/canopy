# Tests de sécurité du serveur

Ces tests font tourner les fonctions de `functions/api/` sur une base SQLite en mémoire
qui imite Cloudflare D1. Ils n'ont besoin d'aucun réseau et d'aucune clé.

    node tools/securite/t-suivi.mjs     # suivi des nouveaux convertis
    node tools/securite/t-divers.mjs    # migration de la base, mot de passe admin, demandes de prière

Ils vérifient notamment qu'un code d'invitation transféré ne donne plus accès au carnet,
qu'un ancien téléphone perd l'accès après une nouvelle liaison, que la devinette de code,
de clé et de mot de passe est freinée, et qu'une seule personne ne peut pas bloquer le service.
À relancer après toute modification de `functions/`.
