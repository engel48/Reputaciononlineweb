"use client";

import React, { useState, useRef } from 'react';
import { Camera, X, User, UserCheck } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  onPhotoChange: (photoBase64: string | null) => void;
  initialPhoto?: string | null;
}

export default function ProfilePhotoUploader({ onPhotoChange, initialPhoto = null }: ProfilePhotoUploaderProps) {
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoBase64 = event.target?.result as string;
        setPhoto(photoBase64);
        onPhotoChange(photoBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoBase64 = event.target?.result as string;
        setPhoto(photoBase64);
        onPhotoChange(photoBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    onPhotoChange(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="mb-6 flex items-center justify-center">
          <div 
            className={`relative rounded-full overflow-hidden ${
              isDragging ? 'ring-4 ring-[#01257D]/50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {photo ? (
              <div className="relative">
                <img 
                  src={photo} 
                  alt="Foto de perfil" 
                  className="h-40 w-40 rounded-full object-cover"
                />
                <button 
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div 
                className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <User className="h-16 w-16 mb-2" />
                <span className="text-xs text-center px-2">Haz clic o arrastra una foto aquí</span>
              </div>
            )}

            {!photo && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="profile-photo"
                  accept="image/jpeg, image/png, image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <label 
                  htmlFor="profile-photo" 
                  className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#01257D] text-white hover:bg-[#013AAA]"
                >
                  <Camera className="h-5 w-5" />
                </label>
              </>
            )}
          </div>
        </div>

        {photo && (
          <div className="flex items-center justify-center space-x-2 text-[#01257D]">
            <UserCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Foto cargada correctamente</span>
          </div>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Formatos aceptados: JPG, PNG y GIF</p>
          <p>Tamaño máximo: 5MB</p>
        </div>
      </div>
    </div>
  );
}
