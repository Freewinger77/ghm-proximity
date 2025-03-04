"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Trash2, Calendar, FileText, RefreshCw } from "lucide-react"
import { format, parseISO } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import type { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import { useRouter } from "next/navigation"

interface Campaign {
  id: number
  campaign_name: string
  number: string
  call_id: string
  report: string
  call_date: string
  short_text: string | null
  call_ended: string | null
}

interface GroupedCampaign {
  campaign_name: string
  latest_call_date: string
  calls: Campaign[]
}

export default function ReportsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<GroupedCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<GroupedCampaign | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      console.log("Fetching campaigns...")
      const response = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization:
            "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
        },
        body: JSON.stringify({
          sql: "SELECT * FROM campaigns ORDER BY call_date DESC",
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`API error: ${result.error}`)
      }

      if (!Array.isArray(result.data)) {
        throw new Error(`Unexpected response format: ${JSON.stringify(result)}`)
      }

      // Group campaigns by name and sort by latest call date
      const groupedCampaigns = result.data.reduce((acc: GroupedCampaign[], campaign: Campaign) => {
        const existingCampaign = acc.find((c) => c.campaign_name === campaign.campaign_name)
        if (existingCampaign) {
          existingCampaign.calls.push(campaign)
          if (campaign.call_date > existingCampaign.latest_call_date) {
            existingCampaign.latest_call_date = campaign.call_date
          }
        } else {
          acc.push({
            campaign_name: campaign.campaign_name,
            latest_call_date: campaign.call_date,
            calls: [campaign],
          })
        }
        return acc
      }, [])

      // Sort grouped campaigns by latest call date
      groupedCampaigns.sort((a, b) => new Date(b.latest_call_date).getTime() - new Date(a.latest_call_date).getTime())

      setCampaigns(groupedCampaigns)
      setError(null)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setError(`Failed to fetch campaigns: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    }
  }

  const refreshCampaigns = async () => {
    setIsRefreshing(true)
    try {
      // Step 1: Query the campaigns table for call IDs with null call_ended
      const response = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization:
            "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
        },
        body: JSON.stringify({
          sql: "SELECT call_id FROM campaigns WHERE call_ended IS NULL",
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const callIds = result.data.map((row: { call_id: string }) => row.call_id)

      console.log("Call IDs to process:", callIds)

      // Step 2: Check logs for each call ID
      let updatedCount = 0
      for (const [index, callId] of callIds.entries()) {
        if (!callId) {
          console.log(`[${index + 1}/${callIds.length}] Skipping invalid call ID: ${callId}`)
          continue
        }

        try {
          console.log(`[${index + 1}/${callIds.length}] Processing call ID: ${callId}`)
          const logsResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
            headers: {
              Authorization: "Bearer 7f705381-1926-45b4-8238-df239825e3fc",
            },
          })

          let callStatus: string
          let logsData: any

          if (!logsResponse.ok) {
            console.error(
              `[${index + 1}/${callIds.length}] Failed to fetch logs for call ID ${callId}: ${logsResponse.statusText}`,
            )
            const errorText = await logsResponse.text()
            console.log("API Error Response:", errorText)
            try {
              const errorJson = JSON.parse(errorText)
              if (errorJson.message && errorJson.message[0] === "callId must be a UUID") {
                callStatus = "-"
              } else {
                callStatus = "API error"
              }
            } catch {
              callStatus = "API error"
            }
          } else {
            logsData = await logsResponse.json()
            console.log(
              `[${index + 1}/${callIds.length}] API Response for ${callId}:`,
              JSON.stringify(logsData.transcript.replace(/[\n"'`]/g, "")),
            )
            console.log(logsData.messages.type)
            if (logsData.messages && Array.isArray(logsData.messages)) {
              callStatus = logsData.messages.length > 0 ? "✓" : "no call data"
            } else {
              callStatus = "unexpected response format"
            }
          }

          // Step 3: Update the campaigns table with the new status
          const updateResponse = await fetch("https://coarqpbcnz.g2.sqlite.cloud/v2/weblite/sql", {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              Authorization:
                "Bearer sqlitecloud://coarqpbcnz.g2.sqlite.cloud:8860?apikey=p4bMGfH2iYwuSPq7aPJNyrLjxCQnh1YpU3PmRUtulGw",
            },
            body: JSON.stringify({
              sql: `UPDATE campaigns SET call_ended = '${callStatus}', transcript = '${JSON.stringify(logsData.transcript.replace(/[\n"'`]/g, ""))}' WHERE call_id = '${callId}'`,
              database: "campaigns",
            }),
          })

          if (updateResponse.ok) {
            updatedCount++
            console.log(
              `[${index + 1}/${callIds.length}] Successfully updated call_ended for call ID: ${callId} to '${callStatus}'`,
            )
          } else {
            console.error(
              `[${index + 1}/${callIds.length}] Failed to update call_ended for call ID ${callId}: ${updateResponse.statusText}`,
            )
          }
        } catch (error) {
          console.error(`[${index + 1}/${callIds.length}] Error processing call ID ${callId}:`, error)
        }
      }

      console.log(`Updated ${updatedCount} out of ${callIds.length} calls`)

      // Fetch updated campaigns to reflect the latest data
      await fetchCampaigns()
    } catch (error) {
      console.error("Error refreshing campaigns:", error)
      setError(`Failed to refresh campaigns: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  const openCampaignDetails = (campaign: GroupedCampaign) => {
    setSelectedCampaign(campaign)
    setIsDialogOpen(true)
  }

  const deleteCampaign = async (campaignName: string) => {
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
          sql: `DELETE FROM campaigns WHERE campaign_name = '${campaignName}'`,
          database: "campaigns",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      await fetchCampaigns()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting campaign:", error)
      setError(`Failed to delete campaign: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const filteredCampaigns =
    dateRange?.from && dateRange?.to
      ? campaigns.filter((campaign) => {
          const campaignDate = parseISO(campaign.latest_call_date)
          return isWithinInterval(campaignDate, { start: dateRange.from, end: dateRange.to })
        })
      : campaigns

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Reports</h2>
            <p className="mt-2 text-sm text-gray-600">View and manage your campaign reports</p>
          </div>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <Calendar className="text-gray-400" />
            <DatePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle>Campaigns</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCampaigns}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:hidden">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.campaign_name} className="p-4">
                  <h3 className="font-semibold mb-2">{campaign.campaign_name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Latest Call: {format(parseISO(campaign.latest_call_date), "PPpp")}</p>
                    <p>Number of Calls: {campaign.calls.length}</p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/campaign-report/${encodeURIComponent(campaign.campaign_name)}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Latest Call Date</TableHead>
                    <TableHead>Number of Calls</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.campaign_name} className="cursor-pointer hover:bg-gray-100">
                      <TableCell onClick={() => openCampaignDetails(campaign)}>{campaign.campaign_name}</TableCell>
                      <TableCell onClick={() => openCampaignDetails(campaign)}>
                        {format(parseISO(campaign.latest_call_date), "PPpp")}
                      </TableCell>
                      <TableCell onClick={() => openCampaignDetails(campaign)}>
                        {campaign.calls.filter((call) => call.number !== "survey-campaign").length}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/campaign-report/${encodeURIComponent(campaign.campaign_name)}`)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCampaign(campaign)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCampaign?.campaign_name} - Campaign Details (
                {selectedCampaign?.calls.filter((call) => call.number !== "survey-campaign").length} calls)
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead>Call Date</TableHead>
                    <TableHead>Short Text</TableHead>
                    <TableHead>Call Ended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCampaign?.calls
                    .filter((call) => call.number !== "survey-campaign")
                    .map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>{call.number}</TableCell>
                        <TableCell>{call.call_id}</TableCell>
                        <TableCell>{call.report}</TableCell>
                        <TableCell>{format(parseISO(call.call_date), "PPpp")}</TableCell>
                        <TableCell>{call.short_text}</TableCell>
                        <TableCell>
                          {call.call_ended === "✓" ? "✓" : call.call_ended === "-" ? "-" : call.call_ended || "No"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Campaign</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the campaign "{selectedCampaign?.campaign_name}"? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedCampaign && deleteCampaign(selectedCampaign.campaign_name)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

