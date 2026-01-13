import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";

import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";

import ManageApiKeys from "./pages/ManageApiKeys";
import UsersList from "./pages/Users/UsersList";
import ApisList from "./pages/Apis/ApisList";
import CustomerList from "./pages/Customers/CustomerList";
import CustomerDetails from "./pages/Customers/CustomerDetails";
import ChannelPartnerList from "./pages/ChannelPartners/ChannelPartnerList.tsx";
import ChannelPartnerDetails from "./pages/ChannelPartners/ChannelPartnerDetails.tsx";
import VendorList from "./pages/Vendors/VendorList";
import VendorDetails from "./pages/Vendors/VendorDetails";
import Reports from "./pages/Reports";
import Logs from "./pages/Logs";
import BatchProcessing from "./pages/BatchProcessing";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/common/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        {/* 🔹 Redirect root to Sign In */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* 🔹 Auth Pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Top-level routes (protected) - match sidebar links */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UsersList />} />
        </Route>

        <Route
          path="/manage-api-keys"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManageApiKeys />} />
        </Route>

        <Route
          path="/apis"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ApisList />} />
          <Route path="new" element={<ApisList />} />
        </Route>

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerList />} />
          <Route path="new" element={<CustomerList />} />
          <Route path=":id" element={<CustomerDetails />} />
        </Route>

        <Route
          path="/channel-partners"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChannelPartnerList />} />
          <Route path="new" element={<ChannelPartnerList />} />
          <Route path=":id" element={<ChannelPartnerDetails />} />
        </Route>

        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<VendorList />} />
          <Route path="new" element={<VendorList />} />
          <Route path=":id" element={<VendorDetails />} />
        </Route>

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Reports />} />
        </Route>

        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Logs />} />
        </Route>

        <Route
          path="/batch-processing"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BatchProcessing />} />
        </Route>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserProfiles />} />
        </Route>

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Calendar />} />
        </Route>

        <Route
          path="/blank"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Blank />} />
        </Route>

        <Route
          path="/form-elements"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FormElements />} />
        </Route>

        <Route
          path="/basic-tables"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BasicTables />} />
        </Route>

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Alerts />} />
        </Route>

        <Route
          path="/avatars"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Avatars />} />
        </Route>

        <Route
          path="/badge"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Badges />} />
        </Route>

        <Route
          path="/buttons"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Buttons />} />
        </Route>

        <Route
          path="/images"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Images />} />
        </Route>

        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Videos />} />
        </Route>

        <Route
          path="/line-chart"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LineChart />} />
        </Route>

        <Route
          path="/bar-chart"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BarChart />} />
        </Route>

        {/* 🔹 Dashboard Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />

          {/* Others */}
          <Route path="profile" element={<UserProfiles />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="blank" element={<Blank />} />

          {/* Forms */}
          <Route path="form-elements" element={<FormElements />} />

          {/* Tables */}
          <Route path="basic-tables" element={<BasicTables />} />

          {/* UI Elements */}
          <Route path="alerts" element={<Alerts />} />
          <Route path="avatars" element={<Avatars />} />
          <Route path="badge" element={<Badges />} />
          <Route path="buttons" element={<Buttons />} />
          <Route path="images" element={<Images />} />
          <Route path="videos" element={<Videos />} />

          {/* Charts */}
          <Route path="line-chart" element={<LineChart />} />
          <Route path="bar-chart" element={<BarChart />} />

          {/* Admin / API */}
          <Route path="manage-api-keys" element={<ManageApiKeys />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="apis" element={<ApisList />} />
        </Route>

        {/* Shortcut: /home should render dashboard too */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
        </Route>

        {/* 🔹 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
