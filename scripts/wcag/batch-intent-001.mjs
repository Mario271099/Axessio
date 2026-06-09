// Lot Intent FR 001 (critères WCAG non couverts par les techniques).
// Usage : node scripts/wcag/batch-intent-001.mjs
import { readFileSync, writeFileSync } from "node:fs";

const fr = {
  "1.2.6": `L'objectif de ce critère de succès est de permettre aux personnes sourdes ou malentendantes qui maîtrisent une langue des signes de comprendre le contenu de la piste audio des présentations média synchronisées. Le texte écrit, tel que celui des sous-titres, est souvent une seconde langue. Parce que la langue des signes permet de transmettre l'intonation, l'émotion et d'autres informations audio qui se reflètent dans l'interprétation en langue des signes mais pas dans les sous-titres, l'interprétation en langue des signes offre un accès plus riche et plus équivalent au média synchronisé. Les personnes qui communiquent largement en langue des signes sont aussi plus rapides en langue des signes, et le média synchronisé est une présentation temporelle.`,

  "1.2.7": `L'objectif de ce critère de succès est de fournir aux personnes aveugles ou malvoyantes un accès à une présentation média synchronisée au-delà de ce que peut offrir l'audiodescription standard. Cela se fait en figeant périodiquement la présentation média synchronisée pour diffuser une audiodescription supplémentaire. La présentation média synchronisée reprend ensuite.

Parce que cela perturbe le visionnage de celles et ceux qui n'ont pas besoin de la description supplémentaire, des techniques permettant d'activer et de désactiver la fonctionnalité sont souvent fournies. Alternativement, des versions avec et sans la description supplémentaire peuvent être proposées.`,

  "1.2.8": `L'objectif de ce critère de succès est de rendre le matériel audiovisuel accessible aux personnes dont la vue est trop faible pour lire de manière fiable les sous-titres et dont l'audition est trop faible pour entendre de manière fiable les dialogues et l'audiodescription. Cela se fait en fournissant un substitut multimédia au contenu temporel, dans la même langue que la vidéo ou la page sur laquelle elle apparaît.

Cette approche consiste à fournir sous forme de texte l'ensemble des informations du média synchronisé (à la fois visuelles et auditives). Un substitut multimédia au contenu temporel fournit une description continue de tout ce qui se passe dans le contenu média synchronisé. Le substitut se lit un peu comme un livre. Contrairement à l'audiodescription, la description de la partie vidéo n'est pas limitée aux seules pauses du dialogue existant. Des descriptions complètes de toute l'information visuelle sont fournies, y compris le contexte visuel, les actions et expressions des acteurs, et tout autre élément visuel. De plus, les sons non vocaux (rires, voix hors champ, etc.) sont décrits, et les transcriptions de tous les dialogues sont incluses.

Les personnes dont la vue est trop faible pour lire de manière fiable les sous-titres et dont l'audition est trop faible pour entendre de manière fiable les dialogues peuvent accéder au substitut multimédia au contenu temporel à l'aide d'une plage braille rafraîchissable.`,

  "1.2.9": `L'objectif de ce critère de succès est de rendre accessible, au moyen d'une alternative textuelle, l'information véhiculée par de l'audio en direct, telle que l'audioconférence sur le web, les discours en direct et les webradios. Un service de sous-titrage en direct permettra de rendre l'audio en direct accessible aux personnes sourdes ou malentendantes, ou qui ne peuvent autrement entendre l'audio. De tels services font appel à un opérateur humain formé qui écoute ce qui est dit et utilise un clavier spécial pour saisir le texte avec seulement un léger décalage. Il peut capturer un événement en direct avec un haut degré de fidélité, et aussi insérer des notes sur tout audio non parlé essentiel à la compréhension de l'événement. Une transcription est parfois possible si l'audio en direct suit un script établi ; mais un service de sous-titrage en direct est préférable car il se déroule au même rythme que l'audio lui-même et peut s'adapter à tout écart par rapport au script.

Le recours à des opérateurs non formés, ou la fourniture d'une transcription qui diffère nettement de ce qui se passe réellement, ne serait pas considéré comme satisfaisant ce critère de succès.`,

  "1.3.6": `L'objectif de ce critère de succès est de garantir que la fonction de nombreux éléments d'une page peut être déterminée par programmation, afin que les agents utilisateurs puissent extraire et présenter cette fonction aux utilisateurs selon différentes modalités.

De nombreux utilisateurs au vocabulaire limité s'appuient sur des termes ou des symboles familiers pour utiliser le web. Cependant, ce qui est familier à un utilisateur peut ne pas l'être à un autre. Lorsque les auteurs indiquent la fonction, les utilisateurs peuvent tirer parti de la personnalisation et de leurs préférences pour charger un ensemble de symboles ou un vocabulaire qui leur est familier.

Ce critère de succès demande à l'auteur d'associer par programmation la fonction des icônes, des régions et des composants (tels que boutons, liens et champs) afin que les agents utilisateurs puissent déterminer la fonction de chacun et adapter les indicateurs ou la terminologie pour les rendre compréhensibles par l'utilisateur. Cela s'obtient en ajoutant une sémantique ou des métadonnées qui fournissent ce contexte.

Identifier les régions de la page permet aux personnes de supprimer ou de mettre en évidence des régions avec leur agent utilisateur.

Les produits destinés aux personnes non verbales utilisent souvent des symboles pour aider les utilisateurs à communiquer. Ces symboles constituent en fait le langage de ces personnes. Ce critère de succès permet aux symboles d'être interopérables, de sorte que les utilisateurs de symboles puissent comprendre différents contenus qui n'ont pas été produits par une seule et même entreprise.`,

  "1.4.6": `L'objectif de ce critère de succès est de fournir un contraste suffisant entre le texte et son arrière-plan afin qu'il puisse être lu par les personnes ayant une vision modérément faible (et qui n'utilisent pas de technologie d'assistance améliorant le contraste). Pour les personnes sans déficience de la perception des couleurs, la teinte et la saturation ont un effet minime ou nul sur la lisibilité, telle qu'évaluée par la performance de lecture. Les déficiences de la perception des couleurs peuvent affecter quelque peu le contraste de luminance. C'est pourquoi, dans la recommandation, le contraste est calculé de manière que la couleur ne soit pas un facteur clé, afin que les personnes ayant un déficit de la vision des couleurs disposent elles aussi d'un contraste adéquat entre le texte et l'arrière-plan.

Le texte décoratif et ne véhiculant aucune information est exclu. Un texte plus grand et dont les traits des caractères sont plus larges est plus facile à lire à contraste plus faible. L'exigence de contraste pour le texte de grande taille est donc moindre. Cela permet aux auteurs d'utiliser une gamme plus large de choix de couleurs pour le texte de grande taille, ce qui est utile pour la conception des pages, en particulier des titres. Un texte de 18 points, ou de 14 points en gras, est jugé suffisamment grand pour ne requérir qu'un rapport de contraste plus faible.

Le rapport de contraste de 7:1 a été choisi pour le niveau AAA car il compense la perte de sensibilité au contraste habituellement ressentie par les utilisateurs ayant une perte de vision équivalente à environ 20/80. […]`,

  "1.4.7": `L'objectif de ce critère de succès est de garantir que les sons non vocaux sont suffisamment faibles pour qu'un utilisateur malentendant puisse séparer la parole des sons d'arrière-plan ou d'autres bruits du contenu vocal de premier plan.

La valeur de 20 dB a été choisie sur la base de Large area assistive listening systems (ALS): Review and recommendations [LAALS] et In-the-ear measurements of interference in hearing aids from digital wireless telephones [HEARING-AID-INT].`,

  "1.4.8": `L'objectif de ce critère de succès est de garantir que le texte rendu visuellement est présenté de telle manière qu'il puisse être perçu sans que sa mise en page n'interfère avec sa lisibilité. Les personnes ayant certains troubles cognitifs, du langage et de l'apprentissage, ainsi que certains utilisateurs malvoyants, ne peuvent pas percevoir le texte et/ou perdent leur place de lecture si le texte est présenté d'une manière difficile à lire pour eux.

Les personnes ayant certains handicaps visuels ou cognitifs doivent pouvoir choisir la couleur du texte et celle de l'arrière-plan. Elles choisissent parfois des combinaisons qui semblent contre-intuitives à une personne sans ce handicap. Parfois ces combinaisons ont un très faible contraste. Parfois seules des combinaisons de couleurs très spécifiques leur conviennent. Le contrôle de la couleur ou d'autres aspects de la présentation du texte fait une énorme différence pour leur compréhension.

Pour les personnes ayant certains troubles de la lecture ou de la vision, les longues lignes de texte peuvent devenir un obstacle important. Elles ont du mal à garder leur place et à suivre le fil du texte. Avoir un bloc de texte étroit leur permet de passer plus facilement à la ligne suivante d'un bloc. Les lignes ne devraient pas dépasser 80 caractères ou glyphes (40 pour les langues CJC). Les personnes ayant certains troubles cognitifs ont du mal à suivre un texte dont les lignes sont rapprochées. Fournir un espace supplémentaire entre les lignes et les paragraphes leur permet de mieux suivre la ligne suivante. […]`,

  "1.4.9": `L'objectif de ce critère de succès est de permettre aux personnes qui requièrent une présentation visuelle particulière du texte d'ajuster cette présentation selon leurs besoins. Cela inclut les personnes qui ont besoin du texte dans une taille de police, des couleurs de premier plan et d'arrière-plan, une famille de police, un interligne ou un alignement particuliers.

Cela signifie implémenter le texte d'une manière qui permette de modifier sa présentation, ou fournir un mécanisme par lequel les utilisateurs peuvent sélectionner une présentation alternative. L'utilisation d'images de texte est un exemple d'implémentation qui ne permet pas aux utilisateurs de modifier la présentation du texte qu'elles contiennent.

Dans certaines situations, une présentation visuelle particulière du texte est essentielle à l'information véhiculée. Cela signifie que l'information serait perdue sans cette présentation visuelle particulière. Dans ce cas, implémenter le texte d'une manière qui permette de modifier sa présentation n'est pas exigé. Cela inclut le texte qui démontre un aspect visuel particulier, tel qu'une famille de police précise, ou le texte qui véhicule une identité, comme le texte d'un logo d'entreprise.

Le texte décoratif ne requiert pas d'être implémenté d'une manière qui permette de modifier sa présentation.`,

  "2.1.3": `L'objectif de ce critère de succès est de garantir que tout le contenu est actionnable au clavier. Il est identique au critère de succès 2.1.1, à ceci près qu'aucune exception n'est permise. Cela ne signifie pas que le contenu dont la fonction sous-jacente requiert une saisie dépendant de la trajectoire du mouvement de l'utilisateur, et non des seuls points d'arrivée (exclu des exigences de 2.1.1), doive être rendu accessible au clavier. Cela signifie plutôt que le contenu utilisant une saisie dépendante de la trajectoire ne peut pas se conformer à ce critère de succès et ne peut donc pas satisfaire la règle 2.1 au niveau AAA.

Les plateformes et les agents utilisateurs ont généralement des conventions sur la manière dont le contenu ou les applications web sont contrôlés au moyen d'une interface clavier. Si le contenu ne suit pas les conventions de la plateforme/de l'agent utilisateur, il peut être difficile à utiliser, car les utilisateurs devront apprendre des méthodes d'interaction différentes. Comme bonne pratique, le contenu devrait suivre les conventions de la plateforme/de l'agent utilisateur. Cependant, s'écarter de ces conventions ne constitue pas un échec de l'exigence normative de ce critère de succès.

Ce critère de succès n'exige pas que chaque contrôle visible activable au moyen d'un dispositif de pointage soit aussi focusable et actionnable au clavier. L'exigence normative est seulement qu'il doit exister un moyen, pour les utilisateurs de l'interface clavier, d'effectuer les mêmes actions, ou des actions comparables, et d'actionner le contenu.`,

  "2.2.3": `L'objectif de ce critère de succès est de réduire au minimum l'apparition de contenu nécessitant une interaction chronométrée. Cela permet aux personnes aveugles, malvoyantes, ayant des limitations cognitives ou des déficiences motrices d'interagir avec le contenu. Il diffère du critère de succès de niveau A en ce que la seule exception concerne les événements en temps réel.`,

  "2.2.4": `L'objectif de ce critère de succès est de permettre aux utilisateurs de désactiver les mises à jour provenant de l'auteur/du serveur, sauf en cas d'urgence. Les urgences incluraient les messages d'alerte civile ou tout autre message avertissant d'un danger pour la santé, la sécurité ou les biens, y compris la perte de données, la perte de connexion, etc.

Cela permet l'accès aux personnes ayant des limitations cognitives ou des troubles de l'attention en leur permettant de se concentrer sur le contenu. Cela permet aussi aux utilisateurs aveugles ou malvoyants de garder leur point de « lecture » sur le contenu qu'ils sont en train de lire.`,

  "2.2.5": `L'objectif de ce critère de succès est de permettre à tous les utilisateurs de mener à terme des transactions authentifiées qui comportent des limites de temps d'inactivité, ou d'autres circonstances qui déconnecteraient un utilisateur en plein milieu d'une transaction.

Pour des raisons de sécurité, de nombreux sites mettent en place une limite de temps d'authentification après une certaine période d'inactivité. Ces limites de temps peuvent poser problème aux personnes en situation de handicap car elles peuvent mettre plus de temps à accomplir l'activité.

D'autres sites déconnectent une personne d'une session si elle se connecte au site web depuis un autre ordinateur, ou si d'autres activités amènent le site à douter que la personne soit toujours la même personne légitime qui s'est initialement connectée. Lorsque les utilisateurs sont déconnectés alors qu'ils sont encore au milieu d'une transaction, il est important qu'on leur donne la possibilité de se ré-authentifier et de poursuivre la transaction sans perdre les données déjà saisies.`,

  "2.2.6": `L'objectif de ce critère de succès est de garantir que, lorsqu'un délai d'expiration est utilisé, les utilisateurs savent quelle durée d'inactivité provoquera l'expiration de la page et la perte de données. L'utilisation d'événements chronométrés peut présenter des obstacles importants pour les utilisateurs ayant des troubles cognitifs, car ces utilisateurs peuvent avoir besoin de plus de temps pour lire le contenu ou effectuer des fonctions, telles que remplir un formulaire en ligne.

Au cours d'un processus en ligne, comme réserver une chambre d'hôtel ou acheter un billet d'avion, un utilisateur ayant une déficience cognitive peut être dépassé par la longueur des instructions et des données à saisir pour mener à bien le processus. L'utilisateur peut ne pas être en mesure de terminer le processus en une seule fois et avoir besoin de faire une pause. Les utilisateurs devraient pouvoir quitter un processus sans perdre leur position actuelle dans celui-ci, ni les informations déjà saisies.

Ce critère de succès fonctionne de concert avec le critère de succès 2.2.1 Réglage du délai, mais se concentre spécifiquement sur la notification des délais d'expiration liés à l'inactivité de l'utilisateur.

La meilleure façon de se conformer à ce critère de succès est de conserver les données de l'utilisateur pendant au moins 20 heures. Cela permet aux utilisateurs en situation de handicap et aux personnes âgées de commencer et de terminer une tâche, en faisant des pauses au besoin.`,

  "2.3.2": `L'objectif de ce critère de succès est de réduire davantage le risque de crises d'épilepsie. Les crises ne peuvent pas être complètement éliminées, car certaines personnes y sont très sensibles. Cependant, en éliminant tout clignotement de plus de 3 par seconde sur n'importe quelle zone de l'écran, le risque qu'une personne ait une crise est réduit davantage qu'en respectant seulement les mesures habituellement utilisées aujourd'hui dans les normes internationales, comme nous le faisons au niveau A.

Comparé au critère de succès 2.3.1 Pas plus de trois flashs ou sous le seuil critique — qui autorise le clignotement s'il est suffisamment peu lumineux ou de surface suffisamment petite — ce critère n'autorise aucun clignotement survenant à une fréquence supérieure à 3 par seconde, quelle que soit la luminosité ou la taille. Par conséquent, même un seul pixel clignotant violerait ce critère. L'intention est de se prémunir contre les clignotements plus grands qu'un seul pixel, mais comme un niveau inconnu d'agrandissement ou un réglage de contraste élevé peut être appliqué, l'interdiction porte sur tout clignotement.`,

  "2.3.3": `L'objectif de ce critère de succès est de permettre aux utilisateurs d'empêcher l'affichage d'animations sur les pages web. Certains utilisateurs ressentent une distraction ou des nausées face à un contenu animé. Par exemple, si le défilement d'une page provoque le déplacement d'éléments (au-delà du mouvement essentiel associé au défilement), cela peut déclencher des troubles vestibulaires. Les réactions liées aux troubles vestibulaires (de l'oreille interne) incluent vertiges, nausées et maux de tête. Une autre animation souvent non essentielle est le défilement parallaxe. Le défilement parallaxe se produit lorsque les arrière-plans se déplacent à une vitesse différente des premiers plans. L'animation essentielle à la fonctionnalité ou à l'information d'une page web est autorisée par ce critère de succès.

L'« animation issue des interactions » s'applique lorsqu'une interaction de l'utilisateur déclenche une animation non essentielle. En revanche, le critère 2.2.2 Mettre en pause, arrêter, masquer s'applique lorsque la page web déclenche une animation « automatiquement », sans réponse à une activation intentionnelle de l'utilisateur. Il peut y avoir des situations où une animation particulière échoue aux deux critères de succès.

L'impact de l'animation sur les personnes ayant des troubles vestibulaires peut être très sévère. Les réactions déclenchées incluent nausées, migraines, et potentiellement la nécessité de garder le lit pour récupérer.`,

  "2.4.8": `L'objectif de ce critère de succès est de fournir un moyen à l'utilisateur de se situer au sein d'un ensemble de pages web, d'un site web ou d'une application web, et de trouver des informations connexes.`,

  "2.4.9": `L'objectif de ce critère de succès est d'aider les utilisateurs à comprendre la fonction de chaque lien du contenu, afin qu'ils puissent décider s'ils veulent le suivre. La bonne pratique veut que les liens ayant la même destination aient les mêmes descriptions, mais que les liens ayant des fonctions et des destinations différentes aient des descriptions différentes (voir aussi le critère de succès 3.2.4 Identification cohérente, qui demande de la cohérence dans l'identification des composants ayant la même fonctionnalité). Parce que la fonction d'un lien peut être identifiée à partir de son texte, les liens peuvent être compris hors contexte, par exemple lorsque l'agent utilisateur fournit la liste de tous les liens d'une page.

Le texte du lien est destiné à décrire la fonction du lien. Dans les cas où le lien mène à un document ou à une application web, le nom du document ou de l'application web suffirait à décrire la fonction du lien.

Le critère de succès comporte une exception pour les liens dont la fonction ne peut pas être déterminée à partir de l'information présente sur la page web. Le mot « mécanisme » est utilisé pour permettre aux auteurs soit de rendre tous les liens pleinement compréhensibles hors contexte par défaut, soit de fournir un moyen de les rendre tels.`,

  "2.4.10": `L'objectif de ce critère de succès est de fournir des titres aux sections d'une page web, lorsque la page est organisée en sections. Par exemple, les longs documents sont souvent divisés en différents chapitres, les chapitres ont des sous-thèmes, etc. Lorsque de telles sections existent, elles doivent avoir des titres qui les introduisent. Cela indique clairement l'organisation du contenu, facilite la navigation au sein du contenu et fournit des « poignées » mentales qui aident à la compréhension du contenu. D'autres éléments de page peuvent compléter les titres pour améliorer la présentation (par ex. filets horizontaux et cadres), mais la présentation visuelle ne suffit pas à identifier les sections d'un document.

Cette disposition figure au niveau AAA car elle ne peut pas s'appliquer à tous les types de contenu et il n'est pas toujours possible d'insérer des titres. Par exemple, lors de la publication sur le web d'un document préexistant, on ne peut pas insérer des titres que l'auteur n'avait pas inclus dans le document original. Ou encore, une longue lettre couvrirait souvent différents sujets, mais y insérer des titres serait très étrange. Cependant, si un document peut être découpé en sections avec des titres, cela facilite à la fois la compréhension et la navigation.`,
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
  `Lot Intent 001 : ${applied} appliquées. Total FR ${totalFr}/${Object.keys(techniques).length}.` +
    (unknown.length ? ` Inconnus: ${unknown.join(", ")}` : ""),
);
