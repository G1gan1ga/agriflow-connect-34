ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmers;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.farmers REPLICA IDENTITY FULL;