import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore'
import { CheckCircle2, AlertTriangle, Edit, Save, ArrowLeft, Trash2 } from 'lucide-react'

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
    allowed: boolean
    reason: string
    warning: string
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
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
          checkData.result.allowed
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-500'
        }`}>
          <div className="text-center">
            <div className="text-6xl mb-4">
              {checkData.result.allowed ? '✅' : '❌'}
            </div>
            <h1 className={`text-4xl font-bold mb-4 ${
              checkData.result.allowed ? 'text-green-900' : 'text-red-900'
            }`}>
              {checkData.result.allowed ? 'Nutzung erlaubt' : 'Nutzung nicht erlaubt'}
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              {checkData.result.reason}
            </p>
            {checkData.result.warning && (
              <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg inline-block">
                <div className="flex items-start text-left">
                  <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-orange-900 mb-1">⚠️ Wichtiger Hinweis:</p>
                    <p className="text-orange-800">{checkData.result.warning}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handleEdit}
              className="btn-secondary text-lg py-4"
            >
              <Edit className="w-5 h-5 inline mr-2" />
              Bearbeiten
            </button>
            {checkData.status === 'draft' && (
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white text-lg py-4 rounded-lg font-bold transition-colors"
              >
                <Trash2 className="w-5 h-5 inline mr-2" />
                Löschen
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary text-lg py-4 disabled:opacity-50 ${
                checkData.status === 'draft' ? '' : 'sm:col-span-2'
              }`}
            >
              <Save className="w-5 h-5 inline mr-2" />
              {saving ? 'Speichert...' : checkData.status === 'draft' ? 'Speichern & Abschließen' : 'Aktualisieren'}
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center mt-4">
            💡 Tipp: Du kannst die Abklärung noch bearbeiten oder {checkData.status === 'draft' ? 'speichern und im Dashboard einsehen' : 'aktualisieren'}.
          </p>
        </div>
      </main>
    </div>
  )
}
