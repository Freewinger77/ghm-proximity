"use client"

import { useState, useCallback } from "react"
import { Upload, Play } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import type React from "react"

interface FlowDesignerSectionProps {
  persona: string
  setPersona: (value: string) => void
}

export function FlowDesignerSection({ persona, setPersona }: FlowDesignerSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <p>Who are you interviewing?</p>
          <Input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Describe the interview subject (e.g., 'Experienced software engineer with a focus on AI')"
          />
        </div>
      </div>
    </div>
  )
}

export function VoiceAgentDesignerSection({
  companyName,
  setCompanyName,
  firstMessage,
  setFirstMessage,
  promptAdditions,
  setPromptAdditions,
  verification,
  setVerification,
  specificOffer,
  setSpecificOffer,
  contactInfo,
  setContactInfo,
}: {
  companyName: string
  setCompanyName: (value: string) => void
  firstMessage: string
  setFirstMessage: (value: string) => void
  promptAdditions: string
  setPromptAdditions: (value: string) => void
  verification: string
  setVerification: (value: string) => void
  specificOffer: string
  setSpecificOffer: (value: string) => void
  contactInfo: string
  setContactInfo: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p htmlFor="company-name">Company name</p>
        <Input
          id="company-name"
          placeholder="Enter company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p htmlFor="first-message">First message</p>
        <Input
          id="first-message"
          placeholder="Enter first message"
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p htmlFor="verification">Verification ('Who are you?')</p>
        <Input
          id="verification"
          placeholder="Enter verification response"
          value={verification}
          onChange={(e) => setVerification(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p htmlFor="specific-offer">Specific offer or information</p>
        <Input
          id="specific-offer"
          placeholder="Enter specific offer or information"
          value={specificOffer}
          onChange={(e) => setSpecificOffer(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p htmlFor="contact-info">Contact information</p>
        <Input
          id="contact-info"
          placeholder="Who to contact in case the agent is asked for this information?"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p htmlFor="prompt-additions">Prompt additions</p>
        <Textarea
          id="prompt-additions"
          value={promptAdditions}
          onChange={(e) => setPromptAdditions(e.target.value)}
          placeholder="Enter any additional prompts"
        />
      </div>
    </div>
  )
}

interface CallStatus {
  number: string
  callId: string
  status: string
}

export function DeployAgentsSection({
  companyName,
  firstMessage,
  verification,
  specificOffer,
  contactInfo,
  promptAdditions,
}: {
  companyName: string
  firstMessage: string
  verification: string
  specificOffer: string
  contactInfo: string
  promptAdditions: string
}) {
  const [csvUploaded, setCsvUploaded] = useState(false)
  const [fileName, setFileName] = useState("")
  const [totalNumbers, setTotalNumbers] = useState(0)
  const [estimatedBudget, setEstimatedBudget] = useState({ min: 0, max: 0 })
  const [surveyText, setSurveyText] = useState("")
  const [parsedNumbers, setParsedNumbers] = useState<string[]>([])
  const [callStatuses, setCallStatuses] = useState<CallStatus[]>([])
  const [isLaunching, setIsLaunching] = useState(false)
  const router = useRouter()

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
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = ".csv"
    fileInput.onchange = handleFileChange as any
    fileInput.click()
  }

  const updateCallStatus = (newStatus: CallStatus) => {
    setCallStatuses((prevStatuses) => {
      const updatedStatuses = [...prevStatuses, newStatus]
      localStorage.setItem("callStatuses", JSON.stringify(updatedStatuses))
      return updatedStatuses
    })
  }

  const launchCampaign = async () => {
    setIsLaunching(true)
    setCallStatuses([]) // Reset call statuses at the start of a new campaign
    console.log("Starting campaign...")

    for (const fullNumber of parsedNumbers) {
      const requestBody = {
        assistantId: "ee2561fb-ce75-40d5-abca-13bb74356e9d",
        assistantOverrides: {
          variableValues: {
            questions_user: "Default question", // Replace with actual questions if available
          },
        },
        customer: {
          number: fullNumber,
        },
        phoneNumberId: "c2099d2a-4514-47a4-a2c3-7a711d3635dd",
      }

      try {
        const response = await fetch("https://api.vapi.ai/call", {
          method: "POST",
          headers: {
            Authorization: `Bearer ea2dd739-4bb6-43b9-8659-034acccfefcf`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        const data = await response.json()
        console.log(data)
        const newStatus: CallStatus = {
          number: fullNumber,
          callId: data.id,
          status: response.status.toString(),
        }
        updateCallStatus(newStatus)
        console.log(`Call initiated for ${fullNumber}. Call ID: ${data.id}`)

        // Wait for 5 seconds before the next call
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } catch (error) {
        console.error(`Error making call to ${fullNumber}:`, error)
        const errorStatus: CallStatus = {
          number: fullNumber,
          callId: "N/A",
          status: "Error",
        }
        updateCallStatus(errorStatus)
      }
    }

    setIsLaunching(false)
    console.log("Campaign completed.")
    router.push("/reports")
  }

  const formatQuestionsForDeployment = useCallback(() => {
    return "Default question"
  }, [])

  const updateAssistantOverrides = useCallback(() => {
    const formattedQuestions = formatQuestionsForDeployment()
    const overrides = {
      firstMessage: firstMessage,
      variableValues: {
        questions_user: formattedQuestions,
        company_name: companyName,
        verification: verification,
        specific_offer: specificOffer,
        contact_info: contactInfo,
        prompt_additions: promptAdditions,
      },
    }
    localStorage.setItem("assistantOverrides", JSON.stringify(overrides))
    return overrides
  }, [
    companyName,
    firstMessage,
    formatQuestionsForDeployment,
    verification,
    specificOffer,
    contactInfo,
    promptAdditions,
  ])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Deploy Agents</h3>
      <Tabs defaultValue="survey" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="survey">Generate Survey Page</TabsTrigger>
          <TabsTrigger value="coldcall">Cold Call</TabsTrigger>
        </TabsList>
        <TabsContent value="survey" className="space-y-4">
          <div className="space-y-2">
            <p htmlFor="survey-text">Change text on survey page</p>
            <Textarea
              id="survey-text"
              placeholder="Enter text for the survey page"
              className="min-h-[96px] resize-none"
              value={surveyText}
              onChange={(e) => setSurveyText(e.target.value)}
            />
          </div>
          <Link
            href={`/interview-share?text=${encodeURIComponent(surveyText)}`}
            passHref
            onClick={() => {
              // Ensure overrides are updated in localStorage before navigating
              updateAssistantOverrides()
            }}
          >
            <Button className="w-full">Share Link</Button>
          </Link>
        </TabsContent>
        <TabsContent value="coldcall" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file containing phone numbers for the cold call campaign.
          </p>
          <div className="flex items-center space-x-4">
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
                  <DialogTitle>Confirm Campaign Launch</DialogTitle>
                  <DialogDescription>Are you sure you want to proceed with the campaign?</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Total numbers to call: {totalNumbers}</p>
                  <p>
                    Estimated budget spend: ${estimatedBudget.min.toFixed(2)} - ${estimatedBudget.max.toFixed(2)}
                  </p>
                  <p>Total cost for calls: ${(totalNumbers * 1.2).toFixed(2)}</p>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button onClick={launchCampaign} disabled={isLaunching}>
                    {isLaunching ? "Launching..." : "Launch Campaign"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

