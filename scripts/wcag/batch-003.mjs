// Lot de traduction FR 003. Usage : node scripts/wcag/batch-003.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  F74: `Échec des critères de succès 1.2.2 et 1.2.8 dû au fait de ne pas signaler comme tel un substitut média synchronisé à du texte

Procédure
1. Vérifier les pages qui fournissent des substituts média synchronisés à du texte.
2. Vérifier que le média synchronisé est clairement associé au texte dont il est le substitut.
Résultats attendus
- Si la vérification n°2 est fausse, alors cette condition d'échec s'applique et le contenu échoue à ces critères de succès.`,

  G69: `Fournir un substitut multimédia au contenu temporel

Procédure
1. Consulter la présentation média synchronisée tout en se référant au substitut multimédia au contenu temporel.
2. Vérifier que le dialogue du substitut correspond au dialogue de la présentation média synchronisée.
3. Vérifier que le substitut comporte des descriptions des sons.
4. Vérifier que le substitut comporte des descriptions du décor et de ses changements.
5. Vérifier que le substitut comporte des descriptions des actions et expressions des éventuels « acteurs » (personnes, animaux, etc.).
6. Si la ou les versions alternatives se trouvent sur une page distincte, vérifier la disponibilité de lien(s) permettant à l'utilisateur d'accéder aux autres versions.
Résultats attendus
- Les n°2, 3, 4 et 5 sont vraies.`,

  G58: `Placer un lien vers le substitut multimédia au contenu temporel immédiatement à côté du contenu non textuel

Procédure
1. Vérifier la présence d'un lien immédiatement avant ou après le contenu non textuel.
2. Vérifier qu'il s'agit d'un lien valide pointant directement vers le document collationné de ce média synchronisé précis.
3. Vérifier la disponibilité d'un lien ou d'une fonction de retour permettant à l'utilisateur de revenir à l'emplacement d'origine du contenu média synchronisé.
Résultats attendus
- Les points n°1 à 3 sont tous vrais.`,

  G78: `Fournir une seconde piste audio, sélectionnable par l'utilisateur, qui comprend des audiodescriptions

Procédure
1. Vérifier qu'il est possible d'activer la piste audio comprenant les audiodescriptions. Par exemple, au moyen d'un contrôle au sein même du contenu, ou en sélectionnant un contrôle ou une préférence dans le lecteur multimédia ou le système d'exploitation.
2. Écouter le média synchronisé
3. Vérifier si les silences dans le dialogue sont utilisés pour véhiculer une information importante relative au contenu visuel
Résultats attendus
- Les vérifications n°1 et n°3 sont vraies.`,

  G173: `Fournir une version d'un film avec audiodescriptions

Procédure
1. Ouvrir la version du média qui comprend l'audiodescription.
2. Visionner le film.
3. Vérifier si les silences dans le dialogue sont utilisés pour véhiculer une information importante relative au contenu visuel.
4. Si la ou les versions alternatives se trouvent sur une page distincte, vérifier la disponibilité de lien(s) permettant à l'utilisateur d'accéder aux autres versions.
Résultats attendus
- Les n°3 et n°4 sont vraies.`,

  SM6: `Fournir une audiodescription en SMIL 1.0

Procédure
1. Trouver la méthode pour activer l'audiodescription depuis le contenu/lecteur (sauf si elle est toujours diffusée par défaut)
2. Lire le fichier avec l'audiodescription
3. Vérifier si l'audiodescription est diffusée
Résultats attendus
- La n°3 est vraie`,

  SM7: `Fournir une audiodescription en SMIL 2.0

Procédure
1. Trouver la méthode pour activer l'audiodescription depuis le contenu/lecteur (sauf si elle est toujours diffusée par défaut)
2. Lire le fichier avec l'audiodescription
3. Vérifier si l'audiodescription est diffusée
Résultats attendus
- La n°3 est vraie`,

  G226: `Fournir des audiodescriptions en intégrant la narration dans la bande-son

Procédure
1. Ouvrir le média synchronisé qui comprend l'audiodescription.
2. Visionner la vidéo.
3. Vérifier si la narration principale est utilisée pour véhiculer l'information importante du contenu visuel, comme les nouveaux intervenants et le texte à l'écran.
4. Lorsqu'une information visuelle importante n'est pas véhiculée par la bande-son ni traitée dans la narration d'origine, vérifier si une narration supplémentaire a été ajoutée dans les silences disponibles du dialogue.
Résultats attendus
- Les n°3 et n°4 sont vraies.`,

  G8: `Fournir un film avec audiodescriptions étendues

Procédure
1. Ouvrir la version du film qui comprend les audiodescriptions étendues.
2. Vérifier que la vidéo se met en pause pour l'audiodescription étendue lorsqu'il n'y a pas assez d'espace pour insérer la narration nécessaire entre les dialogues naturels.
3. Vérifier que l'information nécessaire figure dans l'audiodescription.
4. Si la ou les versions alternatives se trouvent sur une page distincte, vérifier la disponibilité de lien(s) permettant à l'utilisateur d'accéder aux autres versions.
Résultats attendus
- Les vérifications n°2, n°3 et n°4 sont vraies.`,

  SM1: `Ajouter une audiodescription étendue en SMIL 1.0

Procédure
1. Lire le fichier avec les audiodescriptions étendues
2. Lire le fichier avec l'audiodescription
3. Vérifier si la vidéo se fige par moments et diffuse l'audiodescription étendue
Résultats attendus
- La n°3 est vraie`,

  SM2: `Ajouter une audiodescription étendue en SMIL 2.0

Procédure
1. Lire le fichier avec l'audiodescription étendue
2. Vérifier si la vidéo se fige par moments et diffuse l'audiodescription étendue
Résultats attendus
- La n°2 est vraie`,

  G203: `Utiliser une alternative textuelle statique pour décrire une vidéo de type « tête parlante »

Procédure
1. Vérifier qu'il n'y a pas d'information temporelle importante dans la piste vidéo
2. Vérifier que la description associée par programmation au média contient tout élément de contexte du contenu qui n'est pas présent dans la piste audio (par ex. identification de l'intervenant, générique, contexte)
Résultats attendus
- Toutes les vérifications sont vraies.`,

  G9: `Créer des sous-titres pour un média synchronisé en direct

Procédure
1. Vérifier qu'une procédure et une politique sont en place pour garantir que les sous-titres sont fournis en temps réel.
Résultats attendus
- La vérification n°1 est vraie.`,

  F113: `Échec du critère de succès 1.2.5 dû au fait de ne pas utiliser les pauses disponibles dans le dialogue pour fournir des audiodescriptions du contenu visuel important

Procédure
Pour chaque occurrence de média synchronisé contenant de l'audio et de la vidéo, où l'ensemble de l'information visuelle importante ne peut être compris à partir de la seule bande-son principale :
1. Vérifier que toute l'information visuelle importante manquante a été véhiculée dans les audiodescriptions.
2. Vérifier qu'il ne reste aucune pause dans le dialogue où il serait approprié d'ajouter des audiodescriptions.
Résultats attendus
- Si les vérifications 1 et 2 sont fausses, alors cette condition d'échec s'applique et le contenu échoue au critère de succès.`,

  ARIA11: `Utiliser les points de repère ARIA pour identifier les régions d'une page

Procédure
1. Identifier les régions principales de la page web.
2. Vérifier que chaque région principale possède un rôle de point de repère ARIA approprié.
3. Vérifier que les points de repère sont correctement étiquetés.`,

  H101: `Utiliser les éléments HTML sémantiques pour identifier les régions d'une page

Procédure
1. Examiner chaque élément HTML qui crée un rôle de point de repère.
2. Examiner si le bon élément a été utilisé pour baliser le contenu. Par exemple : un élément \`nav\` a été utilisé pour baliser une section de liens de navigation, ou l'élément \`main\` est utilisé pour contenir le contenu principal de la page.
3. Si une région de point de repère doit avoir un nom accessible pour être exposée comme point de repère, vérifier qu'un nom accessible est présent.`,

  ARIA12: `Utiliser role=heading pour identifier les titres

Procédure
1. Examiner chaque élément possédant l'attribut \`role="heading"\`.
2. Déterminer si le contenu de l'élément est approprié en tant que titre.
3. Déterminer si la valeur de \`aria-level\` correspond au niveau hiérarchique approprié.`,

  ARIA13: `Utiliser aria-labelledby pour nommer les régions et points de repère

Procédure
1. Examiner chaque élément possédant l'attribut role=region ou un rôle de point de repère, et possédant également un attribut aria-labelledby.
2. Vérifier que la valeur de l'attribut aria-labelledby correspond à l'id d'un élément de la page.
3. Vérifier que le texte de l'élément portant cet id étiquette correctement la section de la page.`,

  ARIA16: `Utiliser aria-labelledby pour fournir un nom aux composants d'interface

Procédure
Pour chaque composant d'interface possédant un attribut \`aria-labelledby\` :

1. Vérifier que la valeur de l'attribut \`aria-labelledby\` correspond à l'\`id\` d'un élément, ou à une liste d'\`id\` séparés par des espaces, présents dans la page web.
2. Vérifier que le texte du ou des éléments référencés étiquette correctement le composant d'interface.`,

  ARIA17: `Utiliser les rôles de regroupement pour identifier des champs de formulaire liés

Procédure
Pour les groupes de champs liés où les étiquettes individuelles de chaque champ ne fournissent pas une description suffisante et où une description supplémentaire au niveau du groupe est nécessaire :
1. Vérifier que le groupe d'éléments input ou select logiquement liés est contenu dans un élément possédant role=group, ou role=radiogroup selon le type d'éléments que le groupe contient.
2. Vérifier que ce groupe possède un nom accessible défini au moyen d'aria-label ou d'aria-labelledby.`,

  ARIA20: `Utiliser le rôle region pour identifier une région de la page

Procédure
Pour chaque section balisée avec \`role="region"\` :
1. Examiner le contenu et s'assurer qu'il est suffisamment important pour justifier un point de repère indépendant
2. S'assurer qu'aucun rôle de point de repère standard n'est approprié pour ce contenu
3. Vérifier que la région possède un nom déterminé par programmation`,

  G115: `Utiliser les éléments sémantiques pour baliser la structure

Procédure
1. Vérifier s'il existe des parties du contenu ayant une fonction sémantique.
2. Pour chaque partie ayant une fonction sémantique, si un balisage sémantique correspondant existe dans la technologie, vérifier que le contenu a été balisé au moyen de ce balisage sémantique.`,

  H49: `Utiliser un balisage sémantique pour baliser le texte mis en valeur ou spécial

Procédure
1. Examiner le contenu à la recherche d'informations véhiculées par des variations de présentation du texte.
2. Vérifier qu'un balisage sémantique approprié (tel que \`em\`, \`strong\`, \`cite\`, \`blockquote\`, \`sub\` et \`sup\`) a été utilisé pour baliser le texte qui véhicule de l'information par des variations de présentation.`,

  G117: `Utiliser du texte pour véhiculer l'information transmise par les variations de présentation du texte

Procédure
1. Repérer les éléments où des variations de présentation du texte sont utilisées pour véhiculer de l'information.
2. Pour ces éléments, vérifier si l'information véhiculée visuellement est aussi indiquée explicitement sous forme de texte.`,

  G140: `Séparer l'information et la structure de la présentation pour permettre différentes présentations

Procédure
1. Examiner l'encodage d'un document.
2. Vérifier que l'information structurelle et les fonctionnalités sont fournies explicitement et logiquement séparées de l'information de présentation.`,

  ARIA24: `Identifier sémantiquement une icône de police (font icon) avec role="img"

Procédure
Pour chaque icône de police, vérifier que :
1. L'élément fournissant l'icône de police possède \`role="img"\`.`,

  G138: `Utiliser un balisage sémantique à chaque fois que des indices de couleur sont utilisés

Procédure
Pour tout contenu où des différences de couleur sont utilisées pour véhiculer de l'information :
1. Vérifier que la même information est disponible au moyen d'un balisage sémantique.`,

  H51: `Utiliser le balisage de tableau pour présenter de l'information tabulaire

Procédure
1. Vérifier la présence d'information tabulaire.
2. Pour chaque occurrence d'information tabulaire :
  1. Vérifier qu'un balisage de tableau comportant au moins les éléments \`table\`, \`tr\`, \`th\` et \`td\` est utilisé.`,
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
  `Lot 003 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
