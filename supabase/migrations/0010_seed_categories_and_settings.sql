-- Same 11 default categories the old ensureDefaultCategories() seeded on
-- first boot, plus the single settings row.
insert into public.categories (name) values
  ('Illegal dumping'),
  ('Overflowing bin'),
  ('Flooding'),
  ('Pollution'),
  ('Blocked drain'),
  ('Bush fire'),
  ('Illegal mining'),
  ('Water pollution'),
  ('Air pollution'),
  ('Tree cutting'),
  ('Other')
on conflict (name) do nothing;

insert into public.settings (id) values (true)
on conflict (id) do nothing;
