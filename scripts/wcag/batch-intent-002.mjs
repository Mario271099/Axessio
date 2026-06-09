// Lot Intent FR 002 (suite). Usage : node scripts/wcag/batch-intent-002.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  "2.4.11": `L'objectif de ce critère de succès est de garantir que l'élément recevant le focus clavier est toujours au moins partiellement visible dans la zone d'affichage de l'utilisateur. Pour les personnes voyantes qui dépendent d'un clavier (ou d'un dispositif qui fonctionne via l'interface clavier, tel qu'un contacteur ou une entrée vocale), connaître le point de focus courant est essentiel. Le composant qui a le focus signale le point d'interaction sur la page. Lorsque les utilisateurs ne peuvent pas voir l'élément qui a le focus, ils peuvent ne pas savoir comment procéder, voire penser que le système ne répond plus.

Tenant compte des conceptions responsives complexes courantes aujourd'hui, ce critère de niveau AA autorise le composant recevant le focus à être partiellement masqué par un autre contenu créé par l'auteur. Un composant partiellement masqué peut rester très visible, mais plus il est masqué, moins il est facile à voir. Pour cette raison, les auteurs devraient s'efforcer de concevoir les interactions de manière à réduire le degré et la fréquence avec lesquels l'élément recevant le focus est partiellement masqué. Pour une visibilité optimale, aucune partie du composant recevant le focus ne devrait être masquée.

Les types de contenu qui peuvent recouvrir les éléments ayant le focus sont généralement les pieds de page collants, les en-têtes collants et les boîtes de dialogue non modales. À mesure que l'utilisateur tabule dans la page, ces couches de contenu peuvent masquer l'élément recevant le focus, ainsi que son indicateur de focus. […]`,

  "2.4.12": `L'objectif de ce critère de succès est de garantir que l'élément recevant le focus clavier est toujours visible dans la zone d'affichage de l'utilisateur. Pour les personnes voyantes qui dépendent d'un clavier (ou d'un dispositif qui fonctionne via l'interface clavier, tel qu'un contacteur ou une entrée vocale), connaître le point de focus courant est essentiel. Le composant qui a le focus signale le point d'interaction sur la page. Lorsque les utilisateurs ne peuvent pas voir l'élément qui a le focus, ils peuvent ne pas savoir comment procéder, voire penser que le système ne répond plus.

Les types de contenu qui peuvent recouvrir les éléments ayant le focus sont généralement les pieds de page collants, les en-têtes collants et les boîtes de dialogue non modales. À mesure que l'utilisateur tabule dans la page, ces couches de contenu peuvent masquer l'élément recevant le focus, ainsi que son indicateur de focus.

Une notification implémentée sous forme de contenu collant, telle qu'une bannière de cookies, échouera à ce critère de succès si elle recouvre partiellement un composant recevant le focus. Les moyens de réussir incluent : rendre la bannière modale afin que l'utilisateur doive la fermer avant de naviguer dans la page, ou utiliser un remplissage de défilement (scroll padding) pour que la bannière ne recouvre pas d'autre contenu. Les notifications ne nécessitant pas d'action de l'utilisateur pourraient aussi satisfaire ce critère en se fermant à la perte du focus.`,

  "2.4.13": `L'objectif de ce critère de succès est de garantir qu'un indicateur de focus clavier est clairement visible et discernable. L'apparence du focus est étroitement liée à 2.4.7 Visibilité du focus et à 1.4.11 Contraste des éléments non textuels. La visibilité du focus exige qu'un indicateur de focus visible existe tant qu'un composant a le focus clavier ; l'apparence du focus définit un niveau minimal de visibilité. Là où le contraste des éléments non textuels exige qu'un composant ait un contraste adéquat par rapport à l'arrière-plan dans chacun de ses états, l'apparence du focus exige un contraste suffisant pour l'indicateur de focus lui-même.

Pour les personnes voyantes ayant des déficiences motrices qui utilisent un clavier ou un dispositif faisant appel à l'interface clavier (tel qu'un contacteur ou une entrée vocale), connaître le point de focus courant est très important. Le focus visible doit aussi répondre aux besoins des utilisateurs malvoyants, qui peuvent eux aussi dépendre du clavier.

Un indicateur de focus clavier peut prendre différentes formes. Ce critère de succès encourage l'utilisation d'un contour plein autour du composant d'interface ayant le focus, mais autorise d'autres types d'indicateurs qui sont au moins aussi grands.`,

  "2.5.5": `L'objectif de ce critère de succès est d'aider les utilisateurs qui peuvent avoir du mal à activer une petite cible en raison de tremblements des mains, d'une dextérité limitée ou pour d'autres raisons. Si la cible est trop petite, il peut être difficile de la viser. Les souris et dispositifs de pointage similaires peuvent être difficiles à utiliser pour ces utilisateurs, et une cible plus grande les aidera grandement à obtenir des résultats positifs sur la page web.

Le tactile est particulièrement problématique car c'est un mécanisme de saisie à précision grossière. Les utilisateurs n'ont pas le même niveau de contrôle fin qu'avec des entrées telles qu'une souris ou un stylet. Un doigt est plus grand qu'un pointeur de souris et obstrue généralement la vue de l'utilisateur sur l'emplacement précis de l'écran qui est touché/activé.

Bien que ce critère définisse une taille de cible minimale, il est recommandé d'utiliser des tailles plus grandes pour réduire le risque d'actions involontaires. C'est particulièrement pertinent si l'une des conditions suivantes est vraie : le contrôle est utilisé fréquemment ; le résultat de l'interaction ne peut pas être facilement annulé ; le contrôle est placé à un endroit difficile à atteindre ou près du bord de l'écran ; le contrôle fait partie d'une tâche séquentielle. […]`,

  "2.5.6": `L'objectif de ce critère de succès est de garantir que les personnes peuvent utiliser différents modes de saisie et basculer entre eux lorsqu'elles interagissent avec le contenu web. Les utilisateurs peuvent employer divers mécanismes de saisie lorsqu'ils interagissent avec le contenu web. Il peut s'agir d'une combinaison de mécanismes tels qu'un clavier ou des interfaces de type clavier, et des dispositifs de pointage comme une souris, un stylet ou un écran tactile.

Même si un appareil possède un mécanisme de saisie principal, l'utilisateur peut choisir d'employer d'autres mécanismes de saisie lorsqu'il interagit avec l'appareil. Par exemple, le mécanisme principal des téléphones mobiles et des tablettes est l'écran tactile. L'utilisateur de ces appareils peut choisir d'utiliser une souris appairée ou un clavier externe comme alternative à l'écran tactile.

Les utilisateurs devraient pouvoir changer de mécanisme de saisie à tout moment s'ils estiment que certaines tâches et interactions sont plus faciles à accomplir au moyen d'un autre mécanisme. Le contenu ne doit pas limiter l'interaction de l'utilisateur à un mécanisme de saisie particulier, sauf si la restriction est essentielle, ou est requise pour assurer la sécurité du contenu ou respecter les réglages de l'utilisateur.`,

  "2.5.7": `L'objectif de ce critère de succès est de garantir qu'une fonctionnalité reposant sur un mouvement de glissement dispose d'un autre mode d'actionnement par pointeur unique, sans nécessiter la dextérité requise pour faire glisser des éléments.

Certaines personnes ne peuvent pas effectuer de mouvements de glissement de manière précise. D'autres utilisent un dispositif de saisie spécialisé ou adapté, tel qu'un trackball, un pointeur de tête, un système de suivi du regard ou un émulateur de souris commandé à la voix, ce qui peut rendre le glissement laborieux et source d'erreurs.

Lorsqu'une interface implémente une fonctionnalité reposant sur des mouvements de glissement, les utilisateurs effectuent quatre actions distinctes : taper ou cliquer pour établir un point de départ, puis presser et maintenir ce contact tout en repositionnant le pointeur, avant de relâcher le pointeur au point d'arrivée.

Tous les utilisateurs ne peuvent pas presser et maintenir ce contact avec précision tout en repositionnant le pointeur. Une méthode alternative doit être fournie afin que les utilisateurs ayant des déficiences motrices qui utilisent un pointeur (souris, stylet ou contact tactile) puissent utiliser la fonctionnalité.

Cette exigence est distincte de l'accessibilité au clavier, car les personnes utilisant un appareil à écran tactile peuvent ne pas utiliser de clavier physique.`,

  "2.5.8": `L'objectif de ce critère de succès est de contribuer à ce que les cibles puissent être activées facilement sans activer accidentellement une cible adjacente. Les utilisateurs ayant des limitations de dextérité et ceux qui ont des difficultés de motricité fine ont du mal à activer précisément de petites cibles lorsque d'autres cibles sont trop proches. Fournir une taille suffisante, ou un espacement suffisant entre les cibles, réduira le risque d'activer accidentellement le mauvais contrôle.

Les handicaps couverts par cette exigence incluent les tremblements des mains, la spasticité et la tétraplégie. Certaines personnes en situation de handicap utilisent des dispositifs de saisie spécialisés à la place d'une souris ou d'un pavé tactile. Généralement, ces types de dispositifs n'offrent pas autant de précision que les dispositifs de pointage classiques. Satisfaire cette exigence garantit aussi que les interfaces à écran tactile sont plus faciles à utiliser.

Ce critère de succès définit une taille minimale et, si elle ne peut être respectée, un espacement minimal. Il reste possible d'avoir des cibles très petites et difficiles à activer tout en satisfaisant les exigences de ce critère de succès, à condition que ces cibles n'aient pas de cibles adjacentes trop proches. Cependant, utiliser des cibles de plus grande taille aidera de nombreuses personnes à les utiliser plus facilement.`,

  "3.1.3": `Certains handicaps rendent difficile la compréhension de l'usage non littéral des mots, ainsi que des mots ou usages spécialisés. Certains handicaps rendent difficile la compréhension du langage figuré ou de l'usage spécialisé. Fournir de tels mécanismes est vital pour ces publics. Il est encouragé que l'information spécialisée destinée à des lecteurs non spécialistes satisfasse ce critère de succès, même lorsque l'on ne revendique qu'une conformité de niveau A ou AA.`,

  "3.1.4": `L'objectif de ce critère de succès est de garantir que les utilisateurs peuvent accéder à la forme développée des abréviations.`,

  "3.1.5": `Le contenu devrait être rédigé de la manière la plus claire et la plus simple possible. L'objectif de ce critère de succès est : de garantir qu'un contenu supplémentaire est disponible pour aider à comprendre un texte difficile ou complexe ; d'établir une mesure testable indiquant quand un tel contenu supplémentaire est requis.

Ce critère de succès aide les personnes ayant des troubles de la lecture tout en permettant aux auteurs de publier du contenu web difficile ou complexe. La difficulté du texte est décrite en termes de niveau d'études requis pour le lire. Les niveaux d'études sont définis selon la Classification internationale type de l'éducation, créée pour permettre la comparaison internationale entre les systèmes éducatifs.

Un texte difficile ou complexe peut être approprié pour la plupart des membres du public visé (c'est-à-dire la plupart des personnes pour qui le contenu a été créé). Mais il y a des personnes en situation de handicap, y compris des troubles de la lecture, même parmi les utilisateurs très instruits ayant une connaissance spécialisée du sujet. Il peut être possible d'accommoder ces utilisateurs en rendant le texte plus lisible. Si le texte ne peut pas être rendu plus lisible, alors un contenu complémentaire est nécessaire. Un contenu complémentaire est requis lorsque le texte exige une capacité de lecture plus avancée que le niveau du premier cycle de l'enseignement secondaire — c'est-à-dire plus de neuf années de scolarité. […]`,

  "3.1.6": `L'objectif de ce critère de succès est d'aider les personnes aveugles, malvoyantes et ayant des troubles de la lecture à comprendre le contenu dans les cas où le sens dépend de la prononciation. Souvent, des mots ou des caractères ont des sens différents, chacun avec sa propre prononciation. Le sens de tels mots ou caractères peut généralement être déterminé à partir du contexte de la phrase. Cependant, pour des phrases plus complexes ou ambiguës, ou pour certaines langues, le sens du mot ne peut pas être facilement déterminé, voire pas déterminé du tout, sans en connaître la prononciation. Lorsque la phrase est lue à voix haute et que le lecteur d'écran lit le mot avec une mauvaise prononciation, cela peut être encore plus difficile à comprendre que lu visuellement. Lorsque des mots sont ambigus ou indéterminés sans connaître la prononciation, il est nécessaire de fournir un moyen de déterminer cette prononciation.

Par exemple, en anglais, les hétéronymes sont des mots qui s'écrivent de la même façon mais ont des prononciations et des sens différents, comme les mots « desert » (abandonner) et « desert » (région aride). Si la prononciation correcte peut être déterminée à partir du contexte de la phrase, alors rien n'est requis. Sinon, un mécanisme pour déterminer la prononciation correcte serait requis. De plus, dans certaines langues, certains caractères peuvent se prononcer de différentes manières. En japonais, par exemple, il existe des caractères tels que les caractères Han (kanji) qui ont plusieurs prononciations.`,

  "3.2.5": `L'objectif de ce critère de succès est d'encourager la conception de contenu web qui donne aux utilisateurs un contrôle total sur les changements de contexte. Ce critère de succès vise à éliminer la confusion potentielle que peuvent provoquer des changements de contexte inattendus, tels que l'ouverture de nouvelles fenêtres ou la soumission automatique de formulaires après la sélection d'un élément dans une liste. De tels changements de contexte inattendus peuvent poser des difficultés aux personnes ayant des déficiences motrices, aux personnes malvoyantes, aux personnes aveugles et aux personnes ayant certaines limitations cognitives.

Certains types de changement de contexte ne sont pas perturbants pour certains utilisateurs, voire les avantagent activement. Par exemple, les utilisateurs de contacteur unique dépendent des changements de contexte animés par le système, et les préférences des utilisateurs malvoyants peuvent varier selon la part de contenu qu'ils peuvent voir d'un coup et la part de la structure de la session qu'ils peuvent retenir en mémoire de travail. Certains types de contenu, tels que les diaporamas, nécessitent la capacité de changer de contexte pour offrir l'expérience utilisateur prévue. Le contenu qui ne déclenche des changements de contexte automatiquement que lorsque les préférences de l'utilisateur le permettent peut se conformer à ce critère de succès.`,

  "3.2.6": `L'objectif de ce critère de succès est de garantir que les utilisateurs peuvent trouver de l'aide pour accomplir des tâches sur un site web, lorsqu'elle est disponible. Lorsque l'emplacement du mécanisme d'aide reste cohérent sur un ensemble de pages, les utilisateurs cherchant de l'aide l'identifieront plus facilement. Cela se distingue de l'aide au niveau de l'interface, telle que l'aide contextuelle, les fonctionnalités comme les correcteurs orthographiques et le texte d'instruction dans un formulaire.

Placer le mécanisme d'aide à un emplacement cohérent d'une page à l'autre facilite sa recherche par les utilisateurs. Par exemple, lorsqu'un mécanisme ou un lien est situé dans l'en-tête d'une page web, il sera plus facile à trouver s'il se trouve dans l'en-tête des autres pages. Le mécanisme d'aide, tel qu'un numéro de téléphone de contact, peut être fourni directement sur la page, ou être aussi un lien direct vers une page de contact. Quelle que soit l'approche retenue, le mécanisme doit être situé dans le même ordre relatif sur chaque page de l'ensemble de pages.

En cas de problème pour accomplir une tâche sur un site web, les personnes ayant certains types de handicap peuvent ne pas être en mesure de résoudre le problème sans aide supplémentaire. Sans aide, certains utilisateurs peuvent abandonner la tâche. Ils peuvent aussi ne pas l'accomplir correctement, ou avoir besoin de l'assistance de personnes qui ne préservent pas nécessairement la confidentialité des informations privées.`,

  "3.3.5": `L'objectif de ce critère de succès est d'aider les utilisateurs à éviter de commettre des erreurs. Certains utilisateurs en situation de handicap peuvent être plus susceptibles de commettre des erreurs que les utilisateurs sans handicap. Grâce à une aide contextuelle, les utilisateurs découvrent comment effectuer une opération sans perdre de vue ce qu'ils sont en train de faire.

Une aide contextuelle n'a besoin d'être fournie que lorsque l'étiquette ne suffit pas à décrire toute la fonctionnalité. L'existence d'une aide contextuelle devrait être évidente pour l'utilisateur, et il devrait pouvoir l'obtenir chaque fois qu'il en a besoin.

L'auteur du contenu peut fournir le texte d'aide, ou bien l'agent utilisateur peut le fournir à partir d'informations déterminées par programmation et spécifiques à la technologie.`,

  "3.3.6": `L'objectif de ce critère de succès est d'aider les utilisateurs en situation de handicap à éviter les conséquences pouvant résulter d'une erreur lors de la soumission de données de formulaire. Ce critère s'appuie sur le critère de succès 3.3.4 Prévention des erreurs (juridiques, financières, de données), en ce qu'il s'applique à tous les formulaires qui exigent des utilisateurs qu'ils soumettent des informations.

Les utilisateurs en situation de handicap peuvent être plus susceptibles de commettre des erreurs et avoir plus de difficulté à les détecter ou à s'en remettre. Les personnes ayant des troubles de la lecture peuvent transposer des chiffres et des lettres, et celles ayant des handicaps moteurs peuvent appuyer sur des touches par erreur. Fournir la possibilité d'annuler les actions permet aux utilisateurs de corriger une erreur. Fournir la possibilité de revoir et corriger les informations donne à l'utilisateur l'occasion de détecter une erreur avant d'effectuer une action.`,

  "3.3.7": `L'objectif de ce critère de succès est de garantir que les utilisateurs peuvent mener à bien des processus en plusieurs étapes. Il réduit l'effort cognitif lorsqu'une information est demandée plus d'une fois au cours d'un processus. Il réduit aussi le besoin de se rappeler d'une information fournie à une étape précédente.

L'information devant être mémorisée pour être saisie peut constituer un obstacle important pour les utilisateurs ayant des difficultés cognitives ou de mémoire. Tous les utilisateurs ressentent une fatigue mentale graduelle naturelle à mesure qu'ils avancent dans les étapes d'un processus. Cette fatigue est accélérée par le stress lié à la récupération d'informations en mémoire de travail à court terme. Les utilisateurs ayant des troubles de l'apprentissage et des troubles cognitifs sont très sensibles à la fatigue mentale.

Exiger des personnes qu'elles se rappellent d'informations précédemment saisies peut les amener à abandonner ou à ressaisir incorrectement la même information. La fonction de saisie automatique des navigateurs n'est pas considérée comme suffisante, car c'est au contenu (le site web) de fournir l'information stockée pour une saisie redondante, ou d'éviter de redemander la même information.

Ce critère de succès n'ajoute pas l'exigence de stocker l'information entre les sessions. Un processus est défini sur la base d'une activité et ne s'applique pas lorsqu'un utilisateur revient après avoir fermé une session ou quitté la page.`,

  "3.3.8": `L'objectif de ce critère de succès est de garantir qu'il existe une méthode d'authentification accessible, facile à utiliser et sécurisée pour les utilisateurs lors de la connexion à un compte existant. En tant que forme d'authentification la plus répandue, les sites web s'appuient couramment sur les noms d'utilisateur et les mots de passe pour la connexion. Cependant, mémoriser un nom d'utilisateur et un mot de passe représente une charge très élevée, voire impossible, pour les personnes ayant certains troubles cognitifs, tout comme les étapes supplémentaires souvent ajoutées aux processus d'authentification. Par exemple, la nécessité de transcrire un code de vérification à usage unique ou l'obligation de résoudre une énigme.

Se souvenir d'un mot de passe propre à un site est un test de fonction cognitive. De tels tests sont connus pour être problématiques pour de nombreuses personnes ayant des troubles cognitifs. Qu'il s'agisse de mémoriser des chaînes de caractères aléatoires ou un motif gestuel à reproduire sur un écran tactile, les tests de fonction cognitive excluront certaines personnes. Lorsqu'un test de fonction cognitive est utilisé, au moins une autre méthode d'authentification, qui ne soit pas un test de fonction cognitive, doit être disponible.

Les sites web peuvent employer des champs de nom d'utilisateur (ou d'e-mail) et de mot de passe comme méthode d'authentification si l'auteur permet à l'agent utilisateur (navigateurs et gestionnaires de mots de passe tiers) de remplir automatiquement les champs. Le copier-coller peut être utilisé pour éviter la transcription. […]`,

  "3.3.9": `L'objectif de ce critère de succès est de garantir qu'il existe une méthode accessible, facile à utiliser et sécurisée pour se connecter, accéder au contenu et accomplir des tâches. Ce critère est identique à Authentification accessible (minimum), mais sans les exceptions relatives aux objets et au contenu fourni par l'utilisateur.

Toute étape requise du processus d'authentification : ne peut pas afficher une sélection d'images, de vidéos ou de clips audio où les utilisateurs doivent choisir l'image qu'ils ont fournie ; ne peut pas afficher une sélection d'images où les utilisateurs doivent choisir celles qui contiennent un objet spécifique, tel qu'une voiture.`,
};

const techPath = new URL("./wcag-intent.json", import.meta.url);
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
  `Lot Intent 002 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
