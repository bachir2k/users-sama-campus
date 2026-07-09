export const STUDENT = {
  name: 'Awa Ndiaye',
  first: 'Awa',
  id: 'ETU-5821',
  promo: 'Master 1 · 2026',
  balance: 24500,
  num: '5821 04XX 7799 01',
}

export interface Transaction {
  id: number
  cat: string
  icon: string
  label: string
  amount: number
  when: string
  day: string
}

export const TXNS: Transaction[] = [
  { id: 1, cat: 'Cafétéria',    icon: 'fork', label: 'Déjeuner — Menu campus',      amount: -1250, when: "Aujourd'hui · 12:42", day: "Aujourd'hui" },
  { id: 2, cat: 'Transport',    icon: 'bus',  label: 'Navette — Campus → Centre',    amount: -150,  when: "Aujourd'hui · 08:05", day: "Aujourd'hui" },
  { id: 3, cat: 'Rechargement', icon: 'plus', label: 'Orange Money',                 amount: 10000, when: 'Hier · 19:20',        day: 'Hier' },
  { id: 4, cat: 'Cafétéria',    icon: 'fork', label: 'Café + viennoiserie',          amount: -600,  when: 'Hier · 10:14',        day: 'Hier' },
  { id: 5, cat: 'Bibliothèque', icon: 'book', label: 'Prêt — 2 ouvrages',           amount: 0,     when: 'Hier · 15:30',        day: 'Hier' },
  { id: 6, cat: 'Transport',    icon: 'bus',  label: 'Navette — retour',             amount: -150,  when: 'Hier · 18:40',        day: 'Hier' },
  { id: 7, cat: 'Cafétéria',    icon: 'fork', label: 'Déjeuner — Menu campus',      amount: -1250, when: 'Lun. 26 · 12:30',    day: 'Cette semaine' },
  { id: 8, cat: 'Rechargement', icon: 'plus', label: 'Wave',                         amount: 5000,  when: 'Lun. 26 · 09:00',    day: 'Cette semaine' },
]

export const SCHEDULE = [
  { time: '08:00', course: 'Algorithmique avancée', room: 'Amphi A',    status: 'present'  as const },
  { time: '10:00', course: 'Bases de données',       room: 'Salle 204', status: 'present'  as const },
  { time: '14:00', course: 'Réseaux & IoT',          room: 'Labo 3',    status: 'upcoming' as const },
  { time: '16:00', course: 'Anglais technique',       room: 'Salle 110', status: 'upcoming' as const },
]

export const CAT_COLOR: Record<string, string> = {
  'Cafétéria':    '#8B6B4A',
  'Transport':    '#7C8458',
  'Bibliothèque': '#5E84A8',
  'Rechargement': '#5E7B49',
}
