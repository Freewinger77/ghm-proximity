"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Layout, Mic, BarChart3, ChevronDown, Phone, FileQuestion, Upload, Play, Sun, Moon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTheme } from "next-themes"
import { ThemeProvider } from "next-themes"
import Vapi from "@vapi-ai/web"
import Link from "next/link"
import { LoginPage } from "./login-page"

const vapi = new Vapi("b049be6d-76e7-4471-a481-42e6b0ad3364") // Get Public Token from Dashboard > Accounts Page

export default function ProximityPlatform() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("designer")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = (username: string, password: string) => {
    if (username === "test" && password === "1234") {
      setIsAuthenticated(true)
      localStorage.setItem("isAuthenticated", "true")
    }
  }

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Proximity Platform</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAuthenticated(false)
                  localStorage.removeItem("isAuthenticated")
                }}
              >
                Logout
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 space-y-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="designer">Designer</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="designer" className="space-y-12">
              <FlowDesignerSection />
              <VoiceAgentDesignerSection />
              <DeployAgentsSection />
            </TabsContent>
            <TabsContent value="reports">
              <ReportsSection />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ThemeProvider>
  )
}

function FlowDesignerSection() {
  const [persona, setPersona] = useState("platform-user")
  const [temperature, setTemperature] = useState(0.2)
  const [outputTokens, setOutputTokens] = useState(1024)
  const [objective, setObjective] = useState("")
  const [additional, setAdditional] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([])

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
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
              content: `You will act as an analyzer of key points. Given the user input, return a list of three key insights picked up from their query, along with three targeted questions to address these insights for survey purposes. Target these questions towards a user.  ${additional}

### Example 1  
**User Input:**  

*"Our e-commerce platform is seeing a lot of traffic, but conversions remain low. Users are browsing products, adding them to their carts, but for some reason, they don't complete their purchases. I want to understand what might be happening and how we can improve our sales funnel to encourage more checkouts."*  

**Key Insights & Survey Questions (JavaScript Object):**  

{
  "insight1": "Users are engaging with the platform but may be facing hidden barriers that prevent them from completing purchases.",
  "insight2": "Potential issues could include unexpected costs, checkout complexity, or trust concerns leading to drop-offs.",
  "insight3": "Analyzing user behavior throughout the sales funnel can help identify friction points and areas for improvement.",
  "question1": "What factors, if any, discourage you from completing your purchase after adding items to your cart?",
  "question2": "Did you encounter any unexpected costs, confusing steps, or security concerns while trying to check out?",
  "question3": "What improvements would make the checkout process smoother and more convenient for you?"
}


### Example 2  
**User Input:**  

*"We've built a new AI-powered customer support system, but user feedback has been mixed. Some users seem satisfied, while others report frustration, but I can't pinpoint exactly what's going wrong. I need to understand whether the chatbot is failing to answer certain types of queries, if users prefer human agents, or if the overall experience just isn't meeting expectations."*  

**Key Insights & Survey Questions (JavaScript Object):**  

{
  "insight1": "Users may be encountering gaps in the AI's ability to handle complex or nuanced queries effectively.",
  "insight2": "Some users might prefer human support, indicating potential limitations in trust or response accuracy.",
  "insight3": "Evaluating user feedback and chatbot performance can reveal usability issues affecting customer satisfaction.",
  "question1": "Have you experienced instances where the chatbot failed to provide a helpful response? If so, what was the issue?",
  "question2": "Do you prefer interacting with a human support agent over the chatbot? Why or why not?",
  "question3": "What improvements would make the chatbot more useful and reliable for your needs?"
}
 

### Example 3  
**User Input:**  

*"Our mobile app has a solid user base, but engagement levels have dropped over the past few months. Users are installing the app but aren't returning as frequently as they used to. I'm unsure whether this is due to usability issues, lack of new features, or if users simply lose interest over time. I need insights on what's driving this decline and how we can improve retention."*  

**Key Insights & Survey Questions (JavaScript Object):**  

{
  "insight1": "Users may be experiencing usability challenges or missing compelling reasons to return to the app.",
  "insight2": "The app might lack engaging features or timely updates to sustain long-term interest.",
  "insight3": "Analyzing user drop-off trends and in-app behavior can help identify retention barriers and engagement opportunities.",
  "question1": "What are the main reasons you no longer use the app as frequently as before?",
  "question2": "Are there any specific features or improvements that would encourage you to use the app more often?",
  "question3": "How satisfied are you with the overall user experience of the app, and what would you change?"
}
  

Make sure the output is **only** the JavaScript object.  

Here is the User Input now:`,
            },
            {
              role: "user",
              content: objective,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: temperature,
          max_completion_tokens: outputTokens,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const insightsAndQuestions = JSON.parse(data.choices[0].message.content)

      console.log("Insights and Questions:", insightsAndQuestions)

      setGeneratedQuestions([
        insightsAndQuestions.question1,
        insightsAndQuestions.question2,
        insightsAndQuestions.question3,
      ])
    } catch (error) {
      console.error("Error generating insights and questions:", error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Layout className="w-6 h-6" />
        Flow Designer
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <p htmlFor="interview-objective">Describe the interview objective</p>
            <Textarea
              id="interview-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Your query goes here"
              className="min-h-[72px] resize-none"
            />
          </div>
          <Button
            className="w-full items-center justify-center gap-2 text-lg font-medium bg-black hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 text-white p-4 rounded-lg"
            aria-label="Generate Questions"
            onClick={handleSubmit}
            disabled={isLoading || !objective.trim()}
          >
            <FileQuestion className="h-6 w-6" />
            {isLoading ? "Generating..." : "Generate Questions"}
          </Button>
          {generatedQuestions.length > 0 && (
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Generated Questions</h3>
              {generatedQuestions.map((question, index) => (
                <Textarea
                  key={index}
                  value={question}
                  readOnly
                  placeholder={`Question ${index + 1}`}
                  className="bg-white/5 border-white/10 min-h-[100px]"
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configure</h3>
          <div className="space-y-4">
            <div>
              <p>Interview Subject Profile</p>
              <RadioGroup value={persona} onValueChange={setPersona} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="platform-user" id="platform-user" />
                  <p htmlFor="platform-user">Platform user</p>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="product-manager" id="product-manager" />
                  <p htmlFor="product-manager">Product manager</p>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="product-qa-tester" id="product-qa-tester" />
                  <p htmlFor="product-qa-tester">Product QA tester</p>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <p htmlFor="custom">Custom Profile</p>
                </div>
              </RadioGroup>
              {persona === "custom" && (
                <Input
                  placeholder="Describe the interview subject (e.g., 'Experienced software engineer with a focus on AI')"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <p htmlFor="prompt-additions">Prompt additions</p>
              <Textarea
                id="prompt-additions"
                value={additional}
                onChange={(e) => setAdditional(e.target.value)}
                placeholder="Enter any additional prompts"
              />
            </div>
            <Collapsible>
              <CollapsibleTrigger className="flex items-center">
                Advanced <ChevronDown className="h-4 w-4 ml-2" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <p>Temperature ({temperature})</p>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={([value]) => setTemperature(value)}
                  />
                </div>
                <div className="space-y-2">
                  <p>Output tokens ({outputTokens})</p>
                  <Slider
                    min={200}
                    max={2048}
                    step={1}
                    value={[outputTokens]}
                    onValueChange={([value]) => setOutputTokens(value)}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </section>
  )
}

function VoiceAgentDesignerSection() {
  const [voice, setVoice] = useState("voice-1")
  const [isQuality, setIsQuality] = useState(false)
  const [wordsBeforeStop, setWordsBeforeStop] = useState(2)
  const [voiceSeconds, setVoiceSeconds] = useState(0.2)
  const [backOffSeconds, setBackOffSeconds] = useState(1)
  const [callStatus, setCallStatus] = useState("inactive")
  const [promptAdditions, setPromptAdditions] = useState("")
  const [dynamic, setDynamic] = useState(false)
  const [dynamicValue, setDynamicValue] = useState("")

  const start = async () => {
    setCallStatus("loading")
    const response = await vapi.start("4b94c98d-0338-43db-87ff-e0b7db5472b6")
  }

  const stop = () => {
    setCallStatus("loading")
    vapi.stop()
  }

  useEffect(() => {
    vapi.on("call-start", () => setCallStatus("active"))
    vapi.on("call-end", () => setCallStatus("inactive"))

    return () => vapi.removeAllListeners()
  }, [])

  const handleDynamicChange = (checked: boolean) => {
    setDynamic(checked)
    setDynamicValue(
      checked ? "Given the user query, ask 1-2 dynamic questions in addition to the ones supplied in the script." : "",
    )
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Mic className="w-6 h-6" />
        Voice Agent Designer
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex justify-center items-center">
            {callStatus === "inactive" && (
              <Button
                className="w-full items-center justify-center gap-2 text-lg font-medium bg-black hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 text-white p-4 rounded-lg"
                aria-label="Start Test in Browser"
                onClick={start}
              >
                <Phone className="h-6 w-6" />
                Start Test in Browser
              </Button>
            )}
            {callStatus === "loading" && (
              <div className="w-full text-center">
                <span className="text-lg">Loading...</span>
              </div>
            )}
            {callStatus === "active" && (
              <Button
                className="w-full items-center justify-center gap-2 text-lg font-medium bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-600 text-white p-4 rounded-lg"
                aria-label="Stop Test"
                onClick={stop}
              >
                <Phone className="h-6 w-6" />
                Stop Test
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configure</h3>
          <div className="space-y-2">
            <p htmlFor="company-name">Company name</p>
            <Input id="company-name" placeholder="Enter company name" />
          </div>
          <div className="space-y-2">
            <p htmlFor="first-message">First message</p>
            <Input id="first-message" placeholder="Enter first message" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="dynamic-questioning" checked={dynamic} onCheckedChange={handleDynamicChange} />
            <p htmlFor="dynamic-questioning">Dynamic questioning</p>
          </div>
          {dynamicValue && <p className="text-sm text-muted-foreground">{dynamicValue}</p>}
          <div className="space-y-2">
            <p htmlFor="prompt-additions">Prompt additions</p>
            <Textarea
              id="prompt-additions"
              value={promptAdditions}
              onChange={(e) => setPromptAdditions(e.target.value)}
              placeholder="Enter any additional prompts"
            />
          </div>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center">
              Advanced <ChevronDown className="h-4 w-4 ml-2" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">Voice</h4>
                <div className="space-y-2">
                  <p htmlFor="voice-select">Select Voice</p>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger id="voice-select">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voice-1">Voice 1</SelectItem>
                      <SelectItem value="voice-2">Voice 2</SelectItem>
                      <SelectItem value="voice-3">Voice 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="fast-quality-toggle" checked={isQuality} onCheckedChange={setIsQuality} />
                  <p htmlFor="fast-quality-toggle">{isQuality ? "Quality" : "Fast"}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="background-noise" />
                  <p htmlFor="background-noise">Background noise</p>
                </div>
                <div className="space-y-2">
                  <p>Number of words ({wordsBeforeStop})</p>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[wordsBeforeStop]}
                    onValueChange={([value]) => setWordsBeforeStop(value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the number of words that the customer has to say before the assistant will stop talking.
                  </p>
                </div>
                <div className="space-y-2">
                  <p>Voice seconds ({voiceSeconds.toFixed(1)})</p>
                  <Slider
                    min={0}
                    max={0.5}
                    step={0.1}
                    value={[voiceSeconds]}
                    onValueChange={([value]) => setVoiceSeconds(value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the seconds customer has to speak before the assistant stops talking.
                  </p>
                </div>
                <div className="space-y-2">
                  <p>Back off seconds ({backOffSeconds.toFixed(1)})</p>
                  <Slider
                    min={0}
                    max={5}
                    step={0.1}
                    value={[backOffSeconds]}
                    onValueChange={([value]) => setBackOffSeconds(value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the seconds to wait before the assistant will start talking again after being interrupted.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  )
}

function DeployAgentsSection() {
  const [csvUploaded, setCsvUploaded] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [totalNumbers, setTotalNumbers] = useState(0)
  const [estimatedBudget, setEstimatedBudget] = useState({ min: 0, max: 0 })
  const [surveyText, setSurveyText] = useState("")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        setCsvUploaded(true)
        setFileName(file.name)
        // Simulate parsing CSV and updating numbers
        setTotalNumbers(Math.floor(Math.random() * 1000) + 100)
        setEstimatedBudget({
          min: Math.floor(Math.random() * 500) + 100,
          max: Math.floor(Math.random() * 1000) + 600,
        })
      } else {
        setCsvUploaded(false)
        setFileName("")
        setTotalNumbers(0)
        setEstimatedBudget({ min: 0, max: 0 })
        alert("Please upload a valid CSV file.")
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Play className="w-6 h-6" />
        Deploy Agents
      </h2>
      <Tabs defaultValue="survey" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
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
          <Link href={`/interview-share?text=${encodeURIComponent(surveyText)}`} passHref>
            <Button className="w-full">Share Link</Button>
          </Link>
        </TabsContent>
        <TabsContent value="coldcall" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file containing phone numbers for the cold call campaign.
          </p>
          <div className="flex items-center space-x-4">
            <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            <Button className="flex items-center gap-2" onClick={handleUploadClick}>
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" disabled={!csvUploaded}>
                  <Play className="h-4 w-4" />
                  Launch Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Campaign Launch</DialogTitle>
                  <DialogDescription>Are you sure you want to proceed with the campaign?</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Total numbers to call: {totalNumbers}</p>
                  <p>
                    Estimated budget spend: ${estimatedBudget.min} - ${estimatedBudget.max}
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

function ReportsSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Reports
      </h2>
      <p className="text-muted-foreground">Reports functionality coming soon.</p>
    </section>
  )
}

