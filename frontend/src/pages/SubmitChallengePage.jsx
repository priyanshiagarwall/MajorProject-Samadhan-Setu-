import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { challengeService } from '../services/challengeService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
  Building,
  Upload
} from 'lucide-react';

export const DELHI_DISTRICTS = [
  'Central Delhi',
  'East Delhi',
  'New Delhi',
  'North Delhi',
  'North East Delhi',
  'North West Delhi',
  'Shahdara',
  'South Delhi',
  'South East Delhi',
  'South West Delhi',
  'West Delhi'
];

export const OFFICIAL_CATEGORIES = [
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

const SubmitChallengePage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedChallenge, setSubmittedChallenge] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      category: 'Water Management',
      district: 'Central Delhi',
      area: '',
      landmark: '',
      description: '',
      priority: 'medium',
      impact: 'Local community residents and daily commuters',
      expectedOutcome: '',
      evidenceUrl: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const coords = districtCoordinates[data.district] || { lat: 28.6139, lng: 77.2090 };

      const evidenceList = data.evidenceUrl?.trim()
        ? [
            {
              title: 'Initial Citizen Evidence',
              url: data.evidenceUrl.trim(),
              fileType: 'image/jpeg'
            }
          ]
        : [];

      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        district: data.district,
        priority: data.priority,
        impact: data.impact?.trim() || 'Community residents affected',
        expectedOutcome: data.expectedOutcome?.trim() || '',
        location: {
          area: data.area?.trim() || '',
          landmark: data.landmark?.trim() || '',
          coordinates: coords
        },
        evidence: evidenceList,
        tags: [
          data.category.toLowerCase().replace(/\s+/g, '-'),
          data.district.toLowerCase().replace(/\s+/g, '-')
        ]
      };

      const res = await challengeService.createChallenge(payload);
      const created = res?.data?.challenge || res?.challenge || res;
      setSubmittedChallenge(created);
      reset();
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(
        err.response?.data?.message ||
        err.message ||
        'Failed to submit challenge. Please check your network or try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully submitted, show success card
  if (submittedChallenge) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 font-serif animate-in fade-in duration-200">
        <div className="bg-emerald-50 border border-emerald-300 rounded-sm p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Problem Lodged Successfully
            </span>
            <h2 className="text-2xl font-bold text-gov-navy mt-1">
              Challenge Registered: {submittedChallenge.code || 'DEL-NEW'}
            </h2>
            <p className="text-xs text-gov-text-secondary max-w-lg mx-auto mt-2 leading-relaxed">
              Your civic problem statement <strong>"{submittedChallenge.title}"</strong> has been recorded in the Delhi Societal Innovation problem registry and queued for administrative review and university research allocation.
            </p>
          </div>

          <div className="bg-white border border-gov-border rounded-sm p-4 text-left max-w-md mx-auto text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gov-text-muted">Tracking Code:</span>
              <span className="font-bold text-gov-maroon">{submittedChallenge.code || 'DEL-NEW'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gov-text-muted">District:</span>
              <span className="font-semibold text-gov-navy">{submittedChallenge.district}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gov-text-muted">Category:</span>
              <span className="font-semibold text-gov-navy">{submittedChallenge.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gov-text-muted">Current Status:</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs">
                SUBMITTED / QUEUED
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {submittedChallenge._id && (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/client/challenges/${submittedChallenge._id}`)}
              >
                View Challenge Lifecycle &rarr;
              </Button>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/client/challenges')}
            >
              My Challenges
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSubmittedChallenge(null);
              }}
            >
              Submit Another Problem
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-serif">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-maroon font-bold uppercase tracking-wider mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>Government of NCT of Delhi &bull; Public Grievance & Innovation</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gov-navy">
            Submit a Community Challenge
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1">
            Lodge ground-level societal problems directly for academic evaluation, prototyping, and municipal pilot deployment.
          </p>
        </div>

        <Link to="/client" className="flex-shrink-0">
          <Button variant="subtle" size="sm" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Submission Error</h4>
            <p className="mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <Card
        accent="maroon"
        title="Civic Problem Statement Form"
        subtitle="Fill in ground observations with accurate geographical location and community disruption details"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
              Challenge / Problem Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Severe Waterlogging & Silt Blockage at Minto Bridge Underpass"
              className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2.5 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
              {...register('title', {
                required: 'Please enter a clear title for the challenge',
                minLength: { value: 10, message: 'Title must be at least 10 characters long' },
                maxLength: { value: 250, message: 'Title cannot exceed 250 characters' }
              })}
            />
            {errors.title && (
              <p className="text-red-600 mt-1 font-medium">{errors.title.message}</p>
            )}
            <p className="text-[11px] text-gov-text-muted mt-1">
              Provide a concise, descriptive summary of the societal challenge (10-250 characters).
            </p>
          </div>

          {/* Category & District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Civic Category *
              </label>
              <select
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
                {...register('category', { required: 'Please select a category' })}
              >
                {OFFICIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gov-text-muted mt-1">
                Select the civic domain matching your problem report.
              </p>
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Delhi District *
              </label>
              <select
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
                {...register('district', { required: 'Please select a Delhi district' })}
              >
                {DELHI_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gov-text-muted mt-1">
                Select the administrative district where the issue exists.
              </p>
            </div>
          </div>

          {/* Specific Area / Ward & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Specific Area / Ward / Locality
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Ward 42, Connaught Place Outer Circle"
                  className="w-full text-sm font-serif border border-gov-border rounded-sm pl-8 pr-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
                  {...register('area')}
                />
                <MapPin className="w-4 h-4 text-gov-maroon absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Prominent Landmark
              </label>
              <input
                type="text"
                placeholder="e.g., Near Shivaji Stadium Metro Station Gate 1"
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
                {...register('landmark')}
              />
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
              Detailed Problem Description & Ground Reality *
            </label>
            <textarea
              rows={5}
              placeholder="Provide specific details about the issue: How long has it persisted? How does it disrupt civic life, safety, sanitation, or health? What are the observable ground conditions?"
              className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2.5 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
              {...register('description', {
                required: 'Please provide a detailed description of the problem',
                minLength: {
                  value: 30,
                  message: 'Please provide at least 30 characters explaining the problem'
                }
              })}
            />
            {errors.description && (
              <p className="text-red-600 mt-1 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Priority / Urgency Selection */}
          <div>
            <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
              Estimated Urgency & Severity
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { value: 'low', label: 'Low', desc: 'Non-urgent maintenance' },
                { value: 'medium', label: 'Medium', desc: 'Regular community friction' },
                { value: 'high', label: 'High', desc: 'Significant disruption' },
                { value: 'critical', label: 'Critical', desc: 'Immediate safety or health hazard' }
              ].map((lvl) => (
                <label
                  key={lvl.value}
                  className="flex items-start p-2.5 border border-gov-border rounded-sm cursor-pointer hover:bg-gov-sand-100 transition-colors bg-white"
                >
                  <input
                    type="radio"
                    value={lvl.value}
                    className="accent-gov-maroon mt-0.5 mr-2"
                    {...register('priority')}
                  />
                  <div>
                    <span className="font-bold text-gov-navy capitalize block text-xs">
                      {lvl.label}
                    </span>
                    <span className="text-[10px] text-gov-text-muted leading-tight block">
                      {lvl.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Impact and Evidence URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Estimated Community Impact
              </label>
              <input
                type="text"
                placeholder="e.g., ~1,200 residential families and local schoolchildren"
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
                {...register('impact')}
              />
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Evidence / Photo Link (Optional)
              </label>
              <input
                type="url"
                placeholder="https://... (image URL or cloud drive document)"
                className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
                {...register('evidenceUrl')}
              />
            </div>
          </div>

          {/* Expected Outcome */}
          <div>
            <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
              Expected Outcome / Community Aspirations (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Automated solar-powered silt clearing pump with automated flood alarms"
              className="w-full text-sm font-serif border border-gov-border rounded-sm px-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon focus:border-gov-maroon outline-none"
              {...register('expectedOutcome')}
            />
          </div>

          {/* Notice box */}
          <div className="p-3 bg-gov-sand-50 border border-gov-border rounded-sm flex items-start space-x-2.5 text-[11px] text-gov-text-secondary">
            <Info className="w-4 h-4 text-gov-maroon flex-shrink-0 mt-0.5" />
            <p>
              Your challenge report will be registered in the public domain and evaluated by the Delhi Knowledge Advisory Team for allocation to engineering institutes (DTU, NSUT, IIIT-Delhi) for prototype research.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gov-border flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="subtle"
              size="md"
              onClick={() => navigate('/client')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering Problem Statement...' : 'Submit Challenge to State Portal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubmitChallengePage;
