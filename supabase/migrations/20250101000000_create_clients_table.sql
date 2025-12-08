-- Migration: Create clients table
-- Description: Müşteri ana tablosu - Her danışan müşteriyi temsil eder

CREATE TABLE public.clients (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,
  sector                  text        NOT NULL, -- emlak / gelinlik / homm / zumba ...
  city                    text,
  ig_handle               text,
  weekly_content_capacity integer     DEFAULT 0,
  positioning             text,       -- luxury / mid / economic / vb.
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_sector ON public.clients (sector);
CREATE INDEX idx_clients_ig_handle ON public.clients (ig_handle);

COMMENT ON TABLE public.clients IS 'Müşteri ana tablosu - Her danışan müşteriyi temsil eder';
COMMENT ON COLUMN public.clients.sector IS 'Müşterinin sektörü: emlak, gelinlik, homm, zumba vb.';
COMMENT ON COLUMN public.clients.positioning IS 'Müşterinin pozisyonlaması: luxury, mid, economic vb.';
COMMENT ON COLUMN public.clients.weekly_content_capacity IS 'Haftalık video üretim kapasitesi';
