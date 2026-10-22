import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { challengeService } from '../../services/challengeService';
import Button from '../common/Button';
import { X, AlertCircle, CheckCircle2, MapPin, Upload } from 'lucide-react';

const districtCoordinates = {
  'Central Delhi': { lat: 28.6448, lng: 77.2167 },
  'East Delhi': { lat: 28.6280, lng: 77.2950 },
  'New Delhi': { lat: 28.6139, lng: 77.2090 },
  'North Delhi': { lat: 28.7041, lng: 77.1025 },
  'North East Delhi': { lat: 28.7180, lng: 77.2750 },
  'North West Delhi': { lat: 28.7500, lng: 77.1200 },
  'Shahdara': { lat: 28.6738, lng: 77.2882 },
  'South Delhi': { lat: 28.5355, lng: 77.2250 },
  'South East Delhi': { lat: 28.5500, lng: 77.2700 },
  'South West Delhi': { lat: 28.5921, lng: 77.0460 },
  'West Delhi': { lat: 28.6667, lng: 77.0667 }
};

const SubmitChallengeModal = ({ isOpen, onClose, onSuccess }) => {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'Water Management',
      district: 'Central Delhi',
      area: '',
      landmark: '',
      priority: 'medium'
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const coords = districtCoordinates[data.district] || { lat: 28.6139, lng: 77.2090 };

      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        district: data.district,
        priority: data.priority,
        location: {
          area: data.area?.trim() || '',
          landmark: data.landmark?.trim() || '',
          coordinates: coords
        },
        tags: [data.category.toLowerCase().replace(/\s+/g, '-'), data.district.toLowerCase().replace(/\s+/g, '-')]
      };

      const res = await challengeService.createChallenge(payload);
      reset();
      if (onSuccess) onSuccess(res?.data?.challenge || res);
      if (onClose) onClose();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
        err.message ||
        'Failed to submit problem report. Please ensure you are logged in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Water Management',
    'Sanitation',
    'Urban Infrastructure',
    'Environment',
    'Healthcare',
    'Education',
    'Energy',
    'Accessibility',
    'Public Services',
    'Agriculture',
    'Rural Livelihoods',
    'Other'
  ];

  const districts = Object.keys(districtCoordinates);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-gov-border rounded-sm max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gov-maroon text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold">
              Submit Citizen Societal Challenge
            </h3>
            <p className="text-xs font-serif text-rose-100">
              Government of NCT of Delhi &bull; Public Problem Identification Form
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-rose-200 hover:text-white hover:bg-gov-maroon-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-serif rounded-sm flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              Challenge Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Severe Waterlogging & Silt Blockage at Minto Bridge Underpass"
              className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 10, message: 'Minimum 10 characters required' }
              })}
            />
            {errors.title && (
              <span className="text-xs text-red-600 font-serif">{errors.title.message}</span>
            )}
          </div>

          {/* Category & District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Civic Category *
              </label>
              <select
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon outline-none"
                {...register('category', { required: true })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Delhi District *
              </label>
              <select
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon outline-none"
                {...register('district', { required: true })}
              >
                {districts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Area & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Specific Area / Ward
              </label>
              <input
                type="text"
                placeholder="e.g., Ward 42, Connaught Place Outer Circle"
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
                {...register('area')}
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Prominent Landmark
              </label>
              <input
                type="text"
                placeholder="e.g., Near Shivaji Stadium Metro Station"
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
                {...register('landmark')}
              />
            </div>
          </div>

          {/* Detailed Problem Description */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              Detailed Problem Description & Community Impact *
            </label>
            <textarea
              rows={4}
              placeholder="Describe the recurring issue, how it impacts daily life, estimated population affected, and any previous attempts made."
              className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
              {...register('description', {
                required: 'Detailed description is required',
                minLength: { value: 30, message: 'Please provide at least 30 characters explaining the problem' }
              })}
            />
            {errors.description && (
              <span className="text-xs text-red-600 font-serif">{errors.description.message}</span>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              Estimated Urgency / Severity
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs font-serif">
              {['low', 'medium', 'high', 'critical'].map((p) => (
                <label
                  key={p}
                  className="flex items-center space-x-1.5 p-2 border border-gov-border rounded-sm cursor-pointer hover:bg-gov-sand-100"
                >
                  <input
                    type="radio"
                    value={p}
                    className="accent-gov-maroon"
                    {...register('priority')}
                  />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-gov-border flex items-center justify-end space-x-3">
            <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Report...' : 'Submit Challenge to State Portal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitChallengeModal;
