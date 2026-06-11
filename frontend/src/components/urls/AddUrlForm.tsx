import React, { useState } from 'react'
import { AddURLPayload } from '../../types/index'

interface AddUrlFormProps {
  onAdd: (payload: AddURLPayload) => Promise<void>
  isLoading: boolean
}

export function AddUrlForm({ onAdd, isLoading }: AddUrlFormProps) {
  const [name, setName] = useState('')
  const [webAddress, setWebAddress] = useState('')
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateName = (value: string): string => {
    if (!value) return 'Name is required'
    if (value.length < 1) return 'Name must be at least 1 character'
    if (value.length > 100) return 'Name must not exceed 100 characters'
    return ''
  }

  const validateUrl = (value: string): string => {
    if (!value) return 'URL is required'
    const urlRegex = /^https?:\/\/.+\..+/
    if (!urlRegex.test(value)) {
      return 'URL must start with http:// or https://'
    }
    return ''
  }

  const nameError = validateName(name)
  const urlError = validateUrl(webAddress)

  const handleBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebAddress(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTouchedFields(new Set(['name', 'web_address']))

    if (nameError || urlError) {
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        name,
        web_address: webAddress
      })
      setName('')
      setWebAddress('')
      setTouchedFields(new Set())
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContainerStyles: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24
  }

  const formGroupStyles: React.CSSProperties = {
    marginBottom: 16
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#1F2937',
    marginBottom: 6
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 4,
    border: '1px solid #E5E7EB',
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  }

  const errorStyles: React.CSSProperties = {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4
  }

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: 8
  }

  const submitButtonStyles: React.CSSProperties = {
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
    opacity: isSubmitting || isLoading ? 0.6 : 1
  }

  const resetButtonStyles: React.CSSProperties = {
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    padding: '8px 16px',
    fontSize: 14,
    cursor: 'pointer',
    color: '#374151'
  }

  return (
    <div style={formContainerStyles}>
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyles}>
          <label style={labelStyles}>URL Name</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur('name')}
            style={inputStyles}
            placeholder="e.g., My Website"
          />
          {touchedFields.has('name') && nameError && (
            <div style={errorStyles}>{nameError}</div>
          )}
        </div>

        <div style={formGroupStyles}>
          <label style={labelStyles}>Website URL</label>
          <input
            type="text"
            value={webAddress}
            onChange={handleUrlChange}
            onBlur={() => handleBlur('web_address')}
            style={inputStyles}
            placeholder="https://example.com"
          />
          {touchedFields.has('web_address') && urlError && (
            <div style={errorStyles}>{urlError}</div>
          )}
        </div>

        <div style={buttonContainerStyles}>
          <button
            type="submit"
            style={submitButtonStyles}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Adding...' : 'Add URL'}
          </button>
          <button
            type="reset"
            style={resetButtonStyles}
            onClick={() => {
              setName('')
              setWebAddress('')
              setTouchedFields(new Set())
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
