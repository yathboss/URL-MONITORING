import axios, { AxiosError } from 'axios'
import { URLItem, AddURLPayload, URLDetail } from '../types/index'

const API_BASE_URL = 'http://localhost:8000/api/v1'
const API_KEY = 'dev-secret-key-change-in-production'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
})

export async function getUrls(): Promise<URLItem[]> {
  try {
    const response = await client.get<URLItem[]>('/urls')
    return response.data
  } catch (err) {
    throw err as AxiosError
  }
}

export async function addUrl(payload: AddURLPayload): Promise<URLItem> {
  try {
    const response = await client.post<URLItem>('/urls', {
      web_address: payload.web_address,
      name: payload.name
    })
    return response.data
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>
    if (axiosErr.response?.status === 409) {
      throw new Error('This URL is already being monitored')
    }
    throw axiosErr
  }
}

export async function deleteUrl(id: number): Promise<void> {
  try {
    await client.delete(`/urls/${id}`)
  } catch (err) {
    throw err as AxiosError
  }
}

export async function getUrlDetail(id: number): Promise<URLDetail> {
  try {
    const response = await client.get<URLDetail>(`/urls/${id}`)
    return response.data
  } catch (err) {
    throw err as AxiosError
  }
}
