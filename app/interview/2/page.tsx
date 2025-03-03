"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function StepTwoPage() {
  const searchParams = useSearchParams()
  const [showIcon, setShowIcon] = useState(false)
  const [animatedQuestions, setAnimatedQuestions] = useState<string[]>(["", "", ""])
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    const question1 = searchParams.get("question1") || ""
    const question2 = searchParams.get("question2") || ""
    const question3 = searchParams.get("question3") || ""
    const insight1 = searchParams.get("insight1") || ""
    const insight2 = searchParams.get("insight2") || ""
    const insight3 = searchParams.get("insight3") || ""

    setAnimatedQuestions([question1, question2, question3])
    setInsights([insight1, insight2, insight3])

    setShowIcon(true)
    const questionAnimationTimer = setTimeout(() => {
      animateQuestions([question1, question2, question3])
    }, 500)

    return () => {
      clearTimeout(questionAnimationTimer)
    }
  }, [searchParams])

  const animateQuestions = (questions: string[]) => {
    questions.forEach((question, questionIndex) => {
      setTimeout(() => {
        let i = 0
        const intervalId = setInterval(() => {
          if (i <= question.length) {
            setAnimatedQuestions((prev) => {
              const newAnimated = [...prev]
              newAnimated[questionIndex] = question.slice(0, i)
              return newAnimated
            })
            i++
          } else {
            clearInterval(intervalId)
          }
        }, 10)
      }, questionIndex * 1000)
    })
  }

  const handleSubmit = () => {
    // Handle form submission here
    console.log("Submitting questions:", animatedQuestions)
  }

  return (
    <div className="space-y-6">
      <div className="mb-10">
        <div
          className={`mb-4 transition-all duration-500 ${
            insights.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-purple-600 text-2xl">Analyzing issue with AI</span>
        </div>
        <div className="bg-transparent p-4 rounded-2xl">
          <div className="flex flex-col gap-4 text-sm">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="bg-transparent text-white p-4 rounded-lg shadow-lg transition-all duration-500 transform border-2 border-purple-600 opacity-100 translate-y-0"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">Review and edit survey questions</h1>
      </div>

      <div className="space-y-4">
        {animatedQuestions.map((question, index) => (
          <Textarea
            key={index}
            value={question}
            onChange={(e) => {
              const newQuestions = [...animatedQuestions]
              newQuestions[index] = e.target.value
              setAnimatedQuestions(newQuestions)
            }}
            placeholder={`Question ${index + 1}`}
            className="bg-white/5 border-white/10 min-h-[100px]"
          />
        ))}
      </div>

      <p className="text-sm text-gray-400">Demo is limited to 3 questions only</p>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={animatedQuestions.some((q) => !q.trim())}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

