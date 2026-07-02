-- Country UX polish (G6): stop defaulting new listings to Brunei.
-- Country is a required, validated field from the create form; the
-- DB-level default was a Brunei-era assumption. Idempotent.
alter table listings alter column country drop default;
