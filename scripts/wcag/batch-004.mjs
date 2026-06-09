// Lot de traduction FR 004. Usage : node scripts/wcag/batch-004.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  PDF6: `Utiliser les éléments de tableau pour le balisage des tableaux dans les documents PDF

Procédure
1. Pour chaque tableau, confirmer l'un des points suivants :
  - Lire le document PDF avec un lecteur d'écran, en écoutant si l'information tabulaire est présentée d'une manière qui préserve les relations logiques entre les cellules d'en-tête et les cellules de données.
  - À l'aide d'un éditeur PDF, vérifier que les balises \`TR\`, \`TH\` et \`TD\` appropriées sont dans le bon ordre de lecture et la bonne hiérarchie dans l'arbre du tableau.
  - Utiliser un outil capable d'afficher les éléments de tableau pour ouvrir le document PDF, consulter la structure du tableau et vérifier qu'elle contient les structures TR, TH et TD appropriées.
  - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que la structure du tableau contient les structures \`TR\`, \`TH\` et \`TD\` appropriées, et qu'elles sont dans le bon ordre de lecture et la bonne hiérarchie.`,

  PDF20: `Utiliser l'éditeur de tableau d'Adobe Acrobat Pro pour réparer les tableaux mal balisés

Procédure
1. Pour un tableau réparé avec l'éditeur de tableau, confirmer l'un des points suivants :
  - Lire le document PDF avec un lecteur d'écran, en écoutant si l'information tabulaire est présentée d'une manière qui préserve les relations logiques entre les cellules d'en-tête et les cellules de données. (Configurer le lecteur d'écran pour qu'il n'utilise pas d'heuristiques pour lire les cellules d'en-tête.)
  - À l'aide d'un éditeur PDF, vérifier que les balises TR, TH et TD appropriées sont dans le bon ordre de lecture et la bonne hiérarchie dans l'arbre du tableau.
  - Utiliser un outil capable d'afficher les éléments de tableau pour ouvrir le document PDF, consulter la structure du tableau et vérifier qu'elle contient les structures TR, TH et TD appropriées.
  - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que la structure du tableau contient les structures TR, TH et TD appropriées, et qu'elles sont dans le bon ordre de lecture et la bonne hiérarchie.`,

  H39: `Utiliser les éléments caption pour associer les légendes aux tableaux de données

Procédure
Pour chaque tableau de données :
1. Vérifier que le tableau comporte un élément \`caption\`.
2. Vérifier que le texte qui titre ou décrit le tableau est inclus dans l'élément \`caption\`.`,

  H63: `Utiliser l'attribut scope pour associer les cellules d'en-tête aux cellules de données dans les tableaux de données

Procédure
Pour chaque tableau de données :
1. Vérifier que tous les éléments \`th\` possèdent un attribut \`scope\`.
2. Vérifier que tous les attributs \`scope\` ont la valeur \`row\`, \`col\`, \`rowgroup\` ou \`colgroup\`.`,

  H43: `Utiliser les attributs id et headers pour associer les cellules de données aux cellules d'en-tête dans les tableaux de données

Procédure
1. Repérer les tableaux de mise en page : déterminer si le contenu a une relation avec d'autres contenus à la fois dans sa colonne et dans sa ligne. Si « non », le tableau est un tableau de mise en page. Si « oui », le tableau est un tableau de données.
2. Pour les tableaux de données, vérifier que toute cellule associée à plus d'un en-tête de ligne et/ou de colonne contient un attribut \`headers\` listant l'\`id\` de tous les en-têtes associés à cette cellule.
3. Pour les tableaux de données où une cellule contient un attribut \`id\` ou \`headers\` :
  1. Vérifier que chaque \`id\` listé dans l'attribut \`headers\` de la cellule de données correspond à l'attribut \`id\` d'une cellule utilisée comme élément d'en-tête.
  2. Vérifier que l'attribut \`headers\` d'une cellule de données contient l'attribut \`id\` de tous les en-têtes associés à cette cellule.
  3. Vérifier que tous les \`id\` sont uniques (c'est-à-dire qu'aucun élément de la page n'a le même \`id\`).`,

  PDF10: `Fournir des étiquettes aux champs de formulaire interactifs dans les documents PDF

Procédure
1. Pour chaque champ de formulaire, vérifier visuellement que l'étiquette est correctement positionnée par rapport au champ.
2. Pour chaque champ de formulaire, vérifier que le nom est associé par programmation au champ, par l'un des moyens suivants :
   * Ouvrir le document PDF avec un outil capable d'afficher le nom associé au champ et vérifier que le nom est correctement associé au champ.
   * Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que le nom est correctement associé au champ.`,

  PDF12: `Fournir l'information de nom, rôle et valeur pour les champs de formulaire dans les documents PDF

Procédure
1. Pour le champ de formulaire, vérifier que le nom, le rôle et la valeur/l'état sont spécifiés par l'un des moyens suivants :
   * Utiliser un lecteur d'écran pour naviguer jusqu'au champ de formulaire et vérifier qu'il peut être activé ou que sa valeur peut être modifiée. Vérifier que le nom (infobulle) et le rôle sont annoncés.
   * Utiliser un outil capable d'afficher les informations du champ de formulaire pour ouvrir le document PDF et vérifier que le champ possède les informations correctes de nom, rôle, valeur et état (le cas échéant).
   * Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que le champ possède les informations correctes de nom, rôle, valeur et état (le cas échéant).`,

  H71: `Fournir une description aux groupes de champs de formulaire au moyen des éléments fieldset et legend

Procédure
Pour les groupes de champs liés où les étiquettes individuelles de chaque champ ne fournissent pas une description suffisante et où une description supplémentaire au niveau du groupe est nécessaire :
1. Vérifier que le groupe d'éléments input ou select logiquement liés est contenu dans des éléments fieldset.
2. Vérifier que chaque fieldset possède un élément legend qui est le premier enfant du fieldset et comprend une description pour ce groupe.`,

  H85: `Utiliser optgroup pour regrouper les éléments option à l'intérieur d'un select

Procédure
1. Examiner l'ensemble des options d'une liste de sélection pour déterminer s'il existe des groupes d'options liées.
2. S'il existe des groupes d'options liées, ils doivent être regroupés au moyen d'\`optgroup\`.`,

  H48: `Utiliser ol, ul et dl pour les listes ou groupes de liens

Procédure
1. Vérifier que le contenu ayant l'apparence visuelle d'une liste (avec ou sans puces) est balisé comme une liste non ordonnée.
2. Vérifier que le contenu ayant l'apparence visuelle d'une liste numérotée est balisé comme une liste ordonnée.
3. Vérifier que le contenu est balisé comme une liste de description lorsque des groupes de paires nom-valeur, par exemple des termes et leurs définitions ou des questions et leurs réponses, sont présentés sous forme de liste.`,

  H42: `Utiliser h1-h6 pour identifier les titres

Procédure
1. Vérifier qu'un balisage de titre est utilisé lorsque le contenu est un titre, et que ce balisage indique le niveau de titre approprié pour le contenu.
2. Vérifier qu'un balisage de titre n'est pas utilisé lorsque le contenu n'est pas un titre.`,

  PDF9: `Fournir des titres en balisant le contenu avec des balises de titre dans les documents PDF

Procédure
1. Ouvrir le document PDF dans Adobe Acrobat Pro.
2. Vérifier que les titres du document sont balisés avec des balises de titre appropriées (H1-H6).
3. Vérifier que les niveaux de titre reflètent la structure hiérarchique du document.`,

  PDF11: `Fournir des liens et du texte de lien au moyen de l'annotation Link et de l'élément de structure /Link dans les documents PDF

Procédure
1. Ouvrir le document PDF dans Adobe Acrobat Pro.
2. Utiliser le clavier (touche Tab) pour naviguer dans le document et repérer les liens.
3. Activer chaque lien avec la touche Entrée.
4. Vérifier que chaque lien est identifié par son annotation Link et son élément de structure /Link.
5. Vérifier que le texte du lien identifie la fonction du lien.`,

  PDF17: `Spécifier une numérotation de page cohérente pour les documents PDF

Procédure
1. Pour chaque section du document qui utilise un format de pagination différent, vérifier que la fonction de navigation par page utilise le même format que celui des pages du document :
  - Sélectionner les pages qui débutent un nouveau format de pagination et vérifier visuellement que le même format et le même numéro de page s'affichent dans la fonction de navigation par page.
  - À l'aide d'un lecteur d'écran, vérifier que le numéro de page annoncé dans la fonction de navigation par page est le même que celui annoncé sur la page du document.
  - À l'aide d'un outil capable d'afficher les entrées /PageLabels, ouvrir le document PDF et consulter les entrées.
  - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que les entrées /PageLabels sont correctement spécifiées.`,

  PDF21: `Utiliser les balises List pour les listes dans les documents PDF

Procédure
1. Pour une liste dans un document PDF, vérifier de l'une des manières suivantes :
  - Lire le document PDF avec un lecteur d'écran, en écoutant si la liste est lue correctement lors de la lecture du contenu ligne par ligne.
  - Utiliser un outil capable d'afficher les listes pour ouvrir le document PDF et consulter la liste afin de vérifier qu'elle est correctement structurée.
  - Inspecter l'arbre des balises pour vérifier que la liste est structurée conformément à la spécification PDF.
  - Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que la liste est correctement structurée.`,

  H97: `Regrouper les liens liés au moyen de l'élément nav

Procédure
1. Vérifier que les liens visuellement regroupés et représentant une section de la page sont contenus dans un élément \`nav\`.`,

  T1: `Utiliser les conventions standard de mise en forme du texte pour les paragraphes

Procédure
Pour chaque paragraphe :
1. Vérifier que le paragraphe est précédé d'exactement une ligne vide, ou qu'il est le premier contenu de la page web
2. Vérifier que le paragraphe est suivi d'au moins une ligne vide, ou qu'il est le dernier contenu de la page web.
3. Vérifier qu'aucun paragraphe ne contient de ligne vide`,

  T2: `Utiliser les conventions standard de mise en forme du texte pour les listes

Procédure
Pour chaque liste du contenu textuel
1. Vérifier que chaque élément de liste est un paragraphe qui commence par une étiquette
2. Vérifier que la liste ne contient aucune ligne qui ne soit pas un élément de liste
3. Vérifier que tous les éléments d'une même liste utilisent le même style d'étiquette
4. Vérifier que les étiquettes des listes ordonnées sont en ordre séquentiel
5. Vérifier que les étiquettes de chaque liste non ordonnée sont identiques`,

  T3: `Utiliser les conventions standard de mise en forme du texte pour les titres

Procédure
Pour chaque titre du contenu :
1. Vérifier que chaque titre est précédé de deux lignes vides
2. Vérifier que chaque titre est suivi d'une ligne vide
3. Vérifier qu'aucun titre ne contient de ligne vide`,

  F2: `Échec du critère de succès 1.3.1 dû à l'utilisation de variations de présentation du texte pour véhiculer de l'information sans recourir au balisage ou au texte approprié

Procédure
1. Pour les images de texte :
  1. Vérifier si des images de texte sont utilisées pour véhiculer l'information structurelle du document.
  2. Vérifier que la structure sémantique appropriée (par ex. les titres HTML) est utilisée avec le texte pour véhiculer l'information.
2. Pour le texte stylé qui véhicule de l'information :
  1. Vérifier s'il existe du texte stylé véhiculant une information structurelle.
  2. Vérifier qu'en plus du style, la structure sémantique appropriée est utilisée avec le texte pour véhiculer l'information.`,

  F33: `Échec des critères de succès 1.3.1 et 1.3.2 dû à l'utilisation de caractères d'espacement pour créer plusieurs colonnes dans un contenu en texte brut

Procédure
1. Examiner le document à la recherche de données ou d'informations présentées sous forme de colonnes.
2. Vérifier si les colonnes sont créées au moyen de caractères d'espacement pour disposer l'information.`,

  F34: `Échec des critères de succès 1.3.1 et 1.3.2 dû à l'utilisation de caractères d'espacement pour mettre en forme des tableaux dans un contenu en texte brut

Procédure
1. Examiner le document à la recherche de tableaux mis en forme visuellement.
2. Vérifier si les tableaux sont créés au moyen de caractères d'espacement pour disposer les données tabulaires.`,

  F42: `Échec des critères de succès 1.3.1, 2.1.1, 2.1.3 ou 4.1.2 lors de l'émulation de liens

Procédure
Pour tous les éléments présentés comme des liens et qui utilisent des gestionnaires d'événements JavaScript pour faire émuler un lien à l'élément :

1. Vérifier si le rôle déterminé par programmation de l'élément est « link ».
2. Vérifier si le lien émulé peut être activé au clavier.`,

  F43: `Échec du critère de succès 1.3.1 dû à l'utilisation d'un balisage structurel d'une manière qui ne représente pas les relations dans le contenu

Procédure
1. Vérifier que la signification sémantique de l'élément est exposée aux technologies d'assistance et qu'elle est appropriée au contenu de l'élément.`,

  F46: `Échec du critère de succès 1.3.1 dû à l'utilisation d'éléments th, d'éléments caption ou d'attributs summary non vides dans les tableaux de mise en page

Procédure
1. Examiner le code source du document HTML ou XHTML pour l'élément table
2. Si le tableau est utilisé uniquement pour disposer visuellement des éléments au sein du contenu
  1. Vérifier que le tableau ne contient aucun élément th.
  2. Vérifier que l'élément table ne contient pas d'attribut summary non vide.
  3. Vérifier que l'élément table ne contient pas d'élément caption.`,

  F48: `Échec du critère de succès 1.3.1 dû à l'utilisation de l'élément pre pour baliser de l'information tabulaire

Procédure
1. Vérifier si l'élément pre est utilisé
2. Pour chaque occurrence de l'élément pre, vérifier si l'information qu'il contient est tabulaire.`,

  F90: `Échec du critère de succès 1.3.1 dû à une association incorrecte des en-têtes et du contenu de tableau via les attributs headers et id

Procédure
1. Pour les tableaux qui associent les cellules de données aux cellules d'en-tête via les attributs id et headers, vérifier que l'association par programmation est correcte.`,

  F91: `Échec du critère de succès 1.3.1 dû à un balisage incorrect des en-têtes de tableau

Procédure
Pour tous les tableaux de données, vérifier si les en-têtes de tableau peuvent être correctement déterminés par programmation au moyen de l'un des mécanismes suivants :
1. en-têtes balisés avec des éléments d'en-tête de tableau (th)
2. attributs scope sur th pour les tableaux comportant plus d'une seule ligne ou colonne d'en-têtes.
3. en-têtes et cellules de données associés au moyen des attributs headers et id
4. en-têtes balisés avec les attributs de rôle ARIA rowheader ou columnheader`,
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
  `Lot 004 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
