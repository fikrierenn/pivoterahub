---
name: css-expert
description: Tailwind CSS analizi ve optimizasyonu — utility class audit, design system tutarlılığı, responsive breakpoint, dark mode, performance
triggers:
  - "css analiz"
  - "tailwind"
  - "stil sorun"
  - "responsive sorun"
  - "dark mode"
  - "class temizlik"
  - "design system"
---

## Görev

PivotaraHub bileşenlerindeki Tailwind CSS kullanımını analiz et, anti-pattern'ları tespit et, design system tutarlılığını değerlendir ve optimizasyon önerileri üret.

---

## PivotaraHub Tailwind Config Kuralları

PivotaraHub'un renk/spacing sistemi `tailwind.config.js`'e bağlı. Her düzenleme bu sisteme uygun olmalı.

**Temel Renkler (kullanılması gereken):**
```
text-gray-900 / dark:text-white        — Primary text
text-gray-600 / dark:text-gray-400     — Secondary text
bg-white / dark:bg-gray-900            — Primary background
bg-gray-50 / dark:bg-gray-800          — Secondary background
border-gray-200 / dark:border-gray-700 — Borders
```

**Accent Renkler:**
```
text-blue-600 / dark:text-blue-400     — Links, CTAs
bg-blue-600 hover:bg-blue-700          — Primary buttons
text-red-600 / dark:text-red-400       — Errors, warnings
text-green-600 / dark:text-green-400   — Success states
```

---

## Anti-Pattern Tespiti

### 1. Inline Style Kullanımı (Yasak)
```tsx
// ❌ YASAK
<div style={{ color: 'red', fontSize: '16px' }}>

// ✅ DOĞRU
<div className="text-red-600 text-base">
```

### 2. Sihirli Sayılar
```tsx
// ❌ KÖTÜ — arbitrary values
<div className="w-[347px] h-[89px] mt-[23px]">

// ✅ İYİ — design system spacing
<div className="w-80 h-24 mt-6">
// Sadece gerçekten özel durum: w-[340px] → component-level constant'a taşı
```

### 3. Responsive Eksikliği
```tsx
// ❌ KÖTÜ — sadece desktop
<div className="grid grid-cols-4">

// ✅ İYİ — mobile-first
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

### 4. Dark Mode Eksikliği
```tsx
// ❌ KÖTÜ — dark mode dışlanmış
<div className="bg-white text-gray-900">

// ✅ İYİ
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

### 5. Tekrarlayan Class Grupları
```tsx
// ❌ KÖTÜ — aynı grup 5+ yerde tekrar
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">

// ✅ İYİ — bileşene çek veya cva() ile varyant sistemi
import { cva } from 'class-variance-authority';
const buttonVariants = cva('px-4 py-2 rounded-lg font-medium', {
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    }
  }
});
```

### 6. Transition/Animation Eksikliği
```tsx
// ❌ Abrupt state changes
<div className={isOpen ? 'opacity-100' : 'opacity-0'}>

// ✅ Smooth transitions
<div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
```

---

## Performance Optimizasyonu

### PurgeCSS / Tree Shaking
- Dynamic class oluşturma `purge`'ü bypass eder:
```tsx
// ❌ KÖTÜ — purge göremez
<div className={`bg-${color}-600`}>

// ✅ İYİ — tam class adı
const colorMap = { red: 'bg-red-600', blue: 'bg-blue-600' };
<div className={colorMap[color]}>
```

### Critical CSS
- `layout.tsx`'deki stiller critical path'ta
- Büyük bileşen stilleri lazy load edilebilir

---

## Design Consistency Checklist

```
□ Spacing: 4px grid kullanılıyor (space-1=4px, space-2=8px, ...)
□ Typography: text-sm/base/lg/xl/2xl — font-size sınıf
□ Border radius: rounded-sm/md/lg/xl/full tutarlı
□ Shadow: shadow-sm/md/lg tutarlı
□ Focus states: focus:outline-none focus:ring-2 focus:ring-blue-500
□ Hover states: hover: prefix ile animasyonsuz değişim yok
□ Disabled states: disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Analiz Çıktı Formatı

```
## CSS/Tailwind Analizi — {component}

**Sorun Sayısı:** {critical: N, warning: N, info: N}

### CRITICAL
- {satır}: {sorun açıklaması}
  Öneri: {düzeltme}

### WARNING
- {satır}: Responsive breakpoint eksik
  Mevcut: className="grid-cols-3"
  Öneri: className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

### INFO
- {satır}: Tekrarlayan class grubu → bileşene taşı

### Design System Uyum Skoru
{n}/10 — {yorum}
```

---

## PivotaraHub Bileşen Standartları

```tsx
// Standart Card bileşeni
<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">

// Standart Primary Button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">

// Standart Input
<input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">

// Standart Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
```
