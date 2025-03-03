"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import AppLayout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { RefreshCw, Sparkles, Download } from "lucide-react"

// Import the PieChart components from recharts at the top of the file
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

const mockData = {
  summary: {
    content:
      "Majority of users do not want money to leave accounts in Monrovia. MTN Cash is the most preferred cash-out option for money transfers. Most users want money to stay in receivers' bank accounts.",
  },
  originalQuestionsAnalysis: {
    question1: {
      question: "What could the issues be?",
      response: "The user did not provide any specific issues or challenges they are facing.",
    },
    question2: {
      question: "What specific actions were taken?",
      response: "The user did not mention any specific actions they took or plan to take.",
    },
    question3: {
      question: "Who will take these actions?",
      response: "The user did not mention any specific actions they took or plan to take.",
    },
    question4: {
      question: "additional?",
      response: "The user mentioned that there were issues with the app when they clicked the home button.",
    },
    question_ai: {
      question: "What were the key points spoken?",
      response: "The user mentioned that there were issues with the app when they clicked the home button.",
    },
  },
  keyIssuesIdentified: {
    "Money Transfer": 7,
    "Bank Partnerships": 4,
    "Account Creation": 2,
    "User Experience": 1,
  },
  breakthroughInsights: {
    synthesisedInsights: [
      { insight: "Local account preference", source: "User feedback on account retention" },
      { insight: "MTN Cash popularity", source: "Transaction data analysis" },
      { insight: "Simplify account creation", source: "User experience reports" },
      { insight: "Transfer fee concerns", source: "Customer support inquiries" },
      { insight: "Mobile app usage growth", source: "App analytics" },
      { insight: "Improve support response", source: "Customer service logs" },
      { insight: "International transfer demand", source: "Market research" },
    ],
  },
  totalResponses: {
    value: 18,
  },
}

export default function CampaignReportPage() {
  const params = useParams()
  const router = useRouter()
  const [campaignName, setCampaignName] = useState("")
  const [campaignData, setCampaignData] = useState<any>(null)
  const [hoveredInsight, setHoveredInsight] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCooldown, setRefreshCooldown] = useState(0)
  const [transcript, setTranscript] = useState<string>("")
  // Add a new state variable for metrics data
  const [metricsData, setMetricsData] = useState<any>(null)

  const downloadTranscript = (transcript: string) => {
    const element = document.createElement("a")
    const file = new Blob([transcript], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${campaignName}_transcript.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const fetchCampaignData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Fetching campaign data for:", campaignName)

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
            SELECT 
              number, 
              call_id, 
              transcript, 
              questions,
              (SELECT COUNT(*) FROM campaigns WHERE campaign_name = '${campaignName}') as total_calls,
              (SELECT COUNT(*) FROM campaigns WHERE campaign_name = '${campaignName}' AND call_ended = '✓') as successful_calls
            FROM campaigns 
            WHERE campaign_name = '${campaignName}'
          `,
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("API Response:", result)

      if (result.error) {
        throw new Error(`API error: ${result.error}`)
      }

      // Process the data
      let allTranscripts = ""
      let questions = ""
      let totalCalls = 0
      let successfulCalls = 0

      result.data.forEach(
        (item: {
          number: string
          call_id: string
          transcript: string
          questions: string
          total_calls: number
          successful_calls: number
        }) => {
          // Set total_calls and successful_calls from the first row (they'll be the same for all rows)
          if (totalCalls === 0) {
            totalCalls = item.total_calls
            successfulCalls = item.successful_calls
          }

          // Concatenate all transcripts
          if (item.transcript) {
            allTranscripts += item.transcript + " "
          }

          // Get the last non-empty questions entry
          if (item.questions) {
            questions = item.questions
          }
        },
      )

      // After the forEach loop, add:
      if (!questions) {
        questions = "No questions found for this campaign"
      }
      console.log("Final questions:", questions)

      console.log("Processed data:")
      console.log("Total calls:", totalCalls)
      console.log("Successful calls:", successfulCalls)
      console.log("All transcripts:", allTranscripts)
      console.log("Questions:", questions)

      // Calculate conversion rate
      const conversionRate = (successfulCalls / totalCalls) * 100

      // Trim the concatenated transcripts
      allTranscripts = allTranscripts.trim()

      // Store transcript and questions in localStorage
      localStorage.setItem(`transcript`, allTranscripts)
      localStorage.setItem(`questions`, questions)

      // Console log the transcript and questions
      console.log("Stored in localStorage:")
      console.log("Campaign Transcript:", localStorage.getItem(`transcript`))
      console.log("Campaign Questions:", localStorage.getItem(`questions`))

      // New API call to analyze the data
      const prompt = `Act as a user research interview analyst and extract extract the information and insights from a given transcript to answer the supplied questions as best as possible. Ignore vague or general comments that do not translate to a tangible product enhancement. For each issue: 1. Synthesize it into a specific problem statement that directly suggests an improvement (e.g., 'Fix the unresponsive booking button' instead of 'Ensure users can complete bookings'). 2. Include the exact timestamp in UTC format from the transcript. 3. Retain the original user comment as the source. Additionally provide: - Sentiment. - Total User Responses (count of all user messages in the transcript). - Issues Identified (count of unique issues extracted). - Actionable Items (count of issues that result in tangible product improvements). Provide also based on the original questions included in the transcript an objective analysis for each of them. If the question cannot be inferred it was answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the call, still provide it and do you best to produce an analysis for that question but make sure you also say it wasn't answered in the analysis itself. Example Input: Questions: 'What could the issues be?, What specific actions were taken? Who will take these actions?', Transcript: { 'role': 'bot', 'time': 1738067847350, 'source': '', 'endTime': 1738067854080, 'message': 'Hi. Thanks for taking part in our proximity survey. I'm calling from travel dot com and was wondering if you can spare 5 minutes.', 'duration': 6280, 'secondsFromStart': 1.4399999 } { 'role': 'user', 'time': 1738067855150, 'endTime': 1738067855650, 'message': 'Yes.', 'duration': 500, 'secondsFromStart': 9.24 } { 'role': 'bot', 'time': 1738067857280, 'source': '', 'endTime': 1738067868570, 'message': 'Thank you so much. I noticed you haven't made a first transaction yet, and I was curious to understand if there's anything we could have done better to make your experience more seamless. Or if something was preventing you from booking.', 'duration': 10920.0009765625, 'secondsFromStart': 11.37 } { 'role': 'user', 'time': 1738067870090, 'endTime': 1738067871830, 'message': 'I don't think you could have done anything', 'duration': 1740, 'secondsFromStart': 24.18 } { 'role': 'bot', 'time': 1738067873949.999, 'source': '', 'endTime': 1738067884219.998, 'message': 'I appreciate your honesty. You don't mind me asking, what was your primary reason for signing up? Was there anything specific you were hoping to find or achieve on our platform?', 'duration': 9409.9990234375, 'secondsFromStart': 28.039999 } { 'role': 'user', 'time': 1738067885730, 'endTime': 1738067887170, 'message': 'I just wanna set up a booking.', 'duration': 1440, 'secondsFromStart': 39.82 } { 'role': 'bot', 'time': 1738067888100, 'source': '', 'endTime': 1738067897680, 'message': 'Got it. So you're looking to make a booking Can I ask if there are any particular features or aspect of our platform that you enjoy so far? And are there any additional features', 'duration': 9190, 'secondsFromStart': 42.19 } { 'role': 'user', 'time': 1738067896670.002, 'endTime': 1738067902230, 'message': 'No. It's a pretty crappy platform because I tried to make a booking and it didn't work. Like, the button wouldn't work.', 'duration': 5399.998046875, 'secondsFromStart': 50.760002 } { 'role': 'bot', 'time': 1738067902780.003, 'source': '', 'endTime': 1738067919250, 'message': 'I'm really sorry to hear that you had a frustrating button. That definitely sounds like something we need to address. Can you tell me more about what happened? Were there any error messages or did the button simply not respond? Your feedback could really help us improve.', 'duration': 13610.0009765625, 'secondsFromStart': 56.870003 } { 'role': 'user', 'time': 1738067921050, 'endTime': 1738067921870, 'message': 'I don't know. I just didn't', 'duration': 820, 'secondsFromStart': 75.14 } { 'role': 'bot', 'time': 1738067922200, 'source': '', 'endTime': 1738067922940, 'message': 'I under', 'duration': 740, 'secondsFromStart': 76.29 } { 'role': 'user', 'time': 1738067922670, 'endTime': 1738067926490, 'message': 'respond. I I tried to click it and a couple of times, but it just didn't respond.', 'duration': 3820, 'secondsFromStart': 76.76 } { 'role': 'bot', 'time': 1738067927750, 'source': '', 'endTime': 1738067947390, 'message': 'Thank you for sharing that. It sounds really frustrating when a button doesn't respond. Especially when you're trying to book something. We definitely wanna make that process as smooth as possible. Is there anything else that you think we could improve on? Or any features you'd like to see added to the platform? Your insights are really', 'duration': 16299.990234375, 'secondsFromStart': 81.84 } { 'role': 'user', 'time': 1738067949360, 'endTime': 1738067950450, 'message': 'I don't think so.', 'duration': 1090, 'secondsFromStart': 103.45 } { 'role': 'bot', 'time': 1738067951160, 'source': '', 'endTime': 1738067960879.99, 'message': 'I appreciate your feedback. It's really valuable for us as we work improve the platform. Just to recap, UV Thank you for your time today.', 'duration': 8549.989990234375, 'secondsFromStart': 105.25 } { 'role': 'user', 'time': 1738067957879.99, 'endTime': 1738067958620, 'message': 'Thank you.', 'duration': 740.010009765625, 'secondsFromStart': 111.96999 } { 'role': 'bot', 'time': 1738067961110.005, 'source': '', 'endTime': 1738067966809.994, 'message': 'I really appreciate your valuable feedback, and I hope you'll find Travel dot com useful your future travels.', 'duration': 5409.9951171875, 'secondsFromStart': 115.200005 } Expected Output (as a string, make the thing conform to the information in the real interview the example is just to show how it can be formatted for example): { "summary": { "content": "Majority of users do not want money to leave accounts in Monrovia. MTN Cash is the most preferred cash-out option for money transfers. Most users want money to stay in receivers' bank accounts." }, "originalQuestionsAnalysis": { "question1": { "question": "What could the issues be?", "response": "The user did not provide any specific issues or challenges they are facing." }, "question2": { "question": "What specific actions were taken?", "response": "The user did not mention any specific actions they took or plan to take." }, "question3": { "question": "Who will take these actions?", "response": "There are no actions identified that need to be taken by anyone." }, "question_ai": { "question": "What were the key points spoken?", "response": "The user mentioned that there were issues with the app when they clicked the home button." } }, "keyIssuesIdentified": { "Money Transfer": 7, "Bank Partnerships": 4, "Account Creation": 2, "User Experience": 1 }, "breakthroughInsights": { "synthesisedInsights": [ { "insight": "Local account preference", "source": "User feedback on account retention" }, { "insight": "MTN Cash popularity", "source": "Transaction data analysis" }, { "insight": "Simplify account creation", "source": "User experience reports" }, { "insight": "Transfer fee concerns", "source": "Customer support inquiries" }, { "insight": "Mobile app usage growth", "source": "App analytics" }, { "insight": "Improve support response", "source": "Customer service logs" }, { "insight": "International transfer demand", "source": "Market research" } ] }, "totalResponses": { "value": 18 } }  General guidelines: Make sure the output format is in json string as specified (as a string but without the json tag). Ensure key issues identified conform to the number of mentions of those words or context which can be insightful for the analyst looking at the results. Make sure the number of responses are accurately calculated so they cannot be changed. Make sure the insights and answers are provided in the same language as the transcript when returning a response. For example if the transcript is in french, the insights generated and responses must also be in french. Ensure the totalResponses is a count of User: and AI: interaction counts. Ensure the source contains both the AI question and the user response (in the same line) relevant for the extracted insight (for eg. if the insight is user found service to be excellent. the source is like AI: What made you say that? User: Well your service was really good) Provide the top 7-8 insights form these transcripts and questions. Provide only the json formatted string, nothing else. Here is the data to analyse and questions now:`

      const analysisResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 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",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: `Questions: ${questions} Transcript: ${allTranscripts}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error(`HTTP error! status: ${analysisResponse.status}`)
      }

      const analysisResult = await analysisResponse.json()
      console.log("Raw Analysis Result:", analysisResult)

      // Make a second API call to extract metrics from the transcript
      const metricsResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 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",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                'Here\'s a well-structured prompt based on your requirements:\n\n---\n\n### **UX Analyzer for Key Metrics Extraction from Transcripts**\n**Role:**  \nYou are an advanced UX analyst specializing in extracting key insights from qualitative data. Your task is to analyze user responses in transcripts and identify the top 4 most mentioned issues or keywords in response to specific questions. You will also count the number of times each issue is mentioned to quantify its significance.\n\n**Instructions:**  \n- Given a transcript, analyze responses for each question.\n- Extract the top 4 most mentioned issues or keywords.\n- Count the occurrences of each issue within the context of the response.\n- Provide the output in JSON format.\n\n**Output Format Example:**  \n```json\n{\n  "question1": {\n    "question": "What do you like about the product?",\n    "metrics": {\n      "ease of use": 5,\n      "design": 3,\n      "performance": 2,\n      "price": 2\n    }\n  },\n  "question2": {\n    "question": "What challenges do you face with the product?",\n    "metrics": {\n      "slow performance": 4,\n      "bugs": 3,\n      "high cost": 2,\n      "complex UI": 2\n    }\n  }\n}\n```\n\n**Few-Shot Example:**  \n\n**transcript:**  \nHuman: I really love how easy the product is to use. The interface is intuitive, and I never feel lost. But I do wish it had more customization options.\nAI: Noted, ease of use and intuitive interface are positives, while lack of customization is a concern.\n\nHuman: The design is sleek and modern, which I appreciate. However, the performance can sometimes be slow when loading data-heavy tasks.\nAI: Design aesthetics are a positive aspect, while slow performance is a noted issue.\n\nquestions:\n1. What do you like about the product?  \n2. What challenges do you face with the product?  \n\n**Expected Output:**  \n{\n  "question1": {\n    "question": "What do you like about the product?",\n    "metrics": {\n      "ease of use": 1,\n      "intuitive interface": 1,\n      "sleek design": 1,\n      "modern aesthetics": 1\n    }\n  },\n  "question2": {\n    "question": "What challenges do you face with the product?",\n    "metrics": {\n      "lack of customization": 1,\n      "slow performance": 1\n    }\n  }\n}\n**General Guidelines**\nOnly provide the json object as the output without the json tags.\n\nHere is the data you need to use now:',
            },
            {
              role: "user",
              content: `Questions: ${questions} Transcript: ${allTranscripts}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      })

      if (!metricsResponse.ok) {
        console.warn("Metrics extraction API call failed, continuing without metrics")
      } else {
        const metricsResult = await metricsResponse.json()
        console.log("Metrics Analysis Result:", metricsResult)

        try {
          const parsedMetrics = JSON.parse(metricsResult.choices[0].message.content)
          console.log("Parsed Metrics:", parsedMetrics)
          setMetricsData(parsedMetrics)
        } catch (error) {
          console.error("Error parsing metrics data:", error)
        }
      }

      // Parse the content from the analysis result
      const parsedContent = JSON.parse(analysisResult.choices[0].message.content)
      console.log("Parsed Analysis Content:", parsedContent)

      // Update the mockData with the new analysis
      const updatedMockData = {
        ...mockData,
        summary: parsedContent.summary,
        originalQuestionsAnalysis: parsedContent.originalQuestionsAnalysis,
        keyIssuesIdentified: parsedContent.keyIssuesIdentified,
        breakthroughInsights: parsedContent.breakthroughInsights,
        totalResponses: parsedContent.totalResponses,
      }

      // Update the state with the new data
      setCampaignData({
        ...updatedMockData,
        conversionRate: conversionRate,
        totalCalls: totalCalls,
        successfulCalls: successfulCalls,
        averageConversationTime: "3m", // This is a placeholder, you might want to calculate this based on your data
      })

      setTranscript(allTranscripts)

      console.log("Updated Campaign Data:", updatedMockData)
    } catch (err) {
      console.error("Error fetching campaign data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
      setRefreshCooldown(10) // Start the cooldown
    }
  }, [campaignName])

  useEffect(() => {
    const decodedCampaignName = decodeURIComponent(params.id as string)
    setCampaignName(decodedCampaignName)
  }, [params.id])

  useEffect(() => {
    if (campaignName) {
      fetchCampaignData()
    }
  }, [campaignName, fetchCampaignData])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (refreshCooldown > 0) {
      timer = setInterval(() => {
        setRefreshCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [refreshCooldown])

  if (error) {
    return <div>Error: {error}</div>
  }

  if (isLoading || !campaignData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-xl font-semibold">Synthesising calls with AI</p>
      </div>
    )
  }

  const keyIssuesChartData = Object.entries(campaignData.keyIssuesIdentified).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold">{campaignName}</h1>
            <div className="space-x-2">
              <Button
                onClick={fetchCampaignData}
                disabled={isLoading || refreshCooldown > 0}
                variant="outline"
                size="icon"
                className="bg-gray-100 hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => router.push(`/campaign-report/${encodeURIComponent(campaignName)}/dig-deeper`)}
                variant="outline"
                size="icon"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => downloadTranscript(transcript)}
                variant="outline"
                size="icon"
                className="bg-gray-100 hover:bg-gray-200"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{campaignData.totalCalls}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{campaignData.conversionRate.toFixed(2)}%</p>
                <Progress value={campaignData.conversionRate} className="mt-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average time of conversation</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const totalSeconds = campaignData.totalResponses.value * 5
                    const minutes = Math.floor(totalSeconds / 60)
                    const seconds = totalSeconds % 60
                    return `${minutes}m ${seconds}s`
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">{campaignData.summary.content}</ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Original Questions & Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(campaignData.originalQuestionsAnalysis).map(
                ([key, value]: [string, any], index: number) => (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-purple-600 font-semibold mb-2">Question {index + 1}</h3>
                      <p className="font-semibold mb-2">{value.question}</p>
                      <p className="text-gray-600">{value.response}</p>
                    </div>
                    {metricsData && metricsData[`question${index + 1}`] ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={Object.entries(metricsData[`question${index + 1}`].metrics)
                                  .filter(([_, value]) => value > 0)
                                  .map(([name, value]) => ({
                                    name,
                                    value,
                                  }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {Object.entries(metricsData[`question${index + 1}`].metrics)
                                  .filter(([_, value]) => value > 0)
                                  .map((_, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"][index % 5]}
                                    />
                                  ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name) => [
                                  `${value} (${(((value as number) / Object.values(metricsData[`question${index + 1}`].metrics).reduce((a, b) => a + b, 0)) * 100).toFixed(0)}%)`,
                                  name,
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground">No metrics data available for this question</p>
                      </div>
                    )}
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Issues Identified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={keyIssuesChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5" /> Breakthrough insights
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-4">Synthesised insights</h3>
                <div className="flex flex-wrap gap-2">
                  {campaignData.breakthroughInsights.synthesisedInsights.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm cursor-help"
                      onMouseEnter={() => setHoveredInsight(item)}
                      onMouseLeave={() => setHoveredInsight(null)}
                    >
                      {item.insight}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Source</h3>
                <div className="bg-muted p-4 rounded-lg h-[200px] overflow-y-auto">
                  {hoveredInsight ? (
                    <p className="text-sm">{hoveredInsight.source}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hover over an insight to see its source here.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </AppLayout>
  )
}

