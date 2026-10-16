-- ============================================================================
-- Migration 85 : Offre de lancement — plan Pro offert
-- ----------------------------------------------------------------------------
-- Stratégie commerciale : tant que la plateforme se fait connaître, toutes les
-- organisations reçoivent le plan Pro gratuitement. Le Pro deviendra payant
-- plus tard.
--
--   1. Colonne `subscriptions.launch_offer` : marque les organisations qui ont
--      bénéficié de l'offre, pour décider de leur sort au passage au payant.
--   2. `handle_new_organization()` crée désormais une subscription 'pro'
--      marquée launch_offer (au lieu de 'free').
--   3. Backfill : les organisations encore en 'free' (sans abonnement Stripe)
--      passent en 'pro' + launch_offer. Les plans payants et l'org interne
--      (enterprise) ne sont pas touchés.
--
-- Fin de l'offre : nouvelle migration qui remet 'free' dans le trigger, et
-- `LAUNCH_OFFER_ACTIVE = false` dans src/lib/billing/launch-offer.ts.
--
-- Idempotente.
-- ============================================================================

begin;

alter table public.subscriptions
  add column if not exists launch_offer boolean not null default false;

create index if not exists idx_subscriptions_launch_offer
  on public.subscriptions(launch_offer)
  where launch_offer;

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (organization_id, plan_code, status, launch_offer)
  values (new.id, 'pro', 'active', true)
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

update public.subscriptions s
   set plan_code    = 'pro',
       status       = 'active',
       launch_offer = true
  from public.organizations o
 where o.id = s.organization_id
   and o.deleted_at is null
   and s.plan_code = 'free'
   and s.stripe_subscription_id is null;

commit;
