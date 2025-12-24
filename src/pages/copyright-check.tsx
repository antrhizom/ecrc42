import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { doc, collection, addDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore'
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Info, RotateCcw } from 'lucide-react'

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

// Info Box Component
const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-blue-50 border-l-4 border-ecrc-blue px-4 py-3 text-sm mt-2">
    <div className="flex items-start">
      <Info className="w-5 h-5 text-ecrc-blue mr-2 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  </div>
)

const MEDIA_TYPES = [
  '📷 Foto',
  '🎨 Bild/Grafik',
  '🎵 Musik/Audio', 
  '🎬 Video',
  '📝 Text',
  '💻 Software/Code',
  '🎨 Grafik/Design',
  '📦 Sonstiges'
]

const SOURCE_TYPES = [
  '🌐 Internet (Website, Social Media)',
  '📚 Buch/Zeitschrift/Zeitung',
  '🎓 Wissenschaftliche Quelle',
  '👤 Von einer Person direkt erhalten',
  '💰 Gekauft (Stock-Foto, etc.)',
  '🎁 Creative Commons / Open Source',
  '📦 Sonstiges'
]

const USAGE_TYPES = [
  '🎓 Präsentation (Unterricht)',
  '📖 Schriftliche Arbeit (Schule/Uni)',
  '📰 Schul-Newsletter / Elternbrief',
  '🌐 Schulwebsite / Intranet',
  '📋 Jahresbericht / Broschüre',
  '📚 Mediothek (Ausstellung, Katalog)',
  '🍽️ Mensa (Speisekarte, Poster)',
  '🔧 Hausdienst (Beschilderung, Infotafel)',
  '📱 Social Media (Schul-Account)',
  '🎬 Video-Projekt (YouTube, Schul-TV)',
  '💼 Kommerzielle Nutzung',
  '📚 Buch / E-Book',
  '🎨 Eigenes Kunstwerk',
  '📦 Sonstiges'
]

const CC_LICENSES = [
  { value: 'CC0', label: 'CC0 - Public Domain' },
  { value: 'CC-BY', label: 'CC BY - Namensnennung' },
  { value: 'CC-BY-SA', label: 'CC BY-SA - Weitergabe unter gleichen Bedingungen' },
  { value: 'CC-BY-ND', label: 'CC BY-ND - Keine Bearbeitung' },
  { value: 'CC-BY-NC', label: 'CC BY-NC - Nicht kommerziell' },
  { value: 'CC-BY-NC-SA', label: 'CC BY-NC-SA' },
  { value: 'CC-BY-NC-ND', label: 'CC BY-NC-ND' }
]

export default function CopyrightCheck() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  
  // Phase 1 Data
  const [mediaType, setMediaType] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [description, setDescription] = useState('')
  const [isAICreated, setIsAICreated] = useState<boolean | null>(null)
  const [hasHumanCreativity, setHasHumanCreativity] = useState<boolean | null>(null)
  
  // Phase 2 Data
  const [isPublicDomain, setIsPublicDomain] = useState<boolean | null>(null)
  const [hasCCLicense, setHasCCLicense] = useState<boolean | null>(null)
  const [ccLicense, setCCLicense] = useState('')
  const [isProtected, setIsProtected] = useState<boolean | null>(null)
  
  // Phase 3 Data
  const [usageType, setUsageType] = useState('')
  const [isPublic, setIsPublic] = useState<boolean | null>(null)
  const [usageContext, setUsageContext] = useState<string | null>(null)
  const [hasLicense, setHasLicense] = useState<boolean | null>(null)
  const [isCommercial, setIsCommercial] = useState<boolean | null>(null)
  
  // Phase 4 Data
  const [hasSource, setHasSource] = useState<boolean | null>(null)
  const [contactedAuthor, setContactedAuthor] = useState<boolean | null>(null)
  
  // Result
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [previousChecks, setPreviousChecks] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadPreviousChecks()
  }, [])

  const loadPreviousChecks = async () => {
    if (!auth.currentUser) return
    
    try {
      const q = query(
        collection(db, 'checked_products'),
        where('userId', '==', auth.currentUser.uid)
      )
      const snapshot = await getDocs(q)
      const checks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPreviousChecks(checks)
    } catch (err) {
      console.error('Error loading checks:', err)
    }
  }

  const calculateResult = () => {
    // Early exit: Public Domain
    if (isPublicDomain === true) {
      return {
        color: 'green',
        title: '✅ Frei nutzbar!',
        message: 'Das Werk ist gemeinfrei (Public Domain). Du darfst es für jeden Zweck nutzen.',
        allowedUses: ['Alle Nutzungen erlaubt', 'Keine Einschränkungen', 'Quellenangabe empfohlen, aber nicht verpflichtend'],
        restrictedUses: [],
        forbiddenUses: [],
        recommendations: [
          'Du kannst das Werk kopieren, verändern und verbreiten',
          'Auch kommerzielle Nutzung ist erlaubt',
          'Gib trotzdem die Quelle an - wissenschaftlicher Standard'
        ]
      }
    }

    // CC License Check
    if (hasCCLicense === true) {
      const licenseResult = checkCCLicense(ccLicense, usageType, isCommercial)
      return licenseResult
    }

    // Not protected
    if (isProtected === false) {
      return {
        color: 'green',
        title: '✅ Frei nutzbar!',
        message: 'Das Werk ist nicht urheberrechtlich geschützt.',
        allowedUses: ['Alle Nutzungen erlaubt'],
        restrictedUses: [],
        forbiddenUses: [],
        recommendations: ['Du kannst das Werk frei nutzen']
      }
    }

    // Protected work - check usage
    return checkProtectedUsage(usageType, isPublic, usageContext, hasLicense, isCommercial)
  }

  const checkCCLicense = (license: string, usage: string, commercial: boolean | null) => {
    const restrictions: string[] = []
    const allowed: string[] = []
    const forbidden: string[] = []

    if (license === 'CC0') {
      return {
        color: 'green',
        title: '✅ Frei nutzbar (CC0)!',
        message: 'Der Urheber hat auf alle Rechte verzichtet.',
        allowedUses: ['Alle Nutzungen erlaubt', 'Keine Quellenangabe nötig', 'Kommerziell erlaubt'],
        restrictedUses: [],
        forbiddenUses: [],
        recommendations: ['Gib trotzdem die Quelle an - gute Praxis']
      }
    }

    // All CC licenses require attribution
    restrictions.push('Quellenangabe nach TASL-Formel erforderlich')

    if (license.includes('NC') && commercial === true) {
      forbidden.push('Kommerzielle Nutzung nicht erlaubt')
      return {
        color: 'red',
        title: '❌ Nicht erlaubt!',
        message: 'Die CC-Lizenz verbietet kommerzielle Nutzung.',
        allowedUses: [],
        restrictedUses: restrictions,
        forbiddenUses: forbidden,
        recommendations: [
          'Kontaktiere den Urheber für eine kommerzielle Lizenz',
          'Oder nutze ein Werk mit kommerziell-freundlicher Lizenz (CC-BY, CC-BY-SA)'
        ]
      }
    }

    if (license.includes('ND')) {
      restrictions.push('Keine Bearbeitung erlaubt - nur unverändert nutzen')
    }

    if (license.includes('SA')) {
      restrictions.push('Bearbeitungen müssen unter gleicher Lizenz geteilt werden')
    }

    allowed.push('Nutzen und Teilen erlaubt')
    if (!license.includes('ND')) {
      allowed.push('Bearbeitung erlaubt')
    }
    if (!license.includes('NC')) {
      allowed.push('Kommerziell erlaubt')
    }

    return {
      color: 'yellow',
      title: '⚠️ Erlaubt mit Bedingungen',
      message: `Das Werk ist unter ${license} lizenziert.`,
      allowedUses: allowed,
      restrictedUses: restrictions,
      forbiddenUses: [],
      recommendations: [
        'Quellenangabe: "Titel" von Autor, lizenziert unter ' + license,
        'Prüfe die genauen Lizenzbedingungen auf creativecommons.org'
      ]
    }
  }

  const checkProtectedUsage = (usage: string, isPublic: boolean | null, context: string | null, hasLicense: boolean | null, commercial: boolean | null) => {
    // Commercial use
    if (commercial === true) {
      if (hasLicense === true) {
        return {
          color: 'green',
          title: '✅ Erlaubt mit Lizenz!',
          message: 'Du hast eine Lizenz vom Urheber.',
          allowedUses: ['Nutzung gemäss Lizenzvertrag'],
          restrictedUses: [],
          forbiddenUses: [],
          recommendations: ['Halte dich an die Lizenzvereinbarung']
        }
      } else {
        return {
          color: 'red',
          title: '❌ Lizenz erforderlich!',
          message: 'Für kommerzielle Nutzung brauchst du eine Lizenz.',
          allowedUses: [],
          restrictedUses: [],
          forbiddenUses: ['Kommerzielle Nutzung ohne Lizenz'],
          recommendations: [
            'Kontaktiere den Urheber',
            'Kaufe eine Lizenz (z.B. bei Stock-Foto-Agenturen)',
            'Nutze CC-lizenzierte oder gemeinfreie Alternativen'
          ]
        }
      }
    }

    // Educational use
    if (usage.includes('Schriftliche Arbeit')) {
      if (isPublic === false) {
        if (context === 'zitat') {
          return {
            color: 'green',
            title: '✅ Erlaubt als Zitat!',
            message: 'Zitatrecht (Art. 25 URG) gilt.',
            allowedUses: ['Als Zitat mit Quellenangabe', 'Für Analyse/Erläuterung'],
            restrictedUses: ['Nur angemessener Umfang', 'Quelle vollständig angeben'],
            forbiddenUses: [],
            recommendations: [
              'Gib Autor, Titel, Jahr, Quelle an',
              'Zitat muss deiner Argumentation dienen',
              'Deine Arbeit muss überwiegen'
            ]
          }
        } else if (context === 'hauptinhalt') {
          return {
            color: 'yellow',
            title: '⚠️ Grauzone',
            message: 'Eigengebrauch für Bildung (Art. 19 URG).',
            allowedUses: ['Für private Abgabe beim Lehrer'],
            restrictedUses: ['Nicht öffentlich teilen', 'Nur im Bildungskontext'],
            forbiddenUses: ['Online-Publikation', 'Weitergabe an Dritte'],
            recommendations: [
              'Sicherer: Als Zitat verwenden',
              'Oder Erlaubnis vom Urheber einholen'
            ]
          }
        } else if (context === 'bearbeitet') {
          return {
            color: 'red',
            title: '❌ Nicht erlaubt!',
            message: 'Bearbeitung braucht Erlaubnis des Urhebers.',
            allowedUses: [],
            restrictedUses: [],
            forbiddenUses: ['Bearbeitung ohne Erlaubnis'],
            recommendations: [
              'Kontaktiere den Urheber',
              'Oder nutze das Original als Zitat',
              'Oder schaffe freie Benutzung (völlig neu)'
            ]
          }
        }
      } else if (isPublic === true) {
        if (context === 'zitat') {
          return {
            color: 'green',
            title: '✅ Erlaubt als Zitat!',
            message: 'Zitatrecht gilt auch bei Publikation.',
            allowedUses: ['Als Zitat mit Quellenangabe'],
            restrictedUses: ['Nur angemessener Umfang', 'Quelle vollständig angeben'],
            forbiddenUses: [],
            recommendations: [
              'Bei Bachelor-/Masterarbeiten im Repository: Zitat ist OK',
              'Komplette Bilder als Hauptcontent: problematisch'
            ]
          }
        } else {
          return {
            color: 'red',
            title: '❌ Nicht erlaubt!',
            message: 'Öffentliche Nutzung braucht Lizenz oder muss Zitat sein.',
            allowedUses: [],
            restrictedUses: [],
            forbiddenUses: ['Als Hauptinhalt ohne Lizenz'],
            recommendations: [
              'Nutze nur als Zitat',
              'Oder hole Lizenz ein',
              'Oder nutze CC-lizenzierte Alternativen'
            ]
          }
        }
      }
    }

    // Presentation
    if (usage.includes('Präsentation')) {
      if (isPublic === false) {
        return {
          color: 'green',
          title: '✅ Erlaubt für Unterricht!',
          message: 'Unterrichtsausnahme (Art. 19 URG) gilt.',
          allowedUses: ['Im Klassenzimmer zeigen', 'Auf Klassen-Moodle teilen'],
          restrictedUses: ['Nur für konkrete Klasse', 'Nicht öffentlich zugänglich'],
          forbiddenUses: ['Auf Schulwebsite posten', 'Online für alle teilen'],
          recommendations: [
            'Zeige es im Unterricht',
            'Oder teile es nur mit der Klasse (geschütztes LMS)'
          ]
        }
      } else {
        return {
          color: 'red',
          title: '❌ Nicht erlaubt!',
          message: 'Öffentliche Präsentationen brauchen Lizenz.',
          allowedUses: [],
          restrictedUses: [],
          forbiddenUses: ['Online für alle teilen'],
          recommendations: [
            'Hole Lizenz ein',
            'Oder nutze CC-lizenzierte Bilder',
            'Oder verlinke statt einzubetten'
          ]
        }
      }
    }

    // Online/Blog
    if (usage.includes('Blogpost') || usage.includes('Social Media')) {
      if (context === 'zitat') {
        return {
          color: 'yellow',
          title: '⚠️ Erlaubt als Zitat',
          message: 'Zitatrecht gilt online, aber mit strengen Regeln.',
          allowedUses: ['Als Zitat mit Quellenangabe'],
          restrictedUses: ['Nur zur Erläuterung', 'Angemessener Umfang'],
          forbiddenUses: ['Als Hauptbild ohne Bezug'],
          recommendations: [
            'Zitat muss deinem Text dienen',
            'Nicht nur dekorativ',
            'Quellenangabe vollständig'
          ]
        }
      } else {
        return {
          color: 'red',
          title: '❌ Lizenz erforderlich!',
          message: 'Online-Nutzung braucht Erlaubnis.',
          allowedUses: [],
          restrictedUses: [],
          forbiddenUses: ['Als Hauptbild ohne Lizenz'],
          recommendations: [
            'Hole Erlaubnis vom Urheber',
            'Nutze CC-lizenzierte Bilder (Unsplash, Pixabay)',
            'Oder nutze nur als Zitat'
          ]
        }
      }
    }

    // Default fallback
    return {
      color: 'yellow',
      title: '⚠️ Weitere Prüfung nötig',
      message: 'Die Situation ist komplex.',
      allowedUses: [],
      restrictedUses: [],
      forbiddenUses: [],
      recommendations: [
        'Kontaktiere das IGE (www.ige.ch)',
        'Oder hole dir rechtliche Beratung',
        'Im Zweifel: Alternative nutzen'
      ]
    }
  }

  const handleSave = async () => {
    if (!auth.currentUser) return
    setSaving(true)

    const resultData = calculateResult()

    try {
      await addDoc(collection(db, 'checked_products'), {
        userId: auth.currentUser.uid,
        mediaType,
        sourceType,
        description,
        usageType,
        isPublicDomain,
        hasCCLicense,
        ccLicense,
        isProtected,
        isPublic,
        usageContext,
        hasLicense,
        isCommercial,
        result: resultData,
        createdAt: new Date().toISOString()
      })

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'activity.checkedProducts': increment(1)
      })

      await loadPreviousChecks()
      alert('✅ Check erfolgreich gespeichert!')
      
      // Reset
      resetForm()
    } catch (err) {
      console.error('Error saving:', err)
      alert('❌ Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setMediaType('')
    setSourceType('')
    setDescription('')
    setIsPublicDomain(null)
    setHasCCLicense(null)
    setCCLicense('')
    setIsProtected(null)
    setUsageType('')
    setIsPublic(null)
    setUsageContext(null)
    setHasLicense(null)
    setIsCommercial(null)
    setHasSource(null)
    setContactedAuthor(null)
    setResult(null)
  }

  const renderResult = () => {
    if (!result) return null

    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-xl border-2 ${
          result.color === 'green' ? 'bg-green-50 border-green-300' :
          result.color === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
          'bg-red-50 border-red-300'
        }`}>
          <h3 className="font-bold text-xl mb-2">{result.title}</h3>
          <p className="text-sm">{result.message}</p>
        </div>

        {result.allowedUses.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-bold text-green-900 mb-2 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              ✅ Erlaubte Nutzungen:
            </h4>
            <ul className="space-y-1">
              {result.allowedUses.map((use: string, idx: number) => (
                <li key={idx} className="text-green-800 text-sm">• {use}</li>
              ))}
            </ul>
          </div>
        )}

        {result.restrictedUses.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              ⚠️ Bedingungen / Einschränkungen:
            </h4>
            <ul className="space-y-1">
              {result.restrictedUses.map((use: string, idx: number) => (
                <li key={idx} className="text-yellow-800 text-sm">• {use}</li>
              ))}
            </ul>
          </div>
        )}

        {result.forbiddenUses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-red-900 mb-2 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              ❌ Nicht erlaubt:
            </h4>
            <ul className="space-y-1">
              {result.forbiddenUses.map((use: string, idx: number) => (
                <li key={idx} className="text-red-800 text-sm">• {use}</li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">💡 Empfehlungen:</h4>
            <ul className="space-y-1">
              {result.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-blue-800 text-sm">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Nutzungs-Check</h1>
              <p className="text-gray-600 mt-2">
                Darf ich dieses fremde Werk in meinem Projekt nutzen?
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary text-sm"
            >
              {showHistory ? 'Neue Prüfung' : `Historie (${previousChecks.length})`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showHistory ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Frühere Prüfungen</h2>
            {previousChecks.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Noch keine Prüfungen vorhanden</p>
              </div>
            ) : (
              previousChecks.map((check) => (
                <div key={check.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{check.mediaType}</h3>
                      <p className="text-sm text-gray-600">{check.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Nutzung: {check.usageType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(check.createdAt).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                    {check.result && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        check.result.color === 'green' ? 'bg-green-100 text-green-800' :
                        check.result.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {check.result.title}
                      </div>
                    )}
                  </div>
                  {check.result && (
                    <div className="text-sm">
                      <p className="text-gray-700">{check.result.message}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fortschritt</span>
                <span className="text-sm text-gray-600">Schritt {step} von 8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-ecrc-blue h-2 rounded-full transition-all"
                  style={{ width: `${(step / 8) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step 1: Media Type */}
            {step === 1 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 1: Was möchtest du nutzen?</h2>
                
                <p className="text-gray-600 mb-4">Wähle die Art des fremden Werks:</p>
                
                <div className="space-y-3 mb-6">
                  {MEDIA_TYPES.map(type => (
                    <label key={type} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="mediaType"
                        value={type}
                        checked={mediaType === type}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="w-5 h-5 text-ecrc-blue"
                      />
                      <span className="ml-3 font-medium text-lg">{type}</span>
                    </label>
                  ))}
                </div>

                <Accordion title="ℹ️ Was zählt als 'Werk'?">
                  <p className="mb-2">Nach Art. 2 URG sind dies Werke der Literatur, Kunst oder Wissenschaft:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Literatur:</strong> Bücher, Artikel, Blogposts, Gedichte</li>
                    <li><strong>Kunst:</strong> Gemälde, Fotos, Skulpturen, Grafiken</li>
                    <li><strong>Musik:</strong> Kompositionen, Songs, Instrumentalstücke</li>
                    <li><strong>Film/Video:</strong> Spielfilme, Dokumentationen, YouTube-Videos</li>
                    <li><strong>Software:</strong> Computerprogramme, Apps, Code</li>
                  </ul>
                  <p className="mt-2 text-gray-700"><strong>NICHT geschützt:</strong> Reine Fakten, Daten, mathematische Formeln, amtliche Texte</p>
                </Accordion>

                <button
                  onClick={() => setStep(2)}
                  disabled={!mediaType}
                  className="btn-primary mt-6 w-full disabled:opacity-50"
                >
                  Weiter
                </button>
              </div>
            )}

            {/* Step 2: AI Check */}
            {step === 2 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 2: Wurde das Werk mit KI erstellt?</h2>
                
                <p className="text-gray-600 mb-6">
                  KI-generierte Werke sind rechtlich anders zu bewerten. Prüfe, ob das Werk mit KI erstellt wurde:
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setIsAICreated(false)}
                    className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                      isAICreated === false
                        ? 'border-ecrc-blue bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-3xl mr-3">👤</span>
                      <span className="text-xl font-bold">Nein, rein menschlich erstellt</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-12">
                      Das Werk wurde ohne KI-Unterstützung von einem Menschen geschaffen
                    </p>
                  </button>

                  <button
                    onClick={() => setIsAICreated(true)}
                    className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                      isAICreated === true
                        ? 'border-ecrc-purple bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-3xl mr-3">🤖</span>
                      <span className="text-xl font-bold">Ja, mit KI-Unterstützung</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-12">
                      Das Werk wurde ganz oder teilweise mit KI (ChatGPT, Midjourney, etc.) erstellt
                    </p>
                  </button>
                </div>

                {isAICreated === true && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                    <h3 className="font-bold text-orange-900 mb-3">⚠️ Wichtig: Menschliche Schöpfungshöhe prüfen!</h3>
                    
                    <p className="text-sm text-orange-800 mb-4">
                      Für Urheberrechtsschutz muss ein <strong>Mensch</strong> eine <strong>geistige Schöpfung</strong> 
                      mit <strong>individuellem Charakter</strong> geschaffen haben. Reine KI-Outputs sind NICHT geschützt!
                    </p>

                    <p className="text-sm font-medium text-orange-900 mb-3">
                      Hat der Mensch kreative Entscheidungen getroffen?
                    </p>

                    <div className="space-y-2 mb-4">
                      <button
                        onClick={() => setHasHumanCreativity(true)}
                        className={`w-full p-4 border-2 rounded-lg text-left ${
                          hasHumanCreativity === true
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">✅</span>
                          <div>
                            <span className="font-bold text-sm">Ja, eindeutig menschliche Kreativität</span>
                            <p className="text-xs text-gray-600 mt-1">
                              z.B. detaillierte Prompts, Auswahl, Bearbeitung, Komposition
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setHasHumanCreativity(false)}
                        className={`w-full p-4 border-2 rounded-lg text-left ${
                          hasHumanCreativity === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">❌</span>
                          <div>
                            <span className="font-bold text-sm">Nein, reiner KI-Output</span>
                            <p className="text-xs text-gray-600 mt-1">
                              z.B. nur einfacher Prompt, keine Nachbearbeitung
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <Accordion title="🤖 Was bedeutet das rechtlich?">
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-bold text-gray-900 mb-1">✅ MIT menschlicher Schöpfungshöhe:</p>
                          <ul className="list-disc pl-5 text-gray-700">
                            <li>Detaillierte, kreative Prompts</li>
                            <li>Auswahl aus vielen KI-Outputs</li>
                            <li>Manuelle Nachbearbeitung</li>
                            <li>Komposition mehrerer Elemente</li>
                          </ul>
                          <p className="mt-2 text-green-700">→ Kann urheberrechtlich geschützt sein</p>
                        </div>

                        <div>
                          <p className="font-bold text-gray-900 mb-1">❌ OHNE menschliche Schöpfungshöhe:</p>
                          <ul className="list-disc pl-5 text-gray-700">
                            <li>Einfacher Prompt: "Erstelle ein Bild von..."</li>
                            <li>KI macht alles automatisch</li>
                            <li>Keine Auswahl oder Bearbeitung</li>
                            <li>Reiner Button-Klick</li>
                          </ul>
                          <p className="mt-2 text-red-700">→ KEIN Urheberrechtsschutz!</p>
                        </div>

                        <p className="text-gray-700 mt-3 pt-3 border-t border-gray-300">
                          <strong>Rechtslage:</strong> Nach Art. 2 URG muss eine <em>geistige Schöpfung</em> mit 
                          <em>individuellem Charakter</em> vorliegen. Die KI selbst kann keine Schöpfung sein - 
                          nur der Mensch kann Urheber sein!
                        </p>
                      </div>
                    </Accordion>
                  </div>
                )}

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                    Zurück
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={isAICreated === null || (isAICreated === true && hasHumanCreativity === null)}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Source */}
            {step === 3 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 3: Woher stammt das Werk?</h2>
                
                <p className="text-gray-600 mb-4">Wähle die Quelle:</p>
                
                <div className="space-y-3 mb-6">
                  {SOURCE_TYPES.map(type => (
                    <label key={type} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="sourceType"
                        value={type}
                        checked={sourceType === type}
                        onChange={(e) => setSourceType(e.target.value)}
                        className="w-5 h-5 text-ecrc-blue"
                      />
                      <span className="ml-3 font-medium">{type}</span>
                    </label>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Beschreibung des Werks (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="z.B. 'Foto eines Sonnenuntergangs von Maria Schmidt auf Instagram'"
                  />
                </div>

                {(mediaType === '📷 Foto' || mediaType === '🎨 Bild/Grafik') && (
                  <div className="mb-6">
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
                          </ul>
                          <div className="mt-3 pt-3 border-t border-blue-300">
                            <p className="text-sm text-blue-900 font-medium">⏰ Nach 50 Jahren:</p>
                            <p className="text-sm text-blue-800 mt-1">
                              Fotos werden nach 50 Jahren <strong>gemeinfrei</strong> - auch wenn sie individuellen Charakter 
                              oder geistige Schöpfung aufweisen! Ein Foto von 1970 ist seit 2020 gemeinfrei.
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                          <strong className="text-purple-900">🎨 Bild/Grafik:</strong>
                          <p className="text-sm text-purple-800 mt-1">
                            Gezeichnete Bilder und Grafiken sind nur geschützt, wenn sie individuellen Charakter haben.
                          </p>
                          <ul className="list-disc pl-5 text-sm text-purple-800 mt-2">
                            <li>Schutzfrist: <strong>70 Jahre</strong> nach Tod des Urhebers</li>
                            <li>Individueller Charakter ERFORDERLICH (Art. 2 URG)</li>
                            <li>Einfache Strichzeichnungen oft NICHT geschützt</li>
                          </ul>
                        </div>
                      </div>
                    </Accordion>
                  </div>
                )}

                <InfoBox>
                  <strong>Tipp:</strong> Notiere dir bereits jetzt Autor, Titel und Quelle für die spätere Quellenangabe!
                </InfoBox>

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                    Zurück
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!sourceType}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Public Domain Check */}
            {step === 4 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 4: Ist das Werk gemeinfrei?</h2>
                
                <Accordion title="❓ Was bedeutet 'gemeinfrei'?" defaultOpen={true}>
                  <p className="mb-2">Ein Werk ist <strong>gemeinfrei (Public Domain)</strong>, wenn:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Der Urheber seit über <strong>70 Jahren</strong> tot ist (Art. 29 URG)</li>
                    <li>Es ein <strong>amtliches Werk</strong> ist (Gesetze, Gerichtsurteile, Art. 5 URG)</li>
                    <li>Der Urheber es als <strong>CC0</strong> freigegeben hat</li>
                  </ul>
                  <p className="text-gray-700"><strong>Beispiele:</strong> Mozart, Goethe, Paul Klee (†1940), Bundesgesetze, alte Fotos</p>
                </Accordion>

                <div className="my-6 p-6 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-4">Ist dieses Werk gemeinfrei?</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsPublicDomain(true)}
                      className={`flex-1 p-4 border-2 rounded-lg font-medium transition-colors ${
                        isPublicDomain === true
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                      Ja, gemeinfrei
                    </button>
                    <button
                      onClick={() => setIsPublicDomain(false)}
                      className={`flex-1 p-4 border-2 rounded-lg font-medium transition-colors ${
                        isPublicDomain === false
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <XCircle className="w-6 h-6 mx-auto mb-2" />
                      Nein / Unsicher
                    </button>
                  </div>
                </div>

                <Accordion title="🔍 Wie erkenne ich, ob ein Werk gemeinfrei ist?">
                  <ul className="space-y-2">
                    <li><strong>Todesjahr prüfen:</strong> Bei alten Werken das Todesjahr des Urhebers googeln</li>
                    <li><strong>Amtliche Werke:</strong> Gesetze auf admin.ch, Gerichtsurteile auf bger.ch</li>
                    <li><strong>Wikimedia Commons:</strong> Oft Angabe "Public Domain" oder "gemeinfrei"</li>
                    <li><strong>Bei Unsicherheit:</strong> Besser "Nein" wählen und weiter prüfen</li>
                  </ul>
                </Accordion>

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(3)} className="btn-secondary flex-1">
                    Zurück
                  </button>
                  <button
                    onClick={() => {
                      if (isPublicDomain === true) {
                        setStep(7) // Skip to usage type
                      } else {
                        setStep(5) // Go to CC License check
                      }
                    }}
                    disabled={isPublicDomain === null}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: CC License Check */}
            {step === 5 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 5: Hat das Werk eine Creative Commons Lizenz?</h2>
                
                <Accordion title="❓ Was ist Creative Commons?" defaultOpen={true}>
                  <p className="mb-2"><strong>Creative Commons (CC)</strong> sind standardisierte Lizenzen, die Urheber nutzen, um ihre Werke unter bestimmten Bedingungen freizugeben.</p>
                  <p className="mb-2"><strong>Erkennungsmerkmale:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>CC-Logo mit Kürzeln: 🅭🅯 (CC BY), 🅭🅯💲 (CC BY-NC), etc.</li>
                    <li>Text wie "Licensed under CC BY 4.0"</li>
                    <li>Link zu creativecommons.org/licenses/...</li>
                  </ul>
                </Accordion>

                <div className="my-6 p-6 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-4">Hat das Werk eine CC-Lizenz?</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setHasCCLicense(true)
                        setStep(6)
                      }}
                      className={`flex-1 p-4 border-2 rounded-lg font-medium transition-colors ${
                        hasCCLicense === true
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                      Ja, CC-lizenziert
                    </button>
                    <button
                      onClick={() => {
                        setHasCCLicense(false)
                        setIsProtected(true) // Assume protected
                        setStep(7)
                      }}
                      className={`flex-1 p-4 border-2 rounded-lg font-medium transition-colors ${
                        hasCCLicense === false
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <XCircle className="w-6 h-6 mx-auto mb-2" />
                      Nein / Unsicher
                    </button>
                  </div>
                </div>

                <Accordion title="🔍 Wo finde ich CC-lizenzierte Werke?">
                  <p className="mb-2"><strong>Beliebte Plattformen:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Unsplash:</strong> Kostenlose Fotos, sehr freie Lizenz</li>
                    <li><strong>Pixabay:</strong> Bilder, Videos, Musik</li>
                    <li><strong>Wikimedia Commons:</strong> Millionen Bilder, verschiedene Lizenzen</li>
                    <li><strong>Free Music Archive:</strong> Musik mit CC-Lizenzen</li>
                    <li><strong>OpenClipart:</strong> Vektorgrafiken (CC0)</li>
                  </ul>
                </Accordion>

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(4)} className="btn-secondary flex-1">
                    Zurück
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: CC License Type */}
            {step === 6 && hasCCLicense === true && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 6: Welche CC-Lizenz?</h2>
                
                <p className="text-gray-600 mb-4">Wähle die CC-Lizenz des Werks:</p>
                
                <div className="space-y-3 mb-6">
                  {CC_LICENSES.map(license => (
                    <label key={license.value} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="ccLicense"
                        value={license.value}
                        checked={ccLicense === license.value}
                        onChange={(e) => setCCLicense(e.target.value)}
                        className="w-5 h-5 text-ecrc-blue"
                      />
                      <span className="ml-3 font-medium">{license.label}</span>
                    </label>
                  ))}
                </div>

                <Accordion title="📖 CC-Lizenzen im Detail">
                  <div className="space-y-3 text-sm">
                    <div className="border-l-4 border-green-500 pl-3">
                      <strong>CC0:</strong> Urheber verzichtet auf alle Rechte. Alles erlaubt, keine Attribution nötig.
                    </div>
                    <div className="border-l-4 border-blue-500 pl-3">
                      <strong>CC-BY:</strong> Namensnennung erforderlich. Bearbeitung + kommerziell erlaubt.
                    </div>
                    <div className="border-l-4 border-blue-500 pl-3">
                      <strong>CC-BY-SA:</strong> + Weitergabe unter gleicher Lizenz (Copyleft-Effekt)
                    </div>
                    <div className="border-l-4 border-orange-500 pl-3">
                      <strong>CC-BY-ND:</strong> Keine Bearbeitung erlaubt (nur unverändert)
                    </div>
                    <div className="border-l-4 border-orange-500 pl-3">
                      <strong>CC-BY-NC:</strong> Nicht-kommerziell (NC = NonCommercial)
                    </div>
                    <div className="border-l-4 border-orange-500 pl-3">
                      <strong>CC-BY-NC-SA:</strong> Kombination: NC + SA
                    </div>
                    <div className="border-l-4 border-red-500 pl-3">
                      <strong>CC-BY-NC-ND:</strong> Strengste Lizenz (nur teilen, nicht bearbeiten, nicht kommerziell)
                    </div>
                  </div>
                </Accordion>

                <Accordion title="✍️ Korrekte Quellenangabe (TASL-Formel)">
                  <p className="mb-2"><strong>T</strong>itel - <strong>A</strong>utor - <strong>S</strong>ource - <strong>L</strong>izenz</p>
                  <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                    <p className="italic">"Sonnenuntergang über Zürich" von Maria Schmidt, lizenziert unter CC BY 4.0</p>
                    <p className="text-gray-600">Quelle: https://example.com/foto</p>
                    <p className="text-gray-600">Lizenz: https://creativecommons.org/licenses/by/4.0/</p>
                  </div>
                </Accordion>

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(5)} className="btn-secondary flex-1">
                    Zurück
                  </button>
                  <button
                    onClick={() => setStep(7)}
                    disabled={!ccLicense}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Usage Type */}
            {step === 7 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 7: Wofür möchtest du es nutzen?</h2>
                
                <p className="text-gray-600 mb-4">Wähle deine geplante Nutzung:</p>
                
                <div className="space-y-3 mb-6">
                  {USAGE_TYPES.map(type => (
                    <label key={type} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="usageType"
                        value={type}
                        checked={usageType === type}
                        onChange={(e) => setUsageType(e.target.value)}
                        className="w-5 h-5 text-ecrc-blue"
                      />
                      <span className="ml-3 font-medium">{type}</span>
                    </label>
                  ))}
                </div>

                <InfoBox>
                  Die Nutzungsart ist entscheidend! Unterricht hat andere Regeln als Online-Publikation.
                </InfoBox>

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(hasCCLicense ? 5 : (isPublicDomain ? 3 : 4))} className="btn-secondary flex-1">
                    Zurück
                  </button>
                  <button
                    onClick={() => setStep(8)}
                    disabled={!usageType}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Context Questions */}
            {step === 8 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Schritt 8: Zusatzfragen</h2>
                
                {/* Commercial use check for all types */}
                {!isPublicDomain && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-4">Ist deine Nutzung kommerziell? (Werbung, Verkauf, Geld verdienen)</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsCommercial(true)}
                        className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                          isCommercial === true
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Ja, kommerziell
                      </button>
                      <button
                        onClick={() => setIsCommercial(false)}
                        className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                          isCommercial === false
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Nein
                      </button>
                    </div>
                  </div>
                )}

                {/* Context-specific questions */}
                {usageType.includes('Schriftliche Arbeit') && !isPublicDomain && (
                  <>
                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-4">Wird die Arbeit öffentlich zugänglich? (Online, Bibliothek)</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setIsPublic(true)}
                          className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                            isPublic === true
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Ja, öffentlich
                        </button>
                        <button
                          onClick={() => setIsPublic(false)}
                          className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                            isPublic === false
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Nein, nur für Lehrer
                        </button>
                      </div>
                    </div>

                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-4">Wie nutzt du das Werk?</p>
                      <div className="space-y-3">
                        <button
                          onClick={() => setUsageContext('zitat')}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                            usageContext === 'zitat'
                              ? 'border-ecrc-blue bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <strong>Als Zitat</strong> (kleiner Ausschnitt, mit Quellenangabe)
                        </button>
                        <button
                          onClick={() => setUsageContext('hauptinhalt')}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                            usageContext === 'hauptinhalt'
                              ? 'border-ecrc-blue bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <strong>Als Hauptinhalt</strong> (ganzes Bild/Text, zentral für Arbeit)
                        </button>
                        <button
                          onClick={() => setUsageContext('bearbeitet')}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                            usageContext === 'bearbeitet'
                              ? 'border-ecrc-blue bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <strong>Bearbeitet/verändert</strong> (Remix, Filter, Übersetzung)
                        </button>
                      </div>
                    </div>

                    <Accordion title="📚 Was ist ein rechtmässiges Zitat?">
                      <p className="mb-2"><strong>Art. 25 URG - Zitatrecht</strong></p>
                      <p className="mb-2">Ein Zitat ist erlaubt, wenn:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Es einem <strong>Zweck dient</strong> (Analyse, Erläuterung, Beleg)</li>
                        <li>Der <strong>Umfang angemessen</strong> ist (nicht zu viel)</li>
                        <li>Die <strong>Quelle genannt</strong> wird (Autor, Titel, Jahr)</li>
                        <li>Deine Arbeit <strong>überwiegt</strong> (Zitat ist untergeordnet)</li>
                      </ul>
                      <p className="mt-2 text-gray-700"><strong>Faustregel:</strong> Nur so viel wie nötig für deine Argumentation.</p>
                    </Accordion>
                  </>
                )}

                {usageType.includes('Präsentation') && !isPublicDomain && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-4">Wird die Präsentation nur im Unterricht gezeigt?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsPublic(false)}
                        className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                          isPublic === false
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Ja, nur Klassenzimmer
                      </button>
                      <button
                        onClick={() => setIsPublic(true)}
                        className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                          isPublic === true
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Nein, auch online
                      </button>
                    </div>

                    <div className="mt-4">
                      <Accordion title="🎓 Unterrichtsausnahme (Art. 19 URG)">
                        <p className="mb-2">Im Unterricht darfst du geschützte Werke nutzen, wenn:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Es <strong>nur im Klassenzimmer</strong> gezeigt wird</li>
                          <li>Oder auf <strong>geschütztem LMS</strong> (Moodle, OLAT - nur für Klasse)</li>
                          <li>Für <strong>pädagogische Zwecke</strong></li>
                        </ul>
                        <p className="mt-2 font-medium text-red-700">NICHT erlaubt: Auf öffentlicher Schulwebsite posten!</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <p className="font-medium mb-2">🏫 Beispiele für verschiedene Schul-Abteilungen:</p>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li><strong>Lehrperson:</strong> Foto in Präsentation (nur Unterricht) → ✅ Erlaubt</li>
                            <li><strong>Sekretariat:</strong> Foto im Newsletter an Eltern → ❌ Lizenz nötig</li>
                            <li><strong>Mediothek:</strong> Buchcover in Katalog (nur intern) → ✅ Erlaubt</li>
                            <li><strong>Hausdienst:</strong> Icon auf Wegweiser → ⚠️ Je nach Quelle</li>
                            <li><strong>Mensa:</strong> Foto auf Speisekarte (öffentlich) → ❌ Lizenz nötig</li>
                          </ul>
                        </div>
                      </Accordion>
                    </div>
                  </div>
                )}

                {(usageType.includes('Blogpost') || usageType.includes('Social Media') || usageType.includes('Video')) && !isPublicDomain && (
                  <>
                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-4">Wie nutzt du das Werk?</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setUsageContext('zitat')}
                          className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                            usageContext === 'zitat'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Als Zitat/Beleg
                        </button>
                        <button
                          onClick={() => setUsageContext('hauptbild')}
                          className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                            usageContext === 'hauptbild'
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Als Hauptbild
                        </button>
                      </div>
                    </div>

                    <Accordion title="📱 Social Media für Schulen: Was gilt?">
                      <div className="space-y-3">
                        <p className="font-medium text-red-700">⚠️ Social Media = IMMER öffentlich!</p>
                        
                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                          <strong className="text-red-900">❌ Nicht erlaubt ohne Lizenz:</strong>
                          <ul className="list-disc pl-5 text-sm text-red-800 mt-1">
                            <li>Fremde Fotos als Hauptbild</li>
                            <li>Geschützte Grafiken/Illustrationen</li>
                            <li>Musik in Videos (auch kurze Ausschnitte!)</li>
                            <li>Film-/TV-Screenshots</li>
                          </ul>
                        </div>

                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                          <strong className="text-green-900">✅ Sichere Alternativen:</strong>
                          <ul className="list-disc pl-5 text-sm text-green-800 mt-1">
                            <li><strong>Eigene Fotos</strong> von Schulevents (mit Einwilligung!)</li>
                            <li><strong>Lizenzfreie Bilder:</strong> Unsplash, Pixabay, Pexels</li>
                            <li><strong>CC-lizenzierte Werke</strong> mit Quellenangabe</li>
                            <li><strong>Canva</strong> (mit Pro-Lizenz für kommerzielle Nutzung)</li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                          <strong className="text-blue-900">💡 Praxis-Beispiele Schulen:</strong>
                          <ul className="list-disc pl-5 text-sm text-blue-800 mt-1">
                            <li><strong>Tag der offenen Tür:</strong> Eigene Fotos! (Person-Rechte beachten)</li>
                            <li><strong>Erfolgs-Story:</strong> Zitat aus Artikel mit Quelle → ✅</li>
                            <li><strong>Event-Ankündigung:</strong> Lizenzfreies Bild als Hintergrund → ✅</li>
                            <li><strong>Schülerarbeit:</strong> Mit Einwilligung der Eltern → ✅</li>
                          </ul>
                        </div>
                      </div>
                    </Accordion>
                  </>
                )}

                {/* Schulverwaltungs-spezifische Fragen */}
                {(usageType.includes('Newsletter') || usageType.includes('Schulwebsite') || usageType.includes('Jahresbericht')) && !isPublicDomain && (
                  <>
                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-4">Ist die Publikation öffentlich zugänglich?</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setIsPublic(true)}
                          className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                            isPublic === true
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Ja, öffentlich (Website, Social Media)
                        </button>
                        <button
                          onClick={() => setIsPublic(false)}
                          className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                            isPublic === false
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Nein, nur intern (Intranet, geschlossener Verteiler)
                        </button>
                      </div>
                    </div>

                    <Accordion title="📋 Schulverwaltung: Was ist erlaubt?">
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                          <strong className="text-green-900">✅ Intern erlaubt:</strong>
                          <ul className="list-disc pl-5 text-sm text-green-800 mt-1">
                            <li>Newsletter nur an Eltern (geschlossener Verteiler)</li>
                            <li>Intranet (nur für Schulmitglieder)</li>
                            <li>Gedruckte Broschüren (begrenzte Auflage)</li>
                          </ul>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                          <strong className="text-red-900">❌ Lizenz erforderlich für:</strong>
                          <ul className="list-disc pl-5 text-sm text-red-800 mt-1">
                            <li>Öffentliche Schulwebsite</li>
                            <li>Social Media Posts</li>
                            <li>Jahresbericht (öffentlich einsehbar)</li>
                            <li>Poster/Plakate in öffentlichen Bereichen</li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                          <strong className="text-blue-900">💡 Praxis-Tipps:</strong>
                          <ul className="list-disc pl-5 text-sm text-blue-800 mt-1">
                            <li><strong>Sekretariat:</strong> Verwende lizenzfreie Bilder (Unsplash, Pixabay)</li>
                            <li><strong>Mediothek:</strong> Buchcover sind Zitatrecht (Art. 25 URG)</li>
                            <li><strong>Hausdienst:</strong> Erstelle eigene Icons oder nutze CC-BY</li>
                            <li><strong>Mensa:</strong> Fotografiere eigene Gerichte!</li>
                          </ul>
                        </div>
                      </div>
                    </Accordion>
                  </>
                )}

                {(usageType.includes('Mediothek') || usageType.includes('Mensa') || usageType.includes('Hausdienst')) && !isPublicDomain && (
                  <>
                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-4">Wo wird das Werk verwendet?</p>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setIsPublic(false)
                            setUsageContext('intern')
                          }}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                            usageContext === 'intern'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <strong>Nur intern</strong> (Mediothek-Katalog, Mensa-Menü für Schulangehörige)
                        </button>
                        <button
                          onClick={() => {
                            setIsPublic(true)
                            setUsageContext('oeffentlich')
                          }}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                            usageContext === 'oeffentlich'
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <strong>Öffentlich zugänglich</strong> (Poster im Eingang, Website, Aushang)
                        </button>
                      </div>
                    </div>

                    <Accordion title="🏫 Beispiele aus dem Schulalltag">
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong className="text-ecrc-blue">📚 Mediothek:</strong>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li><strong>Buchcover</strong> im internen Katalog → ✅ Zitatrecht (Art. 25 URG)</li>
                            <li><strong>Autorenfotos</strong> auf Ausstellung → ⚠️ Lizenz von Fotograf nötig</li>
                            <li><strong>Film-Poster</strong> für Leseliste → ✅ Wenn nur Liste, nicht Website</li>
                          </ul>
                        </div>

                        <div>
                          <strong className="text-ecrc-green">🍽️ Mensa:</strong>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li><strong>Food-Fotos</strong> von Gerichten → 💡 Eigene Fotos machen!</li>
                            <li><strong>Allergie-Icons</strong> → ✅ Verwende offizielle Icons (BAG)</li>
                            <li><strong>Hintergrundbild</strong> Speisekarte → ⚠️ Lizenzfreie Quelle nutzen</li>
                          </ul>
                        </div>

                        <div>
                          <strong className="text-orange-600">🔧 Hausdienst:</strong>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li><strong>Piktogramme</strong> (WC, Notausgang) → ✅ ISO-Normen sind frei nutzbar</li>
                            <li><strong>Wegweiser-Icons</strong> → ✅ Nutze Font Awesome, Material Icons (Open Source)</li>
                            <li><strong>Infoplakate</strong> → ⚠️ Lizenzfreie Bilder oder selbst gestalten</li>
                          </ul>
                        </div>
                      </div>
                    </Accordion>
                  </>
                )}

                {usageType.includes('Kommerzielle') && !hasCCLicense && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-4">Hast du eine Lizenz vom Urheber?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setHasLicense(true)}
                        className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                          hasLicense === true
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Ja, habe Lizenz
                      </button>
                      <button
                        onClick={() => setHasLicense(false)}
                        className={`flex-1 p-3 border-2 rounded-lg font-medium transition-colors ${
                          hasLicense === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Nein, keine Lizenz
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(7)} className="btn-secondary flex-1">
                    Zurück
                  </button>
                  <button
                    onClick={() => {
                      const res = calculateResult()
                      setResult(res)
                      setStep(8)
                    }}
                    className="btn-primary flex-1"
                  >
                    Ergebnis anzeigen
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Result */}
            {step === 8 && result && (
              <div className="space-y-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Ergebnis</h2>
                    <button
                      onClick={() => {
                        resetForm()
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Neue Prüfung
                    </button>
                  </div>
                  
                  {renderResult()}

                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold mb-2">📋 Zusammenfassung</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Werk:</strong> {mediaType}</p>
                      <p><strong>Quelle:</strong> {sourceType}</p>
                      <p><strong>Nutzung:</strong> {usageType}</p>
                      {isPublicDomain !== null && <p><strong>Gemeinfrei:</strong> {isPublicDomain ? 'Ja' : 'Nein'}</p>}
                      {hasCCLicense === true && <p><strong>CC-Lizenz:</strong> {ccLicense}</p>}
                      {isPublic !== null && <p><strong>Öffentlich:</strong> {isPublic ? 'Ja' : 'Nein'}</p>}
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-8">
                    <button onClick={() => setStep(8)} className="btn-secondary flex-1">
                      Zurück zur Prüfung
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {saving ? 'Speichert...' : 'Speichern & Fertig'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
