-- ============================================================================
-- Axessio · Méthodologie RAWeb 1.1 — contenu des tests par critère
-- ----------------------------------------------------------------------------
-- Source officielle : https://accessibilite.public.lu/fr/raweb1.1/criteres.html
-- (Licence Ouverte Etalab 2.0 — réutilisation libre)
--
-- Pour chacun des 136 critères du RAWeb 1.1 (référentiel
-- 44444444-4444-4444-4444-444444444444), on remplit la colonne
-- `methodology` avec la concaténation des tests / points de contrôle au
-- format :
--
--   Test X.Y.Z
--   [contenu]
--
--   Test X.Y.Z+1
--   [contenu]
--
-- Les thèmes 1 à 13 reprennent la structure RGAA (les libellés RAWeb sont
-- très proches de ceux du RGAA 4.1.2). Les thèmes 14 à 17 sont propres au
-- RAWeb (Documentation, Outils d'édition, Services d'assistance,
-- Communication en temps réel).
--
-- Idempotent · à exécuter en transaction unique.
-- Vérification finale : exception si moins de 130 critères remplis.
-- ============================================================================

begin;

-- ============================================================================
-- Thème 1 · Images (9 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 1.1.1
Chaque image (balise img ou balise possédant l''attribut WAI-ARIA role="img") porteuse d''information a-t-elle une alternative textuelle ?

Test 1.1.2
Chaque zone d''une image réactive (balise area) porteuse d''information a-t-elle une alternative textuelle ?

Test 1.1.3
Chaque bouton de type image (balise input avec l''attribut type="image") a-t-il une alternative textuelle ?

Test 1.1.4
Chaque zone cliquable d''une image réactive côté serveur est-elle doublée d''un mécanisme utilisable quel que soit le dispositif de pointage utilisé ?

Test 1.1.5
Chaque image vectorielle (balise svg) porteuse d''information vérifie-t-elle une de ces conditions ?

Test 1.1.6
Chaque image objet (balise object avec l''attribut type="image/...") porteuse d''information vérifie-t-elle une de ces conditions ?

Test 1.1.7
Chaque image embarquée (balise embed avec l''attribut type="image/...") porteuse d''information vérifie-t-elle une de ces conditions ?

Test 1.1.8
Chaque image bitmap (balise canvas) porteuse d''information vérifie-t-elle une de ces conditions ?'
where identifier = '1.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.2.1
Chaque image (balise img) de décoration, sans légende, vérifie-t-elle une de ces conditions ?

Test 1.2.2
Chaque zone non cliquable (balise area sans attribut href) de décoration vérifie-t-elle une de ces conditions ?

Test 1.2.3
Chaque image objet (balise object avec l''attribut type="image/...") de décoration, sans légende, vérifie-t-elle ces conditions ?

Test 1.2.4
Chaque image vectorielle (balise svg) de décoration, sans légende, vérifie-t-elle ces conditions ?

Test 1.2.5
Chaque image bitmap (balise canvas) de décoration, sans légende, vérifie-t-elle ces conditions ?

Test 1.2.6
Chaque image embarquée (balise embed avec l''attribut type="image/...") de décoration, sans légende, vérifie-t-elle ces conditions ?'
where identifier = '1.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.3.1
Pour chaque image (balise img ou balise possédant un attribut WAI-ARIA role="img") porteuse d''information ayant une alternative textuelle, cette alternative est-elle pertinente (hors cas particuliers) ?

Test 1.3.2
Pour chaque zone (balise area) d''une image réactive porteuse d''information ayant une alternative textuelle, cette alternative est-elle pertinente ?

Test 1.3.3
Pour chaque bouton de type image (balise input avec l''attribut type="image") ayant une alternative textuelle, cette alternative est-elle pertinente ?

Test 1.3.4
Pour chaque image objet (balise object avec l''attribut type="image/...") porteuse d''information ayant une alternative textuelle ou un contenu alternatif, cette alternative est-elle pertinente ?

Test 1.3.5
Pour chaque image embarquée (balise embed avec l''attribut type="image/...") porteuse d''information ayant une alternative textuelle ou un contenu alternatif, cette alternative est-elle pertinente ?

Test 1.3.6
Pour chaque image vectorielle (balise svg) porteuse d''information ayant une alternative textuelle, cette alternative est-elle pertinente ?

Test 1.3.7
Pour chaque image bitmap (balise canvas) porteuse d''information ayant une alternative textuelle ou un contenu alternatif, cette alternative est-elle pertinente ?

Test 1.3.8
Pour chaque image bitmap (balise canvas) porteuse d''information et ayant un contenu alternatif entre <canvas> et </canvas>, ce contenu alternatif est-il correctement restitué par les technologies d''assistance ?

Test 1.3.9
Pour chaque image porteuse d''information ayant une alternative textuelle, l''alternative textuelle est-elle courte et concise (sauf cas particulier) ?'
where identifier = '1.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.4.1
Pour chaque image utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.2
Pour chaque zone d''une image réactive utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.3
Pour chaque bouton de type image utilisé comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?'
where identifier = '1.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.5.1
Chaque image (balises img, area, object, embed, svg, canvas ou possédant un attribut WAI-ARIA role="img") utilisée comme CAPTCHA vérifie-t-elle une de ces conditions ?

Test 1.5.2
Chaque bouton associé à une image (balise input avec l''attribut type="image") utilisée comme CAPTCHA vérifie-t-il une de ces conditions ?'
where identifier = '1.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.6.1
Chaque image (balise img) porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?

Test 1.6.2
Chaque image objet (balise object avec l''attribut type="image/...") porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?

Test 1.6.3
Chaque image embarquée (balise embed) porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?

Test 1.6.4
Chaque bouton de type image (balise input avec l''attribut type="image") porteur d''information qui nécessite une description détaillée vérifie-t-il une de ces conditions ?

Test 1.6.5
Chaque image vectorielle (balise svg) porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?

Test 1.6.6
Chaque image bitmap (balise canvas) porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?'
where identifier = '1.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.7.1
Pour chaque image (balise img) porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.2
Pour chaque bouton de type image (balise input avec l''attribut type="image") porteur d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.3
Pour chaque image objet, image embarquée, image vectorielle ou image bitmap porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?'
where identifier = '1.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.8.1
Chaque image texte porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?'
where identifier = '1.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 1.9.1
Chaque image pourvue d''une légende vérifie-t-elle, si nécessaire, ces conditions (association via figure / figcaption ou via les attributs ARIA appropriés) ?'
where identifier = '1.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 2 · Cadres (2 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 2.1.1
Chaque cadre en ligne (balise iframe) a-t-il un titre de cadre (attribut title) ?'
where identifier = '2.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 2.2.1
Pour chaque cadre en ligne (balise iframe) ayant un titre de cadre (attribut title), ce titre de cadre est-il pertinent ?'
where identifier = '2.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 3 · Couleurs (3 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 3.1.1
Dans chaque page web, l''information ne doit pas être donnée uniquement par la couleur. Repérer les éléments où la couleur véhicule une information (mots, ensembles de mots, indications textuelles, images, propriétés CSS) et vérifier qu''un complément (icône, texte, motif, autre indicateur visuel) est présent.'
where identifier = '3.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 3.2.1
Dans chaque page web, le contraste entre la couleur du texte non gras de moins de 24px et la couleur de son arrière-plan est-il d''au moins 4,5:1 (hors cas particuliers) ?

Test 3.2.2
Dans chaque page web, le contraste entre la couleur du texte gras de moins de 18,5px et la couleur de son arrière-plan est-il d''au moins 4,5:1 (hors cas particuliers) ?

Test 3.2.3
Dans chaque page web, le contraste entre la couleur du texte non gras de 24px et plus et la couleur de son arrière-plan est-il d''au moins 3:1 (hors cas particuliers) ?

Test 3.2.4
Dans chaque page web, le contraste entre la couleur du texte gras de 18,5px et plus et la couleur de son arrière-plan est-il d''au moins 3:1 (hors cas particuliers) ?'
where identifier = '3.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 3.3.1
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (rapport d''au moins 3:1, hors cas particuliers) ?

Test 3.3.2
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles, en cas de survol et de prise de focus, suffisamment contrastées (hors cas particuliers) ?'
where identifier = '3.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 4 · Multimédia (18 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 4.1.1
Chaque média temporel pré-enregistré seulement audio a-t-il, si nécessaire, une transcription textuelle pertinente (hors cas particuliers) ?

Test 4.1.2
Chaque média temporel pré-enregistré seulement vidéo a-t-il, si nécessaire, une transcription textuelle ou une audiodescription pertinente (hors cas particuliers) ?'
where identifier = '4.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.2.1
Pour chaque média temporel pré-enregistré seulement audio ayant une transcription textuelle, celle-ci est-elle pertinente (hors cas particuliers) ?

Test 4.2.2
Pour chaque média temporel pré-enregistré seulement vidéo ayant une transcription textuelle ou une audiodescription, celles-ci sont-elles pertinentes (hors cas particuliers) ?'
where identifier = '4.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.3.1
Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, des sous-titres synchronisés pertinents (hors cas particuliers) ?

Test 4.3.2
Chaque média temporel synchronisé en direct a-t-il, si nécessaire, des sous-titres synchronisés ?'
where identifier = '4.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.4.1
Pour chaque média temporel synchronisé pré-enregistré ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents ?

Test 4.4.2
Pour chaque média temporel synchronisé en direct ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents ?'
where identifier = '4.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.5.1
Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, une audiodescription synchronisée pertinente (hors cas particuliers) ?'
where identifier = '4.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.6.1
Pour chaque média temporel synchronisé pré-enregistré ayant une audiodescription synchronisée, celle-ci est-elle pertinente ?'
where identifier = '4.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.7.1
Chaque média temporel pré-enregistré ou en direct est-il clairement identifiable comme tel (hors cas particuliers) ?'
where identifier = '4.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.8.1
Chaque média non temporel a-t-il, si nécessaire, une alternative textuelle (hors cas particuliers) ?'
where identifier = '4.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.9.1
Pour chaque média non temporel ayant une alternative textuelle, l''alternative est-elle pertinente ?'
where identifier = '4.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.10.1
Chaque son déclenché automatiquement à l''ouverture ou au chargement d''une page peut-il être contrôlé (mis en pause, arrêté, volume réglable) par l''utilisateur ?'
where identifier = '4.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.11.1
Pour chaque média temporel, les fonctions essentielles (lecture, pause, arrêt, volume, position) sont-elles utilisables au clavier et avec tout dispositif de pointage ?

Test 4.11.2
Pour chaque média temporel, les contrôles disposent-ils d''un nom accessible et sont-ils restitués correctement par les technologies d''assistance ?'
where identifier = '4.11' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.12.1
Pour chaque média non temporel, l''ensemble des fonctionnalités est-il utilisable au clavier et avec tout dispositif de pointage ?'
where identifier = '4.12' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.13.1
Pour chaque média (temporel ou non), les contrôles, les états et les informations sont-ils restitués par les technologies d''assistance (rôles, noms accessibles, valeurs) (hors cas particuliers) ?'
where identifier = '4.13' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.14.1
Pour chaque média temporel disposant de sous-titres synchronisés, le bouton d''activation des sous-titres est-il présenté au même niveau que les contrôles principaux (lecture / pause / volume) ?

Test 4.14.2
Pour chaque média temporel disposant d''une audiodescription, le bouton d''activation de l''audiodescription est-il présenté au même niveau que les contrôles principaux ?'
where identifier = '4.14' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.15.1
Pour chaque fonctionnalité qui transmet, convertit ou enregistre un média temporel synchronisé pré-enregistré possédant une piste de sous-titres, vérifier qu''à l''issue du processus, les sous-titres restent présents et synchronisés.'
where identifier = '4.15' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.16.1
Pour chaque fonctionnalité qui transmet, convertit ou enregistre un média temporel pré-enregistré disposant d''une audiodescription synchronisée, vérifier qu''à l''issue du processus l''audiodescription est conservée et toujours synchronisée.'
where identifier = '4.16' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.17.1
Pour chaque média temporel pré-enregistré disposant de sous-titres, l''utilisateur peut-il personnaliser leur présentation (taille, couleur, contraste, position) (hors cas particuliers) ?'
where identifier = '4.17' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 4.18.1
Pour chaque média temporel synchronisé pré-enregistré disposant de sous-titres de traduction synchronisés, vérifier qu''ils peuvent être vocalisés via les technologies d''assistance ou un mécanisme dédié (hors cas particuliers).'
where identifier = '4.18' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 5 · Tableaux (8 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 5.1.1
Chaque tableau de données complexe a-t-il un résumé ?

Test 5.1.2
Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ?'
where identifier = '5.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.2.1
Pour chaque tableau de données complexe disposant d''un résumé, celui-ci décrit-il fidèlement la structure et l''objet du tableau ?'
where identifier = '5.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.3.1
Pour chaque tableau de mise en forme, le contenu linéarisé reste-t-il compréhensible ?'
where identifier = '5.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.4.1
Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau (via la balise caption ou un mécanisme ARIA équivalent) ?'
where identifier = '5.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.5.1
Pour chaque tableau de données ayant un titre, le titre est-il pertinent (décrit-il l''objet du tableau) ?'
where identifier = '5.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.6.1
Pour chaque tableau de données, chaque en-tête de colonne et chaque en-tête de ligne sont-ils correctement déclarés (balises th avec attribut scope, ou rôles ARIA équivalents) ?'
where identifier = '5.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.7.1
Pour chaque tableau de données, la technique appropriée permettant d''associer chaque cellule avec ses en-têtes (scope ou headers/id) est-elle utilisée (hors cas particuliers) ?'
where identifier = '5.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 5.8.1
Chaque tableau de mise en forme ne doit pas utiliser d''éléments propres aux tableaux de données (caption, summary, th, scope, headers, etc.). Cette règle est-elle respectée ?'
where identifier = '5.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 6 · Liens (2 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 6.1.1
Chaque lien texte est-il explicite (hors cas particuliers) ?

Test 6.1.2
Chaque lien image (balise a contenant une balise img ou input de type image, ou balise area, ou balise possédant un attribut WAI-ARIA role="link") a-t-il un intitulé explicite ?

Test 6.1.3
Chaque lien composite (lien comportant plusieurs balises) a-t-il un intitulé explicite ?

Test 6.1.4
Pour chaque lien ayant un intitulé visible, le nom accessible contient-il au moins l''intitulé visible ?'
where identifier = '6.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 6.2.1
Dans chaque page web, chaque lien (balise a avec un attribut href, balise area avec un attribut href ou balise possédant un attribut WAI-ARIA role="link") a-t-il un intitulé ?'
where identifier = '6.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 7 · Scripts (5 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 7.1.1
Chaque script est-il, si nécessaire, compatible avec les technologies d''assistance (rôles, noms accessibles, états, propriétés ARIA) ?

Test 7.1.2
Pour chaque script qui définit une zone de glisser-déposer, le script est-il contrôlable au clavier et par tout dispositif de pointage ?

Test 7.1.3
Pour chaque script qui définit un changement de contexte, le changement de contexte est-il contrôlable par l''utilisateur (annonce préalable, validation explicite ou possibilité d''annuler) ?'
where identifier = '7.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 7.2.1
Pour chaque script ayant une alternative, cette alternative est-elle pertinente (offre-t-elle l''accès à la même information ou à la même fonctionnalité) ?

Test 7.2.2
Pour chaque script qui initie un changement de contexte, l''utilisateur est-il averti ou en a-t-il le contrôle ?'
where identifier = '7.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 7.3.1
Chaque script est-il contrôlable par le clavier et par tout dispositif de pointage (hors cas particuliers) ?

Test 7.3.2
Le cas échéant, chaque script qui définit un raccourci clavier utilisant une lettre, une ponctuation, un chiffre ou un symbole peut-il être désactivé, remappé ou activé uniquement à la prise de focus du composant concerné ?'
where identifier = '7.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 7.4.1
Pour chaque script qui initie un changement de contexte (ouverture de fenêtre, changement de page, déplacement du focus, etc.), l''utilisateur est-il averti ou en a-t-il le contrôle ?'
where identifier = '7.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 7.5.1
Dans chaque page web, chaque message de statut indiquant le succès ou le résultat d''une action est-il correctement restitué par les technologies d''assistance (role="status" ou aria-live="polite") ?

Test 7.5.2
Dans chaque page web, chaque message de statut véhiculant une suggestion, un avertissement ou une alerte est-il correctement restitué (role="alert" ou aria-live="assertive") ?

Test 7.5.3
Dans chaque page web, chaque message de statut indiquant la progression d''un traitement est-il correctement restitué (role="progressbar" ou équivalent) ?'
where identifier = '7.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 8 · Éléments obligatoires (10 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 8.1.1
Chaque page web est-elle définie par un type de document (déclaration <!DOCTYPE>) ?

Test 8.1.2
Pour chaque page web disposant d''une déclaration de doctype, cette déclaration est-elle située avant la balise html ?'
where identifier = '8.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.2.1
Pour chaque page web, le code source généré est-il valide selon le type de document spécifié (validation HTML, hors cas particuliers) ?'
where identifier = '8.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.3.1
Chaque page web a-t-elle une langue par défaut déclarée via l''attribut lang sur la balise html ?'
where identifier = '8.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.4.1
Pour chaque page web ayant une langue par défaut, le code de langue (BCP 47) est-il valide et correspond-il à la langue principale du contenu ?'
where identifier = '8.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.5.1
Chaque page web a-t-elle un titre de page (balise title non vide) ?'
where identifier = '8.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.6.1
Pour chaque page web ayant un titre de page, ce titre est-il pertinent (décrit-il le contenu de la page de manière unique au sein du site) ?'
where identifier = '8.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.7.1
Dans chaque page web, chaque changement de langue est-il indiqué dans le code source via l''attribut lang sur l''élément concerné (hors cas particuliers : noms propres, expressions consacrées, etc.) ?'
where identifier = '8.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.8.1
Dans chaque page web, le code de langue de chaque changement de langue est-il valide (BCP 47) et pertinent ?'
where identifier = '8.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.9.1
Dans chaque page web, les balises ne doivent pas être utilisées uniquement à des fins de présentation (h1 utilisé pour grossir le texte, blockquote utilisé pour indenter, etc.). Cette règle est-elle respectée ?'
where identifier = '8.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 8.10.1
Dans chaque page web, les changements du sens de lecture (texte droite-à-gauche dans une page gauche-à-droite ou inversement) sont-ils signalés via l''attribut dir ?'
where identifier = '8.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 9 · Structuration de l'information (4 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 9.1.1
Dans chaque page web, l''information est-elle structurée par l''utilisation appropriée de titres (balises h1 à h6) ?

Test 9.1.2
Dans chaque page web, la hiérarchie entre les titres est-elle pertinente (pas de saut de niveau dans la descente) ?

Test 9.1.3
Dans chaque page web ayant une section principale, la section principale est-elle introduite par un titre de niveau 1 ?'
where identifier = '9.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 9.2.1
Dans chaque page web, la structure du document est-elle cohérente (utilisation des balises de sectionnement HTML5 ou des rôles ARIA de landmark : banner, navigation, main, contentinfo, etc.) (hors cas particuliers) ?'
where identifier = '9.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 9.3.1
Dans chaque page web, chaque liste est-elle correctement structurée (balises ul, ol, dl avec leurs descendants attendus) ?'
where identifier = '9.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 9.4.1
Dans chaque page web, chaque citation est-elle correctement indiquée (balise blockquote pour les citations longues, q pour les citations courtes) ?'
where identifier = '9.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 10 · Présentation de l'information (14 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 10.1.1
Dans le site web, des feuilles de styles sont-elles utilisées pour contrôler la présentation de l''information ?

Test 10.1.2
Dans chaque page web, l''information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées ?

Test 10.1.3
Dans chaque page web, l''information reste-t-elle visible lorsque les feuilles de styles sont désactivées (hors cas particuliers) ?'
where identifier = '10.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.2.1
Dans chaque page web, le contenu visible reste-t-il présent lorsque les feuilles de styles sont désactivées ?'
where identifier = '10.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.3.1
Dans chaque page web, l''information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées (ordre de lecture cohérent) ?'
where identifier = '10.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.4.1
Dans chaque page web, le texte reste-t-il lisible lorsque la taille des caractères est augmentée jusqu''à 200% au moins (hors cas particuliers) ?'
where identifier = '10.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.5.1
Dans chaque page web, les déclarations CSS de couleurs de fond d''élément et de police sont-elles correctement utilisées (chaque déclaration de couleur de texte est accompagnée d''une déclaration de couleur de fond de l''élément ou d''un de ses ancêtres) ?'
where identifier = '10.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.6.1
Dans chaque page web, chaque lien dont la nature n''est pas évidente est-il visible par rapport au texte environnant (rapport de contraste de 3:1 minimum ou indication non chromatique) ?'
where identifier = '10.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.7.1
Dans chaque page web, pour chaque élément recevant le focus, la prise de focus est-elle visible (indicateur natif ou personnalisé) ?'
where identifier = '10.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.8.1
Pour chaque page web, les contenus cachés sont-ils correctement ignorés par les technologies d''assistance (display:none, visibility:hidden, aria-hidden="true", hidden) ?'
where identifier = '10.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.9.1
Dans chaque page web, l''information ne doit pas être donnée uniquement par la forme, taille ou position. Cette règle est-elle respectée ?'
where identifier = '10.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.10.1
Dans chaque page web, l''information donnée par la forme, taille ou position est-elle implémentée de façon pertinente (existence d''un complément textuel ou d''un autre indicateur) ?'
where identifier = '10.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.11.1
Pour chaque page web, les contenus peuvent-ils être présentés sans avoir recours simultanément à un défilement vertical pour une fenêtre de 256px de haut et à un défilement horizontal pour une fenêtre de 320px de large (hors cas particuliers) ?

Test 10.11.2
Pour chaque page web, les contenus restent-ils disponibles d''une orientation à l''autre (portrait/paysage) (hors cas particuliers) ?'
where identifier = '10.11' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.12.1
Dans chaque page web, les propriétés d''espacement du texte (interligne >= 1,5x, espacement entre paragraphes >= 2x, espacement entre lettres >= 0,12x, espacement entre mots >= 0,16x) peuvent-elles être redéfinies par l''utilisateur sans perte de contenu ou de fonctionnalité (hors cas particuliers) ?'
where identifier = '10.12' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.13.1
Dans chaque page web, les contenus additionnels apparaissant à la prise de focus ou au survol d''un composant d''interface sont-ils contrôlables par l''utilisateur (peuvent être atteints au pointeur sans disparaître, persistants, masquables sans déplacer le focus) (hors cas particuliers) ?'
where identifier = '10.13' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 10.14.1
Dans chaque page web, les contenus additionnels apparaissant via les styles CSS peuvent-ils être rendus visibles au clavier et par tout dispositif de pointage (hors cas particuliers) ?

Test 10.14.2
Dans chaque page web, ces contenus additionnels peuvent-ils être masqués sans déplacer le focus ou le pointeur (hors cas particuliers) ?'
where identifier = '10.14' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 11 · Formulaires (13 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 11.1.1
Chaque champ de formulaire a-t-il une étiquette ?

Test 11.1.2
Pour chaque champ de formulaire ayant une étiquette, l''étiquette est-elle correctement reliée au champ (label/for, aria-labelledby, aria-label, title) ?

Test 11.1.3
Pour chaque champ de formulaire ayant une étiquette accessible, celle-ci est-elle pertinente ?'
where identifier = '11.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.2.1
Chaque étiquette associée à un champ de formulaire est-elle pertinente (hors cas particuliers) ?

Test 11.2.2
Pour chaque champ ayant une étiquette accessible distincte de son étiquette visible, le nom accessible débute-t-il par le contenu de l''étiquette visible ?'
where identifier = '11.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.3.1
Dans chaque formulaire, chaque étiquette associée à un champ ayant la même fonction et présente plusieurs fois dans une même page ou un ensemble de pages est-elle cohérente ?'
where identifier = '11.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.4.1
Dans chaque formulaire, chaque étiquette de champ et son champ associé sont-ils accolés visuellement (hors cas particuliers) ?'
where identifier = '11.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.5.1
Dans chaque formulaire, les champs de même nature sont-ils regroupés, si nécessaire, dans une balise fieldset ?

Test 11.5.2
Dans chaque formulaire, chaque regroupement (fieldset) a-t-il une légende (legend) pertinente ?'
where identifier = '11.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.6.1
Dans chaque formulaire, chaque liste de choix (select) a-t-elle, si nécessaire, un regroupement d''options (optgroup) ?

Test 11.6.2
Dans chaque formulaire, chaque optgroup a-t-il un attribut label pertinent ?'
where identifier = '11.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.7.1
Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?'
where identifier = '11.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.8.1
Dans chaque formulaire, l''ordre de tabulation des champs est-il cohérent avec l''ordre logique de saisie ?'
where identifier = '11.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.9.1
Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?

Test 11.9.2
Dans chaque formulaire, chaque bouton ayant un intitulé visible voit-il son nom accessible débuter par son intitulé visible ?'
where identifier = '11.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.10.1
Dans chaque formulaire, le contrôle de saisie est-il utilisé de manière pertinente ?

Test 11.10.2
Dans chaque formulaire, chaque champ obligatoire est-il indiqué à l''utilisateur préalablement à la validation (hors cas particuliers) ?

Test 11.10.3
Dans chaque formulaire, chaque indication relative à un format de saisie obligatoire ou de type particulier est-elle correctement renseignée (hors cas particuliers) ?

Test 11.10.4
Dans chaque formulaire, chaque erreur de saisie est-elle indiquée à l''utilisateur (texte explicite, identification du champ concerné) ?

Test 11.10.5
Dans chaque formulaire, l''utilisateur peut-il modifier les saisies effectuées dans les champs obligatoires (hors cas particuliers) ?'
where identifier = '11.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.11.1
Dans chaque formulaire, le contrôle de saisie est-il accompagné, si nécessaire, de suggestions facilitant la correction des erreurs de saisie ?'
where identifier = '11.11' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.12.1
Pour chaque formulaire qui modifie ou supprime des données, ou qui transmet des réponses à un test ou à un examen, ou dont la validation a des conséquences financières ou juridiques, la saisie permet-elle un contrôle, une confirmation ou une annulation ?

Test 11.12.2
Pour chaque formulaire nécessitant l''ajout, la modification ou la suppression de données, l''utilisateur peut-il facilement annuler son action ou récupérer les données après validation ?'
where identifier = '11.12' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 11.13.1
La finalité de chaque champ de saisie collectant une information sur l''utilisateur peut-elle être déduite (attribut autocomplete renseigné avec une valeur de la liste WCAG 1.3.5) pour faciliter le remplissage automatique ?'
where identifier = '11.13' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 12 · Navigation (11 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 12.1.1
Chaque ensemble de pages dispose-t-il de deux systèmes de navigation différents au moins (menu de navigation, plan du site, moteur de recherche) (hors cas particuliers) ?'
where identifier = '12.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.2.1
Dans chaque ensemble de pages, le menu et les barres de navigation sont-ils toujours à la même place et présentés de manière cohérente (hors cas particuliers) ?'
where identifier = '12.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.3.1
La page « plan du site » est-elle pertinente (offre-t-elle une vue d''ensemble structurée du site) ?'
where identifier = '12.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.4.1
Dans chaque ensemble de pages, la page « plan du site » est-elle accessible de manière identique (lien présent et visible sur toutes les pages) ?'
where identifier = '12.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.5.1
Dans chaque ensemble de pages, le moteur de recherche est-il accessible de manière identique (présent et fonctionnel sur toutes les pages) ?'
where identifier = '12.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.6.1
Les zones de regroupement de contenus présentes dans plusieurs pages web (en-tête, navigation principale, contenu principal, pied de page, moteur de recherche) peuvent-elles être atteintes ou évitées via un mécanisme adéquat (landmarks ARIA, balises HTML5 de sectionnement, liens d''évitement) ?'
where identifier = '12.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.7.1
Dans chaque page web, un lien d''évitement ou d''accès rapide à la zone de contenu principal est-il présent (hors cas particuliers) ?'
where identifier = '12.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.8.1
Dans chaque page web, l''ordre de tabulation est-il cohérent avec l''ordre logique de lecture du contenu ?'
where identifier = '12.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.9.1
Dans chaque page web, la navigation ne doit pas contenir de piège au clavier (l''utilisateur peut entrer et sortir de chaque composant). Cette règle est-elle respectée ?'
where identifier = '12.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.10.1
Dans chaque page web, les raccourcis clavier n''utilisant qu''une seule touche (lettre, ponctuation, chiffre ou symbole) sont-ils contrôlables par l''utilisateur (désactivation, remappage ou activation uniquement à la prise de focus du composant) ?'
where identifier = '12.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 12.11.1
Dans chaque page web, les contenus additionnels apparaissant au survol, à la prise de focus ou à l''activation d''un composant d''interface sont-ils, si nécessaire, atteignables au clavier ?'
where identifier = '12.11' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 13 · Consultation (14 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 13.1.1
Pour chaque page web, l''utilisateur a-t-il le contrôle de chaque limite de temps modifiant le contenu (hors cas particuliers) ?

Test 13.1.2
Pour chaque page web, l''utilisateur peut-il rallonger la session d''authentification (hors cas particuliers) ?

Test 13.1.3
Pour chaque page web, l''utilisateur est-il informé des limites de temps imposées par le serveur (hors cas particuliers) ?'
where identifier = '13.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.2.1
Dans chaque page web, l''ouverture d''une nouvelle fenêtre ne doit pas être déclenchée sans action de l''utilisateur. Cette règle est-elle respectée ?

Test 13.2.2
Dans chaque page web, chaque ouverture de nouvelle fenêtre est-elle signalée à l''utilisateur ?

Test 13.2.3
Dans chaque page web, chaque rafraîchissement automatique doit pouvoir être désactivé. Cette règle est-elle respectée ?

Test 13.2.4
Dans chaque page web, chaque redirection automatique doit pouvoir être désactivée ou effectuée sans limite de temps. Cette règle est-elle respectée ?'
where identifier = '13.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.3.1
Dans chaque page web, chaque document bureautique en téléchargement (PDF, DOCX, ODT, XLSX, etc.) possède-t-il, si nécessaire, une version accessible (hors cas particuliers) ?'
where identifier = '13.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.4.1
Pour chaque document bureautique ayant une version accessible, cette version offre-t-elle la même information ?'
where identifier = '13.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.5.1
Dans chaque page web, chaque contenu cryptique (art ASCII, émoticône, syntaxe cryptique) est-il correctement identifié (alternative ou explication) ?'
where identifier = '13.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.6.1
Dans chaque page web, pour chaque contenu cryptique ayant une alternative, cette alternative est-elle pertinente ?'
where identifier = '13.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.7.1
Dans chaque page web, les changements brusques de luminosité ou les effets de flash respectent-ils les seuils admis (pas plus de 3 flashs par seconde, ou flashs de faible intensité et de petite surface) ?'
where identifier = '13.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.8.1
Dans chaque page web, chaque contenu en mouvement déclenché automatiquement peut-il être mis en pause par l''utilisateur (hors cas particuliers) ?

Test 13.8.2
Dans chaque page web, chaque contenu clignotant déclenché automatiquement peut-il être mis en pause par l''utilisateur ?

Test 13.8.3
Dans chaque page web, chaque contenu en mouvement ou clignotant déclenché automatiquement peut-il être arrêté ou masqué par l''utilisateur ?'
where identifier = '13.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.9.1
Dans chaque page web, le contenu proposé est-il consultable quelle que soit l''orientation de l''écran (portrait ou paysage) (hors cas particuliers) ?'
where identifier = '13.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.10.1
Dans chaque page web, les fonctionnalités utilisables ou disponibles au moyen d''un geste complexe (double tape, glisser, pincer, etc.) peuvent-elles être également disponibles au moyen d''un geste simple (clic ou activation au clavier) (hors cas particuliers) ?'
where identifier = '13.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.11.1
Dans chaque page web, les actions déclenchées au moyen d''un dispositif de pointage sur un point unique de l''écran peuvent-elles faire l''objet d''une annulation (action déclenchée à la levée du pointeur, possibilité de revenir en arrière, etc.) (hors cas particuliers) ?'
where identifier = '13.11' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.12.1
Dans chaque page web, les fonctionnalités qui impliquent un mouvement de l''appareil ou vers l''appareil (secousse, inclinaison, gestes en l''air) peuvent-elles être satisfaites de manière alternative (interface classique, bouton, menu) (hors cas particuliers) ?

Test 13.12.2
Dans chaque page web, le déclenchement d''une fonctionnalité par un mouvement de l''appareil peut-il être désactivé par l''utilisateur (hors cas particuliers) ?'
where identifier = '13.12' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.13.1
Pour chaque fonctionnalité de conversion d''un document, les informations relatives à l''accessibilité disponibles dans le document source (titres, alternatives textuelles, structure, langue, etc.) sont-elles conservées dans le document de destination (hors cas particuliers) ?'
where identifier = '13.13' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 13.14.1
Chaque fonctionnalité d''identification ou de contrôle qui repose sur l''utilisation de caractéristiques biologiques de l''utilisateur (empreinte, reconnaissance faciale, vocale, etc.) dispose-t-elle d''une méthode d''authentification ou de contrôle alternative ne nécessitant pas ces caractéristiques ?'
where identifier = '13.14' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 14 · Documentation et fonctionnalités d'accessibilité (3 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 14.1.1
La documentation du site web décrit-elle l''ensemble des fonctionnalités d''accessibilité disponibles (raccourcis clavier, modes alternatifs, configurations particulières) ?

Test 14.1.2
La documentation du site web décrit-elle les informations relatives à la compatibilité avec les technologies d''assistance (navigateurs supportés, lecteurs d''écran testés, versions, plateformes) ?'
where identifier = '14.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 14.2.1
Pour chaque fonctionnalité d''accessibilité décrite dans la documentation, vérifier que le mécanisme qui permet de l''activer est effectivement présent dans le site web et fonctionnel.

Test 14.2.2
Pour chaque fonctionnalité d''accessibilité décrite, le mécanisme d''activation répond-il aux besoins d''accessibilité des utilisateurs concernés (utilisable au clavier, restitué par les technologies d''assistance, contraste suffisant, etc.) (hors cas particuliers) ?'
where identifier = '14.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 14.3.1
La documentation du site web (manuel utilisateur, aide en ligne, tutoriels, guides) est-elle elle-même conforme aux règles d''accessibilité numérique (structure, alternatives, contrastes, navigation, etc.) ?'
where identifier = '14.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 15 · Outils d'édition (6 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 15.1.1
Pour chaque outil d''édition fourni par le site web (éditeur WYSIWYG, formulaire de publication, etc.), vérifier qu''il permet de définir les informations d''accessibilité nécessaires (alternatives textuelles, hiérarchie de titres, langue, etc.) pour produire un contenu conforme.'
where identifier = '15.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 15.2.1
Pour chaque outil d''édition, vérifier qu''il met à disposition des aides à la création de contenus accessibles (info-bulles, aide contextuelle, vérificateur d''accessibilité, suggestions, exemples, etc.).'
where identifier = '15.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 15.3.1
Pour chaque transformation appliquée au contenu par l''outil (rendu HTML, export PDF, conversion de format, etc.), le contenu généré est-il conforme aux règles d''accessibilité numérique (hors cas particuliers) ?'
where identifier = '15.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 15.4.1
Pour chaque erreur d''accessibilité détectée par un test automatique ou semi-automatique de l''outil d''édition, l''outil fournit-il des suggestions de réparation (procédure, exemple, lien vers la documentation) ?'
where identifier = '15.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 15.5.1
Pour chaque ensemble de gabarits proposés par l''outil d''édition (templates, thèmes, mises en page), au moins un gabarit permet-il de répondre aux règles d''accessibilité numérique ?'
where identifier = '15.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 15.6.1
Chaque gabarit qui permet de répondre aux règles d''accessibilité numérique est-il clairement identifiable par l''utilisateur (mention, étiquette, badge, filtre, etc.) ?'
where identifier = '15.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 16 · Services d'assistance (3 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 16.1.1
Pour chaque service d''assistance proposé par le site web (FAQ, support client, hotline, chat), vérifier qu''il fournit des informations relatives aux fonctionnalités d''accessibilité et à la compatibilité avec l''accessibilité décrites dans la documentation du site.'
where identifier = '16.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 16.2.1
Chaque service d''assistance répond-il aux besoins de communication des personnes handicapées, soit directement (langue des signes, écrit en temps réel, audiodescription, etc.), soit par l''intermédiaire d''un service de relais (relais téléphonique, relais visuel, traduction, etc.) ?'
where identifier = '16.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 16.3.1
La documentation fournie par le service d''assistance (réponses, articles, FAQ, tutoriels) est-elle conforme aux règles d''accessibilité numérique (structure, alternatives, contrastes, navigation, etc.) ?'
where identifier = '16.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Thème 17 · Communication en temps réel (11 critères)
-- ============================================================================

update public.criteria set methodology = 'Test 17.1.1
Pour chaque application web de communication orale bidirectionnelle, vérifier que l''application est capable d''encoder et de décoder cette communication avec une gamme de fréquences dont la limite supérieure est de 7 000 Hz au moins (qualité « voix large bande » HD Voice).'
where identifier = '17.1' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.2.1
Chaque application web qui permet une communication orale bidirectionnelle dispose-t-elle d''une fonctionnalité de communication écrite en temps réel (RTT — Real-Time Text) accessible aux personnes sourdes ou malentendantes ?'
where identifier = '17.2' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.3.1
Pour chaque application web qui permet une communication orale bidirectionnelle ET écrite en temps réel, vérifier que les deux modes sont utilisables simultanément (chacun pouvant utiliser le mode qui lui convient).'
where identifier = '17.3' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.4.1
Pour chaque fonctionnalité de communication écrite en temps réel, vérifier que les messages peuvent être identifiés (auteur, horodatage, distinction visuelle ou textuelle des contributions) (hors cas particuliers).'
where identifier = '17.4' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.5.1
Pour chaque application web de communication orale bidirectionnelle, vérifier qu''un indicateur visuel de l''activité orale (qui parle, niveau du micro, etc.) est présent et restitué par les technologies d''assistance.'
where identifier = '17.5' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.6.1
Chaque application web de communication écrite en temps réel qui peut interagir avec d''autres applications de communication écrite en temps réel respecte-t-elle les règles d''interopérabilité en vigueur (RFC 4103 / T.140 ou équivalent) ?'
where identifier = '17.6' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.7.1
Pour chaque application web de communication écrite en temps réel, vérifier que le délai de transmission de chaque unité de saisie (caractère ou groupe de caractères) est de 500 ms ou moins entre la saisie et l''affichage chez l''interlocuteur.'
where identifier = '17.7' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.8.1
Pour chaque application web de télécommunication, l''identification de l''interlocuteur qui initie un appel est-elle accessible (notification visuelle ET sonore, restituée par les technologies d''assistance) ?'
where identifier = '17.8' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.9.1
Pour chaque application web de communication orale bidirectionnelle qui permet d''identifier l''activité d''un interlocuteur oralisant (voix), vérifier qu''il est également possible d''identifier l''activité d''un interlocuteur signant (langue des signes) — typiquement via une mise en avant visuelle de la fenêtre vidéo de la personne signant.'
where identifier = '17.9' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.10.1
Pour chaque application web de communication orale bidirectionnelle qui dispose de fonctionnalités vocales (commandes vocales, transcription, etc.), vérifier que ces fonctionnalités sont utilisables sans la nécessité d''écouter ou parler (alternatives par texte, par image, par geste).'
where identifier = '17.10' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

update public.criteria set methodology = 'Test 17.11.1
Pour chaque application web de communication orale bidirectionnelle qui dispose d''une vidéo en temps réel, vérifier que la qualité de la vidéo est suffisante pour permettre la lecture labiale et la compréhension de la langue des signes (résolution, fréquence d''images, faible latence).'
where identifier = '17.11' and thematic_id in (select id from public.thematics where reference_id = '44444444-4444-4444-4444-444444444444');

-- ============================================================================
-- Vérification finale : on doit avoir au moins 130 critères avec methodology
-- ============================================================================

do $$
declare
  filled_count int;
  total_count  int;
begin
  select count(*) into total_count
  from public.criteria
  where thematic_id in (
    select id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444'
  );

  select count(*) into filled_count
  from public.criteria
  where methodology is not null
    and thematic_id in (
      select id from public.thematics
      where reference_id = '44444444-4444-4444-4444-444444444444'
    );

  raise notice 'RAWeb · methodology remplie pour % critères sur %', filled_count, total_count;

  if filled_count < 130 then
    raise exception 'RAWeb · methodology insuffisamment remplie : % / 136 (attendu >= 130)', filled_count;
  end if;
end$$;

commit;
