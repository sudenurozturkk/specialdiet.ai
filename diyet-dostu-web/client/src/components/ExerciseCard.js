import React from 'react';

const ExerciseCard = ({ exercise, onToggleComplete }) => {
  const { exercise: name, duration, completed } = exercise;
  
  return (
    <div className="exercise-card">
      <div className="flex items-center">
        <span className="text-diet-orange mr-2">🏋️‍♀️</span>
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-sm text-gray-600">{duration}</p>
        </div>
      </div>
      
      <div 
        className={`complete-button ${completed ? 'completed' : ''}`}
        onClick={() => onToggleComplete(exercise)}
      >
        {completed && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard; 