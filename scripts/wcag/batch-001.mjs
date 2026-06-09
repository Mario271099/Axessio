// Lot de traduction FR 001 — applique les traductions puis régénère la
// migration. Usage : node scripts/wcag/batch-001.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  G94: `Fournir une alternative textuelle courte pour le contenu non textuel, qui remplit la même fonction et présente la même information que ce contenu

Procédure
1. Supprimer, masquer ou cacher le contenu non textuel
2. Le remplacer par l'alternative textuelle
3. Vérifier que rien n'est perdu (l'alternative textuelle remplit la fonction du contenu non textuel)
4. Si le contenu non textuel contient des mots importants pour la compréhension du contenu, ces mots sont inclus dans l'alternative textuelle
Résultats attendus
- La vérification n°3 est vraie. Si le contenu non textuel contient des mots importants pour la compréhension du contenu, la vérification n°4 est également vraie`,

  G95: `Fournir des alternatives textuelles courtes qui donnent une brève description du contenu non textuel

Procédure
1. Vérifier la présence d'une alternative textuelle courte qui donne une brève description du contenu non textuel.
Résultats attendus
- La vérification n°1 est vraie.`,

  G82: `Fournir une alternative textuelle qui identifie la fonction d'un contenu non textuel interactif

Procédure
1. Supprimer, masquer ou cacher le contenu non textuel.
2. Le remplacer par l'alternative textuelle.
3. Vérifier que la fonction du contenu non textuel est claire — même si la fonctionnalité est perdue.
Résultats attendus
- La n°3 est vraie.`,

  G68: `Fournir une alternative textuelle courte qui décrit la fonction d'un contenu en direct audio-seul ou vidéo-seul

Procédure
1. Supprimer, masquer ou cacher le contenu non textuel.
2. Afficher la ou les alternatives textuelles courtes.
3. Vérifier que la fonction du contenu non textuel est claire, même si le contenu est perdu.
Résultats attendus
- La n°3 est vraie.`,

  G100: `Fournir une alternative textuelle courte qui est le nom accepté ou un nom descriptif du contenu non textuel

Procédure
1. Vérifier que l'alternative textuelle courte fournit un nom descriptif.
2. Vérifier que l'alternative textuelle courte fournit un nom qui a déjà été donné au contenu non textuel par l'auteur ou par quelqu'un d'autre.
Résultats attendus
- La n°1 ou la n°2 est vraie`,

  G143: `Fournir une alternative textuelle qui décrit la fonction du CAPTCHA

Procédure
1. Supprimer, masquer ou cacher le CAPTCHA.
2. Le remplacer par l'alternative textuelle.
3. Vérifier que l'alternative textuelle décrit la fonction du CAPTCHA.
Résultats attendus
- La vérification n°3 est vraie.`,

  G144: `S'assurer que la page web contient un autre CAPTCHA remplissant la même fonction au moyen d'une modalité différente

Procédure
Pour chaque CAPTCHA d'une page web
1. Vérifier que la page web contient un autre CAPTCHA pour la même fonction mais utilisant une modalité différente.
Résultats attendus
- La vérification n°1 est vraie.`,

  G196: `Utiliser une alternative textuelle sur un seul élément d'un groupe d'images, qui décrit tous les éléments du groupe

Procédure
1. Vérifier qu'un élément du groupe comporte une alternative textuelle qui remplit la fonction équivalente pour l'ensemble du groupe.
2. Vérifier que les autres éléments du groupe sont balisés de manière à pouvoir être ignorés par les technologies d'assistance.
3. Vérifier que les éléments balisés de manière à être ignorés par les technologies d'assistance sont adjacents à l'élément qui contient l'alternative textuelle du groupe.
Résultats attendus
- Toutes les vérifications ci-dessus sont vraies.`,

  G73: `Fournir une description détaillée à un autre emplacement, avec un lien vers celle-ci immédiatement adjacent au contenu non textuel

Procédure
1. Vérifier la présence d'un lien immédiatement avant ou après le contenu non textuel
2. Vérifier que le lien est valide et pointe directement vers la description détaillée de ce contenu non textuel précis.
3. Vérifier que la description détaillée véhicule la même information que le contenu non textuel
4. Vérifier la disponibilité d'un lien ou d'une fonction de retour permettant à l'utilisateur de revenir à l'emplacement d'origine du contenu non textuel
Résultats attendus
Les 4 points ci-dessus sont vrais`,

  G74: `Fournir une description détaillée dans le texte à proximité du contenu non textuel, avec une référence à l'emplacement de la description détaillée dans la description courte

Procédure
1. Vérifier que l'alternative textuelle courte indique l'emplacement de la description détaillée
2. Vérifier que la description détaillée se trouve à proximité du contenu non textuel, visuellement et dans l'ordre de lecture linéaire
3. Vérifier que la description détaillée véhicule la même information que le contenu non textuel
Résultats attendus
Les 3 points ci-dessus sont vrais`,

  G92: `Fournir une description détaillée pour le contenu non textuel, qui remplit la même fonction et présente la même information

Procédure
1. Supprimer, masquer ou cacher le contenu non textuel
2. Afficher la description détaillée
3. Vérifier que la description détaillée véhicule la même information que celle véhiculée par le contenu non textuel.
Résultats attendus
- La n°3 est vraie.`,

  ARIA6: `Utiliser aria-label pour fournir des étiquettes aux objets

Procédure
Pour chaque élément possédant un attribut \`aria-label\`.
1. Examiner si la description textuelle étiquette correctement l'objet, décrit sa fonction ou fournit une information équivalente.
Résultats attendus
- La n°1 est vraie.`,

  ARIA9: `Utiliser aria-labelledby pour concaténer une étiquette à partir de plusieurs nœuds de texte

Procédure
Pour les champs de saisie qui utilisent \`aria-labelledby\` :
1. Vérifier que les \`id\` référencés dans \`aria-labelledby\` sont uniques et correspondent aux \`id\` des nœuds de texte qui, ensemble, fournissent l'étiquette
2. Vérifier que le contenu concaténé des éléments référencés par \`aria-labelledby\` est descriptif de la fonction ou du rôle de l'élément étiqueté
Résultats attendus
- Les n°1 et n°2 sont vraies.
  S'il s'agit d'une technique suffisante pour un critère de succès, l'échec de cette procédure de test ne signifie pas nécessairement que le critère de succès n'est pas satisfait d'une autre manière, mais seulement que cette technique n'a pas été implémentée avec succès et ne peut pas servir à revendiquer la conformité.`,

  ARIA10: `Utiliser aria-labelledby pour fournir une alternative textuelle à un contenu non textuel

Procédure
1. Examiner chaque élément possédant l'attribut \`aria-labelledby\` et ne prenant pas en charge l'attribut \`alt\`.
2. Vérifier que la valeur de l'attribut \`aria-labelledby\` correspond à l'\`id\` d'un élément présent dans la page web.
3. Déterminer que le texte de l'élément identifié par l'attribut \`aria-labelledby\` étiquette correctement l'élément, décrit sa fonction ou fournit une information équivalente.
Résultats attendus
- Les n°2 et n°3 sont vraies.`,

  ARIA15: `Utiliser aria-describedby pour fournir des descriptions d'images

Procédure
1. Examiner chaque élément image possédant un attribut \`aria-describedby\`.
2. Examiner si l'attribut \`aria-describedby\` associe par programmation un élément à sa description textuelle, via l'attribut \`id\` de l'élément où se trouve le texte servant de description.
3. Examiner si l'alternative textuelle combinée et la description textuelle associée décrivent correctement l'objet ou en fournissent la fonction équivalente.
Résultats attendus
- Les n°1, n°2 et n°3 sont vraies.`,

  H2: `Combiner des liens image et texte adjacents pointant vers la même ressource

Procédure
Pour chaque élément \`a\` appliquant cette technique :
1. Vérifier que chaque élément \`img\` contenu dans l'élément \`a\` possède une valeur nulle pour son attribut \`alt\`.
2. Vérifier que l'élément \`a\` contient un élément \`img\` dont l'attribut \`alt\` est soit nul, soit d'une valeur qui complète le texte du lien et décrit l'image
Résultats attendus
- Toutes les vérifications ci-dessus sont vraies.`,

  H24: `Fournir des alternatives textuelles aux éléments area des images réactives (image maps)

Procédure
Pour chaque élément \`area\` d'une image réactive :
1. Vérifier que l'élément \`area\` possède un attribut \`alt\`.
2. Vérifier que l'alternative textuelle spécifiée par l'attribut \`alt\` remplit la même fonction que la partie de l'image réactive référencée par l'élément \`area\`.
Résultats attendus
- Les vérifications ci-dessus sont vraies.`,

  H30: `Fournir un texte de lien qui décrit la fonction d'un lien pour les éléments d'ancre

Procédure
Pour chaque lien du contenu qui utilise cette technique :
1. Vérifier qu'un texte ou une alternative textuelle au contenu non textuel est inclus dans l'élément \`a\`.
2. Si un élément \`img\` est l'unique contenu de l'élément \`a\`, vérifier que son alternative textuelle décrit la fonction du lien.
3. Si l'élément \`a\` contient un ou plusieurs éléments \`img\` et que l'alternative textuelle de ces \`img\` est vide, vérifier que le texte du lien décrit la fonction du lien.
4. Si l'élément \`a\` ne contient que du texte, vérifier que ce texte décrit la fonction du lien.
Résultats attendus
- Les vérifications ci-dessus sont vraies.`,

  H36: `Utiliser les attributs alt sur les images utilisées comme boutons d'envoi

Procédure
1. Pour tous les éléments \`input\` ayant un attribut type de valeur \`image\`, vérifier la présence d'un attribut \`alt\`.
2. Vérifier que la valeur de l'attribut \`alt\` décrit la fonction du bouton.
Résultats attendus
- Les n°1 et n°2 sont vraies`,

  H37: `Utiliser les attributs alt sur les éléments img

Procédure
1. Examiner chaque élément \`img\` du contenu.
2. Vérifier que chaque élément \`img\` porteur de sens contient un attribut \`alt\`.
3. Si l'image contient des mots importants pour la compréhension du contenu, ces mots sont inclus dans l'alternative textuelle.
Résultats attendus
Les vérifications n°2 et n°3 sont vraies.`,

  H44: `Utiliser les éléments label pour associer des étiquettes textuelles aux champs de formulaire

Procédure
Pour tous les éléments \`input\` de type \`text\`, \`file\` ou \`password\`, pour tous les éléments \`textarea\` et pour tous les éléments \`select\` de la page web :
1. Vérifier qu'il existe un élément \`label\` qui identifie la fonction du champ avant l'élément \`input\`, \`textarea\` ou \`select\`
2. Vérifier que l'attribut \`for\` de l'élément \`label\` correspond à l'\`id\` de l'élément \`input\`, \`textarea\` ou \`select\`.
3. Vérifier que l'élément \`label\` est visible.
Pour tous les éléments \`input\` de type checkbox ou radio de la page web :
1. Vérifier qu'il existe un élément \`label\` qui identifie la fonction du champ après l'élément \`input\`.
2. Vérifier que l'attribut \`for\` de l'élément \`label\` correspond à l'\`id\` de l'élément \`input\`.
3. Vérifier que l'élément \`label\` est visible.
Résultats attendus
- Les vérifications n°1 et n°2 sont vraies.
- Pour le critère de succès 3.3.2 (Étiquettes ou instructions), la vérification n°3 est également vraie.`,

  H53: `Utiliser le corps de l'élément object

Procédure
1. Vérifier que le corps de chaque élément \`object\` contient une alternative textuelle pour l'objet.
Résultats attendus
- La n°1 est vraie.`,
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
  `Lot 001 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
