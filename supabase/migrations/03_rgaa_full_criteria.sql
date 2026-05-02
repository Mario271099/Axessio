-- ============================================================================
-- Axessio · Import du référentiel RGAA 4.1.2 complet (106 critères)
-- ----------------------------------------------------------------------------
-- Source officielle : https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/
-- Référentiel RGAA 4.1.2 (id : 11111111-1111-1111-1111-111111111111)
--
-- Idempotent : SUPPRIME tous les critères existants liés au RGAA 4.1.2,
-- puis insère les 106 critères officiels.
-- À exécuter en transaction unique.
-- ============================================================================

begin;

-- 1) Suppression des critères existants rattachés au RGAA 4.1.2 ---------------
delete from public.criteria
where thematic_id in (
  select id from public.thematics
  where reference_id = '11111111-1111-1111-1111-111111111111'
);

-- 2) Insertion des 106 critères officiels -----------------------------------
do $$
declare
  th_id uuid;
begin
  ----------------------------------------------------------------------------
  -- Thème 1 : Images (9 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '1';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '1.1', 'Chaque image porteuse d''information a-t-elle une alternative textuelle ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '1.2', 'Chaque image de décoration est-elle correctement ignorée par les technologies d''assistance ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.2',
     '{VISUAL}', 2),
    (th_id, '1.3', 'Pour chaque image porteuse d''information ayant une alternative textuelle, cette alternative est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '1.4', 'Pour chaque image utilisée comme CAPTCHA ou comme image-test, ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '1.5', 'Pour chaque image utilisée comme CAPTCHA, une solution d''accès alternatif au contenu ou à la fonction du CAPTCHA est-elle présente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.5',
     '{VISUAL,COGNITIVE,AUDITORY}', 5),
    (th_id, '1.6', 'Chaque image porteuse d''information a-t-elle, si nécessaire, une description détaillée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '1.7', 'Pour chaque image porteuse d''information ayant une description détaillée, cette description est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '1.8', 'Chaque image texte porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '1.9', 'Chaque légende d''image est-elle, si nécessaire, correctement reliée à l''image correspondante ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.9',
     '{VISUAL,COGNITIVE}', 9);

  ----------------------------------------------------------------------------
  -- Thème 2 : Cadres (2 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '2';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '2.1', 'Chaque cadre a-t-il un titre de cadre ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#2.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '2.2', 'Pour chaque cadre ayant un titre de cadre, ce titre de cadre est-il pertinent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#2.2',
     '{VISUAL,COGNITIVE}', 2);

  ----------------------------------------------------------------------------
  -- Thème 3 : Couleurs (3 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '3';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '3.1', 'Dans chaque page web, l''information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#3.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '3.2', 'Dans chaque page web, le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#3.2',
     '{VISUAL}', 2),
    (th_id, '3.3', 'Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#3.3',
     '{VISUAL}', 3);

  ----------------------------------------------------------------------------
  -- Thème 4 : Multimédia (13 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '4';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '4.1', 'Chaque média temporel pré-enregistré a-t-il, si nécessaire, une transcription textuelle ou une audiodescription (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.1',
     '{VISUAL,AUDITORY,COGNITIVE}', 1),
    (th_id, '4.2', 'Pour chaque média temporel pré-enregistré ayant une transcription textuelle ou une audiodescription synchronisée, celles-ci sont-elles pertinentes (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.2',
     '{VISUAL,AUDITORY,COGNITIVE}', 2),
    (th_id, '4.3', 'Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, des sous-titres synchronisés (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.3',
     '{AUDITORY,COGNITIVE}', 3),
    (th_id, '4.4', 'Pour chaque média temporel synchronisé pré-enregistré ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.4',
     '{AUDITORY,COGNITIVE}', 4),
    (th_id, '4.5', 'Chaque média temporel en direct a-t-il, si nécessaire, des sous-titres synchronisés ou une transcription textuelle (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.5',
     '{AUDITORY,COGNITIVE}', 5),
    (th_id, '4.6', 'Chaque média temporel pré-enregistré a-t-il, si nécessaire, une audiodescription synchronisée (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '4.7', 'Pour chaque média temporel pré-enregistré ayant une audiodescription synchronisée, celle-ci est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '4.8', 'Chaque média non temporel a-t-il, si nécessaire, une alternative ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.8',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 8),
    (th_id, '4.9', 'Pour chaque média non temporel ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.9',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 9),
    (th_id, '4.10', 'Chaque son déclenché automatiquement est-il contrôlable par l''utilisateur ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.10',
     '{AUDITORY,COGNITIVE}', 10),
    (th_id, '4.11', 'La consultation de chaque média temporel est-elle, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.11',
     '{MOTOR,VISUAL,COGNITIVE}', 11),
    (th_id, '4.12', 'La consultation de chaque média non temporel est-elle, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.12',
     '{MOTOR,VISUAL,COGNITIVE}', 12),
    (th_id, '4.13', 'Chaque média temporel et non temporel est-il compatible avec les technologies d''assistance (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#4.13',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 13);

  ----------------------------------------------------------------------------
  -- Thème 5 : Tableaux (8 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '5';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '5.1', 'Chaque tableau de données complexes a-t-il un résumé ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '5.2', 'Pour chaque tableau de données complexes ayant un résumé, celui-ci est-il pertinent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '5.3', 'Pour chaque tableau de mise en forme, le contenu linéarisé reste-t-il compréhensible ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '5.4', 'Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '5.5', 'Pour chaque tableau de données ayant un titre, celui-ci est-il pertinent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '5.6', 'Pour chaque tableau de données, chaque en-tête de colonnes et chaque en-tête de lignes sont-ils correctement déclarés ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '5.7', 'Pour chaque tableau de données, la technique appropriée permettant d''associer chaque cellule avec ses en-têtes est-elle utilisée (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '5.8', 'Chaque tableau de mise en forme ne doit pas utiliser d''éléments propres aux tableaux de données. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#5.8',
     '{VISUAL,COGNITIVE}', 8);

  ----------------------------------------------------------------------------
  -- Thème 6 : Liens (2 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '6';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '6.1', 'Chaque lien est-il explicite (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#6.1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '6.2', 'Chaque lien a-t-il un intitulé ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#6.2',
     '{VISUAL,COGNITIVE,MOTOR}', 2);

  ----------------------------------------------------------------------------
  -- Thème 7 : Scripts (5 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '7';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '7.1', 'Chaque script est-il, si nécessaire, compatible avec les technologies d''assistance ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#7.1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '7.2', 'Pour chaque script ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#7.2',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '7.3', 'Chaque script est-il contrôlable par le clavier et par tout dispositif de pointage (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#7.3',
     '{MOTOR,VISUAL,COGNITIVE}', 3),
    (th_id, '7.4', 'Pour chaque script qui initie un changement de contexte, l''utilisateur est-il averti ou en a-t-il le contrôle ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#7.4',
     '{VISUAL,COGNITIVE,MOTOR}', 4),
    (th_id, '7.5', 'Dans chaque page web, les messages de statut sont-ils correctement restitués par les technologies d''assistance ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#7.5',
     '{VISUAL,COGNITIVE}', 5);

  ----------------------------------------------------------------------------
  -- Thème 8 : Éléments obligatoires (10 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '8';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '8.1', 'Chaque page web est-elle définie par un type de document ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '8.2', 'Pour chaque page web, le code source généré est-il valide selon le type de document spécifié (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '8.3', 'Dans chaque page web, la langue par défaut est-elle présente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '8.4', 'Pour chaque page web ayant une langue par défaut, le code de langue est-il pertinent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '8.5', 'Chaque page web a-t-elle un titre de page ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '8.6', 'Pour chaque page web ayant un titre de page, ce titre est-il pertinent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '8.7', 'Dans chaque page web, chaque changement de langue est-il indiqué dans le code source (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '8.8', 'Dans chaque page web, le code de langue de chaque changement de langue est-il valide et pertinent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '8.9', 'Dans chaque page web, les balises ne doivent pas être utilisées uniquement à des fins de présentation. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.9',
     '{VISUAL,COGNITIVE}', 9),
    (th_id, '8.10', 'Dans chaque page web, les changements du sens de lecture sont-ils signalés ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#8.10',
     '{VISUAL,COGNITIVE}', 10);

  ----------------------------------------------------------------------------
  -- Thème 9 : Structuration de l'information (4 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '9';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '9.1', 'Dans chaque page web, l''information est-elle structurée par l''utilisation appropriée de titres ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#9.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '9.2', 'Dans chaque page web, la structure du document est-elle cohérente (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#9.2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '9.3', 'Dans chaque page web, chaque liste est-elle correctement structurée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#9.3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '9.4', 'Dans chaque page web, chaque citation est-elle correctement indiquée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#9.4',
     '{VISUAL,COGNITIVE}', 4);

  ----------------------------------------------------------------------------
  -- Thème 10 : Présentation de l'information (14 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '10';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '10.1', 'Dans le site web, des feuilles de styles sont-elles utilisées pour contrôler la présentation de l''information ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '10.2', 'Dans chaque page web, le contenu visible porteur d''information reste-t-il présent lorsque les feuilles de styles sont désactivées ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '10.3', 'Dans chaque page web, l''information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '10.4', 'Dans chaque page web, le texte reste-t-il lisible lorsque la taille des caractères est augmentée jusqu''à 200%, au moins (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '10.5', 'Dans chaque page web, les déclarations CSS de couleurs de fond d''élément et de police sont-elles correctement utilisées ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '10.6', 'Dans chaque page web, chaque lien dont la nature n''est pas évidente est-il visible par rapport au texte environnant ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '10.7', 'Dans chaque page web, pour chaque élément recevant le focus, la prise de focus est-elle visible ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.7',
     '{VISUAL,COGNITIVE,MOTOR}', 7),
    (th_id, '10.8', 'Pour chaque page web, les contenus cachés ont-ils vocation à être ignorés par les technologies d''assistance ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '10.9', 'Dans chaque page web, l''information ne doit pas être donnée uniquement par la forme, taille ou position. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.9',
     '{VISUAL,COGNITIVE}', 9),
    (th_id, '10.10', 'Dans chaque page web, l''information ne doit pas être donnée par la forme, taille ou position uniquement. Cette règle est-elle implémentée de façon pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.10',
     '{VISUAL,COGNITIVE}', 10),
    (th_id, '10.11', 'Pour chaque page web, les contenus peuvent-ils être présentés sans avoir recours à la fois à un défilement vertical pour une fenêtre ayant une hauteur de 256px ou à un défilement horizontal pour une fenêtre ayant une largeur de 320px (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.11',
     '{VISUAL,COGNITIVE,MOTOR}', 11),
    (th_id, '10.12', 'Dans chaque page web, les propriétés d''espacement du texte peuvent-elles être redéfinies par l''utilisateur sans perte de contenu ou de fonctionnalité (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.12',
     '{VISUAL,COGNITIVE}', 12),
    (th_id, '10.13', 'Dans chaque page web, les contenus additionnels apparaissant à la prise de focus ou au survol d''un composant d''interface sont-ils contrôlables par l''utilisateur (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.13',
     '{VISUAL,COGNITIVE,MOTOR}', 13),
    (th_id, '10.14', 'Dans chaque page web, les contenus additionnels apparaissant via les styles CSS uniquement peuvent-ils être rendus visibles au clavier et par tout dispositif de pointage (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#10.14',
     '{VISUAL,COGNITIVE,MOTOR}', 14);

  ----------------------------------------------------------------------------
  -- Thème 11 : Formulaires (13 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '11';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '11.1', 'Chaque champ de formulaire a-t-il une étiquette ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '11.2', 'Chaque étiquette associée à un champ de formulaire est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.2',
     '{COGNITIVE}', 2),
    (th_id, '11.3', 'Dans chaque formulaire, chaque étiquette associée à un champ de formulaire ayant la même fonction et répété plusieurs fois dans une même page ou dans un ensemble de pages est-elle cohérente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.3',
     '{COGNITIVE}', 3),
    (th_id, '11.4', 'Dans chaque formulaire, chaque étiquette de champ et son champ associé sont-ils accolés (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '11.5', 'Dans chaque formulaire, les champs de même nature sont-ils regroupés, si nécessaire ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '11.6', 'Dans chaque formulaire, chaque regroupement de champs de formulaire a-t-il une légende ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '11.7', 'Dans chaque formulaire, chaque légende associée à un regroupement de champs de formulaire est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.7',
     '{COGNITIVE}', 7),
    (th_id, '11.8', 'Dans chaque formulaire, les items de même nature d''une liste de choix sont-ils regroupés de manière pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '11.9', 'Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.9',
     '{VISUAL,COGNITIVE,MOTOR}', 9),
    (th_id, '11.10', 'Dans chaque formulaire, le contrôle de saisie est-il utilisé de manière pertinente (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.10',
     '{VISUAL,COGNITIVE,MOTOR}', 10),
    (th_id, '11.11', 'Dans chaque formulaire, le contrôle de saisie est-il accompagné, si nécessaire, de suggestions facilitant la correction des erreurs de saisie ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.11',
     '{VISUAL,COGNITIVE,MOTOR}', 11),
    (th_id, '11.12', 'Pour chaque formulaire qui modifie ou supprime des données, ou qui transmet des réponses à un test ou à un examen, ou dont le résultat engage financièrement ou juridiquement l''utilisateur, la saisie des données vérifie-t-elle l''une des conditions suivantes ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.12',
     '{VISUAL,COGNITIVE,MOTOR}', 12),
    (th_id, '11.13', 'La finalité d''un champ de saisie peut-elle être déduite pour faciliter le remplissage automatique des champs avec les données de l''utilisateur ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.13',
     '{COGNITIVE,MOTOR}', 13);

  ----------------------------------------------------------------------------
  -- Thème 12 : Navigation (11 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '12';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '12.1', 'Chaque ensemble de pages dispose-t-il de deux systèmes de navigation différents, au moins (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '12.2', 'Dans chaque ensemble de pages, le menu et les barres de navigation sont-ils toujours à la même place (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '12.3', 'La page « plan du site » est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.3',
     '{VISUAL,COGNITIVE,MOTOR}', 3),
    (th_id, '12.4', 'Dans chaque ensemble de pages, la page « plan du site » est-elle accessible de manière identique ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.4',
     '{VISUAL,COGNITIVE,MOTOR}', 4),
    (th_id, '12.5', 'Dans chaque ensemble de pages, le moteur de recherche est-il accessible de manière identique ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.5',
     '{VISUAL,COGNITIVE,MOTOR}', 5),
    (th_id, '12.6', 'Les zones de regroupement de contenus présentes dans plusieurs pages web (zones d''en-tête, de navigation principale, de contenu principal, de pied de page et de moteur de recherche) peuvent-elles être atteintes ou évitées ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.6',
     '{VISUAL,COGNITIVE,MOTOR}', 6),
    (th_id, '12.7', 'Dans chaque page web, un lien d''évitement ou d''accès rapide à la zone de contenu principal est-il présent (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.7',
     '{VISUAL,COGNITIVE,MOTOR}', 7),
    (th_id, '12.8', 'Dans chaque page web, l''ordre de tabulation est-il cohérent ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.8',
     '{VISUAL,COGNITIVE,MOTOR}', 8),
    (th_id, '12.9', 'Dans chaque page web, la navigation ne doit pas contenir de piège au clavier. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.9',
     '{MOTOR,VISUAL,COGNITIVE}', 9),
    (th_id, '12.10', 'Dans chaque page web, les raccourcis clavier n''utilisant qu''une seule touche (lettre minuscule ou majuscule, ponctuation, chiffre ou symbole) sont-ils contrôlables par l''utilisateur ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.10',
     '{MOTOR,COGNITIVE}', 10),
    (th_id, '12.11', 'Dans chaque page web, les contenus additionnels apparaissant au survol, à la prise de focus ou à l''activation d''un composant d''interface sont-ils si nécessaire atteignables au clavier ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#12.11',
     '{MOTOR,VISUAL,COGNITIVE}', 11);

  ----------------------------------------------------------------------------
  -- Thème 13 : Consultation (12 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '13';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '13.1', 'Pour chaque limite de temps modifiable par l''utilisateur, l''utilisateur peut-il la désactiver, la modifier ou la prolonger ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '13.2', 'Dans chaque page web, l''ouverture d''une nouvelle fenêtre ne doit pas être déclenchée sans action de l''utilisateur. Cette règle est-elle respectée ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '13.3', 'Dans chaque page web, chaque document bureautique en téléchargement possède-t-il, si nécessaire, une version accessible (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3),
    (th_id, '13.4', 'Pour chaque document bureautique ayant une version accessible, cette version offre-t-elle la même information ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.4',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 4),
    (th_id, '13.5', 'Dans chaque page web, chaque contenu cryptique (art ASCII, émoticon, syntaxe cryptique) a-t-il une alternative ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '13.6', 'Dans chaque page web, pour chaque contenu cryptique ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '13.7', 'Dans chaque page web, les changements brusques de luminosité ou les effets de flash sont-ils correctement utilisés ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '13.8', 'Dans chaque page web, les contenus en mouvement ou clignotants sont-ils contrôlables par l''utilisateur ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '13.9', 'Dans chaque page web, le contenu proposé est-il consultable quelle que soit l''orientation de l''écran (portrait ou paysage) (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.9',
     '{VISUAL,COGNITIVE,MOTOR}', 9),
    (th_id, '13.10', 'Dans chaque page web, les fonctionnalités utilisables ou disponibles au moyen d''un geste complexe peuvent-elles être également disponibles au moyen d''un geste simple (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.10',
     '{MOTOR,VISUAL,COGNITIVE}', 10),
    (th_id, '13.11', 'Dans chaque page web, les actions déclenchées au moyen d''un dispositif de pointage sur un point unique de l''écran peuvent faire l''objet d''une annulation (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.11',
     '{MOTOR,VISUAL,COGNITIVE}', 11),
    (th_id, '13.12', 'Dans chaque page web, les fonctionnalités qui impliquent un mouvement de l''appareil ou vers l''appareil peuvent-elles faire l''objet d''une alternative (hors cas particuliers) ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.12',
     '{MOTOR,VISUAL,COGNITIVE}', 12);

end $$;

-- 3) Vérification : on doit avoir 106 critères pour le RGAA 4.1.2 ------------
do $$
declare
  total int;
begin
  select count(*) into total from public.criteria
  where thematic_id in (
    select id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111'
  );
  if total <> 106 then
    raise exception 'Import RGAA 4.1.2 incohérent : % critères trouvés au lieu de 106', total;
  end if;
end $$;

commit;