
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ArrowUpRight,
  Clock,
  Menu,
  X,
  Sparkles,
  Trash2,
  CheckCircle2,
  Ban,
  RefreshCw,
} from "lucide-react";

import "./App.css";
import AddAppointment from "./AddAppointment";
import CustomerManagement from "./CustomerManagement";
import ServicesManagement from "./ServicesManagement";
import StaffManagement from "./StaffManagement";
import POSBilling from "./POSBilling";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Appointments", icon: CalendarDays },
  { name: "Customers", icon: Users },
  { name: "Services", icon: Scissors },
  { name: "Staff", icon: Users },
  { name: "POS Billing", icon: CreditCard },
  { name: "Invoices", icon: FileText },
  { name: "Reports", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");

  const [customerCount, setCustomerCount] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");

  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("All");
  const [showAppointmentForm, setShowAppointmentForm] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Customer count
  useEffect(() => {
    fetch("http://localhost:8000/api/customers/count")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch customers");
        return response.json();
      })
      .then((data) => setCustomerCount(data.total_customers ?? 0))
      .catch((error) => {
        console.error("Customer count error:", error);
        setCustomerCount("Unavailable");
      });
  }, []);

  // Fetch appointments from database
  const fetchAppointments = () => {
    setAppointmentLoading(true);

    fetch("http://localhost:8000/api/appointments")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch appointments");
        return response.json();
      })
      .then((data) => {
        setAppointments(data);
        setAppointmentError("");
      })
      .catch((error) => {
        console.error("Appointment error:", error);
        setAppointmentError(
          "Unable to load appointments. Please check the backend."
        );
      })
      .finally(() => setAppointmentLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update appointment status
  const updateAppointmentStatus = async (id, status) => {
    try {
      setActionLoading(id);

      const response = await fetch(
        `http://localhost:8000/api/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to update appointment");
      }

      await fetchAppointments();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete appointment
  const deleteAppointment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(id);

      const response = await fetch(
        `http://localhost:8000/api/appointments/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to delete appointment");
      }

      await fetchAppointments();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    {
      title: "Total Revenue",
      value: "₹48,250",
      change: "+12.5%",
      icon: CreditCard,
    },
    {
      title: "Appointments",
      value: appointments.length.toString(),
      change: "",
      icon: CalendarDays,
    },
    {
      title: "Total Customers",
      value:
        customerCount === null
          ? "Loading..."
          : typeof customerCount === "number"
            ? customerCount.toLocaleString("en-IN")
            : customerCount,
      change: "",
      icon: Users,
    },
    {
      title: "Services Today",
      value: "16",
      change: "+5.6%",
      icon: Scissors,
    },
  ];

  const formatTime = (dateValue) => {
    if (!dateValue) return "Time unavailable";

    return new Date(dateValue).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "CU";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Dashboard search
  const dashboardAppointments = appointments.filter((item) =>
    `${item.customer_name || ""} ${item.service || ""} ${item.staff_name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Appointment page search and status filter
  const filteredAppointmentList = appointments.filter((item) => {
    const searchText = appointmentSearch.toLowerCase();

    const matchesSearch = `${item.customer_name || ""} ${
      item.service || ""
    } ${item.staff_name || ""}`
      .toLowerCase()
      .includes(searchText);

    const matchesStatus =
      appointmentStatus === "All" ||
      item.status === appointmentStatus;

    return matchesSearch && matchesStatus;
  });

  const appointmentStatuses = [
    "All",
    "Scheduled",
    "Completed",
    "Cancelled",
    "No Show",
  ];

  const pageStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "13px",
    padding: "22px",
  };

  const inputStyle = {
    background: "var(--input)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "9px",
    padding: "12px 14px",
    outline: "none",
    fontSize: "13px",
  };

  const actionButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    border: "1px solid var(--border)",
    borderRadius: "7px",
    padding: "7px 9px",
    background: "var(--input)",
    color: "var(--text)",
    fontSize: "11px",
    cursor: "pointer",
    margin: "2px",
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Scissors size={23} />
          </div>

          <div>
            <h2>ENACT</h2>
            <span>SALON MANAGEMENT</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">MENU</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileMenu(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>

                {item.name === "Appointments" && (
                  <span className="nav-count">
                    {appointments.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={22} />
            <h4>Premium Experience</h4>
            <p>Manage your salon with ease.</p>
          </div>

          <div className="profile">
            <div className="profile-avatar">AD</div>

            <div className="profile-info">
              <strong>Admin</strong>
              <span>Salon Owner</span>
            </div>

            <Settings size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="breadcrumb">Pages / {activePage}</p>
              <h2>{activePage}</h2>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={18} />

              <input
                placeholder="Search anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <span>⌘ K</span>
            </div>

            <button
              className="icon-button theme-button"
              onClick={() => setDarkMode(!darkMode)}
              title="Switch theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="icon-button notification-button">
              <Bell size={20} />
              <span />
            </button>

            <div className="top-avatar">AD</div>
          </div>
        </header>

        {/* DASHBOARD */}
        {activePage === "Dashboard" ? (
          <div className="dashboard">
            <section className="welcome-section">
              <div>
                <span className="welcome-tag">
                  <Sparkles size={14} />
                  YOUR SALON AT A GLANCE
                </span>

                <h1>
                  Welcome back, Admin <span>✦</span>
                </h1>

                <p>
                  Here's what's happening at your salon today.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  setActivePage("Appointments");
                  setShowAppointmentForm(true);
                }}
              >
                <Plus size={18} />
                New Appointment
              </button>
            </section>

            <section className="stats-grid">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-top">
                      <div className="stat-icon">
                        <Icon size={21} />
                      </div>

                      {stat.change && (
                        <span className="stat-change">
                          <ArrowUpRight size={14} />
                          {stat.change}
                        </span>
                      )}
                    </div>

                    <p>{stat.title}</p>
                    <h2>{stat.value}</h2>
                  </div>
                );
              })}
            </section>

            <section className="content-grid">
              <div className="panel appointments-panel">
                <div className="panel-header">
                  <div>
                    <h3>Appointments</h3>
                    <p>Appointments from your database</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("Appointments")}
                  >
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="appointment-list">
                  {appointmentLoading ? (
                    <p>Loading appointments...</p>
                  ) : appointmentError ? (
                    <p>{appointmentError}</p>
                  ) : dashboardAppointments.length === 0 ? (
                    <p>No appointments found.</p>
                  ) : (
                    dashboardAppointments.slice(0, 5).map((item) => (
                      <div className="appointment-row" key={item.id}>
                        <div className="customer-avatar">
                          {getInitials(item.customer_name)}
                        </div>

                        <div className="appointment-person">
                          <strong>{item.customer_name}</strong>
                          <span>{item.service}</span>
                        </div>

                        <div className="appointment-time">
                          <Clock size={14} />
                          {formatTime(item.appointment_date)}
                        </div>

                        <span
                          className={`status ${
                            (item.status || "Scheduled")
                              .toLowerCase()
                              .replace(" ", "-")
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel quick-panel">
                <div className="panel-header">
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Common salon activities</p>
                  </div>
                </div>

                <div className="quick-actions">
                  {[
                    {
                      label: "New Appointment",
                      icon: CalendarDays,
                      page: "Appointments",
                    },
                    {
                      label: "Add Customer",
                      icon: Users,
                      page: "Customers",
                    },
                    {
                      label: "Create Bill",
                      icon: CreditCard,
                      page: "POS Billing",
                    },
                    {
                      label: "View Reports",
                      icon: BarChart3,
                      page: "Reports",
                    },
                  ].map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        className="quick-action"
                        key={action.label}
                        onClick={() => setActivePage(action.page)}
                      >
                        <div>
                          <Icon size={19} />
                        </div>

                        <span>{action.label}</span>
                        <ArrowUpRight size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="bottom-grid">
              <div className="panel performance-panel">
                <div className="panel-header">
                  <div>
                    <h3>Revenue Overview</h3>
                    <p>Salon performance this week</p>
                  </div>

                  <span className="period-label">This Week</span>
                </div>

                <div className="revenue-summary">
                  <h2>₹48,250</h2>
                  <span className="stat-change">
                    <ArrowUpRight size={14} /> 12.5%
                  </span>
                </div>

                <div className="chart">
                  {[42, 65, 48, 82, 57, 95, 72].map((height, i) => (
                    <div className="chart-column" key={i}>
                      <div
                        className="chart-bar"
                        style={{ height: `${height}%` }}
                      />

                      <span>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel services-panel">
                <div className="panel-header">
                  <div>
                    <h3>Popular Services</h3>
                    <p>Most booked services</p>
                  </div>
                </div>

                {[
                  { name: "Hair Styling", count: "42 bookings", percent: 85 },
                  { name: "Hair Cut", count: "35 bookings", percent: 70 },
                  { name: "Facial", count: "28 bookings", percent: 56 },
                  { name: "Manicure", count: "19 bookings", percent: 38 },
                ].map((service) => (
                  <div className="service-item" key={service.name}>
                    <div className="service-info">
                      <strong>{service.name}</strong>
                      <span>{service.count}</span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${service.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <footer className="footer">
              <span>© 2026 ENACT Salon Management</span>
              <span>Crafted for a premium salon experience</span>
            </footer>
          </div>

        ) : activePage === "Appointments" ? (

          /* APPOINTMENT MANAGEMENT */
          <div className="dashboard">
            <section className="welcome-section">
              <div>
                <span className="welcome-tag">
                  <Sparkles size={14} />
                  APPOINTMENT MANAGEMENT
                </span>

                <h1>Manage Appointments</h1>

                <p>Manage all your salon bookings in one place.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => setShowAppointmentForm(!showAppointmentForm)}
              >
                <Plus size={18} />
                {showAppointmentForm ? "Hide Form" : "New Appointment"}
              </button>
            </section>

            {/* ADD APPOINTMENT FORM */}
            {showAppointmentForm && (
              <div style={{ marginBottom: "25px" }}>
                <AddAppointment
                  onAppointmentCreated={fetchAppointments}
                />
              </div>
            )}

            {/* APPOINTMENT SUMMARY */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "15px",
                marginBottom: "22px",
              }}
            >
              {[
                {
                  label: "Total Bookings",
                  value: appointments.length,
                },
                {
                  label: "Scheduled",
                  value: appointments.filter(
                    (a) => a.status === "Scheduled"
                  ).length,
                },
                {
                  label: "Completed",
                  value: appointments.filter(
                    (a) => a.status === "Completed"
                  ).length,
                },
                {
                  label: "Cancelled",
                  value: appointments.filter(
                    (a) => a.status === "Cancelled"
                  ).length,
                },
              ].map((item) => (
                <div key={item.label} style={pageStyle}>
                  <p style={{ color: "var(--muted)", fontSize: "12px" }}>
                    {item.label}
                  </p>
                  <h2 style={{ color: "var(--text)", margin: "8px 0 0" }}>
                    {item.value}
                  </h2>
                </div>
              ))}
            </div>

            {/* APPOINTMENT TABLE */}
            <div style={pageStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3 style={{ color: "var(--text)", margin: "0 0 6px" }}>
                    All Appointments
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: "12px", margin: 0 }}>
                    View and manage your customer bookings.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={fetchAppointments}
                  disabled={appointmentLoading}
                >
                  <RefreshCw size={15} />
                  Refresh
                </button>
              </div>

              {/* SEARCH AND FILTER */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                <div style={{ flex: "1 1 230px", position: "relative" }}>
                  <Search
                    size={17}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "13px",
                      color: "var(--muted)",
                    }}
                  />

                  <input
                    style={{
                      ...inputStyle,
                      width: "100%",
                      boxSizing: "border-box",
                      paddingLeft: "38px",
                    }}
                    placeholder="Search customer, service or staff..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                  />
                </div>

                <select
                  style={{
                    ...inputStyle,
                    minWidth: "160px",
                  }}
                  value={appointmentStatus}
                  onChange={(e) => setAppointmentStatus(e.target.value)}
                >
                  {appointmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
              </div>

              {/* TABLE */}
              {appointmentLoading ? (
                <p style={{ color: "var(--muted)" }}>
                  Loading appointments...
                </p>
              ) : appointmentError ? (
                <p style={{ color: "#e36c6c" }}>{appointmentError}</p>
              ) : filteredAppointmentList.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "45px 15px",
                    color: "var(--muted)",
                  }}
                >
                  <CalendarDays size={35} />
                  <h3 style={{ color: "var(--text)" }}>
                    No appointments found
                  </h3>
                  <p>Try changing your search or status filter.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto", width: "100%" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: "850px",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "CUSTOMER",
                          "SERVICE",
                          "STAFF",
                          "DATE & TIME",
                          "STATUS",
                          "ACTIONS",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: "14px 12px",
                              fontSize: "10px",
                              letterSpacing: "1px",
                              color: "var(--muted)",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAppointmentList.map((item) => (
                        <tr key={item.id}>
                          <td
                            style={{
                              padding: "15px 12px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div className="customer-avatar">
                                {getInitials(item.customer_name)}
                              </div>

                              <div>
                                <strong
                                  style={{
                                    color: "var(--text)",
                                    fontSize: "13px",
                                  }}
                                >
                                  {item.customer_name}
                                </strong>
                                <p
                                  style={{
                                    color: "var(--muted)",
                                    fontSize: "11px",
                                    margin: "4px 0 0",
                                  }}
                                >
                                  #{item.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td
                            style={{
                              padding: "15px 12px",
                              color: "var(--text)",
                              fontSize: "13px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            {item.service}
                          </td>

                          <td
                            style={{
                              padding: "15px 12px",
                              color: "var(--text)",
                              fontSize: "13px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            {item.staff_name}
                          </td>

                          <td
                            style={{
                              padding: "15px 12px",
                              color: "var(--text)",
                              fontSize: "12px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div>{formatDate(item.appointment_date)}</div>
                            <div
                              style={{
                                color: "var(--muted)",
                                marginTop: "5px",
                              }}
                            >
                              <Clock
                                size={12}
                                style={{
                                  display: "inline",
                                  marginRight: "5px",
                                  verticalAlign: "middle",
                                }}
                              />
                              {formatTime(item.appointment_date)}
                            </div>
                          </td>

                          <td
                            style={{
                              padding: "15px 12px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <span
                              className={`status ${
                                (item.status || "Scheduled")
                                  .toLowerCase()
                                  .replace(" ", "-")
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "15px 12px",
                              borderBottom: "1px solid var(--border)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {actionLoading === item.id ? (
                              <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                                Updating...
                              </span>
                            ) : (
                              <>
                                {item.status !== "Completed" &&
                                  item.status !== "Cancelled" &&
                                  item.status !== "No Show" && (
                                    <button
                                      style={actionButtonStyle}
                                      title="Mark completed"
                                      onClick={() =>
                                        updateAppointmentStatus(
                                          item.id,
                                          "Completed"
                                        )
                                      }
                                    >
                                      <CheckCircle2 size={14} />
                                      Done
                                    </button>
                                  )}

                                {item.status === "Scheduled" && (
                                  <button
                                    style={actionButtonStyle}
                                    title="Cancel appointment"
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        item.id,
                                        "Cancelled"
                                      )
                                    }
                                  >
                                    <Ban size={14} />
                                    Cancel
                                  </button>
                                )}

                                <button
                                  style={{
                                    ...actionButtonStyle,
                                    color: "#e36c6c",
                                  }}
                                  title="Delete appointment"
                                  onClick={() => deleteAppointment(item.id)}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "11px",
                  marginTop: "18px",
                }}
              >
                Showing {filteredAppointmentList.length} of {appointments.length} appointments
              </p>
            </div>
          </div>

          ) : activePage === "Customers" ? (
          <CustomerManagement />
                ) : activePage === "Services" ? (
          <ServicesManagement />
        ) : activePage === "Staff" ? (
          <StaffManagement />
        ) :  activePage === "POS Billing" ? (
          <POSBilling />
        ) : (
          <div className="placeholder-page">
            <div className="placeholder-icon">
              {(() => {
                const item = navigation.find(
                  (nav) => nav.name === activePage
                );

                const Icon = item?.icon || LayoutDashboard;

                return <Icon size={32} />;
              })()}
            </div>

            <h2>{activePage}</h2>
            <p>This section is ready for development.</p>

            <button
              className="primary-button"
              onClick={() => setActivePage("Dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
