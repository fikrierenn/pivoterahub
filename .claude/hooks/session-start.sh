#!/usr/bin/env bash
# PivotaraHub — Session Start Hook

echo "═══════════════════════════════════════════════════"
echo "  🎯 PivotaraHub — Oturum Başı Özeti"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════════════════"

echo ""
echo "📌 SON 5 COMMIT:"
git log --oneline -5 2>/dev/null || echo "  (git log alınamadı)"

echo ""
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 15 ]; then
  echo "⚠️  UNCOMMITTED: $UNCOMMITTED dosya — 15 eşiği AŞILDI! commit-splitter agent çağır."
elif [ "$UNCOMMITTED" -gt 0 ]; then
  echo "📝 UNCOMMITTED: $UNCOMMITTED dosya"
  git status --porcelain 2>/dev/null | head -10
else
  echo "✅ UNCOMMITTED: Temiz"
fi

echo ""
echo "📓 SON JOURNAL:"
JOURNAL_DIR="docs/journal"
if [ -d "$JOURNAL_DIR" ]; then
  LAST_JOURNAL=$(ls -t "$JOURNAL_DIR"/*.md 2>/dev/null | head -1)
  if [ -n "$LAST_JOURNAL" ]; then
    echo "  📄 $LAST_JOURNAL"
    tail -20 "$LAST_JOURNAL" 2>/dev/null
  else
    echo "  (henüz journal yok)"
  fi
else
  echo "  (docs/journal/ klasörü bulunamadı)"
fi

echo ""
echo "📋 AKTİF TODO (ilk 5):"
if [ -f "TODO.md" ]; then
  grep -E "^\d+\. \*\*" TODO.md 2>/dev/null | head -5 || echo "  (TODO maddesi bulunamadı)"
else
  echo "  (TODO.md bulunamadı)"
fi

echo ""
echo "🔴 KRİTİK BORÇLAR:"
echo "  G-01: Auth yok — tüm API route'lar açık"
echo "  G-02: Rate limiting yok"
echo "  F-01: Director AI henüz yok (FAZ 2)"
echo "  F-02: FrameAgent henüz yok (FAZ 3)"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Kurallar: .claude/rules/ | Planlar: plans/"
echo "  Agents: .claude/agents/ | Skills: .claude/skills/"
echo "═══════════════════════════════════════════════════"
