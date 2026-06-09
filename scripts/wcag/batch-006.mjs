// Lot de traduction FR 006. Usage : node scripts/wcag/batch-006.mjs
import { readFileSync, writeFileSync } from "node:fs";

const reflow = `Procédure
1. Afficher la page web dans un agent utilisateur capable d'un zoom à 400 % et régler les dimensions de la zone d'affichage (en pixels CSS) à 1280 de large et 1024 de haut.
2. Zoomer à 400 %.
3. Pour le contenu lu horizontalement, vérifier que tout le contenu et toutes les fonctionnalités sont disponibles sans défilement horizontal.
4. Pour le contenu lu verticalement, vérifier que tout le contenu et toutes les fonctionnalités sont disponibles sans défilement vertical.

Remarque : si le navigateur n'est pas capable de zoomer à 400 %, vous pouvez réduire proportionnellement la largeur du navigateur. Par exemple, à 300 % de zoom, la zone d'affichage devrait faire 960 px de large.`;

const fr = {
  G170: `Fournir, près du début de la page web, un contrôle qui désactive les sons diffusés automatiquement

Procédure
1. Charger une page web.
2. Vérifier la présence de musique ou de sons qui démarrent automatiquement.
3. Vérifier qu'un contrôle permettant à l'utilisateur de désactiver les sons est fourni près du début de la page.`,

  G171: `Ne diffuser des sons qu'à la demande de l'utilisateur

Procédure
1. Charger une page web connue pour contenir des sons qui durent 3 secondes ou plus.
2. Vérifier qu'aucun son ne se diffuse automatiquement.
3. Vérifier qu'il existe un moyen pour l'utilisateur de démarrer les sons manuellement.`,

  F23: `Échec du critère de succès 1.4.2 dû à la diffusion d'un son de plus de 3 secondes sans mécanisme pour le couper

Procédure
1. Vérifier qu'il existe un mécanisme, indépendant du contrôle de volume global du système, permettant de couper tout son diffusé automatiquement pendant plus de trois secondes.`,

  F93: `Échec du critère de succès 1.4.2 dû à l'absence d'un moyen de mettre en pause ou d'arrêter un élément média HTML5 qui se lit automatiquement

Procédure
1. Vérifier si un élément \`audio\` ou \`video\` possède une piste audio active.
2. Vérifier si l'audio ou la vidéo dure plus de 3 secondes.
3. Vérifier si l'élément possède un attribut \`autoplay\`.
4. Vérifier si l'élément ne possède pas d'attribut \`muted\`.
5. Vérifier qu'aucune commande ou contrôle n'a été fourni pour arrêter ou mettre en pause l'élément média.`,

  G18: `Garantir un rapport de contraste d'au moins 4,5:1 entre le texte (et les images de texte) et l'arrière-plan situé derrière le texte

Procédure
1. Mesurer la luminance relative de chaque lettre (sauf si elles sont toutes uniformes) au moyen de la formule : L = 0,2126 × R + 0,7152 × G + 0,0722 × B.
2. Mesurer la luminance relative des pixels d'arrière-plan immédiatement adjacents à la lettre au moyen de la même formule.
3. Calculer le rapport de contraste au moyen de la formule (L1 + 0,05) / (L2 + 0,05), où L1 est la luminance relative de la plus claire des couleurs de premier plan ou d'arrière-plan, et L2 la luminance relative de la plus sombre.
4. Vérifier que le rapport de contraste est égal ou supérieur à 4,5:1.`,

  G148: `Ne pas spécifier de couleur d'arrière-plan, ne pas spécifier de couleur de texte, et ne pas utiliser de fonctionnalités de la technologie qui modifient ces valeurs par défaut

Procédure
1. Regarder à tous les endroits où la couleur du texte peut être spécifiée
2. Vérifier que la couleur du texte n'est pas spécifiée
3. Regarder à tous les endroits où une couleur d'arrière-plan ou une image utilisée comme arrière-plan peut être spécifiée
4. Vérifier qu'aucune couleur d'arrière-plan ni image utilisée comme arrière-plan n'est spécifiée`,

  G174: `Fournir un contrôle, doté d'un rapport de contraste suffisant, permettant à l'utilisateur de basculer vers une présentation à contraste suffisant

Procédure
1. Vérifier qu'un lien ou un contrôle existe sur la page d'origine et donne accès à la version alternative.
2. Vérifier que ce lien ou contrôle sur la page d'origine est conforme à tous les critères de succès du niveau de conformité testé.
3. Vérifier que la version alternative satisfait le contraste et tous les autres critères de succès du niveau de conformité testé.`,

  G145: `Garantir un rapport de contraste d'au moins 3:1 entre le texte (et les images de texte) et l'arrière-plan situé derrière le texte

Procédure
1. Mesurer la luminance relative de chaque lettre (sauf si elles sont toutes uniformes) au moyen de la formule : L = 0,2126 × R + 0,7152 × G + 0,0722 × B.
2. Mesurer la luminance relative des pixels d'arrière-plan immédiatement adjacents à la lettre au moyen de la même formule.
3. Calculer le rapport de contraste au moyen de la formule (L1 + 0,05) / (L2 + 0,05), où L1 est la luminance relative de la plus claire des couleurs de premier plan ou d'arrière-plan, et L2 la luminance relative de la plus sombre.
4. Vérifier que le rapport de contraste est égal ou supérieur à 3:1.`,

  F24: `Échec des critères de succès 1.4.3, 1.4.6 et 1.4.8 dû à la spécification des couleurs de premier plan sans spécifier les couleurs d'arrière-plan, ou inversement

Procédure
1. Examiner le code de la page web.
2. Vérifier si une couleur de premier plan spécifiée par l'auteur est présente
3. Vérifier si une couleur d'arrière-plan spécifiée par l'auteur est présente`,

  F83: `Échec des critères de succès 1.4.3 et 1.4.6 dû à l'utilisation d'images d'arrière-plan qui ne fournissent pas un contraste suffisant avec le texte de premier plan (ou les images de texte)

Procédure
1. **Vérification rapide :** effectuer d'abord une vérification rapide pour voir si le contraste entre le texte et la zone la plus sombre de l'image (pour du texte sombre) ou la plus claire (pour du texte clair) atteint ou dépasse celui requis par le critère de succès (1.4.3 Contraste (minimum) ou 1.4.6 Contraste (amélioré)). Si le contraste atteint ou dépasse le contraste spécifié, alors il n'y a pas d'échec.
2. Si la vérification rapide est fausse, vérifier alors si l'arrière-plan situé derrière chaque lettre présente un contraste suffisant avec la lettre.`,

  G142: `Utiliser une technologie disposant d'agents utilisateurs couramment disponibles qui prennent en charge le zoom

Procédure
1. Afficher le contenu dans un agent utilisateur
2. Zoomer le contenu à 200 %
3. Vérifier si tout le contenu et toutes les fonctionnalités sont disponibles`,

  C28: `Spécifier la taille des conteneurs de texte au moyen d'unités em

Procédure
* Identifier les conteneurs qui contiennent du texte ou permettent la saisie de texte.
* Vérifier que la largeur et/ou la hauteur du conteneur sont spécifiées en unités \`em\`.`,

  C12: `Utiliser des pourcentages pour les tailles de police

Procédure
1. Vérifier que la valeur de la propriété CSS qui définit la taille de police est un pourcentage.`,

  C13: `Utiliser des tailles de police nommées

Procédure
1. Vérifier que la valeur de la propriété CSS qui définit la taille de police est l'une des suivantes : \`xx-small\`, \`x-small\`, \`small\`, \`medium\`, \`large\`, \`x-large\`, \`xx-large\`, \`smaller\` ou \`larger\`.`,

  C14: `Utiliser des unités em pour les tailles de police

Procédure
1. Vérifier que la valeur de la propriété CSS qui définit la taille de police est exprimée en unités em.`,

  SCR34: `Calculer la taille et la position d'une manière qui s'adapte à la taille du texte

Procédure
1. Ouvrir une page conçue pour ajuster la taille des conteneurs lorsque la taille du texte change.
2. Augmenter la taille du texte jusqu'à 200 % au moyen du réglage de taille de texte du navigateur (et non de la fonction de zoom).
3. Examiner le texte pour s'assurer que la taille du conteneur de texte s'ajuste afin d'accueillir la taille du texte.
4. S'assurer qu'aucun texte n'est « coupé » ni n'a disparu à la suite de l'augmentation de la taille du texte.`,

  G146: `Utiliser une mise en page fluide (liquid layout)

Procédure
1. Afficher le contenu dans un agent utilisateur.
2. Augmenter la taille du texte à 200 %.
3. Vérifier si tout le contenu et toutes les fonctionnalités sont disponibles sans défilement horizontal.`,

  G178: `Fournir sur la page web des contrôles permettant à l'utilisateur d'augmenter progressivement la taille de tout le texte de la page jusqu'à 200 %

Procédure
1. Régler la taille de la zone d'affichage à 1024 px par 768 px ou plus.
2. Augmenter la taille du texte et vérifier si elle a bien augmenté.
3. Vérifier que la taille du texte peut être augmentée jusqu'à 200 % de la taille d'origine.
4. Vérifier qu'après avoir augmenté la taille du texte à 200 % de la taille d'origine, il n'y a pas de perte de contenu ou de fonctionnalité (par ex. aucune partie du texte n'est coupée, les boîtes ne se chevauchent pas, les contrôles ne sont pas masqués ni séparés de leurs étiquettes, etc.).
5. Ramener la taille du texte à sa valeur par défaut et vérifier qu'elle est effectivement revenue à la taille par défaut.`,

  G179: `Garantir l'absence de perte de contenu ou de fonctionnalité lorsque le texte est redimensionné et que les conteneurs de texte ne changent pas de largeur

Procédure
1. Augmenter la taille du texte à 200 %.
2. Vérifier si tout le contenu et toutes les fonctionnalités sont disponibles.`,

  F69: `Échec du critère de succès 1.4.4 lorsque le redimensionnement du texte rendu visuellement jusqu'à 200 % provoque le rognage, la troncature ou le masquage du texte, des images ou des contrôles

Procédure
1. Augmenter de 200 % la taille du texte du contenu.
2. Vérifier qu'aucun texte n'est rogné, tronqué ou masqué.`,

  F80: `Échec du critère de succès 1.4.4 lorsque les champs de formulaire textuels ne se redimensionnent pas alors que le texte rendu visuellement est redimensionné jusqu'à 200 %

Procédure
1. Saisir du texte dans les champs de formulaire textuels qui reçoivent du texte saisi par l'utilisateur.
2. Augmenter de 200 % la taille du texte du contenu.
3. Vérifier que le texte des champs de formulaire textuels a augmenté de 200 %.`,

  F94: `Échec du critère de succès 1.4.4 dû à une utilisation incorrecte des unités de zone d'affichage (viewport units) pour redimensionner le texte

Procédure
1. Visiter la page à tester.
2. Utiliser l'une des méthodes suivantes pour redimensionner le texte, lorsqu'elle est disponible :
   * la fonction de zoom du navigateur,
   * la fonction de redimensionnement du texte du navigateur,
   * des contrôles présents sur la page pour redimensionner le texte.
3. Vérifier que le texte se redimensionne par l'une des méthodes ci-dessus, et qu'il peut être redimensionné jusqu'à 200 % de la taille par défaut.`,

  C22: `Utiliser CSS pour contrôler la présentation visuelle du texte

Procédure
1. Vérifier si des propriétés CSS ont été utilisées pour contrôler la présentation visuelle du texte`,

  C30: `Utiliser CSS pour remplacer le texte par des images de texte et fournir des contrôles d'interface pour basculer

Procédure
1. Vérifier que la page web comporte un contrôle permettant à l'utilisateur de sélectionner une présentation alternative.
2. Vérifier que, lorsque le contrôle est activé, la page obtenue comporte du texte (texte déterminé par programmation) partout où des images de texte avaient été utilisées.`,

  PDF7: `Effectuer une reconnaissance optique de caractères (OCR) sur un document PDF numérisé pour fournir du vrai texte

Procédure
1. Pour chaque page convertie en texte par OCR, s'assurer que le PDF obtenu a été converti correctement, de l'une des manières suivantes :
   1. Lire le document PDF avec un lecteur d'écran ou un outil de lecture à voix haute, en écoutant si tout le texte est lu correctement et dans le bon ordre de lecture.
   2. Enregistrer le document en texte et vérifier que le texte converti est complet et dans le bon ordre de lecture.
   3. Utiliser un outil capable d'afficher le contenu converti pour ouvrir le document PDF et vérifier que tout le texte a été converti et est dans le bon ordre de lecture.
   4. Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que tout le texte a été converti et est dans le bon ordre de lecture.`,

  C32: `Utiliser les media queries et le CSS grid pour redistribuer les colonnes

${reflow}`,

  C31: `Utiliser CSS Flexbox pour redistribuer le contenu

${reflow}`,

  C33: `Permettre la redistribution (reflow) des URL longues et des chaînes de texte

Pour les chaînes de texte plus larges que 320 px, vérifier :

${reflow}`,
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
  `Lot 006 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
