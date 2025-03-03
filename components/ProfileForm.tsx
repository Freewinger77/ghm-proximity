"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Profile } from "../types"

interface ProfileFormProps {
  profile: Profile
  updateProfile: (profile: Profile) => void
}

export default function ProfileForm({ profile, updateProfile }: ProfileFormProps) {
  const [name, setName] = useState(profile.name)
  const [fields, setFields] = useState(profile.fields)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(profile.hasUnsavedChanges)

  useEffect(() => {
    setName(profile.name)
    setFields(profile.fields)
    setHasUnsavedChanges(profile.hasUnsavedChanges)
  }, [profile])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleFieldChange = (key: string, value: string) => {
    setFields({ ...fields, [key]: value })
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    updateProfile({ ...profile, name, fields, hasUnsavedChanges: false })
    setHasUnsavedChanges(false)
  }

  const handleClearFields = () => {
    setFields({})
    setHasUnsavedChanges(true)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        {name}
        {hasUnsavedChanges && <span className="text-red-500 ml-2">Unsaved Changes</span>}
      </h2>
      <input type="text" value={name} onChange={handleNameChange} className="w-full p-2 mb-4 border rounded" />
      {Object.entries(fields).map(([key, value]) => (
        <div key={key} className="mb-2">
          <label className="block">{key}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      ))}
      <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2" onClick={handleSave}>
        Save
      </button>
      <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleClearFields}>
        Clear Fields
      </button>
    </div>
  )
}

