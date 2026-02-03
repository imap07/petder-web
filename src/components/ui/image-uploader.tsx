'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './button';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<string>;
  currentImageUrl?: string | null;
  className?: string;
  variant?: 'avatar' | 'photo';
  disabled?: boolean;
  label?: string;
}

export function ImageUploader({
  onUpload,
  currentImageUrl,
  className = '',
  variant = 'photo',
  disabled = false,
  label,
}: ImageUploaderProps) {
  const t = useTranslations('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Sync preview with currentImageUrl when it changes externally
  useEffect(() => {
    if (currentImageUrl && !selectedFile) {
      setPreview(null); // Clear local preview, use currentImageUrl
    }
  }, [currentImageUrl, selectedFile]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t('errors.invalidType');
    }
    if (file.size > MAX_SIZE_BYTES) {
      return t('errors.tooLarge', { maxSize: MAX_SIZE_MB });
    }
    return null;
  }, [t]);

  const processFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [disabled, isUploading, processFile]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const uploadedUrl = await onUpload(selectedFile);
      setUploadProgress(100);
      
      // Keep the uploaded URL as preview until currentImageUrl prop updates
      // This prevents flash of empty state
      if (uploadedUrl) {
        setPreview(uploadedUrl);
      }
      
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.uploadFailed'));
      setUploadProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  }, [selectedFile, onUpload, t]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayImage = preview || currentImageUrl;
  const isAvatar = variant === 'avatar';

  const fileSize = useMemo(() => {
    if (!selectedFile) return null;
    const sizeInKB = selectedFile.size / 1024;
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    }
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }, [selectedFile]);

  return (
    <div className={`${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Avatar Variant */}
      {isAvatar && (
        <div className="flex flex-col items-center gap-4">
          {/* Label */}
          {label && <p className="text-sm font-medium text-text">{label}</p>}
          
          {/* Avatar Preview */}
          <div
            onClick={!disabled && !isUploading && !selectedFile ? handleClick : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative w-32 h-32 rounded-full overflow-hidden
              border-4 transition-all duration-300 ease-out
              ${isDragging 
                ? 'border-primary border-dashed scale-105 bg-primary/10' 
                : displayImage 
                  ? 'border-primary/30 hover:border-primary shadow-lg' 
                  : 'border-dashed border-border hover:border-primary/50 bg-surface'
              }
              ${!disabled && !isUploading && !selectedFile ? 'cursor-pointer group' : ''}
              ${disabled || isUploading ? 'opacity-60' : ''}
            `}
          >
            {displayImage ? (
              <>
                <img
                  src={displayImage}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                {/* Overlay on hover */}
                {!selectedFile && !disabled && !isUploading && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white text-xs font-medium">{t('changePhoto')}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 group-hover:bg-primary/5 transition-colors">
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all
                  ${isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10 group-hover:bg-primary/20'}
                `}>
                  <svg className={`w-7 h-7 transition-colors ${isDragging ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs text-text-muted font-medium text-center">{t('addPhoto')}</span>
              </div>
            )}

            {/* Upload Progress Ring */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="text-white/30"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                  <circle
                    className="text-white transition-all duration-300"
                    strokeWidth="3"
                    strokeDasharray={`${uploadProgress}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Avatar Info & Actions */}
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-sm text-text-muted bg-surface border border-border rounded-lg px-3 py-2 w-full">
                  <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate flex-1 text-text">{selectedFile.name}</span>
                  <span className="text-xs text-text-muted flex-shrink-0">({fileSize})</span>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    isLoading={isUploading}
                    disabled={disabled}
                    className="flex-1 gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {t('uploadButton')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUploading}
                  >
                    {t('cancelButton')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-sm text-text-muted">{t('dragOrClick')}</p>
                <p className="text-xs text-text-muted/70">{t('allowedFormats')}</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-error bg-error-bg border border-error/20 rounded-lg px-3 py-2 w-full">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Variant */}
      {!isAvatar && (
        <div className="space-y-3">
          {label && <p className="text-sm font-medium text-text mb-2">{label}</p>}
          
          {/* Drop Zone */}
          <div
            onClick={!disabled && !isUploading && !selectedFile ? handleClick : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-xl overflow-hidden transition-all duration-300 ease-out
              ${displayImage ? 'aspect-video' : 'h-44'}
              ${isDragging 
                ? 'border-2 border-primary border-dashed bg-primary/5 scale-[1.02]' 
                : displayImage 
                  ? 'border border-border hover:border-primary/50' 
                  : 'border-2 border-dashed border-border hover:border-primary bg-surface'
              }
              ${!disabled && !isUploading && !selectedFile ? 'cursor-pointer' : ''}
              ${disabled || isUploading ? 'opacity-60' : ''}
            `}
          >
            {displayImage ? (
              <>
                <img
                  src={displayImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                {!selectedFile && !disabled && !isUploading && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-white text-sm font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('changePhoto')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all
                  ${isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10'}
                `}>
                  <svg className={`w-8 h-8 transition-colors ${isDragging ? 'text-primary' : 'text-primary/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text mb-1">
                  {isDragging ? t('dropHere') : t('dragOrClickPhoto')}
                </p>
                <p className="text-xs text-text-muted">{t('allowedFormats')}</p>
              </div>
            )}

            {/* Upload Progress Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-foreground/90 flex flex-col items-center justify-center">
                <div className="w-48 h-2 bg-border rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-text-muted">{t('uploading')} {uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* File Info & Actions */}
          {selectedFile && !isUploading && (
            <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{selectedFile.name}</p>
                  <p className="text-xs text-text-muted">{fileSize}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  className="gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('uploadButton')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error-bg border border-error/20 rounded-lg text-sm text-error">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
