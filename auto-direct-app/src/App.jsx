// PA2506 Autos Direct Prototype
// This is a React application with Tailwind CSS that serves as a prototype for an online car dealership platform.

import { createContext, useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Dropzone from "./components/Dropzone";
import EditVehicleForm from "./components/edit-vehicle";
import "./utils/toast"; // Initialize toast system
import BrowsePage from "./pages/browse-page";
import CarDetailPage from "./pages/car-detail-page";
import ContactPage from "./pages/contact-page";
import LoginPage from "./pages/login-page";
import RegisterPage from "./pages/register-page";
import HomePage from "./pages/home-page";
import ProfilePage from "./pages/profile-page";
import PrivacyPolicyPage from "./pages/privacy-policy-page";
import GlossaryPage from "./pages/glossary-page";
import ComplaintsPage from "./pages/complaints-page";
import SavedCarsPage from "./pages/saved-cars-page";
import AddVehiclePage from "./pages/add-vehicle-page";
import ApproveVehiclesPage from "./pages/approve-vehicles-page";
import BookingTestDrive from "./pages/booking-test-drive";
import AdviceRequestQueue from "./pages/advice-request-queue";
import ManageUsersPage from "./pages/manage-users-page";
import ManageVehiclesPage from "./pages/manage-vehicles-page";
import ManageManufacturersPage from "./pages/manage-manufacturers-page";
import ManageDealershipsPage from "./pages/manage-dealerships-page";
import ManageMyRequestsPage from "./pages/manage-myrequests-page"; // this is a regular user page to view and manage sent requests and their status
import UserManagePurchasesPage from "./pages/user-manage-purchases-page"; // this is a regular user page to view and manage sent requests and their status
import CustomerChatbotInquiries from "./pages/customer-chatbot-inquiries"; // customer-facing chatbot inquiries page
import InternalRegisterPage from "./pages/internal-register-page";
import Chatbot from "./components/Chatbot";
import ChatbotInquiries from "./pages/chatbot-inquiries";
import DbConnectionTestPage from "./pages/db-connection-test-page"; // to be deleted before handover
import SAPDatabasePage from "./pages/sap-database-page"; // Admin-only SAP database management
import PurchaseVehiclePage from "./pages/PurchaseVehiclePage"; // Purchase vehicle form page
import PurchaseFlowPage from "./pages/PurchaseFlowPage"; // New dedicated purchase flow page
import ProfessionalOrderManagementPage from "./pages/ProfessionalOrderManagementPage"; // Enhanced professional order management
import LogisticsDashboard from "./pages/LogisticsDashboard"; // Logistics coordination dashboard
// import PurchaseVehiclePage from "./pages/PurchaseVehiclePage"; // Purchase vehicle form page
import PaymentInstructionsPage from "./pages/PaymentInstructionsPage"; // Payment instructions page
import PaymentDetailsPage from "./pages/PaymentDetailsPage"; // Payment details page
import TestDriveDashboard from "./pages/test-drive-dashboard";
import CustomerServiceQueue from "./pages/customer-service-queue";

import ProtectedRoute from "./components/ProtectedRoute";
import { UserProvider } from "./contexts/UserContext"; // path may change based on your setup

// Main App component: Sets up routing and page layout structure
function App() {
  return (
    <UserProvider> {/* Wrap the app in UserProvider to manage user state */}
    <Router>
      <div className="min-h-screen bg-white font-sans">
        {/* Persistent Navigation Bar */}
        <Navbar />

        {/* Routing Logic */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={   <BrowsePage />  }  />
          <Route path="/car/:id" element={<CarDetailPage />} />
          <Route path="/saved-cars" element={<SavedCarsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/internal-register" element={<InternalRegisterPage />} />
          <Route path="/manage-my-purchases" element={<UserManagePurchasesPage />} />
          <Route path="/my-support-inquiries" element={<CustomerChatbotInquiries />} />
          <Route path="/purchase-flow" element={<PurchaseFlowPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />

{/* Add Vehicle: Only admin */}
            <Route
              path="/add-vehicle"
              element={
                <ProtectedRoute allowedRoles={["Administrator", "Manufacturer"]}>
                  <AddVehiclePage />
                </ProtectedRoute>
              }
            />
            
            {/* Approve Vehicles: Only admin */}
            <Route
              path="/approve"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ApproveVehiclesPage />
                </ProtectedRoute>
              }
            />

            <Route path="/testDrive" element={<BookingTestDrive />} />
            <Route
              path="/test-drive-dashboard"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <TestDriveDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer-service-queue"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <CustomerServiceQueue />
                </ProtectedRoute>
              }
            />

            {/* Advice Queue: Only admin */}
            <Route
              path="/advice-queue"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <AdviceRequestQueue />
                </ProtectedRoute>
              }
            />

            {/* Manage Users: Only admin */}
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ManageUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Manage Vehicles: Only admin */}
            <Route
              path="/manage-vehicles"
              element={
                <ProtectedRoute allowedRoles={["Administrator", "Manufacturer"]}>
                  <ManageVehiclesPage />
                </ProtectedRoute>
              }
            />

            <Route path="manage-my-requests" element={<ManageMyRequestsPage />} />

            {/* Manage Manufacturers: Only admin */}
            <Route
              path="/manage-manufacturers"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ManageManufacturersPage />
                </ProtectedRoute>
              }
            />

            {/* Manage Dealerships: Only admin */}
            <Route
              path="/manage-dealerships"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ManageDealershipsPage />
                </ProtectedRoute>
              }
            />

            {/* Order Management: Only admin */}
            <Route
              path="/order-management"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ProfessionalOrderManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Professional Order Management: Only admin */}
            <Route
              path="/professional-order-management"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ProfessionalOrderManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Logistics Dashboard: Only admin */}
            <Route
              path="/logistics-dashboard"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <LogisticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Placeholder/Admin-Only Routes */}
            <Route
              path="/add-vehicle"
              element={
                <ProtectedRoute allowedRoles={["Administrator", "Manufacturer"]}>
                  <Placeholder text="Add a Vehicle Placeholder" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-vehicle"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <Placeholder text="Edit a Vehicle Placeholder" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-listings-manufacturer"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <Placeholder text="Manufacturer Listings Placeholder" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-listings-admin"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <Placeholder text="Admin Listings Placeholder" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-approval"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <Placeholder text="Admin Approval Page Placeholder" />
                </ProtectedRoute>
              }
            />

            {/* Unprotected/other placeholder routes */}
            <Route path="/purchase-vehicle" element={<PurchaseVehiclePage />} />
            <Route path="/payment-instructions" element={<PaymentInstructionsPage />} />
            <Route path="/payment-details" element={<PaymentDetailsPage />} />
            <Route path="/bookings" element={<Placeholder text="Customer Booked Test Drives Placeholder" />} />
            <Route path="/received-bookings" element={<Placeholder text="Manufacturer Received Bookings Placeholder" />} />
            <Route path="/dealer-locator" element={<Placeholder text="Dealer Locator Placeholder" />} />
            <Route path="/employee-queue" element={<Placeholder text="Employee Advice Request Queue Placeholder" />} />
            <Route path="/purchase" element={<Placeholder text="Vehicle Purchase / Transaction Placeholder" />} />
            <Route
              path="/chatbot-inquiries"
              element={
                <ProtectedRoute allowedRoles={["Administrator"]}>
                  <ChatbotInquiries />
                </ProtectedRoute>
              }
            />

          </Routes>

          <footer className="mt-16 py-6 text-center text-gray-600 text-sm font-sans">
            &copy; {new Date().getFullYear()} Autos Direct. All rights reserved. |{" "}
            <Link to="/contact" className="text-blue-700 hover:underline">
				Contact
				</Link>{" | "}
				<Link to="/complaints" className="text-blue-700 hover:underline">
				Complaints
				</Link>{" | "}
				<Link to="/privacy-policy" className="text-blue-700 hover:underline">
				Privacy Policy
				</Link>{" | "}
				<Link to="/glossary" className="text-blue-700 hover:underline">
				Glossary
				</Link>
          </footer>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Chatbot />
      </Router>
    </UserProvider>
  );
}

// Simple placeholder component for pages not yet implemented
function Placeholder({ text }) {
  return <div className="p-8 text-center text-gray-600 font-sans">{text}</div>;
}

export default App;
