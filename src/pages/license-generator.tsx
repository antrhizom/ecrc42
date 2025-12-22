import { useState } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, collection, addDoc, updateDoc, increment } from 'firebase/firestore'
import { ArrowLeft, FileText, CheckCircle2, ChevronDown, ChevronUp, Download } from 'lucide-react'
import jsPDF from 'jspdf'

// Accordion Component
const Accordion = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm text-left">{title}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-gray-50 text-sm border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}

const MEDIA_TYPES = [
  '📷 Foto',
  '🎨 Bild/Grafik',
  '🎵 Musik/Audio', 
  '🎬 Video',
  '📝 Text/Dokument',
  '💻 Software/Code',
  '📚 Buch/E-Book',
  '🎭 Kunstwerk',
  '📊 Präsentation',
  'Anderes'
]

const CC_LICENSES = [
  {
    value: 'CC0',
    label: 'CC0 - Public Domain Dedication',
    description: 'Vollständige Freigabe - Du verzichtest auf alle Rechte',
    icon: '🄍',
    recommended: 'Für maximale Verbreitung und Nutzung'
  },
  {
    value: 'CC-BY',
    label: 'CC BY - Namensnennung',
    description: 'Andere dürfen dein Werk nutzen, verändern und kommerziell verwenden - mit Namensnennung',
    icon: '🅭🅯',
    recommended: 'Beliebteste freie Lizenz, sehr flexibel'
  },
  {
    value: 'CC-BY-SA',
    label: 'CC BY-SA - Namensnennung, Weitergabe unter gleichen Bedingungen',
    description: 'Wie CC BY, aber Bearbeitungen müssen unter der gleichen Lizenz geteilt werden',
    icon: '🅭🅯🄎',
    recommended: 'Für Open-Source-ähnliche Projekte (wie Wikipedia)'
  },
  {
    value: 'CC-BY-ND',
    label: 'CC BY-ND - Namensnennung, keine Bearbeitung',
    description: 'Nutzung erlaubt, aber keine Veränderungen',
    icon: '🅭🅯⊜',
    recommended: 'Wenn du Integrität des Originals bewahren willst'
  },
  {
    value: 'CC-BY-NC',
    label: 'CC BY-NC - Namensnennung, nicht kommerziell',
    description: 'Nur nicht-kommerzielle Nutzung erlaubt',
    icon: '🅭🅯🅫',
    recommended: 'Für persönliche/pädagogische Zwecke'
  },
  {
    value: 'CC-BY-NC-SA',
    label: 'CC BY-NC-SA - Namensnennung, nicht kommerziell, Weitergabe unter gleichen Bedingungen',
    description: 'Kombination aus NC und SA',
    icon: '🅭🅯🅫🄎',
    recommended: 'Für nicht-kommerzielle Projekte mit Copyleft'
  },
  {
    value: 'CC-BY-NC-ND',
    label: 'CC BY-NC-ND - Namensnennung, nicht kommerziell, keine Bearbeitung',
    description: 'Strengste CC-Lizenz - nur unverändert und nicht-kommerziell',
    icon: '🅭🅯🅫⊜',
    recommended: 'Maximale Kontrolle bei freier Verbreitung'
  }
]

const CREATIVE_WORK_REASONS = [
  'Ich habe es selbst geschaffen',
  'Es zeigt meine persönliche Kreativität',
  'Es ist das Ergebnis meiner intellektuellen Arbeit',
  'Es erforderte kreative Entscheidungen'
]

const INDIVIDUAL_CHARACTER_REASONS = [
  'Es unterscheidet sich von anderen Werken',
  'Es trägt meine persönliche Handschrift',
  'Es hat eine einzigartige Gestaltung',
  'Es zeigt meinen individuellen Stil'
]

const EXPRESSION_FORMS = [
  'Digitales Werk (online verfügbar)',
  'Gedrucktes Werk',
  'Audio-/Videoaufnahme',
  'Physisches Objekt'
]

export default function LicenseGenerator() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  
  // Step 1: Work Description
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [customMediaType, setCustomMediaType] = useState('')
  const [description, setDescription] = useState('')
  const [workLink, setWorkLink] = useState('')
  const [authorName, setAuthorName] = useState('')
  
  // Step 2: Copyright Justification
  const [creativeWorkReasons, setCreativeWorkReasons] = useState<string[]>([])
  const [creativeWorkCustom, setCreativeWorkCustom] = useState('')
  const [individualCharacterReasons, setIndividualCharacterReasons] = useState<string[]>([])
  const [individualCharacterCustom, setIndividualCharacterCustom] = useState('')
  const [expressionForms, setExpressionForms] = useState<string[]>([])
  const [expressionCustom, setExpressionCustom] = useState('')
  
  // Step 3: License Selection
  const [selectedLicense, setSelectedLicense] = useState('')
  
  // Step 4: Generated
  const [generating, setGenerating] = useState(false)

  const toggleCheckbox = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(item => item !== value))
    } else {
      setArray([...array, value])
    }
  }

  const generatePDF = () => {
    setGenerating(true)

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Title
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Creative Commons Lizenz-Zertifikat', pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      // Date
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-CH')}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      // Horizontal line
      doc.setLineWidth(0.5)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 10

      // Section 1: Work Details
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('1. Werk-Details', 20, yPos)
      yPos += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Titel: ${title}`, 20, yPos)
      yPos += 6
      doc.text(`Art des Werks: ${mediaType === 'Anderes' ? customMediaType : mediaType}`, 20, yPos)
      yPos += 6
      doc.text(`Urheber: ${authorName}`, 20, yPos)
      yPos += 6

      if (description) {
        const descLines = doc.splitTextToSize(`Beschreibung: ${description}`, pageWidth - 40)
        doc.text(descLines, 20, yPos)
        yPos += descLines.length * 6
      }

      if (workLink) {
        doc.setTextColor(0, 0, 255)
        doc.textWithLink(`Link: ${workLink}`, 20, yPos, { url: workLink })
        doc.setTextColor(0, 0, 0)
        yPos += 6
      }

      yPos += 5

      // Section 2: Copyright Justification
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('2. Nachweis des Urheberrechtsschutzes', 20, yPos)
      yPos += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('A) Geistige Schöpfung:', 20, yPos)
      yPos += 6

      doc.setFont('helvetica', 'normal')
      creativeWorkReasons.forEach(reason => {
        doc.text(`• ${reason}`, 25, yPos)
        yPos += 5
      })
      if (creativeWorkCustom) {
        const customLines = doc.splitTextToSize(`• ${creativeWorkCustom}`, pageWidth - 50)
        doc.text(customLines, 25, yPos)
        yPos += customLines.length * 5
      }
      yPos += 3

      doc.setFont('helvetica', 'bold')
      doc.text('B) Individueller Charakter:', 20, yPos)
      yPos += 6

      doc.setFont('helvetica', 'normal')
      individualCharacterReasons.forEach(reason => {
        doc.text(`• ${reason}`, 25, yPos)
        yPos += 5
      })
      if (individualCharacterCustom) {
        const customLines = doc.splitTextToSize(`• ${individualCharacterCustom}`, pageWidth - 50)
        doc.text(customLines, 25, yPos)
        yPos += customLines.length * 5
      }
      yPos += 3

      doc.setFont('helvetica', 'bold')
      doc.text('C) Form des Ausdrucks:', 20, yPos)
      yPos += 6

      doc.setFont('helvetica', 'normal')
      expressionForms.forEach(form => {
        doc.text(`• ${form}`, 25, yPos)
        yPos += 5
      })
      if (expressionCustom) {
        const customLines = doc.splitTextToSize(`• ${expressionCustom}`, pageWidth - 50)
        doc.text(customLines, 25, yPos)
        yPos += customLines.length * 5
      }
      yPos += 8

      // Check if new page needed
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Section 3: License
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('3. Gewählte Creative Commons Lizenz', 20, yPos)
      yPos += 8

      const license = CC_LICENSES.find(l => l.value === selectedLicense)
      if (license) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(license.label, 20, yPos)
        yPos += 7

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        const descLines = doc.splitTextToSize(license.description, pageWidth - 40)
        doc.text(descLines, 20, yPos)
        yPos += descLines.length * 6 + 5

        doc.setTextColor(0, 0, 255)
        const licenseUrl = `https://creativecommons.org/licenses/${selectedLicense.toLowerCase().replace('cc-', '')}/4.0/`
        doc.textWithLink(`Lizenz-Details: ${licenseUrl}`, 20, yPos, { url: licenseUrl })
        doc.setTextColor(0, 0, 0)
        yPos += 8
      }

      // Horizontal line
      doc.setLineWidth(0.5)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 10

      // Declaration
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      const declaration = `Hiermit erkläre ich, ${authorName}, dass ich Urheber des oben genannten Werks bin und es unter der gewählten Creative Commons Lizenz zur Verfügung stelle.`
      const declLines = doc.splitTextToSize(declaration, pageWidth - 40)
      doc.text(declLines, 20, yPos)
      yPos += declLines.length * 5 + 15

      // Signature line
      doc.setFont('helvetica', 'normal')
      doc.line(20, yPos, 100, yPos)
      doc.text('Unterschrift', 20, yPos + 5)
      
      doc.line(120, yPos, 190, yPos)
      doc.text('Ort, Datum', 120, yPos + 5)

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text('Erstellt mit ECRC42 - EduCopyrightCheck', pageWidth / 2, 285, { align: 'center' })

      // Save
      doc.save(`CC-Lizenz_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`)

      // Save to Firestore
      saveLicenseToFirestore()
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Fehler beim Erstellen des PDFs')
    } finally {
      setGenerating(false)
    }
  }

  const saveLicenseToFirestore = async () => {
    if (!auth.currentUser) return

    try {
      await addDoc(collection(db, 'generated_licenses'), {
        userId: auth.currentUser.uid,
        title,
        mediaType: mediaType === 'Anderes' ? customMediaType : mediaType,
        authorName,
        description,
        workLink,
        creativeWorkReasons,
        creativeWorkCustom,
        individualCharacterReasons,
        individualCharacterCustom,
        expressionForms,
        expressionCustom,
        selectedLicense,
        createdAt: new Date().toISOString()
      })

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'activity.generatedLicenses': increment(1)
      })
    } catch (err) {
      console.error('Error saving license:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Dashboard
          </button>
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-ecrc-purple mr-3" />
            <div>
              <h1 className="text-3xl font-bold">CC-Lizenz-Generator</h1>
              <p className="text-gray-600 mt-2">
                Erstelle eine Creative Commons Lizenz für dein eigenes Werk
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Fortschritt</span>
            <span className="text-sm text-gray-600">Schritt {step} von 4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-ecrc-purple h-2 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Work Description */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Schritt 1: Beschreibe dein Werk</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Titel des Werks *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="z.B. 'Sonnenuntergang über Zürich'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Dein Name (Urheber) *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="input-field"
                  placeholder="z.B. 'Maria Schmidt'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Art des Werks *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {MEDIA_TYPES.map(type => (
                    <label key={type} className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        value={type}
                        checked={mediaType === type}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="w-4 h-4 text-ecrc-purple"
                      />
                      <span className="ml-3 text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {mediaType === 'Anderes' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bitte angeben:
                  </label>
                  <input
                    type="text"
                    value={customMediaType}
                    onChange={(e) => setCustomMediaType(e.target.value)}
                    className="input-field"
                    placeholder="z.B. 'Skulptur', 'Installation'..."
                  />
                </div>
              )}

              {(mediaType === '📷 Foto' || mediaType === '🎨 Bild/Grafik') && (
                <div>
                  <Accordion title="📷 Wichtig: Unterschied Foto vs. Bild/Grafik">
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                        <strong className="text-blue-900">📷 Foto:</strong>
                        <p className="text-sm text-blue-800 mt-1">
                          Fotos sind in der Schweiz <strong>grundsätzlich IMMER geschützt!</strong> (Art. 29 Abs. 2 lit. c URG)
                        </p>
                        <ul className="list-disc pl-5 text-sm text-blue-800 mt-2">
                          <li>Schutzfrist: <strong>50 Jahre</strong> ab Herstellung</li>
                          <li>KEIN individueller Charakter erforderlich</li>
                          <li>Auch einfache Schnappschüsse sind geschützt</li>
                          <li>Du kannst eine CC-Lizenz vergeben, da du automatisch Urheber bist</li>
                        </ul>
                        <div className="mt-3 pt-3 border-t border-blue-300">
                          <p className="text-sm text-blue-900 font-medium">⏰ Nach 50 Jahren:</p>
                          <p className="text-sm text-blue-800 mt-1">
                            Dein Foto wird nach 50 Jahren <strong>gemeinfrei</strong> - auch wenn es individuellen Charakter 
                            oder geistige Schöpfung aufweist. Eine CC-Lizenz kann dies nicht verhindern.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                        <strong className="text-purple-900">🎨 Bild/Grafik:</strong>
                        <p className="text-sm text-purple-800 mt-1">
                          Gezeichnete Bilder und Grafiken sind nur geschützt, wenn sie individuellen Charakter haben.
                        </p>
                        <ul className="list-disc pl-5 text-sm text-purple-800 mt-2">
                          <li>Schutzfrist: <strong>70 Jahre</strong> nach deinem Tod</li>
                          <li>Individueller Charakter ERFORDERLICH (Art. 2 URG)</li>
                          <li>Einfache Strichzeichnungen oft NICHT geschützt</li>
                          <li>Prüfe in Schritt 2, ob dein Werk die Kriterien erfüllt</li>
                        </ul>
                      </div>
                    </div>
                  </Accordion>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Beschreibung des Werks *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Beschreibe dein Werk kurz. Was zeigt es? Wie wurde es erstellt?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Link zum Werk (optional)
                </label>
                <input
                  type="url"
                  value={workLink}
                  onChange={(e) => setWorkLink(e.target.value)}
                  className="input-field"
                  placeholder="https://..."
                />
                <p className="text-sm text-gray-600 mt-1">
                  z.B. zu deinem Portfolio, Instagram, GitHub, etc.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!title || !authorName || !mediaType || (mediaType === 'Anderes' && !customMediaType) || !description}
              className="btn-primary mt-8 w-full disabled:opacity-50"
            >
              Weiter zu Schritt 2
            </button>
          </div>
        )}

        {/* Step 2: Copyright Justification */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Schritt 2: Nachweis des Urheberrechtsschutzes</h2>
            
            <p className="text-gray-600 mb-6">
              Um eine CC-Lizenz zu vergeben, muss dein Werk urheberrechtlich geschützt sein (Art. 2 URG). 
              Begründe, warum dein Werk die Kriterien erfüllt:
            </p>

            {/* A) Geistige Schöpfung */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-ecrc-blue">A) Es ist eine geistige Schöpfung</h3>
              
              <div className="space-y-3 mb-4">
                {CREATIVE_WORK_REASONS.map(reason => (
                  <label key={reason} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={creativeWorkReasons.includes(reason)}
                      onChange={() => toggleCheckbox(creativeWorkReasons, setCreativeWorkReasons, reason)}
                      className="w-5 h-5 text-ecrc-purple mt-0.5"
                    />
                    <span className="ml-3 text-sm">{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  📝 Zusätzliche Begründung (optional):
                </label>
                <textarea
                  value={creativeWorkCustom}
                  onChange={(e) => setCreativeWorkCustom(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="z.B. 'Ich habe 20 Stunden recherchiert und eine eigene Bildsprache entwickelt...'"
                />
              </div>

              <Accordion title="ℹ️ Was ist eine 'geistige Schöpfung'?">
                <p className="mb-2">Nach Art. 2 URG muss ein Werk eine <strong>geistige Schöpfung</strong> sein:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Es erfordert <strong>kreative, intellektuelle Leistung</strong></li>
                  <li>Es ist <strong>nicht rein mechanisch</strong> oder zufällig entstanden</li>
                  <li>Du hast <strong>kreative Entscheidungen</strong> getroffen</li>
                </ul>
                <p className="mt-2 text-gray-700"><strong>Beispiele:</strong> Ein selbst komponierter Song, ein geschriebener Text, ein gestaltetes Foto</p>
                <p className="mt-1 text-gray-700"><strong>Keine geistige Schöpfung:</strong> Reine Datensammlungen, automatisch generierte Inhalte ohne kreative Eingabe</p>
              </Accordion>
            </div>

            {/* B) Individueller Charakter */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-ecrc-blue">B) Es hat individuellen Charakter</h3>
              
              <div className="space-y-3 mb-4">
                {INDIVIDUAL_CHARACTER_REASONS.map(reason => (
                  <label key={reason} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={individualCharacterReasons.includes(reason)}
                      onChange={() => toggleCheckbox(individualCharacterReasons, setIndividualCharacterReasons, reason)}
                      className="w-5 h-5 text-ecrc-purple mt-0.5"
                    />
                    <span className="ml-3 text-sm">{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  📝 Zusätzliche Begründung (optional):
                </label>
                <textarea
                  value={individualCharacterCustom}
                  onChange={(e) => setIndividualCharacterCustom(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="z.B. 'Mein Werk kombiniert Elemente aus verschiedenen Stilen auf eine neue Weise...'"
                />
              </div>

              <Accordion title="ℹ️ Was bedeutet 'individueller Charakter'?">
                <p className="mb-2">Nach Art. 2 Abs. 1 URG muss ein Werk <strong>individuellen Charakter</strong> haben:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Es muss sich <strong>von anderen Werken unterscheiden</strong></li>
                  <li>Es muss <strong>Spielraum für Gestaltung</strong> aufweisen</li>
                  <li>Es trägt deine <strong>persönliche Handschrift</strong></li>
                </ul>
                <p className="mt-2 text-gray-700"><strong>Beispiele:</strong> Dein einzigartiger Schreibstil, deine Bildkomposition, deine Melodie</p>
                <p className="mt-1 text-gray-700"><strong>Kein individueller Charakter:</strong> Standardformulare, technische Zeichnungen nach Norm</p>
              </Accordion>
            </div>

            {/* C) Form des Ausdrucks */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-ecrc-blue">C) Es hat eine konkrete Form des Ausdrucks</h3>
              
              <div className="space-y-3 mb-4">
                {EXPRESSION_FORMS.map(form => (
                  <label key={form} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expressionForms.includes(form)}
                      onChange={() => toggleCheckbox(expressionForms, setExpressionForms, form)}
                      className="w-5 h-5 text-ecrc-purple mt-0.5"
                    />
                    <span className="ml-3 text-sm">{form}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  📝 Weitere Details (optional):
                </label>
                <textarea
                  value={expressionCustom}
                  onChange={(e) => setExpressionCustom(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="z.B. 'Als PDF-Dokument, als MP3-Datei, als physisches Gemälde...'"
                />
              </div>

              <Accordion title="ℹ️ Warum ist die 'Form' wichtig?">
                <p className="mb-2">Nur die <strong>konkrete Ausdrucksform</strong> ist geschützt, nicht die blosse Idee:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Die <strong>Idee</strong> zu einem Roman ist NICHT geschützt</li>
                  <li>Der <strong>fertige Roman</strong> (Text) ist geschützt</li>
                  <li>Das Werk muss in <strong>wahrnehmbarer Form</strong> existieren</li>
                </ul>
                <p className="mt-2 text-gray-700"><strong>Beispiele:</strong> Geschriebener Text, aufgenommene Musik, gemaltes Bild, programmierter Code</p>
              </Accordion>
            </div>

            <div className="flex space-x-4 mt-8">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                Zurück
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  (creativeWorkReasons.length === 0 && !creativeWorkCustom) ||
                  (individualCharacterReasons.length === 0 && !individualCharacterCustom) ||
                  (expressionForms.length === 0 && !expressionCustom)
                }
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Weiter zu Schritt 3
              </button>
            </div>
          </div>
        )}

        {/* Step 3: License Selection */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Schritt 3: Wähle deine Creative Commons Lizenz</h2>
            
            <p className="text-gray-600 mb-6">
              Wähle die Lizenz, unter der du dein Werk zur Verfügung stellen möchtest:
            </p>

            <div className="space-y-4">
              {CC_LICENSES.map(license => (
                <div key={license.value}>
                  <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="license"
                      value={license.value}
                      checked={selectedLicense === license.value}
                      onChange={(e) => setSelectedLicense(e.target.value)}
                      className="w-5 h-5 text-ecrc-purple mt-1"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-2xl mr-2">{license.icon}</span>
                        <span className="font-bold">{license.label}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{license.description}</p>
                      <p className="text-xs text-ecrc-purple italic">💡 {license.recommended}</p>
                    </div>
                  </label>
                  
                  {license.value === selectedLicense && (
                    <Accordion title="📖 Details zu dieser Lizenz" defaultOpen={true}>
                      {license.value === 'CC0' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Kopieren, verbreiten, bearbeiten</li>
                            <li>✅ Kommerzielle Nutzung</li>
                            <li>✅ KEINE Namensnennung erforderlich</li>
                          </ul>
                          <p className="text-sm text-gray-700">Du verzichtest auf alle Rechte. Maximal freie Lizenz.</p>
                        </>
                      )}
                      {license.value === 'CC-BY' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Kopieren, verbreiten, bearbeiten</li>
                            <li>✅ Kommerzielle Nutzung</li>
                            <li>⚠️ Namensnennung erforderlich</li>
                          </ul>
                          <p className="text-sm text-gray-700">Beliebteste freie Lizenz. Andere müssen nur deinen Namen nennen.</p>
                        </>
                      )}
                      {license.value === 'CC-BY-SA' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Kopieren, verbreiten, bearbeiten</li>
                            <li>✅ Kommerzielle Nutzung</li>
                            <li>⚠️ Namensnennung erforderlich</li>
                            <li>⚠️ Bearbeitungen unter gleicher Lizenz</li>
                          </ul>
                          <p className="text-sm text-gray-700">"Copyleft"-Effekt wie bei Open Source. Wikipedia nutzt diese Lizenz.</p>
                        </>
                      )}
                      {license.value === 'CC-BY-ND' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Kopieren und unverändert teilen</li>
                            <li>✅ Kommerzielle Nutzung</li>
                            <li>⚠️ Namensnennung erforderlich</li>
                            <li>❌ KEINE Bearbeitung</li>
                          </ul>
                          <p className="text-sm text-gray-700">Bewahrt Integrität des Originals. Gut für wissenschaftliche Arbeiten.</p>
                        </>
                      )}
                      {license.value === 'CC-BY-NC' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Kopieren, verbreiten, bearbeiten</li>
                            <li>⚠️ Namensnennung erforderlich</li>
                            <li>❌ KEINE kommerzielle Nutzung</li>
                          </ul>
                          <p className="text-sm text-gray-700">Für persönliche, pädagogische oder wissenschaftliche Zwecke.</p>
                        </>
                      )}
                      {license.value === 'CC-BY-NC-SA' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Kopieren, verbreiten, bearbeiten</li>
                            <li>⚠️ Namensnennung erforderlich</li>
                            <li>⚠️ Bearbeitungen unter gleicher Lizenz</li>
                            <li>❌ KEINE kommerzielle Nutzung</li>
                          </ul>
                          <p className="text-sm text-gray-700">Kombination aus NC und SA. Für nicht-kommerzielle kollaborative Projekte.</p>
                        </>
                      )}
                      {license.value === 'CC-BY-NC-ND' && (
                        <>
                          <p className="mb-2"><strong>Was ist erlaubt:</strong></p>
                          <ul className="list-disc pl-5 space-y-1 mb-3">
                            <li>✅ Unverändert teilen</li>
                            <li>⚠️ Namensnennung erforderlich</li>
                            <li>❌ KEINE Bearbeitung</li>
                            <li>❌ KEINE kommerzielle Nutzung</li>
                          </ul>
                          <p className="text-sm text-gray-700">Strengste CC-Lizenz. Maximale Kontrolle bei freier Verbreitung.</p>
                        </>
                      )}
                    </Accordion>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Accordion title="❓ Welche Lizenz soll ich wählen?">
                <div className="space-y-3 text-sm">
                <p><strong>Wenn du möchtest, dass dein Werk maximal genutzt wird:</strong><br/>
                → CC0 oder CC-BY</p>
                
                <p><strong>Wenn du Attribution (Namensnennung) möchtest:</strong><br/>
                → CC-BY, CC-BY-SA, CC-BY-ND</p>
                
                <p><strong>Wenn du kommerzielle Nutzung ausschließen willst:</strong><br/>
                → CC-BY-NC, CC-BY-NC-SA, CC-BY-NC-ND</p>
                
                <p><strong>Wenn du nicht willst, dass andere es verändern:</strong><br/>
                → CC-BY-ND, CC-BY-NC-ND</p>
                
                <p><strong>Wenn du einen "Copyleft"-Effekt möchtest (wie Open Source):</strong><br/>
                → CC-BY-SA, CC-BY-NC-SA</p>
              </div>
              </Accordion>
            </div>

            <div className="flex space-x-4 mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">
                Zurück
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedLicense}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Weiter zu Schritt 4
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generate PDF */}
        {step === 4 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Schritt 4: PDF-Zertifikat generieren</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <CheckCircle2 className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Alle Angaben vollständig! ✓</h3>
                  <p className="text-sm text-green-800">
                    Du kannst jetzt dein CC-Lizenz-Zertifikat als PDF generieren.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold mb-4">Zusammenfassung:</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Werk:</span> {title}
                </div>
                <div>
                  <span className="font-medium">Urheber:</span> {authorName}
                </div>
                <div>
                  <span className="font-medium">Art:</span> {mediaType === 'Anderes' ? customMediaType : mediaType}
                </div>
                <div>
                  <span className="font-medium">Lizenz:</span> {CC_LICENSES.find(l => l.value === selectedLicense)?.label}
                </div>
                {workLink && (
                  <div>
                    <span className="font-medium">Link:</span>{' '}
                    <a href={workLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {workLink}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-ecrc-blue p-4 mb-6">
              <p className="text-sm">
                <strong>💡 Tipp:</strong> Das PDF-Zertifikat kannst du ausdrucken, unterschreiben und zu deinem Werk hinzufügen 
                (z.B. auf deiner Website, in deinem Portfolio, oder als Beilage zu physischen Werken).
              </p>
            </div>

            <button
              onClick={generatePDF}
              disabled={generating}
              className="btn-primary w-full mb-4 disabled:opacity-50 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              {generating ? 'Erstellt PDF...' : 'PDF-Zertifikat generieren'}
            </button>

            <div className="flex space-x-4">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">
                Zurück
              </button>
              <button
                onClick={() => {
                  alert('✅ Zertifikat generiert und gespeichert!')
                  router.push('/dashboard')
                }}
                className="btn-secondary flex-1"
              >
                Zurück zum Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
