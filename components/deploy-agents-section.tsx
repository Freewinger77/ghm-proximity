"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Play, RefreshCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface CallStatus {
  number: string
  callId: string
  status: string
}

interface DeployAgentsSectionProps {
  generatedQuestions: string
  onShareSurvey?: () => void
}

export function DeployAgentsSection({ generatedQuestions, onShareSurvey }: DeployAgentsSectionProps) {
  const [csvUploaded, setCsvUploaded] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [totalNumbers, setTotalNumbers] = useState(0)
  const [estimatedBudget, setEstimatedBudget] = useState({ min: 0, max: 0 })
  // Add headingText state and imageBase64 state
  const [surveyText, setSurveyText] = useState("")
  const [headingText, setHeadingText] = useState("Participate in our survey")
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [parsedNumbers, setParsedNumbers] = useState<string[]>([])
  const [callStatuses, setCallStatuses] = useState<CallStatus[]>([])
  const [isLaunching, setIsLaunching] = useState(false)
  const [successfulCalls, setSuccessfulCalls] = useState<CallStatus[]>([])
  const [progress, setProgress] = useState(0)
  const [completedCalls, setCompletedCalls] = useState(0)
  const router = useRouter()
  const [campaignCancelled, setCampaignCancelled] = useState(false)
  const [campaignName, setCampaignName] = useState("")
  const [questions, setQuestions] = useState<
    Array<{ question: string; instructions: string; isGenerated: boolean; regenerate: boolean }>
  >([])
  const [canAddQuestion, setCanAddQuestion] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [objective, setObjective] = useState("")
  const [persona, setPersona] = useState("")
  const [promptAdditions, setPromptAdditions] = useState("")
  const [surveyLink, setSurveyLink] = useState<string>("")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        setCsvUploaded(true)
        setFileName(file.name)

        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          const numbers = content
            .split("\n")
            .flatMap((line) => line.split(","))
            .map((number) => number.trim())
            .filter(Boolean)
          setParsedNumbers(numbers)
          localStorage.setItem("parsedNumbers", JSON.stringify(numbers))
          setTotalNumbers(numbers.length)
          setEstimatedBudget({
            min: Math.floor(numbers.length * 0.5),
            max: Math.floor(numbers.length * 1.5),
          })
        }
        reader.readAsText(file)
      } else {
        setCsvUploaded(false)
        setFileName("")
        setParsedNumbers([])
        localStorage.removeItem("parsedNumbers")
        setTotalNumbers(0)
        setEstimatedBudget({ min: 0, max: 0 })
        alert("Please upload a valid CSV file.")
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Add image upload handler function after handleUploadClick
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setImageBase64(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    const storedNumbers = localStorage.getItem("parsedNumbers")
    if (storedNumbers) {
      setParsedNumbers(JSON.parse(storedNumbers))
      setTotalNumbers(JSON.parse(storedNumbers).length)
      setCsvUploaded(true)
    }
  }, [])

  const totalCost = useMemo(() => parsedNumbers.length * 1.2, [parsedNumbers])

  const updateCallStatus = (newStatus: CallStatus) => {
    setCallStatuses((prev) => [...prev, newStatus])
    setCompletedCalls((prev) => {
      const newCompletedCalls = prev + 1
      const newProgress = (newCompletedCalls / parsedNumbers.length) * 100
      setProgress(newProgress)
      return newCompletedCalls
    })

    if (newStatus.status === "200") {
      setSuccessfulCalls((prev) => [...prev, newStatus])
    }

    console.log(`Call completed: ${newStatus.number}, Status: ${newStatus.status}`)
  }

  const getStoredOverrides = () => {
    const storedOverrides = localStorage.getItem("assistantOverrides")
    return storedOverrides ? JSON.parse(storedOverrides) : {}
  }

  const addCampaignEntry = async (number: string, callId: string | undefined) => {
    const finalCallId = callId || "call failed to place"
    console.log(`Adding/Updating campaign entry for ${number} with call ID ${finalCallId}`)

    try {
      // Prepare the questions string
      const questionsString = generatedQuestions
        .split(",")
        .map((q) => {
          const [question, instructions] = q.split(".")
          return `${question.trim()}${instructions ? `. ${instructions.trim()}` : ""}`
        })
        .join(", ")

      const questionsOnly = generatedQuestions
        .split(",")
        .map((q) => {
          const [question, instructions] = q.split(".")
          return `${question.trim()}`
        })
        .join(", ")
        .replace(/'/g, "")

      console.log(`Prepared questions string: ${questionsString}`)

      const response = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization:
            "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
        },
        body: JSON.stringify({
          sql: `
          INSERT INTO campaigns (campaign_name, number, call_id,report, questions)
          VALUES ('${campaignName}', '${number}', '${finalCallId}','pending',  '${questionsOnly}')
        `,
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Full error response:", errorData)
        throw new Error(`Failed to add/update campaign entry: ${response.status}`)
      }

      const result = await response.json()
      console.log(`Successfully added/updated entry for ${number} in campaign ${campaignName}`)
      console.log("API Response:", result)
    } catch (error) {
      console.error("Error adding/updating campaign entry:", error)
    }
  }

  const cancelCampaign = () => {
    // Set a flag to stop further API calls
    setCampaignCancelled(true)

    // Update the status of remaining calls to "Cancelled"
    setCallStatuses((prevStatuses) => {
      const updatedStatuses = prevStatuses.map((status) =>
        status.status === "Pending" ? { ...status, status: "Cancelled" } : status,
      )
      localStorage.setItem("callStatuses", JSON.stringify(updatedStatuses))
      return updatedStatuses
    })

    console.log("Campaign cancelled. Redirecting to reports...")
  }

  const handleAddQuestion = useCallback(() => {
    if (questions.length < 5) {
      setQuestions((prev) => [...prev, { question: "", instructions: "", isGenerated: false, regenerate: false }])
    }
  }, [questions])

  const handleGenerateQuestions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const questionsToRegenerate = questions.filter((q) => q.regenerate).length
      const questionsToGenerate = Math.min(3, questionsToRegenerate)
      if (questionsToGenerate <= 0) {
        throw new Error("No questions selected for regeneration")
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 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",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You will act as an analyzer of key points. Given the user input, return a list of ${questionsToGenerate} key insights picked up from their query, along with ${questionsToGenerate} targeted questions to address these insights for survey purposes. Target these questions towards a ${persona}.  ${promptAdditions}

Make sure the output is **only** the JavaScript object with the format:
{
  "question1": "First question here",
  "question2": "Second question here",
  ...
}
`,
            },
            {
              role: "user",
              content: objective,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data)

      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error("Unexpected API response structure")
      }

      const content = data.choices[0].message.content
      console.log("Content:", content)

      let generatedQuestions
      try {
        generatedQuestions = JSON.parse(content)
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        throw new Error("Failed to parse API response as JSON")
      }

      setQuestions((prevQuestions) => {
        const updatedQuestions = prevQuestions.map((q) =>
          q.regenerate ? { ...q, question: "", instructions: "", isGenerated: false, regenerate: false } : q,
        )

        Object.values(generatedQuestions).forEach((question: string, index) => {
          const regenerateIndex = updatedQuestions.findIndex((q) => q.regenerate)
          if (regenerateIndex !== -1) {
            updatedQuestions[regenerateIndex] = { question, instructions: "", isGenerated: true, regenerate: false }
          }
        })

        return updatedQuestions
      })
    } catch (error) {
      console.error("Error generating insights and questions:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const formatQuestionsForDeployment = useCallback(() => {
    return questions.map((q) => `${q.question.trim()}.${q.instructions.trim()}`).join(",")
  }, [questions])

  const launchCampaign = async () => {
    setIsLaunching(true)
    setCallStatuses([])
    setCampaignCancelled(false)
    console.log("Starting campaign...")
    console.log("Generated Questions:", generatedQuestions)

    // The questions will be added/updated with each call in the addCampaignEntry function

    // Continue with the existing campaign launch logic
    for (const fullNumber of parsedNumbers) {
      if (campaignCancelled) {
        console.log("Campaign cancelled. Stopping further calls.")
        break
      }

      const storedOverrides = getStoredOverrides()
      const requestBody = {
        assistantId: "a272b74b-3520-4124-a179-893c87dd7786",
        assistantOverrides: {
          ...storedOverrides,
          variableValues: {
            ...storedOverrides.variableValues,
            questions_user: generatedQuestions,
          },
        },
        customer: {
          number: fullNumber,
        },
        phoneNumberId: "94aa1912-577c-4378-bd1c-bf18d213e3f7",
      }

      try {
        const response = await fetch("https://api.vapi.ai/call", {
          method: "POST",
          headers: {
            Authorization: `Bearer 7f705381-1926-45b4-8238-df239825e3fc`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        const data = await response.json()
        console.log(`API response for ${fullNumber}:`, data)

        const newStatus: CallStatus = {
          number: fullNumber,
          callId: data.id || "call failed to place",
          status: data.id ? "200" : "Failed",
        }
        updateCallStatus(newStatus)

        // Add or update entry in the database
        await addCampaignEntry(fullNumber, data.id)

        if (campaignCancelled) {
          console.log("Campaign cancelled. Stopping further calls.")
          break
        }

        // Wait for 5 seconds before the next call
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } catch (error) {
        console.error(`Error making call to ${fullNumber}:`, error)
        const errorStatus: CallStatus = {
          number: fullNumber,
          callId: "call failed to place",
          status: "Failed to place call",
        }
        updateCallStatus(errorStatus)
        await addCampaignEntry(fullNumber, undefined)
      }
    }

    setIsLaunching(false)
    console.log("Campaign completed or cancelled.")
    router.push("/reports")
  }

  useEffect(() => {
    const storedOverrides = localStorage.getItem("assistantOverrides")
    if (storedOverrides) {
      console.log("Loaded assistant overrides in DeployAgentsSection:", JSON.parse(storedOverrides)) // Add this line
    }
  }, [])

  const updateAssistantOverrides = () => {
    const storedOverrides = localStorage.getItem("assistantOverrides")
    return storedOverrides ? JSON.parse(storedOverrides) : {}
  }

  const createSurveyCampaign = async () => {
    if (!campaignName.trim()) {
      alert("Please enter a campaign name")
      return
    }

    try {
      setIsLoading(true)

      // Get the current assistant overrides - force an update first
      const currentOverrides = updateAssistantOverrides()
      console.log("Capturing current overrides for survey link:", currentOverrides)

      // Create a campaign entry in the database
      const response = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization:
            "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
        },
        body: JSON.stringify({
          sql: `
INSERT INTO campaigns (campaign_name, number, call_id, report, questions)
VALUES ('${campaignName}', 'survey-campaign', 'survey-link-${Date.now()}', '${JSON.stringify({
            overrides: currentOverrides,
            headingText,
            surveyText,
            imageBase64,
          }).replace(/'/g, "''")}', '${generatedQuestions.replace(/'/g, "''")}')`,
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Full error response:", errorData)
        throw new Error(`Failed to create campaign: ${response.status}`)
      }

      // Generate a survey link with the campaign name AND the overrides directly in the URL
      const encodedCampaignName = encodeURIComponent(campaignName)
      const encodedOverrides = encodeURIComponent(JSON.stringify(currentOverrides))
      const encodedHeading = encodeURIComponent(headingText)
      const encodedSurveyText = encodeURIComponent(surveyText)

      // Create the URL with all parameters
      let link = `${window.location.origin}/interview-share?campaign=${encodedCampaignName}&overrides=${encodedOverrides}&heading=${encodedHeading}&text=${encodedSurveyText}`

      // If there's an image, we'll still need to get it from the database as it's too large for a URL
      if (imageBase64) {
        link += "&hasImage=true"
      }

      setSurveyLink(link)

      console.log(`Successfully created survey campaign: ${campaignName}`)
      console.log(`Survey link with embedded overrides: ${link}`)
    } catch (error) {
      console.error("Error creating survey campaign:", error)
      alert("Failed to create survey campaign. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to ensure overrides are updated before creating the survey link
  const handleCreateSurvey = () => {
    // Force an update of the assistant overrides
    const updatedOverrides = updateAssistantOverrides()
    console.log("Updated overrides before creating survey:", updatedOverrides)

    // Create the survey campaign
    createSurveyCampaign()
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Deploy Agents</h3>
      <Tabs defaultValue="survey" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="survey">Generate Survey Page</TabsTrigger>
          <TabsTrigger value="coldcall">Cold Call</TabsTrigger>
        </TabsList>
        {/* Update the TabsContent for survey to include heading input and image upload */}
        <TabsContent value="survey" className="space-y-4">
          <div className="space-y-2">
            <p htmlFor="campaign-name">Campaign Name</p>
            <Input
              id="campaign-name"
              placeholder="Enter a name for this survey campaign"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p htmlFor="heading-text">Survey page heading</p>
            <Input
              id="heading-text"
              placeholder="Enter heading for the survey page"
              value={headingText}
              onChange={(e) => setHeadingText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p htmlFor="survey-text">Survey page description</p>
            <Textarea
              id="survey-text"
              placeholder="Enter text for the survey page"
              className="min-h-[96px] resize-none"
              value={surveyText}
              onChange={(e) => setSurveyText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p>Upload image (optional)</p>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
              {imageBase64 && (
                <Button variant="outline" size="sm" onClick={() => setImageBase64(null)} className="whitespace-nowrap">
                  Clear Image
                </Button>
              )}
            </div>
            {imageBase64 && (
              <div className="mt-2">
                <img
                  src={imageBase64 || "/placeholder.svg"}
                  alt="Preview"
                  className="max-h-40 rounded-md object-contain"
                />
              </div>
            )}
          </div>
          {/* Show either Create or Update button based on whether a link exists */}
          {surveyLink ? (
            <Button variant="outline" className="w-full" onClick={handleCreateSurvey}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Survey Link with Current Settings
            </Button>
          ) : (
            <Button className="w-full" onClick={handleCreateSurvey} disabled={!campaignName.trim()}>
              Create Survey Campaign
            </Button>
          )}
          {surveyLink && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p className="font-medium mb-2">Survey Link Created:</p>
              <div className="flex items-center gap-2">
                <Input value={surveyLink} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(surveyLink)
                    alert("Link copied to clipboard!")
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="coldcall" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file containing phone numbers for the cold call campaign.
          </p>
          <div className="flex items-center space-x-4">
            <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            <Button className="flex items-center gap-2" onClick={handleUploadClick}>
              <Upload className="h-4 w-4" />
              {csvUploaded ? "Replace CSV" : "Upload CSV"}
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" disabled={!csvUploaded || isLaunching}>
                  <Play className="h-4 w-4" />
                  {isLaunching ? "Launching..." : "Launch Campaign"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Campaign Setup</DialogTitle>
                  <DialogDescription>
                    {isLaunching ? "Campaign in progress..." : "Enter a name for your campaign and confirm launch."}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {!isLaunching && (
                    <div className="mb-4">
                      <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign Name
                      </label>
                      <Input
                        id="campaign-name"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Enter campaign name"
                        className="w-full"
                      />
                    </div>
                  )}
                  <p>Total numbers to call: {totalNumbers}</p>
                  <p>
                    Estimated budget spend: ${estimatedBudget.min.toFixed(2)} - ${estimatedBudget.max.toFixed(2)}
                  </p>
                  <p>Total cost for calls: ${(totalNumbers * 1.2).toFixed(2)}</p>
                  {isLaunching && (
                    <>
                      <div className="mt-4">
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-center mt-2">
                          {completedCalls} / {parsedNumbers.length} calls completed ({progress.toFixed(2)}%)
                        </p>
                      </div>
                      <div className="mt-4">
                        <h4 className="mb-2 font-semibold">Call Status:</h4>
                        <ScrollArea className="h-[200px] w-full border rounded p-2">
                          {callStatuses.map((call, index) => (
                            <div key={index} className="text-sm mb-1">
                              {call.number}: {call.status === "200" ? `Call ID: ${call.callId}` : call.status}
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </>
                  )}
                  {!isLaunching && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-semibold">Numbers to be called:</h4>
                      <ScrollArea className="h-[200px] w-full border rounded p-2">
                        <div className="flex flex-wrap gap-2">
                          {parsedNumbers.map((number, index) => (
                            <div
                              key={index}
                              className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm flex items-center justify-center"
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {!isLaunching ? (
                    <Button onClick={launchCampaign} disabled={isLaunching || !campaignName.trim()}>
                      Launch Campaign
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsLaunching(false)
                        cancelCampaign()
                        router.push("/reports")
                      }}
                      disabled={!isLaunching}
                    >
                      Cancel Campaign
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

