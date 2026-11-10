
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  X,
  UserRound,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
  });

  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "13px",
    padding: "22px",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: "var(--input)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "9px",
    padding: "12px 14px",
    fontSize: "13px",
    outline: "none",
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/customers");

      if (!response.ok) {
        throw new Error("Unable to load customers.");
      }

      const data = await response.json();

      setCustomers(
        Array.isArray(data) ? data : data.customers || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const searchText = search.toLowerCase();

    return customers.filter((customer) =>
      `${customer.full_name || ""} ${customer.phone_number || ""} ${
        customer.email || ""
      }`
        .toLowerCase()
        .includes(searchText)
    );
  }, [customers, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:8000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.trim(),
          email: formData.email.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail || "Unable to add customer.";

        throw new Error(message);
      }

      setSuccess("Customer added successfully!");
      setFormData({
        full_name: "",
        phone_number: "",
        email: "",
      });
      setShowForm(false);

      await fetchCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "CU";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const activeCount = customers.filter(
    (customer) => customer.is_active
  ).length;

  return (
    <div className="dashboard">
      <section className="welcome-section">
        <div>
          <span className="welcome-tag">
            <Users size={14} />
            CUSTOMER MANAGEMENT
          </span>

          <h1>Manage Customers</h1>
          <p>View and manage your salon customers.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setShowForm(!showForm);
            setSuccess("");
            setError("");
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close Form" : "Add Customer"}
        </button>
      </section>

      {/* SUMMARY */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "22px",
        }}
      >
        <div style={cardStyle}>
          <Users size={21} color="var(--gold)" />
          <p style={{ color: "var(--muted)", fontSize: "12px" }}>
            Total Customers
          </p>
          <h2 style={{ color: "var(--text)", margin: 0 }}>
            {customers.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <CheckCircle2 size={21} color="#43b581" />
          <p style={{ color: "var(--muted)", fontSize: "12px" }}>
            Active Customers
          </p>
          <h2 style={{ color: "var(--text)", margin: 0 }}>
            {activeCount}
          </h2>
        </div>
      </section>

      {/* ADD CUSTOMER FORM */}
      {showForm && (
        <section style={{ ...cardStyle, marginBottom: "22px" }}>
          <h3 style={{ color: "var(--text)", marginTop: 0 }}>
            Add New Customer
          </h3>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              <label style={{ color: "var(--muted)", fontSize: "12px" }}>
                Full Name *
                <input
                  style={{ ...inputStyle, marginTop: "8px" }}
                  placeholder="Enter customer name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      full_name: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label style={{ color: "var(--muted)", fontSize: "12px" }}>
                Phone Number *
                <input
                  style={{ ...inputStyle, marginTop: "8px" }}
                  placeholder="Enter phone number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone_number: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label style={{ color: "var(--muted)", fontSize: "12px" }}>
                Email Address
                <input
                  style={{ ...inputStyle, marginTop: "8px" }}
                  placeholder="Enter email address"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                <Plus size={17} />
                {saving ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>
        </section>
      )}

      {success && (
        <p style={{ color: "#43b581", marginBottom: "15px" }}>
          <CheckCircle2
            size={16}
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          {success}
        </p>
      )}

      {error && (
        <p style={{ color: "#e36c6c", marginBottom: "15px" }}>
          {error}
        </p>
      )}

      {/* CUSTOMER LIST */}
      <section style={cardStyle}>
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
              All Customers
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "12px", margin: 0 }}>
              Customers stored in your database.
            </p>
          </div>

          <button
            className="text-button"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: "20px" }}>
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
            style={{ ...inputStyle, paddingLeft: "38px" }}
            placeholder="Search name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 15px",
              color: "var(--muted)",
            }}
          >
            <Users size={35} />
            <h3 style={{ color: "var(--text)" }}>No customers found</h3>
            <p>Add a customer or try another search.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "600px",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {["CUSTOMER", "PHONE", "EMAIL", "STATUS"].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px 12px",
                        color: "var(--muted)",
                        fontSize: "10px",
                        letterSpacing: "1px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td
                      style={{
                        padding: "14px 12px",
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
                          {getInitials(customer.full_name)}
                        </div>

                        <div>
                          <strong style={{ color: "var(--text)", fontSize: "13px" }}>
                            {customer.full_name}
                          </strong>
                          <p style={{ color: "var(--muted)", fontSize: "11px", margin: "4px 0 0" }}>
                            Customer #{customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px 12px", color: "var(--text)", fontSize: "12px", borderBottom: "1px solid var(--border)" }}>
                      <Phone size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                      {customer.phone_number || "—"}
                    </td>

                    <td style={{ padding: "14px 12px", color: "var(--text)", fontSize: "12px", borderBottom: "1px solid var(--border)" }}>
                      <Mail size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                      {customer.email || "—"}
                    </td>

                    <td style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)" }}>
                      <span
                        className={`status ${
                          customer.is_active ? "completed" : "cancelled"
                        }`}
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ color: "var(--muted)", fontSize: "11px", marginTop: "18px" }}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </section>
    </div>
  );
}

export default CustomerManagement;
