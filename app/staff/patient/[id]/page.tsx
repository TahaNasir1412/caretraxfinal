import PatientDetail from "@/components/staff/patient-detail"

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return <PatientDetail patientId={params.id} />
}
