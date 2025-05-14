import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUploader = ({ onUpload, onCancel }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    
    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Lütfen sadece resim dosyaları yükleyin.');
      return;
    }
    
    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }
    
    setError('');
    setSelectedImage(file);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  const handleUpload = () => {
    if (selectedImage) {
      onUpload(selectedImage);
    }
  };

  return (
    <div className="p-4 border-t">
      {!selectedImage ? (
        <div 
          {...getRootProps({ className: 'upload-container' })}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-diet-blue">Resmi buraya bırakın...</p>
          ) : (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-diet-blue mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-gray-600">Analiz için bir yemek fotoğrafı seçin veya buraya sürükleyin</p>
              <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG veya GIF, max 10MB</p>
            </div>
          )}
          
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="relative w-64 h-64 mx-auto mb-4 rounded-lg overflow-hidden border border-diet-blue">
            <img 
              src={URL.createObjectURL(selectedImage)}
              alt="Yüklenecek görsel" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-gray-600 mb-4">
            {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="px-4 py-2 bg-diet-green text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Analiz Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 