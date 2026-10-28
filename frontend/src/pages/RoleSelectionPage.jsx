import React, { useState, useEffect } from 'react';
import { PORTAL_TITLE, PORTAL_SUBTITLE, ROLES } from '../utils/constants';
import RoleCard from '../components/role/RoleCard';
import { healthService } from '../services/healthService';
import { challengeService } from '../services/challengeService';
import { SamadhanSetuEmblem } from '../components/common/SamadhanSetuLogo';
import { CheckCircle2, AlertCircle, Building, Users2, Lightbulb, Award, BarChart3 } from 'lucide-react';

const RoleSelectionPage = () => {
  const [serverHealth, setServerHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const verifyBackend = async () => {
      try {
        const res = await healthService.checkHealth();
        setServerHealth(res);
      } catch (err) {
        setServerHealth({ success: false, message: 'Backend service unreachable' });
      } finally {
        setIsCheckingHealth(false);
      }
    };

    const loadStats = async () => {
      try {
        const res = await challengeService.getStats();
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load portal stats:', err);
      }
    };

    verifyBackend();
    loadStats();
  }, []);

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* System Status Bar */}
        <div className="mb-8 flex items-center justify-between bg-white border border-gov-border px-4 py-2.5 rounded-sm text-xs font-serif shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gov-navy">System Status:</span>
            {isCheckingHealth ? (
              <span className="text-gray-500">Checking portal services...</span>
            ) : serverHealth?.success ? (
              <span className="inline-flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Backend Operational &bull; MongoDB Connected
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Backend Standby ({serverHealth?.message || 'Connecting'})
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4 text-gov-text-muted">
            <span>Framework: National & State Innovation Initiative</span>
            <span>&bull;</span>
            <span>Academic Cycle 2026-27</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="flex justify-center mb-4">
            <SamadhanSetuEmblem size={68} />
          </div>
          <div className="inline-block px-3.5 py-1 bg-gov-maroon-surface text-gov-maroon text-xs font-serif font-bold uppercase tracking-wider rounded-sm border border-gov-maroon-border mb-3">
            National & State Innovation Network &bull; समाधान सेतु
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gov-navy tracking-tight leading-tight mb-4">
            {PORTAL_TITLE}
          </h1>
          <p className="text-base sm:text-lg font-serif text-gov-text-secondary leading-relaxed">
            {PORTAL_SUBTITLE}
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2 text-xs font-serif text-gov-text-muted">
            <span>Please select your stakeholder role below to access dedicated tools and workflows</span>
          </div>
        </div>

        {/* Live Aggregated Statistics Bar */}
        {stats && (
          <div className="mb-10 bg-white border border-gov-border rounded-sm p-4 shadow-gov-card grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-gov-border">
            <div>
              <div className="text-2xl font-serif font-bold text-gov-maroon">{stats.total || 5}</div>
              <div className="text-[11px] font-serif text-gov-text-secondary uppercase mt-0.5">Reported Civic Challenges</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-gov-navy">{stats.verified || 4}</div>
              <div className="text-[11px] font-serif text-gov-text-secondary uppercase mt-0.5">Government Vetted</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-blue-700">{stats.inProgress || 2}</div>
              <div className="text-[11px] font-serif text-gov-text-secondary uppercase mt-0.5">University Solutions In Dev</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-emerald-700">{stats.resolved || 1}</div>
              <div className="text-[11px] font-serif text-gov-text-secondary uppercase mt-0.5">Deployed Pilot Innovations</div>
            </div>
          </div>
        )}

        {/* 5 Dedicated Stakeholder Portals */}
        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {ROLES.map((role) => (
            <div
              key={role.id}
              className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md lg:max-w-none flex"
            >
              <RoleCard role={role} />
            </div>
          ))}
        </div>

        {/* Informational Mission Section */}
        <div className="bg-white border border-gov-border rounded-sm p-8 shadow-gov-card">
          <div className="border-b border-gov-border pb-4 mb-6">
            <h2 className="text-xl font-serif font-bold text-gov-navy">
              Collaborative Problem-to-Solution Lifecycle
            </h2>
            <p className="text-xs font-serif text-gov-text-secondary mt-1">
              How civic challenges transform into deployable municipal and community solutions through Samadhan Setu
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-serif">
            <div className="border-l-2 border-gov-maroon pl-4 space-y-1">
              <div className="text-xs font-bold text-gov-maroon uppercase">Phase 1</div>
              <h4 className="font-bold text-gov-navy">Citizen Submission</h4>
              <p className="text-xs text-gov-text-secondary leading-relaxed">
                Residents report issues in waste management, water supply, air quality, traffic, or urban welfare.
              </p>
            </div>

            <div className="border-l-2 border-gov-navy pl-4 space-y-1">
              <div className="text-xs font-bold text-gov-navy uppercase">Phase 2</div>
              <h4 className="font-bold text-gov-navy">Government Validation</h4>
              <p className="text-xs text-gov-text-secondary leading-relaxed">
                Administrators verify reports, filter duplicates with AI semantic models, and prioritize challenges.
              </p>
            </div>

            <div className="border-l-2 border-gov-gold pl-4 space-y-1">
              <div className="text-xs font-bold text-gov-gold uppercase">Phase 3</div>
              <h4 className="font-bold text-gov-navy">University & Students</h4>
              <p className="text-xs text-gov-text-secondary leading-relaxed">
                Engineering and social science faculties form multidisciplinary teams to design practical prototypes.
              </p>
            </div>

            <div className="border-l-2 border-emerald-700 pl-4 space-y-1">
              <div className="text-xs font-bold text-emerald-700 uppercase">Phase 4</div>
              <h4 className="font-bold text-gov-navy">Industry Scaling</h4>
              <p className="text-xs text-gov-text-secondary leading-relaxed">
                Industry partners provide CSR funding, technical mentoring, and pilot deployment assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
