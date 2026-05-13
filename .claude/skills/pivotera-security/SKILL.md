---
name: pivotera-security
description: PivotaraHub güvenlik kurallarını yeni kod yazılırken proaktif uygular — API auth guard, rate limit hatırlatması, key koruması, input validasyonu. Yeni API route veya upload kodu yazılırken tetiklenir.
---

# PivotaraHub Security Skill

## Tetikleyiciler (Proaktif)
- Yeni `/api/` route yazılırken
- Upload veya download kodu yazılırken
- Supabase query yazılırken
- Environment variable kullanılırken

## Yeni API Route Kontrol Listesi

Yeni bir route yazıldığında otomatik olarak şunu uygula:

### Auth Guard (ZORUNLU — kural 1)
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // henüz yok — G-01 sonrası

export async function POST(request: NextRequest) {
  // 1. Auth kontrolü — HER ZAMAN İLK SATIR
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  
  // ... geri kalan kod
}
```

> G-01 (Auth) implement edilene kadar bu kısım TODO comment olarak ekle ve uyar.

### Rate Limit Hatırlatması (ZORUNLU — kural 4)
```typescript
// TODO: Rate limiting ekle — G-02
// Hedef: 5 istek/saat/kullanıcı (/api/analyze-full için)
```

### Input Validasyonu
```typescript
// File upload
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

if (!file) return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Dosya çok büyük' }, { status: 400 });
if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Geçersiz format' }, { status: 400 });
```

### Hata Mesajı Güvenliği
```typescript
// ❌ YANLIŞ — iç hata kullanıcıya sızıyor
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// ✅ DOĞRU — genel mesaj, iç detay loglanır
catch (error) {
  logger.error('İşlem başarısız', error as Error, { userId, action: 'analyze' });
  return NextResponse.json(
    { ok: false, error: { code: 'INTERNAL_ERROR', message: 'İşlem başarısız oldu' } },
    { status: 500 }
  );
}
```

### Temp Dosya Güvenliği
```typescript
import crypto from 'crypto';

// Unique + tahmin edilemez filename
const tempFilename = `upload-${Date.now()}-${crypto.randomUUID()}${ext}`;
const tempPath = path.join(os.tmpdir(), tempFilename);

// ASLA proje dizinine yazma:
// ❌ path.join(process.cwd(), 'temp', filename)
// ✅ path.join(os.tmpdir(), filename)
```

## Supabase Sorgu Güvenliği

```typescript
// ❌ YANLIŞ — RLS bypass + manuel filtre yok → tüm user'lar görünür
const { data } = await supabaseAdmin.from('videos').select('*');

// ✅ DOĞRU — userId filtresi zorunlu
const { data } = await supabaseAdmin
  .from('videos')
  .select('*')
  .eq('user_id', userId);
```

## Ownership Kontrolü

Kullanıcı başkasının verisine erişmemeli:
```typescript
const { data: video } = await supabase
  .from('videos')
  .select('id, user_id')
  .eq('id', videoId)
  .eq('user_id', session.user.id)  // ownership check
  .single();

if (!video) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  // 403 değil 404 — varlığı bile gizle
}
```
