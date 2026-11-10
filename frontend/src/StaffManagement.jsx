
import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  UserRound,
} from "lucide-react";
import "./StaffManagement.css";

const API_URL = "http://localhost:8000/api/staff";

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    full_name: "",
    email: "",
    phone_number: "",
    role: "Stylist",
    salary: "",
  };

  const [form, setForm] = useState(emptyForm);

  const fetchStaff = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to load staff");
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      alert("Could not load staff. Please check backend.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (member) => {
    setEditingId(member.id);
    setForm({
      full_name: member.full_name || "",
      email: member.email || "",
      phone_number: member.phone_number || "",
      role: member.role || "Stylist",
      salary: member.salary || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      salary: form.salary ? Number(form.salary) : null,
      email: form.email || null,
      phone_number: form.phone_number || null,
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Something went wrong");
      }

      alert(editingId ? "Staff updated successfully!" : "Staff added successfully!");
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchStaff();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || "Delete failed");
      }

      fetchStaff();
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredStaff = staff.filter((member) =>
    `${member.full_name} ${member.role} ${member.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="staff-page">
      <div className="staff-header">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your salon team and staff details</p>
        </div>

        <button className="staff-add-btn" onClick={openAddForm}>
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      <div className="staff-stats">
        <div className="staff-stat-card">
          <Users size={24} />
          <div>
            <h2>{staff.length}</h2>
            <p>Total Staff</p>
          </div>
        </div>

        <div className="staff-stat-card">
          <UserRound size={24} />
          <div>
            <h2>{staff.filter((s) => s.is_active).length}</h2>
            <p>Active Staff</p>
          </div>
        </div>
      </div>

      <div className="staff-toolbar">
        <div className="staff-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="staff-table-container">
        {loading ? (
          <p className="staff-message">Loading staff...</p>
        ) : filteredStaff.length === 0 ? (
          <p className="staff-message">No staff members found.</p>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="staff-name">
                      <div className="staff-avatar">
                        {member.full_name?.charAt(0).toUpperCase()}
                      </div>
                      {member.full_name}
                    </div>
                  </td>
                  <td>{member.role}</td>
                  <td>{member.email || "—"}</td>
                  <td>{member.phone_number || "—"}</td>
                  <td>
                    {member.salary != null
                      ? `₹${Number(member.salary).toLocaleString("en-IN")}`
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        member.is_active
                          ? "staff-status active"
                          : "staff-status inactive"
                      }
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="staff-actions">
                      <button
                        className="staff-edit-btn"
                        onClick={() => openEditForm(member)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="staff-delete-btn"
                        onClick={() => handleDelete(member.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <div className="staff-modal-header">
              <h2>{editingId ? "Edit Staff" : "Add New Staff"}</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="staff-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Full Name *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                minLength={2}
              />

              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
              />

              <label>Phone Number</label>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="Enter phone number"
              />

              <label>Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="Stylist">Stylist</option>
                <option value="Senior Stylist">Senior Stylist</option>
                <option value="Hair Expert">Hair Expert</option>
                <option value="Beautician">Beautician</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Manager">Manager</option>
              </select>

              <label>Monthly Salary (₹)</label>
              <input
                name="salary"
                type="number"
                min="1"
                value={form.salary}
                onChange={handleChange}
                placeholder="Enter salary"
              />

              <div className="staff-form-actions">
                <button
                  type="button"
                  className="staff-cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="staff-save-btn">
                  {editingId ? "Update Staff" : "Save Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;
