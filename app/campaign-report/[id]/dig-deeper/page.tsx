"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import AppLayout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

const GROQ_API_KEY = "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"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

const renderContent = (content: string) => {
  // Function to render tables
  const renderTable = (tableContent: string) => {
    const rows = tableContent.split("\n").filter((row) => row.trim() !== "")
    const headers = rows[0]
      .split("|")
      .map((header) => header.trim())
      .filter(Boolean)
    const body = rows.slice(2) // Skip the separator row

    return (
      <table className="w-full border-collapse my-4">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="border border-gray-300 px-4 py-2 text-left font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.split("|").map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                  {cellIndex === 0 ? <strong>{cell.trim()}</strong> : cell.trim()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // Split content into sections (normal text and tables)
  const sections = content.split(/(\n\|[\s\S]*?\|\n)/)

  return sections.map((section, index) => {
    if (section.trim().startsWith("|") && section.trim().endsWith("|")) {
      // This section is a table
      return renderTable(section)
    } else {
      // This section is normal text
      const lines = section.split("\n")
      return lines.map((line, lineIndex) => {
        if (line.startsWith("####")) {
          return (
            <h4 key={`${index}-${lineIndex}`} className="font-bold text-lg mt-4 mb-2">
              {line.slice(4).trim()}
            </h4>
          )
        } else if (line.startsWith("###")) {
          return (
            <h3 key={`${index}-${lineIndex}`} className="font-bold text-xl mt-6 mb-3">
              {line.slice(3).trim()}
            </h3>
          )
        } else if (line.startsWith("##")) {
          return (
            <h2 key={`${index}-${lineIndex}`} className="font-bold text-2xl mt-8 mb-4">
              {line.slice(2).trim()}
            </h2>
          )
        } else if (line.startsWith("#")) {
          return (
            <h1 key={`${index}-${lineIndex}`} className="font-bold text-3xl mt-10 mb-5">
              {line.slice(1).trim()}
            </h1>
          )
        } else if (line.startsWith("* ")) {
          return (
            <li key={`${index}-${lineIndex}`} className="ml-4 my-1">
              {line.slice(2).trim()}
            </li>
          )
        } else if (line.startsWith("- ")) {
          return (
            <li key={`${index}-${lineIndex}`} className="ml-4 my-1">
              {line.slice(2).trim()}
            </li>
          )
        } else {
          // Handle inline formatting
          const formattedLine = line
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
          return (
            <p key={`${index}-${lineIndex}`} className="my-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
          )
        }
      })
    }
  })
}

export default function DigDeeperPage() {
  const params = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const transcript = localStorage.getItem("transcript")
    if (transcript) {
      setMessages([
        {
          role: "system",
          content: `${transcript}\n\n\nBegin now\n`,
        },
      ])
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")
    setIsLoading(true)

    const allMessages = [...messages, userMessage]

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      const decoder = new TextDecoder("utf-8")
      const assistantMessage: Message = { role: "assistant", content: "" }
      setMessages((prevMessages) => [...prevMessages, assistantMessage])

      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmedLine = line.replace(/^data: /, "").trim()
          if (trimmedLine === "" || trimmedLine === "[DONE]") continue

          try {
            const parsedLine = JSON.parse(trimmedLine)
            const content = parsedLine.choices[0]?.delta?.content || ""
            if (content) {
              assistantMessage.content += content
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages]
                updatedMessages[updatedMessages.length - 1] = {
                  ...assistantMessage,
                  content: assistantMessage.content,
                }
                return updatedMessages
              })
            }
          } catch (e) {
            console.warn("Failed to parse line:", trimmedLine)
            // Continue to the next line instead of breaking the loop
          }
        }
      }
    } catch (error) {
      console.error("Error in sendMessage:", error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Sorry, an error occurred. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <Card className="h-[calc(100vh-6rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Dig Deeper: {params.id}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="flex-grow overflow-y-auto mb-4 space-y-4">
            {messages.slice(1).map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${
                  message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                } max-w-[80%] ${message.role === "user" ? "self-end" : "self-start"}`}
              >
                {message.role === "assistant" ? renderContent(message.content) : message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-grow"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <Button onClick={sendMessage} disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  )
}

