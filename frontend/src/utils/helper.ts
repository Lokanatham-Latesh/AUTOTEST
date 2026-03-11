// export function hasRole(userRole: string, allowedRoles: string[]) {
//   return allowedRoles.includes(userRole)
// }

import { type Role } from './constants'

export const hasRole = (userRole: string | string[], allowedRoles: Role[]): boolean => {
  if (Array.isArray(userRole)) {
    return userRole.some((role) => allowedRoles.includes(role as Role))
  }
  return allowedRoles.includes(userRole as Role)
}

export const formatDateDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return '-'

  const date = new Date(isoDate)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

export const formatDateTimeDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return '-'

  const date = new Date(isoDate)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')

  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12

  const formattedHours = String(hours).padStart(2, '0')

  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`
}