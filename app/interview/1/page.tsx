"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function StepOnePage() {
  const [objective, setObjective] = useState("")
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
              content: `You will act as an analyzer of key points. Given the user input, return a list of three key insights picked up from their query, along with three targeted questions to address these insights for survey purposes.  

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
          temperature: 0.2,
          max_completion_tokens: 1024,
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Set interview objective</h1>
        <p className="text-gray-400 mb-4">
          Describe the issue you&apos;d like to investigate with customer interviews.
        </p>
      </div>

      <Textarea
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="Describe your objective... For example: You are interviewing for TravelXYZ.com, a travel booking site where you can purchase flights and hotels. I want to investigate why there are so many users that churn after making their first flight purchase specifically in the UK, where logo retention is 30pp than other markets."
        className="min-h-[150px] bg-white/5 border-white/10"
      />

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={!objective.trim() || isLoading}
        >
          {isLoading ? "Generating..." : "Generate questions with AI"}
        </Button>
      </div>

      {generatedQuestions.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-bold">Generated Questions</h2>
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
  )
}

