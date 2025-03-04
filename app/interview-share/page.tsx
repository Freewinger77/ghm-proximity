"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Create a safer Vapi initialization
let vapi: any = null

// Safely import Vapi only on the client side
if (typeof window !== "undefined") {
  // Create a safer global environment for Vapi
  if (!window.process) {
    window.process = {
      env: {},
      // Add a mock emitWarning function
      emitWarning: () => {},
    } as any
  } else if (!window.process.emitWarning) {
    window.process.emitWarning = () => {}
  }

  // Now import Vapi
  import("@vapi-ai/web")
    .then((VapiModule) => {
      const Vapi = VapiModule.default
      vapi = new Vapi("b06587ff-5e67-4f06-88b9-d85c4e6ec24b")
    })
    .catch((err) => {
      console.error("Failed to load Vapi:", err)
    })
}

export default function InterviewSharePage() {
  const [email, setEmail] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [headingText, setHeadingText] = useState("Participate in our survey")
  const [surveyText, setSurveyText] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<"inactive" | "loading" | "active">("inactive")
  const [campaignData, setCampaignData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vapiReady, setVapiReady] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  // Add a new state variable to track when a call has been completed
  const [callCompleted, setCallCompleted] = useState(false)

  // Add more detailed logging for debugging
  useEffect(() => {
    console.log("URL params:", window.location.search)
    const urlParams = new URLSearchParams(window.location.search)
    console.log("Campaign param:", urlParams.get("campaign"))
    console.log("Text param:", urlParams.get("text"))

    // Log any stored overrides
    const storedOverrides = localStorage.getItem("assistantOverrides")
    console.log("Stored assistant overrides on load:", storedOverrides ? JSON.parse(storedOverrides) : "None")
  }, [])

  // Check if Vapi is ready
  useEffect(() => {
    const checkVapi = setInterval(() => {
      if (vapi) {
        setVapiReady(true)
        clearInterval(checkVapi)
      }
    }, 500)

    return () => clearInterval(checkVapi)
  }, [])

  // Update the fetchCampaignData function to prioritize URL parameters over database lookup
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const campaign = urlParams.get("campaign")
        const urlOverrides = urlParams.get("overrides")
        const urlHeading = urlParams.get("heading")
        const urlText = urlParams.get("text")
        const hasImage = urlParams.get("hasImage") === "true"

        console.log("URL Parameters:", {
          campaign,
          urlOverrides: urlOverrides ? "present" : "not present",
          urlHeading,
          urlText,
          hasImage,
        })

        if (!campaign) {
          setError("No campaign specified")
          setIsLoading(false)
          return
        }

        setCampaignName(campaign)

        // If we have overrides in the URL, use them directly
        if (urlOverrides) {
          try {
            const parsedOverrides = JSON.parse(decodeURIComponent(urlOverrides))
            console.log("Using overrides from URL:", parsedOverrides)

            // Set up the campaign data with URL parameters
            setCampaignData({
              reportData: {
                overrides: parsedOverrides,
                headingText: urlHeading || "Participate in our survey",
                surveyText: urlText || "",
                // We'll still need to fetch the image from the database if it exists
              },
            })

            // Set the UI elements from URL parameters
            setHeadingText(urlHeading || "Participate in our survey")
            setSurveyText(urlText || "")

            // If there's an image, we still need to fetch it from the database
            if (hasImage) {
              await fetchImageFromDatabase(campaign)
            } else {
              setIsLoading(false)
            }

            return // Skip database lookup for other data
          } catch (error) {
            console.error("Error parsing overrides from URL:", error)
            // Fall back to database lookup if URL parsing fails
          }
        }

        // If we don't have URL parameters or parsing failed, fetch from database
        console.log("Falling back to database lookup for campaign data")

        // Fetch campaign data from the database
        const response = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization:
              "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
          },
          body: JSON.stringify({
            sql: `SELECT * FROM james WHERE campaign_name = '${campaign}' LIMIT 1`,
            database: "campaigns",
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.data || result.data.length === 0) {
          throw new Error("Campaign not found")
        }

        const campaignRecord = result.data[0]
        const reportData = JSON.parse(campaignRecord.report || "{}")

        setCampaignData({
          ...campaignRecord,
          reportData,
        })

        console.log("Loaded campaign data from database:", campaignRecord)
        console.log("Parsed report data:", reportData)
        if (reportData.overrides) {
          console.log("Campaign overrides from database:", reportData.overrides)
        }

        // Set the UI elements from the campaign data
        setHeadingText(reportData.headingText || "Participate in our survey")
        setSurveyText(reportData.surveyText || "")
        setImageUrl(reportData.imageBase64 || null)
      } catch (error) {
        console.error("Error fetching campaign data:", error)
        setError("Failed to load campaign data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    // Helper function to fetch just the image from the database
    const fetchImageFromDatabase = async (campaign: string) => {
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
            sql: `SELECT report FROM james WHERE campaign_name = '${campaign}' LIMIT 1`,
            database: "campaigns",
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.data && result.data.length > 0) {
          const reportData = JSON.parse(result.data[0].report || "{}")
          setImageUrl(reportData.imageBase64 || null)
        }
      } catch (error) {
        console.error("Error fetching image from database:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaignData()
  }, [])

  // Set up Vapi event listeners when it's ready
  useEffect(() => {
    if (!vapiReady || !vapi) return

    try {
      console.log("Setting up Vapi event listeners")

      vapi.on("call-start", () => {
        console.log("Vapi call-start event fired")
        setCallStatus("active")
      })

      vapi.on("call-end", () => {
        console.log("Vapi call-end event fired")
        setCallStatus("inactive")
        setCallCompleted(true)
        // Record the call completion in the database
        if (email && callId) {
          recordCallCompletion()
        }
      })

      return () => {
        try {
          console.log("Removing Vapi event listeners")
          vapi.removeAllListeners()
        } catch (err) {
          console.error("Error removing Vapi listeners:", err)
        }
      }
    } catch (err) {
      console.error("Error setting up Vapi listeners:", err)
    }
  }, [vapiReady, email, callId])

  const recordCallCompletion = async () => {
    if (!callId) {
      console.error("No call ID available")
      return
    }

    try {
      // Update the existing record with the completed status
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
UPDATE james 
SET report = 'completed' 
WHERE campaign_name = '${campaignName}' AND number = '${email}' AND call_id = '${callId}'
`,
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        console.error("Failed to update call completion status")
      }

      console.log("Call completion recorded successfully for ID:", callId)
    } catch (error) {
      console.error("Error recording call completion:", error)
    }
  }

  // Update the startBrowserCall function to use overrides from URL or campaign data
  const startBrowserCall = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address")
      return
    }

    if (!campaignData) {
      alert("Campaign data not loaded")
      return
    }

    if (!vapi || !vapiReady) {
      alert("Voice service is not available. Please try again later.")
      return
    }

    setCallStatus("loading")

    try {
      // Get the overrides from the campaign data
      const overrides = campaignData.reportData.overrides || {}
      console.log("Using overrides for call:", overrides)

      // Start the call in the browser and capture the returned call object
      const callResponse = await vapi.start("a272b74b-3520-4124-a179-893c87dd7786", overrides)

      // Extract the call ID from the response
      const newCallId = callResponse?.id || `unknown-${Date.now()}`
      setCallId(newCallId)

      // Record the call in the database immediately
      await recordCallStart(newCallId)

      // Manually set call status to active after successful call start
      console.log("Call started successfully, setting status to active")
      setCallStatus("active")

      // Add a fallback timeout in case the event listener doesn't fire
      setTimeout(() => {
        setCallStatus((currentStatus) => {
          if (currentStatus === "loading") {
            console.log("Fallback: Setting call status to active after timeout")
            return "active"
          }
          return currentStatus
        })
      }, 3000)
    } catch (error) {
      console.error("Error starting call:", error)
      setCallStatus("inactive")
      alert("Failed to start the call. Please try again.")
    }
  }

  const recordCallStart = async (newCallId: string) => {
    try {
      // Record the email and call ID in the database
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
INSERT INTO james (campaign_name, number, call_id, report, questions)
VALUES ('${campaignName}', '${email}', '${newCallId}', 'in-progress', '${campaignData?.questions || ""}')
`,
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        console.error("Failed to record call start")
      }

      console.log("Call start recorded successfully with ID:", newCallId)
    } catch (error) {
      console.error("Error recording call start:", error)
    }
  }

  // Update the stopCall function to set callCompleted to true
  const stopCall = () => {
    if (!vapi || !vapiReady) return

    setCallStatus("loading")
    try {
      vapi.stop()

      // Manually record call completion when user ends the call
      if (email && callId) {
        recordCallCompletion()
      }

      // Set call as completed
      setCallCompleted(true)
      setCallStatus("inactive")
    } catch (err) {
      console.error("Error stopping call:", err)
      setCallStatus("inactive")
      setCallCompleted(true)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">{headingText}</h1>

      {imageUrl && (
        <div className="mb-6">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Survey"
            className="w-full rounded-lg object-contain max-h-80"
          />
        </div>
      )}

      <div className="space-y-6">
        <p className="text-base mb-4">{surveyText || "No survey information provided."}</p>

        {callCompleted ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Thank you for sharing your insights!</h2>
            <p className="text-gray-600">Your feedback is valuable and will help us improve our services.</p>
          </div>
        ) : (
          callStatus === "inactive" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Your Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={startBrowserCall}
                disabled={!email || !email.includes("@") || !vapiReady}
              >
                {vapiReady ? "Start Interview" : "Loading voice service..."}
              </Button>
            </div>
          )
        )}

        {callStatus === "loading" && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Connecting...</p>
          </div>
        )}

        {callStatus === "active" && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">Interview in progress</p>
              <p className="text-sm text-green-600 mt-1">Please speak clearly into your microphone</p>
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={stopCall}>
              End Interview
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

