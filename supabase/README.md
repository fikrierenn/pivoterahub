# Supabase Migration Dosyaları

Bu klasördeki SQL dosyalarını Supabase Dashboard'da çalıştırmanız gerekiyor.

## Nasıl Çalıştırılır?

1. https://supabase.com adresine git
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçin
4. **New Query** butonuna tıklayın
5. Aşağıdaki dosyaları sırayla kopyala-yapıştır ve **Run** butonuna tıkla:

### Sıralama (Önemli!)

```
1. 20250101000000_create_clients_table.sql
2. 20250101000001_create_videos_table.sql
3. 20250101000002_create_video_scores_table.sql
4. 20250101000003_create_video_stats_table.sql
5. 20250101000004_create_hashtag_stats_table.sql
6. 20250101000005_create_client_intake_form.sql
7. 20250101000006_create_client_analysis.sql
8. 20250101000007_add_client_status.sql
```

## Hızlı Kurulum

Tüm migration'ları tek seferde çalıştırmak için:

1. SQL Editor'de yeni bir query aç
2. Tüm migration dosyalarının içeriğini sırayla kopyala-yapıştır
3. Run butonuna tıkla

## Kontrol

Migration'ların başarılı olduğunu kontrol etmek için:

```sql
-- Tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- clients tablosunu kontrol et
SELECT * FROM clients LIMIT 1;
```

## Sorun Giderme

Eğer "relation already exists" hatası alırsanız:
- Tablo zaten var demektir, bir sonraki migration'a geçin

Eğer "column already exists" hatası alırsanız:
- Kolon zaten eklenmiş demektir, devam edin
