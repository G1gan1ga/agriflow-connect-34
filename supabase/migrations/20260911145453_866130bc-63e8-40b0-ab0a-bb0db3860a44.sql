CREATE TABLE public.farmers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  aadhaar TEXT NOT NULL,
  mobile TEXT,
  village TEXT,
  crop TEXT NOT NULL DEFAULT 'Wheat',
  land_size NUMERIC NOT NULL DEFAULT 0,
  center_id TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX farmers_aadhaar_key ON public.farmers (aadhaar);

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  center_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  slot TEXT NOT NULL,
  crop TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  token_no INTEGER,
  token TEXT,
  stage TEXT NOT NULL DEFAULT 'booked',
  weight_quintals NUMERIC,
  amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_stage_check CHECK (stage IN ('booked','checked_in','weighed','quality','accepted','paid'))
);

CREATE INDEX bookings_center_date_idx ON public.bookings (center_id, booking_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmers TO anon, authenticated;
GRANT ALL ON public.farmers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public demo access to farmers" ON public.farmers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public demo access to bookings" ON public.bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER farmers_updated_at BEFORE UPDATE ON public.farmers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.assign_booking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_no INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.center_id || NEW.booking_date::text));
  SELECT COALESCE(MAX(token_no), 100) + 1 INTO next_no
  FROM public.bookings
  WHERE center_id = NEW.center_id AND booking_date = NEW.booking_date;
  NEW.token_no = next_no;
  NEW.token = 'T-' || next_no::text;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_assign_token BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.assign_booking_token();

INSERT INTO public.farmers (name, aadhaar, mobile, village, crop, land_size, center_id, quantity) VALUES
  ('Ramesh Yadav','2841-7712-1200','9812340001','Nissing','Wheat',5.2,'c1',20),
  ('Sukhwinder Kaur','2841-7712-1201','9812340002','Jagraon','Paddy',3.8,'c2',25),
  ('Mahesh Patel','2841-7712-1202','9812340003','Berasia','Mustard',6.0,'c3',30),
  ('Anil Kumar','2841-7712-1203','9812340004','Gharaunda','Gram',2.5,'c1',35),
  ('Balwinder Singh','2841-7712-1204','9812340005','Raikot','Maize',7.1,'c2',40),
  ('Geeta Devi','2841-7712-1205','9812340006','Assandh','Wheat',1.9,'c3',45),
  ('Harpreet Singh','2841-7712-1206','9812340007','Sudhar','Paddy',4.4,'c1',50),
  ('Sunita Bai','2841-7712-1207','9812340008','Kolar','Mustard',3.3,'c2',55);

INSERT INTO public.bookings (farmer_id, center_id, booking_date, slot, crop, quantity, stage, weight_quintals, amount)
SELECT f.id, f.center_id, CURRENT_DATE, s.slot, f.crop, f.quantity, s.stage,
       CASE WHEN s.stage IN ('weighed','quality','accepted','paid') THEN f.quantity - 0.4 ELSE NULL END,
       CASE WHEN s.stage IN ('accepted','paid') THEN ROUND((f.quantity - 0.4) * 2275) ELSE NULL END
FROM public.farmers f
JOIN (VALUES
  ('2841-7712-1200','08:00 - 09:00','paid'),
  ('2841-7712-1201','09:00 - 10:00','accepted'),
  ('2841-7712-1202','10:00 - 11:00','weighed'),
  ('2841-7712-1203','11:00 - 12:00','checked_in'),
  ('2841-7712-1204','13:00 - 14:00','booked'),
  ('2841-7712-1205','14:00 - 15:00','booked'),
  ('2841-7712-1206','08:00 - 09:00','booked'),
  ('2841-7712-1207','09:00 - 10:00','booked')
) AS s(aadhaar, slot, stage) ON s.aadhaar = f.aadhaar;