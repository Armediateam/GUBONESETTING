
import { DoctorsTable } from '@/components/therapists/data-table'
import React from 'react'
import data from "../../../components/therapists/data.json"

export default function TherapistsPage() {
  return (
    <div><DoctorsTable data={data}/></div>
  )
}
