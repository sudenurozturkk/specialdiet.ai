import React, { useState } from 'react';
import axios from 'axios';

const UserInfoForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'erkek',
    weight: '',
    height: '',
    activityLevel: 'sedanter',
    healthProblems: '',
    medications: '',
    dietHistory: '',
    mealCount: '3',
    allergies: '',
    foodPreferences: '',
    dietGoal: 'kilo_verme',
    targetWeight: '',
    weeklyExerciseHours: '0'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Zorunlu alanları kontrol et
    if (!formData.age) newErrors.age = 'Yaş alanı zorunludur';
    else if (formData.age < 12 || formData.age > 120) newErrors.age = 'Lütfen geçerli bir yaş giriniz (12-120)';
    
    if (!formData.weight) newErrors.weight = 'Kilo alanı zorunludur';
    else if (formData.weight < 30 || formData.weight > 300) newErrors.weight = 'Lütfen geçerli bir kilo giriniz (30-300)';
    
    if (!formData.height) newErrors.height = 'Boy alanı zorunludur';
    else if (formData.height < 100 || formData.height > 250) newErrors.height = 'Lütfen geçerli bir boy giriniz (100-250)';
    
    if (formData.dietGoal === 'kilo_verme' && !formData.targetWeight) {
      newErrors.targetWeight = 'Hedef kilo alanı zorunludur';
    } else if (formData.targetWeight && (formData.targetWeight < 30 || formData.targetWeight > 300)) {
      newErrors.targetWeight = 'Lütfen geçerli bir hedef kilo giriniz (30-300)';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulaması yap
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // API'ye kullanıcı bilgilerini gönderme işlemi
      // Bu noktada gerçek API entegrasyonu yapılmalıdır
      // Şimdilik onSubmit fonksiyonunu doğrudan çağırıyoruz
      
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:5000/api/user-info', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      onSubmit(formData);
    } catch (error) {
      console.error('Kullanıcı bilgileri kaydedilirken hata:', error);
      setErrors({
        submit: 'Bilgiler kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-diet-green">Kişisel Bilgi Formu</h2>
        <p className="text-gray-600 mt-2">
          Daha kişiselleştirilmiş bir beslenme programı için lütfen aşağıdaki bilgileri doldurun.
        </p>
      </div>
      
      {errors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.submit}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temel Bilgiler */}
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="age">
              Yaşınız <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Örn: 35"
            />
            {errors.age && <p className="mt-1 text-red-500 text-sm">{errors.age}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="gender">
              Cinsiyet <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="erkek">Erkek</option>
              <option value="kadın">Kadın</option>
              <option value="diğer">Diğer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="weight">
              Kilonuz (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Örn: 75"
            />
            {errors.weight && <p className="mt-1 text-red-500 text-sm">{errors.weight}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="height">
              Boyunuz (cm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Örn: 175"
            />
            {errors.height && <p className="mt-1 text-red-500 text-sm">{errors.height}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="activityLevel">
              Fiziksel Aktivite Düzeyi <span className="text-red-500">*</span>
            </label>
            <select
              id="activityLevel"
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="sedanter">Sedanter (Masa başı çalışan/Az hareket)</option>
              <option value="hafif_aktif">Hafif Aktif (Haftada 1-3 gün egzersiz)</option>
              <option value="orta_aktif">Orta Aktif (Haftada 3-5 gün egzersiz)</option>
              <option value="cok_aktif">Çok Aktif (Haftada 6-7 gün egzersiz)</option>
              <option value="ekstra_aktif">Ekstra Aktif (Günde 2 kez egzersiz/Fiziksel iş)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="dietGoal">
              Beslenme Hedefiniz <span className="text-red-500">*</span>
            </label>
            <select
              id="dietGoal"
              name="dietGoal"
              value={formData.dietGoal}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="kilo_verme">Kilo Vermek</option>
              <option value="kilo_alma">Kilo Almak</option>
              <option value="kilo_koruma">Mevcut Kiloyu Korumak</option>
              <option value="kas_kazanma">Kas Kütlesi Kazanmak</option>
              <option value="saglikli_beslenme">Genel Sağlıklı Beslenme</option>
            </select>
          </div>
        </div>
        
        {formData.dietGoal === 'kilo_verme' && (
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="targetWeight">
              Hedef Kilonuz (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="targetWeight"
              name="targetWeight"
              value={formData.targetWeight}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${errors.targetWeight ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Örn: 65"
            />
            {errors.targetWeight && <p className="mt-1 text-red-500 text-sm">{errors.targetWeight}</p>}
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="mealCount">
            Günde kaç öğün yemek tercih edersiniz?
          </label>
          <select
            id="mealCount"
            name="mealCount"
            value={formData.mealCount}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="3">3 Ana Öğün</option>
            <option value="4">3 Ana Öğün + 1 Ara Öğün</option>
            <option value="5">3 Ana Öğün + 2 Ara Öğün</option>
            <option value="6">3 Ana Öğün + 3 Ara Öğün</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="allergies">
            Besin Alerjileriniz
          </label>
          <input
            type="text"
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Varsa besin alerjilerinizi yazın (Örn: süt, fındık)"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="foodPreferences">
            Yemek Tercihleri/Sevmedikleriniz
          </label>
          <input
            type="text"
            id="foodPreferences"
            name="foodPreferences"
            value={formData.foodPreferences}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Sevmediğiniz veya tercih ettiğiniz besinleri yazın"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="healthProblems">
            Sağlık Sorunlarınız
          </label>
          <textarea
            id="healthProblems"
            name="healthProblems"
            value={formData.healthProblems}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Varsa sağlık sorunlarınızı yazın (Diyabet, tansiyon, kolesterol vb.)"
            rows="2"
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="medications">
            Kullandığınız İlaçlar
          </label>
          <textarea
            id="medications"
            name="medications"
            value={formData.medications}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Varsa kullandığınız ilaçları yazın"
            rows="2"
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="dietHistory">
            Daha Önce Denediğiniz Diyetler
          </label>
          <textarea
            id="dietHistory"
            name="dietHistory"
            value={formData.dietHistory}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Daha önce uyguladığınız diyetler ve sonuçları"
            rows="2"
          ></textarea>
        </div>
        
        <div className="text-right mt-6 flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-diet-green text-white py-2 px-6 rounded-lg hover:bg-green-600 transition flex items-center"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Kaydediliyor...' : 'Bilgilerimi Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserInfoForm; 