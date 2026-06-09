// Lot de traduction FR 005. Usage : node scripts/wcag/batch-005.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  F92: `Échec du critère de succès 1.3.1 dû à l'utilisation de role="presentation" sur un contenu qui véhicule une information sémantique

Procédure
1. Vérifier si un élément véhicule de l'information, de la structure ou des relations via son balisage sémantique
2. L'élément possède l'attribut role="presentation".`,

  F111: `Échec des critères de succès 1.3.1, 2.5.3 et 4.1.2 dû à un composant doté d'un texte d'étiquette visible mais sans nom accessible

Procédure
Pour tous les composants dotés d'une étiquette visible (par ex. texte de lien, texte de bouton, étiquette liée par programmation, images dans des liens ou boutons avec texte, etc.), vérifier que :

1. Le composant possède une étiquette textuelle visible.
2. Le composant possède un nom accessible.
3. Le nom accessible contient le texte qui apparaît comme étiquette visible.`,

  G57: `Ordonner le contenu dans une séquence signifiante

Procédure
1. Linéariser le contenu au moyen d'une approche standard pour la technologie (par ex. en supprimant les styles de mise en page ou en exécutant un outil de linéarisation)
2. Vérifier si l'ordre du contenu conserve le même sens que l'original`,

  H34: `Utiliser une marque Unicode de droite à gauche (RLM) ou de gauche à droite (LRM) pour mélanger les directions de texte en ligne

Procédure
1. Examiner le code source aux endroits où le texte change de direction.
2. Lorsque le texte change de direction, vérifier si des caractères neutres tels que des espaces ou de la ponctuation se trouvent adjacents à du texte rendu dans la direction non par défaut.
3. Lorsque la vérification n°2 est vraie et que l'algorithme bidirectionnel HTML produirait un placement incorrect des caractères neutres, vérifier si les caractères neutres sont suivis de marques Unicode de droite à gauche ou de gauche à droite qui font que les caractères neutres sont placés comme faisant partie des caractères précédents.`,

  H56: `Utiliser l'attribut dir sur un élément en ligne pour résoudre les problèmes de séquences directionnelles imbriquées

Procédure
1. Examiner la direction du texte dans le document
2. Si la direction du texte est de droite à gauche, vérifier que, pour l'élément ancêtre possédant un attribut \`dir\`, cet attribut a la valeur \`"rtl"\`
3. Si la direction du texte est de gauche à droite, vérifier qu'il n'existe aucun élément ancêtre possédant un attribut \`dir\`, ou que, pour l'élément ancêtre possédant un attribut \`dir\`, cet attribut a la valeur \`"ltr"\``,

  C6: `Positionner le contenu en fonction du balisage structurel

Procédure
Pour le contenu qui utilise CSS pour le positionnement :
1. Supprimer l'information de style du document ou désactiver l'utilisation des feuilles de style dans l'agent utilisateur
2. Vérifier que les relations structurelles et le sens du contenu sont préservés.`,

  C8: `Utiliser la propriété CSS letter-spacing pour contrôler l'espacement à l'intérieur d'un mot

Procédure
Pour chaque mot qui semble avoir un espacement non standard entre les caractères :
1. Vérifier si la propriété CSS letter-spacing a été utilisée pour contrôler l'espacement.`,

  C27: `Faire correspondre l'ordre du DOM à l'ordre visuel

Procédure
1. Vérifier l'ordre du contenu dans le DOM.
2. Vérifier l'ordre visuel du contenu.
3. Vérifier que l'ordre du DOM correspond à l'ordre visuel.`,

  PDF3: `Garantir un ordre de tabulation et de lecture correct dans les documents PDF

Procédure
1. Ouvrir le document PDF dans Adobe Acrobat Pro.
2. Utiliser le clavier (touche Tab) pour naviguer dans le document.
3. Vérifier que l'ordre de tabulation suit l'ordre de lecture logique du document.`,

  F32: `Échec du critère de succès 1.3.2 dû à l'utilisation de caractères d'espacement pour contrôler l'espacement à l'intérieur d'un mot

Procédure
Pour chaque mot qui semble avoir un espacement non standard entre les caractères :
1. Vérifier si des mots du contenu textuel contiennent des caractères d'espacement.`,

  F49: `Échec du critère de succès 1.3.2 dû à l'utilisation d'un tableau de mise en page HTML qui n'a pas de sens une fois linéarisé

Procédure
1. Linéariser le contenu de l'une des manières suivantes :
  - Présenter le contenu dans l'ordre du code source
  - Supprimer le balisage de tableau autour du contenu
2. Vérifier que l'ordre de lecture linéaire correspond à toute séquence signifiante véhiculée par la présentation.`,

  F1: `Échec du critère de succès 1.3.2 dû à la modification du sens du contenu en positionnant l'information avec CSS

Procédure
Pour le contenu qui utilise CSS pour le positionnement :
1. Identifier les éléments de contenu qui utilisent CSS pour le positionnement.
2. Vérifier que l'ordre de lecture du contenu est correct et que le sens du contenu est préservé par rapport à la page ou au contexte environnant, au moyen de l'une des méthodes suivantes :
  - Inspection du code : examiner le code HTML pour déterminer la séquence de lecture logique.
  - Inspection de l'arbre d'accessibilité : examiner l'arbre d'accessibilité pour confirmer l'ordre de lecture.
  - Test avec technologie d'assistance : utiliser un lecteur d'écran pour vérifier comment le contenu est restitué à voix haute.
  - Test visuel sans positionnement CSS : supprimer les styles de positionnement et observer la séquence de lecture visuelle.`,

  G96: `Fournir une identification textuelle des éléments qui, autrement, ne reposent que sur une information sensorielle pour être compris

Procédure
Repérer dans la page web toutes les références à la forme, la taille ou la position d'un objet. Pour chacun de ces éléments :
1. Vérifier que la référence contient une information supplémentaire permettant de localiser et d'identifier l'élément sans aucune connaissance de sa forme, de sa taille ou de sa position relative.`,

  F14: `Échec du critère de succès 1.3.3 dû à l'identification d'un contenu uniquement par sa forme ou son emplacement

Procédure
1. Examiner la page web à la recherche de références textuelles à du contenu de la page.
2. Vérifier que ces références ne reposent pas uniquement sur la forme ou l'emplacement visuel du contenu.`,

  F26: `Échec du critère de succès 1.3.3 dû à l'utilisation d'un symbole graphique seul pour véhiculer de l'information

Procédure
Pour chaque instruction qui fait référence à des marques non textuelles véhiculant de l'information :
1. Vérifier s'il existe d'autres moyens de déterminer l'information véhiculée par ces marques non textuelles.`,

  G214: `Utiliser un contrôle pour permettre l'accès au contenu dans différentes orientations lorsque celui-ci est autrement restreint

Procédure
Pour un contenu qui ne change pas d'orientation lorsque l'appareil est tourné :
1. Vérifier la présence d'un contrôle dans l'interface utilisateur permettant de changer l'orientation du contenu.
2. Vérifier que, lorsque le contrôle est actionné, le contenu change d'orientation.`,

  F97: `Échec dû au verrouillage de l'orientation en mode paysage ou portrait

Procédure
1. Ouvrir le contenu en mode paysage. Vérifier que le contenu est orienté pour cet affichage.
2. Ouvrir le contenu en mode portrait. Vérifier que le contenu est orienté pour cet affichage.
3. Vérifier si l'affichage portrait ou paysage est essentiel à la consultation et au fonctionnement du contenu.
4. S'il existe des contrôles dans le contenu, l'agent utilisateur, le système d'exploitation ou l'appareil qui restreignent ou autorisent les changements d'orientation, vérifier que ces contrôles peuvent être réglés pour que les vérifications n°1 et n°2 soient vraies.`,

  F100: `Échec du critère de succès 1.3.4 dû à l'affichage d'un message demandant de réorienter l'appareil

Procédure
1. Ouvrir le contenu en mode paysage. Vérifier si un message apparaît demandant de réorienter l'appareil.
2. Ouvrir le contenu en mode portrait. Vérifier si un message apparaît demandant de réorienter l'appareil.
3. Vérifier si l'affichage portrait ou paysage est essentiel à la consultation et au fonctionnement du contenu.`,

  H98: `Utiliser les attributs HTML autocomplete

Procédure
Pour chaque champ de formulaire qui collecte une information sur l'utilisateur et correspond à un champ \`autocomplete\` décrit dans la section 7 de WCAG 2.1 (Fonctions de saisie pour les composants d'interface), vérifier ce qui suit :
1. Le champ de formulaire possède une paire attribut/valeur \`autocomplete\` valide et bien formée.
2. La fonction du champ de formulaire indiquée par l'étiquette correspond au jeton \`autocomplete\` du champ de saisie.`,

  F107: `Échec du critère de succès 1.3.5 dû à des valeurs d'attribut autocomplete incorrectes

Procédure
Pour chaque champ de formulaire qui collecte une information sur l'utilisateur du formulaire :
1. Vérifier que le champ de formulaire possède une paire attribut/valeur autocomplete qui ne correspond pas à la fonction du champ de saisie.
2. Vérifier que la fonction de saisie n'est pas communiquée par programmation par un autre moyen.`,

  G14: `Garantir que l'information véhiculée par les différences de couleur est aussi disponible sous forme de texte

Procédure
Pour chaque élément où une différence de couleur est utilisée pour véhiculer de l'information :

1. Vérifier que l'information véhiculée est aussi disponible sous forme de texte et que ce texte n'est pas du contenu conditionnel.`,

  G205: `Inclure un indice textuel pour les étiquettes de champ de formulaire colorées

Procédure
Pour tout contenu où des différences de couleur sont utilisées pour véhiculer de l'information :

1. Vérifier que la même information est disponible au moyen d'indices textuels ou de caractères.`,

  G182: `Garantir que des indices visuels supplémentaires sont disponibles lorsque des différences de couleur du texte sont utilisées pour véhiculer de l'information

Procédure
1. Localiser toutes les occurrences où la couleur du texte est utilisée pour véhiculer de l'information.
2. Vérifier que tout texte où la couleur est utilisée pour véhiculer de l'information est aussi stylé ou utilise une police qui le rend visuellement distinct du texte qui l'entoure.`,

  G183: `Utiliser un rapport de contraste de 3:1 avec le texte environnant et fournir des indices visuels supplémentaires au survol pour les liens ou contrôles identifiés par la seule couleur

Procédure
Pour chaque occurrence où la couleur est utilisée pour véhiculer une information à propos du texte :

1. Vérifier que la luminance relative de la couleur du texte diffère de la luminance relative du texte environnant selon un rapport de contraste d'au moins 3:1.
2. Vérifier que le survol du lien provoque une amélioration visuelle (telle qu'un soulignement, un changement de police, etc.).`,

  G111: `Utiliser la couleur et le motif

Procédure
Pour chaque image de la page web qui utilise des différences de couleur pour véhiculer de l'information :

1. Vérifier que toute information véhiculée par la couleur est aussi véhiculée au moyen de motifs ne reposant pas sur la couleur.`,

  F73: `Échec du critère de succès 1.4.1 dû à la création de liens qui ne sont pas visuellement évidents sans la vision des couleurs

Procédure
1. Vérifier que chaque lien de la page identifiable par la couleur (teinte) est aussi identifiable visuellement par un autre moyen (par ex. souligné, en gras, en italique, différence de clarté suffisante, etc.).`,

  F81: `Échec du critère de succès 1.4.1 dû à l'identification des champs obligatoires ou en erreur au moyen des seules différences de couleur

Procédure
Pour tous les champs obligatoires ou en erreur de la page web qui sont identifiés au moyen de différences de couleur :

1. Vérifier qu'un moyen non coloré d'identifier le champ obligatoire ou en erreur est fourni.`,

  G60: `Diffuser un son qui s'arrête automatiquement en moins de trois secondes

Procédure
1. Charger la page web
2. Vérifier que tout son diffusé automatiquement s'arrête en 3 secondes ou moins`,
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
  `Lot 005 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
