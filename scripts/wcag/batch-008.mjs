// Lot de traduction FR 008. Usage : node scripts/wcag/batch-008.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  G198: `Fournir à l'utilisateur un moyen de désactiver la limite de temps

Procédure
1. Vérifier que les utilisateurs sont informés de la limite de temps avant de la rencontrer.
2. Vérifier qu'un mécanisme est fourni pour désactiver la limite de temps.
3. Vérifier que ce mécanisme n'a pas lui-même de limite de temps.`,

  G180: `Fournir à l'utilisateur un moyen de régler la limite de temps à 10 fois la limite par défaut

Procédure
1. Vérifier que les utilisateurs sont informés de la limite de temps avant de la rencontrer.
2. Vérifier qu'un mécanisme est fourni pour régler la limite de temps à au moins 10 fois la limite par défaut.
3. Vérifier que ce mécanisme peut être utilisé avant que la limite de temps par défaut ne soit atteinte.`,

  SCR16: `Fournir un script qui avertit l'utilisateur qu'une limite de temps est sur le point d'expirer

Procédure
1. Repérer les limites de temps définies par le contenu.
2. Vérifier qu'un avertissement est fourni à l'utilisateur au moins 20 secondes avant l'expiration de chaque limite de temps.
3. Vérifier que l'utilisateur peut prolonger la limite de temps par une action simple, telle qu'appuyer sur un bouton.
4. Vérifier que l'utilisateur peut prolonger la limite de temps au moins 10 fois.`,

  SCR1: `Permettre à l'utilisateur de prolonger la limite de temps par défaut

Procédure
1. Déterminer la limite de temps par défaut.
2. Vérifier qu'un avertissement est fourni avant l'expiration de la limite de temps.
3. Vérifier qu'un mécanisme est fourni pour prolonger la limite de temps.
4. Vérifier que la limite de temps peut être prolongée jusqu'à au moins 10 fois la valeur par défaut.`,

  G4: `Permettre la mise en pause du contenu et sa reprise à l'endroit où il a été mis en pause

Procédure
1. Vérifier qu'un mécanisme est fourni pour mettre en pause un contenu en mouvement, clignotant, défilant ou à mise à jour automatique.
2. Vérifier qu'un mécanisme est fourni pour reprendre le contenu mis en pause.
3. Vérifier que le contenu reprend à l'endroit où il a été mis en pause.`,

  SCR33: `Utiliser un script pour faire défiler le contenu et fournir un mécanisme pour le mettre en pause

Procédure
1. Vérifier qu'un mécanisme est fourni pour mettre en pause le contenu défilant.
2. Utiliser le mécanisme de pause pour mettre en pause le contenu défilant.
3. Vérifier que le défilement s'est arrêté et ne reprend pas de lui-même.
4. Vérifier qu'un mécanisme est fourni pour reprendre le contenu mis en pause.
5. Utiliser le mécanisme de reprise fourni pour relancer le contenu défilant.
6. Vérifier que le défilement a repris à l'endroit où il a été arrêté.`,

  SCR36: `Fournir un mécanisme permettant à l'utilisateur d'afficher un texte en mouvement, défilant ou à mise à jour automatique dans une fenêtre ou une zone statique

Certaines pages web affichent du texte défilant parce que l'espace disponible est limité. Faire défiler le texte dans une petite fenêtre rend le contenu accessible aux utilisateurs capables de lire assez vite, mais pose problème aux utilisateurs qui lisent plus lentement ou utilisent une technologie d'assistance. Cette technique fournit un mécanisme pour arrêter le mouvement et rendre l'intégralité du bloc de texte disponible de manière statique. Le texte peut être rendu disponible dans une fenêtre distincte ou dans une section (plus grande) de la page. Les utilisateurs peuvent alors lire le texte à leur propre rythme.

Cette technique ne s'applique pas lorsque le texte en mouvement ne peut pas être affiché en une seule fois à l'écran (par ex. une longue conversation de messagerie).`,

  F40: `Échec dû à l'utilisation d'une redirection meta avec une limite de temps

Procédure
Pour une page qui utilise \`meta http-equiv="refresh"\` :

1. Vérifier que la valeur numérique des secondes avant rafraîchissement est présente dans l'attribut content.
2. Vérifier que la valeur numérique des secondes avant rafraîchissement dans l'attribut content est inférieure à un ou supérieure à 72 000.
3. Vérifier si la page relève des exceptions « Temps réel » ou « Essentiel » du critère de succès 2.2.1 Réglage du délai.
4. Vérifier si l'utilisateur a la possibilité de désactiver, prolonger ou ajuster le délai du rafraîchissement de la page.
5. Vérifier si la page ne se redirige pas après la durée spécifiée dans l'attribut content.`,

  F41: `Échec des critères de succès 2.2.1, 2.2.4 et 3.2.5 dû à l'utilisation de meta refresh pour recharger la page

Procédure
Pour une page qui utilise \`meta http-equiv="refresh"\` :

1. Vérifier que la valeur numérique des secondes avant rafraîchissement est présente dans l'attribut \`content\`.
2. Vérifier que la valeur numérique des secondes avant rafraîchissement dans l'attribut \`content\` est inférieure à \`1\` ou supérieure à \`72000\`.
3. Vérifier si la page relève des exceptions « Temps réel » ou « Essentiel » du critère de succès 2.2.1 Réglage du délai.
4. Vérifier si l'utilisateur a la possibilité de désactiver, prolonger ou ajuster le délai du rafraîchissement de la page.
5. Vérifier si la page ne se rafraîchit pas après la durée spécifiée dans l'attribut \`content\`.`,

  F58: `Échec du critère de succès 2.2.1 dû à l'utilisation de techniques côté serveur pour rediriger automatiquement les pages après un délai

Procédure
1. Vérifier si la page web se redirige automatiquement vers une autre page après un certain temps sans aucune action de l'utilisateur.
2. Vérifier si la page relève des exceptions « Temps réel » ou « Essentiel » du critère de succès 2.2.1 Réglage du délai.
3. Vérifier si l'utilisateur a la possibilité de désactiver, prolonger ou ajuster le délai du rafraîchissement de la page.`,

  G11: `Créer un contenu qui clignote pendant moins de 5 secondes

Procédure
1. Repérer le contenu clignotant de la page.
2. Mesurer la durée du clignotement.
3. Vérifier que le clignotement s'arrête après moins de 5 secondes.`,

  G152: `Régler les images GIF animées pour qu'elles cessent de clignoter après n cycles (en moins de 5 secondes)

Procédure
1. Repérer les GIF animés de la page qui comportent un clignotement.
2. Vérifier le nombre de boucles configuré pour le GIF.
3. Vérifier que la durée totale du clignotement est inférieure à 5 secondes.`,

  SCR22: `Utiliser des scripts pour contrôler le clignotement et l'arrêter en cinq secondes ou moins

Procédure
Pour chaque occurrence de contenu clignotant :

1. Démarrer un minuteur de 5 secondes au début de l'effet de clignotement.
2. À l'expiration du minuteur, déterminer si le clignotement s'est arrêté.`,

  G186: `Utiliser, dans la page web, un contrôle qui arrête le contenu en mouvement, clignotant ou à mise à jour automatique

Procédure
1. Vérifier qu'un contrôle est fourni pour permettre à l'utilisateur d'arrêter le contenu en mouvement, clignotant ou à mise à jour automatique.
2. Vérifier que le contrôle est facile à trouver et à actionner.
3. Activer le contrôle et vérifier que le contenu en mouvement, clignotant ou à mise à jour automatique s'arrête.`,

  G191: `Fournir un lien, un bouton ou un autre mécanisme qui recharge la page sans aucun contenu clignotant

Procédure
1. Vérifier qu'un mécanisme est fourni pour permettre à l'utilisateur de recharger la page sans contenu clignotant.
2. Activer le mécanisme et vérifier que la page est rechargée sans le contenu clignotant.`,

  F16: `Échec du critère de succès 2.2.2 dû à l'inclusion d'un contenu défilant, alors que le mouvement n'est pas essentiel à l'activité, sans inclure également un mécanisme pour mettre en pause et reprendre le contenu

Procédure
Sur une page comportant un contenu en mouvement ou défilant,

1. Vérifier qu'un mécanisme est fourni dans la page web ou l'agent utilisateur pour mettre en pause le contenu en mouvement ou défilant.
2. Utiliser le mécanisme de pause pour mettre en pause le contenu en mouvement ou défilant.
3. Vérifier que le mouvement ou le défilement s'est arrêté et ne reprend pas de lui-même.
4. Vérifier qu'un mécanisme est fourni dans la page web ou l'agent utilisateur pour reprendre le contenu mis en pause.
5. Utiliser le mécanisme de reprise fourni pour relancer le contenu en mouvement.
6. Vérifier que le mouvement ou le défilement a repris à l'endroit où il a été arrêté.`,

  F112: `Échec du critère de succès 2.2.2 dû à un contenu clignotant qui dure plus de cinq secondes sans mécanisme pour l'arrêter

Procédure
1. Examiner la page à la recherche d'un contenu clignotant qui démarre automatiquement, est présenté en parallèle d'autres contenus, et dure plus de cinq secondes.
2. Si un tel contenu est présent, vérifier qu'il existe une méthode pour arrêter le clignotement.`,

  F50: `Échec du critère de succès 2.2.2 dû à un script qui provoque un effet de clignotement sans mécanisme pour arrêter le clignotement en 5 secondes ou moins

Procédure
Pour chaque occurrence de contenu clignotant :

1. Déterminer si le clignotement s'arrête en 5 secondes ou moins.`,

  F7: `Échec du critère de succès 2.2.2 dû à un objet ou une applet comportant un contenu clignotant sans mécanisme pour mettre en pause le contenu qui clignote pendant plus de cinq secondes

Procédure
Pour chaque page comportant un contenu clignotant dans un plugin ou une applet :

1. Déterminer si le contenu continue de clignoter pendant plus de 5 secondes.
2. Déterminer s'il existe un moyen de mettre en pause le contenu clignotant.`,

  G19: `Garantir qu'aucun composant du contenu ne flashe plus de trois fois sur une période quelconque d'une seconde

Procédure
1. Repérer les composants du contenu qui flashent.
2. Mesurer la fréquence des flashs.
3. Vérifier qu'aucun composant ne flashe plus de trois fois sur une période quelconque d'une seconde.`,

  G176: `Maintenir la zone de flash suffisamment petite

Procédure
1. Repérer les composants du contenu qui flashent.
2. Mesurer la taille de la zone qui flashe.
3. Vérifier que la zone qui flashe ne dépasse pas 25 % d'un champ visuel quelconque de 10 degrés.`,

  G15: `Utiliser un outil pour s'assurer que le contenu ne dépasse pas le seuil général de flash ou le seuil de flash rouge

Procédure
1. Sélectionner un outil capable de tester le contenu par rapport au seuil général de flash et au seuil de flash rouge.
2. Utiliser l'outil pour analyser le contenu.
3. Vérifier que le contenu ne dépasse aucun des deux seuils.`,

  G1: `Ajouter, en haut de chaque page, un lien qui mène directement à la zone de contenu principal

Procédure
1. Vérifier qu'un lien est fourni en haut de la page et mène à la zone de contenu principal.
2. Vérifier que le lien est le premier élément focusable, ou parmi les premiers.
3. Vérifier que l'activation du lien déplace le focus vers la zone de contenu principal.`,

  G123: `Ajouter, au début d'un bloc de contenu répété, un lien permettant d'aller à la fin du bloc

Procédure
1. Repérer les blocs de contenu répété de la page.
2. Vérifier qu'un lien est fourni au début de chaque bloc pour aller à la fin du bloc.
3. Activer le lien et vérifier que le focus se déplace vers l'élément situé immédiatement après le bloc.`,

  G124: `Ajouter, en haut de la page, des liens vers chaque zone du contenu

Procédure
1. Vérifier que des liens sont fournis en haut de la page vers chaque zone principale de contenu.
2. Vérifier que chaque lien est clairement étiqueté.
3. Activer chaque lien et vérifier que le focus se déplace vers la zone de contenu correspondante.`,

  H69: `Fournir des éléments de titre au début de chaque section de contenu

Procédure
1. Repérer les sections de contenu de la page.
2. Vérifier que chaque section commence par un élément de titre approprié (h1-h6).
3. Vérifier que les niveaux de titre reflètent la structure hiérarchique du contenu.`,

  H64: `Utiliser l'attribut title de l'élément iframe

Procédure
1. Vérifier dans le code source HTML la présence d'un attribut \`title\` sur chaque élément \`iframe\`.
2. Vérifier que l'attribut \`title\` contient un texte qui décrit le contenu de l'\`iframe\`.`,

  SCR28: `Utiliser un menu déployable et repliable pour court-circuiter un bloc de contenu

Procédure
1. Vérifier qu'un contrôle d'interface permet de déployer ou de replier le contenu répété.
2. Vérifier que, lorsque le contenu est déployé, il est inclus dans le contenu déterminé par programmation à une place logique de l'ordre de lecture.
3. Vérifier que, lorsque le contenu est replié, il ne fait pas partie du contenu déterminé par programmation.`,
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
  `Lot 008 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
