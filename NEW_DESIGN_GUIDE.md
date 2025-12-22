# 🎨 New Design System - Soft Pastel Theme

## **Color Palette**

Based on the modern task management UI design you shared:

### **Primary Colors:**
```typescript
Background: #FFF5F0     // Soft cream/off-white
Card Light: #FFFFFF     // Clean white cards
Card Dark: #5C5C6F      // Charcoal gray (dark cards)
Primary: #FFD4C3        // Soft peach/pink (buttons, accents)
Secondary: #D4E8F0      // Soft blue (tags, badges)
Accent: #E8E577         // Soft yellow (highlights)
```

### **Text Colors:**
```typescript
Primary: #2D2D3F        // Dark charcoal
Secondary: #8B8B9E      // Medium gray
Light: #FFFFFF          // White (on dark cards)
Muted: #B5B5C5          // Light gray
```

### **Semantic Colors:**
```typescript
Success: #A8E6A1        // Soft green
Error: #FFB4AB          // Soft pink/red
Warning: #FFE5B4        // Soft peach/orange
Info: #B4D4FF           // Soft blue
```

---

## **Design Principles**

### **1. Soft & Approachable**
- Round corners everywhere (12-24px radius)
- Soft shadows (low opacity, large blur)
- Pastel colors with high lightness
- No harsh blacks or pure whites

### **2. Card-Based Layout**
- Everything in cards with subtle shadows
- Mix of light and dark cards for contrast
- Grid layout for action items
- Wide cards for summaries

### **3. Modern Typography**
- Bold headings (700-800 weight)
- Clean body text (500 weight)
- Generous line height (1.5x)
- Limited font sizes (12, 14, 16, 18, 24, 32)

### **4. Pill-Shaped Elements**
- Tags and badges with high border radius
- Filter chips that look tappable
- Soft background colors

### **5. Subtle Depth**
- Layered cards
- Soft shadows
- Slight elevation differences
- No flat design

---

## **Component Styles**

### **Cards:**
```typescript
{
  backgroundColor: Colors.cardLight or Colors.cardDark,
  borderRadius: 16-24,
  padding: 16-24,
  shadowColor: 'rgba(93, 93, 111, 0.15)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 4,
}
```

### **Buttons:**
```typescript
Primary: {
  backgroundColor: Colors.primary (#FFD4C3),
  color: Colors.textPrimary,
  borderRadius: 12-16,
  padding: 12-16,
  fontWeight: '700',
}

Secondary: {
  backgroundColor: Colors.secondary (#D4E8F0),
  color: Colors.textPrimary,
  borderRadius: 12-16,
  padding: 8-12,
  fontWeight: '600',
}
```

### **Pills/Tags:**
```typescript
{
  backgroundColor: Colors.secondary,
  paddingHorizontal: 12-16,
  paddingVertical: 6-8,
  borderRadius: 20-24,
  fontSize: 12-14,
  fontWeight: '600',
}
```

### **Icon Badges:**
```typescript
{
  width: 48,
  height: 48,
  borderRadius: 12-16,
  backgroundColor: Colors.secondary,
  alignItems: 'center',
  justifyContent: 'center',
}
```

---

## **Screen-by-Screen Changes**

### **Home (CaptureScreen):**
✅ **Already Created** - `CaptureScreen_NewDesign.tsx`

**Features:**
- Cream background
- Pill-shaped filter tabs
- Dark charcoal Vision card with peach button
- Grid of action cards
- Today's summary card (wide)
- Privacy info card

---

### **Moments Screen:**

**Changes Needed:**
- **Background:** Cream (#FFF5F0)
- **Header:** White card with shadow
- **Filters:** Pill-shaped chips (blue when active)
- **Memory Cards:** White cards with soft shadows
  - Photo memories: Show image in rounded container
  - Audio memories: Waveform or music note icon
  - Location memories: Map pin icon
- **Import Button:** Peach (#FFD4C3) with shadow
- **Empty State:** Soft illustration style

**Layout:**
```
┌─────────────────────────────┐
│ Header (white card)         │
│ "Your Moments"              │
│ [🔄] [Import Photos]        │
└─────────────────────────────┘

[All] [Photos] [Audio] [Places] ← Pill filters

┌─────────────────────────────┐
│ Memory Card (white)         │
│ 🖼️ [Photo Preview]          │
│ "Sunset at the beach"       │
│ "2:30 PM • Beach Location"  │
└─────────────────────────────┘
```

---

### **Vision Screen:**

**Changes Needed:**
- **Hero Section:** Dark charcoal card
- **Input Cards:** White cards for each input type
  - Photo selector
  - Voice note recorder
  - Location display
  - Text note input
- **Generate Button:** Large peach button
- **Result Card:** White card with AI insights

**Layout:**
```
┌─────────────────────────────┐
│ Hero (dark charcoal)        │
│ "Mnemo Vision"              │
│ "Create rich memories"      │
└─────────────────────────────┘

┌───────┐ ┌───────┐
│ Photo │ │ Voice │
│ Card  │ │ Card  │
└───────┘ └───────┘

┌─────────────────────────────┐
│ [Generate Memory] ← Peach   │
└─────────────────────────────┘
```

---

### **Settings Screen:**

**Changes Needed:**
- **Background:** Cream
- **Sections:** White cards with shadows
- **Toggle Switches:** Peach when active
- **Danger Zone:** Soft pink card
- **Headers:** Bold, dark charcoal text

**Layout:**
```
┌─────────────────────────────┐
│ Privacy (white card)        │
│ ○ Audio Recording           │
│ ○ Photo Analysis            │
│ ○ Location Tracking         │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Data (white card)           │
│ Export Data                 │
│ Import Data                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Danger Zone (soft pink)     │
│ [Delete All Data]           │
└─────────────────────────────┘
```

---

### **Today Screen:**

**Changes Needed:**
- **Timeline:** Vertical with time markers
- **Time Labels:** Left side, soft gray
- **Memory Cards:** Compact white cards
- **Empty Slots:** Dotted outline, very light

**Layout:**
```
8:00 ○──────────────────
     │
9:00 ○ ┌────────────┐
     │ │ Morning    │
     │ │ coffee ☕  │
     │ └────────────┘
10:00 ○──────────────────
     │
12:00 ○ ┌────────────┐
     │ │ Lunch 🍱   │
     │ └────────────┘
```

---

## **Implementation Steps**

### **1. Update Color Constants** ✅
- Created `NewDesignColors.ts`

### **2. Update Home Screen** ✅
- Created `CaptureScreen_NewDesign.tsx`

### **3. Update Moments Screen** ⏳
- Apply new colors
- Redesign memory cards
- Update filters to pills

### **4. Update Vision Screen** ⏳
- Hero section
- Input cards
- Generate button

### **5. Update Settings Screen** ⏳
- Section cards
- Toggle styles
- Danger zone

### **6. Update Today Screen** ⏳
- Timeline design
- Time markers
- Memory cards

### **7. Update Tab Bar** ⏳
- Cream background
- Soft blue active color
- Better icons

---

## **Testing Checklist**

- [ ] All screens use new color palette
- [ ] Cards have proper shadows
- [ ] Buttons are tappable and visible
- [ ] Text is readable (contrast check)
- [ ] Dark cards use white text
- [ ] Light cards use dark text
- [ ] Pills are rounded properly
- [ ] Spacing is consistent
- [ ] No harsh colors or blacks
- [ ] Smooth transitions

---

## **Benefits of New Design**

### **User Experience:**
✅ More approachable and friendly
✅ Easier to read (better contrast)
✅ Modern and professional
✅ Consistent with popular apps
✅ Less intimidating than dark theme

### **Visual Appeal:**
✅ Soft, calming colors
✅ Balanced light/dark contrast
✅ Clear visual hierarchy
✅ Professional card-based layout
✅ Generous whitespace

### **Brand Identity:**
✅ Unique color palette
✅ Memorable peach accent
✅ Consistent across all screens
✅ Scalable design system

---

**Ready to apply this design to all screens!** 🎨


