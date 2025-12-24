import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { CheckCircle2, FileCheck, BookOpen, Award, LogOut, TrendingUp, Download, Eye } from 'lucide-react'

interface UserData {
  lernname: string
  activity: {
    checkedProducts: number
    taggedCases: number
    likedCases: number
    generatedLicenses: number
    generatedCertificates: number
  }
}

interface CheckedProduct {
  id: string
  userId: string
  mediaType: string
  isAICreated?: boolean
  hasHumanCreativity?: boolean
  sourceType: string
  description: string
  usageType: string
  isPublicDomain: boolean
  hasCCLicense: boolean
  ccLicense: string
  isProtected: boolean
  isPublic: boolean
  usageContext: string
  hasLicense: boolean
  isCommercial: boolean
  result: {
    allowed: boolean
    reason: string
    warning: string
  }
  createdAt: string
}

export default function Dashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<CheckedProduct[]>([])
  const [selectedCheck, setSelectedCheck] = useState<CheckedProduct | null>(null)

  useEffect(() => {
    loadUserData()
    loadChecks()
  }, [])

  const loadUserData = async () => {
    if (!auth.currentUser) {
      router.push('/')
      return
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadChecks = async () => {
    if (!auth.currentUser) return

    try {
      const q = query(
        collection(db, 'checked_products'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const checksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckedProduct[]
      setChecks(checksData)
    } catch (err) {
      console.error('Error loading checks:', err)
    }
  }

  const downloadCheck = (check: CheckedProduct) => {
    const data = {
      Medientyp: check.mediaType,
      Quelle: check.sourceType,
      Beschreibung: check.description,
      Nutzungsart: check.usageType,
      Gemeinfrei: check.isPublicDomain ? 'Ja' : 'Nein',
      'CC-Lizenz': check.hasCCLicense ? check.ccLicense : 'Keine',
      Ergebnis: check.result.allowed ? 'Erlaubt' : 'Nicht erlaubt',
      Begründung: check.result.reason,
      Warnung: check.result.warning || '-',
      Datum: new Date(check.createdAt).toLocaleString('de-CH')
    }

    const text = Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Urheberrechts-Abklärung_${new Date(check.createdAt).toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCheckPDF = (check: CheckedProduct) => {
    const date = new Date(check.createdAt).toLocaleString('de-CH', {
      dateStyle: 'full',
      timeStyle: 'short'
    })

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Urheberrechts-Abklärung</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      margin-bottom: 15px;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .section {
      background: #f9fafb;
      padding: 15px;
      margin: 15px 0;
      border-radius: 8px;
      border-left: 4px solid #6b7280;
    }
    .step {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .result {
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
      border: 3px solid;
    }
    .result.allowed {
      background: #f0fdf4;
      border-color: #22c55e;
      color: #15803d;
    }
    .result.denied {
      background: #fef2f2;
      border-color: #ef4444;
      color: #991b1b;
    }
    .warning {
      background: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 15px;
      margin-top: 15px;
    }
    .label {
      font-weight: bold;
      color: #4b5563;
      display: inline-block;
      min-width: 150px;
    }
    .value {
      color: #111827;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: bold;
    }
    .badge.yes { background: #dcfce7; color: #15803d; }
    .badge.no { background: #fee2e2; color: #991b1b; }
    @media print {
      body { margin: 0; padding: 20px; }
      .step { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>🎓 Urheberrechts-Abklärung ECRC42</h1>
  <div class="meta">Erstellt am: ${date}</div>

  <div class="step">
    <h2>📋 Schritt 1: Was wird genutzt?</h2>
    <div class="section">
      <div><span class="label">Medientyp:</span> <span class="value">${check.mediaType}</span></div>
      ${check.description ? `<div style="margin-top:10px;font-style:italic;">"${check.description}"</div>` : ''}
    </div>
  </div>

  ${check.isAICreated !== undefined ? `
  <div class="step">
    <h2>🤖 Schritt 2: KI-Erstellung</h2>
    <div class="section">
      <div><span class="label">Mit KI erstellt:</span> <span class="badge ${check.isAICreated ? 'no' : 'yes'}">${check.isAICreated ? 'Ja' : 'Nein'}</span></div>
      ${check.isAICreated && check.hasHumanCreativity !== undefined ? `
        <div style="margin-top:10px;"><span class="label">Menschliche Kreativität:</span> <span class="badge ${check.hasHumanCreativity ? 'yes' : 'no'}">${check.hasHumanCreativity ? 'Ja' : 'Nein'}</span></div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="step">
    <h2>📍 Schritt 3: Woher stammt es?</h2>
    <div class="section">
      <div><span class="label">Quelle:</span> <span class="value">${check.sourceType}</span></div>
    </div>
  </div>

  <div class="step">
    <h2>⚖️ Schritt 4: Gemeinfrei?</h2>
    <div class="section">
      <div><span class="label">Gemeinfrei:</span> <span class="badge ${check.isPublicDomain ? 'yes' : 'no'}">${check.isPublicDomain ? 'Ja' : 'Nein'}</span></div>
    </div>
  </div>

  ${!check.isPublicDomain ? `
  <div class="step">
    <h2>🅭 Schritt 5: Creative Commons?</h2>
    <div class="section">
      <div><span class="label">CC-lizenziert:</span> <span class="badge ${check.hasCCLicense ? 'yes' : 'no'}">${check.hasCCLicense ? 'Ja' : 'Nein'}</span></div>
      ${check.hasCCLicense ? `<div style="margin-top:10px;"><span class="label">Lizenz:</span> <span class="value" style="color:#2563eb;font-weight:bold;">${check.ccLicense}</span></div>` : ''}
    </div>
  </div>
  ` : ''}

  <div class="step">
    <h2>🎯 Schritt 7: Wie wird es genutzt?</h2>
    <div class="section">
      <div><span class="label">Nutzungsart:</span> <span class="value">${check.usageType}</span></div>
      ${check.usageContext ? `<div style="margin-top:10px;"><span class="label">Kontext:</span> <span class="value">${check.usageContext}</span></div>` : ''}
      <div style="margin-top:10px;"><span class="label">Öffentlich:</span> <span class="value">${check.isPublic ? 'Ja' : 'Nein'}</span></div>
      <div style="margin-top:10px;"><span class="label">Kommerziell:</span> <span class="value">${check.isCommercial ? 'Ja' : 'Nein'}</span></div>
      ${check.hasLicense !== undefined ? `<div style="margin-top:10px;"><span class="label">Lizenz vorhanden:</span> <span class="value">${check.hasLicense ? 'Ja' : 'Nein'}</span></div>` : ''}
    </div>
  </div>

  <div class="result ${check.result.allowed ? 'allowed' : 'denied'}">
    <h2 style="margin-top:0;color:inherit;">${check.result.allowed ? '✅' : '❌'} Ergebnis</h2>
    <div style="font-size:20px;font-weight:bold;margin:15px 0;">
      ${check.result.allowed ? 'Nutzung erlaubt' : 'Nutzung nicht erlaubt'}
    </div>
    <div style="font-size:16px;">${check.result.reason}</div>
    ${check.result.warning ? `
    <div class="warning">
      <strong>⚠️ Warnung:</strong><br>
      ${check.result.warning}
    </div>
    ` : ''}
  </div>

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
    <p>Dieses Dokument wurde automatisch erstellt mit ECRC42 - Urheberrechts-Check Tool</p>
    <p>Hochschule Luzern - Educational Copyright Resource Center</p>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-ecrc-blue" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ECRC42</h1>
                <p className="text-sm text-gray-600">EduCopyrightCheck</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Willkommen,</p>
                <p className="font-semibold">{userData?.lernname}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Abmelden"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ECRC Statistiken */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-ecrc-blue" />
            ECRC Nutzer*innen-Statistik
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-ecrc-blue to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Urheberrechts-Abklärungen</p>
                  <p className="text-3xl font-bold">{userData?.activity.checkedProducts || 0}</p>
                </div>
                <FileCheck className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">CC-Abklärungen</p>
                  <p className="text-3xl font-bold">{userData?.activity.generatedLicenses || 0}</p>
                </div>
                <FileCheck className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-ecrc-green to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Fallbeispiele aufgeführt</p>
                  <p className="text-3xl font-bold">{userData?.activity.taggedCases || 0}</p>
                </div>
                <BookOpen className="w-12 h-12 opacity-30" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Aktivitätsberichte erstellt</p>
                  <p className="text-3xl font-bold">{userData?.activity.generatedCertificates || 0}</p>
                </div>
                <Award className="w-12 h-12 opacity-30" />
              </div>
            </div>
          </div>
        </div>

        {/* Gesamtübersicht */}
        <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-ecrc-blue">
          <h3 className="font-bold mb-4 text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Deine Gesamtübersicht
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-ecrc-blue">
                {(userData?.activity.checkedProducts || 0) + (userData?.activity.generatedLicenses || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Abklärungen total</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-ecrc-green">
                {userData?.activity.taggedCases || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Fallbeispiele</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">
                {userData?.activity.generatedCertificates || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Zertifikate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">
                {userData?.activity.likedCases || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Reaktionen gegeben</p>
            </div>
          </div>
        </div>

        {/* Abklärungen Liste */}
        {checks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <FileCheck className="w-6 h-6 mr-2" />
              Deine Abklärungen ({checks.length})
            </h3>
            <div className="space-y-4">
              {checks.map(check => (
                <div key={check.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{check.mediaType.split(' ')[0]}</span>
                        <div>
                          <h4 className="font-bold text-lg">{check.mediaType}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(check.createdAt).toLocaleString('de-CH', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {check.description && (
                        <p className="text-gray-700 mb-3">{check.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Quelle:</span>
                          <p className="font-medium">{check.sourceType}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Nutzung:</span>
                          <p className="font-medium">{check.usageType}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Gemeinfrei:</span>
                          <p className="font-medium">{check.isPublicDomain ? 'Ja' : 'Nein'}</p>
                        </div>
                      </div>

                      {/* Ergebnis */}
                      <div className={`p-3 rounded-lg ${
                        check.result.allowed 
                          ? 'bg-green-50 border-l-4 border-green-500'
                          : 'bg-red-50 border-l-4 border-red-500'
                      }`}>
                        <p className={`font-bold ${
                          check.result.allowed ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {check.result.allowed ? '✅ Nutzung erlaubt' : '❌ Nutzung nicht erlaubt'}
                        </p>
                        <p className="text-sm mt-1">{check.result.reason}</p>
                        {check.result.warning && (
                          <p className="text-sm mt-2 text-orange-700">⚠️ {check.result.warning}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => setSelectedCheck(check)}
                        className="p-2 text-ecrc-blue hover:bg-blue-50 rounded-lg transition-colors"
                        title="Details anzeigen"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => downloadCheck(check)}
                        className="p-2 text-ecrc-green hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push('/copyright-check')}
            className="card hover:shadow-lg transition-shadow text-left group"
          >
            <FileCheck className="w-16 h-16 text-ecrc-blue mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Urheberrechts-Check</h2>
            <p className="text-gray-600 mb-4">
              Prüfe deine Medienprodukte mit dem erweiterten URG-Check. Mit Branching-Logik, Ampelsystem und detaillierten Auswertungen.
            </p>
            <div className="inline-flex items-center text-ecrc-blue font-semibold">
              Zur Checkliste →
            </div>
          </button>

          <button
            onClick={() => router.push('/case-examples')}
            className="card hover:shadow-lg transition-shadow text-left group"
          >
            <BookOpen className="w-16 h-16 text-ecrc-green mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Fallbeispiele</h2>
            <p className="text-gray-600 mb-4">
              Entdecke kollaborativ gesammelte Fallbeispiele, bewerte sie mit Emojis und Tags, und trage eigene Beispiele bei.
            </p>
            <div className="inline-flex items-center text-ecrc-green font-semibold">
              Zu den Beispielen →
            </div>
          </button>

          <button
            onClick={() => router.push('/certificates')}
            className="card hover:shadow-lg transition-shadow text-left group"
          >
            <Award className="w-16 h-16 text-ecrc-purple mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Zertifikate</h2>
            <p className="text-gray-600 mb-4">
              Erstelle deine drei Aktivitätsdokumente: Aktivitätszertifikat, Protokoll-Check und Creative Commons Ausdruck.
            </p>
            <div className="inline-flex items-center text-ecrc-purple font-semibold">
              Zu den Zertifikaten →
            </div>
          </button>

          <button
            onClick={() => router.push('/license-generator')}
            className="card hover:shadow-lg transition-shadow text-left group"
          >
            <FileCheck className="w-16 h-16 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">CC-Lizenz-Generator</h2>
            <p className="text-gray-600 mb-4">
              Erstelle eine Creative Commons Lizenz für dein eigenes Werk. Mit Nachweis des Urheberrechtsschutzes und PDF-Zertifikat.
            </p>
            <div className="inline-flex items-center text-orange-500 font-semibold">
              Lizenz erstellen →
            </div>
          </button>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Vollständige Urheberrechts-Abklärung</h2>
                  <p className="text-gray-600">
                    {new Date(selectedCheck.createdAt).toLocaleString('de-CH', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCheck(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Schritt 1: Medientyp */}
                <div className="border-l-4 border-ecrc-blue pl-4">
                  <h3 className="font-bold text-lg mb-2">📋 Schritt 1: Was wird genutzt?</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-xl">{selectedCheck.mediaType}</p>
                    {selectedCheck.description && (
                      <p className="text-gray-700 mt-2 italic">"{selectedCheck.description}"</p>
                    )}
                  </div>
                </div>

                {/* Schritt 2: KI-Erstellung (falls vorhanden) */}
                {selectedCheck.isAICreated !== undefined && (
                  <div className="border-l-4 border-ecrc-green pl-4">
                    <h3 className="font-bold text-lg mb-2">🤖 Schritt 2: KI-Erstellung</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Mit KI erstellt:</span>
                        <span className={`font-bold px-3 py-1 rounded-full ${
                          selectedCheck.isAICreated 
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {selectedCheck.isAICreated ? 'Ja' : 'Nein'}
                        </span>
                      </div>
                      {selectedCheck.isAICreated && selectedCheck.hasHumanCreativity !== undefined && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-gray-600">Menschliche Kreativität:</span>
                          <span className={`font-bold px-3 py-1 rounded-full ${
                            selectedCheck.hasHumanCreativity
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedCheck.hasHumanCreativity ? 'Ja' : 'Nein'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schritt 3: Quelle */}
                <div className="border-l-4 border-ecrc-purple pl-4">
                  <h3 className="font-bold text-lg mb-2">📍 Schritt 3: Woher stammt es?</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedCheck.sourceType}</p>
                  </div>
                </div>

                {/* Schritt 4: Gemeinfrei */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-bold text-lg mb-2">⚖️ Schritt 4: Gemeinfrei?</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Das Werk ist gemeinfrei:</span>
                      <span className={`font-bold text-lg px-4 py-2 rounded-lg ${
                        selectedCheck.isPublicDomain
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedCheck.isPublicDomain ? '✅ Ja' : '❌ Nein'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schritt 5: CC-Lizenz (falls nicht gemeinfrei) */}
                {!selectedCheck.isPublicDomain && (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-bold text-lg mb-2">🅭 Schritt 5: Creative Commons?</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">CC-lizenziert:</span>
                        <span className={`font-bold px-3 py-1 rounded-full ${
                          selectedCheck.hasCCLicense
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {selectedCheck.hasCCLicense ? 'Ja' : 'Nein'}
                        </span>
                      </div>
                      {selectedCheck.hasCCLicense && (
                        <div className="pt-2 border-t">
                          <span className="text-gray-600 text-sm">Lizenz:</span>
                          <p className="font-bold text-ecrc-blue">{selectedCheck.ccLicense}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schritt 6: Nutzungsart */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-bold text-lg mb-2">🎯 Schritt 7: Wie wird es genutzt?</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="text-gray-600 text-sm">Nutzungsart:</span>
                      <p className="font-medium text-lg">{selectedCheck.usageType}</p>
                    </div>
                    {selectedCheck.usageContext && (
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 text-sm">Kontext:</span>
                        <p className="font-medium">{selectedCheck.usageContext}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <span className="text-gray-600 text-sm">Öffentlich:</span>
                        <p className="font-medium">{selectedCheck.isPublic ? 'Ja' : 'Nein'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Kommerziell:</span>
                        <p className="font-medium">{selectedCheck.isCommercial ? 'Ja' : 'Nein'}</p>
                      </div>
                    </div>
                    {selectedCheck.hasLicense !== undefined && (
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 text-sm">Lizenz vorhanden:</span>
                        <p className="font-medium">{selectedCheck.hasLicense ? 'Ja' : 'Nein'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ergebnis */}
                <div className={`p-6 rounded-xl border-4 ${
                  selectedCheck.result.allowed 
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <h3 className="font-bold text-xl mb-3 flex items-center">
                    {selectedCheck.result.allowed ? '✅' : '❌'} Ergebnis
                  </h3>
                  <div className={`font-bold text-xl mb-3 ${
                    selectedCheck.result.allowed ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {selectedCheck.result.allowed ? 'Nutzung erlaubt' : 'Nutzung nicht erlaubt'}
                  </div>
                  <p className="text-lg mb-3">{selectedCheck.result.reason}</p>
                  {selectedCheck.result.warning && (
                    <div className="mt-4 pt-4 border-t border-orange-300 bg-orange-50 p-3 rounded">
                      <p className="text-orange-700 font-medium flex items-start">
                        <span className="text-xl mr-2">⚠️</span>
                        <span>{selectedCheck.result.warning}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => downloadCheck(selectedCheck)}
                  className="btn-secondary flex-1"
                >
                  <Download className="w-5 h-5 inline mr-2" />
                  TXT Download
                </button>
                <button
                  onClick={() => downloadCheckPDF(selectedCheck)}
                  className="btn-primary flex-1"
                >
                  <Download className="w-5 h-5 inline mr-2" />
                  PDF Download
                </button>
                <button
                  onClick={() => setSelectedCheck(null)}
                  className="btn-secondary flex-1"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
