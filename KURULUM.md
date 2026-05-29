# Ünye Amatör Voleybolcular - Kurulum Kılavuzu

## Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Proje oluştur" butonuna tıklayın, isim verin (örn: `unyevoleybol`)
3. Google Analytics'i etkinleştirin (isteğe bağlı)

### Firebase Servislerini Aktif Edin

**Authentication:**
- Sol menüden Build → Authentication → Get started
- "Email/Password" sağlayıcısını etkinleştirin
- "Users" sekmesinden admin kullanıcısı oluşturun

**Firestore Database:**
- Build → Firestore Database → Create database
- "Start in test mode" seçin (sonra kuralları güncelleyin)

**Storage:**
- Build → Storage → Get started
- Test modunda başlayın

### Güvenlik Kuralları (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Herkese okuma izni (published olanlar)
    match /{collection}/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Kuralları

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## .env Dosyasını Güncelleme

`.env` dosyasını Firebase Console'dan aldığınız gerçek değerlerle güncelleyin:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=projeniz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projeniz
VITE_FIREBASE_STORAGE_BUCKET=projeniz.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Yerel Geliştirme

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Firebase'e Deploy

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## Admin Paneli

- URL: `/admin/giris`
- Firebase Authentication ile korunan
- Özellikler: Haberler, Slider, Galeri, Etkinlikler, Anketler

## Firestore Koleksiyonları

| Koleksiyon | Alan |
|---|---|
| `news` | title, summary, content, category, imageUrl, published, createdAt |
| `sliders` | title, subtitle, imageUrl, published, order, createdAt |
| `gallery` | title, url, published, createdAt |
| `events` | title, description, type, date, time, location, capacity, imageUrl, published |
| `polls` | question, options[], votes{}, published, createdAt |
