import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { ArrowLeft, Download, FileText, Award, CheckCircle } from 'lucide-react'
import jsPDF from 'jspdf'

interface UserData {
  lernname: string
  code: string
  createdAt: string
  activity: {
    checkedProducts: number
    taggedCases: number
    likedCases: number
  }
}

interface CheckedProduct {
  mediaType: string
  description: string
  passed: boolean
  ccLicense?: string
  createdAt: string
}

export default function Certificates() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [checkedProducts, setCheckedProducts] = useState<CheckedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!auth.currentUser) {
      router.push('/')
      return
    }

    try {
      // Load user data
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData)
      }

      // Load checked products
      const q = query(
        collection(db, 'checked_products'),
        where('userId', '==', auth.currentUser.uid)
      )
      const snapshot = await getDocs(q)
      const products = snapshot.docs.map(doc => doc.data() as CheckedProduct)
      setCheckedProducts(products)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateActivityCertificate = () => {
    if (!userData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.text('ECRC42', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('EduCopyrightCheck', pageWidth / 2, 30, { align: 'center' })
    
    // Title
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(24)
    doc.text('Aktivitätszertifikat', pageWidth / 2, 60, { align: 'center' })
    
    // Content
    doc.setFontSize(12)
    doc.text(`Hiermit wird bestätigt, dass`, pageWidth / 2, 85, { align: 'center' })
    
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(userData.lernname, pageWidth / 2, 100, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`erfolgreich am interaktiven Urheberrechts-Training teilgenommen hat.`, pageWidth / 2, 115, { align: 'center' })
    
    // Activity Stats
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Aktivitäten:', 30, 145)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`• Geprüfte Medienprodukte: ${userData.activity.checkedProducts}`, 40, 160)
    doc.text(`• Getaggte Fallbeispiele: ${userData.activity.taggedCases}`, 40, 170)
    doc.text(`• Bewertete Fallbeispiele: ${userData.activity.likedCases}`, 40, 180)
    
    const totalActivity = userData.activity.checkedProducts + userData.activity.taggedCases + userData.activity.likedCases
    doc.setFont('helvetica', 'bold')
    doc.text(`Gesamtaktivität: ${totalActivity} Interaktionen`, 40, 195)
    
    // Date
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const date = new Date().toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    doc.text(`Ausgestellt am ${date}`, pageWidth / 2, 240, { align: 'center' })
    
    // Footer
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 270, pageWidth, 27, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('ECRC42 - EduCopyrightCheck | Urheberrecht verstehen & anwenden', pageWidth / 2, 283, { align: 'center' })
    
    doc.save(`ECRC42_Aktivitaetszertifikat_${userData.lernname}.pdf`)
  }

  const generateProtocolCheck = () => {
    if (!userData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.text('ECRC42', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Urheberrechts-Protokoll', pageWidth / 2, 30, { align: 'center' })
    
    // Title
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(20)
    doc.text('Protokoll der Urheberrechtsprüfungen', pageWidth / 2, 60, { align: 'center' })
    
    // User Info
    doc.setFontSize(12)
    doc.text(`Lernname: ${userData.lernname}`, 30, 80)
    doc.text(`Anzahl geprüfter Produkte: ${userData.activity.checkedProducts}`, 30, 90)
    
    // Products
    const passedProducts = checkedProducts.filter(p => p.passed)
    const failedProducts = checkedProducts.filter(p => !p.passed)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Bestandene Prüfungen: ${passedProducts.length}`, 30, 110)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let yPos = 120
    
    passedProducts.slice(0, 5).forEach((product, index) => {
      if (yPos > 250) return
      doc.text(`${index + 1}. ${product.mediaType}`, 40, yPos)
      yPos += 7
      doc.setFontSize(9)
      doc.text(`   ${product.description.substring(0, 80)}...`, 40, yPos)
      yPos += 7
      if (product.ccLicense) {
        doc.text(`   Lizenz: ${product.ccLicense}`, 40, yPos)
        yPos += 10
      }
      doc.setFontSize(10)
    })
    
    if (failedProducts.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Zu überarbeitende Produkte: ${failedProducts.length}`, 30, yPos + 10)
    }
    
    // Footer
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 270, pageWidth, 27, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    const date = new Date().toLocaleDateString('de-DE')
    doc.text(`Ausgestellt am ${date}`, pageWidth / 2, 283, { align: 'center' })
    
    doc.save(`ECRC42_Protokoll_${userData.lernname}.pdf`)
  }

  const generateCCCertificate = () => {
    if (!userData) return

    const passedProducts = checkedProducts.filter(p => p.passed && p.ccLicense)
    
    if (passedProducts.length === 0) {
      alert('Du hast noch keine Produkte mit Creative Commons Lizenz erstellt.')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    passedProducts.forEach((product, index) => {
      if (index > 0) {
        doc.addPage()
      }
      
      // Header
      doc.setFillColor(139, 92, 246)
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.text('Creative Commons', pageWidth / 2, 20, { align: 'center' })
      doc.setFontSize(14)
      doc.text('Lizenzdokument', pageWidth / 2, 30, { align: 'center' })
      
      // Title
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(18)
      doc.text('Lizenzinformation', pageWidth / 2, 60, { align: 'center' })
      
      // Product Info
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Medienprodukt:', 30, 85)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Art: ${product.mediaType}`, 40, 100)
      
      doc.text('Beschreibung:', 40, 115)
      const splitDescription = doc.splitTextToSize(product.description, pageWidth - 80)
      doc.text(splitDescription, 40, 125)
      
      // License Info
      const licenseY = 125 + (splitDescription.length * 7) + 15
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Gewählte Lizenz:', 30, licenseY)
      
      doc.setFillColor(243, 244, 246)
      doc.rect(30, licenseY + 5, pageWidth - 60, 40, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(139, 92, 246)
      doc.text(product.ccLicense || '', pageWidth / 2, licenseY + 20, { align: 'center' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Dieses Werk ist lizenziert unter der oben genannten', pageWidth / 2, licenseY + 32, { align: 'center' })
      doc.text('Creative Commons Lizenz.', pageWidth / 2, licenseY + 40, { align: 'center' })
      
      // Urheber
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Urheber:', 30, licenseY + 60)
      doc.setFont('helvetica', 'normal')
      doc.text(userData.lernname, 40, licenseY + 72)
      
      // Date
      const date = new Date(product.createdAt).toLocaleDateString('de-DE')
      doc.text(`Erstellt am: ${date}`, 40, licenseY + 84)
      
      // Footer
      doc.setFillColor(139, 92, 246)
      doc.rect(0, 270, pageWidth, 27, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text('ECRC42 - EduCopyrightCheck', pageWidth / 2, 283, { align: 'center' })
    })
    
    doc.save(`ECRC42_CC-Lizenz_${userData.lernname}.pdf`)
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
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Dashboard
          </button>
          <h1 className="text-3xl font-bold">Zertifikate & Dokumente</h1>
          <p className="text-gray-600 mt-2">
            Erstelle und lade deine Aktivitätsdokumente herunter
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 1. Activity Certificate */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-ecrc-blue bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-8 h-8 text-ecrc-blue" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">1. Aktivitätszertifikat</h2>
                  <p className="text-gray-600 mb-4">
                    Dokumentiert deine gesamte Teilnahme am interaktiven Training mit allen Aktivitäten.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ Geprüfte Produkte: {userData?.activity.checkedProducts}</p>
                    <p>✓ Getaggte Beispiele: {userData?.activity.taggedCases}</p>
                    <p>✓ Bewertete Beispiele: {userData?.activity.likedCases}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={generateActivityCertificate}
                className="btn-primary flex items-center flex-shrink-0"
              >
                <Download className="w-5 h-5 mr-2" />
                PDF
              </button>
            </div>
          </div>

          {/* 2. Protocol Check */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-ecrc-green bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-ecrc-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">2. Urheberrechts-Protokoll</h2>
                  <p className="text-gray-600 mb-4">
                    Zeigt alle durchgeführten Urheberrechtsprüfungen und deren Ergebnisse.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ Anzahl geprüfter Produkte: {checkedProducts.length}</p>
                    <p>✓ Bestandene Prüfungen: {checkedProducts.filter(p => p.passed).length}</p>
                    <p>✓ Zu überarbeiten: {checkedProducts.filter(p => !p.passed).length}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={generateProtocolCheck}
                disabled={checkedProducts.length === 0}
                className="btn-primary flex items-center flex-shrink-0 disabled:opacity-50"
              >
                <Download className="w-5 h-5 mr-2" />
                PDF
              </button>
            </div>
            {checkedProducts.length === 0 && (
              <p className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg">
                Prüfe zuerst ein Medienprodukt, um dieses Dokument zu erstellen.
              </p>
            )}
          </div>

          {/* 3. CC License Certificate */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-ecrc-purple bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-ecrc-purple" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">3. Creative Commons Ausdruck</h2>
                  <p className="text-gray-600 mb-4">
                    Lizenzdokumente für alle deine Produkte mit Creative Commons Lizenz.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✓ Produkte mit CC-Lizenz: {checkedProducts.filter(p => p.passed && p.ccLicense).length}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={generateCCCertificate}
                disabled={checkedProducts.filter(p => p.passed && p.ccLicense).length === 0}
                className="btn-primary flex items-center flex-shrink-0 disabled:opacity-50"
              >
                <Download className="w-5 h-5 mr-2" />
                PDF
              </button>
            </div>
            {checkedProducts.filter(p => p.passed && p.ccLicense).length === 0 && (
              <p className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg">
                Prüfe ein Medienprodukt erfolgreich und wähle eine CC-Lizenz, um dieses Dokument zu erstellen.
              </p>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="card bg-blue-50 border-blue-200 mt-8">
          <h3 className="font-bold mb-2 text-blue-900">💡 Hinweis</h3>
          <p className="text-sm text-blue-800">
            Alle drei Dokumente können jederzeit heruntergeladen, gedruckt oder per E-Mail verschickt werden. 
            Die PDFs enthalten alle relevanten Informationen zu deinen Aktivitäten und Prüfungen.
          </p>
        </div>
      </main>
    </div>
  )
}
