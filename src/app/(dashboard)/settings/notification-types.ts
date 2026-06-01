// Catalogue partagé client/serveur des types de notifications soumis à
// préférence utilisateur. Aligné avec la migration 63 (helper SQL
// `is_notif_enabled`) et les triggers `notify_on_nc_message` /
// `notify_on_nc_review_message`. Toute nouvelle valeur ici doit aussi être
// reflétée côté SQL pour qu'elle soit effectivement filtrée.
export const NOTIFICATION_TYPES = [
  "nc_message",
  "nc.review_message",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
