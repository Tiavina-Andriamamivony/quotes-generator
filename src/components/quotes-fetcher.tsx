"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RefreshCw, Copy, Share2, Heart, Volume2, VolumeX, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"

interface Quote {
  id: number
  quote: string
  author: string
}

interface SavedQuote {
  id: number
  externalId: number
  content: string
  author: string
}

function EnhancedQuotesFetcher() {
  const { user, isLoaded } = useUser()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [favorites, setFavorites] = useState<SavedQuote[]>([])
  const [category, setCategory] = useState<string>("random")
  const [animation, setAnimation] = useState<boolean>(false)
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(true)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [audioLoading, setAudioLoading] = useState<boolean>(false)
  const [selectedVoice, setSelectedVoice] = useState<string>("Rachel")
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  // Available voices
  const voices = [
    { id: "Rachel", name: "Rachel (Female, American)" },
    { id: "Drew", name: "Drew (Male, American)" },
    { id: "Clyde", name: "Clyde (Male, American)" },
    { id: "Paul", name: "Paul (Male, American)" },
    { id: "Domi", name: "Domi (Female, American)" },
    { id: "Dave", name: "Dave (Male, British)" },
    { id: "Fin", name: "Fin (Male, Irish)" },
    { id: "Sarah", name: "Sarah (Female, American)" },
    { id: "Antoni", name: "Antoni (Male, American)" },
    { id: "Thomas", name: "Thomas (Male, American)" },
  ]

  // Fetch user's favorites on component mount
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserFavorites()
    }
  }, [isLoaded, user])

  // Fetch random quote on category change
  useEffect(() => {
    fetchQuote(category)
  }, [category])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ""
      }
    }
  }, [currentAudio])

  // Fetch user's favorites from the database
  const fetchUserFavorites = async () => {
    setLoadingFavorites(true)
    try {
      const response = await fetch("/api/favorites")
      if (!response.ok) {
        throw new Error("Failed to fetch favorites")
      }
      const data = await response.json()
      setFavorites(data)
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast.error("Failed to load your favorites")
    } finally {
      setLoadingFavorites(false)
    }
  }

  const fetchQuote = async (type: string) => {
    setLoading(true)
    setAnimation(true)

    try {
      let endpoint = "https://dummyjson.com/quotes/random"

      if (type !== "random") {
        // Note: DummyJSON doesn't support category filtering for quotes
        // This is just to demonstrate the UI functionality
        endpoint = "https://dummyjson.com/quotes/random"
      }

      const response = await fetch(endpoint)
      const data = await response.json()

      setQuote({
        id: data.id,
        quote: data.quote,
        author: data.author,
      })
    } catch (error) {
      console.error("Error fetching quote:", error)
      toast.error("Failed to fetch quote. Please try again.")
    } finally {
      setLoading(false)
      setTimeout(() => setAnimation(false), 500)
    }
  }

  const handleCopyQuote = () => {
    if (quote) {
      navigator.clipboard.writeText(`"${quote.quote}" - ${quote.author}`)
      toast.success("Quote copied to clipboard!")
    }
  }

  const handleShareQuote = () => {
    if (quote) {
      if (navigator.share) {
        navigator
          .share({
            title: "Inspiring Quote",
            text: `"${quote.quote}" - ${quote.author}`,
            url: window.location.href,
          })
          .catch(() => {
            toast.info("Sharing canceled or not supported")
          })
      } else {
        toast.info("Web Share API not supported on this browser")
        handleCopyQuote()
      }
    }
  }

  const handlePlayQuote = async () => {
    if (!quote || !user) {
      toast.error("Please sign in to use text-to-speech")
      return
    }

    if (isPlaying && currentAudio) {
      // Stop current audio
      currentAudio.pause()
      currentAudio.src = ""
      setIsPlaying(false)
      setCurrentAudio(null)
      return
    }

    setAudioLoading(true)

    try {
      const textToSpeak = `${quote.quote}. By ${quote.author}.`

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToSpeak,
          voice: selectedVoice,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onplay = () => {
        setIsPlaying(true)
        setAudioLoading(false)
      }

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setAudioLoading(false)
        setCurrentAudio(null)
        toast.error("Failed to play audio")
        URL.revokeObjectURL(audioUrl)
      }

      setCurrentAudio(audio)
      await audio.play()
    } catch (error) {
      console.error("Error playing quote:", error)
      toast.error("Failed to generate speech. Please try again.")
      setAudioLoading(false)
      setIsPlaying(false)
    }
  }

  const toggleFavorite = async () => {
    if (!quote || !user) return

    const isFavorite = favorites.some((fav) => fav.externalId === quote.id)

    if (isFavorite) {
      // Remove from favorites
      try {
        const favoriteToRemove = favorites.find((fav) => fav.externalId === quote.id)
        if (!favoriteToRemove) return

        const response = await fetch(`/api/favorites/${favoriteToRemove.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to remove from favorites")
        }

        setFavorites(favorites.filter((fav) => fav.externalId !== quote.id))
        toast.info("Removed from favorites")
      } catch (error) {
        console.error("Error removing favorite:", error)
        toast.error("Failed to remove from favorites")
      }
    } else {
      // Add to favorites
      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalId: quote.id,
            content: quote.quote,
            author: quote.author,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add to favorites")
        }

        const savedQuote = await response.json()
        setFavorites([...favorites, savedQuote])
        toast.success("Added to favorites")
      } catch (error) {
        console.error("Error adding favorite:", error)
        toast.error("Failed to add to favorites")
      }
    }
  }

  const removeFavorite = async (id: number) => {
    try {
      const response = await fetch(`/api/favorites/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove from favorites")
      }

      setFavorites(favorites.filter((fav) => fav.id !== id))
      toast.info("Removed from favorites")
    } catch (error) {
      console.error("Error removing favorite:", error)
      toast.error("Failed to remove from favorites")
    }
  }

  const isFavorite = quote ? favorites.some((fav) => fav.externalId === quote.id) : false

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Tabs defaultValue="quote" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="quote">Quote Generator</TabsTrigger>
          <TabsTrigger value="favorites">Favorites {!loadingFavorites && `(${favorites.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="quote" className="space-y-4">
          <div className="flex justify-center space-x-4 mb-6">
            <Button
              variant={category === "random" ? "default" : "outline"}
              onClick={() => setCategory("random")}
              className="rounded-full"
            >
              Random
            </Button>
            <Button
              variant={category === "inspirational" ? "default" : "outline"}
              onClick={() => setCategory("inspirational")}
              className="rounded-full"
            >
              Inspirational
            </Button>
            <Button
              variant={category === "life" ? "default" : "outline"}
              onClick={() => setCategory("life")}
              className="rounded-full"
            >
              Life
            </Button>
          </div>

          {/* Voice Selection */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Voice:</span>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card
            className={`overflow-hidden transition-all duration-300 ${animation ? "scale-95 opacity-70" : "scale-100 opacity-100"}`}
          >
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-center text-xl">Quote of the Moment</CardTitle>
            </CardHeader>

            <CardContent className="pt-6 pb-8 px-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/4 mt-4 ml-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xl font-serif italic text-center">"{quote?.quote}"</p>
                  <p className="text-right font-medium">— {quote?.author}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-muted/30 px-6 py-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => fetchQuote(category)} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Quote</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePlayQuote}
                        disabled={loading || !quote || audioLoading}
                      >
                        {audioLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPlaying ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isPlaying ? "Stop Audio" : "Play Quote"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleFavorite}
                        disabled={loading || !quote || !user}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFavorite ? "Remove from Favorites" : "Add to Favorites"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleCopyQuote} disabled={loading || !quote}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy Quote</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleShareQuote} disabled={loading || !quote}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share Quote</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="favorites">
          {loadingFavorites ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">No favorite quotes yet</p>
                <p className="text-sm text-muted-foreground text-center">
                  Start adding quotes to your favorites from the Quote Generator tab
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {favorites.map((fav) => (
                <Card key={fav.id} className="overflow-hidden">
                  <CardContent className="pt-6 pb-4 px-6">
                    <p className="text-lg font-serif italic">"{fav.content}"</p>
                    <p className="text-right font-medium mt-2">— {fav.author}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t bg-muted/30 px-6 py-3">
                    <Button variant="ghost" size="sm" onClick={() => removeFavorite(fav.id)}>
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedQuotesFetcher
