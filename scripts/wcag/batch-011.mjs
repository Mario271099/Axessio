// Lot de traduction FR 011. Usage : node scripts/wcag/batch-011.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  H32: `Fournir des boutons d'envoi

Procédure
1. Repérer tous les formulaires du contenu.
2. Pour chaque formulaire, vérifier qu'il possède un bouton d'envoi (<input type="submit">, <input type="image"> ou <button type="submit">).`,

  H84: `Utiliser un bouton avec un élément select pour exécuter une action

Procédure
Pour chaque combinaison élément select / élément button :
1. Vérifier que le focus (y compris le focus clavier) sur une option de l'élément select ne déclenche aucune action
2. Vérifier que la sélection du bouton exécute l'action associée à la valeur courante du select`,

  PDF15: `Fournir des boutons d'envoi avec l'action submit-form dans les formulaires PDF

Procédure
1. Pour chaque page qui soumet un formulaire, vérifier visuellement que le formulaire contient un bouton d'envoi et vérifier l'un des points suivants :
  - Tabuler jusqu'au bouton et vérifier qu'il soumet le formulaire en réponse à l'action de l'utilisateur sélectionnant le bouton.
  - Ouvrir le document PDF avec un outil capable d'afficher l'action submit-form et vérifier que l'action du bouton est bien de soumettre le formulaire.`,

  G13: `Décrire ce qui se produira avant qu'une modification d'un contrôle de formulaire entraînant un changement de contexte ne soit effectuée

Procédure
- Localiser le contenu où la modification du réglage d'un contrôle de formulaire entraîne un changement de contexte
- Vérifier qu'une explication de ce qui se produira lorsque le contrôle sera modifié est disponible avant l'activation du contrôle`,

  SCR19: `Utiliser un événement onchange sur un élément select sans provoquer de changement de contexte

Procédure
1. Naviguer jusqu'à l'élément select déclencheur (dans cet exemple, celui permettant de sélectionner les continents) et changer la valeur du select.
2. Naviguer jusqu'à l'élément select qui est mis à jour par le déclencheur (dans cet exemple, celui permettant de sélectionner les pays).
3. Vérifier que les valeurs d'option correspondantes s'affichent dans l'autre élément select.
4. Naviguer jusqu'à l'élément select déclencheur, parcourir les options sans changer la valeur.
5. Vérifier que les valeurs d'option correspondantes sont toujours affichées dans l'élément associé.`,

  F36: `Échec du critère de succès 3.2.2 dû à la soumission automatique d'un formulaire et à la présentation d'un nouveau contenu sans avertissement préalable lorsqu'une valeur est attribuée au dernier champ du formulaire

Procédure
1. Saisir des données dans tous les champs de la page en commençant par le haut.
2. Saisir des données dans le dernier champ et en sortir (le quitter par tabulation).
3. Vérifier si le fait de quitter le dernier champ provoque un changement de contexte.`,

  F37: `Échec du critère de succès 3.2.2 dû à l'ouverture d'une nouvelle fenêtre sans avertissement préalable lorsque la sélection d'un bouton radio, d'une case à cocher ou d'une liste de sélection est modifiée

Procédure
1. Repérer chaque formulaire d'une page.
2. Pour chaque contrôle de formulaire de type bouton radio, case à cocher ou élément d'une liste de sélection, vérifier si le changement de sélection du contrôle ouvre une nouvelle fenêtre.
3. Pour chaque nouvelle fenêtre résultant de l'étape 2, vérifier si l'utilisateur est averti à l'avance.`,

  G61: `Présenter les composants répétés dans le même ordre relatif chaque fois qu'ils apparaissent

Procédure
1. Lister les composants répétés sur chaque page web d'un ensemble de pages web (par exemple, sur chaque page d'un site).
2. Pour chaque composant, vérifier qu'il apparaît dans le même ordre relatif par rapport aux autres composants répétés sur chaque page web où il apparaît.
3. Pour chaque composant de navigation, vérifier que les liens ou références par programmation sont toujours dans le même ordre relatif.`,

  F66: `Échec du critère de succès 3.2.3 dû à la présentation des liens de navigation dans un ordre relatif différent selon les pages

Procédure
1. Vérifier si un mécanisme de navigation est utilisé sur plus d'une page web.
2. Vérifier la présentation par défaut du mécanisme de navigation sur chaque page pour voir si la liste des liens est dans le même ordre relatif sur chaque page web.`,

  G197: `Utiliser des étiquettes, noms et alternatives textuelles de manière cohérente pour les contenus ayant la même fonctionnalité

Procédure
1. Vérifier que chaque composant est associé à un texte qui l'identifie (c'est-à-dire une étiquette, un nom ou une alternative textuelle).
2. Vérifier que ce texte associé est identique pour chaque composant d'interface ayant la même fonction.`,

  F31: `Échec du critère de succès 3.2.4 dû à l'utilisation de deux étiquettes différentes pour la même fonction sur différentes pages web d'un ensemble de pages web

Procédure
1. Dans un ensemble de pages web, repérer les composants ayant la même fonction qui sont répétés sur plusieurs pages web.
2. Pour chaque composant ayant la même fonction repéré à l'étape 1, vérifier que la dénomination est cohérente.`,

  G83: `Fournir des descriptions textuelles pour identifier les champs obligatoires qui n'ont pas été renseignés

Procédure
1. Remplir un formulaire en laissant délibérément un ou plusieurs champs obligatoires vides, puis le soumettre.
2. Vérifier qu'une description textuelle est fournie, identifiant le ou les champs obligatoires non renseignés.
3. Vérifier que les autres données précédemment saisies par l'utilisateur sont réaffichées, sauf si les données figurent dans un champ lié à la sécurité où il serait inapproprié de les conserver pour les réafficher (par ex. un mot de passe).`,

  ARIA21: `Utiliser aria-invalid pour indiquer un champ en erreur

Procédure
Pour chaque contrôle de formulaire qui repose sur aria-invalid pour signaler un échec de validation :
1. Vérifier qu'aria-invalid n'est pas réglé à true lorsqu'il n'y a pas d'échec de validation.
2. Vérifier qu'aria-invalid est réglé à true lorsqu'un échec de validation existe.
3. Vérifier que les étiquettes associées par programmation / le texte d'instruction associé par programmation au champ fournissent assez d'information pour comprendre l'erreur.`,

  SCR18: `Fournir une validation côté client et une alerte

Procédure
Pour les champs de formulaire qui nécessitent une saisie spécifique :
1. saisir des données invalides
2. déterminer si une alerte décrivant l'erreur est fournie.`,

  PDF5: `Indiquer les contrôles de formulaire obligatoires dans les formulaires PDF

Procédure
Pour chaque champ de formulaire obligatoire, vérifier que l'information de validation et les instructions sont fournies, de la manière suivante :
1. Vérifier que le statut obligatoire est indiqué dans l'étiquette du contrôle de formulaire.
2. Laisser le champ vide et soumettre le formulaire. Vérifier qu'une alerte décrivant l'erreur est fournie.
3. Utiliser un outil qui expose le document via l'API d'accessibilité et vérifier que la propriété « obligatoire » est indiquée.`,

  ARIA18: `Utiliser aria-alertdialog pour identifier les erreurs

Procédure
1. Déclencher l'erreur qui fait apparaître l'alertdialog.
2. Déterminer que l'alertdialog contient au moins un élément focusable et que le focus se déplace vers cet élément à l'ouverture de l'alertdialog.
3. Déterminer que l'ordre de tabulation est contraint à l'intérieur de l'alertdialog tant qu'il est ouvert et que, lorsque l'alertdialog est fermé, le focus revient à la position qu'il avait avant l'ouverture, si possible.
4. Examiner l'élément auquel alertdialog est appliqué.
5. Déterminer que l'attribut aria-label ou aria-labelledby a été correctement utilisé pour donner un nom accessible à l'alertdialog.
6. Déterminer que le contenu de l'alertdialog identifie l'erreur de saisie.
7. Déterminer si le contenu de l'alertdialog suggère comment corriger l'erreur.`,

  ARIA19: `Utiliser le rôle ARIA=alert ou les régions live pour identifier les erreurs

Procédure
1. Déterminer qu'un conteneur d'erreur vide doté de l'attribut \`role=alert\` ou \`aria-live=assertive\` est présent dans le DOM au chargement de la page.
2. Déclencher l'erreur qui fait apparaître ou met à jour le contenu de la région live.
3. Déterminer que le message d'erreur a été injecté dans le conteneur d'erreur déjà présent.`,

  G84: `Fournir une description textuelle lorsque l'utilisateur saisit une information ne figurant pas dans la liste des valeurs autorisées

Procédure
1. Saisir des données invalides dans un champ de formulaire.
2. Vérifier qu'une information textuelle est fournie à propos du problème.`,

  G85: `Fournir une description textuelle lorsque la saisie de l'utilisateur ne respecte pas le format ou les valeurs requis

Procédure
1. Remplir un formulaire en saisissant délibérément une donnée ne respectant pas le format ou les valeurs requis
2. Vérifier qu'une description textuelle est fournie, identifiant le champ en erreur et fournissant une information sur la nature de la saisie invalide et la manière de la corriger.
3. Vérifier que les autres données précédemment saisies par l'utilisateur sont réaffichées, sauf si les données figurent dans un champ lié à la sécurité où il serait inapproprié de les conserver pour les réafficher (par ex. un mot de passe).`,

  SCR32: `Fournir une validation côté client et ajouter un texte d'erreur via le DOM

Procédure
Créer les messages d'erreur au moyen de balises d'ancre et d'un script approprié, selon la technique ci-dessus.
1. Charger la page.
2. Saisir une valeur valide dans le ou les champs associés à un message d'erreur et vérifier qu'aucun message d'erreur ne s'affiche.
3. Saisir une valeur invalide dans le ou les champs associés à un message d'erreur et vérifier que le message d'erreur correct pour le champ s'affiche.
4. Vérifier que les messages d'erreur reçoivent le focus.
5. Saisir une valeur valide dans le ou les champs associés au message d'erreur affiché et vérifier que le message d'erreur est supprimé.
6. Répéter pour tous les champs ayant des messages d'erreur associés créés au moyen de balises d'ancre.`,

  PDF22: `Indiquer lorsque la saisie de l'utilisateur ne respecte pas le format ou les valeurs requis dans les formulaires PDF

Procédure
Pour chaque champ de formulaire nécessitant une saisie spécifique, vérifier que l'information de validation et les instructions sont fournies, de la manière suivante :
1. Vérifier que le format ou la valeur requis est indiqué dans l'étiquette du contrôle de formulaire.
2. Utiliser un format ou une valeur erroné et quitter le champ : s'assurer qu'une alerte décrivant l'erreur est fournie.`,

  ARIA1: `Utiliser la propriété aria-describedby pour fournir une étiquette descriptive aux contrôles d'interface

Procédure
1. Vérifier qu'il existe un contrôle d'interface possédant un attribut aria-describedby qui référence un ou plusieurs éléments via un id unique.
2. Vérifier que le ou les éléments référencés fournissent une information supplémentaire sur le contrôle d'interface.`,

  ARIA2: `Identifier un champ obligatoire au moyen de la propriété aria-required

Procédure
Pour chaque contrôle dont la présentation indique qu'il est obligatoire :
1. Vérifier si l'attribut aria-required est présent :
2. Vérifier si la valeur de l'attribut aria-required correspond à l'état « obligatoire » correct du composant d'interface.`,

  G89: `Fournir le format de données attendu et un exemple

Procédure
1. Repérer les contrôles de formulaire qui n'accepteront une saisie utilisateur que dans un format donné.
2. Déterminer si chacun des contrôles de formulaire repérés à l'étape 1 fournit une information sur le format attendu.`,

  G184: `Fournir des instructions textuelles au début d'un formulaire ou d'un ensemble de champs, décrivant la saisie nécessaire

Procédure
1. Repérer les contrôles de formulaire qui n'accepteront une saisie utilisateur que dans un format donné.
2. Déterminer si des instructions sont fournies en haut du formulaire à propos du format attendu de chacun des contrôles de formulaire repérés à l'étape 1.`,

  G162: `Positionner les étiquettes pour maximiser la prévisibilité des relations

Procédure
Pour chaque champ de formulaire de la page web :
1. Vérifier que le champ de formulaire possède une étiquette visible.
2. Si le champ de formulaire est une case à cocher ou un bouton radio, vérifier que l'étiquette est placée immédiatement après le champ.
3. Si le champ de formulaire n'est pas une case à cocher ni un bouton radio, vérifier que l'étiquette est placée immédiatement avant le champ.`,

  H90: `Indiquer les contrôles de formulaire obligatoires au moyen de label ou legend

Procédure
1. Pour chaque contrôle de formulaire obligatoire, vérifier que le statut obligatoire est indiqué dans le label ou la legend du contrôle.
2. Pour chaque indicateur de statut obligatoire qui n'est pas fourni sous forme de texte, vérifier que la signification de l'indicateur est expliquée avant le contrôle de formulaire qui l'utilise.`,

  G167: `Utiliser un bouton adjacent pour étiqueter la fonction d'un champ

Procédure
Pour un champ et un bouton utilisant cette technique :
1. Vérifier que le champ et le bouton sont adjacents l'un à l'autre dans la séquence de lecture déterminée par programmation.
2. Vérifier que le champ et le bouton sont rendus visuellement adjacents l'un à l'autre.
3. Lorsque le bouton n'a pas d'étiquette textuelle visible, vérifier qu'il possède un nom accessible`,

  F82: `Échec du critère de succès 3.3.2 dû à la mise en forme visuelle d'un ensemble de champs de numéro de téléphone sans inclure d'étiquette textuelle

Procédure
1. Pour chaque ensemble de champs de numéro de téléphone de la page web représentant un seul numéro, vérifier que l'ensemble des champs est étiqueté par une étiquette textuelle visible placée près de l'ensemble des champs.
2. Pour chaque ensemble de champs de numéro de téléphone de la page web représentant un seul numéro, des instructions sont fournies sur la manière de remplir les champs.`,

  G177: `Fournir un texte de correction suggérée

Procédure
1. Repérer les champs de formulaire où le texte correct pourrait être déduit du texte incorrect.
2. Remplir le formulaire en remplissant délibérément les champs repérés avec un texte incorrect.
3. Vérifier que des suggestions de texte correct sont présentées à l'utilisateur.
4. Vérifier que les suggestions sont fournies à côté du champ de formulaire, ou qu'un lien vers les suggestions est fourni à proximité du champ.`,

  G164: `Fournir un délai indiqué pendant lequel une demande (ou transaction) en ligne peut être modifiée ou annulée par l'utilisateur après l'avoir effectuée

Procédure
1. Vérifier que la page web décrit la période pendant laquelle annuler ou modifier une commande.
2. Vérifier que la page web décrit la procédure pour annuler ou modifier une commande.`,
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
  `Lot 011 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
