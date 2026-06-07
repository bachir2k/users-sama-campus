# SamaCampus — App Mobile (Expo)

App mobile React Native / Expo pour l'étudiant SamaCampus.

## Démarrage

```bash
cd sama-campus-mobile
npm install
npx expo start
```

Ensuite scannez le QR code avec **Expo Go** (iOS/Android), ou appuyez sur :
- `i` pour le simulateur iOS
- `a` pour l'émulateur Android
- `w` pour le web

## Thème

Changez `VARIANT` dans `App.tsx` entre `'light'` (Crème) et `'dark'` (Nuit).

## Écrans

| Écran | Description |
|-------|-------------|
| Carte (Home) | Solde, carte virtuelle, accès rapides, activité récente |
| Activité | Historique filtrable par catégorie |
| Payer | Paiement NFC simulé + rechargement |
| Accès | Badge QR + historique des accès |
| Présences | Taux de présence, calendrier semaine, emploi du temps |
| Profil | Sécurité, PIN, biométrie, verrouillage carte |

## Structure

```
src/
├── theme/palette.ts     # Design tokens light/dark
├── data/mockData.ts     # Données simulées
├── components/ui/       # Money (formateur FCFA)
└── screens/             # 6 écrans React Native
App.tsx                  # Shell principal + tab bar
```
