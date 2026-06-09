// Lot de traduction FR 007. Usage : node scripts/wcag/batch-007.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  C38: `Utiliser les propriétés CSS width, max-width et flexbox pour ajuster les étiquettes et les champs de saisie

Procédure
1. Afficher la page web dans un agent utilisateur capable d'un zoom à 400 % et régler les dimensions de la zone d'affichage (en pixels CSS) à 1280 de large et 1024 de haut.
2. Zoomer à 400 %.
3. Pour le contenu à défilement vertical, toutes les étiquettes et tous les champs de saisie tiennent dans leur espace disponible sans défilement horizontal.

NB : si le navigateur n'est pas capable de zoomer à 400 %, vous pouvez réduire proportionnellement la largeur du navigateur. Par exemple, à 300 % de zoom, la zone d'affichage devrait faire 960 px de large.`,

  G206: `Fournir, dans le contenu, des options pour basculer vers une mise en page qui n'oblige pas l'utilisateur à défiler horizontalement pour lire une ligne de texte

Procédure
1. Ouvrir, sur une fenêtre plein écran, le contenu qui nécessite un défilement horizontal.
2. Vérifier qu'il existe, dans le contenu, une option pour basculer vers une mise en page n'obligeant pas l'utilisateur à défiler horizontalement pour lire une ligne de texte.
3. Activer l'option.
4. Vérifier qu'aucun défilement horizontal n'est nécessaire pour lire une ligne de texte.`,

  G224: `Prendre en compte l'indentation signifiante du texte et la redistribution (reflow)

Procédure
1. Afficher la page web dans un agent utilisateur où la page peut être zoomée, ou l'agent utilisateur redimensionné.
2. Zoomer ou redimensionner la fenêtre du navigateur de sorte que la zone d'affichage équivaille à 320 pixels CSS de large.
3. Le contenu de la liste tient dans la largeur de sorte qu'il n'est nécessaire de défiler que verticalement pour lire la liste.
4. Ou bien chaque liste imbriquée peut être amenée à l'écran par défilement horizontal. Seul un défilement vertical est nécessaire pour lire le contenu des éléments de liste de chaque niveau de liste imbriquée.

1. Afficher la page web dans un agent utilisateur où la page peut être zoomée, ou l'agent utilisateur redimensionné.
2. Zoomer ou redimensionner la fenêtre du navigateur de sorte que la zone d'affichage équivaille à 320 pixels CSS de large.
3. Les extraits de code tiennent dans la largeur de sorte qu'il n'est nécessaire de défiler que verticalement pour lire chaque ligne de code.
4. Ou bien, pour du code où les lignes non coupées ne sont pas essentielles, le code passe à la ligne ou un mécanisme est fourni pour permettre le retour à la ligne.
5. Ou bien, l'indentation et les sauts de ligne sont signifiants pour le langage du code.`,

  G225: `Concevoir les panneaux de section qui défilent horizontalement pour qu'ils tiennent dans une largeur de 320 pixels CSS sur une page à défilement vertical

Procédure
1. Vérifier que la mise en page comporte des sections de contenu qui défilent horizontalement au sein d'une page à défilement vertical.
2. Vérifier que chaque section à défilement horizontal est divisée en panneaux distincts.
3. Ouvrir la page web dans un agent utilisateur qui prend en charge le zoom à 400 %, en réglant les dimensions de la zone d'affichage à 1280 pixels CSS de large.
4. Activer la fonction de zoom pour agrandir l'affichage de 400 %.
5. Vérifier que le contenu de chaque panneau individuel des sections à défilement horizontal est entièrement lisible sans nécessiter de défilement horizontal supplémentaire.

Remarque : la barre de défilement native du navigateur n'est pas incluse dans les dimensions de la zone d'affichage. Par conséquent, lors du réglage de l'affichage à 1280 pixels CSS de large pour une page à défilement vertical, veillez à exclure la largeur de la barre de défilement.`,

  F102: `Échec du critère de succès 1.4.10 dû à la disparition d'un contenu qui n'est plus disponible une fois la redistribution (reflow) effectuée

Procédure
1. Vérifier les éléments de contenu visibles à une largeur de zone d'affichage de bureau, par exemple 1280 px
2. Régler la largeur de la zone d'affichage à 320 px en rétrécissant la fenêtre du navigateur, ou en zoomant de sorte que la largeur de la zone d'affichage soit désormais de 320 px (en partant d'une largeur de 1280 px à 100 % de zoom du navigateur, cela peut se faire en zoomant à 400 %)
3. Pour chaque élément de contenu non fourni à la largeur de 320 px, vérifier qu'il existe un moyen d'atteindre le même contenu ou un contenu équivalent via des composants de révélation (disclosure), des fenêtres surgissantes ou des liens vers d'autres vues`,

  G195: `Utiliser un indicateur de focus fourni par l'auteur et très visible

Procédure
1. Identifier l'indicateur de focus utilisé sur la page.
2. Vérifier que l'indicateur de focus est très visible.
3. Vérifier que l'indicateur de focus est cohérent sur tous les éléments focusables.`,

  G207: `Garantir un rapport de contraste de 3:1 pour les icônes

Procédure
Pour chaque objet graphique nécessaire à la compréhension, utiliser un outil de contraste de couleur pour :

1. Déterminer la couleur de premier plan de l'objet graphique.
2. Déterminer la couleur d'arrière-plan adjacente. Si l'arrière-plan est un dégradé ou un motif, identifier la couleur présentant le plus faible contraste avec le premier plan.
3. Vérifier que le rapport de contraste est égal ou supérieur à 3:1.
4. Si une partie de la zone d'arrière-plan n'atteint pas 3:1 avec le premier plan, supposer que les parties de l'icône adjacentes à cette ou ces zones ne sont pas visibles.
5. Vérifier que l'icône reste reconnaissable sans aucune des zones de contraste insuffisant.`,

  G209: `Fournir un contraste suffisant aux frontières entre couleurs adjacentes

Procédure
Pour chaque objet graphique nécessaire à la compréhension, utiliser un outil de contraste de couleur pour :

1. Mesurer le rapport de contraste de chaque couleur par rapport à la ou aux couleurs adjacentes ou à la bordure (si présente).
2. Vérifier que le rapport de contraste est d'au moins 3:1 pour chaque couleur adjacente ou bordure (si présente).`,

  F78: `Échec des critères de succès 1.4.11, 2.4.7 et 2.4.13 dû à un style appliqué aux contours (outline) et bordures des éléments qui supprime ou rend non visible l'indicateur de focus visuel

Procédure
1. Donner le focus à tous les éléments focusables d'une page au moyen du clavier.
2. Vérifier que l'indicateur de focus est visible.`,

  C36: `Permettre la surcharge de l'espacement du texte

Procédure
Pour les éléments contenant du texte destiné à passer à la ligne :

1. Régler le niveau de zoom à 100 %.
2. Utiliser un outil ou un autre mécanisme pour appliquer les métriques d'espacement du texte (hauteur de ligne, et espacement des paragraphes, des lettres et des mots), tel que le bookmarklet Text Spacing ou un plugin de navigateur de style utilisateur.
3. Vérifier que tout le contenu et toutes les fonctionnalités sont disponibles, par ex. le texte dans les conteneurs n'est pas tronqué et ne chevauche pas d'autre contenu.`,

  C35: `Permettre l'espacement du texte sans passage à la ligne

Procédure
Pour les éléments contenant du texte non destiné à passer à la ligne :

1. Régler le niveau de zoom à 100 %.
2. Utiliser un outil ou un autre mécanisme pour appliquer les métriques d'espacement du texte (hauteur de ligne, et espacement des paragraphes, des lettres et des mots), tel que le bookmarklet Text Spacing ou un plugin de navigateur de style utilisateur.
3. Vérifier que tout le contenu et toutes les fonctionnalités sont disponibles, par ex. le texte dans les conteneurs n'est pas tronqué et ne chevauche pas d'autre contenu.`,

  F104: `Échec du critère de succès 1.4.12 dû à un contenu rogné ou chevauché lorsque l'espacement du texte est ajusté

Procédure
1. Ouvrir la page et examiner le contenu disponible.
2. Surcharger le CSS de la page au moyen d'une feuille de style utilisateur, d'un bookmarklet, d'une extension ou d'une application, avec les valeurs indiquées dans le critère de succès :
   1. Hauteur de ligne à au moins 1,5 fois la taille de police ;
   2. Espacement après les paragraphes à au moins 2 fois la taille de police ;
   3. Espacement des lettres (tracking) à au moins 0,12 fois la taille de police ;
   4. Espacement des mots à 0,16 fois la taille de police.
3. Vérifier si du contenu est rogné, masqué ou perdu en raison du nouvel espacement du texte.`,

  SCR39: `Rendre le contenu apparaissant au focus ou au survol survolable, masquable et persistant

Procédure
Pour le contenu supplémentaire qui apparaît au survol, vérifier que :

1. Le pointeur peut être déplacé sur le contenu supplémentaire sans que celui-ci disparaisse.
2. Le contenu supplémentaire reste visible et ne se ferme pas automatiquement après un certain temps.
3. Le contenu peut être fermé sans éloigner le pointeur de l'élément déclencheur, soit en appuyant sur \`Échap\`, soit en appuyant sur un autre raccourci clavier documenté, soit en activant le déclencheur.

Pour le contenu supplémentaire qui apparaît au focus, vérifier que :

1. Le contenu supplémentaire reste visible et ne se ferme pas automatiquement après un certain temps.
2. Le contenu peut être fermé sans éloigner le focus de l'élément déclencheur, soit en appuyant sur \`Échap\`, soit en appuyant sur un autre raccourci clavier documenté, soit en activant le déclencheur.`,

  F95: `Échec du critère de succès 1.4.13 dû à un contenu affiché au survol qui n'est pas survolable

Procédure
Pour chaque zone de contenu supplémentaire qui apparaît au survol du pointeur :

1. Le pointeur peut être déplacé sur le nouveau contenu sans que le contenu supplémentaire disparaisse.
2. L'apparition du contenu supplémentaire est contrôlée par l'agent utilisateur, et non par l'auteur.`,

  G202: `Garantir le contrôle au clavier pour toutes les fonctionnalités

Procédure
1. Vérifier si toutes les fonctions du contenu sont accessibles au moyen du seul clavier ou d'une interface clavier.`,

  H91: `Utiliser les contrôles de formulaire HTML et les liens

Procédure
1. Inspecter le code source HTML.
2. Pour chaque occurrence de liens et d'éléments de formulaire, vérifier que le nom, la valeur et l'état sont spécifiés.`,

  PDF23: `Fournir des contrôles de formulaire interactifs dans les documents PDF

Procédure
1. Ouvrir le document PDF dans Adobe Acrobat Pro.
2. Vérifier que des contrôles de formulaire interactifs tels que champs de texte, cases à cocher, boutons radio, listes déroulantes, listes combinées et boutons sont fournis.
3. Utiliser le clavier pour naviguer entre les champs de formulaire et à l'intérieur.
4. Vérifier que chaque champ de formulaire possède une infobulle fournissant un nom accessible.`,

  G90: `Fournir des gestionnaires d'événements déclenchés au clavier

Procédure
1. Vérifier que chaque gestionnaire d'événement spécifique à la souris (y compris \`onmouseover\`, \`onmouseout\`, \`ondblclick\`, \`onmousemove\`, \`onmousedown\` et \`onmouseup\`) possède un gestionnaire d'événement spécifique au clavier correspondant sur le même élément.`,

  SCR20: `Utiliser à la fois le clavier et d'autres fonctions spécifiques aux périphériques

Procédure
1. Repérer toutes les fonctionnalités interactives
2. Vérifier que toutes les fonctionnalités interactives sont accessibles au moyen du seul clavier`,

  SCR35: `Rendre les actions accessibles au clavier en utilisant l'événement onclick des ancres et des boutons

Procédure
Pour toutes les actions de script associées aux éléments \`a\`, \`button\` ou \`input\` :

1. Dans un agent utilisateur qui prend en charge les scripts
  * Cliquer sur le contrôle avec la souris.
  * Vérifier que l'action de script s'exécute correctement.
  * Si le contrôle est un élément d'ancre, vérifier que l'URI de l'attribut \`href\` de l'ancre n'est pas invoqué.
  * Vérifier qu'il est possible de naviguer jusqu'au contrôle et de lui donner le focus au clavier.
  * Donner le focus clavier au contrôle.
  * Vérifier qu'appuyer sur \`ENTRÉE\` invoque l'action de script.
  * Si le contrôle est un élément d'ancre, vérifier que l'URI de l'attribut \`href\` de l'ancre n'est pas invoqué.
2. Dans un agent utilisateur qui ne prend pas en charge les scripts
  * Cliquer sur le contrôle avec la souris.
  * Si le contrôle est un élément d'ancre, vérifier que l'URI de l'attribut \`href\` de l'ancre est invoqué.
  * Vérifier qu'il est possible de naviguer jusqu'au contrôle et de lui donner le focus au clavier.
  * Donner le focus clavier au contrôle.
  * Si le contrôle est un élément d'ancre, vérifier qu'appuyer sur \`ENTRÉE\` invoque l'URI de l'attribut \`href\` de l'ancre.`,

  SCR2: `Utiliser des gestionnaires d'événements clavier et souris redondants

Procédure
1. Vérifier que toute fonctionnalité déclenchée par un gestionnaire d'événement souris peut aussi être déclenchée au clavier par un gestionnaire d'événement clavier correspondant.`,

  F54: `Échec du critère de succès 2.1.1 dû à l'utilisation des seuls gestionnaires d'événements spécifiques à un dispositif de pointage (y compris les gestes) pour une fonction

Procédure
1. Vérifier si les gestionnaires d'événements spécifiques à un dispositif de pointage sont le seul moyen d'invoquer les fonctions de script.
2. Vérifier si la fonction invoquée nécessite une information de saisie sur une trajectoire spécifique pour un dispositif de pointage`,

  F55: `Échec des critères de succès 2.1.1, 2.4.7, 2.4.13 et 3.2.1 dû à l'utilisation d'un script pour retirer le focus lorsque celui-ci est reçu

Procédure
1. Utiliser le clavier pour vérifier que l'on peut atteindre tous les éléments interactifs au clavier.
2. Vérifier que, lorsque le focus est placé sur chaque élément, il y reste jusqu'à ce que l'utilisateur le déplace.`,

  G21: `Garantir que les utilisateurs ne sont pas piégés dans le contenu

Procédure
1. Utiliser le clavier pour naviguer dans le contenu.
2. Vérifier que le focus clavier n'est jamais piégé dans une partie du contenu où l'utilisateur ne pourrait plus continuer à naviguer, ni lire ou interagir avec l'information requise.`,

  F10: `Échec du critère de succès 2.1.2 et de l'exigence de conformité 5 dû à la combinaison de plusieurs formats de contenu d'une manière qui piège les utilisateurs à l'intérieur d'un type de format

Procédure
1. À l'aide d'un clavier, naviguer dans le contenu.
2. Vérifier que le focus clavier n'est pas « piégé » et qu'il est possible de sortir le focus clavier du contenu du plugin sans fermer l'agent utilisateur ni redémarrer le système.`,

  G217: `Fournir un mécanisme permettant à l'utilisateur de réaffecter ou de désactiver les raccourcis à touche de caractère

Procédure
1. Repérer dans le contenu les raccourcis clavier qui n'utilisent que des caractères de lettre, de chiffre, de ponctuation ou de symbole.
2. Vérifier si le contenu fournit un mécanisme pour désactiver ou réaffecter le raccourci.`,

  F99: `Échec du critère de succès 2.1.4 dû à des raccourcis à touche de caractère qui ne peuvent être ni désactivés ni réaffectés

Procédure
Si le site ne fournit *pas* de réglages pour désactiver ou réaffecter les raccourcis clavier :

1. Si le chargement de la page place le focus sur un champ de saisie, cliquer sur une zone vide de la page pour s'assurer qu'aucun champ n'a le focus.
2. Appuyer sur les touches identifiées par l'auteur comme touches de raccourci, ou si cette information n'est pas disponible, appuyer sur tous les caractères imprimables (c'est-à-dire toutes les touches de chiffre, lettre, signe et ponctuation). Ne pas appuyer sur les touches de modification et de contrôle non imprimables telles que \`Ctrl\`, \`Alt\`, \`Échap\`, les touches fléchées et (le cas échéant) les touches de fonction \`F1\`-\`F12\`. Sont également exemptées \`Espace\`, \`Entrée\`, \`Retour\`, \`Tab\` et la touche \`Suppr\`.
3. Maintenir la touche \`Maj\` et appuyer à nouveau sur les mêmes touches.
4. Vérifier si une fonction a été déclenchée par l'appui sur les touches`,

  G133: `Fournir, sur la première page d'un formulaire en plusieurs parties, une case à cocher permettant à l'utilisateur de demander une limite de temps de session plus longue ou l'absence de limite de temps de session

Procédure
1. Vérifier qu'une case à cocher est disponible sur la première page du formulaire et permet à l'utilisateur de demander une limite de temps de session plus longue.
2. Vérifier que la case à cocher est clairement étiquetée.
3. Vérifier que, lorsque la case est cochée, la limite de temps de session est prolongée ou supprimée.`,
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
  `Lot 007 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
