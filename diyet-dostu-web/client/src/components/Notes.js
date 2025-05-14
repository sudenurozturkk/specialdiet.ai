import React, { useState, useEffect, useRef } from 'react';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref for the note form
  const noteFormRef = useRef(null);

  useEffect(() => {
    fetchNotes();
    
    // Click dışında form kapanması için event listener
    function handleClickOutside(event) {
      if (noteFormRef.current && !noteFormRef.current.contains(event.target)) {
        setShowForm(false);
      }
    }

    // Eventleri ekle
    document.addEventListener("mousedown", handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı');
        return;
      }
      
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Notlar alınırken bir hata oluştu');
      }
      
      const data = await response.json();
      setNotes(data);
      setError('');
    } catch (err) {
      console.error('Not alınırken hata:', err);
      setError('Notlar alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Lütfen başlık ve içerik alanlarını doldurun');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Not eklenirken bir hata oluştu');
      }
      
      // Formu temizle ve kapat
      setFormData({ title: '', content: '' });
      setShowForm(false);
      
      // Notları yeniden getir
      await fetchNotes();
      
    } catch (err) {
      console.error('Not eklenirken hata:', err);
      setError('Not eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Not silinirken bir hata oluştu');
      }
      
      // UI'dan notu kaldır
      setNotes(notes.filter(note => note._id !== id));
      setError('');
      
    } catch (err) {
      console.error('Not silinirken hata:', err);
      setError('Not silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-diet-green">Notlarım</h1>
        <button 
          className="btn flex items-center"
          onClick={() => setShowForm(true)}
          data-aos="zoom-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Not Ekle
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Not Ekleme Formu - Animasyonlu */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            ref={noteFormRef}
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
            data-aos="zoom-in"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-diet-green">Yeni Not Ekle</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Başlık</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Not başlığı"
                  autoFocus
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="content" className="block text-gray-700 font-medium mb-2">İçerik</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="form-input"
                  rows="5"
                  placeholder="Not içeriği"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-outline"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </span>
                  ) : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-diet-green rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Notlar yükleniyor...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center" data-aos="fade-up">
          <img src="/images/empty-notes.svg" alt="Hiç not yok" className="w-48 h-48 mb-6 opacity-60" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz notunuz yok</h3>
          <p className="text-gray-500 text-center mb-6">Önemli bilgileri, hedeflerinizi veya beslenme planlarınızı kaydetmek için not ekleyin.</p>
          <button 
            className="btn"
            onClick={() => setShowForm(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Hemen Not Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note, index) => (
            <div 
              key={note._id} 
              className="note-card card"
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-diet-green-dark">{note.title}</h3>
                <button 
                  onClick={() => handleDelete(note._id)}
                  className="text-red-500 hover:text-red-700"
                  title="Notu Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-4 note-content">{note.content}</p>
              
              <div className="text-xs text-gray-500 flex items-center mt-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notes; 