DELETE FROM public.bookings b
USING public.bookings b2
WHERE b.farmer_id = b2.farmer_id
  AND b.booking_date = b2.booking_date
  AND b.created_at > b2.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_center_date_token_no_key
  ON public.bookings (center_id, booking_date, token_no);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_farmer_date_key
  ON public.bookings (farmer_id, booking_date);

CREATE OR REPLACE FUNCTION public.assign_booking_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  next_no INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.center_id || '|' || NEW.booking_date::text));

  SELECT COALESCE(MAX(token_no), 100) + 1 INTO next_no
  FROM public.bookings
  WHERE center_id = NEW.center_id AND booking_date = NEW.booking_date;

  WHILE EXISTS (
    SELECT 1 FROM public.bookings
    WHERE center_id = NEW.center_id
      AND booking_date = NEW.booking_date
      AND token_no = next_no
  ) LOOP
    next_no := next_no + 1;
  END LOOP;

  NEW.token_no = next_no;
  NEW.token = 'T-' || next_no::text;
  RETURN NEW;
END;
$function$;