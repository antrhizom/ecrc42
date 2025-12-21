# 🚀 Quick Start - ECRC42

## In 5 Minuten starten

### 1. Dependencies installieren
```bash
npm install
```

### 2. Firebase konfigurieren
Öffne `src/lib/firebase.ts` und füge deine Firebase-Credentials ein.

Hole sie dir von: [Firebase Console](https://console.firebase.google.com) → Projekt → Einstellungen → Web App

### 3. Firebase Setup
```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Anmelden
firebase login

# Projekt initialisieren
firebase init

# Security Rules deployen
firebase deploy --only firestore:rules
```

### 4. App starten
```bash
npm run dev
```

→ Öffne [http://localhost:3000](http://localhost:3000)

**Registrierung:**
- Klicke "Neu registrieren"
- Gib deinen Lernnamen ein
- Ein Code wird automatisch generiert
- **Speichere den Code** für die nächste Anmeldung!

### 5. Auf Vercel deployen (optional)
```bash
# In GitHub pushen
git init
git add .
git commit -m "Initial commit"
git push

# Dann auf vercel.com das Repo importieren
```

## ✅ Das war's!

Lies die ausführliche Anleitung in `SETUP_GUIDE.md` für mehr Details.

---

**Wichtige Dateien:**
- `src/lib/firebase.ts` - Firebase-Config hier einfügen!
- `SETUP_GUIDE.md` - Ausführliche Anleitung
- `README.md` - Projekt-Dokumentation
- `firestore.rules` - Security Rules

**Support:**
- Firebase Console: [console.firebase.google.com](https://console.firebase.google.com)
- Vercel Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
