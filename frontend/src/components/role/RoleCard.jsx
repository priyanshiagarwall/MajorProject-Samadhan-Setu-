import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Users, ShieldCheck, GraduationCap, Lightbulb, Building2, ArrowRight } from 'lucide-react';

const iconMap = {
  Users,
  ShieldCheck,
  GraduationCap,
  Lightbulb,
  Building2
};

const RoleCard = ({ role, className = '' }) => {
  const navigate = useNavigate();
  const IconComponent = iconMap[role.iconName] || Users;

  const handleContinue = () => {
    navigate(role.path);
  };

  const handleLogin = (e) => {
    e.stopPropagation();
    navigate(role.loginPath);
  };

  return (
    <div className={`gov-card flex flex-col justify-between p-6 bg-white border border-gov-border rounded-sm hover:border-gov-maroon hover:shadow-gov-hover transition-all duration-200 group relative w-full h-full ${className}`}>
      {/* Top indicator strip for subtle accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-sm transition-colors duration-200 group-hover:h-1.5"
        style={{ backgroundColor: role.accentColor || '#7a1113' }}
      />

      <div>
        {/* Header with Icon and Badge */}
        <div className="flex items-start justify-between mb-4 mt-1">
          <div
            className="w-12 h-12 rounded-sm flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: role.accentColor || '#7a1113' }}
          >
            <IconComponent className="w-6 h-6" />
          </div>
          <Badge variant={role.colorVariant === 'navy' ? 'navy' : role.colorVariant === 'gold' ? 'gold' : 'maroon'}>
            {role.badgeText}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-xl font-serif font-bold text-gov-navy mb-2 group-hover:text-gov-maroon transition-colors">
          {role.title}
        </h3>

        {/* Short description */}
        <p className="text-sm font-serif text-gov-text-secondary leading-relaxed mb-6">
          {role.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gov-border/60 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleContinue}
            className="flex-1"
          >
            <span>{role.actionLabel || 'Enter Portal'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>

          <Button
            variant="subtle"
            size="sm"
            onClick={handleLogin}
            className="sm:w-auto px-4"
          >
            Sign In
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-serif pt-1 text-gov-text-muted">
          <span>New to this role?</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(role.registerPath);
            }}
            className="text-gov-maroon font-semibold hover:underline cursor-pointer"
          >
            Register as {role.badgeText} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
