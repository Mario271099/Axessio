-- =============================================================================
-- Axessyo · Rebranding Axessio → Axessyo (données déjà en base)
-- -----------------------------------------------------------------------------
-- Le renommage du code (find-replace) ne touche PAS les lignes déjà insérées
-- par la migration 43. Cette migration met la base en cohérence :
--   1. l'org interne plateforme (son `name` sert de brandName par défaut pour
--      le staff via current_org_branding()) ;
--   2. les emails de facturation hérités du domaine @axessio.app.
-- Idempotente : les gardes (`where`) la rendent rejouable sans effet de bord.
-- Le slug 'axessio-internal' est un identifiant d'URL stable — on ne le touche
-- pas (aucune valeur de marque visible).
-- =============================================================================

begin;

-- 1. Org interne « Axessyo » (UUID stable, cf. AXESSIO_INTERNAL_ORG_ID côté TS)
update public.organizations
   set name = 'Axessyo',
       billing_email = 'admin@axessyo.com'
 where id = '00000000-0000-0000-0000-000000000001'::uuid
   and name = 'Axessio';

-- 2. Emails de facturation hérités du fallback legacy `no-reply@axessio.app`
--    (et tout autre @axessio.app) → nouveau domaine.
update public.organizations
   set billing_email = regexp_replace(billing_email, '@axessio\.app$', '@axessyo.com')
 where billing_email like '%@axessio.app';

commit;
