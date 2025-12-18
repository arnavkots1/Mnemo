# 🧠 Memory Analyzer - Intelligent Memory Generation

## ✅ **What Was Added:**

### **1. Smart Memory Analyzer Service**
Location: `expo-mnemo/services/memoryAnalyzer.ts`

**What it does:**
- Combines location, photos, audio, and time into rich memories
- Works with limited data (even just one input!)
- Uses Gemini AI for intelligent analysis
- Generates natural summaries and descriptions

---

## 🎯 **Key Features:**

### **1. Multi-Source Analysis**
Combines any combination of:
- 📸 **Photos** - Analyzed with Gemini Vision
- 🎙️ **Audio** - Emotion detection from voice
- 📍 **Location** - Place names and coordinates
- ⏰ **Time** - Morning, afternoon, evening, night
- 📝 **User notes** - Your own captions
- 🏷️ **Tags** - Custom categories

### **2. Works with Limited Data**
```typescript
// Just a photo? No problem!
generateMemory({ photoUri: 'photo.jpg', timestamp: new Date() })
// Output: "Morning photo at home"

// Just location? Got it!
generateMemory({ location: { placeName: 'Central Park' }, timestamp: new Date() })
// Output: "Afternoon moment at Central Park"

// Everything combined? Even better!
generateMemory({
  photoUri: 'photo.jpg',
  audioUri: 'audio.m4a',
  location: { placeName: 'Beach' },
  audioEmotion: { emotion: 'happy', confidence: 0.9 },
  timestamp: new Date()
})
// Output: "Happy - Sunny day at the beach"
```

### **3. Intelligent Prioritization**
1. **User notes** - Always highest priority (you know best!)
2. **Photo analysis** - Gemini Vision provides context
3. **Audio emotion** - Adds feeling to the moment
4. **Location** - Where it happened
5. **Time** - When it happened

---

## 🚀 **How to Use:**

### **Basic Usage:**

```typescript
import { generateMemory, createRichMemory } from './services/memoryAnalyzer';

// 1. Simple generation
const result = await generateMemory({
  photoUri: 'file://path/to/photo.jpg',
  location: {
    latitude: 40.7580,
    longitude: -73.9855,
    placeName: 'Central Park'
  },
  timestamp: new Date()
});

console.log(result.summary);      // "Afternoon at Central Park"
console.log(result.description);  // "A memorable moment captured..."
console.log(result.tags);         // ['photo', 'location', 'afternoon']
console.log(result.confidence);   // 0.85

// 2. Create full memory entry
const memory = await createRichMemory('photo', {
  photoUri: 'file://path/to/photo.jpg',
  location: { placeName: 'Coffee Shop' },
  timestamp: new Date(),
  userNote: 'Meeting with friends'
});

// memory is now a complete MemoryEntry ready to save
await addMemory(memory);
```

### **With All Data:**

```typescript
const richMemory = await createRichMemory('photo', {
  // Photo
  photoUri: 'file://photo.jpg',
  photoExif: {
    dateTime: '2024:01:15 14:30:00',
    make: 'Apple',
    model: 'iPhone 15',
    gps: { latitude: 40.7580, longitude: -73.9855 }
  },
  
  // Audio
  audioUri: 'file://audio.m4a',
  audioEmotion: {
    emotion: 'happy',
    confidence: 0.92
  },
  
  // Location
  location: {
    latitude: 40.7580,
    longitude: -73.9855,
    placeName: 'Central Park, New York'
  },
  
  // Time
  timestamp: new Date('2024-01-15T14:30:00'),
  
  // User input
  userNote: 'Beautiful day in the park!',
  tags: ['weekend', 'outdoors']
});
```

### **Batch Processing:**

```typescript
import { batchAnalyzeMemories } from './services/memoryAnalyzer';

// Process multiple photos at once
const photos = [
  { kind: 'photo', data: { photoUri: 'photo1.jpg', timestamp: new Date() } },
  { kind: 'photo', data: { photoUri: 'photo2.jpg', timestamp: new Date() } },
  { kind: 'photo', data: { photoUri: 'photo3.jpg', timestamp: new Date() } },
];

const memories = await batchAnalyzeMemories(photos);
// Processes in batches of 3 to avoid overwhelming API
```

---

## 🎨 **UI Updates:**

### **1. Reduced Scroll Speed**
```typescript
<ScrollView 
  decelerationRate="fast"  // Slower, more controlled scrolling
  scrollEventThrottle={16} // Smooth 60fps scrolling
>
```

### **2. Changed Icon**
Tab bar now shows 🏠 **Home** instead of ✨ Sparkles

---

## 🤖 **Using Gemini AI:**

The memory analyzer automatically uses Gemini when available:

```typescript
// In imageAnalysisService.ts
const imageAnalysis = await analyzeImage({
  imageUri: data.photoUri,
  location: data.location,
  timeOfDay: 'afternoon',
  dayOfWeek: 'Saturday'
});

// Gemini returns:
{
  summary: "Central Park picnic",
  description: "A sunny Saturday afternoon picnic...",
  tags: ["outdoor", "food", "friends"],
  confidence: 0.89
}
```

**Falls back gracefully if Gemini unavailable!**

---

## 📊 **Data Sources Tracking:**

The analyzer tracks what data was used:

```typescript
{
  summary: "Happy morning at coffee shop",
  description: "A joyful start to the day...",
  tags: ["coffee", "morning", "happy"],
  confidence: 0.92,
  dataSources: [
    'photo',        // Photo was analyzed
    'audio',        // Voice emotion detected
    'location',     // Location provided
    'time',         // Timestamp used
    'user-note'     // User added note
  ]
}
```

This helps you understand how each memory was created!

---

## 🎯 **Integration Examples:**

### **Photo Import:**

```typescript
// In photoService.ts
import { createRichMemory } from './memoryAnalyzer';

async function importPhoto(asset: ImagePickerAsset) {
  const exif = await getExifData(asset);
  
  const memory = await createRichMemory('photo', {
    photoUri: asset.uri,
    photoExif: exif,
    timestamp: new Date(exif.dateTime || Date.now()),
    location: exif.gps ? {
      latitude: exif.gps.latitude,
      longitude: exif.gps.longitude,
    } : undefined,
  });
  
  await addMemory(memory);
}
```

### **Voice Recording:**

```typescript
// In EmotionalSessionScreen.tsx
import { createRichMemory } from './memoryAnalyzer';

async function saveVoiceNote(audioUri: string, emotion: string, confidence: number) {
  const memory = await createRichMemory('emotional', {
    audioUri,
    audioEmotion: { emotion, confidence },
    timestamp: new Date(),
    location: await getCurrentLocation(), // Optional
  });
  
  await addMemory(memory);
}
```

### **Location Tracking:**

```typescript
// In LocationService.ts
import { createRichMemory } from './memoryAnalyzer';

async function logLocationChange(lat: number, lon: number, placeName: string) {
  const memory = await createRichMemory('context', {
    location: { latitude: lat, longitude: lon, placeName },
    timestamp: new Date(),
  });
  
  await addMemory(memory);
}
```

---

## 🔮 **Future Enhancements:**

### **Add Your Own Model:**
See `TRAIN_YOUR_OWN_MODEL.md` for:
- Training on your personal data
- Creating custom patterns
- Running 100% offline
- Personalized understanding

### **Pattern Learning:**
```typescript
// Future: Learn from your usage
const patterns = await learnUserPatterns(memories);
// "User often visits coffee shops in the morning"
// "User takes photos of food at restaurants"
// "User's mood improves outdoors"
```

### **Smart Suggestions:**
```typescript
// Future: Suggest missing data
const suggestions = await suggestEnhancements(memory);
// "Add a note about who you were with"
// "Tag this as a special occasion?"
// "This looks like a birthday party"
```

---

## 📝 **Summary:**

**What you have now:**
✅ **Smart memory analyzer** - Combines multiple data sources
✅ **Works with limited data** - Even one input is enough
✅ **Uses Gemini AI** - When available, with graceful fallback
✅ **Natural summaries** - Human-sounding descriptions
✅ **Batch processing** - Handle multiple memories efficiently
✅ **Source tracking** - Know what data was used
✅ **Better scroll speed** - Smoother UX
✅ **Home icon** - Cleaner design

**To use it:**
```typescript
import { createRichMemory } from './services/memoryAnalyzer';

const memory = await createRichMemory('photo', {
  photoUri: 'your-photo.jpg',
  timestamp: new Date(),
  // Add any other available data
});

await addMemory(memory);
```

**Everything is ready to use!** 🚀

