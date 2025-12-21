# ECRC42 - EduCopyrightCheck 🎓

Eine interaktive Webanwendung zum Lernen und Überprüfen von Urheberrechten und Creative Commons Lizenzen.

## ✨ Was macht ECRC42 besonders?

- **🎯 Einfacher Einstieg**: Keine Vorkonfiguration nötig - registrieren und loslegen!
- **🔑 Automatische Codes**: Jeder Nutzer erhält bei der Registrierung einen persönlichen Zugangscode
- **📚 Interaktives Lernen**: Urheberrecht durch praktische Checks verstehen
- **🤝 Kollaborativ**: Gemeinsam Fallbeispiele sammeln und bewerten
- **📜 Zertifikate**: Alle Aktivitäten werden dokumentiert und sind als PDF verfügbar

---

## 🚀 Quick Start

### 1. Projekt klonen
```bash
git clone <your-repo-url>
cd ecrc42-app
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Firebase einrichten

#### 3.1 Firebase-Projekt erstellen
1. Gehe zu [firebase.google.com](https://firebase.google.com)
2. Erstelle ein neues Projekt
3. Aktiviere **Firestore Database**
4. Aktiviere **Authentication** → Anonymous Sign-in

#### 3.2 Firebase-Konfiguration
1. Firebase Console → Projekteinstellungen → Web App hinzufügen
2. Kopiere die Config-Werte
3. Öffne `src/lib/firebase.ts` und füge die Werte ein

#### 3.3 Firestore Rules deployen
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules
```

### 4. App starten
```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

---

## 📖 So funktioniert's

### Erstregistrierung

1. **"Neu registrieren"** wählen
2. Lernnamen eingeben
3. **Zugangscode wird automatisch generiert**
4. ⚠️ **Code speichern** (Screenshot oder notieren)
5. Zum Dashboard weitergehen

### Wiederanmeldung

1. **"Mit Code anmelden"** wählen
2. Gespeicherten Code eingeben
3. Anmelden & weitermachen!

---

## 🎯 Features

### 1. Urheberrechts-Check ✅
Medientyp auswählen, 6-Punkte Checkliste durchgehen, Creative Commons Lizenz wählen

### 2. Fallbeispiele sammeln 📚
Beispiele hinzufügen, mit Emojis (👍❤️🎯💡⭐🔥) reagieren, Tags (#nützlich, #relevant) hinzufügen

### 3. Aktivitäts-Tracking 📊
Dashboard mit Statistiken über alle Aktivitäten

### 4. Drei PDF-Zertifikate 🎓
Aktivitätszertifikat, Urheberrechts-Protokoll, Creative Commons Ausdruck

---

## 🛠️ Technologie

- Next.js 14 (React) + TypeScript
- Tailwind CSS
- Firebase (Firestore + Authentication)
- jsPDF für PDF-Generierung
- Vercel-ready

---

## 🚢 Deployment auf Vercel

1. Push zu GitHub
2. Vercel.com → New Project → Repository auswählen
3. Deploy!

Keine Environment Variables nötig - Firebase-Config ist in `src/lib/firebase.ts`

---

## 📚 Weitere Dokumentation

- **SETUP_GUIDE.md**: Ausführliche Schritt-für-Schritt Anleitung
- **QUICKSTART.md**: Schnelleinstieg

---

**ECRC42 - EduCopyrightCheck**  
*Urheberrecht verstehen & anwenden* 🎓
