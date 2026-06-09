// Lot de traduction FR 002. Usage : node scripts/wcag/batch-002.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  H65: `Utiliser l'attribut title pour identifier les champs de formulaire lorsque l'élément label ne peut pas être utilisé

Procédure
Pour tous les champs de formulaire qui ne sont pas associés à un élément \`label\` :
1. Vérifier que le champ possède un attribut \`title\`
2. Vérifier que la fonction du champ est claire pour les utilisateurs qui peuvent voir le champ.
3. Vérifier que l'attribut \`title\` identifie la fonction du champ et qu'il correspond à la fonction visuelle apparente.
Résultats attendus
- Les vérifications ci-dessus sont vraies.`,

  H67: `Utiliser un attribut alt vide et aucun attribut title sur les éléments img pour les images que les technologies d'assistance doivent ignorer

Procédure
Pour chaque image qui doit être ignorée :
1. Vérifier que l'attribut \`title\` est soit absent, soit vide.
2. Vérifier que l'attribut \`alt\` est présent et vide.
Résultats attendus
- Les n°1 et n°2 sont vraies`,

  H86: `Fournir des alternatives textuelles pour les émojis, émoticônes, ASCII art et leetspeak

Procédure
1. Vérifier si le contenu comporte des émojis, des émoticônes, de l'ASCII art ou du leetspeak.
2. Vérifier que chaque émoji possède une alternative textuelle qui remplit une fonction équivalente.
3. Vérifier que chaque ASCII art, émoticône et/ou leetspeak, soit :
   1. est balisé comme une image avec une alternative textuelle qui remplit une fonction équivalente ; soit
   2. possède une alternative textuelle immédiatement avant ou après.
Résultats attendus
- Les vérifications n°2 et n°3 sont vraies.`,

  C9: `Utiliser CSS pour insérer les images décoratives

Procédure
1. Vérifier la présence d'images décoratives
2. Vérifier qu'elles sont insérées via CSS
Résultats attendus
- Si la n°1 est vraie, alors la n°2 est vraie.`,

  PDF1: `Appliquer des alternatives textuelles aux images au moyen de l'entrée Alt dans les documents PDF

Procédure
Pour toutes les images qui nécessitent des équivalents :
1. Vérifier que les images possèdent des entrées \`/Alt\` sur une balise englobante, par l'un des moyens suivants :
   - Lire le document PDF avec un lecteur d'écran, en écoutant si le texte équivalent est restitué lors du passage au tabulateur sur l'objet non textuel (s'il est atteignable au clavier) ou lors de la lecture du contenu ligne par ligne.
   - À l'aide d'un éditeur PDF, vérifier qu'une alternative textuelle s'affiche pour chaque image.
   - Utiliser un outil capable d'afficher la valeur de l'entrée \`/Alt\`, tel qu'aDesigner, pour ouvrir le document PDF et consulter le résumé de l'interface afin de lire les alternatives textuelles des images.
   - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que les images possèdent les équivalents textuels requis.
Résultats attendus
- La vérification n°1 est vraie.`,

  PDF4: `Masquer les images décoratives avec la balise Artifact dans les documents PDF

Procédure
1. Pour une image purement décorative, utiliser l'un des moyens suivants pour vérifier qu'elle est marquée comme artefact :
   - Lire le document PDF avec un lecteur d'écran, en écoutant si l'image décorative n'est pas annoncée lors de la lecture du contenu ligne par ligne.
   - À l'aide d'un éditeur PDF, s'assurer que l'image décorative est marquée comme artefact.
   - Redistribuer (reflow) le document et s'assurer que l'image décorative n'apparaît pas sur la page.
   - Utiliser un outil capable d'afficher l'entrée /Artifact ou la liste des propriétés, tel qu'aDesigner, pour ouvrir le document PDF et vérifier que les images décoratives sont marquées comme artefacts.
   - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que l'image décorative n'est pas exposée par l'API.
Résultats attendus
- La n°1 est vraie.`,

  F3: `Échec du critère de succès 1.1.1 dû à l'utilisation de CSS pour insérer des images véhiculant une information importante

Procédure
1. Examiner toutes les images ajoutées au contenu via CSS, via des attributs de style HTML, ou dynamiquement par script en tant qu'images d'arrière-plan.
2. Vérifier que les images ne véhiculent pas d'information importante.
3. Si une image véhicule bien une information importante, cette information est fournie aux technologies d'assistance et reste également disponible lorsque l'image CSS n'est pas affichée.

Résultats attendus
- Si les vérifications n°2 et n°3 sont toutes deux fausses, alors cette condition d'échec s'applique et le contenu échoue à ce critère de succès.`,

  F13: `Échec des critères de succès 1.1.1 et 1.4.1 dû à une alternative textuelle qui n'inclut pas l'information véhiculée par les différences de couleur dans l'image

Procédure
Pour toutes les images du contenu qui véhiculent de l'information au moyen de différences de couleur :
1. Vérifier que l'information véhiculée par les différences de couleur n'est pas incluse dans l'alternative textuelle de l'image.

Résultats attendus
- Si la vérification n°1 est vraie, alors cette condition d'échec s'applique et le contenu échoue au critère de succès.`,

  F20: `Échec des critères de succès 1.1.1 et 4.1.2 dû à la non-mise à jour des alternatives textuelles lorsque le contenu non textuel change

Procédure
1. Vérifier chaque alternative textuelle pour déterminer si elle décrit un contenu autre que le contenu non textuel actuellement affiché.

Résultats attendus
- Si la vérification n°1 est vraie, alors l'alternative textuelle n'est pas à jour avec l'élément courant, cette condition d'échec s'applique et le contenu échoue à ces critères de succès.`,

  F30: `Échec des critères de succès 1.1.1 et 1.2.1 dû à l'utilisation d'alternatives textuelles qui n'en sont pas (par ex. des noms de fichiers ou du texte indicatif)

Procédure
1. Vérifier chaque alternative textuelle pour déterminer si elle n'est pas réellement une alternative textuelle du contenu non textuel.

Résultats attendus
- Si la vérification n°1 est vraie, alors cette condition d'échec s'applique et le contenu échoue au critère de succès.`,

  F38: `Échec du critère de succès 1.1.1 dû au fait de ne pas baliser les images décoratives en HTML d'une manière qui permette aux technologies d'assistance de les ignorer

Procédure
Pour tout élément img utilisé pour un contenu purement décoratif :
1. Vérifier si l'élément n'a aucun attribut role, ou possède un attribut role dont la valeur n'est pas presentation.
2. Vérifier si l'élément n'a aucun attribut alt, ou possède un attribut alt dont la valeur n'est pas vide.

Résultats attendus
- Si les vérifications n°1 et n°2 sont vraies, cette condition d'échec s'applique et le contenu échoue au critère de succès.`,

  F39: `Échec du critère de succès 1.1.1 dû à une alternative textuelle non vide (par ex. alt="spacer" ou alt="image") pour des images qui devraient être ignorées par les technologies d'assistance

Procédure
1. Identifier les éléments img utilisés pour la décoration, l'espacement ou tout autre usage ne faisant pas partie du contenu signifiant de la page
2. Vérifier que l'attribut alt de ces éléments est vide.

Résultats attendus
- Si la vérification n°2 est fausse, cette condition d'échec s'applique et le contenu échoue au critère de succès.`,

  F65: `Échec du critère de succès 1.1.1 dû à l'omission de l'attribut alt ou d'une alternative textuelle sur les éléments img, area et input de type "image"

Procédure
Identifier les éléments img, area et input de type image. Pour chacun de ces éléments :
1. Vérifier si l'attribut alt est présent.
2. Vérifier si l'attribut aria-labelledby est présent ET référence un ou plusieurs attributs id de la page ET vérifier si aria-labelledby est pris en charge par l'accessibilité.
3. Vérifier si l'attribut aria-label est présent ET vérifier si aria-label est pris en charge par l'accessibilité.
4. Vérifier si l'attribut title est présent ET vérifier si title est pris en charge par l'accessibilité.

Résultats attendus
- Si toutes les vérifications n°1, n°2, n°3 et n°4 sont fausses, alors cette condition d'échec s'applique.`,

  F67: `Échec des critères de succès 1.1.1 et 1.2.1 dû à des descriptions détaillées de contenu non textuel qui ne remplissent pas la même fonction ou ne présentent pas la même information

Procédure
Pour tout contenu non textuel nécessitant une description détaillée
1. Vérifier que la description détaillée remplit la même fonction ou présente la même information que le contenu non textuel.

Résultats attendus
- Si la vérification n°1 est fausse, alors cette condition d'échec s'applique et le contenu échoue à ce critère de succès.`,

  F71: `Échec du critère de succès 1.1.1 dû à l'utilisation de caractères ressemblant à du texte pour représenter du texte sans fournir d'alternative textuelle

Procédure
1. Vérifier les caractères ou entités de caractères utilisés pour représenter le texte.
2. Si les caractères utilisés ne correspondent pas aux caractères appropriés pour les glyphes affichés dans la langue du contenu, alors des glyphes ressemblants sont utilisés.

Résultats attendus
- Si des glyphes ressemblants sont utilisés et qu'il n'existe pas d'alternative textuelle pour toute portion de texte employant ces glyphes ressemblants, alors le contenu ne satisfait pas le critère de succès.`,

  F72: `Échec du critère de succès 1.1.1 dû à l'utilisation d'ASCII art sans fournir d'alternative textuelle

Procédure
1. Accéder à une page comportant de l'ASCII art.
2. Pour chaque occurrence d'ASCII art, vérifier qu'elle possède une alternative textuelle.

Résultats attendus
- Si la vérification n°2 est fausse, alors cette condition d'échec s'applique et le contenu échoue à ce critère de succès.`,

  G158: `Fournir un substitut multimédia au contenu temporel pour un contenu audio-seul

Procédure
1. Consulter le contenu audio-seul tout en se référant au substitut multimédia au contenu temporel.
2. Vérifier que le dialogue de la transcription correspond à la langue, au dialogue et à l'information présentés dans la présentation audio-seule.
3. Si l'audio comporte plusieurs voix, vérifier que la transcription identifie qui parle pour l'ensemble des dialogues.
Vérifier qu'au moins l'une des conditions suivantes est vraie :
- La transcription elle-même peut être déterminée par programmation à partir de l'alternative textuelle du contenu audio-seul
- La transcription est référencée depuis l'alternative textuelle déterminée par programmation du contenu audio-seul
5. Si la ou les versions alternatives se trouvent sur une page distincte, vérifier la disponibilité de lien(s) permettant à l'utilisateur d'accéder aux autres versions.

Résultats attendus
- Toutes les vérifications ci-dessus sont vraies.`,

  G159: `Fournir un substitut multimédia au contenu temporel pour un contenu vidéo-seul

Procédure
1. Consulter le contenu vidéo-seul tout en se référant au substitut multimédia au contenu temporel.
2. Vérifier que l'information de la transcription comprend la même information que celle de la présentation vidéo-seule, dans la même langue que la page ou la vidéo.
3. Si la vidéo comporte plusieurs personnes ou personnages, vérifier que la transcription identifie quelle personne ou quel personnage est associé à chaque action décrite.

Vérifier qu'au moins l'une des conditions suivantes est vraie :
1. La transcription elle-même peut être déterminée par programmation à partir de l'alternative textuelle du contenu vidéo-seul
2. La transcription est référencée depuis l'alternative textuelle déterminée par programmation du contenu vidéo-seul

4. Si la ou les versions alternatives se trouvent sur une page distincte, vérifier la disponibilité de lien(s) permettant à l'utilisateur d'accéder aux autres versions.

Résultats attendus
- Toutes les vérifications ci-dessus sont vraies.`,

  G166: `Fournir un contenu audio qui décrit le contenu vidéo important et le signaler comme tel

Procédure
Pour une page web qui contient un contenu vidéo-seul :
1. Vérifier qu'il existe un lien vers une alternative audio, qui décrit le contenu de la vidéo dans la langue de la page, immédiatement avant ou après le contenu vidéo-seul.

Résultats attendus
- La vérification n°1 est vraie.`,

  G93: `Fournir des sous-titres ouverts (toujours visibles)

Procédure
1. Regarder le média synchronisé avec le sous-titrage fermé désactivé.
2. Vérifier que les sous-titres (de tous les dialogues et sons importants) sont visibles.
Résultats attendus
- La n°2 est vraie`,

  G87: `Fournir des sous-titres fermés

Procédure
1. Activer la fonction de sous-titres fermés du lecteur multimédia
2. Visionner le contenu multimédia synchronisé
3. Vérifier que les sous-titres (de tous les dialogues et sons importants) sont visibles et dans la langue de la vidéo
Résultats attendus
- La n°3 est vraie`,

  SM11: `Fournir des sous-titres au moyen de flux de texte synchronisés en SMIL 1.0

Procédure
1. Activer la préférence de sous-titres dans le lecteur, si elle existe
2. Lire le fichier avec les sous-titres
3. Vérifier si les sous-titres s'affichent
Résultats attendus
- La n°3 est vraie`,

  SM12: `Fournir des sous-titres au moyen de flux de texte synchronisés en SMIL 2.0

Procédure
1. Activer la préférence de sous-titres dans le lecteur, si elle existe
2. Lire le fichier avec les sous-titres
3. Vérifier si les sous-titres s'affichent
Résultats attendus
- La n°3 est vraie`,

  H95: `Utiliser l'élément track pour fournir des sous-titres

Procédure
Pour chaque élément video utilisé pour lire une vidéo :
1. Vérifier que la vidéo contient un élément track de type captions dans la langue de la vidéo.
Résultats attendus
- La vérification n°1 est vraie.`,

  F8: `Échec du critère de succès 1.2.2 dû à des sous-titres omettant certains dialogues ou effets sonores importants

Procédure
1. Visionner le contenu avec le sous-titrage activé.
2. Vérifier que tous les dialogues sont accompagnés d'un sous-titre.
3. Vérifier que tous les sons importants sont sous-titrés.
Résultats attendus
- Si les vérifications n°2 et n°3 sont fausses, alors cette condition d'échec s'applique et le contenu échoue au critère de succès.`,

  F75: `Échec du critère de succès 1.2.2 dû à la fourniture d'un média synchronisé sans sous-titres, alors que ce média présente plus d'information que celle présentée sur la page

Procédure
1. Vérifier la présence de sous-titres sur les substituts média synchronisés.
2. Vérifier que le substitut média synchronisé ne fournit pas plus d'information que celle présentée sous forme de texte sur la page.
   Remarque : les substituts média synchronisés emploient souvent des mots différents pour présenter ce qui figure sur la page, mais ils ne doivent pas présenter d'information nouvelle sur le sujet de la page.
Résultats attendus
- Si la vérification n°2 est fausse, alors cette condition d'échec s'applique et le contenu échoue à ces critères de succès.`,
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
  `Lot 002 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
