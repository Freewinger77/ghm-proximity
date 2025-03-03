"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const mockCampaigns = [
  { id: 1, name: "Customer Satisfaction Survey", status: "Active", responses: 150, completion: 75 },
  { id: 2, name: "Product Feedback", status: "Active", responses: 89, completion: 45 },
  { id: 3, name: "Market Research", status: "Paused", responses: 200, completion: 100 },
]

export function ActiveCampaigns() {
  const [campaigns, setCampaigns] = useState(mockCampaigns)

  const toggleStatus = (id: number) => {
    setCampaigns(
      campaigns.map((campaign) =>
        campaign.id === id ? { ...campaign, status: campaign.status === "Active" ? "Paused" : "Active" } : campaign,
      ),
    )
  }

  return (
    <Card className="bg-white shadow-soft rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Campaign Name</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Responses</TableHead>
            <TableHead className="font-semibold">Completion (%)</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-gray-50/50">
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    campaign.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.status}
                </span>
              </TableCell>
              <TableCell>{campaign.responses}</TableCell>
              <TableCell>{campaign.completion}%</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(campaign.id)}
                  className="hover:bg-gray-50"
                >
                  {campaign.status === "Active" ? "Pause" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

