import React, { lazy, Suspense, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { setupFetchCredentials } from "@/components/youth-profile/fetch-wrapper";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { PermissionsProvider } from "@/hooks/use-permissions";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import DashboardPage from "@/pages/dashboard-page";
import YouthProfilesPage from "@/pages/youth-profiles-page";
import YouthBusinessesPage from "@/pages/youth-businesses-page";
import BusinessesPage from "@/pages/businesses-page";
import BusinessDetailPage from "@/pages/business-detail-page";
import BusinessEditPage from "@/pages/business-edit-page-new";
import BusinessAddPage from "@/pages/business-add-page-new";
import BusinessTrackingPage from "@/pages/business-tracking-page";
import BusinessPerformancePage from "@/pages/business-performance-page";
import AddTrackingPage from "@/pages/add-tracking-page";
import MakerspacesPage from "@/pages/makerspaces-page";
import ActivitiesPage from "@/pages/activities-page";

import MentorshipPage from "@/pages/mentorship-page";
import MentorAssignmentPage from "@/pages/mentor-assignment-page";
import MakerspaceAssignmentPage from "@/pages/makerspace-assignment-page";
import MentorsPage from "@/pages/mentors-page";
import MentorDetailPage from "@/pages/mentor-detail-page";
import MentorAddPage from "@/pages/mentor-add-page";
import MentorEditPage from "@/pages/mentor-edit-page";
import ProfileDetailPage from "@/pages/profile-detail-page";
import ProfileEditPage from "@/pages/profile-edit-page";
import ProfileAddPage from "@/pages/profile-add-page";
import AboutPage from "@/pages/about-page";
import FeaturesPage from "@/pages/features-page";
import DistrictsPage from "@/pages/districts-page";
import YouthManagement from "@/pages/youth-management";
import TrainingProgramsPage from "@/pages/training-programs-page";
import BasicProfilePage from "@/pages/basic-profile-page";
import SimpleProfilePage from "@/pages/simple-profile-page";
import SimpleProfileEditPage from "@/pages/simple-profile-edit-page";
import YouthProfileViewPage from "@/pages/youth-profile-view-page";
import UserManagementPage from "@/pages/admin/user-management-page";
import SystemSettingsPage from "@/pages/admin/system-settings-page";
import RoleManagementPage from "@/pages/admin/role-management-page";
import PermissionsManagementPage from "@/pages/admin/permissions-management-page";
import FeasibilityAssessmentsPage from "@/pages/feasibility-assessments-page";
import FeasibilityAssessmentPage from "@/pages/feasibility-assessment-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProtectedRoute, PermissionProtectedRoute } from "./components/protected-route";

// This component handles all the routes for the application
function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/districts" component={DistrictsPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/youth/profiles" component={YouthProfilesPage} />
      <ProtectedRoute path="/youth/profiles/new" component={ProfileAddPage} />
      <ProtectedRoute path="/youth/profiles/add" component={SimpleProfilePage} />
      <ProtectedRoute path="/youth/profiles/:id/edit" component={ProfileEditPage} />
      <ProtectedRoute path="/youth/profiles/:id/simple-edit" component={SimpleProfileEditPage} />
      <ProtectedRoute path="/youth/profiles/edit/:id" component={SimpleProfileEditPage} />
      <ProtectedRoute path="/youth/profiles/:id" component={YouthProfileViewPage} />
      <ProtectedRoute path="/youth/profiles/:id/view" component={YouthProfileViewPage} />
      <ProtectedRoute path="/youth/profiles/:id/businesses" component={YouthBusinessesPage} />
      
      {/* Legacy routes for backward compatibility - will redirect in the component */}
      <ProtectedRoute path="/youth-profiles" component={YouthProfilesPage} />
      <ProtectedRoute path="/profile/add" component={SimpleProfilePage} />
      <ProtectedRoute path="/profile/edit/:id" component={SimpleProfileEditPage} />
      <ProtectedRoute path="/profile/view/:id" component={YouthProfileViewPage} />
      <ProtectedRoute path="/businesses/youth/:id" component={YouthBusinessesPage} />
      <ProtectedRoute path="/businesses" component={BusinessesPage} />
      <ProtectedRoute path="/businesses/new" component={BusinessAddPage} />
      <ProtectedRoute path="/businesses/:id/edit" component={BusinessEditPage} />
      <ProtectedRoute path="/businesses/:id/tracking" component={BusinessTrackingPage} />
      <ProtectedRoute path="/businesses/:id/performance" component={BusinessPerformancePage} />
      <ProtectedRoute path="/businesses/:id/add-tracking" component={AddTrackingPage} />
      <ProtectedRoute path="/businesses/:id/edit-tracking/:trackingId" component={AddTrackingPage} />
      <ProtectedRoute path="/businesses/:businessId/resources" component={() => {
        const BusinessResourcesPage = lazy(() => import('./pages/business-resources-page'));
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <BusinessResourcesPage />
          </Suspense>
        );
      }} />
      <ProtectedRoute path="/businesses/:id/add-members" component={() => {
        const BusinessAddMembersPage = lazy(() => import('./pages/business-add-members-page'));
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <BusinessAddMembersPage />
          </Suspense>
        );
      }} />
      <ProtectedRoute path="/businesses/:id" component={BusinessDetailPage} />
      <ProtectedRoute path="/makerspaces" component={MakerspacesPage} />
      <ProtectedRoute path="/makerspaces/new" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const MakerspaceAddPage = lazy(() => import('./pages/makerspace-add-page'));
            return <MakerspaceAddPage />;
          })()}
        </Suspense>
      )} />
      {/* Route for /makerspaces/:id */}
      <ProtectedRoute path="/makerspaces/:id" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const MakerspaceViewPage = lazy(() => import('./pages/makerspace-view-page'));
            return <MakerspaceViewPage />;
          })()}
        </Suspense>
      )} />
      
      {/* Keep the original route as well for backward compatibility */}
      <ProtectedRoute path="/makerspaces/:id/view" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const MakerspaceViewPage = lazy(() => import('./pages/makerspace-view-page'));
            return <MakerspaceViewPage />;
          })()}
        </Suspense>
      )} />
      <ProtectedRoute path="/makerspaces/:id/resources" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const MakerspaceResourcesPage = lazy(() => import('./pages/makerspace-resources-page'));
            return <MakerspaceResourcesPage />;
          })()}
        </Suspense>
      )} />
      <ProtectedRoute path="/resources/:id" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const ResourceDetailPage = lazy(() => import('./pages/resource-detail-page'));
            return <ResourceDetailPage />;
          })()}
        </Suspense>
      )} />
      <ProtectedRoute path="/makerspaces/:id/edit" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const MakerspaceEditPage = lazy(() => import('./pages/makerspace-edit-page'));
            return <MakerspaceEditPage />;
          })()}
        </Suspense>
      )} />
      <ProtectedRoute path="/makerspaces/location/:location" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const MakerspaceLocationPage = lazy(() => import('./pages/makerspace-location-page'));
            return <MakerspaceLocationPage />;
          })()}
        </Suspense>
      )} />
      <ProtectedRoute path="/mentorship" component={MentorshipPage} />
      <ProtectedRoute path="/mentors" component={MentorsPage} />
      <ProtectedRoute path="/mentors/new" component={MentorAddPage} />
      <ProtectedRoute path="/mentors/:id/edit" component={MentorEditPage} />
      <ProtectedRoute path="/mentors/:id" component={MentorDetailPage} />
      <ProtectedRoute path="/mentor-assignment" component={MentorAssignmentPage} />
      <ProtectedRoute path="/mentor-assignment/business/:businessId" component={(props: any) => <MentorAssignmentPage businessId={props.params.businessId} />} />
      <ProtectedRoute path="/makerspace-assignment" component={MakerspaceAssignmentPage} />
      <ProtectedRoute path="/makerspace-assignment/business/:businessId" component={(props: any) => <MakerspaceAssignmentPage businessId={props.params.businessId} />} />
      <ProtectedRoute path="/makerspace-assignment/makerspace/:makerspaceId" component={(props: any) => <MakerspaceAssignmentPage makerspaceId={props.params.makerspaceId} />} />
      <ProtectedRoute path="/youth-management" component={YouthManagement} />
      <ProtectedRoute path="/training-programs" component={TrainingProgramsPage} />
      <ProtectedRoute path="/feasibility-assessments" component={FeasibilityAssessmentsPage} />
      <ProtectedRoute path="/feasibility-assessments/new" component={FeasibilityAssessmentPage} />
      <ProtectedRoute path="/feasibility-assessments/:id" component={FeasibilityAssessmentPage} />
      <ProtectedRoute path="/activities" component={ActivitiesPage} />
      <ProtectedRoute path="/settings" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const SettingsPage = lazy(() => import('./pages/settings-page'));
            return <SettingsPage />;
          })()}
        </Suspense>
      )} />
      <ProtectedRoute path="/reports" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const ReportsHomePage = lazy(() => import('./pages/reports'));
            return <ReportsHomePage />;
          })()}
        </Suspense>
      )} />

      <ProtectedRoute path="/reports/youth" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const YouthReportsPage = lazy(() => import('./pages/reports/youth'));
            return <YouthReportsPage />;
          })()}
        </Suspense>
      )} />

      <ProtectedRoute path="/reports/youth/view/:id" component={(props) => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          {(() => {
            const ViewYouthReport = lazy(() => import('./pages/reports/youth/view'));
            return <ViewYouthReport id={props.params.id} />;
          })()}
        </Suspense>
      )} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin/users" component={UserManagementPage} />
      <ProtectedRoute path="/admin/roles" component={RoleManagementPage} />
      <ProtectedRoute path="/admin/permissions" component={PermissionsManagementPage} />
      <ProtectedRoute path="/admin/settings" component={SystemSettingsPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize the fetch wrapper to ensure all requests include credentials
  useEffect(() => {
    setupFetchCredentials();
    console.log("Initialized fetch credentials wrapper");
  }, []);

  return (
    <AuthProvider>
      <PermissionsProvider>
        <AppRoutes />
        <Toaster />
      </PermissionsProvider>
    </AuthProvider>
  );
}

export default App;
