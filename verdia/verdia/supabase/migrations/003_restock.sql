-- Return stock atomically when an order is cancelled (and re-take it if un-cancelled).
create or replace function public.restock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products p set stock = p.stock + i.quantity
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.products p set stock = greatest(p.stock - i.quantity, 0)
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end $$;

create trigger orders_restock after update of status on public.orders
  for each row execute function public.restock_on_cancel();
