// Exemples de few-shot learning pour la génération de plans.
//
// Chaque exemple est une paire `document de fonctionnalités` -> `plan` qui
// illustre le comportement attendu : titres courts à l'impératif en français,
// description détaillée et non vide pour chaque tâche (ce qui doit être fait et
// les cas à couvrir), couverture exhaustive du document sans doublon.
//
// Les exemples n'incluent volontairement PAS de "labels" : le catalogue de
// labels est dynamique (géré par l'admin) et injecté séparément dans le prompt
// système. Montrer ici des labels figés apprendrait au modèle des labels hors
// catalogue. Le few-shot se concentre donc sur la qualité de la décomposition
// (titres + descriptions), qui est le cœur de la tâche.
const FEW_SHOT_EXAMPLES = [
  {
    document:
      "Authentification par email : l'utilisateur peut créer un compte avec email et mot de passe, " +
      "se connecter, et réinitialiser son mot de passe via un lien envoyé par email.",
    plan: {
      tasks: [
        {
          title: "Créer le formulaire d'inscription",
          description:
            "Saisie de l'email et du mot de passe avec validation côté client (format d'email, longueur minimale du mot de passe) et affichage des erreurs de saisie.",
        },
        {
          title: "Implémenter l'endpoint d'inscription",
          description:
            "Créer le compte, hacher le mot de passe avant stockage et rejeter les emails déjà enregistrés avec un message explicite.",
        },
        {
          title: "Créer le formulaire de connexion",
          description:
            "Authentifier l'utilisateur à partir de son email et mot de passe, et afficher un message clair en cas d'identifiants invalides.",
        },
        {
          title: "Envoyer l'email de réinitialisation",
          description:
            "Générer un jeton de réinitialisation à durée de validité limitée et envoyer le lien correspondant à l'adresse du compte.",
        },
        {
          title: "Réinitialiser le mot de passe",
          description:
            "Valider le jeton reçu, refuser les liens expirés ou déjà utilisés, puis enregistrer le nouveau mot de passe haché.",
        },
      ],
    },
  },
  {
    document:
      "Notifications : l'utilisateur reçoit une notification en temps réel quand une tâche lui est " +
      "assignée. Il peut consulter la liste de ses notifications et les marquer comme lues.",
    plan: {
      tasks: [
        {
          title: "Émettre une notification à l'assignation",
          description:
            "Créer une notification destinée à l'assigné dès qu'une tâche lui est attribuée, en y incluant la tâche concernée.",
        },
        {
          title: "Diffuser la notification en temps réel",
          description:
            "Pousser la notification vers l'utilisateur connecté via WebSocket pour un affichage immédiat sans rechargement.",
        },
        {
          title: "Afficher la liste des notifications",
          description:
            "Lister les notifications de l'utilisateur, les plus récentes en premier, en distinguant visuellement celles non lues.",
        },
        {
          title: "Marquer une notification comme lue",
          description:
            "Mettre à jour le statut de lecture d'une notification et rafraîchir le compteur de notifications non lues.",
        },
      ],
    },
  },
  {
    document:
      "Fonctionnalité : Retrait utilisateur\n" +
      "L'utilisateur peut demander un retrait de son solde vers trois moyens : virement bancaire, " +
      "Alipay ou USDT (réseau TRC20).\n" +
      "Parcours utilisateur : il choisit le moyen, saisit le montant et les informations du " +
      "bénéficiaire (RIB, identifiant Alipay ou adresse de portefeuille), puis confirme. Le montant " +
      "est bloqué sur son solde en attendant la validation.\n" +
      "Validation : un administrateur consulte les demandes en attente, vérifie les informations et " +
      "approuve ou rejette. En cas de rejet, le montant est recrédité et un motif est fourni.\n" +
      "Notification : à chaque changement de statut (créée, approuvée, rejetée, payée), une " +
      "notification est envoyée sur le canal Telegram d'administration.",
    plan: {
      tasks: [
        {
          title: "Créer le formulaire de demande de retrait",
          description:
            "Choix du moyen (virement, Alipay, USDT), saisie du montant et des informations du bénéficiaire, avec validation côté client avant confirmation.",
        },
        {
          title: "Adapter les champs bénéficiaire au moyen choisi",
          description:
            "Afficher le RIB pour le virement, l'identifiant Alipay pour Alipay ou l'adresse de portefeuille pour l'USDT (TRC20).",
        },
        {
          title: "Vérifier le solde disponible",
          description:
            "Refuser la demande si le montant demandé dépasse le solde disponible de l'utilisateur et afficher un message explicite.",
        },
        {
          title: "Bloquer le montant à la création de la demande",
          description:
            "Réserver le montant sur le solde de l'utilisateur dès la création afin qu'il ne soit pas réutilisable en attendant la validation.",
        },
        {
          title: "Lister les demandes de retrait en attente",
          description:
            "Fournir une vue administrateur des demandes à traiter avec le moyen, le montant et les informations du bénéficiaire.",
        },
        {
          title: "Approuver une demande de retrait",
          description:
            "Valider la demande, la passer au statut approuvé et confirmer le débit du montant bloqué.",
        },
        {
          title: "Rejeter une demande de retrait",
          description:
            "Recréditer le montant bloqué sur le solde de l'utilisateur et enregistrer le motif du rejet.",
        },
        {
          title: "Marquer une demande comme payée",
          description:
            "Passer la demande au statut payé une fois le transfert réellement exécuté vers le bénéficiaire.",
        },
        {
          title: "Notifier le canal Telegram à chaque changement de statut",
          description:
            "Envoyer un message sur le canal d'administration pour les statuts créée, approuvée, rejetée et payée.",
        },
        {
          title: "Afficher l'historique des retraits à l'utilisateur",
          description:
            "Lister ses demandes avec le moyen, le montant, le statut et le motif éventuel de rejet.",
        },
      ],
    },
  },
];

/**
 * Construit les tours de conversation few-shot à insérer AVANT le vrai
 * document de l'utilisateur. Chaque exemple devient une paire user/assistant
 * (document -> plan JSON), ce qui montre au modèle la sortie attendue.
 *
 * @param {boolean} cacheLast - place un point de cache sur le dernier bloc
 *   assistant. Comme les exemples sont statiques, cela met en cache le préfixe
 *   (système + few-shot) et évite de le refacturer à chaque génération.
 * @returns {Array<{role: string, content: any}>}
 */
const buildFewShotMessages = (cacheLast = true) => {
  const messages = [];
  FEW_SHOT_EXAMPLES.forEach((example, index) => {
    messages.push({ role: "user", content: example.document });

    const isLast = index === FEW_SHOT_EXAMPLES.length - 1;
    const planText = JSON.stringify(example.plan);
    if (isLast && cacheLast) {
      messages.push({
        role: "assistant",
        content: [
          { type: "text", text: planText, cache_control: { type: "ephemeral" } },
        ],
      });
    } else {
      messages.push({ role: "assistant", content: planText });
    }
  });
  return messages;
};

module.exports = { FEW_SHOT_EXAMPLES, buildFewShotMessages };
