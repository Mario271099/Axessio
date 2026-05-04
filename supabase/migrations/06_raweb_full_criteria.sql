-- ============================================================================
-- Axessio · Import du référentiel RAWeb 1.1 complet (136 critères)
-- ----------------------------------------------------------------------------
-- Source officielle : https://accessibilite.public.lu/fr/raweb1.1/criteres.html
-- Référentiel RAWeb 1.1 (id : 44444444-4444-4444-4444-444444444444)
--
-- 17 thématiques, 136 critères :
--   * Thèmes 1 à 13 = base RGAA 4.1.2 (avec quelques reformulations RAWeb)
--   * Thème 4 enrichi de 5 nouveaux critères (4.14 à 4.18)
--   * Thème 13 enrichi de 2 nouveaux critères (13.13, 13.14)
--   * Thèmes 14 à 17 entièrement nouveaux (3 + 6 + 3 + 11 critères)
--
-- Idempotent : SUPPRIME tous les criteria et thematics existants liés à
-- RAWeb 1.1, puis insère les 17 thématiques et les 136 critères officiels.
-- À exécuter en transaction unique. Vérification finale stricte (= 136).
-- ============================================================================

begin;

-- 1) Suppression de l'existant (criteria via cascade FK puis thematics) ------
delete from public.criteria
where thematic_id in (
  select id from public.thematics
  where reference_id = '44444444-4444-4444-4444-444444444444'
);

delete from public.thematics
where reference_id = '44444444-4444-4444-4444-444444444444';

-- 2) Insertion des 17 thématiques RAWeb 1.1 ---------------------------------
insert into public.thematics (reference_id, identifier, name, sort_order) values
  ('44444444-4444-4444-4444-444444444444', '1', 'Images', 1),
  ('44444444-4444-4444-4444-444444444444', '2', 'Cadres', 2),
  ('44444444-4444-4444-4444-444444444444', '3', 'Couleurs', 3),
  ('44444444-4444-4444-4444-444444444444', '4', 'Multimédia', 4),
  ('44444444-4444-4444-4444-444444444444', '5', 'Tableaux', 5),
  ('44444444-4444-4444-4444-444444444444', '6', 'Liens', 6),
  ('44444444-4444-4444-4444-444444444444', '7', 'Scripts', 7),
  ('44444444-4444-4444-4444-444444444444', '8', 'Éléments obligatoires', 8),
  ('44444444-4444-4444-4444-444444444444', '9', 'Structuration de l''information', 9),
  ('44444444-4444-4444-4444-444444444444', '10', 'Présentation de l''information', 10),
  ('44444444-4444-4444-4444-444444444444', '11', 'Formulaires', 11),
  ('44444444-4444-4444-4444-444444444444', '12', 'Navigation', 12),
  ('44444444-4444-4444-4444-444444444444', '13', 'Consultation', 13),
  ('44444444-4444-4444-4444-444444444444', '14', 'Documentation et fonctionnalités d''accessibilité', 14),
  ('44444444-4444-4444-4444-444444444444', '15', 'Outils d''édition', 15),
  ('44444444-4444-4444-4444-444444444444', '16', 'Services d''assistance', 16),
  ('44444444-4444-4444-4444-444444444444', '17', 'Communication en temps réel', 17);

-- 3) Insertion des 136 critères RAWeb 1.1 -----------------------------------
do $$
declare
  th_id uuid;
begin

  ----------------------------------------------------------------------------
  -- Thème 1 : Images (9 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '1';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '1.1', 'Chaque image porteuse d''information a-t-elle une alternative textuelle ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '1.2', 'Chaque image de décoration, sans légende, est-elle correctement ignorée par les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-2',
     '{VISUAL}', 2),
    (th_id, '1.3', 'Pour chaque image porteuse d''information ayant une alternative textuelle, cette alternative est-elle pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '1.4', 'Pour chaque image utilisée comme CAPTCHA ou comme image-test, ayant une alternative textuelle, cette alternative permet-elle d''identifier la nature et la fonction de l''image ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '1.5', 'Pour chaque image utilisée comme CAPTCHA, une solution d''accès alternatif au contenu ou à la fonction du CAPTCHA est-elle présente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-5',
     '{VISUAL,COGNITIVE,AUDITORY}', 5),
    (th_id, '1.6', 'Chaque image porteuse d''information a-t-elle, si nécessaire, une description détaillée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '1.7', 'Pour chaque image porteuse d''information ayant une description détaillée, cette description est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '1.8', 'Chaque image texte porteuse d''information, en l''absence d''un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '1.9', 'Chaque légende d''image est-elle, si nécessaire, correctement reliée à l''image correspondante ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-1-9',
     '{VISUAL,COGNITIVE}', 9);

  ----------------------------------------------------------------------------
  -- Thème 2 : Cadres (2 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '2';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '2.1', 'Chaque cadre a-t-il un titre de cadre ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-2-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '2.2', 'Pour chaque cadre ayant un titre de cadre, ce titre de cadre est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-2-2',
     '{VISUAL,COGNITIVE}', 2);

  ----------------------------------------------------------------------------
  -- Thème 3 : Couleurs (3 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '3';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '3.1', 'Dans chaque page web, l''information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-3-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '3.2', 'Dans chaque page web, le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-3-2',
     '{VISUAL}', 2),
    (th_id, '3.3', 'Dans chaque page web, les couleurs utilisées dans les composants d''interface ou les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-3-3',
     '{VISUAL}', 3);

  ----------------------------------------------------------------------------
  -- Thème 4 : Multimédia (18 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '4';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '4.1', 'Chaque média temporel pré-enregistré a-t-il, si nécessaire, une transcription textuelle ou une audiodescription (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-1',
     '{VISUAL,AUDITORY,COGNITIVE}', 1),
    (th_id, '4.2', 'Pour chaque média temporel pré-enregistré ayant une transcription textuelle ou une audiodescription synchronisée, celles-ci sont-elles pertinentes (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-2',
     '{VISUAL,AUDITORY,COGNITIVE}', 2),
    (th_id, '4.3', 'Chaque média temporel synchronisé a-t-il, si nécessaire, des sous-titres synchronisés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-3',
     '{AUDITORY,COGNITIVE}', 3),
    (th_id, '4.4', 'Pour chaque média temporel synchronisé ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-4',
     '{AUDITORY,COGNITIVE}', 4),
    (th_id, '4.5', 'Chaque média temporel pré-enregistré a-t-il, si nécessaire, une audiodescription synchronisée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-5',
     '{AUDITORY,COGNITIVE}', 5),
    (th_id, '4.6', 'Pour chaque média temporel pré-enregistré ayant une audiodescription synchronisée, celle-ci est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '4.7', 'Chaque média temporel est-il clairement identifiable (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '4.8', 'Chaque média non temporel a-t-il, si nécessaire, une alternative (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-8',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 8),
    (th_id, '4.9', 'Pour chaque média non temporel ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-9',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 9),
    (th_id, '4.10', 'Chaque son déclenché automatiquement est-il contrôlable par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-10',
     '{AUDITORY,COGNITIVE}', 10),
    (th_id, '4.11', 'La consultation de chaque média temporel est-elle, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-11',
     '{MOTOR,VISUAL,COGNITIVE}', 11),
    (th_id, '4.12', 'La consultation de chaque média non temporel est-elle contrôlable par le clavier et tout dispositif de pointage ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-12',
     '{MOTOR,VISUAL,COGNITIVE}', 12),
    (th_id, '4.13', 'Chaque média temporel et non temporel est-il compatible avec les technologies d''assistance (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-13',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 13),
    (th_id, '4.14', 'Pour chaque média temporel qui dispose d''une piste de sous-titres synchronisés ou d''une audiodescription, les fonctionnalités de contrôle de ces alternatives sont-elles présentées au même niveau que les fonctionnalités principales ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-14',
     '{AUDITORY,VISUAL,MOTOR}', 14),
    (th_id, '4.15', 'Pour chaque fonctionnalité qui transmet, convertit ou enregistre un média temporel synchronisé pré-enregistré qui possède une piste de sous-titres, à l''issue du processus, les sous-titres sont-ils correctement conservés ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-15',
     '{AUDITORY}', 15),
    (th_id, '4.16', 'Pour chaque fonctionnalité qui transmet, convertit ou enregistre un média temporel pré-enregistré avec une audiodescription synchronisée, à l''issue du processus, l''audiodescription est-elle correctement conservée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-16',
     '{VISUAL}', 16),
    (th_id, '4.17', 'Pour chaque média temporel pré-enregistré, la présentation des sous-titres est-elle contrôlable par l''utilisateur (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-17',
     '{AUDITORY,VISUAL}', 17),
    (th_id, '4.18', 'Pour chaque média temporel synchronisé pré-enregistré qui possède des sous-titres de traduction synchronisés, ceux-ci peuvent-ils être vocalisés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-4-18',
     '{VISUAL,COGNITIVE}', 18);

  ----------------------------------------------------------------------------
  -- Thème 5 : Tableaux (8 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '5';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '5.1', 'Chaque tableau de données complexe a-t-il un résumé ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '5.2', 'Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '5.3', 'Pour chaque tableau de mise en forme, le contenu linéarisé reste-t-il compréhensible ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '5.4', 'Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '5.5', 'Pour chaque tableau de données ayant un titre, celui-ci est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '5.6', 'Pour chaque tableau de données, chaque en-tête de colonne et chaque en-tête de ligne sont-ils correctement déclarés ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '5.7', 'Pour chaque tableau de données, la technique appropriée permettant d''associer chaque cellule avec ses en-têtes est-elle utilisée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '5.8', 'Chaque tableau de mise en forme ne doit pas utiliser d''éléments propres aux tableaux de données. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-5-8',
     '{VISUAL,COGNITIVE}', 8);

  ----------------------------------------------------------------------------
  -- Thème 6 : Liens (2 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '6';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '6.1', 'Chaque lien est-il explicite (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-6-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '6.2', 'Dans chaque page web, chaque lien a-t-il un intitulé ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-6-2',
     '{VISUAL,COGNITIVE,MOTOR}', 2);

  ----------------------------------------------------------------------------
  -- Thème 7 : Scripts (5 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '7';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '7.1', 'Chaque script est-il, si nécessaire, compatible avec les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-7-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '7.2', 'Pour chaque script ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-7-2',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '7.3', 'Chaque script est-il contrôlable par le clavier et par tout dispositif de pointage (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-7-3',
     '{MOTOR,VISUAL,COGNITIVE}', 3),
    (th_id, '7.4', 'Pour chaque script qui initie un changement de contexte, l''utilisateur est-il averti ou en a-t-il le contrôle ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-7-4',
     '{VISUAL,COGNITIVE,MOTOR}', 4),
    (th_id, '7.5', 'Dans chaque page web, les messages de statut sont-ils correctement restitués par les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-7-5',
     '{VISUAL,COGNITIVE}', 5);

  ----------------------------------------------------------------------------
  -- Thème 8 : Éléments obligatoires (10 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '8';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '8.1', 'Chaque page web est-elle définie par un type de document ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '8.2', 'Pour chaque page web, le code source généré est-il valide selon le type de document spécifié ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '8.3', 'Dans chaque page web, la langue par défaut est-elle présente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '8.4', 'Pour chaque page web ayant une langue par défaut, le code de langue est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '8.5', 'Chaque page web a-t-elle un titre de page ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '8.6', 'Pour chaque page web ayant un titre de page, ce titre est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '8.7', 'Dans chaque page web, chaque changement de langue est-il indiqué dans le code source (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '8.8', 'Dans chaque page web, le code de langue de chaque changement de langue est-il valide et pertinent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '8.9', 'Dans chaque page web, les balises ne doivent pas être utilisées uniquement à des fins de présentation. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-9',
     '{VISUAL,COGNITIVE}', 9),
    (th_id, '8.10', 'Dans chaque page web, les changements du sens de lecture sont-ils signalés ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-8-10',
     '{VISUAL,COGNITIVE}', 10);

  ----------------------------------------------------------------------------
  -- Thème 9 : Structuration de l'information (4 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '9';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '9.1', 'Dans chaque page web, l''information est-elle structurée par l''utilisation appropriée de titres ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-9-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '9.2', 'Dans chaque page web, la structure du document est-elle cohérente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-9-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '9.3', 'Dans chaque page web, chaque liste est-elle correctement structurée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-9-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '9.4', 'Dans chaque page web, chaque citation est-elle correctement indiquée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-9-4',
     '{VISUAL,COGNITIVE}', 4);

  ----------------------------------------------------------------------------
  -- Thème 10 : Présentation de l'information (14 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '10';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '10.1', 'Dans le site web, des feuilles de styles sont-elles utilisées pour contrôler la présentation de l''information ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '10.2', 'Dans chaque page web, le contenu visible porteur d''information est-il accessible aux technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '10.3', 'Dans chaque page web, l''information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '10.4', 'Dans chaque page web, le texte reste-t-il lisible lorsque la taille des caractères est augmentée jusqu''à 200 %, au moins (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '10.5', 'Dans chaque page web, les déclarations CSS de couleurs de fond d''élément et de police sont-elles correctement utilisées ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '10.6', 'Dans chaque page web, chaque lien dont la nature n''est pas évidente est-il visible par rapport au texte environnant ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '10.7', 'Dans chaque page web, pour chaque élément recevant le focus du clavier, la prise de focus est-elle visible ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-7',
     '{VISUAL,COGNITIVE,MOTOR}', 7),
    (th_id, '10.8', 'Pour chaque page web, les contenus cachés ont-ils vocation à être ignorés par les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '10.9', 'Dans chaque page web, l''information ne doit pas être donnée uniquement par la forme, taille ou position. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-9',
     '{VISUAL,COGNITIVE}', 9),
    (th_id, '10.10', 'Dans chaque page web, l''information ne doit pas être donnée par la forme, taille ou position uniquement. Cette règle est-elle implémentée de façon pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-10',
     '{VISUAL,COGNITIVE}', 10),
    (th_id, '10.11', 'Pour chaque page web, les contenus peuvent-ils être présentés sans perte d''information ou de fonctionnalité et sans avoir recours soit à un défilement vertical pour une fenêtre ayant une hauteur de 256 px, soit à un défilement horizontal pour une fenêtre ayant une largeur de 320 px (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-11',
     '{VISUAL,COGNITIVE,MOTOR}', 11),
    (th_id, '10.12', 'Dans chaque page web, les propriétés d''espacement du texte peuvent-elles être redéfinies par l''utilisateur sans perte de contenu ou de fonctionnalité (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-12',
     '{VISUAL,COGNITIVE}', 12),
    (th_id, '10.13', 'Dans chaque page web, les contenus additionnels apparaissant à la prise de focus ou au survol d''un composant d''interface sont-ils contrôlables par l''utilisateur (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-13',
     '{VISUAL,COGNITIVE,MOTOR}', 13),
    (th_id, '10.14', 'Dans chaque page web, les contenus additionnels apparaissant via les styles CSS uniquement peuvent-ils être rendus visibles au clavier et par tout dispositif de pointage ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-10-14',
     '{VISUAL,COGNITIVE,MOTOR}', 14);

  ----------------------------------------------------------------------------
  -- Thème 11 : Formulaires (13 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '11';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '11.1', 'Chaque champ de formulaire a-t-il une étiquette ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '11.2', 'Chaque étiquette associée à un champ de formulaire est-elle pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-2',
     '{COGNITIVE}', 2),
    (th_id, '11.3', 'Dans chaque formulaire, chaque étiquette associée à un champ de formulaire ayant la même fonction et répétée plusieurs fois dans une même page ou dans un ensemble de pages est-elle cohérente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-3',
     '{COGNITIVE}', 3),
    (th_id, '11.4', 'Dans chaque formulaire, chaque étiquette de champ et son champ associé sont-ils accolés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '11.5', 'Dans chaque formulaire, les champs de même nature sont-ils regroupés, si nécessaire ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '11.6', 'Dans chaque formulaire, chaque regroupement de champs de même nature a-t-il une légende ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '11.7', 'Dans chaque formulaire, chaque légende associée à un regroupement de champs de même nature est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-7',
     '{COGNITIVE}', 7),
    (th_id, '11.8', 'Dans chaque formulaire, les items de même nature d''une liste de choix sont-ils regroupés de manière pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '11.9', 'Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-9',
     '{VISUAL,COGNITIVE,MOTOR}', 9),
    (th_id, '11.10', 'Dans chaque formulaire, le contrôle de saisie est-il utilisé de manière pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-10',
     '{VISUAL,COGNITIVE,MOTOR}', 10),
    (th_id, '11.11', 'Dans chaque formulaire, le contrôle de saisie est-il accompagné, si nécessaire, de suggestions facilitant la correction des erreurs de saisie ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-11',
     '{VISUAL,COGNITIVE,MOTOR}', 11),
    (th_id, '11.12', 'Pour chaque formulaire qui modifie ou supprime des données, ou qui transmet des réponses à un test ou à un examen, ou dont la validation a des conséquences financières ou juridiques, les données saisies peuvent-elles être modifiées, mises à jour ou récupérées par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-12',
     '{VISUAL,COGNITIVE,MOTOR}', 12),
    (th_id, '11.13', 'La finalité d''un champ de saisie peut-elle être déduite pour faciliter le remplissage automatique des champs avec les données de l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-11-13',
     '{COGNITIVE,MOTOR}', 13);

  ----------------------------------------------------------------------------
  -- Thème 12 : Navigation (11 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '12';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '12.1', 'Chaque ensemble de pages dispose-t-il de deux systèmes de navigation différents, au moins (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '12.2', 'Dans chaque ensemble de pages, le menu et les barres de navigation sont-ils toujours à la même place (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '12.3', 'La page « plan du site » est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-3',
     '{VISUAL,COGNITIVE,MOTOR}', 3),
    (th_id, '12.4', 'Dans chaque ensemble de pages, la page « plan du site » est-elle accessible à partir d''une fonctionnalité identique ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-4',
     '{VISUAL,COGNITIVE,MOTOR}', 4),
    (th_id, '12.5', 'Dans chaque ensemble de pages, le moteur de recherche est-il atteignable de manière identique ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-5',
     '{VISUAL,COGNITIVE,MOTOR}', 5),
    (th_id, '12.6', 'Les zones de regroupement de contenus présentes dans plusieurs pages web (à l''exception des zones principales constituant la structure du document) peuvent-elles être atteintes ou évitées, si nécessaire ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-6',
     '{VISUAL,COGNITIVE,MOTOR}', 6),
    (th_id, '12.7', 'Dans chaque page web, un lien d''évitement ou d''accès rapide à la zone de contenu principal est-il présent (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-7',
     '{VISUAL,COGNITIVE,MOTOR}', 7),
    (th_id, '12.8', 'Dans chaque page web, l''ordre de tabulation est-il cohérent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-8',
     '{VISUAL,COGNITIVE,MOTOR}', 8),
    (th_id, '12.9', 'Dans chaque page web, la navigation ne doit pas contenir de piège au clavier. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-9',
     '{MOTOR,VISUAL,COGNITIVE}', 9),
    (th_id, '12.10', 'Dans chaque page web, les raccourcis clavier n''utilisant qu''une seule touche (lettre minuscule ou majuscule, ponctuation, chiffre ou symbole) sont-ils contrôlables par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-10',
     '{MOTOR,COGNITIVE}', 10),
    (th_id, '12.11', 'Dans chaque page web, les contenus additionnels apparaissant au survol, à la prise de focus ou à l''activation d''un composant d''interface sont-ils si nécessaire atteignables au clavier ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-12-11',
     '{MOTOR,VISUAL,COGNITIVE}', 11);

  ----------------------------------------------------------------------------
  -- Thème 13 : Consultation (14 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '13';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '13.1', 'Pour chaque page web, l''utilisateur a-t-il le contrôle de chaque limite de temps modifiant le contenu (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '13.2', 'Dans chaque page web, l''ouverture d''une nouvelle fenêtre ne doit pas être déclenchée sans action de l''utilisateur. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '13.3', 'Dans chaque page web, chaque document bureautique en téléchargement possède-t-il, si nécessaire, une version accessible (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3),
    (th_id, '13.4', 'Pour chaque document bureautique ayant une version accessible, cette version offre-t-elle la même information ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-4',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 4),
    (th_id, '13.5', 'Dans chaque page web, chaque contenu cryptique est-il correctement identifié ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '13.6', 'Dans chaque page web, pour chaque contenu cryptique ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '13.7', 'Dans chaque page web, les changements brusques de luminosité ou les effets de flash sont-ils correctement utilisés ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '13.8', 'Dans chaque page web, chaque contenu en mouvement ou clignotant est-il contrôlable par l''utilisateur (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '13.9', 'Dans chaque page web, le contenu proposé est-il consultable, quelle que soit l''orientation de l''écran (portrait ou paysage) (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-9',
     '{VISUAL,COGNITIVE,MOTOR}', 9),
    (th_id, '13.10', 'Dans chaque page web, les fonctionnalités utilisables ou disponibles au moyen d''un geste complexe peuvent-elles être également disponibles au moyen d''un geste simple (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-10',
     '{MOTOR,VISUAL,COGNITIVE}', 10),
    (th_id, '13.11', 'Dans chaque page web, les actions déclenchées au moyen d''un dispositif de pointage sur un point unique de l''écran peuvent-elles faire l''objet d''une annulation (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-11',
     '{MOTOR,VISUAL,COGNITIVE}', 11),
    (th_id, '13.12', 'Dans chaque page web, les fonctionnalités qui impliquent un mouvement de l''appareil ou vers l''appareil peuvent-elles être satisfaites de manière alternative (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-12',
     '{MOTOR,VISUAL,COGNITIVE}', 12),
    (th_id, '13.13', 'Pour chaque fonctionnalité de conversion d''un document, les informations relatives à l''accessibilité disponibles dans le document source sont-elles conservées dans le document de destination (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-13',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 13),
    (th_id, '13.14', 'Chaque fonctionnalité d''identification ou de contrôle qui repose sur l''utilisation de caractéristiques biologiques de l''utilisateur dispose-t-elle d''une méthode alternative ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-13-14',
     '{MOTOR,VISUAL,COGNITIVE}', 14);

  ----------------------------------------------------------------------------
  -- Thème 14 : Documentation et fonctionnalités d'accessibilité (3 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '14';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '14.1', 'La documentation du site web décrit-elle les fonctionnalités d''accessibilité disponibles et les informations relatives à la compatibilité avec l''accessibilité ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-14-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '14.2', 'Pour chaque fonctionnalité d''accessibilité décrite dans la documentation, le mécanisme qui permet de l''activer répond aux besoins d''accessibilité des utilisateurs concernés. Cette règle est-elle respectée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-14-2',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '14.3', 'La documentation du site web est-elle conforme aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-14-3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3);

  ----------------------------------------------------------------------------
  -- Thème 15 : Outils d'édition (6 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '15';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '15.1', 'Chaque outil d''édition permet-il de définir les informations d''accessibilité nécessaires pour créer un contenu conforme aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-15-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '15.2', 'Chaque outil d''édition met-il à disposition des aides à la création de contenus conformes aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-15-2',
     '{COGNITIVE}', 2),
    (th_id, '15.3', 'Le contenu généré par chaque transformation des contenus est-il conforme aux règles d''accessibilité numérique (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-15-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '15.4', 'Pour chaque erreur d''accessibilité relevée par un test d''accessibilité automatique ou semi-automatique, l''outil d''édition fournit-il des suggestions de réparation ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-15-4',
     '{COGNITIVE}', 4),
    (th_id, '15.5', 'Pour chaque ensemble de gabarits, un gabarit au moins permet de répondre aux règles d''accessibilité numérique. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-15-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '15.6', 'Chaque gabarit qui permet de répondre aux règles d''accessibilité numérique est-il clairement identifiable ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-15-6',
     '{VISUAL,COGNITIVE}', 6);

  ----------------------------------------------------------------------------
  -- Thème 16 : Services d'assistance (3 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '16';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '16.1', 'Chaque service d''assistance fournit-il des informations relatives aux fonctionnalités d''accessibilité et à la compatibilité avec l''accessibilité, décrites dans la documentation du site web ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-16-1',
     '{VISUAL,AUDITORY,COGNITIVE}', 1),
    (th_id, '16.2', 'Chaque service d''assistance répond aux besoins de communication des personnes handicapées directement ou par l''intermédiaire d''un service de relais. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-16-2',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 2),
    (th_id, '16.3', 'La documentation fournie par le service d''assistance est-elle conforme aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-16-3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3);

  ----------------------------------------------------------------------------
  -- Thème 17 : Communication en temps réel (11 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '44444444-4444-4444-4444-444444444444' and identifier = '17';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '17.1', 'Pour chaque application web de communication orale bidirectionnelle, l''application est-elle capable d''encoder et de décoder cette communication avec une gamme de fréquences dont la limite supérieure est de 7 000 Hz au moins ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-1',
     '{AUDITORY}', 1),
    (th_id, '17.2', 'Chaque application web qui permet une communication orale bidirectionnelle dispose-t-elle d''une fonctionnalité de communication écrite en temps réel ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-2',
     '{AUDITORY}', 2),
    (th_id, '17.3', 'Pour chaque application web qui permet une communication orale bidirectionnelle et écrite en temps réel, les deux modes sont-ils utilisables simultanément ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-3',
     '{AUDITORY}', 3),
    (th_id, '17.4', 'Pour chaque fonctionnalité de communication écrite en temps réel, les messages peuvent-ils être identifiés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-4',
     '{AUDITORY,COGNITIVE}', 4),
    (th_id, '17.5', 'Pour chaque application web de communication orale bidirectionnelle, un indicateur visuel de l''activité orale est-il présent ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-5',
     '{AUDITORY}', 5),
    (th_id, '17.6', 'Chaque application web de communication écrite en temps réel qui peut interagir avec d''autres applications de communication écrite en temps réel respecte-t-elle les règles d''interopérabilité en vigueur ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-6',
     '{AUDITORY}', 6),
    (th_id, '17.7', 'Pour chaque application web de communication écrite en temps réel, le délai de transmission de chaque unité de saisie est de 500ms ou moins. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-7',
     '{AUDITORY,COGNITIVE}', 7),
    (th_id, '17.8', 'Pour chaque application web de télécommunication, l''identification de l''interlocuteur qui initie un appel est-elle accessible ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-8',
     '{VISUAL,AUDITORY}', 8),
    (th_id, '17.9', 'Pour chaque application web de communication orale bidirectionnelle qui permet d''identifier l''activité d''un interlocuteur oralisant, il est possible d''identifier l''activité d''un interlocuteur signant. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-9',
     '{AUDITORY}', 9),
    (th_id, '17.10', 'Pour chaque application web de communication orale bidirectionnelle qui dispose de fonctionnalités vocales, celles-ci sont-elles utilisables sans la nécessité d''écouter ou parler ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-10',
     '{AUDITORY,MOTOR}', 10),
    (th_id, '17.11', 'Pour chaque application web de communication orale bidirectionnelle qui dispose d''une vidéo en temps réel, la qualité de la vidéo est-elle suffisante ?',
     'https://accessibilite.public.lu/fr/raweb1.1/criteres.html#crit-17-11',
     '{AUDITORY,VISUAL}', 11);

end$$;

-- 4) Vérification stricte : exactement 136 critères RAWeb 1.1 ---------------
do $$
declare
  total int;
begin
  select count(*) into total
  from public.criteria c
  join public.thematics t on t.id = c.thematic_id
  where t.reference_id = '44444444-4444-4444-4444-444444444444';

  if total <> 136 then
    raise exception 'RAWeb 1.1 import incomplet : % critères trouvés, 136 attendus', total;
  end if;
end$$;

commit;
