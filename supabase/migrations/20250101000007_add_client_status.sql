-- Müşteri durum takibi için status kolonu ekle
ALTER TABLE public.clients 
ADD COLUMN status text NOT NULL DEFAULT 'lead' 
CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'completed'));

-- Status için index
CREATE INDEX idx_clients_status ON public.clients (status);

-- Status açıklamaları:
-- lead: Potansiyel müşteri (ilk temas)
-- prospect: Görüşülen müşteri (intake form doldurulmuş)
-- active: Aktif çalışılan müşteri (anlaşma yapılmış)
-- inactive: Pasif müşteri (çalışma durmuş)
-- completed: Tamamlanmış müşteri (proje bitmiş)

COMMENT ON COLUMN public.clients.status IS 'Müşteri durumu: lead, prospect, active, inactive, completed';
