"use client";

import useAuth from "@/hooks/use-auth";

export default function Page() {

  const {currentPharmacy, currentRole,getUser,pharmacies,profile,switchPharmacy,currentUser} = useAuth()

  console.log(currentPharmacy, "currentPharmacy")
  console.log(currentRole, "currentRole")
  console.log(getUser, "getUser")
  console.log(pharmacies, "pharmacies")
  console.log(profile, "profile")
  console.log(switchPharmacy, "switchPharmacy")
  console.log(currentUser, "currentUser")

  return (
    <div>

    </div>
  )
}
