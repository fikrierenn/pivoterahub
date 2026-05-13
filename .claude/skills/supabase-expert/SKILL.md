---
name: supabase-expert
description: PivotaraHub Supabase kullanım kurallarını uygular — RLS, client/admin ayrımı, şifreleme, storage pattern. Yeni Supabase sorgusu veya tablo yazılırken proaktif tetiklenir.
---

# PivotaraHub Supabase Expert Skill

## Tetikleyiciler (Proaktif)
- Yeni Supabase sorgusu yazılırken
- Yeni tablo veya sütun tanımlanırken
- Storage upload/download kodu yazılırken

## Client Seçim Kuralı

```typescript
// CLIENT-SIDE (Browser, React component):
import { supabase } from '@/lib/supabaseClient';
// RLS aktif — kullanıcı sadece kendi verisini görür

// SERVER-SIDE (API route, background job):
import { supabaseAdmin } from '@/lib/supabaseAdmin';
// RLS bypass — ZORUNLU: manuel user_id filtresi ekle
```

## Standart CRUD Pattern

```typescript
// CREATE — video kaydı
const { data, error } = await supabaseAdmin
  .from('videos')
  .insert({
    user_id: session.user.id,  // ZORUNLU
    original_filename_encrypted: encryptedFilename,
    storage_path_encrypted: encryptedPath,
    status: 'uploaded',
  })
  .select()
  .single();

if (error) {
  logger.error('Video insert failed', error);
  throw new Error('Video kaydedilemedi');
}

// READ — ownership check ile
const { data: video, error } = await supabase
  .from('videos')
  .select('*, transcriptions(*)')
  .eq('id', videoId)
  .single();  // RLS zaten user'ı filtreler

// UPDATE
await supabase
  .from('videos')
  .update({ status: 'ready' })
  .eq('id', videoId);
  // RLS: sadece kendi videosu

// DELETE
await supabase
  .from('videos')
  .delete()
  .eq('id', videoId);
```

## Storage Pattern

```typescript
// Upload
const storageKey = `videos/${userId}/${videoId}/${filename}`;
const { error } = await supabaseAdmin.storage
  .from('videos')
  .upload(storageKey, buffer, {
    contentType: 'video/mp4',
    upsert: false,
  });

// Signed URL (geçici erişim — 1 saat)
const { data } = await supabaseAdmin.storage
  .from('videos')
  .createSignedUrl(storageKey, 3600);
```

## Tablo Şeması Kuralları

Her tablo için zorunlu:
```sql
CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS ZORUNLU
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own videos"
ON videos FOR ALL
USING (auth.uid() = user_id);
```

## AI Sonuçları JSONB Pattern

```typescript
// Analiz sonuçları JSONB olarak
await supabase
  .from('transcriptions')
  .insert({
    video_id: videoId,
    language: transcription.language,
    segments: transcription.segments,  // JSONB — otomatik serialize
  });

// Sorgulama
const { data } = await supabase
  .from('transcriptions')
  .select('segments')
  .eq('video_id', videoId)
  .single();
// data.segments → doğrudan JS array
```

## Real-time Subscription (Gelecek)

```typescript
// Job durumu takibi için (F-07 async job)
const subscription = supabase
  .channel('job-status')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'transcription_jobs', filter: `id=eq.${jobId}` },
    (payload) => { setStatus(payload.new.status); }
  )
  .subscribe();

// Cleanup
return () => supabase.removeChannel(subscription);
```
