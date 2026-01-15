import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore'
import { CheckCircle2, AlertTriangle, Edit, Save, ArrowLeft, Trash2, Printer, Download } from 'lucide-react'

interface CheckData {
  id: string
  mediaType: string
  isAICreated?: boolean
  hasHumanCreativity?: boolean
  sourceType: string
  description: string
  usageType: string
  isPublicDomain: boolean
  hasCCLicense: boolean
  ccLicense: string
  isPublic: boolean
  usageContext: string
  hasLicense?: boolean
  isCommercial: boolean
  result: {
    color: string  // 'green', 'yellow', 'red'
    title: string
    message: string
    allowedUses: string[]
    restrictedUses: string[]
    forbiddenUses: string[]
    recommendations: string[]
  }
  status: string
  createdAt: string
}

export default function CopyrightCheckResult() {
  const router = useRouter()
  const [checkData, setCheckData] = useState<CheckData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadCheck = async () => {
      const checkId = router.query.id as string
      
      if (!checkId) {
        router.push('/copyright-check')
        return
      }

      if (!auth.currentUser) {
        alert('❌ Du musst angemeldet sein!')
        router.push('/copyright-check')
        return
      }

      try {
        const docRef = doc(db, 'checked_products', checkId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          
          // Prüfe ob User der Owner ist
          if (data.userId !== auth.currentUser.uid) {
            alert('❌ Keine Berechtigung!')
            router.push('/dashboard')
            return
          }

          setCheckData({
            id: docSnap.id,
            ...data
          } as CheckData)
        } else {
          alert('❌ Abklärung nicht gefunden!')
          router.push('/copyright-check')
        }
      } catch (err) {
        console.error('Error loading check:', err)
        alert('❌ Fehler beim Laden')
        router.push('/copyright-check')
      } finally {
        setLoading(false)
      }
    }

    if (router.isReady) {
      loadCheck()
    }
  }, [router.isReady, router.query])

  const handleEdit = () => {
    router.push(`/copyright-check?edit=${checkData?.id}`)
  }

  const handleSave = async () => {
    if (!auth.currentUser || !checkData) return

    setSaving(true)

    try {
      const docRef = doc(db, 'checked_products', checkData.id)
      
      // Update Status von 'draft' zu 'completed'
      await updateDoc(docRef, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      // Update User-Statistik NUR wenn noch draft war
      if (checkData.status === 'draft') {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'activity.checkedProducts': increment(1)
        })
      }

      alert('✅ Abklärung erfolgreich gespeichert!')
      router.push('/dashboard')
    } catch (err) {
      console.error('Error saving:', err)
      alert('❌ Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('🗑️ Möchtest du diese Abklärung wirklich löschen?')) return

    try {
      await deleteDoc(doc(db, 'checked_products', checkData!.id))
      alert('🗑️ Abklärung gelöscht')
      router.push('/copyright-check')
    } catch (err) {
      console.error('Error deleting:', err)
      alert('❌ Fehler beim Löschen')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    if (!checkData) return

    const date = new Date(checkData.createdAt).toLocaleDateString('de-CH')
    const html = generatePrintHTML(checkData)
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ECRC42_Abklärung_${date.replace(/\./g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    alert('💡 Tipp: Die HTML-Datei kannst du im Browser öffnen und als PDF speichern (Drucken → Als PDF speichern)!')
  }

  const generatePrintHTML = (check: CheckData): string => {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>ECRC42 Urheberrechts-Abklärung</title>
  <style>
    @page { margin: 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6; 
      color: #1a202c;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 4px solid #3b82f6;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 28px; color: #1e40af; margin-bottom: 8px; }
    .header p { color: #64748b; font-size: 14px; }
    .result-banner {
      padding: 30px;
      border-radius: 12px;
      border: 4px solid;
      margin-bottom: 30px;
      text-align: center;
      page-break-inside: avoid;
    }
    .result-banner.green { 
      background: linear-gradient(to bottom right, #dcfce7, #bbf7d0);
      border-color: #22c55e;
    }
    .result-banner.yellow {
      background: linear-gradient(to bottom right, #fef3c7, #fde68a);
      border-color: #eab308;
    }
    .result-banner.red {
      background: linear-gradient(to bottom right, #fee2e2, #fecaca);
      border-color: #ef4444;
    }
    .result-banner h2 { font-size: 32px; margin-bottom: 15px; }
    .result-banner p { font-size: 18px; }
    .short-comment {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .short-comment h3 { 
      font-size: 16px;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    .section {
      margin-bottom: 25px;
      padding: 20px;
      background: #f9fafb;
      border-left: 6px solid;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .section.blue { border-color: #3b82f6; }
    .section.green { border-color: #10b981; }
    .section.purple { border-color: #8b5cf6; }
    .section.yellow { border-color: #eab308; }
    .section.orange { border-color: #f97316; }
    .section.red { border-color: #ef4444; }
    .section h3 { 
      font-size: 18px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .field { margin-bottom: 10px; }
    .field-label { 
      display: inline-block;
      min-width: 200px;
      font-weight: 600;
      color: #64748b;
    }
    .field-value { 
      display: inline;
      color: #1a202c;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 14px;
    }
    .badge.yes { 
      background: #dcfce7;
      color: #166534;
      border: 2px solid #22c55e;
    }
    .badge.no {
      background: #fee2e2;
      color: #991b1b;
      border: 2px solid #ef4444;
    }
    .list { margin-top: 10px; padding-left: 20px; }
    .list-item { margin-bottom: 8px; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { padding: 0; }
      .result-banner, .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ECRC42</h1>
    <p>Urheberrechts-Abklärung | Hochschule Luzern</p>
    <p>Erstellt am: ${new Date(check.createdAt).toLocaleDateString('de-CH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</p>
  </div>

  <div class="result-banner ${check.result.color}">
    <h2>${check.result.title}</h2>
    <p>${check.result.message}</p>
  </div>

  <div class="short-comment">
    <h3>💡 Kurzkommentar:</h3>
    <p>${check.result.message}</p>
  </div>

  <div class="section blue">
    <h3>1️⃣ Was wird genutzt?</h3>
    <div class="field">
      <span class="field-label">Medientyp:</span>
      <span class="field-value"><strong>${check.mediaType}</strong></span>
    </div>
    ${check.description ? `
    <div class="field">
      <span class="field-label">Beschreibung:</span>
      <span class="field-value"><em>"${check.description}"</em></span>
    </div>` : ''}
  </div>

  ${check.isAICreated !== undefined ? `
  <div class="section green">
    <h3>2️⃣ KI-Erstellung</h3>
    <div class="field">
      <span class="field-label">Mit KI erstellt:</span>
      <span class="badge ${check.isAICreated ? 'no' : 'yes'}">${check.isAICreated ? 'Ja' : 'Nein'}</span>
    </div>
    ${check.isAICreated && check.hasHumanCreativity !== undefined ? `
    <div class="field">
      <span class="field-label">Menschliche Kreativität:</span>
      <span class="badge ${check.hasHumanCreativity ? 'yes' : 'no'}">${check.hasHumanCreativity ? 'Ja' : 'Nein'}</span>
    </div>` : ''}
  </div>` : ''}

  <div class="section purple">
    <h3>3️⃣ Woher stammt es?</h3>
    <div class="field">
      <span class="field-label">Quelle:</span>
      <span class="field-value"><strong>${check.sourceType}</strong></span>
    </div>
  </div>

  <div class="section yellow">
    <h3>4️⃣ Ist es gemeinfrei?</h3>
    <div class="field">
      <span class="field-label">Gemeinfrei:</span>
      <span class="badge ${check.isPublicDomain ? 'yes' : 'no'}">${check.isPublicDomain ? 'Ja' : 'Nein'}</span>
    </div>
  </div>

  ${!check.isPublicDomain ? `
  <div class="section orange">
    <h3>5️⃣ Creative Commons?</h3>
    <div class="field">
      <span class="field-label">CC-lizenziert:</span>
      <span class="badge ${check.hasCCLicense ? 'yes' : 'no'}">${check.hasCCLicense ? 'Ja' : 'Nein'}</span>
    </div>
    ${check.hasCCLicense ? `
    <div class="field">
      <span class="field-label">Lizenz:</span>
      <span class="field-value"><strong style="color: #3b82f6; font-size: 16px;">${check.ccLicense}</strong></span>
    </div>` : ''}
  </div>` : ''}

  <div class="section red">
    <h3>7️⃣ Wie wird es genutzt?</h3>
    <div class="field">
      <span class="field-label">Nutzungsart:</span>
      <span class="field-value"><strong>${check.usageType}</strong></span>
    </div>
    ${check.usageContext ? `
    <div class="field">
      <span class="field-label">Kontext:</span>
      <span class="field-value">${check.usageContext}</span>
    </div>` : ''}
    <div class="field">
      <span class="field-label">Öffentlich:</span>
      <span class="field-value">${check.isPublic ? 'Ja' : 'Nein'}</span>
    </div>
    <div class="field">
      <span class="field-label">Kommerziell:</span>
      <span class="field-value">${check.isCommercial ? 'Ja' : 'Nein'}</span>
    </div>
    ${check.hasLicense !== undefined ? `
    <div class="field">
      <span class="field-label">Lizenz vorhanden:</span>
      <span class="field-value">${check.hasLicense ? 'Ja' : 'Nein'}</span>
    </div>` : ''}
  </div>

  ${check.result.allowedUses && check.result.allowedUses.length > 0 ? `
  <div class="section green">
    <h3>✅ Erlaubte Nutzungen:</h3>
    <ul class="list">
      ${check.result.allowedUses.map(use => `<li class="list-item">${use}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${check.result.restrictedUses && check.result.restrictedUses.length > 0 ? `
  <div class="section yellow">
    <h3>⚠️ Eingeschränkte Nutzungen:</h3>
    <ul class="list">
      ${check.result.restrictedUses.map(use => `<li class="list-item">${use}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${check.result.forbiddenUses && check.result.forbiddenUses.length > 0 ? `
  <div class="section red">
    <h3>❌ Verbotene Nutzungen:</h3>
    <ul class="list">
      ${check.result.forbiddenUses.map(use => `<li class="list-item">${use}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${check.result.recommendations && check.result.recommendations.length > 0 ? `
  <div class="section blue">
    <h3>💡 Empfehlungen:</h3>
    <ul class="list">
      ${check.result.recommendations.map(rec => `<li class="list-item">${rec}</li>`).join('')}
    </ul>
  </div>` : ''}

  <div class="footer">
    <p><strong>ECRC42</strong> - Urheberrechts-Abklärung für Bildungseinrichtungen</p>
    <p>Hochschule Luzern | erstellt mit ecrc42.vercel.app</p>
  </div>
</body>
</html>
    `.trim()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Lädt...</div>
      </div>
    )
  }

  if (!checkData) {
    return null
  }

  const isAllowed = checkData.result.color === 'green'
  const isWarning = checkData.result.color === 'yellow'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-ecrc-blue" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ECRC42</h1>
                <p className="text-sm text-gray-600">Urheberrechts-Abklärung</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zum Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Status Badge */}
        {checkData.status === 'draft' && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg print:hidden">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-bold text-yellow-900">Entwurf</p>
                <p className="text-sm text-yellow-800">Diese Abklärung ist noch nicht abgeschlossen. Speichere sie um sie im Dashboard zu sehen.</p>
              </div>
            </div>
          </div>
        )}

        {/* Großer Ergebnis-Banner */}
        <div className={`p-8 rounded-2xl mb-8 shadow-xl border-4 ${
          isAllowed
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500'
            : isWarning
            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-500'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-500'
        }`}>
          <div className="text-center">
            <div className="text-6xl mb-4">
              {isAllowed ? '✅' : isWarning ? '⚠️' : '❌'}
            </div>
            <h1 className={`text-4xl font-bold mb-4 ${
              isAllowed ? 'text-green-900' : isWarning ? 'text-yellow-900' : 'text-red-900'
            }`}>
              {checkData.result.title}
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              {checkData.result.message}
            </p>
          </div>
        </div>

        {/* Kurzkommentar */}
        <div className="card mb-8 bg-blue-50 border-l-4 border-ecrc-blue">
          <h3 className="font-bold text-lg mb-2 text-ecrc-blue">💡 Kurzkommentar:</h3>
          <p className="text-gray-700">{checkData.result.message}</p>
        </div>

        {/* Detaillierte Zusammenfassung */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6 border-b-2 border-ecrc-blue pb-3">
            📋 Vollständige Zusammenfassung
          </h2>

          <div className="space-y-6">
            {/* Schritt 1: Werk */}
            <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-ecrc-blue">
              <h3 className="font-bold text-lg mb-3 text-ecrc-blue">1️⃣ Was wird genutzt?</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-gray-600 min-w-[140px] font-medium">Medientyp:</span>
                  <span className="font-bold text-lg">{checkData.mediaType}</span>
                </div>
                {checkData.description && (
                  <div className="flex items-start">
                    <span className="text-gray-600 min-w-[140px] font-medium">Beschreibung:</span>
                    <span className="italic">"{checkData.description}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Schritt 2: KI (falls vorhanden) */}
            {checkData.isAICreated !== undefined && (
              <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-ecrc-green">
                <h3 className="font-bold text-lg mb-3 text-ecrc-green">2️⃣ KI-Erstellung</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-600 min-w-[200px] font-medium">Mit KI erstellt:</span>
                    <span className={`px-4 py-1 rounded-full font-bold ${
                      checkData.isAICreated
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {checkData.isAICreated ? 'Ja' : 'Nein'}
                    </span>
                  </div>
                  {checkData.isAICreated && checkData.hasHumanCreativity !== undefined && (
                    <div className="flex items-center">
                      <span className="text-gray-600 min-w-[200px] font-medium">Menschliche Kreativität:</span>
                      <span className={`px-4 py-1 rounded-full font-bold ${
                        checkData.hasHumanCreativity
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {checkData.hasHumanCreativity ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schritt 3: Quelle */}
            <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-ecrc-purple">
              <h3 className="font-bold text-lg mb-3 text-ecrc-purple">3️⃣ Woher stammt es?</h3>
              <div className="flex items-start">
                <span className="text-gray-600 min-w-[140px] font-medium">Quelle:</span>
                <span className="font-bold">{checkData.sourceType}</span>
              </div>
            </div>

            {/* Schritt 4: Gemeinfrei */}
            <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-lg mb-3 text-yellow-700">4️⃣ Ist es gemeinfrei?</h3>
              <div className="flex items-center">
                <span className="text-gray-600 min-w-[140px] font-medium">Gemeinfrei:</span>
                <span className={`px-4 py-1 rounded-full font-bold ${
                  checkData.isPublicDomain
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {checkData.isPublicDomain ? 'Ja' : 'Nein'}
                </span>
              </div>
            </div>

            {/* Schritt 5: CC-Lizenz (falls nicht gemeinfrei) */}
            {!checkData.isPublicDomain && (
              <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-bold text-lg mb-3 text-orange-600">5️⃣ Creative Commons?</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-600 min-w-[140px] font-medium">CC-lizenziert:</span>
                    <span className={`px-4 py-1 rounded-full font-bold ${
                      checkData.hasCCLicense
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {checkData.hasCCLicense ? 'Ja' : 'Nein'}
                    </span>
                  </div>
                  {checkData.hasCCLicense && (
                    <div className="flex items-start">
                      <span className="text-gray-600 min-w-[140px] font-medium">Lizenz:</span>
                      <span className="font-bold text-ecrc-blue text-lg">{checkData.ccLicense}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schritt 7: Nutzung */}
            <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-red-500">
              <h3 className="font-bold text-lg mb-3 text-red-600">7️⃣ Wie wird es genutzt?</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-gray-600 min-w-[140px] font-medium">Nutzungsart:</span>
                  <span className="font-bold">{checkData.usageType}</span>
                </div>
                {checkData.usageContext && (
                  <div className="flex items-start">
                    <span className="text-gray-600 min-w-[140px] font-medium">Kontext:</span>
                    <span>{checkData.usageContext}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Öffentlich:</span>
                    <span className="ml-2">{checkData.isPublic ? 'Ja' : 'Nein'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Kommerziell:</span>
                    <span className="ml-2">{checkData.isCommercial ? 'Ja' : 'Nein'}</span>
                  </div>
                </div>
                {checkData.hasLicense !== undefined && (
                  <div className="flex items-center mt-2">
                    <span className="text-gray-600 min-w-[140px] font-medium">Lizenz vorhanden:</span>
                    <span>{checkData.hasLicense ? 'Ja' : 'Nein'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Erlaubte Nutzungen */}
            {checkData.result.allowedUses && checkData.result.allowedUses.length > 0 && (
              <div className="p-5 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-lg mb-3 text-green-700">✅ Erlaubte Nutzungen:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {checkData.result.allowedUses.map((use, idx) => (
                    <li key={idx} className="text-gray-700">{use}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Eingeschränkte Nutzungen */}
            {checkData.result.restrictedUses && checkData.result.restrictedUses.length > 0 && (
              <div className="p-5 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-bold text-lg mb-3 text-yellow-700">⚠️ Eingeschränkte Nutzungen:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {checkData.result.restrictedUses.map((use, idx) => (
                    <li key={idx} className="text-gray-700">{use}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verbotene Nutzungen */}
            {checkData.result.forbiddenUses && checkData.result.forbiddenUses.length > 0 && (
              <div className="p-5 bg-red-50 rounded-lg border-l-4 border-red-500">
                <h3 className="font-bold text-lg mb-3 text-red-700">❌ Verbotene Nutzungen:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {checkData.result.forbiddenUses.map((use, idx) => (
                    <li key={idx} className="text-gray-700">{use}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empfehlungen */}
            {checkData.result.recommendations && checkData.result.recommendations.length > 0 && (
              <div className="p-5 bg-blue-50 rounded-lg border-l-4 border-ecrc-blue">
                <h3 className="font-bold text-lg mb-3 text-ecrc-blue">💡 Empfehlungen:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {checkData.result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <button
              onClick={handleEdit}
              className="btn-secondary text-lg py-4"
            >
              <Edit className="w-5 h-5 inline mr-2" />
              Bearbeiten
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white text-lg py-4 rounded-lg font-bold transition-colors"
            >
              <Printer className="w-5 h-5 inline mr-2" />
              Drucken
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-4 rounded-lg font-bold transition-colors"
            >
              <Download className="w-5 h-5 inline mr-2" />
              HTML/PDF
            </button>
            {checkData.status === 'draft' ? (
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white text-lg py-4 rounded-lg font-bold transition-colors"
              >
                <Trash2 className="w-5 h-5 inline mr-2" />
                Löschen
              </button>
            ) : null}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary text-lg py-4 disabled:opacity-50 ${
                checkData.status === 'draft' ? '' : 'sm:col-span-2 lg:col-span-1'
              }`}
            >
              <Save className="w-5 h-5 inline mr-2" />
              {saving ? 'Speichert...' : checkData.status === 'draft' ? 'Speichern & Abschließen' : 'Aktualisieren'}
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            💡 Tipp: Du kannst die Abklärung drucken, als HTML/PDF herunterladen, bearbeiten oder {checkData.status === 'draft' ? 'speichern' : 'aktualisieren'}.
          </p>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
          .card {
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  )
}
