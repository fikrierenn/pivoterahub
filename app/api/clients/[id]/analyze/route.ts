import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder — gerçek implementasyon henüz yazılmadı.
 *
 * Plan: Müşterinin bütün analizlerini (bio + competitor + video performance)
 * tek çağrıyla tetikleyen orchestration endpoint. Şu an `complete-analysis`
 * benzer iş yapıyor ama tip uyum sorunları (T-02) var.
 *
 * TODO: complete-analysis tamir edildikten sonra ya bu kaldırılır ya da
 * complete-analysis'in temizlenmiş versiyonu buraya alınır.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Bu endpoint henüz hazır değil.' },
    },
    { status: 501 },
  );
}
