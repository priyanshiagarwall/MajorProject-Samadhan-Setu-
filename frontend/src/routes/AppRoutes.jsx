import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ClientLayout from '../layouts/ClientLayout';
import AdminLayout from '../layouts/AdminLayout';
import UniversityLayout from '../layouts/UniversityLayout';
import StudentLayout from '../layouts/StudentLayout';

// Protection components
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleRoute from '../components/common/RoleRoute';

// Public Pages
import RoleSelectionPage from '../pages/RoleSelectionPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Client Pages
import CitizenDashboardPage from '../pages/CitizenDashboardPage';
import ChallengeDetailPage from '../pages/ChallengeDetailPage';
import MyChallengesPage from '../pages/MyChallengesPage';
import ProfilePage from '../pages/ProfilePage';
import SavedChallengesPage from '../pages/SavedChallengesPage';
import SubmitChallengePage from '../pages/SubmitChallengePage';
import {
  NotificationsPage,
  HelpSupportPage
} from '../pages/ClientPlaceholders';

// Admin Pages
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminChallengesPage from '../pages/admin/AdminChallengesPage';
import AdminChallengeDetailPage from '../pages/admin/AdminChallengeDetailPage';
import AdminValidationQueuePage from '../pages/admin/AdminValidationQueuePage';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage';
import AdminProjectsPage from '../pages/admin/AdminProjectsPage';
import AdminUniversitiesPage from '../pages/admin/AdminUniversitiesPage';
import AdminIndustryPage from '../pages/admin/AdminIndustryPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminMapPage from '../pages/admin/AdminMapPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

// University Pages
import UniversityDashboardPage from '../pages/university/UniversityDashboardPage';
import UniversityMarketplacePage from '../pages/university/UniversityMarketplacePage';
import UniversityProfilePage from '../pages/university/UniversityProfilePage';
import UniversityProjectsPage from '../pages/university/UniversityProjectsPage';
import UniversityTeamsPage from '../pages/university/UniversityTeamsPage';
import UniversityFacultyPage from '../pages/university/UniversityFacultyPage';
import UniversityStudentsPage from '../pages/university/UniversityStudentsPage';
import {
  UniversityAssignedPage,
  UniversityMentorsPage,
  UniversityResearchPage,
  UniversityNotificationsPage
} from '../pages/university/UniversityPlaceholders';

// Other Stakeholder Pages
import StudentDashboardPage from '../pages/StudentDashboardPage';
import StudentChallengesPage from '../pages/student/StudentChallengesPage';
import StudentChallengeDetailPage from '../pages/student/StudentChallengeDetailPage';
import StudentProjectsPage from '../pages/student/StudentProjectsPage';
import StudentMilestonesPage from '../pages/student/StudentMilestonesPage';
import StudentDocumentsPage from '../pages/student/StudentDocumentsPage';
import StudentIndustryPage from '../pages/student/StudentIndustryPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentAchievementsPage from '../pages/student/StudentAchievementsPage';

// Industry Pages & Layout
import IndustryLayout from '../layouts/IndustryLayout';
import IndustryDashboardPage from '../pages/industry/IndustryDashboardPage';
import IndustryOpportunitiesPage from '../pages/industry/IndustryOpportunitiesPage';
import IndustryPartnershipsPage from '../pages/industry/IndustryPartnershipsPage';
import IndustryProfilePage from '../pages/industry/IndustryProfilePage';
import {
  IndustryProjectsPage,
  IndustryMentorshipPage,
  IndustryFundingPage,
  IndustryPrototypingPage,
  IndustryPilotProjectsPage,
  IndustryNotificationsPage
} from '../pages/industry/IndustryPlaceholders';
import ProjectWorkspacePage from '../pages/projects/ProjectWorkspacePage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirects to role selection */}
      <Route path="/" element={<Navigate to="/select-role" replace />} />

      {/* Main Public Layout */}
      <Route element={<MainLayout />}>
        <Route path="/select-role" element={<RoleSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* 1. Citizen / Client Dedicated Workspace */}
      <Route
        path="/client"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['CLIENT']}>
              <ClientLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<CitizenDashboardPage />} />
        <Route path="challenges" element={<MyChallengesPage />} />
        <Route path="challenges/:id" element={<ChallengeDetailPage />} />
        <Route path="submit" element={<SubmitChallengePage />} />
        <Route path="saved" element={<SavedChallengesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="help" element={<HelpSupportPage />} />
      </Route>

      {/* Citizen Route Alias */}
      <Route path="/citizen/*" element={<Navigate to="/client" replace />} />
      <Route path="/citizen" element={<Navigate to="/client" replace />} />

      {/* 2. Admin / Government Dedicated Workspace */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="challenges" element={<AdminChallengesPage />} />
        <Route path="challenges/:id" element={<AdminChallengeDetailPage />} />
        <Route path="validation-queue" element={<AdminValidationQueuePage />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
        <Route path="projects" element={<AdminProjectsPage />} />
        <Route path="projects/:id" element={<ProjectWorkspacePage />} />
        <Route path="universities" element={<AdminUniversitiesPage />} />
        <Route path="industry-partners" element={<AdminIndustryPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="map" element={<AdminMapPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* 3. University Dedicated Workspace */}
      <Route
        path="/university"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['UNIVERSITY']}>
              <UniversityLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<UniversityDashboardPage />} />
        <Route path="marketplace" element={<UniversityMarketplacePage />} />
        <Route path="assigned" element={<UniversityAssignedPage />} />
        <Route path="projects" element={<UniversityProjectsPage />} />
        <Route path="projects/:id" element={<ProjectWorkspacePage />} />
        <Route path="teams" element={<UniversityTeamsPage />} />
        <Route path="faculty" element={<UniversityFacultyPage />} />
        <Route path="students" element={<UniversityStudentsPage />} />
        <Route path="mentors" element={<UniversityMentorsPage />} />
        <Route path="research" element={<UniversityResearchPage />} />
        <Route path="notifications" element={<UniversityNotificationsPage />} />
        <Route path="profile" element={<UniversityProfilePage />} />
      </Route>

      {/* Faculty Portal Route Redirect */}
      <Route path="/faculty" element={<Navigate to="/select-role" replace />} />

      {/* 5. Student Route */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['STUDENT']}>
              <StudentLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboardPage />} />
        <Route path="challenges" element={<StudentChallengesPage />} />
        <Route path="challenges/:id" element={<StudentChallengeDetailPage />} />
        <Route path="projects" element={<StudentProjectsPage />} />
        <Route path="milestones" element={<StudentMilestonesPage />} />
        <Route path="documents" element={<StudentDocumentsPage />} />
        <Route path="industry" element={<StudentIndustryPage />} />
        <Route path="notifications" element={<Navigate to="/student" replace />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="achievements" element={<StudentAchievementsPage />} />
      </Route>

      {/* 6. Industry / Startup Routes */}
      <Route
        path="/industry"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['INDUSTRY']}>
              <IndustryLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<IndustryDashboardPage />} />
        <Route path="opportunities" element={<IndustryOpportunitiesPage />} />
        <Route path="projects" element={<IndustryProjectsPage />} />
        <Route path="projects/:id" element={<ProjectWorkspacePage />} />
        <Route path="partnerships" element={<IndustryPartnershipsPage />} />
        <Route path="mentorship" element={<IndustryMentorshipPage />} />
        <Route path="funding" element={<IndustryFundingPage />} />
        <Route path="prototyping" element={<IndustryPrototypingPage />} />
        <Route path="pilot-projects" element={<IndustryPilotProjectsPage />} />
        <Route path="notifications" element={<IndustryNotificationsPage />} />
        <Route path="profile" element={<IndustryProfilePage />} />
      </Route>

      {/* 7. Universal Project Workspace Route */}
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<div className="p-4 sm:p-6 lg:p-8"><ProjectWorkspacePage /></div>} />
      </Route>

      {/* Fallback 404 Route */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
