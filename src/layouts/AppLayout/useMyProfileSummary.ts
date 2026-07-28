import { useEffect, useMemo, useState } from 'react'
import { fetchMyProfile } from '../../api/users'
import { useAuth } from '../../auth'

export function useMyProfileSummary() {
  const { user, role } = useAuth()
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)
  const [profileRole, setProfileRole] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchMyProfile()
      .then((profile) => {
        if (!cancelled) {
          setFirstName(profile.firstName)
          setLastName(profile.lastName)
          setProfileRole(profile.roleCode ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFirstName(null)
          setLastName(null)
          setProfileRole(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const displayName = useMemo(() => {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    if (name) {
      return name
    }

    return user?.email ?? 'Mi cuenta'
  }, [firstName, lastName, user?.email])

  const roleLabel = profileRole ?? role

  return { displayName, roleLabel }
}
