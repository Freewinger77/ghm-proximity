import { useState } from "react"
import ProfileForm from "./ProfileForm"
import type { Profile } from "../types"

interface ProfileManagerProps {
  profiles: Profile[]
  addProfile: (profile: Profile) => void
  updateProfile: (profile: Profile) => void
}

export default function ProfileManager({ profiles, addProfile, updateProfile }: ProfileManagerProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const handleProfileSelect = (id: string) => {
    setSelectedProfileId(id)
  }

  const handleAddProfile = () => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name: "New Profile",
      fields: {},
      hasUnsavedChanges: false,
    }
    addProfile(newProfile)
    setSelectedProfileId(newProfile.id)
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)

  return (
    <div className="flex">
      <div className="w-1/3 pr-4">
        <h2 className="text-xl font-semibold mb-2">Profiles</h2>
        <ul>
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className={`cursor-pointer p-2 ${selectedProfileId === profile.id ? "bg-blue-100" : ""}`}
              onClick={() => handleProfileSelect(profile.id)}
            >
              {profile.name}
              {profile.hasUnsavedChanges && <span className="text-red-500 ml-2">Unsaved Changes</span>}
            </li>
          ))}
        </ul>
        <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded" onClick={handleAddProfile}>
          Add New Profile
        </button>
      </div>
      <div className="w-2/3">
        {selectedProfile && <ProfileForm profile={selectedProfile} updateProfile={updateProfile} />}
      </div>
    </div>
  )
}

