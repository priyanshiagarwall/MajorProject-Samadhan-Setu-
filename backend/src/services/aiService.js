const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const getAIBaseUrl = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 6000; // 6 seconds timeout

/**
 * Helper to execute HTTP requests to the FastAPI microservice with timeout
 */
const postJSON = async (endpoint, payload) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${getAIBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI Service responded with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const aiService = {
  /**
   * Classify challenge title and description
   */
  classify: async (title, description) => {
    try {
      return await postJSON('/ai/classify', { title, description });
    } catch (error) {
      console.warn(`[AI Service Notice] Classification unavailable: ${error.message}`);
      return {
        category: 'Other',
        subcategory: 'unclassified',
        confidence: 0.0,
        requiresHumanReview: true,
        explanation: 'AI Service currently offline or timed out. Human review mandated.'
      };
    }
  },

  /**
   * Recommend priority based on urgency, severity, and demographics
   */
  recommendPriority: async ({ title, description, urgency, severity, affectedPopulation }) => {
    try {
      return await postJSON('/ai/priority', {
        title,
        description,
        urgency,
        severity,
        affected_population: affectedPopulation
      });
    } catch (error) {
      console.warn(`[AI Service Notice] Priority estimation unavailable: ${error.message}`);
      return {
        recommendation: (urgency === 'immediate' || severity === 'critical') ? 'CRITICAL' : 'MEDIUM',
        confidence: 0.0,
        score: 0.0,
        reasoning: 'AI service offline. Default fallback based on submitter flags.',
        isRecommendation: true,
        disclaimer: 'Fallback priority estimate. Requires administrative confirmation.'
      };
    }
  },

  /**
   * Check for potential duplicates against existing challenges
   */
  checkDuplicates: async ({ title, description, existingChallenges = [], threshold = 0.70 }) => {
    try {
      const payload = {
        title,
        description,
        existing_challenges: existingChallenges.map((c) => ({
          id: c._id ? c._id.toString() : c.id,
          code: c.code,
          title: c.title,
          description: c.description
        })),
        threshold
      };
      return await postJSON('/ai/duplicate-check', payload);
    } catch (error) {
      console.warn(`[AI Service Notice] Duplicate check unavailable: ${error.message}`);
      return {
        possibleDuplicate: false,
        similarityScore: 0.0,
        matchingChallengeIds: [],
        topMatches: []
      };
    }
  },

  /**
   * Generate structured problem summary
   */
  summarize: async ({ title, description, location, district }) => {
    try {
      return await postJSON('/ai/summarize', {
        title,
        description,
        location,
        district
      });
    } catch (error) {
      console.warn(`[AI Service Notice] Summarization unavailable: ${error.message}`);
      return {
        summary: {
          problem: title,
          affectedGroup: 'Citizens in municipal reporting zone',
          location: `${location || ''} ${district || ''}`.trim() || 'Delhi',
          expectedOutcome: 'Engineering prototype or municipal corrective action'
        },
        rawSummary: `${title}. Reported at ${location || district || 'Delhi'}.`
      };
    }
  },

  /**
   * Comprehensive analysis running all 4 models in parallel with safe degradation
   */
  analyzeChallenge: async (challengeData, existingChallenges = []) => {
    const { title, description, urgency, severity, impact, location, district } = challengeData;

    try {
      const [classification, priority, duplicates, summaryRes] = await Promise.all([
        aiService.classify(title, description),
        aiService.recommendPriority({
          title,
          description,
          urgency,
          severity,
          affectedPopulation: impact
        }),
        aiService.checkDuplicates({
          title,
          description,
          existingChallenges,
          threshold: 0.70
        }),
        aiService.summarize({
          title,
          description,
          location: location?.area || location?.landmark,
          district
        })
      ]);

      return {
        aiClassification: classification,
        aiPriority: {
          recommendedPriority: priority.recommendation,
          confidence: priority.confidence,
          reasoning: priority.reasoning
        },
        aiDuplicateScore: duplicates.similarityScore || 0,
        aiDuplicates: (duplicates.topMatches || []).map((m) => ({
          challengeId: m.id,
          code: m.code,
          title: m.title,
          similarityScore: m.similarityScore
        })),
        aiSummary: summaryRes.summary || {}
      };
    } catch (err) {
      console.error('[AI Service Error] Batch analysis failed:', err.message);
      return {
        aiClassification: {
          category: challengeData.category || 'Other',
          confidence: 0.0,
          requiresHumanReview: true,
          explanation: 'AI Service analysis bypassed due to timeout.'
        },
        aiPriority: {
          recommendedPriority: 'MEDIUM',
          confidence: 0.0,
          reasoning: 'AI Service unavailable.'
        },
        aiDuplicateScore: 0,
        aiDuplicates: [],
        aiSummary: {
          problem: title,
          affectedGroup: 'Citizens and commuters',
          location: district || 'Delhi',
          expectedOutcome: 'Technological prototype'
        }
      };
    }
  },

  /**
   * Match suitable universities for a validated challenge
   */
  matchUniversities: async (challenge, universities = []) => {
    try {
      const payload = {
        challenge: {
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          required_technologies: challenge.tags || [],
          keywords: (challenge.title + ' ' + challenge.description).split(/\s+/).slice(0, 20)
        },
        universities: universities.map((u) => ({
          id: u.user ? u.user.toString() : u._id.toString(),
          name: u.name,
          district: u.district,
          researchAreas: u.researchAreas || [],
          expertise: u.expertise || [],
          labsAndFacilities: u.labsAndFacilities || [],
          innovationCentre: u.innovationCentre || '',
          incubationFacilities: u.incubationFacilities || '',
          previousProjectAreas: u.previousProjectAreas || u.researchAreas || [],
          facultySpecializations: (u.facultySpecializations || []).map((f) => ({
            facultyName: f.facultyName,
            department: f.department,
            specialization: f.specialization
          }))
        }))
      };

      const res = await postJSON('/ai/match-universities', payload);
      return res.recommendations || [];
    } catch (error) {
      console.warn(`[AI Service Notice] University matching offline: ${error.message}`);
      return universities.map((u, idx) => ({
        universityId: u.user || u._id,
        universityName: u.name,
        score: Math.max(0.65, 0.90 - idx * 0.08),
        percentage: Math.round(Math.max(65, 90 - idx * 8)),
        matchingReasons: [
          `Recognized municipal research capabilities in ${u.district || 'Delhi'}.`,
          `Established faculties available in ${u.departments?.[0] || 'Engineering and Applied Sciences'}.`
        ],
        explainableSummary: 'Recommended based on expertise, facilities and project requirements.'
      }));
    }
  },

  /**
   * Match suitable corporate and industry partners for a university project
   */
  matchIndustries: async (project, industries = []) => {
    try {
      const payload = {
        project: {
          title: project.title,
          description: project.description,
          technologies: project.technologies || project.proposal?.technology || [],
          budget: project.budget || 1000000,
          stage: project.status,
          required_resources: project.requiredResources || ['Telemetry equipment', 'Field testing permits', 'Prototyping facilities']
        },
        industries: industries.map((ind) => ({
          id: ind.user ? ind.user.toString() : ind._id.toString(),
          name: ind.name,
          organizationType: ind.organizationType || 'Industry',
          industrySector: ind.industrySector || '',
          expertise: ind.expertise || [],
          technologies: ind.technologies || [],
          fundingCapability: ind.fundingCapability || {},
          mentorshipCapability: ind.mentorshipCapability || {},
          implementationCapability: ind.implementationCapability || {}
        }))
      };

      const res = await postJSON('/ai/match-industries', payload);
      return res.recommendations || [];
    } catch (error) {
      console.warn(`[AI Service Notice] Industry matching offline: ${error.message}`);
      return industries.map((ind, idx) => ({
        industryId: ind.user || ind._id,
        organizationName: ind.name,
        organizationType: ind.organizationType || 'Industry',
        industrySector: ind.industrySector || 'Technology & Innovation',
        score: Math.max(0.65, 0.88 - idx * 0.07),
        percentage: Math.round(Math.max(65, 88 - idx * 7)),
        matchingReasons: [
          `Registered GNCTD industry innovation partner in ${ind.district || 'Delhi'}.`,
          `Active corporate capability in ${ind.industrySector || 'Technology Development'}.`
        ],
        explainableSummary: 'Recommended based on technical capability, CSR alignment and pilot testing infrastructure.'
      }));
    }
  },

  /**
   * Phase 3: Strict response validators (additive) - ZERO invented default values
   */
  validateClassification: (data, validCategories = []) => {
    if (!data || typeof data !== 'object') return null;
    const { category, subcategory, confidence, requiresHumanReview, explanation } = data;
    if (typeof category !== 'string' || !validCategories.includes(category)) return null;
    if (typeof subcategory !== 'string' || !subcategory.trim()) return null;
    if (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 1) return null;
    if (typeof requiresHumanReview !== 'boolean') return null;
    if (typeof explanation !== 'string' || !explanation.trim()) return null;

    return {
      category,
      subcategory: subcategory.trim(),
      confidence: Number(confidence.toFixed(2)),
      requiresHumanReview,
      explanation: explanation.trim()
    };
  },

  validatePriority: (data) => {
    if (!data || typeof data !== 'object') return null;
    const { recommendation, confidence, reasoning } = data;
    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (typeof recommendation !== 'string' || !validPriorities.includes(recommendation.toUpperCase())) return null;
    if (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 1) return null;
    if (typeof reasoning !== 'string' || !reasoning.trim()) return null;

    return {
      recommendedPriority: recommendation.toUpperCase(),
      confidence: Number(confidence.toFixed(2)),
      reasoning: reasoning.trim()
    };
  },

  validateDuplicates: (data, comparisonSet = []) => {
    if (!data || typeof data !== 'object') return null;
    const { similarityScore, topMatches } = data;
    if (typeof similarityScore !== 'number' || isNaN(similarityScore) || similarityScore < 0 || similarityScore > 1) return null;
    if (!Array.isArray(topMatches)) return null;

    const validIds = new Map();
    for (const c of comparisonSet) {
      const cid = (c?._id || c?.id)?.toString();
      if (cid) {
        validIds.set(cid, c);
      }
    }

    const validMatches = [];
    for (const m of topMatches) {
      if (!m || typeof m !== 'object') continue;
      const matchId = (m.id || m._id)?.toString();
      if (!matchId) continue;
      if (!mongoose.Types.ObjectId.isValid(matchId)) continue;
      const original = validIds.get(matchId);
      if (!original) continue;

      if (typeof m.similarityScore !== 'number' || isNaN(m.similarityScore) || m.similarityScore < 0 || m.similarityScore > 1) continue;

      validMatches.push({
        challengeId: matchId,
        code: typeof m.code === 'string' && m.code.trim() ? m.code.trim() : (original.code || ''),
        title: typeof m.title === 'string' && m.title.trim() ? m.title.trim() : (original.title || ''),
        similarityScore: Number(m.similarityScore.toFixed(3))
      });
    }

    return {
      aiDuplicateScore: Number(similarityScore.toFixed(3)),
      aiDuplicates: validMatches.slice(0, 5)
    };
  },

  validateSummary: (data) => {
    if (!data || typeof data !== 'object' || !data.summary || typeof data.summary !== 'object') return null;
    const s = data.summary;
    if (typeof s.problem !== 'string' || !s.problem.trim()) return null;
    if (typeof s.affectedGroup !== 'string' || !s.affectedGroup.trim()) return null;
    if (typeof s.location !== 'string' || !s.location.trim()) return null;
    if (typeof s.expectedOutcome !== 'string' || !s.expectedOutcome.trim()) return null;

    return {
      problem: s.problem.trim(),
      affectedGroup: s.affectedGroup.trim(),
      location: s.location.trim(),
      expectedOutcome: s.expectedOutcome.trim()
    };
  },

  /**
   * Phase 3: Real challenge creation analysis (additive)
   * 2500ms bounded timeout, Promise.allSettled, zero invented defaults
   */
  analyzeChallengeForCreation: async (challengeData, existingChallenges = []) => {
    const CREATION_TIMEOUT_MS = 2500;

    const postCreationJSON = async (endpoint, payload) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CREATION_TIMEOUT_MS);
      try {
        const response = await fetch(`${getAIBaseUrl()}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`AI Service responded with status ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    const { title, description, urgency, severity, impact, location, district } = challengeData;

    // Send only values that actually exist (no fake urgency/severity/impact)
    const priorityPayload = { title, description };
    if (urgency) priorityPayload.urgency = urgency;
    if (severity) priorityPayload.severity = severity;
    if (impact) priorityPayload.affected_population = impact;

    const duplicatePayload = {
      title,
      description,
      existing_challenges: existingChallenges.map((c) => ({
        id: c._id ? c._id.toString() : c.id,
        code: c.code,
        title: c.title,
        description: c.description
      })),
      threshold: 0.70
    };

    const summarizePayload = {
      title,
      description,
      location: location?.area || location?.landmark || undefined,
      district: district || undefined
    };

    const validCategories = Challenge.schema?.path('category')?.enumValues || [];

    const [classResult, priResult, dupResult, sumResult] = await Promise.allSettled([
      postCreationJSON('/ai/classify', { title, description }),
      postCreationJSON('/ai/priority', priorityPayload),
      postCreationJSON('/ai/duplicate-check', duplicatePayload),
      postCreationJSON('/ai/summarize', summarizePayload)
    ]);

    const result = {};

    if (classResult.status === 'fulfilled' && classResult.value) {
      const valid = aiService.validateClassification(classResult.value, validCategories);
      if (valid) result.aiClassification = valid;
    }

    if (priResult.status === 'fulfilled' && priResult.value) {
      const valid = aiService.validatePriority(priResult.value);
      if (valid) result.aiPriority = valid;
    }

    if (dupResult.status === 'fulfilled' && dupResult.value) {
      const valid = aiService.validateDuplicates(dupResult.value, existingChallenges);
      if (valid) {
        result.aiDuplicateScore = valid.aiDuplicateScore;
        result.aiDuplicates = valid.aiDuplicates;
      }
    }

    if (sumResult.status === 'fulfilled' && sumResult.value) {
      const valid = aiService.validateSummary(sumResult.value);
      if (valid) result.aiSummary = valid;
    }

    return result;
  },

  /**
   * Phase 10: Strict response validator for university matching (additive)
   * Enforces that all recommendations originate from the actual AI service response:
   * - Drops entries whose universityId is not in the sent set
   * - Deduplicates ids (keeps first/highest occurrence)
   * - Drops entries whose percentage != round(score * 100)
   * - Requires matchingReasons to be an array of non-empty strings
   * - Enforces score within 0.0 - 1.0 and percentage within 0 - 100
   * - Preserves the exact Challenge.js entry shape without invented DB fields
   */
  validateUniversityRecommendations: (rawRecommendations, sentUniversities = []) => {
    if (!Array.isArray(rawRecommendations)) return [];

    const sentMap = new Map();
    for (const u of sentUniversities) {
      if (!u || !u.user) continue;
      const uid = u.user.toString();
      sentMap.set(uid, u);
    }

    const seenIds = new Set();
    const validated = [];

    for (const r of rawRecommendations) {
      if (!r || typeof r !== 'object') continue;

      const rId = (r.universityId || r.id || r._id)?.toString();
      if (!rId) continue;

      // Drop entries whose universityId is not in the sent set
      if (!sentMap.has(rId)) continue;

      // Deduplicate ids
      if (seenIds.has(rId)) continue;

      // Score within 0-1 and percentage within 0-100
      if (typeof r.score !== 'number' || isNaN(r.score) || r.score < 0 || r.score > 1) continue;
      if (typeof r.percentage !== 'number' || isNaN(r.percentage) || r.percentage < 0 || r.percentage > 100) continue;

      // Drop entries whose percentage != round(score * 100)
      if (r.percentage !== Math.round(r.score * 100)) continue;

      // Require matchingReasons to be an array of non-empty strings
      if (!Array.isArray(r.matchingReasons) || r.matchingReasons.length === 0) continue;
      const allNonEmptyStrings = r.matchingReasons.every((m) => typeof m === 'string' && m.trim().length > 0);
      if (!allNonEmptyStrings) continue;

      seenIds.add(rId);

      const originalUni = sentMap.get(rId);
      const cleanReasons = r.matchingReasons.map((m) => m.trim());
      const summary = (typeof r.explainableSummary === 'string' && r.explainableSummary.trim())
        ? r.explainableSummary.trim()
        : 'Recommended based on expertise, facilities and project requirements.';
      const uniName = (typeof r.universityName === 'string' && r.universityName.trim())
        ? r.universityName.trim()
        : (originalUni.name || 'University');

      validated.push({
        universityId: rId,
        universityName: uniName,
        score: Number(r.score.toFixed(2)),
        percentage: r.percentage,
        matchingReasons: cleanReasons,
        explainableSummary: summary
      });
    }

    validated.sort((a, b) => b.score - a.score || b.percentage - a.percentage);
    return validated;
  },

  /**
   * Phase 10: Strict AI university matching using real expertise (additive)
   * 4000ms bounded timeout, Option 1C empty-profile filtering, zero synthetic fallback scores.
   * Returns metadata { success, source: 'AI_SERVICE' | 'UNAVAILABLE', count, recommendations, error? }.
   */
  matchUniversitiesStrict: async (challenge, universities = [], options = {}) => {
    const { excludeEmptyProfiles = true } = options;
    const STRICT_TIMEOUT_MS = 4000;

    if (!challenge || typeof challenge !== 'object' || !challenge.title || !challenge.description) {
      return {
        success: false,
        source: 'UNAVAILABLE',
        count: 0,
        recommendations: [],
        error: 'Invalid challenge data: title and description are required.'
      };
    }

    if (!Array.isArray(universities) || universities.length === 0) {
      return {
        success: true,
        source: 'AI_SERVICE',
        count: 0,
        recommendations: []
      };
    }

    // A profile is empty only when expertise, researchAreas, labsAndFacilities AND facultySpecializations are all empty/missing
    const isProfileEmpty = (u) => {
      const hasExpertise = Array.isArray(u.expertise) && u.expertise.some((e) => typeof e === 'string' && e.trim().length > 0);
      const hasResearchAreas = Array.isArray(u.researchAreas) && u.researchAreas.some((r) => typeof r === 'string' && r.trim().length > 0);
      const hasLabs = Array.isArray(u.labsAndFacilities) && u.labsAndFacilities.some((l) => typeof l === 'string' && l.trim().length > 0);
      const hasFaculty = Array.isArray(u.facultySpecializations) && u.facultySpecializations.some((f) => f && (f.specialization || f.facultyName));
      return !hasExpertise && !hasResearchAreas && !hasLabs && !hasFaculty;
    };

    // Exclude any university that has no user field (User ObjectId is required for authentication/marketplace matching)
    const universitiesWithUser = universities.filter((u) => u && u.user);

    const candidates = excludeEmptyProfiles
      ? universitiesWithUser.filter((u) => !isProfileEmpty(u))
      : universitiesWithUser;

    // If all universities are excluded, return immediately without calling the AI
    if (candidates.length === 0) {
      return {
        success: true,
        source: 'AI_SERVICE',
        count: 0,
        recommendations: []
      };
    }

    const payload = {
      challenge: {
        title: challenge.title.trim(),
        description: challenge.description.trim(),
        category: (challenge.category || '').trim(),
        required_technologies: Array.isArray(challenge.tags) ? challenge.tags : [],
        keywords: `${challenge.title} ${challenge.description}`.split(/\s+/).slice(0, 20)
      },
      universities: candidates.map((u) => ({
        id: u.user.toString(),
        name: u.name || '',
        district: u.district || '',
        researchAreas: Array.isArray(u.researchAreas) ? u.researchAreas : [],
        expertise: Array.isArray(u.expertise) ? u.expertise : [],
        labsAndFacilities: Array.isArray(u.labsAndFacilities) ? u.labsAndFacilities : [],
        innovationCentre: u.innovationCentre || '',
        incubationFacilities: u.incubationFacilities || '',
        previousProjectAreas: Array.isArray(u.previousProjectAreas)
          ? u.previousProjectAreas
          : (Array.isArray(u.researchAreas) ? u.researchAreas : []),
        facultySpecializations: (u.facultySpecializations || []).map((f) => ({
          facultyName: f?.facultyName || '',
          department: f?.department || '',
          specialization: f?.specialization || ''
        }))
      }))
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STRICT_TIMEOUT_MS);

    try {
      const response = await fetch(`${getAIBaseUrl()}/ai/match-universities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`);
      }

      const data = await response.json();
      const rawRecs = data?.recommendations || [];
      const validatedRecs = aiService.validateUniversityRecommendations(rawRecs, candidates);

      return {
        success: true,
        source: 'AI_SERVICE',
        count: validatedRecs.length,
        recommendations: validatedRecs
      };
    } catch (error) {
      console.warn(`[AI Service Notice] Strict university matching unavailable: ${error.message}`);
      return {
        success: false,
        source: 'UNAVAILABLE',
        count: 0,
        recommendations: [],
        error: error.message
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

module.exports = aiService;
