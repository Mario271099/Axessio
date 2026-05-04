-- ============================================================================
-- Axessio · Import du référentiel WCAG 2.2 complet (86 critères)
-- ----------------------------------------------------------------------------
-- Source officielle EN : https://www.w3.org/TR/WCAG22/
-- Source officielle FR : https://www.w3.org/Translations/WCAG22-fr/
-- Référentiel WCAG 2.2 (id : 33333333-3333-3333-3333-333333333333)
--
-- 4 principes / 13 guidelines / 86 success criteria.
-- 4.1.1 Parsing est OBSOLÈTE et retiré en WCAG 2.2 → non importé.
--
-- Idempotent : SUPPRIME tous les critères et thématiques liés au WCAG 2.2,
-- puis insère les 13 guidelines et les 86 critères officiels.
-- À exécuter en transaction unique. Vérification finale stricte (= 86).
-- ============================================================================

begin;

-- 1) Suppression de l'existant (criteria via cascade FK puis thematics) ------
delete from public.criteria
where thematic_id in (
  select id from public.thematics
  where reference_id = '33333333-3333-3333-3333-333333333333'
);

delete from public.thematics
where reference_id = '33333333-3333-3333-3333-333333333333';

-- 2) Insertion des 13 guidelines comme thematics ----------------------------
insert into public.thematics (reference_id, identifier, name, sort_order) values
  ('33333333-3333-3333-3333-333333333333', '1.1', 'Équivalents textuels',          1),
  ('33333333-3333-3333-3333-333333333333', '1.2', 'Média temporel',                2),
  ('33333333-3333-3333-3333-333333333333', '1.3', 'Adaptable',                     3),
  ('33333333-3333-3333-3333-333333333333', '1.4', 'Distinguable',                  4),
  ('33333333-3333-3333-3333-333333333333', '2.1', 'Accessibilité au clavier',      5),
  ('33333333-3333-3333-3333-333333333333', '2.2', 'Délai suffisant',               6),
  ('33333333-3333-3333-3333-333333333333', '2.3', 'Crises et réactions physiques', 7),
  ('33333333-3333-3333-3333-333333333333', '2.4', 'Navigable',                     8),
  ('33333333-3333-3333-3333-333333333333', '2.5', 'Modalités d''entrée',           9),
  ('33333333-3333-3333-3333-333333333333', '3.1', 'Lisible',                      10),
  ('33333333-3333-3333-3333-333333333333', '3.2', 'Prévisible',                   11),
  ('33333333-3333-3333-3333-333333333333', '3.3', 'Assistance à la saisie',       12),
  ('33333333-3333-3333-3333-333333333333', '4.1', 'Compatible',                   13);

-- 3) Insertion des 86 success criteria --------------------------------------
do $$
declare
  th_id uuid;
begin
  ----------------------------------------------------------------------------
  -- Guideline 1.1 Text Alternatives (1 critère) — Perceivable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '1.1';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '1.1.1', 'Contenu non textuel', 'Non-text Content', 'A',
     'Perceivable', '1.1 Text Alternatives',
     'https://www.w3.org/TR/WCAG22/#non-text-content',
     '{VISUAL,COGNITIVE}', 1);

  ----------------------------------------------------------------------------
  -- Guideline 1.2 Time-based Media (9 critères) — Perceivable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '1.2';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '1.2.1', 'Contenus seulement audio et seulement vidéo (pré-enregistrés)',
     'Audio-only and Video-only (Prerecorded)', 'A',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#audio-only-and-video-only-prerecorded',
     '{VISUAL,AUDITORY}', 1),
    (th_id, '1.2.2', 'Sous-titres (pré-enregistrés)',
     'Captions (Prerecorded)', 'A',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#captions-prerecorded',
     '{AUDITORY}', 2),
    (th_id, '1.2.3', 'Audio-description ou version de remplacement pour un média temporel (pré-enregistré)',
     'Audio Description or Media Alternative (Prerecorded)', 'A',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#audio-description-or-media-alternative-prerecorded',
     '{VISUAL,AUDITORY}', 3),
    (th_id, '1.2.4', 'Sous-titres (en direct)',
     'Captions (Live)', 'AA',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#captions-live',
     '{AUDITORY}', 4),
    (th_id, '1.2.5', 'Audio-description (pré-enregistrée)',
     'Audio Description (Prerecorded)', 'AA',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#audio-description-prerecorded',
     '{VISUAL}', 5),
    (th_id, '1.2.6', 'Langue des signes (pré-enregistrée)',
     'Sign Language (Prerecorded)', 'AAA',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#sign-language-prerecorded',
     '{AUDITORY}', 6),
    (th_id, '1.2.7', 'Audio-description étendue (pré-enregistrée)',
     'Extended Audio Description (Prerecorded)', 'AAA',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#extended-audio-description-prerecorded',
     '{VISUAL}', 7),
    (th_id, '1.2.8', 'Version de remplacement pour un média temporel (pré-enregistrée)',
     'Media Alternative (Prerecorded)', 'AAA',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#media-alternative-prerecorded',
     '{VISUAL,AUDITORY}', 8),
    (th_id, '1.2.9', 'Seulement audio (en direct)',
     'Audio-only (Live)', 'AAA',
     'Perceivable', '1.2 Time-based Media',
     'https://www.w3.org/TR/WCAG22/#audio-only-live',
     '{AUDITORY}', 9);

  ----------------------------------------------------------------------------
  -- Guideline 1.3 Adaptable (6 critères) — Perceivable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '1.3';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '1.3.1', 'Information et relations',
     'Info and Relationships', 'A',
     'Perceivable', '1.3 Adaptable',
     'https://www.w3.org/TR/WCAG22/#info-and-relationships',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '1.3.2', 'Ordre séquentiel logique',
     'Meaningful Sequence', 'A',
     'Perceivable', '1.3 Adaptable',
     'https://www.w3.org/TR/WCAG22/#meaningful-sequence',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '1.3.3', 'Caractéristiques sensorielles',
     'Sensory Characteristics', 'A',
     'Perceivable', '1.3 Adaptable',
     'https://www.w3.org/TR/WCAG22/#sensory-characteristics',
     '{VISUAL,AUDITORY,COGNITIVE}', 3),
    (th_id, '1.3.4', 'Orientation',
     'Orientation', 'AA',
     'Perceivable', '1.3 Adaptable',
     'https://www.w3.org/TR/WCAG22/#orientation',
     '{VISUAL,MOTOR}', 4),
    (th_id, '1.3.5', 'Identifier la finalité de la saisie',
     'Identify Input Purpose', 'AA',
     'Perceivable', '1.3 Adaptable',
     'https://www.w3.org/TR/WCAG22/#identify-input-purpose',
     '{COGNITIVE,MOTOR}', 5),
    (th_id, '1.3.6', 'Identifier la fonction',
     'Identify Purpose', 'AAA',
     'Perceivable', '1.3 Adaptable',
     'https://www.w3.org/TR/WCAG22/#identify-purpose',
     '{COGNITIVE}', 6);

  ----------------------------------------------------------------------------
  -- Guideline 1.4 Distinguishable (13 critères) — Perceivable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '1.4';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '1.4.1', 'Utilisation de la couleur',
     'Use of Color', 'A',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#use-of-color',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '1.4.2', 'Contrôle du son',
     'Audio Control', 'A',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#audio-control',
     '{AUDITORY,COGNITIVE}', 2),
    (th_id, '1.4.3', 'Contraste (minimum)',
     'Contrast (Minimum)', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#contrast-minimum',
     '{VISUAL}', 3),
    (th_id, '1.4.4', 'Redimensionnement du texte',
     'Resize Text', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#resize-text',
     '{VISUAL}', 4),
    (th_id, '1.4.5', 'Texte sous forme d''image',
     'Images of Text', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#images-of-text',
     '{VISUAL}', 5),
    (th_id, '1.4.6', 'Contraste (amélioré)',
     'Contrast (Enhanced)', 'AAA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#contrast-enhanced',
     '{VISUAL}', 6),
    (th_id, '1.4.7', 'Arrière-plan sonore de faible volume ou absent',
     'Low or No Background Audio', 'AAA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#low-or-no-background-audio',
     '{AUDITORY}', 7),
    (th_id, '1.4.8', 'Présentation visuelle',
     'Visual Presentation', 'AAA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#visual-presentation',
     '{VISUAL,COGNITIVE}', 8),
    (th_id, '1.4.9', 'Texte sous forme d''image (sans exception)',
     'Images of Text (No Exception)', 'AAA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#images-of-text-no-exception',
     '{VISUAL}', 9),
    (th_id, '1.4.10', 'Redistribution',
     'Reflow', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#reflow',
     '{VISUAL,MOTOR}', 10),
    (th_id, '1.4.11', 'Contraste du contenu non textuel',
     'Non-text Contrast', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#non-text-contrast',
     '{VISUAL}', 11),
    (th_id, '1.4.12', 'Espacement du texte',
     'Text Spacing', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#text-spacing',
     '{VISUAL,COGNITIVE}', 12),
    (th_id, '1.4.13', 'Contenu au survol ou au focus',
     'Content on Hover or Focus', 'AA',
     'Perceivable', '1.4 Distinguishable',
     'https://www.w3.org/TR/WCAG22/#content-on-hover-or-focus',
     '{VISUAL,MOTOR,COGNITIVE}', 13);

  ----------------------------------------------------------------------------
  -- Guideline 2.1 Keyboard Accessible (4 critères) — Operable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '2.1';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '2.1.1', 'Clavier',
     'Keyboard', 'A',
     'Operable', '2.1 Keyboard Accessible',
     'https://www.w3.org/TR/WCAG22/#keyboard',
     '{MOTOR,VISUAL}', 1),
    (th_id, '2.1.2', 'Pas de piège au clavier',
     'No Keyboard Trap', 'A',
     'Operable', '2.1 Keyboard Accessible',
     'https://www.w3.org/TR/WCAG22/#no-keyboard-trap',
     '{MOTOR,VISUAL}', 2),
    (th_id, '2.1.3', 'Clavier (pas d''exception)',
     'Keyboard (No Exception)', 'AAA',
     'Operable', '2.1 Keyboard Accessible',
     'https://www.w3.org/TR/WCAG22/#keyboard-no-exception',
     '{MOTOR,VISUAL}', 3),
    (th_id, '2.1.4', 'Raccourcis clavier utilisant des caractères',
     'Character Key Shortcuts', 'A',
     'Operable', '2.1 Keyboard Accessible',
     'https://www.w3.org/TR/WCAG22/#character-key-shortcuts',
     '{MOTOR,COGNITIVE}', 4);

  ----------------------------------------------------------------------------
  -- Guideline 2.2 Enough Time (6 critères) — Operable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '2.2';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '2.2.1', 'Réglage du délai',
     'Timing Adjustable', 'A',
     'Operable', '2.2 Enough Time',
     'https://www.w3.org/TR/WCAG22/#timing-adjustable',
     '{COGNITIVE,MOTOR}', 1),
    (th_id, '2.2.2', 'Mettre en pause, arrêter, masquer',
     'Pause, Stop, Hide', 'A',
     'Operable', '2.2 Enough Time',
     'https://www.w3.org/TR/WCAG22/#pause-stop-hide',
     '{COGNITIVE,MOTOR,VISUAL}', 2),
    (th_id, '2.2.3', 'Pas de délai d''exécution',
     'No Timing', 'AAA',
     'Operable', '2.2 Enough Time',
     'https://www.w3.org/TR/WCAG22/#no-timing',
     '{COGNITIVE,MOTOR}', 3),
    (th_id, '2.2.4', 'Interruptions',
     'Interruptions', 'AAA',
     'Operable', '2.2 Enough Time',
     'https://www.w3.org/TR/WCAG22/#interruptions',
     '{COGNITIVE}', 4),
    (th_id, '2.2.5', 'Nouvelle authentification',
     'Re-authenticating', 'AAA',
     'Operable', '2.2 Enough Time',
     'https://www.w3.org/TR/WCAG22/#re-authenticating',
     '{COGNITIVE}', 5),
    (th_id, '2.2.6', 'Délais d''expiration',
     'Timeouts', 'AAA',
     'Operable', '2.2 Enough Time',
     'https://www.w3.org/TR/WCAG22/#timeouts',
     '{COGNITIVE}', 6);

  ----------------------------------------------------------------------------
  -- Guideline 2.3 Seizures and Physical Reactions (3 critères) — Operable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '2.3';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '2.3.1', 'Pas plus de trois flashs ou sous le seuil critique',
     'Three Flashes or Below Threshold', 'A',
     'Operable', '2.3 Seizures and Physical Reactions',
     'https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '2.3.2', 'Trois flashs',
     'Three Flashes', 'AAA',
     'Operable', '2.3 Seizures and Physical Reactions',
     'https://www.w3.org/TR/WCAG22/#three-flashes',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '2.3.3', 'Animation résultant d''interactions',
     'Animation from Interactions', 'AAA',
     'Operable', '2.3 Seizures and Physical Reactions',
     'https://www.w3.org/TR/WCAG22/#animation-from-interactions',
     '{COGNITIVE,VISUAL}', 3);

  ----------------------------------------------------------------------------
  -- Guideline 2.4 Navigable (13 critères, dont 2.4.11/12/13 NOUVEAUX) — Operable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '2.4';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '2.4.1', 'Contourner des blocs',
     'Bypass Blocks', 'A',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#bypass-blocks',
     '{MOTOR,VISUAL,COGNITIVE}', 1),
    (th_id, '2.4.2', 'Titre de page',
     'Page Titled', 'A',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#page-titled',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '2.4.3', 'Parcours du focus',
     'Focus Order', 'A',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#focus-order',
     '{MOTOR,VISUAL,COGNITIVE}', 3),
    (th_id, '2.4.4', 'Fonction du lien (selon le contexte)',
     'Link Purpose (In Context)', 'A',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#link-purpose-in-context',
     '{VISUAL,COGNITIVE}', 4),
    (th_id, '2.4.5', 'Accès multiples',
     'Multiple Ways', 'AA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#multiple-ways',
     '{COGNITIVE,MOTOR}', 5),
    (th_id, '2.4.6', 'En-têtes et étiquettes',
     'Headings and Labels', 'AA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#headings-and-labels',
     '{VISUAL,COGNITIVE}', 6),
    (th_id, '2.4.7', 'Visibilité du focus',
     'Focus Visible', 'AA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#focus-visible',
     '{VISUAL,MOTOR}', 7),
    (th_id, '2.4.8', 'Localisation',
     'Location', 'AAA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#location',
     '{COGNITIVE}', 8),
    (th_id, '2.4.9', 'Fonction du lien (lien uniquement)',
     'Link Purpose (Link Only)', 'AAA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#link-purpose-link-only',
     '{VISUAL,COGNITIVE}', 9),
    (th_id, '2.4.10', 'En-têtes de section',
     'Section Headings', 'AAA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#section-headings',
     '{VISUAL,COGNITIVE}', 10),
    (th_id, '2.4.11', 'Focus non masqué (minimum)',
     'Focus Not Obscured (Minimum)', 'AA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum',
     '{VISUAL,MOTOR}', 11),
    (th_id, '2.4.12', 'Focus non masqué (amélioré)',
     'Focus Not Obscured (Enhanced)', 'AAA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#focus-not-obscured-enhanced',
     '{VISUAL,MOTOR}', 12),
    (th_id, '2.4.13', 'Apparence du focus',
     'Focus Appearance', 'AAA',
     'Operable', '2.4 Navigable',
     'https://www.w3.org/TR/WCAG22/#focus-appearance',
     '{VISUAL,MOTOR}', 13);

  ----------------------------------------------------------------------------
  -- Guideline 2.5 Input Modalities (8 critères, dont 2.5.7/8 NOUVEAUX) — Operable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '2.5';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '2.5.1', 'Gestes pour le contrôle du pointeur',
     'Pointer Gestures', 'A',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#pointer-gestures',
     '{MOTOR}', 1),
    (th_id, '2.5.2', 'Annulation de l''action du pointeur',
     'Pointer Cancellation', 'A',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#pointer-cancellation',
     '{MOTOR}', 2),
    (th_id, '2.5.3', 'Étiquette dans le nom',
     'Label in Name', 'A',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#label-in-name',
     '{VISUAL,COGNITIVE,MOTOR}', 3),
    (th_id, '2.5.4', 'Activation par le mouvement',
     'Motion Actuation', 'A',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#motion-actuation',
     '{MOTOR}', 4),
    (th_id, '2.5.5', 'Taille de la cible (amélioré)',
     'Target Size (Enhanced)', 'AAA',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#target-size-enhanced',
     '{MOTOR}', 5),
    (th_id, '2.5.6', 'Modalités d''entrées concurrentes',
     'Concurrent Input Mechanisms', 'AAA',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#concurrent-input-mechanisms',
     '{MOTOR}', 6),
    (th_id, '2.5.7', 'Mouvements de glissement',
     'Dragging Movements', 'AA',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#dragging-movements',
     '{MOTOR}', 7),
    (th_id, '2.5.8', 'Taille de la cible (minimum)',
     'Target Size (Minimum)', 'AA',
     'Operable', '2.5 Input Modalities',
     'https://www.w3.org/TR/WCAG22/#target-size-minimum',
     '{MOTOR}', 8);

  ----------------------------------------------------------------------------
  -- Guideline 3.1 Readable (6 critères) — Understandable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '3.1';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '3.1.1', 'Langue de la page',
     'Language of Page', 'A',
     'Understandable', '3.1 Readable',
     'https://www.w3.org/TR/WCAG22/#language-of-page',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '3.1.2', 'Langue d''un passage',
     'Language of Parts', 'AA',
     'Understandable', '3.1 Readable',
     'https://www.w3.org/TR/WCAG22/#language-of-parts',
     '{VISUAL,COGNITIVE}', 2),
    (th_id, '3.1.3', 'Mots rares',
     'Unusual Words', 'AAA',
     'Understandable', '3.1 Readable',
     'https://www.w3.org/TR/WCAG22/#unusual-words',
     '{COGNITIVE}', 3),
    (th_id, '3.1.4', 'Abréviations',
     'Abbreviations', 'AAA',
     'Understandable', '3.1 Readable',
     'https://www.w3.org/TR/WCAG22/#abbreviations',
     '{COGNITIVE}', 4),
    (th_id, '3.1.5', 'Niveau de lecture',
     'Reading Level', 'AAA',
     'Understandable', '3.1 Readable',
     'https://www.w3.org/TR/WCAG22/#reading-level',
     '{COGNITIVE}', 5),
    (th_id, '3.1.6', 'Prononciation',
     'Pronunciation', 'AAA',
     'Understandable', '3.1 Readable',
     'https://www.w3.org/TR/WCAG22/#pronunciation',
     '{COGNITIVE,VISUAL}', 6);

  ----------------------------------------------------------------------------
  -- Guideline 3.2 Predictable (6 critères, dont 3.2.6 NOUVEAU) — Understandable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '3.2';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '3.2.1', 'Au focus',
     'On Focus', 'A',
     'Understandable', '3.2 Predictable',
     'https://www.w3.org/TR/WCAG22/#on-focus',
     '{COGNITIVE,VISUAL,MOTOR}', 1),
    (th_id, '3.2.2', 'À la saisie',
     'On Input', 'A',
     'Understandable', '3.2 Predictable',
     'https://www.w3.org/TR/WCAG22/#on-input',
     '{COGNITIVE,VISUAL,MOTOR}', 2),
    (th_id, '3.2.3', 'Navigation cohérente',
     'Consistent Navigation', 'AA',
     'Understandable', '3.2 Predictable',
     'https://www.w3.org/TR/WCAG22/#consistent-navigation',
     '{COGNITIVE,VISUAL}', 3),
    (th_id, '3.2.4', 'Identification cohérente',
     'Consistent Identification', 'AA',
     'Understandable', '3.2 Predictable',
     'https://www.w3.org/TR/WCAG22/#consistent-identification',
     '{COGNITIVE,VISUAL}', 4),
    (th_id, '3.2.5', 'Changement à la demande',
     'Change on Request', 'AAA',
     'Understandable', '3.2 Predictable',
     'https://www.w3.org/TR/WCAG22/#change-on-request',
     '{COGNITIVE}', 5),
    (th_id, '3.2.6', 'Aide cohérente',
     'Consistent Help', 'A',
     'Understandable', '3.2 Predictable',
     'https://www.w3.org/TR/WCAG22/#consistent-help',
     '{COGNITIVE}', 6);

  ----------------------------------------------------------------------------
  -- Guideline 3.3 Input Assistance (9 critères, dont 3.3.7/8/9 NOUVEAUX) — Understandable
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '3.3';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '3.3.1', 'Identification des erreurs',
     'Error Identification', 'A',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#error-identification',
     '{COGNITIVE,VISUAL}', 1),
    (th_id, '3.3.2', 'Étiquettes ou instructions',
     'Labels or Instructions', 'A',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#labels-or-instructions',
     '{COGNITIVE,VISUAL}', 2),
    (th_id, '3.3.3', 'Suggestion après une erreur',
     'Error Suggestion', 'AA',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#error-suggestion',
     '{COGNITIVE}', 3),
    (th_id, '3.3.4', 'Prévention des erreurs (juridiques, financières, de données)',
     'Error Prevention (Legal, Financial, Data)', 'AA',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data',
     '{COGNITIVE}', 4),
    (th_id, '3.3.5', 'Aide',
     'Help', 'AAA',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#help',
     '{COGNITIVE}', 5),
    (th_id, '3.3.6', 'Prévention des erreurs (toutes)',
     'Error Prevention (All)', 'AAA',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#error-prevention-all',
     '{COGNITIVE}', 6),
    (th_id, '3.3.7', 'Saisie redondante',
     'Redundant Entry', 'A',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#redundant-entry',
     '{COGNITIVE,MOTOR}', 7),
    (th_id, '3.3.8', 'Authentification accessible (minimum)',
     'Accessible Authentication (Minimum)', 'AA',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum',
     '{COGNITIVE,MOTOR}', 8),
    (th_id, '3.3.9', 'Authentification accessible (amélioré)',
     'Accessible Authentication (Enhanced)', 'AAA',
     'Understandable', '3.3 Input Assistance',
     'https://www.w3.org/TR/WCAG22/#accessible-authentication-enhanced',
     '{COGNITIVE,MOTOR}', 9);

  ----------------------------------------------------------------------------
  -- Guideline 4.1 Compatible (2 critères — 4.1.1 OBSOLÈTE retiré) — Robust
  ----------------------------------------------------------------------------
  select id into th_id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333' and identifier = '4.1';

  insert into public.criteria
    (thematic_id, identifier, name, name_en, level, principle, guideline, url, disabilities, sort_order) values
    (th_id, '4.1.2', 'Nom, rôle et valeur',
     'Name, Role, Value', 'A',
     'Robust', '4.1 Compatible',
     'https://www.w3.org/TR/WCAG22/#name-role-value',
     '{VISUAL,COGNITIVE,MOTOR}', 2),
    (th_id, '4.1.3', 'Messages d''état',
     'Status Messages', 'AA',
     'Robust', '4.1 Compatible',
     'https://www.w3.org/TR/WCAG22/#status-messages',
     '{VISUAL,COGNITIVE}', 3);
end$$;

-- 4) Vérification stricte : exactement 86 critères WCAG 2.2 -----------------
do $$
declare
  total int;
begin
  select count(*) into total
  from public.criteria c
  join public.thematics t on t.id = c.thematic_id
  where t.reference_id = '33333333-3333-3333-3333-333333333333';

  if total <> 86 then
    raise exception 'WCAG 2.2 import incomplet : % critères trouvés, 86 attendus', total;
  end if;
end$$;

commit;
