# 🚀 ECRC42 Setup-Anleitung

## Schritt-für-Schritt Anleitung für Firebase & Vercel

### 📋 Voraussetzungen

- Node.js 18+ installiert
- Google-Account für Firebase
- GitHub-Account für Vercel

---

## 1️⃣ Firebase-Projekt erstellen

### 1. Firebase Console öffnen
- Gehe zu [https://console.firebase.google.com](https://console.firebase.google.com)
- Klicke auf "Projekt hinzufügen"

### 2. Projekt konfigurieren
- Name: `ecrc42-app` (oder dein Wunschname)
- Google Analytics: Optional
- Klicke auf "Projekt erstellen"

### 3. Firestore Database aktivieren
- Im linken Menü: "Firestore Database"
- Klicke "Datenbank erstellen"
- Wähle "Im Produktionsmodus starten"
- Wähle eine Region (z.B. europe-west3)

### 4. Authentication aktivieren
- Im linken Menü: "Authentication"
- Klicke "Erste Schritte"
- Tab "Sign-in method"
- Aktiviere "Anonymous" (Anonym)

### 5. Firebase-Konfiguration kopieren
- Klicke auf das Web-Symbol (</>) "App zu meinem Web-Projekt hinzufügen"
- App-Spitzname: `ecrc42-web`
- Firebase Hosting: NICHT aktivieren
- Kopiere die Config-Daten (firebaseConfig-Objekt)

**Beispiel:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "ecrc42-app.firebaseapp.com",
  projectId: "ecrc42-app",
  storageBucket: "ecrc42-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 2️⃣ Projekt-Setup

### 1. Dateien entpacken
Entpacke die ZIP-Datei in ein Verzeichnis deiner Wahl.

### 2. Terminal öffnen
```bash
cd ecrc42-app
```

### 3. Dependencies installieren
```bash
npm install
```

### 4. Firebase-Konfiguration einfügen
Öffne `src/lib/firebase.ts` und ersetze die Platzhalter-Werte:

```typescript
const firebaseConfig = {
  apiKey: "DEINE_API_KEY",           // <-- Hier einfügen
  authDomain: "DEIN_AUTH_DOMAIN",     // <-- Hier einfügen
  projectId: "DEINE_PROJECT_ID",      // <-- Hier einfügen
  storageBucket: "DEINE_STORAGE_BUCKET", // <-- Hier einfügen
  messagingSenderId: "DEINE_SENDER_ID",  // <-- Hier einfügen
  appId: "DEINE_APP_ID"               // <-- Hier einfügen
};
```

---

## 3️⃣ Firestore Security Rules

### 1. Firebase CLI installieren
```bash
npm install -g firebase-tools
```

### 2. Bei Firebase anmelden
```bash
firebase login
```

### 3. Firebase initialisieren
```bash
firebase init
```

- Wähle: "Firestore: Configure security rules..."
- Existing project wählen
- Rules file: `firestore.rules` (Standard)
- Indexes file: Drücke Enter (Standard)

### 4. Rules deployen
```bash
firebase deploy --only firestore:rules
```

---

## 4️⃣ Lokale Entwicklung

### App starten
```bash
npm run dev
```

Die App läuft auf: [http://localhost:3000](http://localhost:3000)

### Testen
1. Öffne `http://localhost:3000`
2. Klicke auf "Neu registrieren"
3. Gib einen Lernnamen ein
4. Ein Code wird automatisch generiert - speichere ihn!
5. Teste alle Features!
6. Beim nächsten Mal: "Mit Code anmelden" und den gespeicherten Code eingeben

**Wichtig:** Codes werden automatisch bei der Registrierung erstellt. Du musst keine Codes mehr vorgenerieren!

---

## 5️⃣ Deployment auf Vercel

### 1. GitHub Repository erstellen
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DEIN-USERNAME/ecrc42-app.git
git push -u origin main
```

### 2. Vercel Account
- Gehe zu [https://vercel.com](https://vercel.com)
- Registriere dich mit GitHub

### 3. Projekt importieren
- Klicke "New Project"
- Wähle dein Repository "ecrc42-app"
- Framework Preset: Next.js (wird automatisch erkannt)

### 4. Environment Variables (NICHT NÖTIG!)
Die Firebase-Config ist bereits in `src/lib/firebase.ts` enthalten.
Du musst KEINE Environment Variables in Vercel setzen.

### 5. Deployen
- Klicke "Deploy"
- Warte auf das Deployment
- Deine App ist live! 🎉

---

## 🎯 Fertig!

Deine ECRC42-App läuft jetzt live auf Vercel!

### Nächste Schritte:

1. **Codes verteilen**: Verteile die generierten Zugangscodes an deine Nutzer
2. **Domain verbinden** (optional): Verbinde eine eigene Domain in Vercel
3. **Monitoring**: Überwache die Nutzung in der Firebase Console

---

## 🐛 Troubleshooting

### Problem: "Firebase not configured"
- Lösung: Prüfe `src/lib/firebase.ts` - sind die Credentials richtig?

### Problem: "Fehler bei der Registrierung"
- Lösung: Prüfe Firebase Console > Authentication - ist Anonymous aktiviert?
- Prüfe Firestore Security Rules - sind sie deployed?

### Problem: "Code ungültig" beim Login
- Lösung: Der Code wurde wahrscheinlich bei der Registrierung nicht gespeichert
- Erstelle einen neuen Account mit "Neu registrieren"

### Problem: "Authentication failed"
- Lösung: Prüfe Firebase Console > Authentication > Sign-in method
- Anonymous muss aktiviert sein!

### Problem: "Firestore permission denied"
- Lösung: Deploye die Security Rules erneut: `firebase deploy --only firestore:rules`

---

## 📞 Support

Bei Problemen:
1. Prüfe die Firebase Console Logs
2. Prüfe die Browser Console (F12)
3. Prüfe Vercel Deployment Logs

---

**Viel Erfolg mit ECRC42! 🎉**
