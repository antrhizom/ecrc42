import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { CheckCircle2, FileCheck, BookOpen, Award, LogOut, TrendingUp } from 'lucide-react'

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

export default function Dashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
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
    </div>
  )
}
