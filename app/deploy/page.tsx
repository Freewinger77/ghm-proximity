"use client"

import AppLayout from "@/components/layout"
import { DeployAgentsSection } from "@/components/configure-sections"
import { Card } from "@/components/ui/card"

export default function DeployPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Deploy</h2>
          <p className="mt-2 text-sm text-gray-600">Deploy and manage your interview campaigns</p>
        </div>

        <Card className="p-6">
          <DeployAgentsSection />
        </Card>
      </div>
    </AppLayout>
  )
}

