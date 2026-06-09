begin;

update public.subscription_plans
   set monthly_price_eur = 39.00,
       yearly_price_eur  = 390.00,
       updated_at        = now()
 where code = 'starter';

-- Vérification
do $$
begin
  assert (select monthly_price_eur from public.subscription_plans where code = 'starter') = 39.00,
    'starter monthly_price_eur should be 39.00';
end $$;

commit;
