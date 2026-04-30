-- ============================================================================
-- Axessio · Données de démonstration
-- ----------------------------------------------------------------------------
-- À exécuter UNIQUEMENT en environnement de développement.
-- Insère les référentiels supportés et un échantillon de critères RGAA.
-- ============================================================================

-- Référentiels ---------------------------------------------------------------
insert into public.references (id, type, version, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'RGAA',     '4.1.2',  true),
  ('22222222-2222-2222-2222-222222222222', 'WCAG',     '2.1',    true),
  ('33333333-3333-3333-3333-333333333333', 'WCAG',     '2.2',    true),
  ('44444444-4444-4444-4444-444444444444', 'RAWeb',    '1.0',    true),
  ('55555555-5555-5555-5555-555555555555', 'RAAM',     '1.0',    true);

-- Thématiques RGAA 4.1.2 (les 13 thèmes officiels) --------------------------
insert into public.thematics (reference_id, identifier, name, sort_order) values
  ('11111111-1111-1111-1111-111111111111', '1',  'Images',                 1),
  ('11111111-1111-1111-1111-111111111111', '2',  'Cadres',                 2),
  ('11111111-1111-1111-1111-111111111111', '3',  'Couleurs',               3),
  ('11111111-1111-1111-1111-111111111111', '4',  'Multimédia',             4),
  ('11111111-1111-1111-1111-111111111111', '5',  'Tableaux',               5),
  ('11111111-1111-1111-1111-111111111111', '6',  'Liens',                  6),
  ('11111111-1111-1111-1111-111111111111', '7',  'Scripts',                7),
  ('11111111-1111-1111-1111-111111111111', '8',  'Éléments obligatoires',  8),
  ('11111111-1111-1111-1111-111111111111', '9',  'Structuration de l''information', 9),
  ('11111111-1111-1111-1111-111111111111', '10', 'Présentation de l''information', 10),
  ('11111111-1111-1111-1111-111111111111', '11', 'Formulaires',            11),
  ('11111111-1111-1111-1111-111111111111', '12', 'Navigation',             12),
  ('11111111-1111-1111-1111-111111111111', '13', 'Consultation',           13);

-- Échantillon de critères (extrait — la liste complète sera importée séparément)
do $$
declare
  th_id uuid;
begin
  -- Thème 1 : Images
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '1';
  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '1.1',  'Chaque image porteuse d''information a-t-elle une alternative textuelle ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '1.2',  'Chaque image de décoration est-elle correctement ignorée par les technologies d''assistance ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.2',
     '{VISUAL}', 2),
    (th_id, '1.3',  'L''alternative textuelle est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.3',
     '{VISUAL,COGNITIVE}', 3);

  -- Thème 3 : Couleurs
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '3';
  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '3.1', 'Dans chaque page web, l''information ne doit pas être donnée uniquement par la couleur.',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#3.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '3.2', 'Le contraste entre la couleur du texte et celle de son arrière-plan est-il suffisant ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#3.2',
     '{VISUAL}', 2);

  -- Thème 6 : Liens
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '6';
  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '6.1', 'Chaque lien est-il explicite ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#6.1',
     '{VISUAL,COGNITIVE}', 1),
    (th_id, '6.2', 'Chaque lien a-t-il un intitulé ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#6.2',
     '{VISUAL,COGNITIVE,MOTOR}', 2);

  -- Thème 11 : Formulaires
  select id into th_id from public.thematics
    where reference_id = '11111111-1111-1111-1111-111111111111' and identifier = '11';
  insert into public.criteria (thematic_id, identifier, name, url, disabilities, sort_order) values
    (th_id, '11.1', 'Chaque champ de formulaire a-t-il une étiquette ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.1',
     '{VISUAL,COGNITIVE,MOTOR}', 1),
    (th_id, '11.2', 'Chaque étiquette associée à un champ est-elle pertinente ?',
     'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#11.2',
     '{COGNITIVE}', 2);

end $$;

-- Données de démo (à n'exécuter qu'en local) --------------------------------
-- Un client de démo
insert into public.clients (id, name) values
  ('aaaa1111-aaaa-1111-aaaa-111111111111', 'Acme Corporation');

-- Un projet de démo
insert into public.projects (id, client_id, name, url) values
  ('bbbb2222-bbbb-2222-bbbb-222222222222',
   'aaaa1111-aaaa-1111-aaaa-111111111111',
   'Site institutionnel Acme',
   'https://www.acme.example.com');
