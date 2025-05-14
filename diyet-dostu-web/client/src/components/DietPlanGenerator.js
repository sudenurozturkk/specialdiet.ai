import React, { useState, useEffect } from 'react';

const DietPlanGenerator = ({ userInfo }) => {
  const [dietPlan, setDietPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userInfo) {
      generateDietPlan(userInfo);
    }
  }, [userInfo]);

  const calculateBMR = (userInfo) => {
    // Harris-Benedict denklemi
    const { gender, weight, height, age } = userInfo;
    let bmr = 0;
    
    if (gender === 'erkek') {
      bmr = 88.362 + (13.397 * parseFloat(weight)) + (4.799 * parseFloat(height)) - (5.677 * parseFloat(age));
    } else {
      bmr = 447.593 + (9.247 * parseFloat(weight)) + (3.098 * parseFloat(height)) - (4.330 * parseFloat(age));
    }
    
    return Math.round(bmr);
  };

  const calculateTDEE = (bmr, activityLevel) => {
    // Aktivite çarpanları
    const activityMultipliers = {
      sedanter: 1.2,
      hafif_aktif: 1.375,
      orta_aktif: 1.55,
      cok_aktif: 1.725,
      ekstra_aktif: 1.9
    };
    
    return Math.round(bmr * activityMultipliers[activityLevel]);
  };

  const calculateTargetCalories = (tdee, dietGoal) => {
    // Hedeflere göre kalori hesaplama
    let targetCalories = tdee;
    
    switch (dietGoal) {
      case 'kilo_verme':
        targetCalories = Math.round(tdee * 0.8); // %20 kalori açığı
        break;
      case 'kilo_alma':
        targetCalories = Math.round(tdee * 1.15); // %15 kalori fazlası
        break;
      case 'kas_kazanma':
        targetCalories = Math.round(tdee * 1.1); // %10 kalori fazlası
        break;
      default:
        targetCalories = tdee; // Kilo koruma
    }
    
    // Minumum kalori sınırı (sağlık açısından)
    const minCalories = userInfo.gender === 'erkek' ? 1500 : 1200;
    return Math.max(targetCalories, minCalories);
  };

  const calculateWaterIntake = (weight) => {
    // Kilo başına 30ml su hesabı (genel kural)
    const minWater = Math.round((parseFloat(weight) * 30) / 1000, 1);
    // Kilo başına 40ml su hesabı (aktif kişiler için)
    const maxWater = Math.round((parseFloat(weight) * 40) / 1000, 1);
    
    return {
      min: minWater,
      max: maxWater,
      cups: Math.round((minWater + maxWater) / 2 * 4) // 250ml'lik bardak sayısı
    };
  };

  const generateMacroDistribution = (targetCalories, dietGoal) => {
    let proteinPercentage, carbPercentage, fatPercentage;
    
    // Hedeflere göre makro dağılımı
    switch (dietGoal) {
      case 'kilo_verme':
        proteinPercentage = 0.35; // %35
        fatPercentage = 0.30; // %30
        carbPercentage = 0.35; // %35
        break;
      case 'kilo_alma':
        proteinPercentage = 0.25; // %25
        fatPercentage = 0.25; // %25
        carbPercentage = 0.50; // %50
        break;
      case 'kas_kazanma':
        proteinPercentage = 0.30; // %30
        fatPercentage = 0.25; // %25
        carbPercentage = 0.45; // %45
        break;
      default:
        proteinPercentage = 0.20; // %20
        fatPercentage = 0.30; // %30
        carbPercentage = 0.50; // %50
    }
    
    // Gram hesaplamaları (1g protein/karbonhidrat = 4 kalori, 1g yağ = 9 kalori)
    const proteinCalories = targetCalories * proteinPercentage;
    const carbCalories = targetCalories * carbPercentage;
    const fatCalories = targetCalories * fatPercentage;
    
    const proteinGrams = Math.round(proteinCalories / 4);
    const carbGrams = Math.round(carbCalories / 4);
    const fatGrams = Math.round(fatCalories / 9);
    
    return {
      protein: {
        percentage: Math.round(proteinPercentage * 100),
        grams: proteinGrams,
        calories: Math.round(proteinCalories)
      },
      carbs: {
        percentage: Math.round(carbPercentage * 100),
        grams: carbGrams,
        calories: Math.round(carbCalories)
      },
      fat: {
        percentage: Math.round(fatPercentage * 100),
        grams: fatGrams,
        calories: Math.round(fatCalories)
      }
    };
  };

  const generateTurkishMealPlan = (targetCalories, macros, mealCount) => {
    // Öğün sayısına göre kalori dağılımı
    const mealDistribution = {
      '3': { breakfast: 0.25, lunch: 0.40, dinner: 0.35 },
      '4': { breakfast: 0.20, lunch: 0.35, dinner: 0.30, snack1: 0.15 },
      '5': { breakfast: 0.20, lunch: 0.30, dinner: 0.25, snack1: 0.15, snack2: 0.10 },
      '6': { breakfast: 0.20, lunch: 0.25, dinner: 0.25, snack1: 0.10, snack2: 0.10, snack3: 0.10 }
    };
    
    // Türk mutfağına uygun yemek önerileri
    const turkishFoods = {
      breakfast: [
        {
          name: 'Kahvaltı 1',
          description: '2 dilim tam tahıllı ekmek, 2 yumurta, 50g lor peyniri, 4-5 adet zeytin, 1 domates, 1 salatalık, 1 tatlı kaşığı bal, bitki çayı',
          calories: 400
        },
        {
          name: 'Kahvaltı 2',
          description: '1 kase yulaf ezmesi (40g), 1 su bardağı yarım yağlı süt, 1 adet muz, 1 tatlı kaşığı tarçın, 10g ceviz içi',
          calories: 380
        },
        {
          name: 'Kahvaltı 3',
          description: 'Menemen (2 yumurta, 1 domates, 1 biber), 1 dilim tam tahıllı ekmek, 30g beyaz peynir, 5 adet zeytin, bitki çayı',
          calories: 420
        }
      ],
      lunch: [
        {
          name: 'Öğle Yemeği 1',
          description: '120g ızgara tavuk, 1 kase sebzeli bulgur pilavı, mevsim salata (zeytinyağlı, limon), 1 kase yoğurt',
          calories: 550
        },
        {
          name: 'Öğle Yemeği 2',
          description: '100g etli sebze yemeği, 1 porsiyon mercimek çorbası, 1 dilim tam tahıllı ekmek, 1 kase yoğurt',
          calories: 500
        },
        {
          name: 'Öğle Yemeği 3',
          description: '1 porsiyon kuru fasulye, 1/2 porsiyon bulgur pilavı, 1 kase cacık, yeşil salata',
          calories: 520
        }
      ],
      dinner: [
        {
          name: 'Akşam Yemeği 1',
          description: '150g ızgara balık, 1 orta boy haşlanmış patates, mevsim salata (zeytinyağlı, limon)',
          calories: 450
        },
        {
          name: 'Akşam Yemeği 2',
          description: '100g köfte (az yağlı), 1/2 porsiyon bulgur pilavı, 1 kase yoğurt, mevsim salata',
          calories: 480
        },
        {
          name: 'Akşam Yemeği 3',
          description: '1 porsiyon sebzeli tavuk sote, 1 kase çoban salata, 1 dilim tam tahıllı ekmek',
          calories: 430
        }
      ],
      snacks: [
        {
          name: 'Ara Öğün 1',
          description: '1 adet orta boy meyve (elma, armut veya portakal) + 30g tuzsuz badem',
          calories: 200
        },
        {
          name: 'Ara Öğün 2',
          description: '1 kase yarım yağlı yoğurt + 1 tatlı kaşığı bal + 1 yemek kaşığı yulaf',
          calories: 180
        },
        {
          name: 'Ara Öğün 3',
          description: '1 avuç karışık kuruyemiş (badem, ceviz, fındık)',
          calories: 170
        },
        {
          name: 'Ara Öğün 4',
          description: '2 adet tam tahıllı bisküvi + 1 bardak yarım yağlı ayran',
          calories: 150
        },
        {
          name: 'Ara Öğün 5',
          description: '1 küçük kase mevsim meyveleri + 30g çekirdeksiz kuru üzüm',
          calories: 160
        }
      ]
    };
    
    // Öğün planı oluştur
    const mealPlan = {};
    const distributionPlan = mealDistribution[mealCount.toString()];
    
    Object.keys(distributionPlan).forEach(meal => {
      const mealCalories = Math.round(targetCalories * distributionPlan[meal]);
      
      if (meal === 'breakfast') {
        // Rastgele bir kahvaltı seç
        const selectedMeal = turkishFoods.breakfast[Math.floor(Math.random() * turkishFoods.breakfast.length)];
        mealPlan[meal] = {
          ...selectedMeal,
          targetCalories: mealCalories
        };
      } else if (meal === 'lunch') {
        // Rastgele bir öğle yemeği seç
        const selectedMeal = turkishFoods.lunch[Math.floor(Math.random() * turkishFoods.lunch.length)];
        mealPlan[meal] = {
          ...selectedMeal,
          targetCalories: mealCalories
        };
      } else if (meal === 'dinner') {
        // Rastgele bir akşam yemeği seç
        const selectedMeal = turkishFoods.dinner[Math.floor(Math.random() * turkishFoods.dinner.length)];
        mealPlan[meal] = {
          ...selectedMeal,
          targetCalories: mealCalories
        };
      } else {
        // Ara öğün
        const snackIndex = Math.floor(Math.random() * turkishFoods.snacks.length);
        mealPlan[meal] = {
          ...turkishFoods.snacks[snackIndex],
          targetCalories: mealCalories
        };
      }
    });
    
    return mealPlan;
  };

  const generateDietPlan = (userInfo) => {
    setIsLoading(true);
    try {
      // BMR (Bazal Metabolizma Hızı) Hesaplama
      const bmr = calculateBMR(userInfo);
      
      // TDEE (Toplam Günlük Enerji Harcaması) Hesaplama
      const tdee = calculateTDEE(bmr, userInfo.activityLevel);
      
      // Hedef Kalori Hesaplama
      const targetCalories = calculateTargetCalories(tdee, userInfo.dietGoal);
      
      // Makro Besin Dağılımı
      const macroDistribution = generateMacroDistribution(targetCalories, userInfo.dietGoal);
      
      // Öğün Planı
      const mealPlan = generateTurkishMealPlan(targetCalories, macroDistribution, userInfo.mealCount || 3);
      
      // Diyet Planı Objesi
      const generatedPlan = {
        stats: {
          bmr: bmr,
          tdee: tdee,
          targetCalories: targetCalories
        },
        macros: macroDistribution,
        mealPlan: mealPlan,
        waterIntake: calculateWaterIntake(userInfo.weight)
      };
      
      setDietPlan(generatedPlan);
    } catch (error) {
      console.error("Diyet planı oluşturulurken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-diet-green"></div>
        <p className="mt-3 text-gray-600">Diyet planınız oluşturuluyor...</p>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Diyet planı oluşturulamadı. Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-diet-green mb-6 text-center">Kişiselleştirilmiş Beslenme Planınız</h2>
      
      <div className="mb-6">
        <div className="flex justify-center space-x-4 border-b">
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'overview' ? 'text-diet-green border-b-2 border-diet-green' : 'text-gray-500'}`}
            onClick={() => setActiveTab('overview')}
          >
            Genel Bilgiler
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'meals' ? 'text-diet-green border-b-2 border-diet-green' : 'text-gray-500'}`}
            onClick={() => setActiveTab('meals')}
          >
            Beslenme Planı
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'tips' ? 'text-diet-green border-b-2 border-diet-green' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tips')}
          >
            Beslenme Önerileri
          </button>
        </div>
      </div>
      
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-diet-green text-lg mb-2">Günlük Kalori İhtiyacı</h3>
              <p className="text-2xl font-bold text-gray-800">{dietPlan.stats.targetCalories} kcal</p>
              <div className="text-sm text-gray-500 mt-1">
                <p>Bazal Metabolizma: {dietPlan.stats.bmr} kcal</p>
                <p>Toplam Enerji İhtiyacı: {dietPlan.stats.tdee} kcal</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-diet-green text-lg mb-2">Su Tüketimi</h3>
              <p className="text-2xl font-bold text-gray-800">{dietPlan.waterIntake.min}-{dietPlan.waterIntake.max} litre/gün</p>
              <div className="text-sm text-gray-500 mt-1">
                <p>Yaklaşık: {dietPlan.waterIntake.cups} bardak su</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-diet-green text-lg mb-2">Makro Besin Dağılımı</h3>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Protein</p>
                  <p className="font-bold text-gray-800">{dietPlan.macros.protein.grams}g</p>
                  <p className="text-xs text-gray-500">%{dietPlan.macros.protein.percentage}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Karbonhidrat</p>
                  <p className="font-bold text-gray-800">{dietPlan.macros.carbs.grams}g</p>
                  <p className="text-xs text-gray-500">%{dietPlan.macros.carbs.percentage}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Yağ</p>
                  <p className="font-bold text-gray-800">{dietPlan.macros.fat.grams}g</p>
                  <p className="text-xs text-gray-500">%{dietPlan.macros.fat.percentage}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-diet-green text-xl mb-4">Beslenme Önerileri</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="list-disc list-inside space-y-2">
                <li>Günde en az 2-3 litre su içmeye özen gösterin.</li>
                <li>Öğünlerinizi düzenli saatlerde tüketin ve öğün atlamayın.</li>
                <li>Besinleri iyice çiğneyerek yavaş yavaş tüketin.</li>
                <li>Yemeklerinizi pişirirken kızartma yerine ızgara, haşlama, fırında pişirme gibi sağlıklı pişirme yöntemlerini tercih edin.</li>
                <li>Tuz tüketiminizi sınırlandırın ve yemeklerinizde baharat kullanmayı tercih edin.</li>
                <li>Rafine şeker tüketimini azaltın, tatlı ihtiyacınız için meyve gibi doğal tatlıları tercih edin.</li>
                <li>Haftada en az 3-4 kez 30-45 dakikalık egzersiz yapın.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'meals' && (
        <div>
          <h3 className="font-bold text-diet-green text-xl mb-4">Günlük Beslenme Planı</h3>
          
          <div className="space-y-6">
            {Object.keys(dietPlan.mealPlan).map(meal => {
              const mealInfo = dietPlan.mealPlan[meal];
              let mealTitle = '';
              
              switch(meal) {
                case 'breakfast':
                  mealTitle = 'Kahvaltı';
                  break;
                case 'lunch':
                  mealTitle = 'Öğle Yemeği';
                  break;
                case 'dinner':
                  mealTitle = 'Akşam Yemeği';
                  break;
                default:
                  const snackNumber = meal.replace('snack', '');
                  mealTitle = `Ara Öğün ${snackNumber}`;
              }
              
              return (
                <div key={meal} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-gray-800">{mealTitle}</h4>
                    <span className="text-sm text-gray-500">Hedef: {mealInfo.targetCalories} kcal</span>
                  </div>
                  <p className="text-gray-700">{mealInfo.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <button 
              className="bg-diet-green text-white py-2 px-6 rounded-lg hover:bg-green-600 transition"
              onClick={() => generateDietPlan(userInfo)}
            >
              Farklı Öneriler Al
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Beğenmediğiniz yemekler için alternatif öneriler almak için tıklayın.
            </p>
          </div>
        </div>
      )}
      
      {activeTab === 'tips' && (
        <div>
          <h3 className="font-bold text-diet-green text-xl mb-4">Beslenme Önerileri</h3>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Protein Kaynakları</h4>
              <p className="text-gray-700 mb-2">Günlük protein ihtiyacınız: <span className="font-bold">{dietPlan.macros.protein.grams}g</span></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Tavuk göğsü (100g) - 24g protein</li>
                <li>Yumurta (1 adet) - 6g protein</li>
                <li>Yoğurt (1 kase) - 10g protein</li>
                <li>Kırmızı et (100g) - 20g protein</li>
                <li>Balık (100g) - 22g protein</li>
                <li>Mercimek (100g pişmiş) - 9g protein</li>
                <li>Peynir (30g) - 7g protein</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Sağlıklı Karbonhidrat Kaynakları</h4>
              <p className="text-gray-700 mb-2">Günlük karbonhidrat ihtiyacınız: <span className="font-bold">{dietPlan.macros.carbs.grams}g</span></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Tam tahıllı ekmek (1 dilim) - 15g karbonhidrat</li>
                <li>Yulaf ezmesi (1/2 kase) - 27g karbonhidrat</li>
                <li>Bulgur (1/2 kase pişmiş) - 17g karbonhidrat</li>
                <li>Kahverengi pirinç (1/2 kase pişmiş) - 22g karbonhidrat</li>
                <li>Patates (1 orta boy) - 30g karbonhidrat</li>
                <li>Muz (1 adet) - 27g karbonhidrat</li>
                <li>Kuru baklagiller (100g pişmiş) - 20g karbonhidrat</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Sağlıklı Yağ Kaynakları</h4>
              <p className="text-gray-700 mb-2">Günlük yağ ihtiyacınız: <span className="font-bold">{dietPlan.macros.fat.grams}g</span></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Zeytinyağı (1 yemek kaşığı) - 14g yağ</li>
                <li>Avokado (1/2 adet) - 15g yağ</li>
                <li>Ceviz (30g) - 19g yağ</li>
                <li>Badem (30g) - 15g yağ</li>
                <li>Fındık (30g) - 18g yağ</li>
                <li>Keten tohumu (1 yemek kaşığı) - 4g yağ</li>
                <li>Yumurta sarısı (1 adet) - 5g yağ</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Dışarıda Yemek Yerken</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Izgara et, tavuk veya balık tercih edin.</li>
                <li>Salata veya sebze garnitürü isteyin.</li>
                <li>Sulu ve yağlı soslardan kaçının.</li>
                <li>Tam tahıllı ekmek/bulgur/pirinç gibi seçenekleri tercih edin.</li>
                <li>Tatlı yerine meyve veya sade Türk kahvesi tercih edin.</li>
                <li>Alkollü içecekler yerine su, ayran veya şekersiz içecekler için.</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Alternatif Ara Öğün Fikirleri</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Yarım yağlı lor peyniri (4 yemek kaşığı) + salatalık/domates</li>
                <li>Yarım yağlı ayran (1 bardak) + tam tahıllı kraker (3-4 adet)</li>
                <li>Ceviz, badem, fındık karışımı (1 avuç)</li>
                <li>Mevsim meyveleri (1 porsiyon)</li>
                <li>Ev yapımı kefir (1 su bardağı) + tarçın</li>
                <li>Tam tahıllı ekmek (1 dilim) + 1 tatlı kaşığı pekmez</li>
                <li>Labne peynir (2 yemek kaşığı) + salatalık</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietPlanGenerator; 