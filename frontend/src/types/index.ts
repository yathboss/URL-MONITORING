export interface URLItem {
  id: number
  web_address: string
  name: string
  status: 'UP' | 'DOWN' | 'PENDING'
  created_at: string
}

export interface PingHistoryRead {
  id: number
  url_id: number
  checked_at: string
  response_time_ms: number | null
  status_code: number | null
  is_up: boolean
}

export interface URLDetail extends URLItem {
  recent_pings: PingHistoryRead[]
}

export interface AddURLPayload {
  web_address: string
  name: string
}

export interface PingResult {
  status: boolean
  responseTime: number
}
