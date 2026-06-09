// Lot de traduction FR 010. Usage : node scripts/wcag/batch-010.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  G161: `Fournir une fonction de recherche pour aider les utilisateurs à trouver du contenu

Procédure
1. Vérifier qu'une fonction de recherche est fournie.
2. Vérifier que la fonction de recherche est accessible depuis plusieurs pages du site.
3. Vérifier que la fonction de recherche renvoie des résultats pertinents.`,

  G126: `Fournir une liste de liens vers toutes les autres pages web

Procédure
1. Vérifier qu'une liste de liens vers toutes les autres pages web est fournie.
2. Vérifier que la liste est organisée d'une manière qui facilite la recherche de pages précises.`,

  G185: `Faire un lien vers toutes les pages du site depuis la page d'accueil

Procédure
1. Vérifier que la page d'accueil contient des liens vers toutes les pages du site.`,

  G130: `Fournir des titres descriptifs

Procédure
1. Repérer les titres de la page.
2. Vérifier que chaque titre décrit le contenu de la section qu'il introduit.`,

  G131: `Fournir des étiquettes descriptives

Procédure
Pour chaque composant d'interface doté d'une étiquette :
1. Identifier la fonction du composant d'interface.
2. Vérifier que chaque étiquette rend claire la fonction du composant.`,

  G149: `Utiliser des composants d'interface qui sont mis en évidence par l'agent utilisateur lorsqu'ils reçoivent le focus

Procédure
1. Repérer les composants d'interface de la page.
2. Vérifier que des composants HTML standard sont utilisés autant que possible.
3. Vérifier que l'indicateur de focus par défaut fourni par l'agent utilisateur n'est pas surchargé d'une manière qui le supprime ou le masque.`,

  C15: `Utiliser CSS pour modifier la présentation d'un composant d'interface lorsqu'il reçoit le focus

Procédure
1. Repérer les composants d'interface interactifs.
2. Vérifier que la pseudo-classe CSS \`:focus\` est utilisée pour modifier la présentation du composant lorsqu'il reçoit le focus.
3. Vérifier que le changement de présentation est clairement visible.`,

  G165: `Utiliser l'indicateur de focus par défaut de la plateforme afin que les indicateurs de focus par défaut très visibles soient repris

Procédure
1. Vérifier que la page utilise l'indicateur de focus par défaut fourni par la plateforme.
2. Vérifier que l'indicateur de focus n'est pas surchargé par du CSS ou un autre style.`,

  C40: `Créer un indicateur de focus à deux couleurs pour garantir un contraste suffisant avec tous les composants

Procédure
1. Vérifier que l'indicateur de focus utilise deux couleurs.
2. Vérifier que la combinaison de couleurs fournit un contraste suffisant avec tous les composants et arrière-plans.`,

  C45: `Utiliser CSS pour modifier la présentation d'un composant d'interface lorsque la préférence utilisateur est au contraste élevé

Procédure
1. Vérifier que la media query CSS \`prefers-contrast\` est utilisée pour détecter les préférences de contraste élevé.
2. Vérifier que les règles CSS ajustent correctement la présentation des composants d'interface lorsque le contraste élevé est préféré.`,

  SCR31: `Utiliser un script pour modifier la couleur d'arrière-plan ou la bordure de l'élément ayant le focus

Procédure
1. Tabuler jusqu'à chaque élément de la page
2. Vérifier que l'indicateur de focus est visible`,

  G215: `Fournir des contrôles permettant d'obtenir le même résultat que les gestes basés sur une trajectoire ou multipoints

Procédure
1. Repérer les gestes basés sur une trajectoire ou multipoints dans le contenu.
2. Vérifier que des contrôles conventionnels sont disponibles pour obtenir le même résultat.`,

  G216: `Fournir une activation en un seul point pour un contrôle de type curseur (slider)

Procédure
1. Repérer les contrôles de type curseur dans le contenu.
2. Vérifier que le curseur peut être actionné en tapant ou en cliquant sur des points précis le long de la piste.`,

  F105: `Échec du critère de succès 2.5.1 dû à la fourniture d'une fonctionnalité via un geste basé sur une trajectoire sans alternative en pointage simple

Procédure
Pour chaque partie du contenu qui implémente une fonction activable par un geste basé sur une trajectoire :

1. Vérifier que des contrôles sont disponibles permettant d'exécuter la même fonction au moyen de simples tapes ou clics.`,

  G210: `Garantir que les actions de glisser-déposer peuvent être annulées

Procédure
1. Repérer les actions de glisser-déposer dans le contenu.
2. Vérifier qu'un mécanisme est fourni pour annuler l'action de glisser-déposer.
3. Vérifier que l'annulation de l'action empêche toute modification d'être effectuée.`,

  G212: `Utiliser des contrôles natifs pour garantir que la fonctionnalité est déclenchée sur l'événement de relâchement (up-event)

Procédure
1. Repérer les contrôles dans le contenu.
2. Vérifier que des contrôles natifs sont utilisés autant que possible.
3. Vérifier que la fonctionnalité est déclenchée sur l'événement de relâchement.`,

  F101: `Échec du critère de succès 2.5.2 dû à l'activation d'un contrôle sur l'événement d'appui (down-event)

Procédure
Ouvrir le contenu sur un appareil doté d'entrées de pointage (souris, écran tactile, stylet) et, pour tous les contrôles disponibles (boutons, liens, composants complexes) :

1. Déclencher les événements d'appui (par ex. en pressant sans relâcher le bouton de la souris, ou en posant un doigt ou un stylet sur l'écran tactile) et vérifier si la fonctionnalité est exécutée avant l'événement de relâchement (par ex. relâcher le bouton de la souris ou lever le doigt/stylet)
2. Si la fonctionnalité a été exécutée sur l'événement d'appui, vérifier si le déclenchement de l'événement de relâchement (relâcher le bouton de la souris pressé, ou lever le doigt ou le stylet de l'écran tactile) annule le résultat
3. Évaluer s'il pourrait être considéré comme essentiel que les contrôles exécutent et achèvent la fonctionnalité sur l'événement d'appui`,

  G208: `Inclure le texte de l'étiquette visible dans le nom accessible

Procédure
1. Repérer les composants d'interface dotés d'étiquettes visibles.
2. Vérifier que le nom accessible de chaque composant inclut le texte de l'étiquette visible.`,

  G211: `Faire correspondre le nom accessible à l'étiquette visible

Procédure
1. Repérer les composants d'interface dotés d'étiquettes visibles.
2. Vérifier que le nom accessible de chaque composant correspond exactement à l'étiquette visible.`,

  F96: `Échec dû au nom accessible ne contenant pas le texte de l'étiquette visible

Procédure
Pour tous les contrôles dotés d'une étiquette visible (par ex. texte de lien, texte de bouton, étiquette liée par programmation, images dans des liens avec texte), vérifier que :

1. Le nom accessible est identique à l'étiquette visible.
2. Le nom accessible contient une correspondance avec la chaîne de l'étiquette visible.`,

  G213: `Fournir des contrôles conventionnels et un réglage d'application pour les entrées activées par le mouvement

Procédure
1. Repérer la fonctionnalité activée par le mouvement.
2. Vérifier que des contrôles conventionnels sont fournis pour activer la même fonctionnalité.
3. Vérifier qu'un réglage d'application est fourni pour désactiver l'activation par le mouvement.`,

  F106: `Échec dû à l'impossibilité de désactiver l'actionnement par le mouvement

Procédure
Pour chaque fonction déclenchée par un capteur de mouvement :

1. Vérifier si l'utilisation d'un capteur de mouvement est essentielle ou requise pour rendre la fonction prise en charge par l'accessibilité.
2. Vérifier s'il existe un réglage utilisateur qui désactive la détection de mouvement.`,

  H57: `Utiliser l'attribut de langue sur l'élément HTML

Procédure
Examiner l'élément html du document.
1. Vérifier que l'élément html possède un attribut lang.
2. Vérifier que la valeur de l'attribut lang est conforme à BCP 47 (Tags for Identifying Languages ; Matching of Language Tags) ou à son successeur, et reflète la langue principale utilisée par la page web.`,

  PDF16: `Définir la langue par défaut au moyen de l'entrée /Lang dans le catalogue d'un document PDF

Procédure
1. Vérifier que la langue par défaut du document est correctement spécifiée, de l'une des manières suivantes :
  - Lire le document PDF avec un lecteur d'écran, en écoutant si le texte est lu dans la langue naturelle correcte.
  - À l'aide d'un éditeur PDF, vérifier que la langue est réglée sur la langue par défaut du document.
  - Utiliser un outil capable d'afficher la valeur de l'entrée /Lang du catalogue pour ouvrir le document PDF et consulter les réglages de langue.
  - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que la langue est réglée sur la langue par défaut.`,

  PDF19: `Spécifier la langue d'un passage ou d'une phrase au moyen de l'entrée Lang dans les documents PDF

Procédure
1. Vérifier que la langue d'un passage, d'une phrase ou d'un mot qui diffère de la langue du texte environnant est correctement spécifiée par une entrée /Lang sur une balise ou un conteneur englobant :
  - Lire le document PDF avec un lecteur d'écran qui prend en charge la langue de la phrase et celle du texte environnant, en écoutant si le texte est lu dans la langue naturelle correcte.
  - À l'aide d'un éditeur PDF, sélectionner le mot ou la phrase dans la langue différente et vérifier que la langue est correctement réglée.
  - Utiliser un outil capable d'afficher la valeur de l'entrée /Lang pour ouvrir le document PDF et consulter les réglages de langue.
  - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que la langue du passage ou de la phrase est correctement réglée.
2. Vérifier que si le conteneur ou la balise englobe l'intégralité du document, le réglage de langue correspond à la langue prévue comme langue par défaut du document.`,

  H58: `Utiliser les attributs de langue pour identifier les changements de langue naturelle

Procédure
Pour chaque élément du document :
1. Vérifier que la langue naturelle du contenu de l'élément est la même que la langue héritée pour cet élément, telle que spécifiée en HTML (attributs lang et xml:lang).
Pour chaque attribut lang du document :
1. Vérifier que la valeur de l'attribut lang est conforme à BCP 47 (Tags for Identifying Languages ; Matching of Language Tags) ou à son successeur.
2. Vérifier que le code de langue correspond à la langue du contenu auquel il s'applique.`,

  G107: `Utiliser « l'activation » plutôt que « le focus » comme déclencheur des changements de contexte

Procédure
1. À l'aide d'un clavier, faire circuler le focus à travers tout le contenu
2. Vérifier qu'aucun changement de contexte ne se produit lorsqu'un composant reçoit le focus.`,

  G80: `Fournir un bouton d'envoi pour déclencher un changement de contexte

Procédure
1. Repérer tous les formulaires du contenu
2. Pour chaque formulaire, vérifier qu'il possède un bouton d'envoi`,
};

const techPath = new URL("./wcag-techniques.json", import.meta.url);
const techniques = JSON.parse(readFileSync(techPath));
let applied = 0;
const unknown = [];
for (const [code, text] of Object.entries(fr)) {
  if (!techniques[code]) {
    unknown.push(code);
    continue;
  }
  techniques[code].fr = text;
  applied++;
}
writeFileSync(techPath, JSON.stringify(techniques, null, 2));
const totalFr = Object.values(techniques).filter((t) => t.fr && t.fr.trim())
  .length;
console.log(
  `Lot 010 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
