'use client'

import React, { useState, useEffect } from 'react'
import { Check, Plus, X, Globe, Radio, Tv, Newspaper } from 'lucide-react'

interface MediaSource {
  id: string
  name: string
  url: string
  category: string
  description?: string
  logoUrl?: string
  isActive: boolean
  isDefault: boolean
}

interface MediaSelectorProps {
  onMediaChange: (selectedMedia: string[]) => void
  initialSelection?: string[]
}

export default function MediaSelector({ onMediaChange, initialSelection = [] }: MediaSelectorProps) {
  const [mediaSources, setMediaSources] = useState<MediaSource[]>([])
  const [selectedMedia, setSelectedMedia] = useState<string[]>(initialSelection)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaName, setNewMediaName] = useState('')
  const [selectAll, setSelectAll] = useState(false)

  // Categorías de medios
  const categories = [
    { key: 'nacional', label: 'Medios Nacionales', icon: Globe },
    { key: 'regional', label: 'Medios Regionales', icon: Radio },
    { key: 'especializado', label: 'Medios Especializados', icon: Newspaper },
    { key: 'internacional', label: 'Medios Internacionales', icon: Tv }
  ]

  useEffect(() => {
    loadMediaSources()
  }, [])

  useEffect(() => {
    onMediaChange(selectedMedia)
  }, [selectedMedia, onMediaChange])

  const loadMediaSources = async () => {
    try {
      const response = await fetch('/api/media-sources')
      if (response.ok) {
        const data = await response.json()
        setMediaSources(data)
      }
    } catch (error) {
      console.error('Error loading media sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMediaToggle = (mediaId: string) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMedia([])
    } else {
      setSelectedMedia(mediaSources.map(media => media.id))
    }
    setSelectAll(!selectAll)
  }

  const handleAddCustomMedia = async () => {
    if (!newMediaUrl.trim() || !newMediaName.trim()) return

    try {
      const response = await fetch('/api/media-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMediaName.trim(),
          url: newMediaUrl.trim(),
          category: 'personalizado',
          description: `Medio agregado por el usuario`,
          isDefault: false
        })
      })

      if (response.ok) {
        const newMedia = await response.json()
        setMediaSources(prev => [...prev, newMedia])
        setSelectedMedia(prev => [...prev, newMedia.id])
        setNewMediaUrl('')
        setNewMediaName('')
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding custom media:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.key === category)
    const IconComponent = categoryData?.icon || Globe
    return <IconComponent className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Selecciona los medios a monitorear</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Selecciona los medios a monitorear</h3>
        <button
          onClick={handleSelectAll}
          className="px-4 py-2 text-sm font-medium text-white bg-[#01257D] rounded-lg hover:bg-[#013AAA] transition-colors"
        >
          {selectAll ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      {categories.map(category => {
        const categoryMedia = mediaSources.filter(media => media.category === category.key)
        if (categoryMedia.length === 0) return null

        return (
          <div key={category.key} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              {getCategoryIcon(category.key)}
              <span>{category.label}</span>
              <span className="text-gray-500">({categoryMedia.length})</span>
            </div>
            
            <div className="grid gap-3">
              {categoryMedia.map(media => (
                <div
                  key={media.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedMedia.includes(media.id)
                      ? 'border-[#01257D] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMediaToggle(media.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedMedia.includes(media.id)
                        ? 'bg-[#01257D] border-[#01257D]'
                        : 'border-gray-300'
                    }`}>
                      {selectedMedia.includes(media.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{media.name}</div>
                      <div className="text-sm text-gray-500">{media.description}</div>
                      <div className="text-xs text-gray-400">{media.url}</div>
                    </div>
                  </div>
                  {getCategoryIcon(media.category)}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Sección para agregar medio personalizado */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">¿Falta algún medio?</h4>
        
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#01257D] border border-[#01257D] rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar medio personalizado
          </button>
        ) : (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del medio
                </label>
                <input
                  type="text"
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  placeholder="Ej: Mi Medio Local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del medio
                </label>
                <input
                  type="url"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddCustomMedia}
                disabled={!newMediaUrl.trim() || !newMediaName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#01257D] rounded-lg hover:bg-[#013AAA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agregar medio
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewMediaUrl('')
                  setNewMediaName('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedMedia.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>{selectedMedia.length}</strong> medio{selectedMedia.length !== 1 ? 's' : ''} seleccionado{selectedMedia.length !== 1 ? 's' : ''} para monitoreo
          </p>
        </div>
      )}
    </div>
  )
}
