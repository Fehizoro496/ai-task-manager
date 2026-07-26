/**
 * Jeu de documents de test pour l'évaluation de la génération de plans par l'IA.
 * Chaque entrée : brief réaliste + `expectedThemes` (mots-clés qui DEVRAIENT
 * apparaître dans un plan fidèle → mesure de couverture automatique).
 *
 * Diversité voulue : domaines et tailles variés pour tester la robustesse.
 */

module.exports = [
  {
    id: "ecommerce-checkout",
    title: "Tunnel de commande e-commerce",
    size: "moyen",
    document: `Nous développons le tunnel de commande d'une boutique en ligne.
L'utilisateur doit pouvoir ajouter des produits à un panier, modifier les quantités
et supprimer des articles. Le panier est persistant entre les sessions.
Au paiement, il saisit une adresse de livraison, choisit un mode de livraison
(standard ou express) et paie par carte bancaire via Stripe. Un e-mail de
confirmation est envoyé après paiement. L'utilisateur peut consulter l'historique
de ses commandes et suivre le statut d'expédition. Gestion des codes promo et
calcul automatique des frais de port selon le pays.`,
    expectedThemes: [
      "panier",
      "quantité",
      "livraison",
      "paiement",
      "carte",
      "confirmation",
      "historique",
      "suivi",
      "promo",
      "frais de port",
    ],
  },
  {
    id: "messaging-app",
    title: "Messagerie instantanée d'équipe",
    size: "moyen",
    document: `Application de messagerie pour équipes. Les membres peuvent créer des
conversations directes (1-à-1) et des groupes. Les messages s'affichent en temps
réel, avec accusés de lecture et indicateur de saisie. Chaque conversation affiche
un badge du nombre de messages non lus. Recherche dans l'historique des messages.
Possibilité d'envoyer des fichiers et des images. Notifications push à la réception
d'un message quand l'utilisateur est hors ligne. Un utilisateur peut quitter un
groupe ou en être administrateur.`,
    expectedThemes: [
      "conversation",
      "groupe",
      "temps réel",
      "accusé",
      "non lus",
      "recherche",
      "fichier",
      "notification",
      "administrateur",
    ],
  },
  {
    id: "hr-leave",
    title: "Gestion des congés RH",
    size: "petit",
    document: `Module de gestion des demandes de congés. Un salarié soumet une demande
en indiquant le type (congé payé, RTT, maladie), les dates et un motif optionnel.
Le manager reçoit la demande et peut l'approuver ou la refuser avec commentaire.
Le solde de congés de chaque salarié est mis à jour automatiquement après validation.
Un calendrier d'équipe affiche les absences. Les RH exportent un récapitulatif mensuel.`,
    expectedThemes: [
      "demande",
      "type",
      "dates",
      "manager",
      "approuver",
      "refuser",
      "solde",
      "calendrier",
      "export",
    ],
  },
  {
    id: "iot-dashboard",
    title: "Tableau de bord IoT capteurs",
    size: "moyen",
    document: `Plateforme de supervision de capteurs IoT. Les capteurs (température,
humidité, CO2) envoient des mesures toutes les minutes. Le tableau de bord affiche
les valeurs en temps réel sous forme de graphiques. L'utilisateur définit des seuils
d'alerte par capteur ; un dépassement déclenche une alerte e-mail et une notification.
Historique consultable avec filtres par période et par capteur. Gestion des appareils :
ajout, renommage, désactivation. Rôles : administrateur (gère les appareils) et
observateur (lecture seule).`,
    expectedThemes: [
      "capteur",
      "mesure",
      "temps réel",
      "graphique",
      "seuil",
      "alerte",
      "historique",
      "filtre",
      "appareil",
      "rôle",
    ],
  },
  {
    id: "elearning",
    title: "Plateforme e-learning",
    size: "grand",
    document: `Plateforme d'apprentissage en ligne. Un formateur crée des cours composés
de chapitres, eux-mêmes composés de leçons (vidéo, texte ou quiz). Un apprenant
s'inscrit à un cours, progresse leçon par leçon et sa progression est sauvegardée.
Les quiz sont notés automatiquement et un score minimum débloque le chapitre suivant.
À la fin d'un cours, un certificat est généré. Système de commentaires et de questions
sous chaque leçon. Le formateur suit les statistiques : taux de complétion, scores moyens,
apprenants actifs. Recherche et catalogue de cours par catégorie. Paiement pour les cours
payants et gestion des inscriptions gratuites.`,
    expectedThemes: [
      "cours",
      "chapitre",
      "leçon",
      "vidéo",
      "quiz",
      "inscription",
      "progression",
      "note",
      "certificat",
      "commentaire",
      "statistiques",
      "catalogue",
      "paiement",
    ],
  },
];
