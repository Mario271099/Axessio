// Lot de traduction FR 009. Usage : node scripts/wcag/batch-009.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  G88: `Fournir des titres descriptifs aux pages web

Procédure
1. Vérifier que la page possède un titre.
2. Vérifier que le titre décrit le sujet ou la fonction de la page.
3. Vérifier que le titre est unique au sein du site.`,

  H25: `Fournir un titre au moyen de l'élément title

Procédure
1. Vérifier que le document HTML possède un élément \`title\` dans la section \`head\`.
2. Vérifier que le \`title\` décrit le sujet ou la fonction du document.
3. Vérifier que le \`title\` est unique au sein du site.`,

  PDF18: `Spécifier le titre du document au moyen de l'entrée /Title du dictionnaire d'informations d'un document PDF

Procédure
1. Ouvrir le document PDF dans Adobe Acrobat Pro.
2. Aller dans Fichier > Propriétés.
3. Vérifier qu'un titre descriptif est spécifié dans le champ Titre.
4. Vérifier que le document est configuré pour afficher le titre du document plutôt que le nom de fichier dans la barre de titre.`,

  F25: `Échec du critère de succès 2.4.2 dû au fait que le titre d'une page web n'identifie pas son contenu

Procédure
1. Vérifier si le titre de chaque page web identifie le contenu ou la fonction de la page.`,

  G59: `Placer les éléments interactifs dans un ordre qui suit les séquences et relations au sein du contenu

Procédure
1. Naviguer dans la page au clavier.
2. Vérifier que l'ordre dans lequel les éléments interactifs reçoivent le focus suit les séquences et relations au sein du contenu.`,

  SCR26: `Insérer le contenu dynamique dans le DOM immédiatement après son élément déclencheur

Procédure
1. Repérer toutes les zones de la page qui déclenchent des boîtes de dialogue qui ne sont pas des fenêtres surgissantes.
2. Vérifier que les boîtes de dialogue sont déclenchées par l'événement click d'un bouton ou d'un lien.
3. À l'aide d'un outil permettant d'inspecter le DOM généré par script, vérifier que la boîte de dialogue est l'élément suivant dans le DOM.`,

  H102: `Utiliser la navigation au curseur (caret browsing) pour tester l'ordre de tabulation et le focus

Procédure
1. Activer le mode de navigation au curseur dans le navigateur web.
2. Naviguer dans la page au moyen des touches fléchées.
3. Vérifier que le curseur se déplace dans le contenu selon un ordre qui suit l'ordre visuel et logique du contenu.`,

  SCR27: `Réordonner les sections de page au moyen du DOM

Procédure
1. Repérer tous les composants qui peuvent être réordonnés par glisser-déposer.
2. Vérifier qu'il existe aussi un mécanisme pour les réordonner au moyen de menus constitués de listes de liens.
3. Vérifier que les menus sont contenus dans les éléments réordonnables au sein du DOM.
4. Vérifier que les scripts de réorganisation ne sont déclenchés que par l'événement onclick des liens.
5. Vérifier que les éléments sont réordonnés dans le DOM, et pas seulement visuellement.`,

  F44: `Échec du critère de succès 2.4.3 dû à l'utilisation de tabindex pour créer un ordre de tabulation qui ne préserve pas le sens ni l'utilisabilité

Procédure
1. Si tabindex est utilisé, vérifier que l'ordre de tabulation spécifié par les attributs tabindex suit les relations au sein du contenu.`,

  F85: `Échec du critère de succès 2.4.3 dû à l'utilisation de boîtes de dialogue ou de menus qui ne sont pas adjacents à leur contrôle déclencheur dans l'ordre de navigation séquentielle

Procédure
Pour chaque menu ou boîte de dialogue d'une page web ouvert via un contrôle déclencheur :

1. Activer le contrôle déclencheur au clavier.
  * Vérifier si le focus a été placé sur le menu, la boîte de dialogue, ou un descendant focusable logique du composant.
  * Sinon, vérifier si avancer le focus une fois dans l'ordre de navigation séquentielle place le focus dans le menu ou la boîte de dialogue.
2. Fermer le menu ou la boîte de dialogue
  * Vérifier si le focus est sur le contrôle déclencheur.
  * Si le focus doit être placé sur un contrôle différent, vérifier si ce contrôle différent est logique.`,

  G91: `Fournir un texte de lien qui décrit la fonction du lien

Procédure
1. Vérifier que le texte du lien décrit la fonction du lien.
2. Vérifier que le texte du lien a du sens lorsqu'il est lu hors contexte.`,

  G189: `Fournir, près du début de la page web, un contrôle qui modifie le texte des liens

Procédure
1. Vérifier qu'un contrôle est fourni près du début de la page et modifie le texte des liens.
2. Activer le contrôle et vérifier que le texte des liens devient plus descriptif.`,

  SCR30: `Utiliser des scripts pour modifier le texte des liens

Procédure
1. Vérifier qu'il existe, près du début de la page, un lien permettant d'enrichir les liens
2. Vérifier que le lien identifié à l'étape 1 peut être identifié à partir de son seul texte
3. Repérer les liens de la page qui ne peuvent pas être identifiés à partir de leur seul texte
4. Activer le contrôle identifié à l'étape 1
5. Vérifier que la fonction des liens identifiés à l'étape 3 peut désormais être identifiée à partir de leur seul texte`,

  G53: `Identifier la fonction d'un lien au moyen du texte du lien combiné au texte de la phrase qui l'englobe

Procédure
1. Repérer les liens de la page dont la fonction n'est pas claire à partir du seul texte du lien.
2. Vérifier que la fonction de chacun de ces liens est claire lorsque le texte du lien est combiné au texte de la phrase qui l'englobe.`,

  H33: `Compléter le texte du lien au moyen de l'attribut title

Procédure
1. Vérifier que l'attribut \`title\` est présent sur les éléments \`a\` où une information supplémentaire est fournie.
2. Vérifier que la valeur de l'attribut \`title\` décrit la fonction du lien.`,

  C7: `Utiliser CSS pour masquer une partie du texte du lien

Procédure
1. Repérer les textes de lien qui comportent des parties masquées.
2. Vérifier que les parties masquées sont exposées aux technologies d'assistance.
3. Vérifier que le texte combiné visible et masqué décrit la fonction du lien.`,

  ARIA7: `Utiliser aria-labelledby pour la fonction d'un lien

Procédure
1. Repérer les liens qui utilisent \`aria-labelledby\`.
2. Vérifier que l'attribut \`aria-labelledby\` référence un ou plusieurs ID valides d'éléments de la page.
3. Vérifier que le texte combiné des éléments référencés décrit la fonction du lien.`,

  ARIA8: `Utiliser aria-label pour la fonction d'un lien

Procédure
1. Repérer les liens qui utilisent \`aria-label\`.
2. Vérifier que la valeur de l'attribut \`aria-label\` décrit la fonction du lien.`,

  H77: `Identifier la fonction d'un lien au moyen du texte du lien combiné à l'élément de liste qui l'englobe

Procédure
1. Repérer les liens situés dans des éléments de liste.
2. Vérifier que la fonction de chaque lien est claire lorsque le texte du lien est combiné au texte de l'élément de liste qui l'englobe.`,

  H78: `Identifier la fonction d'un lien au moyen du texte du lien combiné au paragraphe qui l'englobe

Procédure
1. Repérer les liens situés dans des paragraphes.
2. Vérifier que la fonction de chaque lien est claire lorsque le texte du lien est combiné au texte du paragraphe qui l'englobe.`,

  H79: `Identifier la fonction d'un lien dans un tableau de données au moyen du texte du lien combiné à la cellule de tableau qui l'englobe et à ses cellules d'en-tête associées

Procédure
1. Repérer les liens situés dans des tableaux de données.
2. Vérifier que la fonction de chaque lien est claire lorsque le texte du lien est combiné au texte de la cellule de tableau qui l'englobe et à ses cellules d'en-tête associées.`,

  H81: `Identifier la fonction d'un lien dans une liste imbriquée au moyen du texte du lien combiné à l'élément de liste parent sous lequel la liste est imbriquée

Procédure
1. Repérer les liens situés dans des listes imbriquées.
2. Vérifier que la fonction de chaque lien est claire lorsque le texte du lien est combiné au texte de l'élément de liste parent sous lequel la liste est imbriquée.`,

  PDF13: `Fournir un texte de remplacement au moyen de l'entrée /Alt pour les liens des documents PDF

Procédure
1. Ouvrir le document PDF dans Adobe Acrobat Pro.
2. Repérer les liens du document.
3. Vérifier que chaque lien possède une entrée /Alt qui décrit la fonction du lien.`,

  F63: `Échec du critère de succès 2.4.4 dû à la fourniture du contexte d'un lien uniquement dans un contenu non lié au lien

Procédure
Localiser les liens pour lesquels un contexte supplémentaire est nécessaire pour comprendre leur fonction. Pour chaque lien :

1. Vérifier si le contexte est contenu dans la même phrase, le même paragraphe, le même élément de liste, la même cellule de tableau ou les en-têtes de tableau associés.
2. Vérifier si le contexte du lien peut être déterminé par programmation d'une autre manière, par exemple en utilisant une propriété WAI-ARIA telle que \`aria-label\`, \`aria-labelledby\` ou \`aria-describedby\` sur le lien pour fournir un contexte suffisant`,

  F89: `Échec des critères de succès 2.4.4, 2.4.9 et 4.1.2 dû à l'absence de nom accessible pour une image qui constitue l'unique contenu d'un lien

Procédure
1. Vérifier si le lien ne contient qu'un contenu non textuel.
2. Vérifier si le contenu non textuel a été implémenté de manière à pouvoir être ignoré par les technologies d'assistance, par exemple au moyen de \`role="presentation"\` ou \`alt=""\`.
3. Vérifier que le lien ne possède pas de nom accessible fourni d'une autre manière, telle que \`aria-label\` ou \`aria-labelledby\`.`,

  G125: `Fournir des liens pour naviguer vers des pages web liées

Procédure
1. Vérifier que la page comporte des liens pour naviguer vers des pages web liées.
2. Vérifier que les liens sont clairement étiquetés.`,

  G64: `Fournir une table des matières

Procédure
1. Vérifier qu'une table des matières est fournie.
2. Vérifier que la table des matières comporte des liens vers chaque section principale du contenu.
3. Vérifier que la table des matières est organisée hiérarchiquement.`,

  G63: `Fournir un plan du site

Procédure
1. Vérifier qu'un plan du site est fourni.
2. Vérifier que le plan du site comporte des liens vers toutes les pages principales du site.
3. Vérifier que le plan du site est accessible depuis chaque page du site.`,
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
  `Lot 009 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
