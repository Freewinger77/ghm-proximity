"use client"

import { useState, useEffect, useCallback } from "react"
import AppLayout from "@/components/layout"
import { FlowDesignerSection, VoiceAgentDesignerSection } from "@/components/configure-sections"
import { DeployAgentsSection } from "@/components/deploy-agents-section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileQuestion, Phone, Plus, Trash2, Save } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import Vapi from "@vapi-ai/web"
import { useRouter } from "next/navigation"

const vapi = new Vapi("b06587ff-5e67-4f06-88b9-d85c4e6ec24b") // Get Public Token from Dashboard > Accounts Page

export default function ConfigurePage() {
  const [activeTab, setActiveTab] = useState("flow")
  const [objective, setObjective] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [callStatus, setCallStatus] = useState("inactive")
  const [error, setError] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState("")
  const router = useRouter()

  // State for FlowDesignerSection
  const [persona, setPersona] = useState("platform-user")

  // New state variables for Voice Agent inputs
  const [companyName, setCompanyName] = useState("")
  const [firstMessage, setFirstMessage] = useState("")
  const [promptAdditions, setPromptAdditions] = useState("")
  const [verification, setVerification] = useState("")
  const [specificOffer, setSpecificOffer] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [dynamicQuestioning, setDynamicQuestioning] = useState(false)

  // Initialize generatedQuestions with an empty array
  const [generatedQuestions, setGeneratedQuestions] = useState<
    Array<{ question: string; instructions: string; isChecked: boolean }>
  >([])
  const [profileName, setProfileName] = useState("")
  const [savedProfiles, setSavedProfiles] = useState<string[]>([])
  const [selectedProfile, setSelectedProfile] = useState("")
  const [surveyText, setSurveyText] = useState("")

  useEffect(() => {
    const profiles = localStorage.getItem("savedProfiles")
    if (profiles) {
      setSavedProfiles(JSON.parse(profiles))
    }

    // Load the last saved state
    const lastState = localStorage.getItem("lastConfigureState")
    if (lastState) {
      const parsedState = JSON.parse(lastState)
      setObjective(parsedState.objective || "")
      setPersona(parsedState.persona || "platform-user")
      setCompanyName(parsedState.companyName || "")
      setFirstMessage(parsedState.firstMessage || "")
      setDynamicQuestioning(parsedState.dynamicQuestioning || false)
      setPromptAdditions(parsedState.promptAdditions || "")
      setGeneratedQuestions(parsedState.generatedQuestions || [])
      setVerification(parsedState.verification || "")
      setSpecificOffer(parsedState.specificOffer || "")
      setContactInfo(parsedState.contactInfo || "")
    }
  }, [])

  useEffect(() => {
    // Save the current state whenever it changes
    const currentState = {
      objective,
      persona,
      companyName,
      firstMessage,
      dynamicQuestioning,
      promptAdditions,
      generatedQuestions,
      verification,
      specificOffer,
      contactInfo,
    }
    localStorage.setItem("lastConfigureState", JSON.stringify(currentState))
  }, [
    objective,
    persona,
    companyName,
    firstMessage,
    promptAdditions,
    generatedQuestions,
    verification,
    specificOffer,
    contactInfo,
    dynamicQuestioning,
  ])

  const handleSaveProfile = () => {
    if (profileName) {
      const profile = {
        name: profileName,
        data: {
          objective,
          persona,
          companyName,
          firstMessage,
          dynamicQuestioning,
          promptAdditions,
          generatedQuestions,
          verification,
          specificOffer,
          contactInfo,
        },
      }
      localStorage.setItem(`profile_${profileName}`, JSON.stringify(profile))
      setSavedProfiles((prev) => {
        const newProfiles = [profileName, ...prev.filter((p) => p !== profileName)].slice(0, 3)
        localStorage.setItem("savedProfiles", JSON.stringify(newProfiles))
        return newProfiles
      })
      setSelectedProfile(profileName)
      setCampaignName(profileName) // Set the campaign name to the new profile name
      setProfileName("")
    }
  }

  const handleLoadProfile = (name: string) => {
    const profile = localStorage.getItem(`profile_${name}`)
    if (profile) {
      const { data } = JSON.parse(profile)
      setObjective(data.objective)
      setPersona(data.persona)
      setCompanyName(data.companyName)
      setFirstMessage(data.firstMessage)
      setDynamicQuestioning(data.dynamicQuestioning)
      setPromptAdditions(data.promptAdditions)
      setGeneratedQuestions(data.generatedQuestions)
      setVerification(data.verification)
      setSpecificOffer(data.specificOffer)
      setContactInfo(data.contactInfo)
      setSelectedProfile(name)
      setCampaignName(name) // Set the campaign name to the selected profile name
    }
  }

  const handleAddQuestion = useCallback(() => {
    setGeneratedQuestions((prev) => [...prev, { question: "", instructions: "", isChecked: false }])
  }, [])

  const handleGenerateQuestions = async () => {
    setIsLoading(true)
    setError(null)
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
              content: `You will act as an analyzer of key points. Given the user input, return a list of three key insights picked up from their query, along with three targeted questions to address these insights for survey purposes. Target these questions towards a ${persona}.  ${promptAdditions}

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
  
If the user input is in french, make sure the generated questions and insights are in french also, otherwise stick to english.

Make sure the output is **only** the JavaScript object.  

Here is the User Input now:`,
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

      let insightsAndQuestions
      try {
        insightsAndQuestions = JSON.parse(content)
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        throw new Error("Failed to parse API response as JSON")
      }

      if (!insightsAndQuestions.question1 || !insightsAndQuestions.question2 || !insightsAndQuestions.question3) {
        throw new Error("API response does not contain expected questions")
      }

      console.log("Insights and Questions:", insightsAndQuestions)

      const newQuestions = [
        { question: insightsAndQuestions.question1, instructions: "", isChecked: false },
        { question: insightsAndQuestions.question2, instructions: "", isChecked: false },
        { question: insightsAndQuestions.question3, instructions: "", isChecked: false },
      ]

      if (generatedQuestions.length === 0) {
        // If there are no questions, add all three new questions
        setGeneratedQuestions(newQuestions)
      } else {
        const checkedQuestions = generatedQuestions.filter((q) => q.isChecked)
        const uncheckedQuestions = generatedQuestions.filter((q) => !q.isChecked)

        if (checkedQuestions.length > 0) {
          // Replace only the checked questions, up to 3
          const replacementCount = Math.min(checkedQuestions.length, 3)
          const updatedQuestionsCopy = [...generatedQuestions]
          let replacementIndex = 0

          for (let i = 0; i < updatedQuestionsCopy.length && replacementIndex < replacementCount; i++) {
            if (updatedQuestionsCopy[i].isChecked) {
              updatedQuestionsCopy[i] = { ...newQuestions[replacementIndex], isChecked: false }
              replacementIndex++
            }
          }

          setGeneratedQuestions(updatedQuestionsCopy)
        } else if (generatedQuestions.length < 5) {
          // If there are fewer than 5 questions and none are checked, add new questions up to 5
          const availableSlots = 5 - generatedQuestions.length
          const questionsToAdd = newQuestions.slice(0, availableSlots)
          setGeneratedQuestions([...generatedQuestions, ...questionsToAdd])
        }
        // If no boxes are checked and there are already 5 questions, do nothing
      }
    } catch (error) {
      console.error("Error generating insights and questions:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckboxChange = (index: number) => {
    const updatedQuestions = [...generatedQuestions]
    updatedQuestions[index].isChecked = !updatedQuestions[index].isChecked
    setGeneratedQuestions(updatedQuestions)
  }

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = generatedQuestions.filter((_, i) => i !== index)
    setGeneratedQuestions(updatedQuestions)
  }

  const formatQuestionsForDeployment = useCallback(() => {
    return generatedQuestions.map((q) => `${q.question.trim()}.${q.instructions.trim()}`).join(",")
  }, [generatedQuestions])

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
    console.log("Updated assistant overrides with latest state:", overrides)
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

  // Function to force update overrides before navigating
  const forceUpdateOverridesAndNavigate = (url: string) => {
    const updatedOverrides = updateAssistantOverrides()
    console.log("Force updated overrides before navigation:", updatedOverrides)
    router.push(url)
  }

  const saveQuestionsToDatabase = async (
    campaignName: string,
    questions: Array<{ question: string; instructions: string }>,
  ) => {
    try {
      const response = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization:
            "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
        },
        body: JSON.stringify({
          sql: `UPDATE campaigns SET questions = ? WHERE campaign_name = ?`,
          params: [JSON.stringify(questions), campaignName],
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log("Questions saved to database for campaign:", campaignName)
    } catch (error) {
      console.error("Error saving questions to database:", error)
      throw error
    }
  }

  const startTest = async () => {
    setCallStatus("loading")
    const overrides = updateAssistantOverrides()
    const response = await vapi.start("a272b74b-3520-4124-a179-893c87dd7786", overrides)
  }

  const stopTest = () => {
    setCallStatus("loading")
    vapi.stop()
  }

  useEffect(() => {
    vapi.on("call-start", () => setCallStatus("active"))
    vapi.on("call-end", () => setCallStatus("inactive"))

    return () => vapi.removeAllListeners()
  }, [])

  useEffect(() => {
    updateAssistantOverrides()
  }, [updateAssistantOverrides])

  useEffect(() => {
    if (selectedProfile) {
      setCampaignName(selectedProfile)
    }
  }, [selectedProfile])

  const handleClearAllFields = () => {
    setObjective("")
    setPersona("platform-user")
    setCompanyName("")
    setFirstMessage("")
    setDynamicQuestioning(false)
    setPromptAdditions("")
    setGeneratedQuestions([])
    setVerification("")
    setSpecificOffer("")
    setContactInfo("")
  }

  // Add a function to ensure overrides are updated before navigating to survey page
  const handleShareSurvey = () => {
    const updatedOverrides = updateAssistantOverrides()
    console.log("Overrides updated before sharing survey:", updatedOverrides) // Add this line
  }

  // Add a function to generate a direct survey link with current overrides

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile management card */}
        <Card className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Profile name"
                value={profileName || selectedProfile}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
              <Button onClick={handleClearAllFields} variant="outline">
                Clear All Fields
              </Button>
            </div>
          </div>
          {savedProfiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Recent Profiles</h3>
              <div className="flex flex-wrap gap-2">
                {savedProfiles.slice(0, 3).map((profile) => (
                  <Button key={profile} variant="outline" onClick={() => handleLoadProfile(profile)}>
                    {profile}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Flow Designer Section */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-2xl font-semibold mb-6">Flow Designer</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/3 space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Describe the objective</h3>
                <Textarea
                  className="w-full h-32 p-2 border rounded"
                  placeholder="Enter your objective here..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </Card>
              <Button
                className="w-full items-center justify-center gap-2 text-lg font-medium bg-primary hover:bg-primary/90 text-white p-4 rounded-lg"
                onClick={handleGenerateQuestions}
                disabled={isLoading || !objective.trim()}
              >
                <FileQuestion className="h-6 w-6" />
                {isLoading ? "Generating..." : "Generate Questions"}
              </Button>
              {error && <div className="text-red-500 mt-2">Error: {error}</div>}
              <div className="space-y-4">
                {generatedQuestions.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2 border p-4 rounded-md">
                    <Checkbox
                      checked={item.isChecked}
                      onCheckedChange={() => handleCheckboxChange(index)}
                      className="mt-1"
                    />
                    <div className="flex-grow space-y-2">
                      <Textarea
                        value={item.question}
                        onChange={(e) => {
                          const newQuestions = [...generatedQuestions]
                          newQuestions[index].question = e.target.value
                          setGeneratedQuestions(newQuestions)
                        }}
                        placeholder="Enter question here..."
                        className="w-full p-2 border rounded resize-none"
                        rows={1}
                      />
                      <Textarea
                        value={item.instructions}
                        onChange={(e) => {
                          const newQuestions = [...generatedQuestions]
                          newQuestions[index].instructions = e.target.value
                          setGeneratedQuestions(newQuestions)
                        }}
                        placeholder="Additional instructions..."
                        className="w-full p-2 border rounded resize-none"
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={() => handleDeleteQuestion(index)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                {generatedQuestions.length < 5 && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleAddQuestion}
                      className="w-10 h-10 rounded-full bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground"
                      aria-label="Add Question"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/3">
              <FlowDesignerSection persona={persona} setPersona={setPersona} />
            </div>
          </div>
        </Card>

        {/* Voice Agent Section */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-2xl font-semibold mb-6">Voice Agent</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/3">
              <VoiceAgentDesignerSection
                companyName={companyName}
                setCompanyName={setCompanyName}
                firstMessage={firstMessage}
                setFirstMessage={setFirstMessage}
                promptAdditions={promptAdditions}
                setPromptAdditions={setPromptAdditions}
                verification={verification}
                setVerification={setVerification}
                specificOffer={specificOffer}
                setSpecificOffer={setSpecificOffer}
                contactInfo={contactInfo}
                setContactInfo={setContactInfo}
              />
            </div>
            <div className="w-full lg:w-1/3">
              <div className="space-y-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Click test in browser button to apply configurations and demo your interview.
                </p>
                {callStatus === "inactive" && (
                  <Button
                    className="w-full items-center justify-center gap-2 text-lg font-medium bg-primary hover:bg-primary/90 text-white p-4 rounded-lg"
                    onClick={startTest}
                  >
                    <Phone className="h-6 w-6" />
                    Test call in browser
                  </Button>
                )}
                {callStatus === "loading" && (
                  <div className="w-full text-center">
                    <span className="text-lg">Loading...</span>
                  </div>
                )}
                {callStatus === "active" && (
                  <Button
                    className="w-full items-center justify-center gap-2 text-lg font-medium bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg"
                    onClick={stopTest}
                  >
                    <Phone className="h-6 w-6" />
                    Stop Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Deploy Agents Section */}
        <Card className="p-4 sm:p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Deploy Agents</h2>
          <DeployAgentsSection
            generatedQuestions={formatQuestionsForDeployment()}
            onShareSurvey={handleShareSurvey}
            forceUpdateOverridesAndNavigate={forceUpdateOverridesAndNavigate}
          />
        </Card>
      </div>
    </AppLayout>
  )
}

