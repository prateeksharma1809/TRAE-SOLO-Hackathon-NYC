import { NextRequest, NextResponse } from 'next/server'
import { CSVDatabase } from '@/lib/csvDatabase'

const db = new CSVDatabase()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || undefined
    const insurance = searchParams.get('insurance') || undefined
    const list = await db.getTherapists(city, insurance)
    return NextResponse.json({ therapists: list })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}