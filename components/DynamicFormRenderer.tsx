'use client';

import { useState } from 'react';

export interface FormQuestion {
  key: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'json';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

export interface FormCategory {
  category: string;
  category_label: string;
  questions: FormQuestion[];
}

interface DynamicFormRendererProps {
  categories: FormCategory[];
  formData: Record<string, any>;
  errors: Record<string, string>;
  onInputChange: (key: string, value: any) => void;
  onValidate?: (key: string, value: any) => string | null;
}

export default function DynamicFormRenderer({
  categories,
  formData,
  errors,
  onInputChange,
  onValidate
}: DynamicFormRendererProps) {

  const validateInput = (question: FormQuestion, value: any): string | null => {
    // Required validation
    if (question.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Bu alan zorunludur';
    }

    // Type-specific validation
    if (value && question.validation) {
      const validation = question.validation;

      // String length validation
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          return `En az ${validation.minLength} karakter olmalıdır`;
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          return `En fazla ${validation.maxLength} karakter olmalıdır`;
        }
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            return 'Geçersiz format';
          }
        }
      }

      // Number validation
      if (question.type === 'number' && typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          return `En az ${validation.min} olmalıdır`;
        }
        if (validation.max !== undefined && value > validation.max) {
          return `En fazla ${validation.max} olmalıdır`;
        }
      }
    }

    // Custom validation
    if (onValidate) {
      return onValidate(question.key, value);
    }

    return null;
  };

  const handleInputChange = (question: FormQuestion, value: any) => {
    onInputChange(question.key, value);
    
    // Real-time validation
    const error = validateInput(question, value);
    if (error && onValidate) {
      onValidate(question.key, value);
    }
  };

  const shouldShowQuestion = (question: FormQuestion): boolean => {
    if (!question.conditional) {
      return true;
    }

    const dependentValue = formData[question.conditional.dependsOn];
    return dependentValue === question.conditional.value;
  };

  const renderQuestion = (question: FormQuestion) => {
    if (!shouldShowQuestion(question)) {
      return null;
    }

    const value = formData[question.key] || '';
    const hasError = !!errors[question.key];

    const baseInputClasses = `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
    }`;

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(question, e.target.value)}
            className={baseInputClasses}
            placeholder={question.placeholder}
            maxLength={question.validation?.maxLength}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(question, e.target.value)}
            className={baseInputClasses}
            rows={4}
            placeholder={question.placeholder}
            maxLength={question.validation?.maxLength}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(question, e.target.value)}
            className={baseInputClasses}
          >
            <option value="">Seçiniz...</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    handleInputChange(question, newValues);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(question, parseInt(e.target.value) || 0)}
            className={baseInputClasses}
            placeholder={question.placeholder}
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(question, parsed);
              } catch {
                handleInputChange(question, e.target.value);
              }
            }}
            className={baseInputClasses}
            rows={6}
            placeholder={question.placeholder || 'JSON formatında veri girin...'}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(question, e.target.value)}
            className={baseInputClasses}
            placeholder={question.placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      {categories.map((category, categoryIndex) => (
        <div key={category.category} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {category.category_label}
          </h3>
          
          <div className="space-y-6">
            {category.questions.map((question) => {
              if (!shouldShowQuestion(question)) {
                return null;
              }

              return (
                <div key={question.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {renderQuestion(question)}
                  
                  {errors[question.key] && (
                    <p className="text-red-500 text-sm mt-1">{errors[question.key]}</p>
                  )}
                  
                  {/* Character count for text inputs */}
                  {(question.type === 'text' || question.type === 'textarea') && 
                   question.validation?.maxLength && 
                   formData[question.key] && (
                    <p className="text-gray-500 text-xs mt-1">
                      {(formData[question.key] || '').length} / {question.validation.maxLength} karakter
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}