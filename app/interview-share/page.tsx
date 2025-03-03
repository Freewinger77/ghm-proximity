"use client"

import { useState, useEffect } from "react"
import { getStoredOverrides } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone } from "lucide-react"

async function placeCall(phoneNumber: string, countryCode: string, overrides: any) {
  const fullNumber = `${countryCode}${phoneNumber}`
  const requestBody = {
    assistantId: "ee2561fb-ce75-40d5-abca-13bb74356e9d",
    assistantOverrides: overrides,
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
    console.log("Call placed successfully:", data)
    return data
  } catch (error) {
    console.error("Error placing call:", error)
    throw error
  }
}

export default function InterviewSharePage() {
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [surveyText, setSurveyText] = useState("")
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<any>({})

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const text = urlParams.get("text")
    if (text) {
      setSurveyText(decodeURIComponent(text))
    }

    // Load the stored overrides
    const storedOverrides = getStoredOverrides()
    setOverrides(storedOverrides)
    console.log("Loaded assistant overrides in InterviewSharePage:", storedOverrides) // Add this line
  }, [])

  const handleBeginCall = async () => {
    if (!showPhoneInput) {
      setShowPhoneInput(true)
      return
    }

    try {
      // Use the overrides loaded in the component state
      console.log("Placing call with overrides:", overrides) // Add this line
      const response = await placeCall(phoneNumber, countryCode, overrides)
      setCallStatus(`Call placed successfully! Call ID: ${response.id}`)
    } catch (error) {
      console.error("Failed to place call:", error)
      setCallStatus("Failed to place call. Please try again.")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Participate in our survey</h1>
      <div className="space-y-6">
        <p className="text-base mb-4">{surveyText || "No survey information provided."}</p>

        {showPhoneInput ? (
          <div className="flex gap-4">
            <div className="w-1/3">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+33">France (+33)</SelectItem>
                  <SelectItem value="+44">UK (+44)</SelectItem>
                  <SelectItem value="+1">US (+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleBeginCall}
          disabled={showPhoneInput && (!countryCode || !phoneNumber || callStatus !== null)}
        >
          <Phone className="h-4 w-4" />
          {showPhoneInput ? "Place Call" || "Begin Call" : "Enter Phone Number"}
        </Button>
        {callStatus && <p className="mt-2 text-sm text-center text-gray-600">{callStatus}</p>}
      </div>
    </div>
  )
}

