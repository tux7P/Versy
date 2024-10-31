"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react"
import html2canvas from 'html2canvas'

type Verse = {
  verse: number
  text: string
}

type SlideContent = {
  moderator: Verse[]
  congregation: Verse[]
  together?: Verse
}

type Slide = {
  content: SlideContent
  metadata: {
    book: string
    chapter: number
    fromVerse: number
    toVerse: number
    translation: string
  }
}

const testaments = ["Old Testament", "New Testament"]
const oldTestamentBooks = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"
]
const newTestamentBooks = [
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation"
]

const VerseSlide = ({ content, metadata, slideNumber, totalSlides }: { content: SlideContent; metadata: Slide['metadata']; slideNumber: number; totalSlides: number }) => {
  const slideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (slideRef.current) {
      html2canvas(slideRef.current, {
        scale: 2,
        width: 1280,
        height: 720,
      }).then(canvas => {
        console.log(canvas.toDataURL('image/png'))
      })
    }
  }, [content, metadata, slideNumber])

  return (
    <div 
      ref={slideRef} 
      className="w-full h-full bg-white shadow-lg p-4 relative"
      style={{ aspectRatio: '16 / 9' }}
    >
      <h2 className="text-xl font-bold mb-4 text-center">
        {metadata.book} {metadata.chapter}:{content.moderator[0].verse}-{content.congregation[content.congregation.length - 1].verse || content.together?.verse} ({metadata.translation})
      </h2>
      <div className="flex justify-between h-[calc(100%-5rem)]">
        <div className="w-1/2 pr-4">
          <h3 className="text-lg font-semibold mb-2 text-red-800">[MODERATOR]</h3>
          {content.moderator.map((verse) => (
            <p key={verse.verse} className="mb-2">
              <span className="font-bold">{verse.verse}</span> {verse.text}
            </p>
          ))}
        </div>
        <div className="w-1/2 pl-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">[CONGREGATION]</h3>
          {content.congregation.map((verse) => (
            <p key={verse.verse} className="mb-2">
              <span className="font-bold">{verse.verse}</span> {verse.text}
            </p>
          ))}
        </div>
      </div>
      {content.together && (
        <div className="absolute bottom-8 left-4 right-4">
          <h3 className="text-lg font-semibold mb-2 text-green-800">[TOGETHER]</h3>
          <p className="mb-2">
            <span className="font-bold">{content.together.verse}</span> {content.together.text}
          </p>
        </div>
      )}
      <div className="absolute bottom-2 right-4 text-sm text-gray-500">
        Slide {slideNumber} of {totalSlides}
      </div>
    </div>
  )
}

export default function VerseSlideGenerator() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [testament, setTestament] = useState(testaments[0])
  const [book, setBook] = useState("")
  const [chapter, setChapter] = useState("")
  const [fromVerse, setFromVerse] = useState("")
  const [toVerse, setToVerse] = useState("")
  const [translation, setTranslation] = useState("kjv")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("slide")

  const fetchVerses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://bible-api.com/${book}${chapter}:${fromVerse}-${toVerse}?translation=${translation}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch verses')
      }
      const data = await response.json()
      return data.verses.map(verse => ({
        verse: verse.verse,
        text: verse.text.trim()
      }))
    } catch (err) {
      setError('Error fetching verses. Please try again.')
      console.error(err)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const createSlides = (verses: Verse[]): Slide[] => {
    const slides: Slide[] = []
    const versesPerSlide = 5 // 2 for moderator, 2 for congregation, 1 for potential "together" verse

    for (let i = 0; i < verses.length; i += versesPerSlide) {
      const slideVerses = verses.slice(i, i + versesPerSlide)
      const slide: Slide = {
        content: {
          moderator: slideVerses.slice(0, 2),
          congregation: slideVerses.slice(2, 4),
          together: slideVerses.length === 5 ? slideVerses[4] : undefined
        },
        metadata: {
          book,
          chapter: parseInt(chapter),
          fromVerse: slideVerses[0].verse,
          toVerse: slideVerses[slideVerses.length - 1].verse,
          translation
        }
      }
      slides.push(slide)
    }

    return slides
  }

  const addSlides = async () => {
    const verses = await fetchVerses()
    if (verses.length > 0) {
      const newSlides = createSlides(verses)
      setSlides([...slides, ...newSlides])
      setCurrentSlide(slides.length)
      setActiveTab("slide")
    }
  }

  const removeSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index)
    setSlides(newSlides)
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1)
    }
  }

  const exportSlides = () => {
    console.log("Exporting slides...")
    // Implement your export logic here
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setActiveTab("slide")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Input Verses</h2>
        <div className="space-y-4 flex-grow">
          <div>
            <Label htmlFor="testament">Testament</Label>
            <Select onValueChange={setTestament} value={testament}>
              <SelectTrigger>
                <SelectValue placeholder="Select testament" />
              </SelectTrigger>
              <SelectContent>
                {testaments.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="book">Book</Label>
            <Select onValueChange={setBook} value={book}>
              <SelectTrigger>
                <SelectValue placeholder="Select book" />
              </SelectTrigger>
              <SelectContent>
                {(testament === "Old Testament" ? oldTestamentBooks : newTestamentBooks).map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="chapter">Chapter</Label>
            <Input
              id="chapter"
              type="number"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="Enter chapter"
            />
          </div>
          <div>
            <Label htmlFor="from-verse">From Verse</Label>
            <Input
              id="from-verse"
              type="number"
              value={fromVerse}
              onChange={(e) => setFromVerse(e.target.value)}
              placeholder="Start verse"
            />
          </div>
          <div>
            <Label htmlFor="to-verse">To Verse</Label>
            <Input
              id="to-verse"
              type="number"
              value={toVerse}
              onChange={(e) => setToVerse(e.target.value)}
              placeholder="End verse"
            />
          </div>
          <div>
            <Label htmlFor="translation">Translation</Label>
            <Input
              id="translation"
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Enter translation (e.g., kjv, web)"
            />
          </div>
        </div>
        <Button onClick={addSlides} className="mt-4" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Add Slides'}
        </Button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList>
                <TabsTrigger value="slide">Slide</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
              <TabsContent value="slide" className="flex-grow overflow-hidden">
                {slides.length > 0 ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-grow relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full max-w-[800px] max-h-[450px]">
                          <VerseSlide
                            content={slides[currentSlide].content}
                            metadata={slides[currentSlide].metadata}
                            slideNumber={currentSlide + 1}
                            totalSlides={slides.length}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span>
                        Slide {currentSlide + 1} of {slides.length}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                        disabled={currentSlide === slides.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">No slides yet</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="list" className="flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                  {slides.map((slide, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-100">
                      <button
                        className="flex-grow text-left hover:text-blue-600"
                        onClick={() => goToSlide(index)}
                      >
                        Slide {index + 1}: {slide.metadata.book} {slide.metadata.chapter}:{slide.metadata.fromVerse}-{slide.metadata.toVerse}
                      </button>
                      <Button variant="ghost" size="icon" onClick={() => removeSlide(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
     <CardFooter>
            <Button onClick={exportSlides} disabled={slides.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Slides
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}