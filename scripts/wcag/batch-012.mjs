// Lot de traduction FR 012 (dernier). Usage : node scripts/wcag/batch-012.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  G98: `Fournir à l'utilisateur la possibilité de revoir et corriger ses réponses avant de soumettre

Procédure
Dans une application de test, ou une application qui déclenche des transactions financières ou juridiques et qui collecte aussi des données auprès des utilisateurs en plusieurs étapes :
1. Vérifier que l'utilisateur est invité à revoir et confirmer les données.
2. Si les données utilisateur sont collectées en plusieurs étapes, l'utilisateur peut revenir aux étapes précédentes pour revoir et modifier les données.
3. Déterminer si un récapitulatif de toutes les données saisies par l'utilisateur est fourni avant que la transaction ne soit validée, et qu'une méthode est fournie pour corriger les erreurs si nécessaire.`,

  G155: `Fournir une case à cocher en plus d'un bouton d'envoi

Procédure
Pour les pages de saisie utilisateur qui déclenchent des transactions irréversibles :
1. Vérifier qu'une case à cocher confirmant la saisie ou l'action de l'utilisateur est fournie en plus du bouton d'envoi.
2. Vérifier que si la case n'est pas cochée lors de la soumission du formulaire, la saisie est rejetée et l'utilisateur est invité à revoir sa saisie, à cocher la case et à soumettre de nouveau.`,

  G99: `Fournir la possibilité de récupérer une information supprimée

Procédure
1. Repérer la fonctionnalité qui permet de supprimer du contenu
2. Supprimer du contenu et tenter de le récupérer.
3. Vérifier si l'information supprimée peut être récupérée.`,

  G168: `Demander confirmation pour poursuivre l'action sélectionnée

Procédure
1. Déclencher l'action qui ne peut être ni annulée ni modifiée.
2. Vérifier qu'une demande de confirmation de l'action sélectionnée est présentée.
3. Vérifier que l'action peut être confirmée et annulée.`,

  G134: `Valider les pages web

Procédure
Pour les technologies HTML, basées sur SGML et basées sur XML :

1. Charger chaque page ou document dans un analyseur validant.
2. Vérifier qu'aucune erreur de validation n'est trouvée.

Pour les autres technologies :

Suivre la procédure de validation définie pour la technologie utilisée, s'il en existe une.`,

  G192: `Se conformer pleinement aux spécifications

Procédure
1. Vérifier que toutes les technologies sont utilisées conformément à leur spécification.

Remarque

Si les validateurs sont d'excellents outils pour détecter les erreurs, ils ne peuvent généralement pas détecter tous les cas où le contenu ne se conforme pas pleinement à une spécification.`,

  H88: `Utiliser HTML conformément à la spécification

Procédure
Pour chaque page HTML :

1. Vérifier que la page n'utilise que des éléments, attributs et valeurs d'attribut définis dans la spécification.
2. Vérifier que les éléments, attributs et valeurs sont utilisés de la manière prescrite par la spécification.
3. Vérifier que la page peut être analysée correctement, selon les règles de la spécification.`,

  H74: `Garantir que les balises ouvrantes et fermantes sont utilisées conformément à la spécification

Procédure
1. Vérifier qu'il existe des balises fermantes pour tous les éléments nécessitant une balise fermante.
2. Vérifier qu'il n'y a pas de balises fermantes pour les éléments où elles sont interdites.
3. Vérifier que les balises ouvrantes et fermantes de tous les éléments sont correctement imbriquées.`,

  H93: `Garantir que les attributs \`id\` sont uniques sur une page web

Procédure
1. Vérifier que toutes les valeurs d'attribut \`id\` sont uniques sur la page.`,

  H94: `Garantir que les éléments ne contiennent pas d'attributs en double

Procédure
1. Vérifier qu'aucun attribut n'apparaît plus d'une fois sur un même élément`,

  H75: `Garantir que les pages web sont bien formées

Procédure
1. Charger chaque fichier dans un analyseur XML validant.
2. Vérifier qu'il n'y a aucune erreur de bonne formation.`,

  F70: `Échec du critère de succès 4.1.1 dû à une utilisation incorrecte des balises ouvrantes et fermantes ou du balisage des attributs

Procédure
1. Vérifier le code source des pages implémentées dans des langages de balisage.
2. Vérifier si des balises ouvrantes, fermantes ou des attributs sont mal formés.`,

  F77: `Échec du critère de succès 4.1.1 dû à des valeurs en double de type ID

Procédure
1. Vérifier que toutes les valeurs de type id sont uniques dans la page web`,

  ARIA14: `Utiliser aria-label pour fournir un nom accessible lorsqu'une étiquette visible ne peut pas être utilisée

Procédure
Pour les éléments qui utilisent l'attribut \`aria-label\` :

1. Vérifier que la valeur de l'attribut \`aria-label\` décrit correctement la fonction d'un élément où une saisie utilisateur est requise`,

  G108: `Utiliser les fonctionnalités de balisage pour exposer le nom et le rôle, permettre de définir directement les propriétés réglables par l'utilisateur, et fournir une notification des changements

Procédure
1. Inspecter visuellement le balisage ou utiliser un outil.
2. Vérifier qu'un balisage approprié est utilisé de sorte que le nom et le rôle de chaque composant d'interface puissent être déterminés.
3. Vérifier qu'un balisage approprié est utilisé de sorte que les composants d'interface qui acceptent une saisie utilisateur puissent tous être actionnés depuis une technologie d'assistance.`,

  G135: `Utiliser les fonctionnalités de l'API d'accessibilité d'une technologie pour exposer les noms et rôles, permettre de définir directement les propriétés réglables par l'utilisateur, et fournir une notification des changements

Procédure
1. Rendre le contenu au moyen d'un agent utilisateur accessible
2. Utiliser un outil d'accessibilité conçu pour l'API d'accessibilité de l'agent utilisateur pour évaluer chaque composant d'interface
3. Vérifier que le nom et le rôle de chaque composant d'interface sont trouvés par l'outil.`,

  G10: `Créer des composants au moyen d'une technologie qui prend en charge les fonctionnalités de l'API d'accessibilité des plateformes sur lesquelles les agents utilisateurs seront exécutés, afin d'exposer les noms et rôles, de permettre de définir directement les propriétés réglables par l'utilisateur, et de fournir une notification des changements

Procédure
1. Rendre le contenu au moyen d'un agent utilisateur accessible.
2. Utiliser un outil d'accessibilité conçu pour l'API d'accessibilité de l'agent utilisateur pour évaluer chaque composant d'interface.
3. Vérifier que le nom et le rôle de chaque composant d'interface sont trouvés par l'outil.
4. Modifier les valeurs du composant.
5. Vérifier que l'outil d'accessibilité est notifié.
6. Vérifier que le composant fonctionne avec les technologies d'assistance.`,

  ARIA4: `Utiliser un rôle WAI-ARIA pour exposer le rôle d'un composant d'interface

Procédure
Pour un composant d'interface utilisant l'attribut \`role\` :

1. Vérifier que la valeur de l'attribut role est l'un des rôles non abstraits parmi les valeurs définies dans la spécification WAI-ARIA.
2. Vérifier que les caractéristiques du composant d'interface sont décrites par le rôle.`,

  ARIA5: `Utiliser les attributs d'état et de propriété WAI-ARIA pour exposer l'état d'un composant d'interface

Procédure
Pour un composant d'interface utilisant l'attribut de rôle WAI-ARIA :

1. Vérifier que les états et propriétés requis pour le rôle sont présents.
2. Vérifier qu'aucun état ou propriété WAI-ARIA qui ne soit ni requis, ni pris en charge, ni hérité n'est présent.
3. Vérifier que les valeurs d'état et de propriété sont mises à jour pour refléter l'état courant lorsque le composant d'interface change d'état.`,

  F59: `Échec du critère de succès 4.1.2 dû à l'utilisation d'un script pour faire d'un div ou d'un span un contrôle d'interface en HTML sans fournir de rôle pour le contrôle

Procédure
1. Examiner le code source analysé à la recherche d'éléments auxquels des gestionnaires d'événements sont assignés dans le balisage ou via script (ce qui indique que l'élément est un contrôle d'interface).
2. Vérifier si le rôle du contrôle est déjà défini nativement dans le langage de balisage.
3. Vérifier si une autre méthode valide, telle que l'assignation d'un rôle WAI-ARIA approprié, a été utilisée pour définir le rôle du contrôle.`,

  F15: `Échec du critère de succès 4.1.2 dû à l'implémentation de contrôles personnalisés qui n'utilisent pas d'API d'accessibilité pour la technologie, ou qui le font de manière incomplète

Procédure
1. À l'aide du vérificateur d'accessibilité pour la technologie (ou, à défaut, en inspectant le code avec les outils de développement d'un navigateur, ou en testant avec une technologie d'assistance), vérifier les contrôles pour voir s'ils prennent en charge l'API d'accessibilité.`,

  F68: `Échec du critère de succès 4.1.2 dû à un contrôle d'interface n'ayant pas de nom déterminé par programmation

Procédure
Pour tous les éléments \`input\`, \`textarea\` et \`select\` de la page web (sauf les input de type \`hidden\`, \`submit\`, \`reset\` ou \`button\`) :

1. Vérifier que chaque élément possède un nom déterminé par programmation, de l'une des manières suivantes :

   1. la ou les étiquettes textuelles sont associées par programmation à l'élément de contrôle via l'attribut \`aria-labelledby\` (chaque id donné comme valeur dans l'attribut \`aria-labelledby\` correspond à l'\`id\` de l'élément d'étiquette textuelle).
   2. le contrôle est déterminé par programmation au moyen de la valeur de son attribut \`aria-label\`.
   3. l'étiquette textuelle est contenue dans un élément \`label\` correctement associé à l'élément \`input\` correspondant via l'attribut \`for\` du label (l'\`id\` donné comme valeur dans l'attribut \`for\` correspond à l'\`id\` de l'élément input).
   4. le contrôle est contenu dans un élément \`label\` qui contient également le texte de l'étiquette.
   5. le contrôle est un \`input\` de \`type\` \`image\` et l'attribut \`alt\` fournit une étiquette textuelle.
   6. le contrôle est déterminé par programmation au moyen de la valeur de l'attribut \`title\`.`,

  F79: `Échec du critère de succès 4.1.2 dû au fait que l'état de focus d'un composant d'interface n'est pas déterminable par programmation, ou qu'aucune notification du changement d'état de focus n'est disponible

Procédure
1. À l'aide du vérificateur d'accessibilité pour la technologie (ou, à défaut, en inspectant le code ou en testant avec une technologie d'assistance), vérifier les contrôles pour voir s'ils exposent l'état de focus via l'API d'accessibilité.
2. À l'aide du vérificateur d'accessibilité pour la technologie (ou, à défaut, en inspectant le code ou en testant avec une technologie d'assistance), vérifier si la technologie d'assistance est notifiée lorsque le focus passe d'un contrôle à un autre.`,

  F86: `Échec du critère de succès 4.1.2 dû à l'absence de noms pour chaque partie d'un champ de formulaire en plusieurs parties, tel qu'un numéro de téléphone

Procédure
Pour chaque sous-champ du champ de formulaire en plusieurs parties :

1. Vérifier qu'il existe un nom déterminé par programmation pour le champ.`,

  ARIA22: `Utiliser \`role=status\` pour présenter des messages d'état

Procédure
Pour chaque [message d'état](https://www.w3.org/TR/WCAG22/#dfn-status-messages) :

1. Vérifier que le conteneur destiné à recevoir le message d'état possède un attribut \`role\` de valeur \`status\` *avant* que le message d'état ne survienne.
2. Vérifier que, lorsque le message d'état est déclenché, il se trouve à l'intérieur du conteneur.
3. Vérifier que les éléments ou attributs qui fournissent une information équivalente à l'expérience visuelle du message d'état (tels qu'une image de panier avec un texte \`alt\` approprié) résident également dans le conteneur.`,

  G199: `Fournir un retour de réussite lorsque les données sont soumises avec succès

Procédure
1. Remplir les champs de formulaire sans erreur.
2. Soumettre le formulaire.
3. Vérifier qu'un message de retour à l'écran confirme que la soumission a réussi.`,

  G194: `Fournir une vérification orthographique et des suggestions pour la saisie de texte

Procédure
1. Vérifier qu'il existe un champ de formulaire sur la page.
2. Saisir un mot mal orthographié.
3. Vérifier qu'une suggestion orthographique est présentée.
4. Vérifier qu'un mécanisme est disponible pour saisir le mot suggéré dans le formulaire.`,

  ARIA23: `Utiliser \`role=log\` pour identifier les mises à jour d'information séquentielles

Procédure
Sur une page qui contient une information se mettant à jour séquentiellement :

1. Vérifier que le conteneur de l'information se voit attribuer un rôle \`log\`.`,

  ARIA25: `Utiliser une région live ARIA pour véhiculer l'état d'une barre de progression

Procédure
1. Vérifier si la page contient une barre de progression qui change dynamiquement pour véhiculer visuellement une information d'état à l'utilisateur.
2. À l'aide d'un lecteur d'écran, vérifier que les mises à jour de la barre de progression sont véhiculées à l'utilisateur, sans que le focus ne soit déplacé par programmation vers la barre de progression / le message d'état.`,

  G193: `Fournir de l'aide au moyen d'un assistant dans la page web

Procédure
1. Vérifier qu'il existe un assistant dans la page web.
2. Vérifier que l'assistant fournit une information pour aider à comprendre le contenu de la page.`,

  F103: `Échec du critère de succès 4.1.3 dû à la fourniture de messages d'état qui ne peuvent être déterminés par programmation au moyen d'un rôle ou de propriétés

Procédure
Pour le contenu ajouté dynamiquement à la page :

1. Vérifier que l'élément contenant le contenu mis à jour ne prend pas le focus
2. Vérifier que le nouveau contenu fournit à l'utilisateur une information sur l'un des éléments suivants :
   * la réussite ou le résultat d'une action
   * l'état d'attente d'une application
   * la progression d'un processus
   * l'existence d'erreurs
3. Vérifier que l'élément contenant le nouveau contenu ne possède pas déjà un rôle aria \`status\`, \`alert\` ou \`log\`, ni un attribut \`aria-live\`
4. Vérifier que le message d'état n'est pas restitué (c'est-à-dire annoncé) par la technologie d'assistance`,
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
  `Lot 012 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
