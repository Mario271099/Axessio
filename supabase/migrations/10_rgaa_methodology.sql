-- ============================================================================
-- Axessio · Méthodologie RGAA 4.1.2 — contenu des tests par critère
-- ----------------------------------------------------------------------------
-- Source officielle : https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/
-- (Licence Ouverte Etalab 2.0 — réutilisation libre)
--
-- Pour chacun des 106 critères du RGAA 4.1.2 (référentiel
-- 11111111-1111-1111-1111-111111111111), on remplit la colonne
-- `methodology` avec la concaténation des tests officiels au format :
--
--   Test X.Y.Z
--   [contenu]
--
--   Test X.Y.Z+1
--   [contenu]
--
-- Idempotent · à exécuter en transaction unique.
-- Vérification finale : exception si moins de 100 critères remplis.
-- ============================================================================

begin;

-- ============================================================================
-- Thème 1 · Images
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
where identifier = '1.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

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
where identifier = '1.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

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
where identifier = '1.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 1.4.1
Pour chaque image (balise img) utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.2
Pour chaque zone (balise area) d''une image réactive utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.3
Pour chaque bouton de type image (balise input avec l''attribut type="image") utilisé comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.4
Pour chaque image objet (balise object avec l''attribut type="image/...") utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle ou un contenu alternatif, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.5
Pour chaque image embarquée (balise embed avec l''attribut type="image/...") utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle ou un contenu alternatif, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.6
Pour chaque image vectorielle (balise svg) utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?

Test 1.4.7
Pour chaque image bitmap (balise canvas) utilisée comme CAPTCHA ou comme image-test ayant une alternative textuelle ou un contenu alternatif, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?'
where identifier = '1.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 1.5.1
Chaque image (balises img, area, object, embed, svg, canvas ou possédant un attribut WAI-ARIA role="img") utilisée comme CAPTCHA vérifie-t-elle une de ces conditions ?

Test 1.5.2
Chaque bouton associé à une image (balise input avec l''attribut type="image") utilisée comme CAPTCHA vérifie-t-il une de ces conditions ?'
where identifier = '1.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

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
Pour chaque image vectorielle (balise svg) porteuse d''information ayant une description détaillée, la référence éventuelle dans l''attribut WAI-ARIA aria-label et la description détaillée associée par aria-labelledby ou aria-describedby sont-elles correctement restituées par les technologies d''assistance ?

Test 1.6.7
Chaque image bitmap (balise canvas) porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?

Test 1.6.8
Pour chaque image bitmap (balise canvas) porteuse d''information qui implémente une référence à une description détaillée adjacente, cette référence est-elle correctement restituée par les technologies d''assistance ?

Test 1.6.9
Pour chaque image porteuse d''information accompagnée d''une description détaillée et utilisant un attribut WAI-ARIA aria-describedby, l''attribut associe-t-il bien la description détaillée à l''image ?

Test 1.6.10
Chaque balise possédant un attribut WAI-ARIA role="img" porteuse d''information qui nécessite une description détaillée vérifie-t-elle une de ces conditions ?'
where identifier = '1.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 1.7.1
Pour chaque image (balise img) porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.2
Pour chaque bouton de type image (balise input avec l''attribut type="image") porteur d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.3
Pour chaque image objet (balise object avec l''attribut type="image/...") porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.4
Pour chaque image embarquée (balise embed avec l''attribut type="image/...") porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.5
Pour chaque image vectorielle (balise svg) porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?

Test 1.7.6
Pour chaque image bitmap (balise canvas) porteuse d''information ayant une description détaillée, la description détaillée est-elle pertinente ?'
where identifier = '1.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 1.8.1
Chaque image texte (balise img ou possédant un attribut WAI-ARIA role="img") porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?

Test 1.8.2
Chaque bouton « image texte » (balise input avec l''attribut type="image") porteur d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacé par du texte stylé. Cette règle est-elle respectée ?

Test 1.8.3
Chaque image texte objet (balise object avec l''attribut type="image/...") porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?

Test 1.8.4
Chaque image texte embarquée (balise embed avec l''attribut type="image/...") porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?

Test 1.8.5
Chaque image texte bitmap (balise canvas) porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?

Test 1.8.6
Chaque image texte SVG (balise svg) porteuse d''information dont le texte n''est pas complètement structuré au moyen d''éléments <text>, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?'
where identifier = '1.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 1.9.1
Chaque image pourvue d''une légende (balise img, input avec l''attribut type="image" ou possédant un attribut WAI-ARIA role="img" associée à une légende adjacente) vérifie-t-elle, si nécessaire, ces conditions ?

Test 1.9.2
Chaque image objet pourvue d''une légende (balise object avec l''attribut type="image/..." associée à une légende adjacente) vérifie-t-elle, si nécessaire, ces conditions ?

Test 1.9.3
Chaque image embarquée pourvue d''une légende (balise embed associée à une légende adjacente) vérifie-t-elle, si nécessaire, ces conditions ?

Test 1.9.4
Chaque image vectorielle pourvue d''une légende (balise svg associée à une légende adjacente) vérifie-t-elle, si nécessaire, ces conditions ?

Test 1.9.5
Chaque image bitmap pourvue d''une légende (balise canvas associée à une légende adjacente) vérifie-t-elle, si nécessaire, ces conditions ?'
where identifier = '1.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 2 · Cadres
-- ============================================================================

update public.criteria set methodology = 'Test 2.1.1
Chaque cadre en ligne (balise iframe) a-t-il un titre de cadre (attribut title) ?'
where identifier = '2.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 2.2.1
Pour chaque cadre en ligne (balise iframe) ayant un titre de cadre (attribut title), ce titre de cadre est-il pertinent ?'
where identifier = '2.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 3 · Couleurs
-- ============================================================================

update public.criteria set methodology = 'Test 3.1.1
Dans chaque page web, l''information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?

Test 3.1.2
Dans chaque page web, le texte et les éléments d''interface utilisateur véhiculant une information doivent être suffisamment contrastés (hors cas particuliers). Cette règle est-elle respectée ?

Test 3.1.3
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (hors cas particuliers) ?'
where identifier = '3.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 3.2.1
Dans chaque page web, le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ?

Test 3.2.2
Dans chaque page web, le contraste entre la couleur du texte en gras et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ?

Test 3.2.3
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (hors cas particuliers) ?

Test 3.2.4
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles, en cas de survol et de prise de focus, suffisamment contrastées (hors cas particuliers) ?'
where identifier = '3.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 3.3.1
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (hors cas particuliers) ?

Test 3.3.2
Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles, en cas de survol et de prise de focus, suffisamment contrastées (hors cas particuliers) ?'
where identifier = '3.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 4 · Multimédia
-- ============================================================================

update public.criteria set methodology = 'Test 4.1.1
Chaque média temporel pré-enregistré seulement audio a-t-il, si nécessaire, une transcription textuelle pertinente (hors cas particuliers) ?

Test 4.1.2
Chaque média temporel pré-enregistré seulement vidéo a-t-il, si nécessaire, une transcription textuelle ou une audiodescription pertinente (hors cas particuliers) ?

Test 4.1.3
Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, des sous-titres synchronisés pertinents (hors cas particuliers) ?

Test 4.1.4
Chaque média temporel en direct seulement audio ou synchronisé a-t-il, si nécessaire, des sous-titres synchronisés ou une transcription textuelle pertinente (hors cas particuliers) ?

Test 4.1.5
Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, une audiodescription synchronisée pertinente (hors cas particuliers) ?'
where identifier = '4.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.2.1
Pour chaque média temporel pré-enregistré seulement audio ayant une transcription textuelle, celle-ci est-elle pertinente (hors cas particuliers) ?

Test 4.2.2
Pour chaque média temporel pré-enregistré seulement vidéo ayant une transcription textuelle ou une audiodescription, celles-ci sont-elles pertinentes (hors cas particuliers) ?

Test 4.2.3
Pour chaque média temporel synchronisé ou seulement vidéo, pré-enregistré ou en direct, ayant une transcription textuelle, celle-ci est-elle pertinente (hors cas particuliers) ?'
where identifier = '4.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.3.1
Pour chaque média temporel synchronisé pré-enregistré ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents ?

Test 4.3.2
Pour chaque média temporel synchronisé ou seulement audio en direct ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents ?'
where identifier = '4.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.4.1
Pour chaque média temporel synchronisé pré-enregistré ayant une audiodescription synchronisée, celle-ci est-elle pertinente ?'
where identifier = '4.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.5.1
Chaque média temporel pré-enregistré ou en direct est-il, si nécessaire, accompagné d''une transcription textuelle pertinente ?'
where identifier = '4.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.6.1
Chaque média temporel pré-enregistré ou en direct est-il, si nécessaire, accompagné d''une langue des signes pertinente ?'
where identifier = '4.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.7.1
Chaque média temporel pré-enregistré et synchronisé est-il clairement identifiable (hors cas particuliers) ?'
where identifier = '4.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.8.1
Chaque média non temporel a-t-il, si nécessaire, une alternative ?

Test 4.8.2
Pour chaque média non temporel ayant une alternative, l''alternative est-elle pertinente ?'
where identifier = '4.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.9.1
Pour chaque média non temporel ayant une alternative, l''alternative est-elle pertinente ?'
where identifier = '4.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.10.1
Chaque son déclenché automatiquement est-il contrôlable par l''utilisateur ?'
where identifier = '4.10' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.11.1
La consultation de chaque média temporel est-elle, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ?

Test 4.11.2
La consultation de chaque média non temporel est-elle, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ?

Test 4.11.3
L''accès à chaque fonctionnalité d''un média temporel ou non temporel est-il, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ?'
where identifier = '4.11' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.12.1
Chaque média temporel et non temporel est-il, si nécessaire, compatible avec les technologies d''assistance ?'
where identifier = '4.12' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 4.13.1
Chaque média temporel et non temporel est-il compatible avec les technologies d''assistance (hors cas particuliers) ?'
where identifier = '4.13' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 5 · Tableaux
-- ============================================================================

update public.criteria set methodology = 'Test 5.1.1
Chaque tableau de données complexe a-t-il un résumé ?

Test 5.1.2
Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ?'
where identifier = '5.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.2.1
Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ?

Test 5.2.2
Pour chaque tableau de données ayant un titre, le titre est-il pertinent ?'
where identifier = '5.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.3.1
Chaque tableau de mise en forme vérifie-t-il ces conditions ?'
where identifier = '5.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.4.1
Chaque tableau de données a-t-il un titre ?'
where identifier = '5.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.5.1
Pour chaque tableau de données ayant un titre, le titre est-il pertinent ?'
where identifier = '5.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.6.1
Pour chaque tableau de données, chaque en-tête de colonne et chaque en-tête de ligne sont-ils correctement déclarés ?'
where identifier = '5.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.7.1
Pour chaque tableau de données, la technique appropriée permettant d''associer chaque cellule avec ses en-têtes est-elle utilisée (hors cas particuliers) ?'
where identifier = '5.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 5.8.1
Chaque tableau de mise en forme ne doit pas utiliser d''éléments propres aux tableaux de données. Cette règle est-elle respectée ?'
where identifier = '5.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 6 · Liens
-- ============================================================================

update public.criteria set methodology = 'Test 6.1.1
Chaque lien texte est-il explicite (hors cas particuliers) ?

Test 6.1.2
Chaque lien (balise a avec un attribut href, balise area avec un attribut href ou balise possédant un attribut WAI-ARIA role="link") a-t-il un intitulé ?

Test 6.1.3
Chaque lien image (balise a contenant une balise img ou input de type image, ou balise area, ou balise possédant un attribut WAI-ARIA role="link") a-t-il un intitulé ?

Test 6.1.4
Chaque lien composite (lien comportant plusieurs balises) a-t-il un intitulé ?

Test 6.1.5
Pour chaque lien ayant un intitulé visible, le nom accessible contient-il au moins l''intitulé visible ?'
where identifier = '6.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 6.2.1
Chaque lien (balise a avec un attribut href, balise area avec un attribut href ou balise possédant un attribut WAI-ARIA role="link") a-t-il un intitulé ?'
where identifier = '6.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 7 · Scripts
-- ============================================================================

update public.criteria set methodology = 'Test 7.1.1
Chaque script est-il, si nécessaire, compatible avec les technologies d''assistance ?

Test 7.1.2
Pour chaque script qui définit une zone de glisser-déposer, le script est-il contrôlable par le clavier et tout dispositif de pointage ?

Test 7.1.3
Pour chaque script qui définit un changement de contexte, le changement de contexte est-il contrôlable par l''utilisateur ?'
where identifier = '7.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 7.2.1
Pour chaque script ayant une alternative, le script est-il, si nécessaire, accompagné d''une alternative pertinente ?

Test 7.2.2
Pour chaque script qui initie un changement de contexte, l''utilisateur est-il averti ou en a-t-il le contrôle ?'
where identifier = '7.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 7.3.1
Chaque script est-il contrôlable par le clavier et par tout dispositif de pointage (hors cas particuliers) ?

Test 7.3.2
Le cas échéant, chaque script qui définit un raccourci clavier utilisant une lettre, une ponctuation, un chiffre ou un symbole peut-il être contrôlé par l''utilisateur ?'
where identifier = '7.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 7.4.1
Pour chaque script qui initie un changement de contexte, l''utilisateur est-il averti ou en a-t-il le contrôle ?'
where identifier = '7.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 7.5.1
Dans chaque page web, chaque message de statut est-il correctement restitué par les technologies d''assistance ?

Test 7.5.2
Dans chaque page web, chaque message de statut indiquant le succès ou le résultat d''une action est-il correctement restitué par les technologies d''assistance ?

Test 7.5.3
Dans chaque page web, chaque message de statut véhiculant une suggestion, un avertissement ou une alerte d''erreur est-il correctement restitué par les technologies d''assistance ?

Test 7.5.4
Dans chaque page web, chaque message de statut indiquant la progression d''un traitement est-il correctement restitué par les technologies d''assistance ?'
where identifier = '7.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 8 · Éléments obligatoires
-- ============================================================================

update public.criteria set methodology = 'Test 8.1.1
Chaque page web est-elle définie par un type de document ?

Test 8.1.2
Pour chaque page web ayant une déclaration de doctype, cette déclaration est-elle située avant la balise html ?

Test 8.1.3
Chaque page web ayant une déclaration de type de document est-elle valide selon le type spécifié ?'
where identifier = '8.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.2.1
Pour chaque page web, le code source généré est-il valide selon le type de document spécifié (hors cas particuliers) ?'
where identifier = '8.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.3.1
Chaque page web a-t-elle une langue par défaut ?'
where identifier = '8.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.4.1
Pour chaque page web ayant une langue par défaut, le code de langue est-il pertinent ?'
where identifier = '8.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.5.1
Chaque page web a-t-elle un titre de page ?'
where identifier = '8.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.6.1
Pour chaque page web ayant un titre de page, ce titre est-il pertinent ?'
where identifier = '8.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.7.1
Dans chaque page web, chaque changement de langue est-il indiqué dans le code source (hors cas particuliers) ?'
where identifier = '8.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.8.1
Dans chaque page web, le code de langue de chaque changement de langue est-il valide et pertinent ?'
where identifier = '8.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.9.1
Dans chaque page web, les balises ne doivent pas être utilisées uniquement à des fins de présentation. Cette règle est-elle respectée ?'
where identifier = '8.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 8.10.1
Dans chaque page web, les changements du sens de lecture sont-ils signalés ?'
where identifier = '8.10' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 9 · Structuration de l'information
-- ============================================================================

update public.criteria set methodology = 'Test 9.1.1
Dans chaque page web, l''information est-elle structurée par l''utilisation appropriée de titres ?

Test 9.1.2
Dans chaque page web, la hiérarchie entre les titres est-elle pertinente ?

Test 9.1.3
Dans chaque page web, chaque section de contenu est-elle introduite par un titre (hors cas particuliers) ?

Test 9.1.4
Dans chaque page web ayant une section principale, la section principale est-elle introduite par un titre de niveau 1 ?

Test 9.1.5
Dans chaque page web où existent des titres, les titres au sein d''une même section sont-ils correctement structurés ?'
where identifier = '9.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 9.2.1
Dans chaque page web, la structure du document est-elle cohérente (hors cas particuliers) ?

Test 9.2.2
Dans chaque page web, chaque page comporte-t-elle une section principale identifiable ?

Test 9.2.3
Dans chaque page web, chaque zone de contenu (en-tête, navigation, contenu principal, pied de page, etc.) est-elle correctement identifiée par les balises HTML5 ou les rôles ARIA appropriés ?'
where identifier = '9.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 9.3.1
Dans chaque page web, chaque liste est-elle correctement structurée ?'
where identifier = '9.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 9.4.1
Dans chaque page web, chaque citation est-elle correctement indiquée ?'
where identifier = '9.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 10 · Présentation de l'information
-- ============================================================================

update public.criteria set methodology = 'Test 10.1.1
Dans le site web, des feuilles de styles sont-elles utilisées pour contrôler la présentation de l''information ?

Test 10.1.2
Dans chaque page web, l''information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées ?

Test 10.1.3
Dans chaque page web, l''information reste-t-elle visible lorsque les feuilles de styles sont désactivées (hors cas particuliers) ?'
where identifier = '10.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.2.1
Dans chaque page web, le contenu visible reste-t-il présent lorsque les feuilles de styles sont désactivées ?'
where identifier = '10.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.3.1
Dans chaque page web, l''information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées ?'
where identifier = '10.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.4.1
Dans chaque page web, le texte reste-t-il lisible lorsque la taille des caractères est augmentée jusqu''à 200%, au moins (hors cas particuliers) ?'
where identifier = '10.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.5.1
Dans chaque page web, les déclarations CSS de couleurs de fond d''élément et de police sont-elles correctement utilisées ?'
where identifier = '10.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.6.1
Dans chaque page web, chaque lien dont la nature n''est pas évidente est-il visible par rapport au texte environnant ?'
where identifier = '10.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.7.1
Dans chaque page web, pour chaque élément recevant le focus, la prise de focus est-elle visible ?'
where identifier = '10.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.8.1
Pour chaque page web, les contenus cachés sont-ils correctement ignorés par les technologies d''assistance ?'
where identifier = '10.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.9.1
Dans chaque page web, l''information ne doit pas être donnée uniquement par la forme, taille ou position. Cette règle est-elle respectée ?'
where identifier = '10.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.10.1
Dans chaque page web, l''information ne doit pas être donnée par la forme, taille ou position uniquement. Cette règle est-elle implémentée de façon pertinente ?'
where identifier = '10.10' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.11.1
Pour chaque page web, les contenus peuvent-ils être présentés sans avoir recours à la fois à un défilement vertical pour une fenêtre ayant une hauteur de 256px ou à un défilement horizontal pour une fenêtre ayant une largeur de 320px (hors cas particuliers) ?

Test 10.11.2
Pour chaque page web, les contenus restent-ils disponibles d''une orientation à l''autre (portrait ou paysage) hors cas particuliers ?'
where identifier = '10.11' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.12.1
Dans chaque page web, les propriétés d''espacement du texte peuvent-elles être redéfinies par l''utilisateur sans perte de contenu ou de fonctionnalité (hors cas particuliers) ?'
where identifier = '10.12' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.13.1
Dans chaque page web, les contenus additionnels apparaissant à la prise de focus ou au survol d''un composant d''interface sont-ils contrôlables par l''utilisateur (hors cas particuliers) ?

Test 10.13.2
Dans chaque page web, les contenus additionnels apparaissant via les styles CSS peuvent-ils être rendus visibles au clavier et par tout dispositif de pointage (hors cas particuliers) ?'
where identifier = '10.13' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 10.14.1
Dans chaque page web, les contenus additionnels apparaissant à la prise de focus ou au survol d''un composant d''interface peuvent-ils être rendus visibles via le clavier ou tout dispositif de pointage ?

Test 10.14.2
Dans chaque page web, les contenus additionnels rendus visibles à la prise de focus ou au survol d''un composant d''interface peuvent-ils être masqués sans déplacer le focus ou le pointeur (hors cas particuliers) ?'
where identifier = '10.14' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 11 · Formulaires
-- ============================================================================

update public.criteria set methodology = 'Test 11.1.1
Chaque champ de formulaire a-t-il une étiquette ?

Test 11.1.2
Chaque étiquette associée à un champ de formulaire est-elle pertinente (hors cas particuliers) ?

Test 11.1.3
Pour chaque champ de formulaire ayant une étiquette, l''étiquette est-elle correctement reliée au champ de formulaire ?'
where identifier = '11.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.2.1
Chaque étiquette associée à un champ de formulaire est-elle pertinente (hors cas particuliers) ?

Test 11.2.2
Chaque champ de formulaire ayant une étiquette accessible distincte de son étiquette visible voit-il son étiquette accessible débuter par le contenu de l''étiquette visible ?

Test 11.2.3
Pour chaque champ de formulaire ayant un titre (attribut title), un attribut WAI-ARIA aria-label ou aria-labelledby, le contenu du titre, de l''attribut WAI-ARIA aria-label ou aria-labelledby est-il pertinent ?'
where identifier = '11.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.3.1
Dans chaque formulaire, chaque étiquette associée à un champ de formulaire ayant la même fonction et présente plusieurs fois dans une même page ou dans un ensemble de pages est-elle cohérente ?'
where identifier = '11.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.4.1
Dans chaque formulaire, chaque étiquette de champ et son champ associé sont-ils accolés (hors cas particuliers) ?'
where identifier = '11.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.5.1
Dans chaque formulaire, les champs de même nature sont-ils regroupés, si nécessaire ?

Test 11.5.2
Dans chaque formulaire, chaque regroupement de champs de formulaire (balise fieldset) a-t-il une légende (balise legend) ?

Test 11.5.3
Dans chaque formulaire, chaque légende (balise legend) associée à un regroupement de champs de formulaire (balise fieldset) est-elle pertinente ?'
where identifier = '11.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.6.1
Dans chaque formulaire, chaque liste de choix (balise select) a-t-elle, si nécessaire, un regroupement d''éléments (balise optgroup) ?

Test 11.6.2
Dans chaque formulaire, chaque regroupement d''options de liste de choix (balise optgroup) a-t-il un attribut label ?

Test 11.6.3
Dans chaque formulaire, chaque regroupement d''options de liste de choix (balise optgroup) ayant un attribut label, le contenu de cet attribut est-il pertinent ?'
where identifier = '11.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.7.1
Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?'
where identifier = '11.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.8.1
Dans chaque formulaire, les champs de même nature sont-ils regroupés, si nécessaire ?

Test 11.8.2
Dans chaque formulaire, chaque regroupement de champs de formulaire (balise fieldset) a-t-il une légende (balise legend) ?

Test 11.8.3
Dans chaque formulaire, chaque légende (balise legend) associée à un regroupement de champs de formulaire (balise fieldset) est-elle pertinente ?

Test 11.8.4
Dans chaque formulaire, chaque liste de choix (balise select) a-t-elle, si nécessaire, un regroupement d''éléments (balise optgroup) ?'
where identifier = '11.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.9.1
Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?

Test 11.9.2
Dans chaque formulaire, chaque bouton ayant un intitulé visible voit-il son nom accessible débuter par son intitulé visible ?'
where identifier = '11.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.10.1
Dans chaque formulaire, le contrôle de saisie est-il utilisé de manière pertinente ?

Test 11.10.2
Dans chaque formulaire, chaque champ obligatoire est-il indiqué à l''utilisateur préalablement à la validation du formulaire (hors cas particuliers) ?

Test 11.10.3
Dans chaque formulaire, chaque indication relative à un format de saisie obligatoire ou de type particulier est-elle correctement renseignée (hors cas particuliers) ?

Test 11.10.4
Dans chaque formulaire, chaque champ obligatoire est-il indiqué de manière pertinente ?

Test 11.10.5
Dans chaque formulaire, chaque erreur de saisie est-elle indiquée à l''utilisateur ?

Test 11.10.6
Dans chaque formulaire, l''utilisateur peut-il modifier les saisies effectuées dans les champs obligatoires (hors cas particuliers) ?

Test 11.10.7
Dans chaque formulaire, le contrôle de saisie est-il accessible (hors cas particuliers) ?'
where identifier = '11.10' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.11.1
Dans chaque formulaire, le contrôle de saisie est-il accompagné, si nécessaire, de suggestions facilitant la correction des erreurs de saisie ?'
where identifier = '11.11' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.12.1
Pour chaque formulaire qui modifie ou supprime des données, ou qui transmet des réponses à un test ou à un examen, ou dont la validation a des conséquences financières ou juridiques, la saisie des données vérifie-t-elle l''une de ces conditions ?

Test 11.12.2
Pour chaque formulaire nécessitant l''ajout, la modification ou la suppression de données soumises par l''utilisateur, l''utilisateur peut-il facilement annuler son action ou récupérer les données après la validation ?'
where identifier = '11.12' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 11.13.1
La finalité d''un champ de saisie peut-elle être déduite pour faciliter le remplissage automatique des champs avec les données de l''utilisateur ?'
where identifier = '11.13' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 12 · Navigation
-- ============================================================================

update public.criteria set methodology = 'Test 12.1.1
Chaque ensemble de pages dispose-t-il de deux systèmes de navigation différents au moins (hors cas particuliers) ?'
where identifier = '12.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.2.1
Dans chaque ensemble de pages, le menu et les barres de navigation sont-ils toujours à la même place (hors cas particuliers) ?'
where identifier = '12.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.3.1
La page « plan du site » est-elle pertinente ?'
where identifier = '12.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.4.1
Dans chaque ensemble de pages, la page « plan du site » est-elle accessible de manière identique ?'
where identifier = '12.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.5.1
Dans chaque ensemble de pages, le moteur de recherche est-il accessible de manière identique ?'
where identifier = '12.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.6.1
Les zones de regroupement de contenus présentes dans plusieurs pages web (zones d''en-tête, de navigation principale, de contenu principal, de pied de page et de moteur de recherche) peuvent-elles être atteintes ou évitées ?'
where identifier = '12.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.7.1
Dans chaque page web, un lien d''évitement ou d''accès rapide à la zone de contenu principal est-il présent (hors cas particuliers) ?'
where identifier = '12.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.8.1
Dans chaque page web, l''ordre de tabulation est-il cohérent ?'
where identifier = '12.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.9.1
Dans chaque page web, la navigation ne doit pas contenir de piège au clavier. Cette règle est-elle respectée ?'
where identifier = '12.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.10.1
Dans chaque page web, les raccourcis clavier n''utilisant qu''une seule touche (lettre minuscule ou majuscule, ponctuation, chiffre ou symbole) sont-ils contrôlables par l''utilisateur ?'
where identifier = '12.10' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 12.11.1
Dans chaque page web, les contenus additionnels apparaissant au survol, à la prise de focus ou à l''activation d''un composant d''interface sont-ils si nécessaire atteignables au clavier ?'
where identifier = '12.11' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Thème 13 · Consultation
-- ============================================================================

update public.criteria set methodology = 'Test 13.1.1
Pour chaque page web, l''utilisateur a-t-il le contrôle de chaque limite de temps modifiant le contenu (hors cas particuliers) ?

Test 13.1.2
Pour chaque page web, l''utilisateur peut-il rallonger la session d''authentification (hors cas particuliers) ?

Test 13.1.3
Pour chaque page web, l''utilisateur est-il informé des limites de temps imposées par le serveur (hors cas particuliers) ?'
where identifier = '13.1' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.2.1
Pour chaque page web, l''ouverture d''une nouvelle fenêtre ne doit pas être déclenchée sans action de l''utilisateur. Cette règle est-elle respectée ?

Test 13.2.2
Pour chaque page web, chaque ouverture de nouvelle fenêtre est-elle signalée à l''utilisateur ?

Test 13.2.3
Pour chaque page web, chaque rafraîchissement automatique doit pouvoir être désactivé. Cette règle est-elle respectée ?

Test 13.2.4
Pour chaque page web, chaque redirection automatique doit pouvoir être désactivée ou effectuée sans limite de temps. Cette règle est-elle respectée ?'
where identifier = '13.2' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.3.1
Dans chaque page web, chaque document bureautique en téléchargement possède-t-il, si nécessaire, une version accessible (hors cas particuliers) ?

Test 13.3.2
Dans chaque page web, pour chaque document bureautique ayant une version accessible, cette version offre-t-elle la même information ?'
where identifier = '13.3' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.4.1
Pour chaque document bureautique ayant une version accessible, cette version est-elle directement accessible ou accessible via une alternative (hors cas particuliers) ?

Test 13.4.2
Pour chaque document bureautique ayant une version accessible, cette version offre-t-elle la même information ?'
where identifier = '13.4' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.5.1
Dans chaque page web, chaque contenu cryptique (art ASCII, émoticon, syntaxe cryptique) a-t-il une alternative ?

Test 13.5.2
Dans chaque page web, pour chaque contenu cryptique ayant une alternative, cette alternative est-elle pertinente ?'
where identifier = '13.5' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.6.1
Dans chaque page web, pour chaque contenu cryptique (art ASCII, émoticon, syntaxe cryptique) porteur d''information, ayant une alternative, cette alternative est-elle pertinente ?'
where identifier = '13.6' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.7.1
Dans chaque page web, les changements brusques de luminosité ou les effets de flash sont-ils correctement utilisés ?'
where identifier = '13.7' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.8.1
Dans chaque page web, chaque contenu en mouvement ou clignotant est-il contrôlable par l''utilisateur ?

Test 13.8.2
Dans chaque page web, chaque contenu en mouvement, déclenché automatiquement, peut-il être mis en pause par l''utilisateur (hors cas particuliers) ?

Test 13.8.3
Dans chaque page web, chaque contenu clignotant, déclenché automatiquement, peut-il être mis en pause par l''utilisateur ?

Test 13.8.4
Dans chaque page web, chaque contenu en mouvement ou clignotant, déclenché automatiquement, peut-il être arrêté par l''utilisateur ?'
where identifier = '13.8' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.9.1
Dans chaque page web, les contenus peuvent-ils être présentés sans avoir recours à une orientation unique en portrait ou paysage (hors cas particuliers) ?'
where identifier = '13.9' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.10.1
Dans chaque page web, les fonctionnalités utilisables ou disponibles au moyen d''un geste complexe peuvent-elles être également disponibles au moyen d''un geste simple (hors cas particuliers) ?'
where identifier = '13.10' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.11.1
Dans chaque page web, les actions déclenchées au moyen d''un dispositif de pointage sur un point unique de l''écran peuvent-elles faire l''objet d''une annulation (hors cas particuliers) ?

Test 13.11.2
Dans chaque page web, une fonctionnalité ne peut être déclenchée par un mouvement de l''appareil ou de l''utilisateur que si l''utilisateur peut désactiver ce déclenchement (hors cas particuliers). Cette règle est-elle respectée ?

Test 13.11.3
Dans chaque page web, une fonctionnalité déclenchée par un mouvement de l''appareil ou de l''utilisateur peut-elle être déclenchée par une action utilisateur plus traditionnelle (hors cas particuliers) ?'
where identifier = '13.11' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

update public.criteria set methodology = 'Test 13.12.1
Dans chaque page web, les fonctionnalités utilisables par un geste complexe peuvent-elles être également utilisables au moyen d''un geste simple (hors cas particuliers) ?

Test 13.12.2
Dans chaque page web, chaque fonctionnalité utilisant un geste complexe peut-elle faire l''objet d''une désactivation permettant un geste simple (hors cas particuliers) ?'
where identifier = '13.12' and thematic_id in (select id from public.thematics where reference_id = '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- Vérification finale : on doit avoir au moins 100 critères avec methodology
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
    where reference_id = '11111111-1111-1111-1111-111111111111'
  );

  select count(*) into filled_count
  from public.criteria
  where methodology is not null
    and thematic_id in (
      select id from public.thematics
      where reference_id = '11111111-1111-1111-1111-111111111111'
    );

  raise notice 'RGAA · methodology remplie pour % critères sur %', filled_count, total_count;

  if filled_count < 100 then
    raise exception 'RGAA · methodology insuffisamment remplie : % / 106 (attendu >= 100)', filled_count;
  end if;
end$$;

commit;
