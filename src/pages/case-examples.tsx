import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore'
import { ArrowLeft, Plus, ThumbsUp, Search, Filter } from 'lucide-react'

const EMOJI_OPTIONS = ['👍', '❤️', '🎯', '💡', '⭐', '🔥']
const TAG_OPTIONS = ['#nützlich', '#relevant', '#wichtig', '#komplex', '#einfach', '#kreativ']

interface CaseExample {
  id: string
  title: string
  description: string
  category: string
  authorName: string
  authorId: string
  createdAt: string
  reactions: Record<string, string[]> // emoji -> userIds
  tags: string[]
  userTags: Record<string, string[]> // userId -> tags
  adminComment?: {
    text: string
    createdAt: string
    adminEmail: string
  }
}

const ADMIN_EMAIL = 'antrhizom@gmail.com'
const WEBHOOK_URL = 'https://hook.eu1.make.com/qns3nawscenfjj1y2k2k82muln7r80wb'

export default function CaseExamples() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseExample[]>([])
  const [filteredCases, setFilteredCases] = useState<CaseExample[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCommentText, setAdminCommentText] = useState('')
  const [selectedCaseForComment, setSelectedCaseForComment] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.currentUser) {
      router.push('/')
      return
    }

    loadUserName()
    
    const q = query(collection(db, 'case_examples'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const casesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CaseExample[]
      setCases(casesData)
      setFilteredCases(casesData)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    filterCases()
  }, [searchTerm, selectedTags, cases])

  const loadUserName = async () => {
    if (!auth.currentUser) return
    
    // Check email from Firebase Auth
    const email = auth.currentUser.email || ''
    setUserEmail(email)
    setIsAdmin(email === ADMIN_EMAIL)
    
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
    if (userDoc.exists()) {
      setUserName(userDoc.data().lernname)
    }
  }

  const filterCases = () => {
    let filtered = cases

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(c =>
        selectedTags.some(tag => c.tags.includes(tag))
      )
    }

    // Sort by engagement score
    filtered.sort((a, b) => {
      const scoreA = calculateEngagementScore(a)
      const scoreB = calculateEngagementScore(b)
      return scoreB - scoreA
    })

    setFilteredCases(filtered)
  }

  const calculateEngagementScore = (caseEx: CaseExample) => {
    const reactionCount = Object.values(caseEx.reactions || {}).flat().length
    const tagCount = caseEx.tags.length
    return reactionCount * 2 + tagCount
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleReaction = async (caseId: string, emoji: string) => {
    if (!auth.currentUser) return

    const caseRef = doc(db, 'case_examples', caseId)
    const caseData = cases.find(c => c.id === caseId)
    if (!caseData) return

    const reactions = caseData.reactions || {}
    const usersWithEmoji = reactions[emoji] || []
    const hasReacted = usersWithEmoji.includes(auth.currentUser.uid)

    try {
      if (hasReacted) {
        // Remove reaction
        await updateDoc(caseRef, {
          [`reactions.${emoji}`]: arrayRemove(auth.currentUser.uid)
        })
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'activity.likedCases': increment(-1)
        })
      } else {
        // Add reaction
        await updateDoc(caseRef, {
          [`reactions.${emoji}`]: arrayUnion(auth.currentUser.uid)
        })
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'activity.likedCases': increment(1)
        })
      }
    } catch (err) {
      console.error('Error updating reaction:', err)
    }
  }

  const handleAddTag = async (caseId: string, tag: string) => {
    if (!auth.currentUser) return

    const caseRef = doc(db, 'case_examples', caseId)
    const caseData = cases.find(c => c.id === caseId)
    if (!caseData) return

    const userTags = caseData.userTags || {}
    const userTagList = userTags[auth.currentUser.uid] || []
    const hasTag = userTagList.includes(tag)

    try {
      if (hasTag) {
        // Remove tag
        await updateDoc(caseRef, {
          tags: arrayRemove(tag),
          [`userTags.${auth.currentUser.uid}`]: arrayRemove(tag)
        })
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'activity.taggedCases': increment(-1)
        })
      } else {
        // Add tag
        await updateDoc(caseRef, {
          tags: arrayUnion(tag),
          [`userTags.${auth.currentUser.uid}`]: arrayUnion(tag)
        })
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'activity.taggedCases': increment(1)
        })
      }
    } catch (err) {
      console.error('Error updating tag:', err)
    }
  }

  const handleAddAdminComment = async (caseId: string) => {
    if (!isAdmin || !adminCommentText.trim()) return

    try {
      await updateDoc(doc(db, 'case_examples', caseId), {
        adminComment: {
          text: adminCommentText,
          createdAt: new Date().toISOString(),
          adminEmail: userEmail
        }
      })

      setAdminCommentText('')
      setSelectedCaseForComment(null)
      alert('✅ Admin-Kommentar hinzugefügt!')
    } catch (err) {
      console.error('Error adding admin comment:', err)
      alert('❌ Fehler beim Hinzufügen des Kommentars')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Fallbeispiele</h1>
              <p className="text-gray-600 mt-2">
                Entdecke, bewerte und teile Fallbeispiele
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Beispiel hinzufügen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Fallbeispiele durchsuchen..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-ecrc-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.map(caseEx => {
            const engagementScore = calculateEngagementScore(caseEx)
            const userReactions = auth.currentUser 
              ? Object.entries(caseEx.reactions || {})
                  .filter(([_, users]) => users.includes(auth.currentUser!.uid))
                  .map(([emoji]) => emoji)
              : []
            const userTags = auth.currentUser && caseEx.userTags 
              ? caseEx.userTags[auth.currentUser.uid] || []
              : []

            return (
              <div key={caseEx.id} className={`card ${
                engagementScore > 10 ? 'border-2 border-ecrc-blue' : ''
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{caseEx.title}</h3>
                    <p className="text-gray-600 mb-3">{caseEx.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="bg-gray-100 px-3 py-1 rounded-full mr-3">
                        {caseEx.category}
                      </span>
                      <span>Von {caseEx.authorName}</span>
                    </div>
                  </div>
                  {engagementScore > 10 && (
                    <div className="ml-4 flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full flex-shrink-0">
                      <span className="text-2xl">🏆</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {TAG_OPTIONS.map(tag => {
                    const count = caseEx.tags.filter(t => t === tag).length
                    const isUserTag = userTags.includes(tag)
                    
                    return count > 0 || isUserTag ? (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(caseEx.id, tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          isUserTag
                            ? 'bg-ecrc-green text-white ring-2 ring-ecrc-green ring-offset-2'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag} {count > 0 && `(${count})`}
                      </button>
                    ) : null
                  })}
                  
                  {/* Show unselected tags */}
                  {TAG_OPTIONS.filter(tag => !caseEx.tags.includes(tag) && !userTags.includes(tag)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(caseEx.id, tag)}
                      className="px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                {/* Reactions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  {EMOJI_OPTIONS.map(emoji => {
                    const count = (caseEx.reactions?.[emoji] || []).length
                    const hasReacted = userReactions.includes(emoji)
                    
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(caseEx.id, emoji)}
                        className={`px-3 py-2 rounded-lg transition-all ${
                          hasReacted
                            ? 'bg-ecrc-purple text-white scale-110'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-lg">{emoji}</span>
                        {count > 0 && (
                          <span className="ml-1 text-sm font-medium">{count}</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Admin Comment Section */}
                {caseEx.adminComment && (
                  <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">👨‍💼</span>
                      <div className="flex-1">
                        <p className="font-bold text-yellow-900 mb-1">Admin-Kommentar:</p>
                        <div 
                          className="text-sm text-yellow-800"
                          dangerouslySetInnerHTML={{ 
                            __html: caseEx.adminComment.text.replace(
                              /\[([^\]]+)\]\(([^)]+)\)/g, 
                              '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
                            )
                          }}
                        />
                        <p className="text-xs text-yellow-700 mt-2">
                          {new Date(caseEx.adminComment.createdAt).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin: Add Comment */}
                {isAdmin && !caseEx.adminComment && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {selectedCaseForComment === caseEx.id ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          Admin-Kommentar hinzufügen:
                        </label>
                        <textarea
                          value={adminCommentText}
                          onChange={(e) => setAdminCommentText(e.target.value)}
                          className="input-field"
                          rows={3}
                          placeholder="Kommentar... (Links: [Text](URL))"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddAdminComment(caseEx.id)}
                            className="btn-primary text-sm"
                          >
                            Speichern
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCaseForComment(null)
                              setAdminCommentText('')
                            }}
                            className="btn-secondary text-sm"
                          >
                            Abbrechen
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">
                          💡 Tipp: Links im Format [Linktext](https://url.com) eingeben
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedCaseForComment(caseEx.id)}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                      >
                        + Admin-Kommentar hinzufügen
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filteredCases.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedTags.length > 0
                  ? 'Keine Fallbeispiele gefunden. Versuche andere Suchbegriffe.'
                  : 'Noch keine Fallbeispiele vorhanden. Sei der Erste und füge ein Beispiel hinzu!'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Add Case Modal */}
      {showAddModal && (
        <AddCaseModal
          userName={userName}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function AddCaseModal({ userName, onClose }: { userName: string, onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) return
    setSaving(true)

    try {
      const docRef = await addDoc(collection(db, 'case_examples'), {
        title,
        description,
        category,
        authorName: userName,
        authorId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        reactions: {},
        tags: [],
        userTags: {}
      })

      // Send webhook to Make.com for admin notification
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
            category,
            author: userName,
            tags: [],
            url: `${window.location.origin}/case-examples`,
            caseId: docRef.id,
            createdAt: new Date().toISOString()
          })
        })
      } catch (webhookErr) {
        console.error('Webhook error (non-critical):', webhookErr)
        // Don't fail the whole operation if webhook fails
      }

      // Update user activity
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'activity.taggedCases': increment(1)
      })

      alert('Fallbeispiel erfolgreich hinzugefügt!')
      onClose()
    } catch (err) {
      console.error('Error adding case:', err)
      alert('Fehler beim Hinzufügen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Neues Fallbeispiel hinzufügen</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Wähle eine Kategorie...</option>
                <option value="📷 Foto-Nutzung">📷 Foto-Nutzung</option>
                <option value="🎨 Bild/Grafik-Nutzung">🎨 Bild/Grafik-Nutzung</option>
                <option value="Musiknutzung">Musiknutzung</option>
                <option value="Videonutzung">Videonutzung</option>
                <option value="Textnutzung">Textnutzung</option>
                <option value="Creative Commons">Creative Commons</option>
                <option value="Lizenzfragen">Lizenzfragen</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>

            {(category === '📷 Foto-Nutzung' || category === '🎨 Bild/Grafik-Nutzung') && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  {category === '📷 Foto-Nutzung' ? '📷 Foto:' : '🎨 Bild/Grafik:'}
                </p>
                <p className="text-xs text-blue-800">
                  {category === '📷 Foto-Nutzung' 
                    ? 'Fotos sind in der Schweiz grundsätzlich IMMER geschützt (50 Jahre ab Herstellung, Art. 29 Abs. 2 lit. c URG).'
                    : 'Bilder/Grafiken sind nur geschützt, wenn sie individuellen Charakter haben (70 Jahre nach Tod, Art. 2 URG).'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={6}
                required
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 Zeichen
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? 'Speichert...' : 'Hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
