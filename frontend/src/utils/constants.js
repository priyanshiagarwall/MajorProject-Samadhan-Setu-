export const PORTAL_TITLE = "Samadhan Setu";
export const PORTAL_SUBTITLE = "Bridging societal challenges with universities, student innovators, and industry solutions.";
export const GOVT_NAME = "Samadhan Setu — National & State Innovation Network";

export const DELHI_DISTRICTS = [
  "Central Delhi",
  "East Delhi",
  "New Delhi",
  "North Delhi",
  "North East Delhi",
  "North West Delhi",
  "Shahdara",
  "South Delhi",
  "South East Delhi",
  "South West Delhi",
  "West Delhi"
];

export const CHALLENGE_CATEGORIES = [
  "Education",
  "Healthcare",
  "Agriculture",
  "Water Management",
  "Sanitation",
  "Environment",
  "Energy",
  "Urban Infrastructure",
  "Accessibility",
  "Public Services",
  "Rural Livelihoods",
  "Other"
];

export const CHALLENGE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "VALIDATED",
  "ASSIGNED",
  "IN_PROGRESS",
  "SOLUTION_PROPOSED",
  "PILOT_TESTING",
  "RESOLVED",
  "REJECTED"
];

export const PRIORITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

export const ROLES = [
  {
    id: "client",
    key: "citizen",
    title: "Citizen / Client",
    badgeText: "Civic Reporter",
    description: "Report local challenges, provide evidence and track the progress of your submitted problems.",
    path: "/client",
    loginPath: "/login?role=client",
    registerPath: "/register?role=client",
    iconName: "Users",
    colorVariant: "maroon",
    accentColor: "#7a1113",
    actionLabel: "Access Citizen Portal"
  },
  {
    id: "admin",
    key: "government",
    title: "Admin / Government",
    badgeText: "Administrator",
    description: "Validate challenges, coordinate institutions and monitor societal innovation projects.",
    path: "/admin",
    loginPath: "/login?role=admin",
    registerPath: "/register?role=admin",
    iconName: "ShieldCheck",
    colorVariant: "navy",
    accentColor: "#142a45",
    actionLabel: "Access Administration"
  },
  {
    id: "university",
    key: "academic",
    title: "University",
    badgeText: "Academic Institution",
    description: "Discover challenges, form multidisciplinary teams and develop practical solutions.",
    path: "/university",
    loginPath: "/login?role=university",
    registerPath: "/register?role=university",
    iconName: "GraduationCap",
    colorVariant: "maroon",
    accentColor: "#7a1113",
    actionLabel: "Access University Portal"
  },
  {
    id: "student",
    key: "solution-provider",
    title: "Student Innovator",
    badgeText: "Solution Provider",
    description: "Develop practical prototypes, collaborate with mentors and peers, and gain recognition for community impact.",
    path: "/student",
    loginPath: "/login?role=student",
    registerPath: "/register?role=student",
    iconName: "Lightbulb",
    colorVariant: "gold",
    accentColor: "#b45309",
    actionLabel: "Access Student Portal"
  },
  {
    id: "industry",
    key: "enterprise",
    title: "Industry / Startup",
    badgeText: "Ecosystem Partner",
    description: "Support innovation through mentorship, technology, funding, prototyping and implementation.",
    path: "/industry",
    loginPath: "/login?role=industry",
    registerPath: "/register?role=industry",
    iconName: "Building2",
    colorVariant: "navy",
    accentColor: "#142a45",
    actionLabel: "Access Industry Portal"
  }
];

export const normalizeRoleKey = (role) => {
  if (!role) return 'client';
  const r = role.toString().trim().toLowerCase();
  if (['client', 'citizen', 'civic'].includes(r)) return 'client';
  if (['admin', 'government', 'govt', 'nodal'].includes(r)) return 'admin';
  if (['university', 'academic', 'institute', 'college'].includes(r)) return 'university';
  if (['faculty', 'mentor', 'professor', 'supervisor'].includes(r)) return 'faculty';
  if (['student', 'solution-provider', 'innovator'].includes(r)) return 'student';
  if (['industry', 'enterprise', 'startup', 'corporate'].includes(r)) return 'industry';
  return r;
};

export const getRoleConfig = (roleOrKey) => {
  const normalizedKey = normalizeRoleKey(roleOrKey);
  return ROLES.find((r) => r.id === normalizedKey || r.key === normalizedKey) || ROLES[0];
};

export const NAV_LINKS = [
  { label: "Home / Roles", path: "/select-role" },
  { label: "Citizen Portal", path: "/client" },
  { label: "State Administration", path: "/admin" },
  { label: "University Hub", path: "/university" },
  { label: "Student Hub", path: "/student" },
  { label: "Industry Network", path: "/industry" }
];

export const FOOTER_LINKS = {
  about: [
    { label: "About the Initiative", path: "/about" },
    { label: "Framework & Guidelines", path: "/guidelines" },
    { label: "Participating Universities", path: "/institutions" }
  ],
  support: [
    { label: "Helpdesk & FAQ", path: "/help" },
    { label: "Citizen Grievance Redressal", path: "/grievance" },
    { label: "Contact Us", path: "/contact" }
  ],
  legal: [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Accessibility Statement", path: "/accessibility" },
    { label: "Hyperlinking Policy", path: "/hyperlinking" }
  ]
};
