-- ============================================================================
-- Axessio · Méthodologie RAAM 1.1 — méthodologie d'évaluation par critère
-- ----------------------------------------------------------------------------
-- Source officielle : https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html
-- (Licence Ouverte Etalab 2.0 — réutilisation libre)
--
-- Pour chacun des 108 critères du RAAM 1.1 (référentiel
-- 55555555-5555-5555-5555-555555555555), on remplit la colonne `methodology`
-- avec la rubrique « Méthodologie d'évaluation » extraite de la page
-- officielle (sections iOS et Android consolidées).
--
-- Idempotent · à exécuter en transaction unique.
-- Vérification finale : exception si moins de 100 critères remplis.
-- ============================================================================

begin;

-- ============================================================================
-- Thème 1 · Éléments graphiques (9 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les éléments graphiques décoratifs (voir la note de glossaire concernant les particularités de restitution).

- Vérifier :

- qu’ils ne peuvent pas être atteints avec le lecteur d’écran ;

- que leur contenu n’est pas restitué par ailleurs depuis un autre élément dans l’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '1.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les éléments graphiques porteurs d’informations (voir la note de glossaire concernant les particularités de restitution), par exemple, une image ou une icône.

- Vérifier :

- qu’ils peuvent être atteints avec le lecteur d’écran ;

- ou que l’information qu’ils véhiculent est restituée depuis un autre élément dans l’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '1.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les éléments graphiques porteurs d’information (voir la note de glossaire concernant les particularités de restitution).

- Vérifier :

- que l’alternative restituée par le lecteur d’écran est pertinente ;

- ou que l’information restituée depuis un autre élément dans l’écran est pertinente.

- Si c’est le cas, le critère est validé.'
where identifier = '1.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les éléments graphiques utilisés comme CAPTCHA (voir la note de glossaire concernant les particularités de restitution).

- Vérifier que l’alternative restituée par le lecteur d’écran permet de comprendre la fonction de l’élément graphique (par exemple « Code secret à saisir », « Code de sécurité »).

- Si c’est le cas, le critère est validé.'
where identifier = '1.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les éléments graphiques utilisés comme CAPTCHA (voir la note de glossaire concernant les particularités de restitution).

- Vérifier :

- la présence d’une alternative non graphique (CAPTCHA sonore ou logique) ;

- ou la présence d’une autre solution d’accès à la fonctionnalité sécurisée par le CAPTCHA (envoi d’un code sms, envoi d’un e-mail de confirmation, etc.).

- Si c’est le cas, le critère est validé.'
where identifier = '1.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les éléments graphiques porteurs d’information qui nécessitent une description détaillée (voir la note de glossaire concernant les particularités de restitution). Par exemple :

- éléments graphiques pour lesquels l’alternative à fournir est trop longue (plus d’une phrase par exemple) ou nécessite une structuration (titres, listes ou tableau) ;

- éléments graphiques qui cumulent plusieurs problématiques (information par la couleur, élément graphique texte, contrastes, etc.) comme les graphiques ou les cartes.

- Vérifier :

- la présence d’une description détaillée clairement identifiable adjacente à l’élément graphique ;

- ou la présence d’une fonctionnalité (un bouton, un lien) permettant d’accéder à une description détaillée.

- Sinon, activer le lecteur d’écran et naviguer jusqu’à l’élément graphique.

- Vérifier que le lecteur d’écran restitue une description détaillée.

- Si c’est le cas, le critère est validé.'
where identifier = '1.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les éléments graphiques qui possèdent une description détaillée.

- Vérifier que chaque description détaillée est pertinente. On doit y trouver toutes les informations présentes dans l’élément graphique et nécessaires à la compréhension du contenu.

- Si c’est le cas, le critère est validé.'
where identifier = '1.7' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les éléments graphiques texte porteurs d’information (voir la note de glossaire concernant les particularités de restitution) :

- Activer le lecteur d’écran, parcourir le contenu et repérer si les éléments restitués « élément graphique » ou « image » contiennent du texte porteur d’information.

- Vérifier :

- qu’il existe un mécanisme de remplacement des éléments graphiques texte par du texte modifiable selon les préférences d’affichage de l’utilisateur (taille, couleur, graisse…) ;

- ou que les styles et effets ne peuvent pas être reproduits via du texte stylé.

- Si c’est le cas, le critère est validé.'
where identifier = '1.8' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux éléments graphiques légendés.

- Vérifier que la légende de l’élément graphique est restituée lorsque le focus atteint l’élément graphique (l’élément graphique et la légende sont contenus dans un seul élément atteignable par le lecteur d’écran).

- Si c’est le cas, le critère est validé.'
where identifier = '1.9' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 2 · Couleurs (4 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS]

- Activer l’option Différencier sans couleur (Réglages > Accessibilité > Affichage et taille du texte > Différencier sans couleur).

- Repérer dans l’écran les mots ou ensembles de mots, les textes, les éléments graphiques porteurs d’information et les médias temporels dont la mise en couleur est porteuse d’information.

- Vérifier qu’il existe un autre moyen visuel de récupérer cette information : présence d’une icône ou d’un effet graphique de forme ou de position, un effet typographique, etc.

- Avec le lecteur d’écran, accéder à l’information donnée par la couleur.

- Vérifier qu’une information équivalente est restituée par le lecteur d’écran (par exemple l’état « sélectionné » d’un bouton vert).

- Si c’est le cas, le critère est validé.

[Android]

- Repérer dans l’écran les mots ou ensembles de mots, les textes, les éléments graphiques porteurs d’information et les médias temporels dont la mise en couleur est porteuse d’information.

- Vérifier qu’il existe un autre moyen visuel de récupérer cette information : présence d’une icône ou d’un effet graphique de forme ou de position, un effet typographique, etc.

- Avec le lecteur d’écran, accéder à l’information donnée par la couleur.

- Vérifier qu’une information équivalente est restituée par le lecteur d’écran (par exemple l’état « sélectionné » d’un bouton vert).

- Si c’est le cas, le critère est validé.'
where identifier = '2.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Activer l’option Augmenter le contraste (Réglages > Accessibilité > Affichage et taille du texte > Augmenter le contraste) ou s’il est présent dans l’application, activer le mécanisme de remplacement permettant d’afficher l’application avec un rapport de contraste suffisant.

- Repérer dans l’écran les textes, les textes contenus dans des éléments graphiques et les textes incrustés dans les vidéos qui pourraient poser des problèmes de contraste.

- Pour les textes dont la taille (normale ou agrandie) ne peut être appréciée à l’œil nu, vous devrez la mesurer (voir la section dédiée dans la méthodologie).

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs d’avant-plan et d’arrière-plan :

- en diffusant l’écran du terminal mobile sur l’ordinateur ;

- ou en réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Pour les textes problématiques identifiés précédemment, vérifier :

- Pour les textes dont la taille est de moins de 24 px sans effet de graisse, ou de moins de 18,5 px avec effet de graisse, que la valeur de contraste est de 4.5:1, au moins ;

- Pour les textes dont la taille est de 24 px ou plus sans effet de graisse, ou de 18,5 px ou plus avec effet de graisse, que la valeur de contraste est de 3:1 au moins.

- Si c’est le cas, le critère est validé.

Note : Il est possible d’utiliser l’application Accessibility Inspector disponible sur macOS pour réaliser une évaluation rapide des contrastes des écrans. Le logiciel dispose d’une fonctionnalité « Audit » qui permet de faire des tests automatiques de certains éléments textes et graphiques des écrans. Cette fonctionnalité ne détecte pas l’ensemble des défauts de contraste, des tests complémentaires suivant la méthodologie décrite ci-avant seront nécessaires.

[Android]

- S’il existe dans l’application, activer le mécanisme de remplacement permettant d’afficher l’application avec un rapport de contraste suffisant.

- Repérer dans l’écran les textes, les textes contenus dans des éléments graphiques et les textes incrustés dans les vidéos qui pourraient poser des problèmes de contraste.

- Pour les textes dont la taille (normale ou agrandie) ne peut être appréciée à l’œil nu, vous devrez la mesurer (voir la section dédiée dans la méthodologie).

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs d’avant-plan et d’arrière-plan :

- en diffusant l’écran du terminal mobile sur l’ordinateur ;

- ou en réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Pour les textes problématiques identifiés précédemment, vérifier :

- Pour les textes dont la taille est de moins de 24 px sans effet de graisse, ou de moins de 18,5 px avec effet de graisse, que la valeur de contraste est de 4.5:1, au moins ;

- Pour les textes dont la taille est de 24 px ou plus sans effet de graisse, ou de 18,5 px ou plus avec effet de graisse, que la valeur de contraste est de 3:1 au moins.

- Si c’est le cas, le critère est validé.

Note : Il est possible d’utiliser l’application Accessibility Scanner pour réaliser une évaluation rapide des contrastes des écrans. L’application ne détecte pas l’ensemble des défauts de contrastes, des tests complémentaires suivant la méthodologie décrite ci-avant seront nécessaires.'
where identifier = '2.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Activer l’option Augmenter le contraste (Réglages > Accessibilité > Affichage et taille du texte > Augmenter le contraste) ou s’il est présent dans l’application, activer le mécanisme de remplacement permettant d’afficher les éléments graphiques avec un rapport de contraste suffisant.

- Repérer dans l’écran les éléments graphiques porteurs d’information et pour chacun :

- Identifier quelle(s) couleur(s) du composant sont nécessaires à l’identification de la localisation et/ou de l’information véhiculée (cela peut être la bordure, la couleur d’une icône, la couleur de fond) ;

- Identifier les couleurs adjacentes qui ont un impact sur la visibilité de la ou les couleurs du composant.

- Repérer dans l’écran les composants interactifs qui peuvent avoir plusieurs états (survolés, focus, activé, coché) et pour chacun :

- Identifier quelle(s) couleur(s) du composant sont nécessaires à l’identification de la localisation et/ou de l’information véhiculée et de l’état (cela peut être la bordure, la couleur d’une icône, la couleur de fond) pour chacun des états ;

- Identifier les couleurs adjacentes qui ont un impact sur la visibilité de la ou les couleurs du composant.

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs d’avant-plan et d’arrière-plan sur le terminal mobile soit :

- En diffusant l’écran du terminal mobile sur l’ordinateur ;

- En réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Vérifier que le rapport de contraste entre les couleurs identifiées est de 3:1 au moins.

- Si c’est le cas, le critère est validé.

Note : Il est possible d’utiliser l’application Accessibility Inspector disponible sur macOS pour réaliser une évaluation rapide des contrastes des écrans. Le logiciel dispose d’une fonctionnalité « Audit » qui permet de faire des tests automatiques de certains éléments textes et graphiques des écrans. Cette fonctionnalité ne détecte pas l’ensemble des défauts de contraste, des tests complémentaires suivant la méthodologie décrite ci-avant seront nécessaires.

[Android]

- S’il existe dans l’application, activer le mécanisme de remplacement permettant d’afficher les éléments graphiques avec un rapport de contraste suffisant.

- Repérer dans l’écran les éléments graphiques porteurs d’information et pour chacun :

- Identifier quelle(s) couleur(s) du composant sont nécessaires à l’identification de la localisation et/ou de l’information véhiculée (cela peut être la bordure, la couleur d’une icône, la couleur de fond) ;

- Identifier les couleurs adjacentes qui ont un impact sur la visibilité de la ou les couleurs du composant.

- Repérer dans l’écran les composants interactifs qui peuvent avoir plusieurs états (survolés, focus, activé, coché) et pour chacun :

- Identifier quelle(s) couleur(s) du composant sont nécessaires à l’identification de la localisation et/ou de l’information véhiculée et de l’état (cela peut être la bordure, la couleur d’une icône, la couleur de fond) pour chacun des états ;

- Identifier les couleurs adjacentes qui ont un impact sur la visibilité de la ou les couleurs du composant.

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs d’avant-plan et d’arrière-plan sur le terminal mobile soit :

- En diffusant l’écran du terminal mobile sur l’ordinateur ;

- En réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Vérifier que le rapport de contraste entre les couleurs identifiées est de 3:1 au moins.

- Si c’est le cas, le critère est validé.

Note : Il est possible d’utiliser l’application Accessibility Scanner pour réaliser une évaluation rapide des contrastes des écrans. L’application ne détecte pas l’ensemble des défauts de contrastes, des tests complémentaires suivant la méthodologie décrite ci-avant seront nécessaires.'
where identifier = '2.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Vérifier que l’option Augmenter le contraste (Réglages > Accessibilité > Affichage et taille du texte > Augmenter le contraste) est désactivée.

- Repérer la présence d’un mécanisme de remplacement permettant d’afficher l’application avec un rapport de contraste suffisant.

- Vérifier qu’il n’est pas activé (c’est-à-dire que l’écran est diffusé avec les contrastes par défaut).

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs d’avant-plan et d’arrière-plan sur le terminal mobile soit :

- En diffusant l’écran du terminal mobile sur l’ordinateur ;

- En réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Si le mécanisme de remplacement est identifié par un texte, capturer les couleurs d’avant-plan et d’arrière-plan et vérifier :

- Pour les textes en taille normale, que la valeur de contraste est de 4.5:1, au moins ;

- Pour les textes en taille agrandie, que la valeur de contraste est de 3:1 au moins.

- Si le mécanisme de remplacement est identifié par un élément non textuel uniquement (une icône par exemple) :

- Identifier quelle(s) couleur(s) du composant sont nécessaires à l’identification de la localisation et/ou de l’information (cela peut être la bordure, la couleur d’une icône, la couleur de fond) ;

- Identifier les couleurs adjacentes qui ont un impact sur la visibilité de la couleur ;

- Vérifier que le rapport de contraste entre les couleurs identifiées est de 3:1 au moins.

- Si c’est le cas, le critère est validé.

[Android]

- Repérer la présence d’un mécanisme de remplacement permettant d’afficher l’application avec un rapport de contraste suffisant.

- Vérifier qu’il n’est pas activé (c’est-à-dire que l’écran est diffusé avec les contrastes par défaut).

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs d’avant-plan et d’arrière-plan sur le terminal mobile soit :

- En diffusant l’écran du terminal mobile sur l’ordinateur ;

- En réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Si le mécanisme de remplacement est identifié par un texte, capturer les couleurs d’avant-plan et d’arrière-plan et vérifier :

- Pour les textes en taille normale, que la valeur de contraste est de 4.5:1, au moins ;

- Pour les textes en taille agrandie, que la valeur de contraste est de 3:1 au moins.

- Si le mécanisme de remplacement est identifié par un élément non textuel uniquement (une icône par exemple) :

- Identifier quelle(s) couleur(s) du composant sont nécessaires à l’identification de la localisation et/ou de l’information (cela peut être la bordure, la couleur d’une icône, la couleur de fond) ;

- Identifier les couleurs adjacentes qui ont un impact sur la visibilité de la couleur ;

- Vérifier que le rapport de contraste entre les couleurs identifiées est de 3:1 au moins.

- Si c’est le cas, le critère est validé.'
where identifier = '2.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 3 · Multimédia (18 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels seulement audio qui nécessitent une transcription textuelle.

- Vérifier :

- La présence d’une transcription textuelle accessible via un composant adjacent (un bouton ou un lien) ;

- Ou la présence d’une transcription textuelle adjacente clairement identifiable.

- Si c’est le cas, le critère est validé.'
where identifier = '3.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les transcriptions textuelles des médias temporels seulement audio.

- Vérifier que chaque transcription textuelle est pertinente (toutes les informations sonores importantes sont présentes, les dialogues notamment).

- Si c’est le cas, le critère est validé.'
where identifier = '3.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels seulement vidéo qui nécessitent une transcription textuelle.

- Vérifier :

- la présence d’une version alternative audio seulement accessible via un composant adjacent (un bouton ou un lien) ;

- ou la présence d’une version alternative audio seulement adjacente ;

- ou la présence d’une transcription textuelle adjacente (un bouton ou un lien) ;

- ou la présence d’une transcription textuelle adjacente clairement identifiable ;

- ou la présence d’une audiodescription synchronisée ;

- ou la présence d’une version alternative avec une audiodescription synchronisée accessible via un composant adjacent (un bouton ou un lien).

- Si c’est le cas, le critère est validé.'
where identifier = '3.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels seulement vidéo avec une alternative (transcription textuelle ou une version audio seulement).

- Si la transcription textuelle est présente, vérifier :

- que celle-ci est pertinente (toutes les informations sonores ou visuelles importantes sont présentes, les dialogues et les textes incrustés notamment).

- Si une audiodescription est présente, vérifier :

- que celle-ci est pertinente (toutes les informations visuelles importantes sont présentes) ;

- et que celle-ci est correctement synchronisée (la bande-son de l’audiodescription coïncide correctement avec la bande vidéo).

- Si une version « audio seulement » est présente, vérifier :

- que celle-ci est pertinente (toutes les informations sonores ou visuelles importantes sont présentes, les dialogues et les textes incrustés notamment).

- Si c’est le cas, le critère est validé.'
where identifier = '3.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels synchronisés qui nécessitent une transcription textuelle.

- Vérifier :

- la présence d’une transcription textuelle adjacente clairement identifiable ;

- ou la présence d’une transcription textuelle accessible via un composant adjacent (un bouton ou un lien) ;

- ou la présence d’une audiodescription synchronisée ;

- ou la présence d’une version alternative avec une audiodescription synchronisée accessible via un composant adjacent (un bouton ou un lien).

- Si c’est le cas, le critère est validé.'
where identifier = '3.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels synchronisés avec une audiodescription ou une transcription textuelle.

- Si une audiodescription est présente, vérifier :

- que celle-ci est pertinente (toutes les informations visuelles importantes sont présentes) ;

- et que celle-ci est correctement synchronisée (la bande-son de l’audiodescription coïncide correctement avec la bande vidéo).

- Si une transcription textuelle est présente, vérifier :

- que celle-ci est pertinente (toutes les informations sonores ou visuelles importantes sont présentes, les dialogues et les textes incrustés notamment).

- Si c’est le cas, le critère est validé.'
where identifier = '3.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels synchronisés pré-enregistrés et les médias temporels synchronisés en direct qui nécessitent des sous-titres (c’est-à-dire dont la bande son apporte de l’information, comme le discours d’une personne).

- Vérifier :

- qu’il existe des sous-titres synchronisés ;

- ou qu’il existe une version alternative possédant des sous-titres synchronisés accessible via un composant adjacent (un bouton ou un lien).

- Si c’est le cas, le critère est validé.'
where identifier = '3.7' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels synchronisés pré-enregistrés et les médias temporels synchronisés en direct possédant des sous-titres.

- Vérifier que les sous-titres sont :

- pertinents (toutes les informations sonores importantes sont présentes, les dialogues notamment) ;

- dans la langue de la vidéo ;

- et correctement synchronisés. Si vous n’observez pas de décalage entre le discours oralisé et l’apparition des sous-titres, les sous-titres sont correctement synchronisés. La norme de référence spécifie que les sous-titres doivent apparaître dans les 100 ms suivant l’horodatage du sous-titre.

- Si c’est le cas, le critère est validé.'
where identifier = '3.8' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels pré-enregistrés seulement vidéo et synchronisés qui nécessitent une audiodescription.

- Vérifier :

- la présence d’une audiodescription synchronisée ;

- ou la présence d’une version alternative avec une audiodescription synchronisée adjacente ou accessible via un composant adjacent (un bouton ou un lien).

- Si c’est le cas, le critère est validé.'
where identifier = '3.9' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels seulement vidéo ou synchronisé avec une audiodescription.

- Vérifier que l’audiodescription est :

- pertinente (toutes les informations visuelles importantes sont présentes) ;

- correctement synchronisée :

- les sons et paroles de l’audiodescription ne chevauchent pas ceux de la bande-son originale pour provoquer des problèmes de perception et de compréhension ;

- les informations véhiculées dans l’audiodescription sont données au moment où apparaissent les informations visuelles équivalentes.

- Si c’est le cas, le critère est validé.'
where identifier = '3.10' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels seulement vidéo, audio ou synchronisés pré-enregistrés.

- Vérifier :

- qu’un passage de texte (un titre ou un paragraphe par exemple), permettant d’identifier le média temporel, le précède ou le suit immédiatement ;

- que le passage de texte est situé à l’extérieur du lecteur de contenu multimédia.

- Si c’est le cas, le critère est validé.'
where identifier = '3.11' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Au chargement de l’écran, si un son se déclenche automatiquement, vérifier :

- que la séquence sonore a une durée inférieure ou égale à 3 secondes ;

- ou qu’un dispositif (un bouton par exemple), sur l’élément ayant déclenché le son, ou dans l’écran, permet de le stopper ;

- ou que le volume de la séquence peut être contrôlé par l’utilisateur, indépendamment du contrôle de volume du système.

- Si c’est le cas, le critère est validé.'
where identifier = '3.12' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels pré-enregistrés.

- Vérifier que les fonctionnalités suivantes au moins sont présentes :

- une fonctionnalité de lecture ;

- une fonctionnalité de mise en pause ou d’arrêt ;

- si le média possède une piste sonore, une fonctionnalité qui permet d’activer et désactiver le son ;

- Si le média possède une audiodescription, vérifier qu’il existe une fonctionnalité qui permet d’activer et désactiver l’audiodescription.

- Si le média possède des sous-titres synchronisés :

- s’il s’agit de sous-titres incrustés (open captions) en tant qu’image, vérifier qu’ils sont affichés au lancement de la lecture de la vidéo ;

- s’il s’agit de sous-titres non incrustés (closed captions) , vérifier qu’il existe une fonctionnalité qui permet d’activer et désactiver ces sous-titres.

- Si c’est le cas, le critère est validé.'
where identifier = '3.13' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels synchronisés pré-enregistrés avec une piste de sous-titres synchronisés ou une audiodescription.

- Vérifier qu’il est possible d’activer et désactiver les sous-titres ou l’audiodescription sans étape supplémentaire par rapport aux fonctionnalités principales (lecture, pause…).

- Si c’est le cas, le critère est validé.

Exemple : Si le bouton de lecture peut être activé depuis l’interface par un simple tap (sans la nécessité d’activer un premier composant pour afficher un menu déroulant par exemple), la fonction de sous-titres doit être disponible de manière équivalente, avec un simple tap. À l’inverse, si la fonction des sous-titres est disponible depuis un menu déroulant qui doit être activé au préalable (par un tap par exemple), elle ne sera pas considérée comme étant au même niveau puisqu’il y aura une étape supplémentaire à réaliser.

Note : Bien que les contrôles de volume et de lecture puissent être des composants physiques des terminaux (boutons de volume d’un smartphone par exemple), il n’est pas requis que ces terminaux possèdent des contrôles physiques dédiés à l’activation des sous-titres et de l’audiodescription ou que ces contrôles, s’ils existent, soient situés au même niveau.'
where identifier = '3.14' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer les fonctionnalités qui permettent de transmettre (envoyer un contenu vers un autre terminal ou envoyer une vidéo par e-mail par exemple), convertir (convertir une vidéo au format .avi dans un format .mpg par exemple) ou enregistrer un média temporel synchronisé pré-enregistré (enregistrer une vidéo depuis une plateforme de diffusion sur son ordinateur personnel par exemple).

- Exécuter chacune des fonctionnalités (transmettre, convertir et enregistrer).

- Pour chaque fonctionnalité, vérifier si les sous-titres :

- sont toujours présents ;

- peuvent être affichés ;

- sont correctement synchronisés ;

- conservent leurs caractéristiques essentielles (par exemple, si les sous-titres étaient colorés en fonction du locuteur, les couleurs doivent être reprises).

- Si c’est le cas, le critère est validé.'
where identifier = '3.15' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer les fonctionnalités qui permettent de transmettre, convertir ou enregistrer un média temporel synchronisé. Par exemple : envoyer un contenu vers un autre terminal ou par mail, convertir une vidéo au format .avi dans un format .mpg, enregistrer une vidéo depuis une plateforme de diffusion sur son ordinateur personnel.

- Exécuter chacune des fonctionnalités (transmettre, convertir et enregistrer).

- Pour chaque fonctionnalité, vérifier si l’audiodescription :

- est présente ;

- peut être activée ;

- est correctement synchronisée :

- les sons et paroles de l’audiodescription ne chevauchent pas ceux de la bande-son originale et ne provoquent pas de problèmes de perception et de compréhension ;

- les informations véhiculées dans l’audiodescription sont données au moment où apparaissent les informations visuelles équivalentes.

- Si c’est le cas, le critère est validé.'
where identifier = '3.16' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Repérer dans l’écran les médias temporels pré-enregistrés qui possèdent des sous-titres.

- Modifier les paramètres de présentation des sous-titres depuis la plateforme :

- Aller dans Réglages > Accessibilité > Sous-titres codés et SM > Style ;

- Sélectionner Créer un style pour définir un style de sous-titres personnalisé et reconnaissable.

- Vérifier que le paramètre Ignorer les réglages personnalisés en bas d’écran est désactivé.

- Définir un ou plusieurs paramètres de présentation des sous-titres depuis les options de personnalisation mises à disposition par la plateforme, par exemple : la taille des sous-titres, la couleur, le style de bordure des sous-titres, la couleur d’arrière-plan, l’opacité de l’arrière-plan, etc. (Note : la norme ne donne pas la liste précise des paramètres qu’il est obligatoire de pouvoir définir, aussi, la possibilité de modifier une seule caractéristique des sous-titres est suffisante pour rendre le critère conforme).

- Vérifier que les paramètres définis au niveau de la plateforme sont appliqués aux sous-titres.

- Sinon, repérer dans l’écran la présence d’une fonctionnalité permettant de modifier les paramètres de présentation des sous-titres (dans l’écran ou directement depuis le lecteur multimédia).

- Vérifier que les paramètres définis sont appliqués aux sous-titres.

- Si c’est le cas, le critère est validé.

[Android]

- Repérer dans l’écran les médias temporels pré-enregistrés qui possèdent des sous-titres.

- Modifier les paramètres de présentation des sous-titres depuis la plateforme :

- Aller dans Paramètres > Accessibilité > Préférence pour les sous-titres > Style et taille des sous-titres ;

- Définir un ou plusieurs paramètres de présentation des sous-titres depuis les options de personnalisation mises à disposition par la plateforme, par exemple : la taille des sous-titres, la couleur, le style de bordure des sous-titres, la couleur d’arrière-plan, l’opacité de l’arrière-plan, etc. (Note : la norme ne donne pas la liste précise des paramètres qu’il est obligatoire de pouvoir définir, aussi, la possibilité de modifier une seule caractéristique des sous-titres est suffisante pour rendre le critère conforme).

- Vérifier que les paramètres définis au niveau de la plateforme sont appliqués aux sous-titres.

- Sinon, repérer dans l’écran la présence d’une fonctionnalité permettant de modifier les paramètres de présentation des sous-titres (dans l’écran ou directement depuis le lecteur multimédia).

- Vérifier que les paramètres définis sont appliqués aux sous-titres.

- Si c’est le cas, le critère est validé.'
where identifier = '3.17' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les médias temporels synchronisés pré-enregistrés avec des sous-titres de traduction.

- Vérifier la présence d’une piste sonore qui serait la version vocalisée des sous-titres de traduction :

- activer la piste sonore ;

- vérifier que les sous-titres vocalisés correspondent aux sous-titres affichés.

- Sinon :

- vérifier la présence d’une fonctionnalité qui permet de vocaliser des sous-titres ;

- activer la fonctionnalité ;

- lancer la lecture du contenu multimédia ;

- vérifier que les textes affichés par ce moyen sont vocalisés.

- Sinon :

- activer le lecteur d’écran et naviguer jusqu’au lecteur multimédia ;

- activer les sous-titres de traduction ;

- vérifier que les sous-titres vocalisés correspondent aux sous-titres affichés.

- Sinon :

- activer le lecteur d’écran et naviguer jusqu’au lecteur multimédia ;

- activer les sous-titres de traduction dans le lecteur multimédia et lancer la vidéo ;

- vérifier que les sous-titres affichés sont restitués par le lecteur d’écran.

- Sinon :

- rechercher la présence d’un média alternatif dont la bande son contient les sous-titres de traduction vocalisés ;

- vérifier que les sous-titres affichés sont restitués par le lecteur d’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '3.18' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 4 · Tableaux (5 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les tableaux de données complexes.

- Activer le lecteur d’écran.

- Vérifier :

- qu’un résumé est restitué lorsque le lecteur d’écran atteint le tableau ;

- ou qu’un résumé est disponible avant le tableau, sous la forme d’un texte précédant le tableau.

- Si c’est le cas, le critère est validé.'
where identifier = '4.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Vérifier que chaque résumé de tableau est pertinent, c’est-à-dire qu’il permet de comprendre la nature des données et la construction du tableau.

- Si c’est le cas, le critère est validé.'
where identifier = '4.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les tableaux de données.

- Activer le lecteur d’écran.

- Vérifier qu’un titre est restitué lorsque le lecteur d’écran atteint le tableau.

- Si c’est le cas, le critère est validé.'
where identifier = '4.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Vérifier que chaque titre de tableau de données est pertinent, c’est-à-dire qu’il permet d’identifier la nature des données présentées dans le tableau.

- Si c’est le cas, le critère est validé.'
where identifier = '4.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les tableaux de données.

- Activer le lecteur d’écran et parcourir les cellules de données.

- Vérifier que les entêtes sont correctement restitués.

- Si c’est le cas, le critère est validé.'
where identifier = '4.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 5 · Composants interactifs (5 critères)
-- ============================================================================

update public.criteria set methodology = 'Le test le plus complet est un test de restitution avec un lecteur d’écran. En effet, tous les éléments à évaluer, s’ils sont présents, sont restitués par les lecteurs d’écran. D’autres tests avec d’autres technologies d’assistance peuvent être nécessaires pour s’assurer de la compatibilité. Plusieurs méthodes d’évaluation plus ou moins complètes vous sont décrites.

Plusieurs méthodes sont disponibles avec iOS, mais seul le test avec VoiceOver est le test qui permet d’évaluer l’ensemble des éléments demandé par le critère.

De plus, il n’existe pas comme pour le web de documentation technique permettant de décrire le fonctionnement et les implémentations attendues (par exemple pour les fenêtres modales ou les potentiomètres). En l’absence d’une telle documentation, afin d’évaluer au plus juste ce type de composant il est conseillé tout de même de se rapprocher :

- de ce que décrit la spécification ARIA pour les modèles de conception ;

- des documentations des éditeurs de plateformes dédiées aux développeurs.

[iOS avec VoiceOver]

- Activer le lecteur d’écran.

- Repérer dans l’écran les composants interactifs (par exemple, bouton, lien).

- Accéder à chaque composant interactif en utilisant les gestes du lecteur d’écran.

- Vérifier :

- qu’un rôle est restitué (par exemple, bouton, zone de modification, lien) ;

- que le rôle restitué est pertinent au regard de la fonctionnalité associée (par exemple, un composant qui déclenche l’ouverture d’une fenêtre modale et qui est restitué « zone de modification » a un rôle non pertinent, il devrait être identifié comme un bouton) ;

- qu’un nom est restitué et que ce nom est pertinent, c’est-à-dire qu’il permet de comprendre la fonction de l’élément (pour les champs de formulaire, on se reportera à la thématique « Formulaires » pour les évaluer) ;

- que si le composant possède un nom visible (un texte visible), l’intitulé est restitué ;

- que si le composant a un état perceptible (activé, désactivé, sélectionné), cet état est restitué ;

- que si le composant peut changer d’état (par exemple bouton à bascule, potentiomètre), réaliser les actions nécessaires pour tester les différents états et vérifier que chaque changement d’état est correctement restitué (le passage à l’état sélectionné, l’augmentation du potentiomètre) ;

- que si le composant a une valeur perceptible (valeur d’un potentiomètre), cette valeur est restituée.

- Si c’est le cas, le critère est validé.

[iOS Avec Accessibility Inspector]

- Connecter le terminal mobile iOS à l’ordinateur avec macOS.

- Activer le logiciel Accessibility Inspector.

- Choisir le terminal mobile comme source et rester sur l’onglet « Inspection » (boutons en haut à droite).

- Avec les flèches de Accessibility Inspector, accéder à chaque élément de l’interface.

- Vérifier :

- qu’un rôle est disponible dans le paramètre « Traits » (par exemple, Bouton, Tab, Text Field) ;

- que le rôle est pertinent au regard de la fonctionnalité associée (par exemple, un composant qui déclenche l’ouverture d’une fenêtre modale et qui est présenté comme Static text a un rôle non pertinent, il devrait être identifié comme un bouton) ;

- qu’un nom est disponible dans le paramètre « Label » et que ce nom est pertinent, c’est-à-dire qu’il permet de comprendre la fonction de l’élément (pour les champs de formulaire, on se reportera à la thématique « Formulaires » pour les évaluer) ;

- que si le composant possède un nom visible (un texte visible), l’intitulé défini dans le paramètre « Label » contient au moins cet intitulé.

- Si le composant a un état perceptible (activé, désactivé, sélectionné), vérifier que cet état :

- est disponible dans le paramètre « Traits » ;

- ou est indiqué dans le paramètre « Label ».

- Si le composant peut changer d’état (par exemple bouton à bascule, potentiomètre), réaliser les actions nécessaires pour tester les différents états et vérifier que chaque changement d’état (le passage à l’état sélectionné, l’augmentation du potentiomètre) :

- est disponible dans le paramètre « Traits » ;

- ou est indiqué dans le paramètre « Label ».

- Si c’est le cas, le critère est validé.

[iOS Avec le contrôle vocal]

L’application de contrôle vocal permet aux utilisateurs de naviguer à la voix.

Le critère 5.1 dans sa globalité ne peut pas être évalué avec le contrôle vocal, mais une fonctionnalité du contrôle vocal (l’affichage des libellés) permet d’avoir une vue d’ensemble rapide de l’état des composants interactifs.

Le contrôle vocal va permettre de déceler les composants utilisables au toucher qui ne sont pas des composants interactifs détectables par les technologies d’assistance, la présence d’un intitulé et sa pertinence, et la présence du nom visible dans le nom accessible.

- Activer le contrôle vocal : Réglages > Accessibilité > Contrôle vocal.

- Afficher les libellés des composants interactifs : depuis l’écran de paramètres du contrôle vocal, atteindre le bouton « Superposition » et l’activer, puis choisir « Noms des éléments ».

- Dorénavant, lorsque le contrôle vocal sera activé, des infobulles grises apparaîtront au-dessus des éléments interactifs qui ont des labels. À noter que si l’écran possède un très grand nombre de contrôles interactifs, les labels s’afficheront par groupes successifs (un groupe de label disparaît et un autre apparaît).

Ce qu’il faut savoir : seuls les éléments qui ont des rôles interactifs reconnus par l’API d’accessibilité posséderont un label. Ceci va permettre de repérer rapidement quels éléments utilisables au toucher ne sont pas reconnus par le contrôle vocal et ne sont donc pas des éléments interactifs (ce qui constitue une non-conformité).

Procédure :

- Repérer dans l’écran tous les contrôles interactifs (activables au toucher).

- Activer le contrôle vocal et vérifier que tous les contrôles interactifs identifiés possèdent un label associé (infobulle grise).

- Si c’est le cas, vérifier que :

- le label associé est pertinent ;

- et que le nom visible (s’il en possède un) est compris dans ce label.

- Si c’est le cas, les conditions sur la pertinence de l’intitulé et la présence du nom visible dans le nom accessible sont remplies.

[Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les composants interactifs (par exemple, bouton, lien).

- Accéder à chaque composant interactif avec les gestes du lecteur d’écran.

- Vérifier :

- qu’un rôle est restitué (par exemple, bouton, zone de modification, lien) ;

- que le rôle restitué est pertinent au regard de la fonctionnalité associée (par exemple, un composant qui déclenche l’ouverture d’une fenêtre modale et qui est restitué « zone de modification » a un rôle non pertinent, il devrait être identifié comme un bouton) ;

- qu’un nom est restitué et que ce nom est pertinent, c’est-à-dire qu’il permet de comprendre la fonction de l’élément (pour les champs de formulaire, on se reportera à la thématique « Formulaires » pour les évaluer) ;

- que si le composant possède un nom visible (un texte visible), l’intitulé est restitué ;

- que si le composant a un état perceptible (activé, désactivé, sélectionné), cet état est restitué ;

- que si le composant peut changer d’état (par exemple bouton à bascule, potentiomètre), réaliser les actions nécessaires pour tester les différents états et vérifier que chaque changement d’état est correctement restitué (le passage à l’état sélectionné, l’augmentation du potentiomètre) ;

- que si le composant a une valeur perceptible (valeur d’un potentiomètre), cette valeur est restituée.

- Si c’est le cas, le critère est validé.'
where identifier = '5.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = 'Il s’agit ici de s’assurer que le composant peut être utilisé par le lecteur d’écran, le contrôle vocal, un clavier externe ou tout autre commutateur externe. On peut limiter les tests à quelques dispositifs de pointage puisque les caractéristiques nécessaires (sur les composants interactifs) sont semblables.

Il est néanmoins nécessaire de tester au moins avec le lecteur d’écran et un clavier externe.

Pour le clavier externe, certains paramétrages sont nécessaires pour que le périphérique soit pleinement fonctionnel.

[iOS et Android]

- Activer le lecteur d’écran.

- Parcourir l’ensemble des composants interactifs.

- Vérifier :

- qu’il peut être atteint avec le lecteur d’écran ;

- qu’il peut être activé avec le lecteur d’écran.

- Si c’est un composant modifiable (champ de saisie, case à cocher, potentiomètre), vérifier qu’il peut être modifié avec le lecteur d’écran.

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Parcourir l’ensemble des composants interactifs.

- Vérifier :

- qu’il peut être atteint avec les touches du clavier ;

- qu’il peut être activé avec la touche dédiée du clavier.

- Si c’est un composant modifiable (champ de saisie, case à cocher, potentiomètre), vérifier qu’il peut être modifié avec les touches du clavier.

- Si c’est le cas, le critère est validé.'
where identifier = '5.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran tous les événements qui initient un changement de contexte, par exemple :

- une mise à jour dynamique de champs de formulaire ;

- l’ouverture d’une nouvelle page sur la sélection d’une entrée de liste ;

- la mise à jour d’une partie essentielle de l’écran sans action de l’utilisateur ;

- le lancement automatique d’un lecteur vidéo sur la sélection d’une playlist ;

- la manipulation du focus ayant pour résultat de modifier la position courante de l’utilisateur dans l’écran.

- Vérifier :

- que l’utilisateur est averti par un texte du type de changement avant son déclenchement ;

- ou que le changement de contexte est initié par un bouton ou un lien explicite.

- Si c’est le cas, le critère est validé.'
where identifier = '5.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Réaliser les actions nécessaires à l’apparition d’un message de statut par exemple :

- remplir correctement un formulaire et le valider pour faire apparaître un message indiquant l’envoi avec succès ;

- soumettre un formulaire avec des champs obligatoires sans saisie pour faire apparaître un message indiquant la présence d’erreurs ;

- afficher un écran qui nécessite un certain temps de chargement pour faire apparaître un message de progression ou un indicateur de progression de chargement.

- Vérifier que lorsque le statut apparaît, le lecteur d’écran restitue l’information et que cette information est compréhensible.

- Si c’est le cas, le critère est validé.'
where identifier = '5.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les contrôles à bascule (boutons avec un ou plusieurs états, par exemple, cases à cocher, bouton radio, switch).

- Vérifier qu’il est possible de déterminer l’état du contrôle sur la base de sa présentation dans l’interface (par exemple, un changement de forme lorsque le contrôle passe d’un état à l’autre).

- Activer le lecteur d’écran et naviguer jusqu’au contrôle.

- Vérifier que l’état du contrôle est restitué par le lecteur d’écran sans avoir à interagir avec le contrôle.

- Si c’est le cas, le critère est validé.'
where identifier = '5.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 6 · Éléments obligatoires (2 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS]

- Aller dans Réglages > Accessibilité > VoiceOver > Parole et activer le paramètre « Détecter les langues ».

- Activer le lecteur d’écran et parcourir l’ensemble des éléments de l’écran.

- Vérifier que le texte est restitué dans la langue principale de l’écran.

- Si c’est le cas, le critère est validé.

[Android]

- Aller dans Paramètres > Accessibilité > TalkBack > Paramètres > Synthèse vocale (selon la version de la plateforme, le chemin d’accès peut être différent) :

- Vérifier que le paramètre « Moteur préféré » est « Synthèse vocale Google » ;

- Activer les paramètres de la synthèse (bouton à droite de « Moteur préféré ») et vérifier que le paramètre « Détection de la langue » est sur « Forcée ».

- Activer le lecteur d’écran et parcourir l’ensemble des éléments de l’écran.

- Vérifier que les textes sont restitués dans la langue principale de l’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '6.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = 'Dans ce critère, on ne contrôle que les éléments qui ne doivent pas être interactifs (les éléments texte, les tableaux par exemple).

[iOS avec VoiceOver]

- Activer le lecteur d’écran et parcourir l’ensemble des éléments de l’écran.

- Vérifier que le rôle restitué par le lecteur d’écran correspond à la nature de l’élément (par exemple, lorsque le lecteur d’écran atteint ce qui apparaît comme un paragraphe et qu’il restitue « Bouton », il s’agit d’une erreur, aucun rôle n’est restitué sur les paragraphes).

- Si c’est le cas, le critère est validé.

[iOS Avec Accessibility Inspector]

- Connecter le terminal mobile iOS à l’ordinateur avec macOS.

- Activer le logiciel Accessibility Inspector.

- Choisir le terminal mobile comme source et rester sur l’onglet « Inspection » (boutons en haut à droite).

- Avec les flèches de Accessibility Inspector, accéder à chaque élément de l’interface.

- Vérifier que le rôle disponible dans le paramètre « Traits » est pertinent au regard de la nature de l’élément associé (par exemple, un simple texte qui aurait un rôle de bouton serait considéré non conforme, il devrait être identifié comme un texte statique).

- Si c’est le cas, le critère est validé.

[Android]

- Activer le lecteur d’écran et parcourir l’ensemble des éléments de l’écran.

- Vérifier que le rôle restitué par le lecteur d’écran correspond à la nature de l’élément (par exemple, lorsque le lecteur d’écran atteint ce qui apparaît comme un paragraphe et qu’il restitue « Bouton », il s’agit d’une erreur, aucun rôle n’est restitué sur les paragraphes).

- Si c’est le cas, le critère est validé.'
where identifier = '6.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 7 · Structuration de l'information (2 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS avec VoiceOver]

- Activer le lecteur d’écran.

- Utiliser le rotor et sélectionner « En-têtes ».

- Parcourir les entêtes en glissant un doigt vers le haut ou vers le bas.

- Vérifier :

- que chaque texte qui structure l’écran peut être atteint ;

- que chaque entête atteint est pertinent, c’est-à-dire :

- que le titre est utile à la structuration de l’écran ;

- que le texte contenu dans le titre permet de comprendre le contenu de la section titrée.

- Si c’est le cas, le critère est validé.

[iOS avec Accessibility Inspector]

- Connecter le terminal mobile iOS à l’ordinateur avec macOS.

- Activer le logiciel Accessibility Inspector.

- Choisir le terminal mobile comme source et rester sur l’onglet « Inspection » (boutons en haut à droite).

- Avec les flèches de Accessibility Inspector, accéder à chaque élément de l’interface.

- Vérifier :

- que pour chaque texte qui structure l’écran, le paramètre « Traits » contient la valeur « En-têtes » ;

- que chaque texte dont le paramètre « Traits » contient la valeur « En-têtes » est pertinent, c’est-à-dire :

- que le titre ainsi déclaré est utile à la structuration de l’écran ;

- que le texte contenu dans le titre permet de comprendre le contenu de la section ainsi titrée.

- Si c’est le cas, le critère est validé.

[Android]

- Activer le lecteur d’écran.

- Utiliser le menu des commandes de lecture et sélectionner « Titres ».

- Parcourir les titres en glissant un doigt vers le haut ou vers le bas.

- Vérifier :

- que chaque texte qui structure l’écran est atteint de cette manière et est restitué comme titre ;

- que chaque titre atteint est pertinent, c’est-à-dire :

- que le titre est utile à la structuration de l’écran ;

- que le texte contenu dans le titre permet de comprendre le contenu de la section ainsi titrée.

- Si c’est le cas, le critère est validé.'
where identifier = '7.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les éléments regroupés visuellement sous forme de liste.

- Vérifier que le lecteur d’écran restitue « Liste » lorsqu’il atteint le groupe d’éléments.

- Si c’est le cas, le critère est validé.'
where identifier = '7.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 8 · Présentation de l'information (7 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Parcourir l’ensemble des éléments en utilisant les gestes du lecteur d’écran.

- Vérifier que l’ensemble des informations visibles à l’écran sont restituées par le lecteur d’écran.

- Si c’est le cas, le critère est validé.

Note : Dans les applications, il est possible de réaliser des regroupements d’éléments. Par exemple, dans un catalogue de produits, chaque item possède un titre, un prix et une description. Au lieu de prendre le focus avec le lecteur d’écran sur chacun des 3 items, l’application peut être conçue pour que le lecteur d’écran accède seulement à l’item dans sa globalité, ainsi le lecteur d’écran restitue l’ensemble des informations sans que l’utilisateur ait à réaliser plusieurs gestes pour atteindre les 3 items. Ceci est conforme (voire encouragé puisque cela limite les actions à réaliser pour parcourir le contenu), il faut s’assurer que tous les textes contenus sont bien restitués par le lecteur d’écran.'
where identifier = '8.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Accéder aux paramètres de réglages des tailles de caractères de la plateforme : Réglages > Accessibilité > Affichage et taille du texte > Police plus grande.

- Activer le bouton « Taille de police plus grande ».

- Ouvrir le centre de contrôle et activer le paramètre « Taille du texte » (bouton « aA ») pour afficher la jauge des tailles de police. Augmenter la valeur pour atteindre le palier 190%.

- Si nécessaire, redémarrer l’application pour s’assurer que le paramètre est pris en compte par l’application.

- Vérifier :

- que tous les textes de l’interface ont été agrandis ;

- que tous les textes de l’interface restent lisibles et les fonctionnalités utilisables ;

- que des contenus ne disparaissent pas ;

- si des textes ne sont pas agrandis ou ont disparu, qu’il existe une méthode dans l’écran pour afficher les textes à la demande (par exemple avec l’appui prolongé sur une icône).

- Si c’est le cas, le critère est validé.

[Android]

- Accéder aux paramètres de réglages des tailles de caractères de la plateforme : Paramètres > Accessibilité > Taille de la police (selon la version de la plateforme, le chemin d’accès peut être différent) ;

- Augmenter la valeur de la taille de la police (potentiomètre en bas de l’écran) au maximum (voir note technique).

- Si nécessaire, redémarrer l’application pour s’assurer que le paramètre est pris en compte par l’application.

- Vérifier :

- que tous les textes de l’interface ont été agrandis ;

- que tous les textes de l’interface restent lisibles et les fonctionnalités utilisables ;

- que des contenus ne disparaissent pas ;

- si des textes ne sont pas agrandis ou ont disparu, qu’il existe une méthode dans l’écran pour afficher les textes à la demande (par exemple avec l’appui prolongé sur une icône).

- Si c’est le cas, le critère est validé.

Note technique : Avant Android 14, sur les terminaux sans surcouche constructeur, le paramètre de taille de la police ne permet pas d’agrandir à 200% de la taille par défaut. Ce n’est qu’à partir d’Android 14 que cela est rendu possible. Si vous testez sur un terminal Android avec une version antérieure à 14, vous pouvez cumuler le paramètre de taille de la police et le paramètre de la taille de l’affichage pour atteindre un zoom approchant des 200%. À partir d’Android 14, le paramètre de taille de la police vous permet d’atteindre les 200%. À l’inverse, sur certaines versions d’Android, la jauge du potentiomètre peut être différente et offrir des valeurs qui permettent d’atteindre un zoom supérieur à 200%, il faudra alors vérifier que le test ne se fait que pour une valeur de 200%.'
where identifier = '8.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Activer l’option Différencier sans couleur (Réglages > Accessibilité > Affichage et taille du texte > Différencier sans couleur).

- Activer l’option Augmenter le contraste (Réglages > Accessibilité > Affichage et taille du texte > Augmenter le contraste) ou s’il est présent dans l’application, activer le mécanisme de remplacement permettant d’afficher l’application avec un rapport de contraste suffisant.

- Repérer dans l’écran les composants d’interface (liens, boutons) avec du texte intégrés dans un environnement de texte (dans une phrase par exemple), signifiés uniquement par la couleur (sans autre mise en forme qui les distingue du reste du texte dans lequel ils sont intégrés).

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs du texte environnant et du composant interactif sur le terminal mobile, soit :

- en diffusant l’écran du terminal mobile sur l’ordinateur ;

- en réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Vérifier que le contraste entre la couleur de police du composant et la couleur de police du texte environnant est de 3:1, au moins.

- Si c’est le cas, le critère est validé.

[Android]

- S’il existe dans l’application, activer le mécanisme de remplacement permettant d’afficher l’application avec un rapport de contraste suffisant.

- Repérer dans l’écran les composants d’interface (liens, boutons) avec du texte intégrés dans un environnement de texte (dans une phrase par exemple) signifiés uniquement par la couleur (sans autre mise en forme qui les distingue du reste du texte dans lequel ils sont intégrés).

- Activer le logiciel Colour Contrast Analyser sur l’ordinateur et capturer les couleurs du texte environnant et du composant interactif sur le terminal mobile, soit :

- en diffusant l’écran du terminal mobile sur l’ordinateur ;

- en réalisant des captures d’écran des éléments à évaluer (et en les important sur l’ordinateur).

- Vérifier que le contraste entre la couleur de police du composant et la couleur de police du texte environnant est de 3:1, au moins.

- Si c’est le cas, le critère est validé.'
where identifier = '8.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les composants d’interface (liens, boutons) avec du texte intégrés dans un environnement de texte (dans une phrase par exemple), signifiés uniquement par la couleur (sans autre mise en forme qui les distingue du reste du texte dans lequel ils sont intégrés).

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Vérifier que la visibilité du focus telle que définie au niveau du système est préservée sur ces éléments.

- Connecter une souris.

- Vérifier que le survol des composants interactifs en environnement de texte est signifié par un autre moyen que la couleur (mise en gras, soulignement par exemple).

- Si c’est le cas, le critère est validé.'
where identifier = '8.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Activer tous les paramètres disponibles de style de focus.

- Naviguer au clavier dans l’application et vérifier si la visibilité du focus telle que définie au niveau du système est préservée sur l’ensemble des éléments de l’application.

- Si c’est le cas, le critère est validé.

[Android]

- Connecter un clavier externe et paramétrer la navigation au clavier.

- Naviguer au clavier dans l’application et vérifier :

- si le test est réalisé sans activation d’un service d’accessibilité, que le focus est visible ;

- si le test est réalisé avec l’activation d’un service d’accessibilité, que le focus tel que défini dans le service est visible sur l’ensemble des éléments de l’application.

- Si c’est le cas, le critère est validé.'
where identifier = '8.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les informations données par la forme, la taille ou la position dans un texte, un élément graphique, un média temporel ou non temporel. Ce peut être une icône positionnée à gauche d’un composant pour signifier qu’il est actif, ou une consigne dans l’écran qui demande d’activer un composant positionné à un certain endroit dans l’écran.

- Vérifier qu’il existe un autre moyen de récupérer cette information dans l’écran (par exemple, un texte lisible par tous qui donne la même information).

- Si ce n’est pas le cas, activer le lecteur d’écran et vérifier qu’une information alternative à la forme, la taille ou la position et restituée par le lecteur d’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '8.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Parcourir l’écran et repérer les contenus additionnels qui apparaissent à la prise de focus sur un composant d’interface.

- Vérifier que le contenu additionnel peut être masqué par une touche du clavier (la touche ESC par exemple).

- Vérifier que le contenu additionnel reste visible :

- jusqu’à ce que le focus soit déplacé en dehors du composant d’interface et du contenu additionnel ;

- ou tant que le focus est positionné sur le composant d’interface ou dans le contenu additionnel ;

- ou tant que le contenu additionnel est valide.

- Connecter une souris.

- Balayer l’écran avec la souris et repérer les contenus additionnels qui apparaissent au survol d’un composant d’interface.

- Vérifier que le contenu additionnel peut être survolé par la souris.

- Vérifier que le contenu additionnel reste visible :

- jusqu’à ce que le pointeur de la souris soit déplacé en dehors du composant d’interface et du contenu additionnel ;

- ou tant que le pointeur de la souris survole le composant d’interface ou le contenu additionnel ;

- ou tant que le contenu additionnel est valide.

- Si c’est le cas, le critère est validé.

[Android]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Parcourir l’écran et repérer les contenus additionnels qui apparaissent à la prise de focus sur un composant d’interface.

- Vérifier que le contenu additionnel peut être masqué par une touche du clavier (généralement la touche ou la combinaison de touches qui aura été associée dans Switch Access pour le paramètre Retour)

- Vérifier que le contenu additionnel reste visible :

- jusqu’à ce que le focus soit déplacé en dehors du composant d’interface et du contenu additionnel ;

- ou tant que le focus est positionné sur le composant d’interface ou dans le contenu additionnel ;

- ou tant que le contenu additionnel est valide.

- Connecter une souris.

- Balayer l’écran avec la souris et repérer les contenus additionnels qui apparaissent au survol d’un composant d’interface.

- Vérifier que le contenu additionnel peut être survolé par la souris.

- Vérifier que le contenu additionnel reste visible :

- jusqu’à ce que le pointeur de la souris soit déplacé en dehors du composant d’interface et du contenu additionnel ;

- ou tant que le pointeur de la souris survole le composant d’interface ou le contenu additionnel ;

- ou tant que le contenu additionnel est valide.

- Si c’est le cas, le critère est validé.'
where identifier = '8.7' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 9 · Formulaires (12 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les champs de formulaire (champ de saisie, bouton radio, case à cocher).

- Vérifier la présence d’une étiquette visible adjacente.

- Activer le champ de formulaire (par exemple, saisir du texte).

- Vérifier que l’étiquette reste visible.

- Si c’est le cas, le critère est validé.'
where identifier = '9.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS avec VoiceOver]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux éléments de formulaire en utilisant les gestes du lecteur d’écran.

- Vérifier qu’une étiquette est restituée lorsque le focus du lecteur d’écran est sur le champ de formulaire.

- Si c’est le cas, le critère est validé.

[iOS avec le contrôle vocal]

- Activer le contrôle vocal.

- Repérer dans l’écran tous les champs de formulaire.

- Vérifier qu’une étiquette est détectée par le contrôle vocal (apparition d’une infobulle grise au-dessus du champ).

- Si c’est le cas, le critère est validé.

[Android]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux éléments de formulaire en utilisant les gestes du lecteur d’écran.

- Vérifier qu’une étiquette est restituée lorsque le focus du lecteur d’écran est sur le champ de formulaire.

- Si c’est le cas, le critère est validé.'
where identifier = '9.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS avec VoiceOver]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux éléments de formulaire en utilisant les gestes du lecteur d’écran.

- Vérifier :

- que l’étiquette restituée par le lecteur d’écran est pertinente (elle permet de comprendre la nature de la saisie attendue) ;

- que l’étiquette visible est contenue dans l’étiquette restituée par le lecteur d’écran.

- Si c’est le cas, le critère est validé.

[Avec le contrôle vocal]

- Activer le contrôle vocal.

- Repérer dans l’écran tous les champs de formulaire.

- Vérifier :

- que l’étiquette détectée par le contrôle vocal (infobulle grise) est pertinente (elle permet de comprendre la nature de la saisie attendue) ;

- que l’étiquette visible est contenue dans l’étiquette détectée par le contrôle vocal (infobulle grise).

- Si c’est le cas, le critère est validé.

[Android]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux éléments de formulaire en utilisant les gestes du lecteur d’écran.

- Vérifier :

- que l’étiquette restituée par le lecteur d’écran est pertinente (elle permet de comprendre la nature de la saisie attendue) ;

- que l’étiquette visible est contenue dans l’étiquette restituée par le lecteur d’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '9.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran tous les champs de formulaire.

- Pour chaque champ de formulaire, vérifier que l’étiquette visible est accolée au champ auquel elle est liée.

- Si c’est le cas, le critère est validé.'
where identifier = '9.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '2 méthodes d’évaluation sur iOS sont proposées. Les deux méthodes aboutissent aux mêmes résultats. Une seule de ces méthodes est nécessaire pour évaluer le critère sur iOS.

[iOS avec VoiceOver]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux boutons de formulaire en utilisant les gestes du lecteur d’écran.

- Vérifier :

- que l’intitulé restitué par le lecteur d’écran est pertinent (il permet de comprendre l’action du bouton) ;

- que l’intitulé visible est contenu dans l’intitulé restitué par le lecteur d’écran.

- Si c’est le cas, le critère est validé.

[iOS avec le contrôle vocal]

- Activer le contrôle vocal.

- Repérer dans l’écran les boutons de formulaire.

- Vérifier :

- que l’intitulé détecté par le contrôle vocal (infobulle grise) est pertinent (il permet de comprendre l’action du bouton) ;

- que l’intitulé visible est contenu dans l’intitulé détecté par le contrôle vocal (infobulle grise) ;

- Si c’est le cas, le critère est validé.

[Android]

- Activer le lecteur d’écran.

- Naviguer jusqu’aux boutons de formulaire en utilisant les gestes du lecteur d’écran.

- Vérifier :

- que l’intitulé restitué par le lecteur d’écran est pertinent (il permet de comprendre l’action du bouton) ;

- que l’intitulé visible est contenu dans l’intitulé restitué par le lecteur d’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '9.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Repérer dans l’écran les champs de même nature qui nécessitent d’être regroupés (par exemple, les champs de saisies des différentes suites de chiffres d’un code de carte bleue).

- Vérifier :

- qu’une information est restituée à la prise de focus sur le premier champ, qui permette d’identifier le groupe auquel appartient le champ (bien que cela soit important pour les utilisateurs, il n’est pas requis que l’information du regroupement soit restituée sur chacun des champs de formulaire, mais seulement au moins sur le premier champ du regroupement) ;

- que l’information restituée est pertinente, c’est-à-dire qu’elle permet de comprendre quelle est la nature du regroupement.

- Si c’est le cas, le critère est validé.'
where identifier = '9.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Valider le formulaire sans saisir de données afin d’identifier les champs obligatoires.

- Pour chaque champ obligatoire, vérifier :

- que les informations restituées par le lecteur d’écran à la prise de focus sur le champ contiennent la mention du caractère obligatoire ;

- et qu’une indication visible à proximité du champ indique le caractère obligatoire du champ de formulaire.

- Si l’indication visible est réalisée de manière non textuelle (icône, « * », « ! », etc.), l’explication de la signification de cette indication se situe visuellement et dans l’ordre de lecture, avant la première utilisation de l’indication.

- Si c’est le cas, le critère est validé.'
where identifier = '9.7' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Remplir les champs de formulaire avec des valeurs susceptibles de provoquer des erreurs de saisies (entrer une adresse e-mail mal formée par exemple).

- Valider le formulaire.

- Pour chaque champ de formulaire obligatoire qui possède un contrôle du format (qui sera présenté avec une erreur après la validation), vérifier :

- que le type de données et/ou le format attendu sont restitués par le lecteur d’écran à la prise de focus sur le champ ;

- qu’un texte visible à proximité du champ indique le type de données et/ou le format attendu.

- Si c’est le cas, le critère est validé.'
where identifier = '9.8' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Remplir les champs de formulaire avec des valeurs susceptibles de provoquer des erreurs de saisie (laisser un champ vide, entrer une adresse e-mail mal formée par exemple).

- Valider le formulaire.

- Pour chaque champ en erreur, vérifier :

- que le message d’erreur est visible à proximité du champ ;

- que le message d’erreur est restitué par le lecteur d’écran à la prise de focus sur le champ.

- Si c’est le cas, le critère est validé.'
where identifier = '9.9' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Remplir les champs de formulaire avec des valeurs susceptibles de provoquer des erreurs de saisies (entrer une adresse e-mail mal formée par exemple).

- Valider le formulaire.

- Pour chaque champ en erreur qui possède un contrôle du format, vérifier la présence d’un exemple réel de saisie dans le message d’erreur (par exemple, pour une adresse e-mail, vérifier la mention d’une adresse réelle sur le modèle « jean.schmitt@accessibilite.lu »).

- Si c’est le cas, le critère est validé.'
where identifier = '9.10' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Remplir le formulaire.

- Pour chaque donnée à caractère financier (par exemple, une indication de revenu), juridique (par exemple, une référence d’acte administratif), personnelle (par exemple, un numéro de téléphone), pour chaque formulaire qui transmet des réponses à un test ou à un examen, vérifier que l’utilisateur peut :

- modifier ou annuler les données et les actions effectuées sur ces données en cours de saisie (par exemple la saisie du champ et la fonctionnalité d’annulation d’édition de la plateforme ne sont pas désactivées) ;

- ou confirmer, de manière explicite, l’envoi de ces données via un mécanisme dédié (par exemple, un champ de formulaire ou une étape supplémentaire).

- Pour chaque formulaire qui modifie ou supprime des données (par exemple la suppression d’une adresse postale), vérifier que l’utilisateur peut :

- récupérer les données supprimées en cours de saisie ;

- ou confirmer, de manière explicite, la suppression de ces données via un mécanisme dédié (par exemple, un champ de formulaire ou une étape supplémentaire).

- Si c’est le cas, le critère est validé.'
where identifier = '9.11' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Accéder à chacun des champs de formulaire (taper sur le champ de saisie par exemple pour activer l’apparition des contrôles de saisie).

- Pour chaque champ qui attend une donnée personnelle sur l’utilisateur, vérifier que les contrôles natifs adéquats de la plateforme sont présentés à l’utilisateur. Par exemple :

- pour un champ demandant la saisie de l’adresse e-mail de l’utilisateur, le clavier présenté possède le caractère @ sans que l’utilisateur ait de manipulation de clavier à réaliser (comme afficher le clavier secondaire) ;

- pour un champ demandant la saisie d’un numéro de téléphone, le pavé numérique est présenté directement à l’utilisateur ;

- etc.

- Vérifier que le formulaire est compatible avec un mécanisme de remplissage automatique. Par exemple, iOS permet un remplissage automatique des champs sur la base des dernières valeurs saisies en fonction de leur nature (adresse postale, ville, nom, prénom, adresse e-mail). Vérifier que des valeurs pertinentes sont suggérées sur ces champs.

- Si c’est le cas, le critère est validé.

[Android]

- Accéder à chacun des champs de formulaire (taper sur le champ de saisie par exemple pour activer l’apparition des contrôles de saisie).

- Pour chaque champ qui attend une donnée personnelle sur l’utilisateur, vérifier que les contrôles natifs adéquats de la plateforme sont présentés à l’utilisateur. Par exemple :

- pour un champ demandant la saisie de l’adresse e-mail de l’utilisateur, le clavier présenté possède le caractère @ sans que l’utilisateur ait de manipulation de clavier à réaliser (comme afficher le clavier secondaire) ;

- pour un champ demandant la saisie d’un numéro de téléphone, le pavé numérique est présenté directement à l’utilisateur ;

- etc.

- Vérifier que le formulaire est compatible avec un mécanisme de remplissage automatique. Par exemple, Google fournit un système de remplissage automatique sur Android. Aller dans Paramètres > Système > Langues et saisie > Paramètres avancés > Service de saisie automatique (selon la version de la plateforme, le chemin d’accès peut être différent) pour activer et paramétrer les données.

- Sur le formulaire de l’application, vérifier que le système vous propose une option pour remplir automatiquement avec les données renseignées.

- Si c’est le cas, le critère est validé.'
where identifier = '9.12' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 10 · Navigation (4 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Naviguer sur l’ensemble des éléments de l’écran et vérifier que l’ordre de tabulation reste cohérent. Il n’est pas obligatoire que la tabulation suive l’ordre de lecture naturel (de gauche à droite et de haut en bas par exemple) tant que les éléments sont accessibles dans un ordre cohérent.

- Repérer dans l’écran les composants (bouton par exemple) qui mettent à jour un contenu (affichage d’élément masqué, mise à jour dynamique de contenus par exemple) :

- activer le composant ;

- après l’affichage du contenu mis à jour, vérifier que la tabulation reste cohérente.

- Si c’est le cas, le critère est validé.'
where identifier = '10.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer le lecteur d’écran.

- Naviguer sur l’ensemble des éléments de l’écran avec les gestes du lecteur d’écran et vérifier que l’ordre d’accès aux éléments de l’écran (composants interactifs et textes) reste cohérent. Il n’est pas obligatoire que l’ordre suive l’ordre de lecture naturel (de gauche à droite et de haut en bas par exemple) tant que les éléments sont accessibles dans un ordre cohérent qui ne pose pas de problèmes de compréhension.

- Repérer dans l’écran les composants (bouton par exemple) qui mettent à jour un contenu (affichage d’élément masqué, mise à jour dynamique de contenus par exemple) :

- activer le composant ;

- après l’affichage du contenu mis à jour, vérifier que le parcours du lecteur d’écran reste cohérent.

- Si c’est le cas, le critère est validé.

Exemple de contenu dont l’implémentation pose un problème de compréhension : une heure d’arrivée et une heure de départ sont affichées à l’écran sous forme de deux blocs d’informations visuelles (heure d’arrivée 17h00 ; heure de départ 18h00). Le lecteur d’écran atteint séquentiellement « heure d’arrivée » puis « heure de départ » puis « 17h00 » et enfin « 18h00 ». L’ordre de lecture ne correspond pas à l’ordre visuel, et l’ordre de lecture est problématique puisqu’il ne permet pas de lier les informations entre elles.'
where identifier = '10.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Naviguer sur l’ensemble des éléments de l’écran en utilisant les touches du clavier dédiées (par défaut dans iOS, ce sont les touches Tab et les flèches de direction qui sont utilisées pour naviguer dans les contenus).

- Vérifier que :

- à partir de la position courante, l’élément focusable suivant ou précédent est atteignable avec les touches de navigation du clavier ;

- l’élément possédant actuellement le focus propose une méthode utilisable au clavier (par exemple, un raccourci clavier) permettant d’atteindre l’élément suivant ou précédent.

- Si c’est le cas, le critère est validé.

Note : Certains éléments complexes, souvent gérés par la plateforme, peuvent faire appel à des navigations optimisées qui utilisent généralement les flèches de direction pour passer d’une partie du composant à l’autre.
Le test sur le piège au clavier se limite alors à vérifier que le composant peut être atteint et qu’il est possible de passer au composant suivant ou revenir au composant précédent. On ne vérifie pas l’utilisation même du composant dans ce critère.

[Android]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Naviguer sur l’ensemble des éléments de l’écran en utilisant les touches du clavier (les touches ou la combinaison de touches qui aura été associée dans Switch Access pour les paramètres « Passer à l’option suivante » et « Passer à l’option précédente »).

- Vérifier que :

- à partir de la position courante, l’élément focusable suivant ou précédent est atteignable avec la touche de navigation du clavier ;

- l’élément possédant actuellement le focus propose une méthode utilisable au clavier (par exemple, un raccourci clavier) permettant d’atteindre l’élément suivant ou précédent.

- Si c’est le cas, le critère est validé.

Note : Certains éléments complexes, souvent gérés par la plateforme, peuvent faire appel à des navigations optimisées qui utilisent généralement les flèches de direction pour passer d’une partie du composant à l’autre.
Le test sur le piège au clavier se limite alors à vérifier que le composant peut être atteint et qu’il est possible de passer au composant suivant ou revenir au composant précédent. On ne vérifie pas l’utilisation même du composant dans ce critère.'
where identifier = '10.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Connecter un clavier externe (et paramétrer la navigation au clavier).

- Depuis l’application, appuyer successivement sur chacune des touches de caractère imprimable (les lettres minuscules a-z, les majuscules A-Z, les chiffres 0-9, tous les symboles comme $, *, %, ! etc. à partir du moment où ils peuvent être inscrits à l’écran).

- Si le raccourci clavier est associé à un seul composant isolé de l’écran, vérifier qu’il ne peut être activé que si le focus clavier est à l’intérieur de ce composant.

- Sinon, si une action est déclenchée, vérifier la présence dans l’application d’un élément de configuration permettant :

- de désactiver ces raccourcis clavier à touche unique ;

- de configurer ces raccourcis clavier en leur ajoutant une touche de modification Ctrl, Alt, Maj, etc.

- Si c’est le cas, le critère est validé.'
where identifier = '10.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 11 · Consultation (16 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer les procédés limitant le temps d’une session (par exemple après une authentification).

- Vérifier :

- la présence d’un mécanisme permettant à l’utilisateur de supprimer la limite de temps (par exemple, un bouton à bascule permettant à l’utilisateur d’activer ou désactiver la limite de temps de la session) ;

- ou la présence d’un mécanisme permettant à l’utilisateur d’augmenter la limite de temps (par exemple, une liste déroulante avec des valeurs de temps de connexion disponibles) ;

- ou la présence d’un mécanisme qui avertit l’utilisateur de l’imminence de la limite de temps et laisse 20 secondes, au moins, à l’utilisateur pour augmenter la limite de temps (par exemple, l’ouverture d’une modale avec un bouton permettant d’augmenter la limite de temps) ;

- ou que la limite de temps est de vingt heures, au moins.

- Si c’est le cas, le critère est validé.'
where identifier = '11.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer les limites de temps de session (par exemple, la déconnexion d’un compte client).

- Vérifier :

- la présence d’un mécanisme permettant à l’utilisateur de supprimer la limite de temps (par exemple, un bouton avec un intitulé explicite) ;

- ou la présence d’un mécanisme permettant à l’utilisateur d’augmenter la limite de temps (par exemple, un paramètre disponible dans l’application pour gérer les temps de sessions) ;

- ou que la durée de la session est de vingt heures, au moins.

- Si c’est le cas, le critère est validé.'
where identifier = '11.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les composants (un lien, un bouton de formulaire ou un formulaire de téléchargement par exemple) permettant de télécharger un fichier au format bureautique (.doc, .docx, .pdf par exemple).

- Pour chaque fichier proposé au téléchargement, dans un format bureautique, vérifier la présence d’une version alternative présentée comme accessible.

- Si l’alternative est proposée dans un format bureautique (pdf, odt, doc, docx, EPUB/DAISY) :

- télécharger le fichier de l’alternative proposée ;

- si ce fichier est au format PDF, vérifier qu’il est conforme au référentiel d’évaluation de l’accessibilité des documents au format PDF (RAPDF 1).

- si ce fichier est dans un autre format, vérifier qu’il est conforme aux critères de la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1.

- Si l’alternative est proposée dans l’application, vérifier que le contenu est conforme au présent référentiel.

- Sinon, pour les documents au format bureautique (pdf, odt, doc, docx, EPUB/DAISY) :

- télécharger le fichier ;

- si ce fichier est au format PDF, vérifier qu’il est conforme au référentiel d’évaluation de l’accessibilité des documents au format PDF (RAPDF 1).

- si ce fichier est dans un autre format, vérifier qu’il est conforme aux critères de la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1.

- Si c’est le cas, le critère est validé.'
where identifier = '11.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Pour chaque fichier proposé au téléchargement dans un format bureautique qui possède une version alternative présentée comme accessible, vérifier que les deux documents (le document d’origine et la version accessible dans un format bureautique ou dans l’application) offrent la même information.

- Si c’est le cas, le critère est validé.'
where identifier = '11.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les contenus cryptiques (art ascii, émoticône, syntaxe cryptique).

- Vérifier qu’une définition est disponible dans le contexte adjacent (immédiatement avant ou après le contenu cryptique, dans le texte adjacent ou via l’activation d’un composant d’interface).

- Sinon, activer le lecteur d’écran.

- Naviguer jusqu’au contenu cryptique et vérifier qu’une alternative est restituée.

- Si c’est le cas, le critère est validé.'
where identifier = '11.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Pour chaque contenu cryptique qui possède une alternative, vérifier que l’alternative donnée est pertinente (elle permet de comprendre le contenu ou la fonction).

- Si c’est le cas, le critère est validé.'
where identifier = '11.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les contenus clignotants ou qui provoquent des effets de flash : élément graphique animé, vidéo ou animation, effet de mise en forme.

- Vérifier :

- que la fréquence de l’effet est inférieure ou égale à 3 flashs par seconde ;

- ou que la surface cumulée est inférieure à 21824 pixels.

- Si c’est le cas, le critère est validé.

Note : L’outil PEAT permet d’analyser les vidéos au format .avi.'
where identifier = '11.7' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les contenus en mouvement ou clignotants (un élément graphique, un effet de mise en forme, un carrousel par exemple) déclenchés automatiquement au chargement de l’écran ou lors de l’affichage d’un contenu (cf. note).

- Vérifier :

- que la durée totale du mouvement ou du clignotement est inférieure à 5 secondes ;

- ou la présence d’un mécanisme (un bouton par exemple) qui permet d’arrêter et de relancer le mouvement ou le clignotement ;

- ou la présence d’un mécanisme (un bouton par exemple) qui permet de cacher et d’afficher à nouveau le contenu en mouvement ou clignotant ;

- ou la présence d’un mécanisme (un bouton par exemple) qui permet d’afficher le contenu sans mouvement ou clignotement.

- Si c’est le cas, le critère est validé.

Note :

- L’arrêt ou la mise en pause d’un contenu en mouvement ou clignotant via la prise de focus (l’effet est suspendu uniquement pendant la prise de focus mais reprend une fois la prise de focus perdue) ou au toucher sur le contenu en mouvement (l’effet est suspendu uniquement pendant qu’une pression est effectuée sur le contenu, mais reprend une fois la pression relâchée) ne sont pas considérés comme des procédés conformes.

- Dans certains cas, le mouvement ne peut pas être arrêté, par exemple, une barre de progression, dans ce cas, le critère est non applicable.'
where identifier = '11.8' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Ouvrir le Centre de contrôle.

- Vérifier que l’orientation de l’écran n’est pas verrouillée dans les paramètres de la plateforme (voir la documentation officielle).

- Afficher l’application et basculer le terminal alternativement en mode paysage et portrait.

- Vérifier :

- que l’application est utilisable dans les deux orientations, c’est-à-dire que les éléments de l’application sont repositionnés pour être lisibles ;

- que les contenus disponibles dans une orientation sont toujours disponibles dans l’autre orientation (directement ou par l’activation d’un composant supplémentaire par exemple).

- Si c’est le cas, le critère est validé.

[Android]

- Ouvrir le panneau de configuration rapide.

- Vérifier que le paramètre « Rotation automatique » est activé (voir la documentation officielle).

- Afficher l’application et basculer le terminal alternativement en mode paysage et portrait.

- Vérifier :

- que l’application est utilisable dans les deux orientations, c’est-à-dire que les éléments de l’application sont repositionnés pour être lisibles ;

- que les contenus disponibles dans une orientation sont toujours disponibles dans l’autre orientation (directement ou par l’activation d’un composant supplémentaire par exemple).

- Si c’est le cas, le critère est validé.'
where identifier = '11.9' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les fonctionnalités qui nécessitent de réaliser des gestes complexes (repérer la présence de consignes dans l’interface ou dans une documentation associée à l’application), par exemple :

- l’utilisation simultanée de deux doigts ou plus ;

- la réalisation d’un tracé de trajectoire (comme le geste swipe).

- Vérifier qu’il existe une méthode alternative pour réaliser l’action associée avec un geste simple, par exemple l’appui sur une seule touche du clavier ou un bouton.

- Si c’est le cas, le critère est validé.'
where identifier = '11.10' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les fonctionnalités qui nécessitent la réalisation de deux actions simultanées, par exemple :

- l’utilisation simultanée de deux touches d’un clavier ou plus ;

- devoir énoncer une commande vocale et toucher l’écran en même temps pour réaliser une action.

- Vérifier qu’il existe dans l’écran ou l’application une méthode alternative pour réaliser l’action associée avec une action unique, par exemple l’appui sur un bouton.

- Si c’est le cas, le critère est validé.'
where identifier = '11.11' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les composants interactifs (par exemple, bouton ou lien).

- Pour chaque composant interactif, effectuer un appui simple dessus et conserver la pression.

- Déplacer le doigt en dehors de la zone interactive et constater que l’action associée n’est pas déclenchée.

- Si c’est le cas, le critère est validé.'
where identifier = '11.12' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les fonctionnalités qui se déclenchent au moyen d’un mouvement de l’appareil ou d’un geste vers l’appareil (repérer par exemple la présence de consignes dans l’interface ou dans une documentation associée à l’application qui décrive ce type de déclenchement).

- Vérifier :

- que la fonctionnalité peut être déclenchée sans mouvement, par exemple par l’activation d’un bouton ou d’un lien ;

- et que l’application propose une méthode pour désactiver la détection du mouvement (par exemple, un paramètre dans l’application).

- Si c’est le cas, le critère est validé.'
where identifier = '11.13' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les fonctionnalités de conversion de document (par exemple exportation en PDF, en .odt, HTML etc.)

- Repérer dans le contenu original les informations d’accessibilité présentes (par exemple, une alternative d’un élément graphique, des niveaux de titres, une table des matières).

- Vérifier que dans le document résultant de la conversion, les informations d’accessibilité sont toujours présentes (sauf si le format de conversion choisi ne possède pas de support pour les informations d’accessibilité du document source).

- Si c’est le cas, le critère est validé.'
where identifier = '11.14' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’écran les fonctionnalités d’identification (authentification) et de contrôle qui reposent sur l’utilisation de caractéristiques biologiques (par exemple reconnaissance vocale, empreinte digitale, reconnaissance faciale).

- Vérifier qu’il existe une méthode alternative pour réaliser l’action :

- Pour une fonctionnalité d’authentification qui passe par une reconnaissance d’empreinte digitale, un bouton est disponible sur l’écran de connexion pour accéder à la saisie d’un mot de passe.

- Pour une fonctionnalité d’authentification qui passe par une reconnaissance vocale, l’application propose également une reconnaissance d’empreinte digitale.

- Si c’est le cas, le critère est validé.

Si la méthode alternative repose également sur une caractéristique biologique, il est indispensable qu’elle n’implique pas une caractéristique biologique similaire. Par exemple, si la méthode initiale implique la voix, la méthode alternative ne doit pas utiliser la voix.'
where identifier = '11.15' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’application la présence d’une fonctionnalité de répétition de touches (repérer par exemple la présence de consignes dans l’interface ou dans une documentation associée à l’application).

- Vérifier que le délai de déclenchement de la fonction de répétition (le délai entre la toute première pression de touche à répéter et la mise en œuvre de la fonction de répétition) :

- est de 2 secondes au moins ;

- ou qu’il existe une méthode permettant de le paramétrer à 2 secondes au moins (par exemple, un champ de saisie dans les paramètres utilisateurs de l’application).

- Vérifier que le délai entre deux répétitions :

- est de 2 secondes au moins ;

- ou qu’il existe une méthode permettant de le paramétrer à 2 secondes au moins (par exemple, un champ de saisie dans les paramètres utilisateurs de l’application).

- Si c’est le cas, le test est validé.'
where identifier = '11.16' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 12 · Documentation et fonctionnalités d'accessibilité (4 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’application la présence d’une documentation.

- Repérer dans l’application la présence de fonctionnalités d’accessibilité.

- Vérifier la présence dans la documentation :

- de la description des fonctionnalités d’accessibilité de l’application ;

- d’explications sur les modalités d’utilisation de ces fonctionnalités (leur localisation, les méthodes pour les activer) ;

- de la description des composants complexes pour lesquels il est mis en place une gestion particulière selon les technologies d’assistance ;

- de la description des éléments non conformes ou non compatibles avec certaines technologies d’assistance, et de la présence d’alternatives le cas échéant.

- Si c’est le cas, le critère est validé.'
where identifier = '12.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer les fonctionnalités d’accessibilité décrites dans la documentation. Par exemple :

- accéder à une version du contenu en langage simplifié ;

- agrandir la taille du texte.

- Vérifier que les utilisateurs concernés par chaque fonctionnalité d’accessibilité sont en mesure d’y accéder. Par exemple :

- Version alternative en langage simplifié : le mécanisme ou l’ensemble des mécanismes qui permettent d’activer la fonctionnalité doit être compréhensible et identifiable par une personne qui bénéficie du langage simplifié (par exemple, l’emploi du logo « Facile à lire » pour identifier le mécanisme est une solution conforme).

- Agrandissement de la taille des caractères : si le mécanisme contient du texte, alors le texte doit être affiché par défaut avec une taille de police équivalent à 200% de la taille de police initiale.

- Vérifier qu’il est possible d’activer cette fonctionnalité.

- Si c’est le cas, le critère est validé.'
where identifier = '12.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS]

- Identifier dans la documentation de la plateforme les fonctionnalités d’accessibilité mises à disposition des utilisateurs (voir la documentation concernant les fonctionnalités d’accessibilité fournie par iOS).

- Vérifier que l’application n’empêche pas leur utilisation, par exemple :

- si l’application implémente des interactions qui déclenchent des fonctionnalités, ces interactions n’empêchent pas le bon fonctionnement des fonctionnalités d’accessibilité de la plateforme comme le lecteur d’écran ou les autres fonctionnalités basées sur le toucher ;

- si l’application embarque une reconnaissance vocale, alors l’utilisation de la commande vocale intégrée à la plateforme n’est pas perturbée ;

- si l’application implémente des raccourcis clavier, ceux-ci n’utilisent pas des combinaisons de touches déjà employées par la plateforme pour des fonctionnalités d’accessibilité (VoiceOver peut être utilisé avec un clavier par exemple, les raccourcis proposés ne doivent pas interférer) ;

- ou toute autre fonctionnalité de l’application.

- Si c’est le cas, le critère est validé.

[Android]

- Identifier dans la documentation de la plateforme les fonctionnalités d’accessibilité mises à disposition des utilisateurs (voir la documentation concernant les fonctionnalités d’accessibilité fournie par Android).

- Vérifier que l’application n’empêche pas leur utilisation, par exemple :

- si l’application implémente des interactions qui déclenchent des fonctionnalités, ces interactions n’empêchent pas le bon fonctionnement des fonctionnalités d’accessibilité de la plateforme comme le lecteur d’écran ou les autres fonctionnalités basées sur le toucher ;

- si l’application embarque une reconnaissance vocale, alors l’utilisation de la commande vocale intégrée à la plateforme n’est pas perturbée ;

- si l’application implémente des raccourcis clavier, ceux-ci n’utilisent pas des combinaisons de touches déjà employées par la plateforme pour des fonctionnalités d’accessibilité (TalkBack peut être utilisé avec un clavier par exemple, les raccourcis proposés ne doivent pas interférer) ;

- ou toute autre fonctionnalité de l’application.

- Si c’est le cas, le critère est validé.'
where identifier = '12.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer la présence d’une documentation dans l’application ou accessible depuis l’application.

- Pour une documentation au format web (HTML, CSS), vérifier qu’elle respecte les critères du RAWeb.

- Pour une documentation au format PDF, vérifier qu’elle respecte les critères du RAPDF.

- Pour une documentation au format non web (hors PDF), vérifier qu’elle respecte les critères de la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1 ;

- Pour une documentation fournie dans une application mobile, vérifier qu’elle respecte les critères du RAAM.

- Si c’est le cas, le critère est validé.

Note : la documentation sera considérée non conforme dès qu’une erreur sera identifiée au regard des critères cibles, et ce, même si l’erreur fait partie des éléments de gabarits (menu, pied de page) et non pas uniquement du contenu de la documentation isolée.'
where identifier = '12.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 13 · Outils d'édition (6 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’outil les fonctionnalités d’édition (par exemple, un éditeur de texte, mais cela peut être une médiathèque ou toute autre interface qui permet de saisir du texte ou définir des propriétés).

- Pour les fonctionnalités qui permettent de créer du contenu au format web (HTML, CSS), vérifier qu’il est possible de définir les informations d’accessibilité nécessaires pour rendre le contenu conforme au RAWeb. Par exemple :

- définir l’alternative textuelle d’une image depuis l’éditeur de texte ou une médiathèque ;

- définir un intitulé de lien ;

- etc.

- Pour les fonctionnalités qui permettent de créer du contenu au format PDF, vérifier qu’il est possible de définir les informations d’accessibilité nécessaires pour rendre le contenu conforme au RAPDF. Par exemple :

- définir l’alternative textuelle d’une image depuis l’éditeur de texte ou une médiathèque ;

- définir un intitulé de lien ;

- etc.

- Pour les fonctionnalités qui permettent de créer du contenu au format non web (hors PDF), vérifier qu’il est possible de définir les informations d’accessibilité nécessaires pour rendre le contenu conforme aux critères de la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1. Par exemple :

- définir l’alternative textuelle d’une image depuis l’éditeur de texte ou une médiathèque ;

- définir un intitulé de lien ;

- etc.

- Pour les fonctionnalités qui permettent de créer du contenu diffusé dans une application mobile, vérifier qu’il est possible de définir les informations d’accessibilité nécessaires pour rendre le contenu conforme aux critères du RAAM. Par exemple :

- définir l’alternative textuelle d’une image depuis l’éditeur de texte ou une médiathèque ;

- définir un intitulé de lien ;

- etc.

- Si c’est le cas, le critère est validé.'
where identifier = '13.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’outil la présence d’aides à la création de contenus accessibles. Cela peut être :

- des tests automatiques ou semi-automatiques disponibles depuis les fonctionnalités d’édition ;

- d’autres outils automatiques (un chatbot par exemple) ;

- une documentation qui explique comment définir les propriétés d’accessibilité pour chaque élément de contenu ;

- des tests manuels disponibles depuis les fonctionnalités d’édition pour guider les auteurs dans la détection d’erreurs.

- Vérifier que les aides à la création de contenus accessibles sont pertinentes, c’est-à-dire que les résultats ou les indications qu’elles donnent permettent de créer un contenu conforme aux règles d’accessibilité numérique.

- Si c’est le cas, le critère est validé.'
where identifier = '13.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Depuis les fonctionnalités d’édition (un éditeur de texte, mais cela peut être une médiathèque et toute autre interface qui permet de saisir du texte ou définir des propriétés), saisir les typologies de contenus proposées par l’éditeur (titre, liste, tableau, image, etc.). Utiliser également les différents paramètres permettant de définir des informations d’accessibilité (renseigner l’alternative textuelle d’une image, ajouter une description sur un lien, etc.)

- Enregistrer les saisies.

- Consulter le contenu généré :

- dans la fonctionnalité d’édition (par exemple, dans l’éditeur de texte) ;

- et dans l’interface de publication des contenus (par exemple, la page web de publication).

- Pour chaque contenu au format web (HTML, CSS), vérifier :

- que les informations nécessaires pour qu’il soit conforme au RAWeb (par exemple l’alternative d’une image, les niveaux de titres) sont préservées dans le contenu généré ;

- que l’information, si elle est restructurée, reste compatible avec les technologies d’assistance (par exemple, si l’auteur saisit un tableau HTML et qu’après l’enregistrement, l’outil linéarise le tableau, l’information ainsi restructurée doit être compréhensible pour les utilisateurs de technologies d’assistance comme elle l’aurait été dans sa forme initiale).

- Pour chaque contenu au format PDF, vérifier :

- que les informations nécessaires pour qu’il soit conforme au RAPDF (par exemple l’alternative d’une image, les niveaux de titres) sont préservées dans le contenu généré ;

- que l’information, si elle est restructurée, reste compatible avec les technologies d’assistance (par exemple, si l’auteur saisit un tableau et qu’après l’enregistrement, l’outil linéarise le tableau, l’information ainsi restructurée doit être compréhensible pour les utilisateurs de technologies d’assistance comme elle l’aurait été dans sa forme initiale).

- Pour chaque contenu au format non web qui n’est pas du PDF, vérifier :

- que les informations nécessaires pour qu’il soit conforme à la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1 sont préservées dans le contenu généré ;

- que l’information, si elle est restructurée, reste compatible avec les technologies d’assistance (par exemple, si l’auteur saisit un tableau et qu’après l’enregistrement, l’outil linéarise le tableau, l’information ainsi restructurée doit être compréhensible pour les utilisateurs de technologies d’assistance comme elle l’aurait été dans sa forme initiale).

- Pour chaque contenu diffusé dans une application mobile, vérifier :

- que les informations nécessaires pour qu’il soit conforme au RAAM (par exemple l’alternative d’une image, l’identification des titres) sont préservées dans le contenu généré ;

- que l’information, si elle est restructurée, reste compatible avec les technologies d’assistance (par exemple, si l’auteur saisit un tableau HTML et qu’après l’enregistrement, l’outil linéarise le tableau, l’information ainsi restructurée doit être compréhensible pour les utilisateurs de technologies d’assistance comme elle l’aurait été dans sa forme initiale).

- Si c’est le cas, le critère est validé.'
where identifier = '13.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’outil la présence de fonctionnalités de tests automatiques ou semi-automatiques.

- Générer du contenu (web et non-web) avec l’outil d’édition avec des erreurs d’accessibilité.

- Activer les fonctionnalités de tests.

- Vérifier :

- que l’outil répare automatiquement l’erreur (test automatique) ;

- ou que l’outil met à disposition de l’auteur des suggestions de réparations (test semi-automatique).

- Dans le cas d’un test semi-automatique, vérifier :

- que l’outil met à disposition une aide à la décision et des suggestions de réparations ;

- ou que l’outil met à disposition de l’auteur des explications pour effectuer la réparation.

- Si c’est le cas, le critère est validé.'
where identifier = '13.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer la présence de gabarits mis à disposition par l’outil d’édition.

- Pour les gabarits au format web (HTML, CSS), vérifier qu’au moins un gabarit permet de respecter l’ensemble des critères du RAWeb.

- Pour les gabarits au format PDF, vérifier qu’au moins un gabarit permet de respecter l’ensemble des critères du RAPDF.

- Pour les gabarits au format non-web (hors PDF), vérifier qu’au moins un gabarit permet de respecter l’ensemble des critères de la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1.

- Pour les gabarits permettant de diffuser des contenus dans une application mobile, vérifier qu’au moins un gabarit permet de respecter l’ensemble des critères du RAAM.

- Si c’est le cas, le critère est validé.'
where identifier = '13.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer la présence de gabarits totalement conformes aux règles d’accessibilité numérique mis à disposition par l’outil d’édition.

- Vérifier la présence d’une mention explicite permettant de les identifier. Par exemple, depuis la liste des gabarits, les gabarits conformes possèdent une étiquette « gabarit accessible ».

- Si c’est le cas, le critère est validé.'
where identifier = '13.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 14 · Services d'assistance (3 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Repérer la mise à disposition d’un service d’assistance depuis l’application.

- Si c’est le cas, repérer dans l’application la présence d’une documentation.

- Repérer la présence dans la documentation :

- de la description des fonctionnalités d’accessibilité proposées par l’application ;

- de la description des composants complexes pour lesquels il est mis en place une gestion particulière selon les technologies d’assistance ;

- d’explications sur les modalités d’utilisation de ces fonctionnalités (leur localisation, les méthodes pour les activer) ;

- de la description des éléments non conformes ou non compatibles avec certaines technologies d’assistance, et de la présence d’alternatives le cas échéant.

- Vérifier que le service d’assistance propose des informations concernant ces fonctionnalités.

- Si c’est le cas, le critère est validé.'
where identifier = '14.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer la présence dans l’application d’un service d’assistance.

- Si c’est le cas, vérifier que le service d’assistance peut être utilisé par toutes les personnes en situation de handicap. Il peut être utile de rechercher dans la documentation de l’application pour trouver ces informations. Par exemple, si le service d’assistance est disponible depuis un numéro de téléphone, vérifier qu’il existe des moyens alternatifs pour les utilisateurs qui n’accèdent pas ou peu au langage oral (personnes sourdes ou malentendantes) ou qui ne peuvent pas utiliser le langage verbal (personnes aphasiques). Par exemple :

- une adresse mail ou un formulaire en ligne ;

- une messagerie instantanée ;

- la mise à disposition d’une traduction écrite simultanée ou visuelle des informations orales ou sonores, ou la mise à disposition d’un interprète en langue des signes (utilisation d’un service de relais).

- Si c’est le cas, le critère est validé.'
where identifier = '14.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer la présence d’une documentation fournie par le service d’assistance.

- Pour une documentation au format web (HTML, CSS), vérifier qu’elle respecte les critères du RAWeb.

- Pour une documentation au format PDF, vérifier qu’elle respecte les critères du RAPDF.

- Pour une documentation au format non web (hors PDF), vérifier qu’elle respecte les critères la section 10 Non-web documents de la norme européenne EN 301 549 v3.2.1 ;

- Pour une documentation fournie dans une application mobile, vérifier qu’elle respecte les critères du RAAM.

- Si c’est le cas, le critère est validé.

Note : la documentation sera considérée non conforme dès qu’une erreur sera identifiée au regard des critères cibles, et ce, même si l’erreur fait partie des éléments de gabarits (menu, pied de page) et non pas uniquement du contenu de la documentation isolée.'
where identifier = '14.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Thème 15 · Communication en temps réel (11 critères)
-- ============================================================================

update public.criteria set methodology = '[iOS et Android]

- Activer l’application et lancer un appel entre les deux terminaux.

- Vérifier que la qualité de l’activité orale avec l’application web est au moins équivalente à la qualité de l’activité orale lors d’un appel avec un téléphone fixe.

- Si le test n’est pas satisfaisant (par exemple, mauvaise compréhension de certains mots énoncés par l’interlocuteur, présence de bruits parasites, etc.), vérifier dans la documentation de l’application :

- la présence d’une référence à l’implémentation de la recommandation UIT-T G.722 ;

- ou la présence d’une référence à l’utilisation du codec opus de l’API WebRTC ;

- ou la présence d’une référence à l’utilisation d’un encodage et décodage dont la fréquence est supérieure ou égale à 7 000 Hz.

- Sinon, il est recommandé de demander à l’éditeur de l’application de fournir ces détails techniques, notamment en demandant si l’application web implémente par exemple la recommandation UIT-T G.722 ou utilise le codec opus de l’API WebRTC.

- Si c’est le cas, le critère est validé.

Si l’information ne peut être trouvée dans l’interface ou sa documentation, et que l’éditeur de l’application n’est pas en mesure de répondre sur cette caractéristique technique, le critère sera considéré non conforme.'
where identifier = '15.1' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Vérifier que l’application permet la communication orale bidirectionnelle.

- Si c’est le cas, vérifier la présence d’une fonctionnalité de communication écrite en temps réel (il peut être parfois nécessaire d’activer un paramètre dédié dans l’application pour permettre la communication écrite en temps réel).

- Si c’est le cas, le critère est validé.

Si l’information ne peut être trouvée dans l’interface ou sa documentation, et que l’éditeur de l’application n’est pas en mesure de répondre sur cette caractéristique technique, le critère sera considéré non conforme.'
where identifier = '15.2' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Vérifier que l’application permet la communication orale bidirectionnelle.

- Si c’est le cas, vérifier la présence d’une fonctionnalité de communication écrite en temps réel.

- Si c’est le cas, vérifier qu’il est possible d’utiliser les deux modes de communications en même temps, c’est-à-dire qu’il est possible pour un même utilisateur de parler et d’utiliser simultanément le système de communication écrite en temps réel.

- Si c’est le cas, le critère est validé.'
where identifier = '15.3' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer l’application et la fonctionnalité de communication écrite en temps réel de l’application sur deux terminaux et les connecter à une même session.

- Envoyer un message écrit depuis les deux terminaux pour obtenir des messages avec des statuts différents (envoyé et reçu) et avec des auteurs différents.

- Vérifier :

- que les messages envoyés et reçus sont visuellement séparés (par exemple, les messages envoyés sont dans une fenêtre et les messages reçus dans une autre, ou il y a un saut de ligne entre chaque message reçu et envoyé s’ils sont présentés dans une même fenêtre) ;

- qu’il est possible visuellement de distinguer les messages envoyés et les messages reçus. Par exemple, par une mise en forme ou une couleur qui les différencie ou par une annotation textuelle visible (repérer la mention « Envoyé » à proximité d’un message envoyé ou « Reçu » à proximité d’un message reçu) ;

- que l’information de la nature du message (reçu ou envoyé) est accessible aux technologies d’assistance (une information textuelle est disponible pour apporter cette information) ;

- que les auteurs des messages écrits sont identifiés (par exemple, la présence d’un nom ou un identifiant précédant le message).

- Si c’est le cas, le critère est validé.'
where identifier = '15.4' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Vérifier que l’application permet la communication orale bidirectionnelle et la communication écrite en temps réel ou la diffusion de la vidéo en temps réel.

- Si c’est le cas, activer l’application sur deux terminaux et les connecter à une même session.

- Faire parler un utilisateur depuis un des terminaux.

- Vérifier sur l’interface l’apparition d’un indicateur visuel permettant d’identifier qu’une personne est en train de parler. Il n’est pas nécessaire pour ce critère d’identifier qui parle, mais simplement d’identifier qu’il y a une personne qui est en train de parler. Par exemple, un halo autour ou une icône à proximité de l’avatar de la personne qui parle.

- Si c’est le cas, le critère est validé.'
where identifier = '15.5' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

Ce critère est très complexe à évaluer et demande une certaine maîtrise de l’ensemble des concepts et normes d’interopérabilité.

Il est recommandé de demander à l’éditeur de l’application de vérifier que l’ensemble des exigences décrites dans le critère 6.2.3 Interoperability de la norme EN 301 549 sont respectées.

Il est également conseillé de rechercher dans la documentation ou de questionner directement l’éditeur de l’application.

Si l’information ne peut être trouvée dans l’interface ou sa documentation, et que l’éditeur de l’application n’est pas en mesure de répondre sur cette caractéristique technique, le critère sera considéré non conforme.'
where identifier = '15.6' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Vérifier que l’application permet la communication écrite en temps réel.

- Si c’est le cas, activer l’application et la fonctionnalité de communication écrite sur deux terminaux distincts et les connecter à une même session.

- Saisir du texte sur le premier terminal et observer son apparition sur le second terminal. L’apparition sur le second terminal doit être instantanée (inférieure à une demi-seconde). Selon le paramétrage de la fonctionnalité, chaque caractère n’est pas envoyé individuellement. En effet, si la fonctionnalité de communication écrite en temps réel implémente une prédiction de mots, c’est lorsque le mot désiré sera sélectionné qu’il sera envoyé, et non pas lors de la saisie des premiers caractères servant à déclencher l’affichage de suggestion. Un test par observation simple peut être suffisant pour constater l’apparition instantanée sur le terminal qui reçoit le message écrit.

- Si c’est le cas, le critère est validé.'
where identifier = '15.7' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer l’application et le lecteur d’écran depuis un terminal.

- Depuis un second terminal, lancer un appel vers le premier terminal.

- Lorsque l’appel entrant apparaît, vérifier :

- que l’identification de l’interlocuteur est disponible visuellement sous la forme d’un texte dont la nature est compréhensible (par exemple, un nom ou un numéro de téléphone) ;

- que cette identification est correctement restituée par le lecteur d’écran.

- Si c’est le cas, le critère est validé.'
where identifier = '15.8' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Activer l’application et lancer un appel vidéo entre les deux terminaux.

- Initier une activité orale, et vérifier la présence sur le second terminal d’une information permettant d’identifier cette activité (par exemple, la présence d’un halo de couleur autour de la vignette de l’interlocuteur en activité).

- Si c’est le cas :

- repérer la présence d’un mécanisme manuel (par exemple, un bouton) qui permettrait à l’interlocuteur signant d’indiquer qu’il est en train de signer ;

- sinon, réaliser des gestes devant la caméra (voir note) et vérifier l’affichage automatique d’une information permettant d’identifier cette activité visuelle.

- Si c’est le cas, le critère est validé.

Note : dans les applications de communication, l’identification d’une activité orale ne repose pas sur l’identification d’un message verbal intelligible (mot ou phrase par exemple), mais uniquement sur l’identification d’un son (un bruit par exemple). Ainsi, une activité visuelle, même si elle ne correspond pas à un élément compréhensible en langue des signes, pourrait être détectée automatiquement par cette application et servirait donc comme mécanisme pour identifier l’activité d’une personne signante. Il est donc possible de tester en réalisant des gestes même s’ils ne correspondent pas à un élément de sens en langue des signes.'
where identifier = '15.9' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

- Repérer dans l’application les fonctionnalités disponibles (en dehors de la fonctionnalité de communication orale) qui se basent sur l’écoute d’information ou l’énonciation de commande, par exemple :

- une messagerie vocale ;

- un standard téléphonique automatique (par exemple, qui demande d’énoncer un chiffre entre 1 et 4 pour être redirigé vers un service) ;

- ou tout autre serveur vocal interactif.

- Vérifier :

- que l’information est disponible sans devoir écouter ou parler (par exemple grâce à une transcription textuelle ou un système de chat) ;

- que les actions peuvent être réalisées sans devoir écouter ou parler ou qu’il existe une alternative à la fonctionnalité qui peut être utilisée sans devoir écouter ou parler.

- Si c’est le cas, le critère est validé.'
where identifier = '15.10' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

update public.criteria set methodology = '[iOS et Android]

Pour les conditions concernant la résolution et la fréquence des images, la façon la plus sûre d’évaluer ce critère est de faire une recherche soit dans l’interface soit dans la documentation de l’application pour obtenir ces informations. Il est également recommandé de demander à l’éditeur de l’application de fournir ces détails techniques.

Si l’information ne peut être trouvée dans l’interface ou sa documentation, et que l’éditeur de l’application n’est pas en mesure de répondre sur cette caractéristique technique, ces conditions ne pouvant être validées, le critère sera considéré non conforme.

Pour la dernière condition concernant le décalage entre la vidéo et l’audio, le test peut s’établir sur une simple observation :

- Activer l’application sur deux terminaux.

- Établir une connexion d’appel vidéo entre les deux terminaux.

- Vérifier la synchronisation entre les paroles et la vidéo (synchronisation labiale, mouvement des lèvres).

- Si c’est le cas, le test est validé.'
where identifier = '15.11' and thematic_id in (select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- Vérification finale
-- ============================================================================

do $$
declare
  filled_count integer;
begin
  select count(*) into filled_count
  from public.criteria
  where methodology is not null
    and thematic_id in (
      select id from public.thematics where reference_id = '55555555-5555-5555-5555-555555555555'
    );
  if filled_count < 100 then
    raise exception 'RAAM 1.1 methodology: only % criteria filled (expected >= 100)', filled_count;
  end if;
  raise notice 'RAAM 1.1 methodology: % / 108 criteria filled', filled_count;
end $$;

commit;
