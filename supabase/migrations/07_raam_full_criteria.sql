-- ============================================================================
-- Axessio · Import du référentiel RAAM 1.1 complet (108 critères)
-- ----------------------------------------------------------------------------
-- Source officielle : https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html
-- Référentiel RAAM 1.1 (id : 55555555-5555-5555-5555-555555555555)
--
-- Référentiel d'accessibilité des applications mobiles natives (iOS / Android),
-- 15 thématiques, 108 critères. Basé sur la norme EN 301 549 v3.2.1.
--
-- Idempotent : SUPPRIME tous les criteria et thematics existants liés à
-- RAAM 1.1, puis insère les 15 thématiques et les 108 critères officiels.
-- À exécuter en transaction unique. Vérification finale stricte (= 108).
-- ============================================================================

begin;

-- 1) Suppression de l'existant (criteria via cascade FK puis thematics) ------
delete from public.criteria
where thematic_id in (
  select id from public.thematics
  where reference_id = '55555555-5555-5555-5555-555555555555'
);

delete from public.thematics
where reference_id = '55555555-5555-5555-5555-555555555555';

-- 2) Insertion des 15 thématiques RAAM 1.1 ----------------------------------
insert into public.thematics (reference_id, identifier, name, sort_order) values
  ('55555555-5555-5555-5555-555555555555', '1', 'Éléments graphiques', 1),
  ('55555555-5555-5555-5555-555555555555', '2', 'Couleurs', 2),
  ('55555555-5555-5555-5555-555555555555', '3', 'Multimédia', 3),
  ('55555555-5555-5555-5555-555555555555', '4', 'Tableaux', 4),
  ('55555555-5555-5555-5555-555555555555', '5', 'Composants interactifs', 5),
  ('55555555-5555-5555-5555-555555555555', '6', 'Éléments obligatoires', 6),
  ('55555555-5555-5555-5555-555555555555', '7', 'Structuration de l''information', 7),
  ('55555555-5555-5555-5555-555555555555', '8', 'Présentation de l''information', 8),
  ('55555555-5555-5555-5555-555555555555', '9', 'Formulaires', 9),
  ('55555555-5555-5555-5555-555555555555', '10', 'Navigation', 10),
  ('55555555-5555-5555-5555-555555555555', '11', 'Consultation', 11),
  ('55555555-5555-5555-5555-555555555555', '12', 'Documentation et fonctionnalités d''accessibilité', 12),
  ('55555555-5555-5555-5555-555555555555', '13', 'Outils d''édition', 13),
  ('55555555-5555-5555-5555-555555555555', '14', 'Services d''assistance', 14),
  ('55555555-5555-5555-5555-555555555555', '15', 'Communication en temps réel', 15);

-- 3) Insertion des 108 critères RAAM 1.1 ------------------------------------
do $$
declare
  th_id uuid;
begin

  ----------------------------------------------------------------------------
  -- Thème 1 : Éléments graphiques (9 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '1';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '1.1', 'Chaque élément graphique de décoration est-il ignoré par les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-1',
     '{VISUAL}', 1),
    (th_id, '1.2', 'Chaque élément graphique porteur d''information possède-t-il une alternative accessible aux technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '1.3', 'Pour chaque élément graphique porteur d''information, l''alternative accessible aux technologies d''assistance est-elle pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '1.4', 'Pour chaque élément graphique utilisé comme CAPTCHA ou comme élément graphique de test, l''alternative restituée par les technologies d''assistance permet-elle d''identifier la nature et la fonction de l''élément graphique ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '1.5', 'Chaque élément graphique utilisé comme CAPTCHA possède-t-il une alternative ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-5',
     '{VISUAL,COGNITIVE,AUDITORY}', 5),
    (th_id, '1.6', 'Chaque élément graphique porteur d''information a-t-il, si nécessaire, une description détaillée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '1.7', 'Pour chaque élément graphique porteur d''information ayant une description détaillée, celle-ci est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '1.8', 'Chaque élément graphique texte porteur d''information, en l''absence d''un mécanisme de remplacement, doit, si possible être remplacé par du texte stylé. Cette règle est-elle respectée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '1.9', 'Chaque élément graphique légendé est-il correctement restitué par les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-1-9',
     '{VISUAL,COGNITIVE}', 9);

  ----------------------------------------------------------------------------
  -- Thème 2 : Couleurs (4 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '2';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '2.1', 'Dans chaque écran, l''information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-2-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '2.2', 'Dans chaque écran, le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-2-2',
     '{VISUAL}', 2),
    (th_id, '2.3', 'Dans chaque écran, les couleurs utilisées dans les composants d''interface et les éléments graphiques porteurs d''informations sont-elles suffisamment contrastées (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-2-3',
     '{VISUAL}', 3),
    (th_id, '2.4', 'Le rapport de contraste de chaque mécanisme de remplacement qui permet d''afficher l''écran avec un rapport de contraste conforme est-il suffisamment élevé ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-2-4',
     '{VISUAL}', 4);

  ----------------------------------------------------------------------------
  -- Thème 3 : Multimédia (18 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '3';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '3.1', 'Chaque média temporel pré-enregistré seulement audio a-t-il, si nécessaire, une transcription textuelle adjacente clairement identifiable (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-1',
     '{VISUAL,AUDITORY,COGNITIVE}', 1),
    (th_id, '3.2', 'Pour chaque média temporel pré-enregistré seulement audio ayant une transcription textuelle, celle-ci est-elle pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-2',
     '{VISUAL,AUDITORY,COGNITIVE}', 2),
    (th_id, '3.3', 'Chaque média temporel pré-enregistré seulement vidéo a-t-il, si nécessaire, une alternative (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-3',
     '{VISUAL,AUDITORY,COGNITIVE}', 3),
    (th_id, '3.4', 'Pour chaque média temporel pré-enregistré seulement vidéo ayant une alternative, celle-ci est-elle pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-4',
     '{VISUAL,AUDITORY,COGNITIVE}', 4),
    (th_id, '3.5', 'Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, une alternative (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-5',
     '{VISUAL,AUDITORY,COGNITIVE}', 5),
    (th_id, '3.6', 'Pour chaque média temporel synchronisé pré-enregistré ayant une alternative, celle-ci est-elle pertinente (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-6',
     '{VISUAL,AUDITORY,COGNITIVE}', 6),
    (th_id, '3.7', 'Chaque média temporel synchronisé a-t-il, si nécessaire, des sous-titres synchronisés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-7',
     '{AUDITORY,COGNITIVE}', 7),
    (th_id, '3.8', 'Pour chaque média temporel synchronisé ayant des sous-titres synchronisés, ceux-ci sont-ils pertinents (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-8',
     '{AUDITORY,COGNITIVE}', 8),
    (th_id, '3.9', 'Chaque média temporel pré-enregistré (seulement vidéo ou synchronisé) a-t-il, si nécessaire, une audiodescription synchronisée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-9',
     '{VISUAL,COGNITIVE}', 9),
    (th_id, '3.10', 'Pour chaque média temporel pré-enregistré (seulement vidéo ou synchronisé) ayant une audiodescription synchronisée, celle-ci est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-10',
     '{VISUAL,COGNITIVE}', 10),
    (th_id, '3.11', 'Pour chaque média temporel pré-enregistré, le contenu textuel adjacent permet-il d''identifier clairement le média temporel (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-11',
     '{VISUAL,COGNITIVE}', 11),
    (th_id, '3.12', 'Chaque séquence sonore déclenchée automatiquement est-elle contrôlable par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-12',
     '{AUDITORY,COGNITIVE}', 12),
    (th_id, '3.13', 'Chaque média temporel a-t-il, si nécessaire, les fonctionnalités de contrôle de sa consultation ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-13',
     '{MOTOR,VISUAL,COGNITIVE}', 13),
    (th_id, '3.14', 'Pour chaque média temporel synchronisé pré-enregistré qui dispose d''une piste de sous-titres synchronisés ou d''une audiodescription, les fonctionnalités de contrôle de ces alternatives sont-elles présentées au même niveau que les fonctionnalités principales ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-14',
     '{AUDITORY,VISUAL,MOTOR}', 14),
    (th_id, '3.15', 'Pour chaque fonctionnalité qui transmet, convertit ou enregistre un média temporel synchronisé pré-enregistré qui possède une piste de sous-titres synchronisés, à l''issue du processus, les sous-titres sont-ils correctement conservés ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-15',
     '{AUDITORY}', 15),
    (th_id, '3.16', 'Pour chaque fonctionnalité qui transmet, convertit ou enregistre un média temporel synchronisé pré-enregistré avec une audiodescription synchronisée, à l''issue du processus, l''audiodescription est-elle correctement conservée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-16',
     '{VISUAL}', 16),
    (th_id, '3.17', 'Pour chaque média temporel pré-enregistré, la présentation des sous-titres est-elle contrôlable par l''utilisateur (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-17',
     '{AUDITORY,VISUAL}', 17),
    (th_id, '3.18', 'Pour chaque média temporel synchronisé pré-enregistré qui possède des sous-titres de traduction synchronisés, ceux-ci peuvent-ils être vocalisés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-3-18',
     '{VISUAL,COGNITIVE}', 18);

  ----------------------------------------------------------------------------
  -- Thème 4 : Tableaux (5 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '4';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '4.1', 'Chaque tableau de données complexe a-t-il un résumé ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-4-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '4.2', 'Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-4-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '4.3', 'Chaque tableau de données a-t-il un titre ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-4-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '4.4', 'Pour chaque tableau de données ayant un titre, celui-ci est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-4-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '4.5', 'Pour chaque tableau de données, les entêtes de lignes et de colonnes sont-ils correctement reliés aux cellules de données ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-4-5',
     '{VISUAL,COGNITIVE}', 5);

  ----------------------------------------------------------------------------
  -- Thème 5 : Composants interactifs (5 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '5';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '5.1', 'Chaque composant d''interface est-il, si nécessaire, compatible avec les technologies d''assistance (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-5-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '5.2', 'Chaque composant d''interface est-il contrôlable par le clavier et tout dispositif de pointage (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-5-2',
     '{MOTOR,VISUAL,COGNITIVE}', 2),
    (th_id, '5.3', 'Chaque changement de contexte respecte-t-il une de ces conditions ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-5-3',
     '{VISUAL,COGNITIVE,MOTOR}', 3),
    (th_id, '5.4', 'Dans chaque écran, les messages de statut sont-ils correctement restitués par les technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-5-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '5.5', 'Chaque état d''un contrôle à bascule présenté à l''utilisateur est-il perceptible ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-5-5',
     '{VISUAL,COGNITIVE}', 5);

  ----------------------------------------------------------------------------
  -- Thème 6 : Éléments obligatoires (2 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '6';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '6.1', 'Dans chaque écran, les textes sont-ils restitués par les technologies d''assistance dans la langue principale de l''écran ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-6-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '6.2', 'Dans chaque écran, les éléments de l''interface ne doivent pas être utilisés uniquement à des fins de présentation. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-6-2',
     '{VISUAL,COGNITIVE}', 2);

  ----------------------------------------------------------------------------
  -- Thème 7 : Structuration de l'information (2 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '7';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '7.1', 'Dans chaque écran, l''information est-elle structurée par l''utilisation appropriée de titres ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-7-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '7.2', 'Dans chaque écran, chaque liste est-elle correctement structurée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-7-2',
     '{VISUAL,COGNITIVE}', 2);

  ----------------------------------------------------------------------------
  -- Thème 8 : Présentation de l'information (7 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '8';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '8.1', 'Dans chaque écran, le contenu visible porteur d''information est-il accessible aux technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '8.2', 'Dans chaque écran, l''utilisateur peut-il augmenter la taille des caractères de 200% au moins (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '8.3', 'Dans chaque écran, chaque composant en environnement de texte dont la nature n''est pas évidente a-t-il un rapport de contraste supérieur ou égal à 3:1 par rapport au texte environnant ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '8.4', 'Dans chaque écran, pour chaque composant en environnement de texte dont la nature n''est pas évidente, une indication autre que la couleur permet-elle de signaler la prise de focus et le survol à la souris ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-4',
     '{VISUAL,COGNITIVE,MOTOR}', 4),
    (th_id, '8.5', 'Dans chaque écran, pour chaque élément recevant le focus, la prise de focus est-elle visible ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-5',
     '{VISUAL,COGNITIVE,MOTOR}', 5),
    (th_id, '8.6', 'Dans chaque écran, l''information ne doit pas être donnée uniquement par la forme, taille ou position. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '8.7', 'Dans chaque écran, les contenus additionnels apparaissant à la prise de focus ou au survol d''un composant d''interface sont-ils contrôlables par l''utilisateur (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-8-7',
     '{VISUAL,COGNITIVE,MOTOR}', 7);

  ----------------------------------------------------------------------------
  -- Thème 9 : Formulaires (12 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '9';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '9.1', 'Chaque champ de formulaire a-t-il une étiquette visible ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '9.2', 'Chaque champ de formulaire a-t-il une étiquette accessible aux technologies d''assistance ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-2',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '9.3', 'Chaque étiquette associée à un champ de formulaire est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-3',
     '{COGNITIVE}', 3),
    (th_id, '9.4', 'Chaque étiquette de champ et son champ associé sont-ils accolés ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-4',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '9.5', 'Dans chaque formulaire, l''intitulé de chaque bouton est-il pertinent ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-5',
     '{VISUAL,COGNITIVE,MOTOR}', 5),
    (th_id, '9.6', 'Dans chaque formulaire, les champs de même nature sont-ils identifiés, si nécessaire ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '9.7', 'Les champs de formulaire obligatoires sont-ils correctement identifiés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '9.8', 'Pour chaque champ de formulaire qui attend un type de données et/ou un format spécifique, l''information correspondante est-elle disponible ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-8',
     '{COGNITIVE,MOTOR}', 8),
    (th_id, '9.9', 'Dans chaque formulaire, les erreurs de saisie sont-elles accessibles ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-9',
     '{VISUAL,COGNITIVE,MOTOR}', 9),
    (th_id, '9.10', 'Dans chaque formulaire, le contrôle de saisie est-il accompagné, si nécessaire, de suggestions des types, formats de données ou valeurs attendus ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-10',
     '{VISUAL,COGNITIVE,MOTOR}', 10),
    (th_id, '9.11', 'Pour chaque formulaire qui modifie ou supprime des données, ou qui transmet des réponses à un test ou à un examen, ou dont la validation a des conséquences financières ou juridiques, les données saisies peuvent-elles être modifiées, mises à jour ou récupérées par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-11',
     '{VISUAL,COGNITIVE,MOTOR}', 11),
    (th_id, '9.12', 'Pour chaque champ qui attend une donnée personnelle de l''utilisateur, la saisie est-elle facilitée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-9-12',
     '{COGNITIVE,MOTOR}', 12);

  ----------------------------------------------------------------------------
  -- Thème 10 : Navigation (4 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '10';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '10.1', 'Dans chaque écran, l''ordre de tabulation au clavier est-il cohérent ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-10-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '10.2', 'Dans chaque écran, l''ordre de restitution par les technologies d''assistance est-il cohérent ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-10-2',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '10.3', 'Dans chaque écran, la navigation ne doit pas contenir de piège au clavier. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-10-3',
     '{MOTOR,VISUAL,COGNITIVE}', 3),
    (th_id, '10.4', 'Dans chaque écran, les raccourcis clavier n''utilisant qu''une seule touche (lettre minuscule ou majuscule, ponctuation, chiffre ou symbole) sont-ils contrôlables par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-10-4',
     '{MOTOR,COGNITIVE}', 4);

  ----------------------------------------------------------------------------
  -- Thème 11 : Consultation (16 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '11';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '11.1', 'Pour chaque écran, l''utilisateur a-t-il le contrôle de chaque limite de temps modifiant le contenu (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '11.2', 'Pour chaque écran, chaque procédé limitant le temps d''une session peut-il être arrêté ou supprimé (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-2',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '11.3', 'Dans chaque écran, chaque document bureautique en téléchargement possède-t-il, si nécessaire, une version accessible (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3),
    (th_id, '11.4', 'Pour chaque document bureautique ayant une version accessible, cette version offre-t-elle la même information (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-4',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 4),
    (th_id, '11.5', 'Dans chaque écran, chaque contenu cryptique (art ASCII, émoticon, syntaxe cryptique) a-t-il une alternative ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '11.6', 'Dans chaque écran, pour chaque contenu cryptique (art ASCII, émoticône, syntaxe cryptique) ayant une alternative, cette alternative est-elle pertinente ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-6',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '11.7', 'Dans chaque écran, les changements brusques de luminosité ou les effets de flash sont-ils correctement utilisés ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-7',
     '{VISUAL,COGNITIVE}', 7),
    (th_id, '11.8', 'Dans chaque écran, chaque contenu en mouvement ou clignotant est-il contrôlable par l''utilisateur ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-8',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '11.9', 'Dans chaque écran, le contenu proposé est-il consultable quelle que soit l''orientation de l''écran (portrait ou paysage) (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-9',
     '{VISUAL,COGNITIVE,MOTOR}', 9),
    (th_id, '11.10', 'Dans chaque écran, les fonctionnalités activables au moyen d''un geste complexe sont-elles activables au moyen d''un geste simple (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-10',
     '{MOTOR,VISUAL,COGNITIVE}', 10),
    (th_id, '11.11', 'Dans chaque écran, les fonctionnalités activables par la réalisation d''actions simultanées sont-elles activables au moyen d''une action unique. Cette règle est-elle respectée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-11',
     '{MOTOR,VISUAL,COGNITIVE}', 11),
    (th_id, '11.12', 'Dans chaque écran, les actions déclenchées au moyen d''un dispositif de pointage sur un point unique de l''écran peuvent-elles faire l''objet d''une annulation (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-12',
     '{MOTOR,VISUAL,COGNITIVE}', 12),
    (th_id, '11.13', 'Dans chaque écran, les fonctionnalités qui impliquent un mouvement de l''appareil ou vers l''appareil peuvent-elles être satisfaites de manière alternative (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-13',
     '{MOTOR,VISUAL,COGNITIVE}', 13),
    (th_id, '11.14', 'Pour chaque fonctionnalité de conversion d''un document, les informations relatives à l''accessibilité disponibles dans le document source sont-elles conservées dans le document de destination (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-14',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 14),
    (th_id, '11.15', 'Chaque fonctionnalité d''identification ou de contrôle qui repose sur l''utilisation de caractéristiques biologiques de l''utilisateur dispose-t-elle d''une méthode alternative ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-15',
     '{MOTOR,VISUAL,COGNITIVE}', 15),
    (th_id, '11.16', 'Pour chaque application qui intègre une fonctionnalité de répétition des touches, la répétition est-elle ajustable (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-11-16',
     '{MOTOR,COGNITIVE}', 16);

  ----------------------------------------------------------------------------
  -- Thème 12 : Documentation et fonctionnalités d'accessibilité (4 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '12';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '12.1', 'La documentation de l''application décrit-elle les fonctionnalités d''accessibilité disponibles et les informations relatives à la compatibilité avec l''accessibilité ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-12-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '12.2', 'Pour chaque fonctionnalité d''accessibilité décrite dans la documentation, le mécanisme qui permet de l''activer répond aux besoins d''accessibilité des utilisateurs concernés. Cette règle est-elle respectée (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-12-2',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '12.3', 'L''application ne perturbe pas les fonctionnalités d''accessibilité de la plateforme. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-12-3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3),
    (th_id, '12.4', 'La documentation de l''application est-elle conforme aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-12-4',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 4);

  ----------------------------------------------------------------------------
  -- Thème 13 : Outils d'édition (6 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '13';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '13.1', 'Chaque outil d''édition permet-il de définir les informations d''accessibilité nécessaires pour créer un contenu conforme aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-13-1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '13.2', 'Chaque outil d''édition met-il à disposition des aides à la création de contenus conformes aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-13-2',
     '{COGNITIVE}', 2),
    (th_id, '13.3', 'Le contenu généré par chaque transformation des contenus est-il conforme aux règles d''accessibilité numérique (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-13-3',
     '{VISUAL,COGNITIVE}', 3),
    (th_id, '13.4', 'Pour chaque erreur d''accessibilité relevée par un test d''accessibilité automatique ou semi-automatique, l''outil d''édition fournit-il des suggestions de réparation ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-13-4',
     '{COGNITIVE}', 4),
    (th_id, '13.5', 'Pour chaque ensemble de gabarits, un gabarit au moins permet de répondre aux règles d''accessibilité numérique. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-13-5',
     '{VISUAL,COGNITIVE}', 5),
    (th_id, '13.6', 'Chaque gabarit qui permet de répondre aux règles d''accessibilité numérique est-il clairement identifiable ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-13-6',
     '{VISUAL,COGNITIVE}', 6);

  ----------------------------------------------------------------------------
  -- Thème 14 : Services d'assistance (3 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '14';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '14.1', 'Chaque service d''assistance fournit-il des informations relatives aux fonctionnalités d''accessibilité et à la compatibilité avec l''accessibilité, décrites dans la documentation ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-14-1',
     '{VISUAL,AUDITORY,COGNITIVE}', 1),
    (th_id, '14.2', 'Le service d''assistance répond aux besoins de communication des personnes handicapées directement ou par l''intermédiaire d''un service de relais. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-14-2',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 2),
    (th_id, '14.3', 'La documentation fournie par le service d''assistance est-elle conforme aux règles d''accessibilité numérique ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-14-3',
     '{VISUAL,AUDITORY,COGNITIVE,MOTOR}', 3);

  ----------------------------------------------------------------------------
  -- Thème 15 : Communication en temps réel (11 critères)
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '55555555-5555-5555-5555-555555555555' and identifier = '15';

  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '15.1', 'Pour chaque application de communication orale bidirectionnelle, l''application est-elle capable d''encoder et de décoder cette communication avec une gamme de fréquences dont la limite supérieure est de 7 000 Hz au moins ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-1',
     '{AUDITORY}', 1),
    (th_id, '15.2', 'Chaque application qui permet une communication orale bidirectionnelle dispose-t-elle d''une fonctionnalité de communication écrite en temps réel ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-2',
     '{AUDITORY}', 2),
    (th_id, '15.3', 'Pour chaque application qui permet une communication orale bidirectionnelle et écrite en temps réel, les deux modes sont-ils utilisables simultanément ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-3',
     '{AUDITORY}', 3),
    (th_id, '15.4', 'Pour chaque fonctionnalité de communication écrite en temps réel, les messages peuvent-ils être identifiés (hors cas particuliers) ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-4',
     '{AUDITORY,COGNITIVE}', 4),
    (th_id, '15.5', 'Pour chaque application de communication orale bidirectionnelle, un indicateur visuel de l''activité orale est-il présent ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-5',
     '{AUDITORY}', 5),
    (th_id, '15.6', 'Chaque application de communication écrite en temps réel qui peut interagir avec d''autres applications de communication écrite en temps réel respecte-t-elle les règles d''interopérabilité en vigueur ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-6',
     '{AUDITORY}', 6),
    (th_id, '15.7', 'Pour chaque application qui permet une communication écrite en temps réel, le délai de transmission de chaque unité de saisie est de 500ms ou moins. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-7',
     '{AUDITORY,COGNITIVE}', 7),
    (th_id, '15.8', 'Pour chaque application de télécommunication, l''identification de l''interlocuteur qui initie un appel est-elle accessible ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-8',
     '{VISUAL,AUDITORY}', 8),
    (th_id, '15.9', 'Pour chaque application de communication orale bidirectionnelle qui permet d''identifier l''activité d''un interlocuteur oralisant, il est possible d''identifier l''activité d''un interlocuteur signant. Cette règle est-elle respectée ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-9',
     '{AUDITORY}', 9),
    (th_id, '15.10', 'Pour chaque application de communication orale bidirectionnelle qui dispose de fonctionnalités vocales, celles-ci sont-elles utilisables sans la nécessité d''écouter ou parler ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-10',
     '{AUDITORY,MOTOR}', 10),
    (th_id, '15.11', 'Pour chaque application de communication orale bidirectionnelle qui dispose d''une vidéo en temps réel, la qualité de la vidéo est-elle suffisante ?',
     'https://accessibilite.public.lu/fr/raam1.1/referentiel-technique.html#crit-15-11',
     '{AUDITORY,VISUAL}', 11);

end$$;

-- 4) Vérification stricte : exactement 108 critères RAAM 1.1 ----------------
do $$
declare
  total int;
begin
  select count(*) into total
  from public.criteria c
  join public.thematics t on t.id = c.thematic_id
  where t.reference_id = '55555555-5555-5555-5555-555555555555';

  if total <> 108 then
    raise exception 'RAAM 1.1 import incomplet : % critères trouvés, 108 attendus', total;
  end if;
end$$;

commit;
