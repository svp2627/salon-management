
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Scissors,
  Clock,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "./ServicesManagement.css";

const API_URL = "http://localhost:8000/api/services";

function ServicesManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchServices = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load services");
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration_minutes: service.duration_minutes,
    });
    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: Number(formData.price),
      duration_minutes: Number(formData.duration_minutes),
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to save service"
        );
      }

      setMessage(
        editingId
          ? "Service updated successfully!"
          : "Service added successfully!"
      );

      setShowForm(false);
      setFormData(emptyForm);
      setEditingId(null);

      await fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (serviceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${serviceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to delete service");
      }

      setMessage("Service deleted successfully!");
      await fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredServices = services.filter((service) =>
    `${service.name} ${service.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeServices = services.filter(
    (service) => service.is_active
  ).length;

  return (
    <div className="services-page">
      <div className="services-header">
        <div>
          <span className="services-eyebrow">
            <Scissors size={14} /> SALON MANAGEMENT
          </span>
          <h1>Services Management</h1>
          <p>Manage your salon services, pricing and duration.</p>
        </div>

        <button className="service-add-btn" onClick={openAddForm}>
          <Plus size={18} />
          Add New Service
        </button>
      </div>

      {message && (
        <div className="service-alert success">
          <CheckCircle2 size={18} />
          {message}
          <button onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="service-alert error">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="service-stats">
        <div className="service-stat-card">
          <div className="service-stat-icon">
            <Scissors size={21} />
          </div>
          <div>
            <span>Total Services</span>
            <h2>{services.length}</h2>
          </div>
        </div>

        <div className="service-stat-card">
          <div className="service-stat-icon">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Active Services</span>
            <h2>{activeServices}</h2>
          </div>
        </div>

        <div className="service-stat-card">
          <div className="service-stat-icon">
            <IndianRupee size={21} />
          </div>
          <div>
            <span>Average Price</span>
            <h2>
              ₹
              {services.length
                ? Math.round(
                    services.reduce(
                      (total, service) =>
                        total + Number(service.price),
                      0
                    ) / services.length
                  )
                : 0}
            </h2>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="service-form-card">
          <div className="service-form-heading">
            <div>
              <h2>{editingId ? "Edit Service" : "Add New Service"}</h2>
              <p>Enter the service details below.</p>
            </div>

            <button
              className="service-close-btn"
              onClick={() => setShowForm(false)}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="service-form-grid">
              <div className="service-field">
                <label>Service Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Haircut"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="service-field">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="service-field">
                <label>Duration (Minutes) *</label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                  min="1"
                  required
                />
              </div>

              <div className="service-field">
                <label>Description</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the service"
                />
              </div>
            </div>

            <div className="service-form-actions">
              <button type="button" className="service-cancel-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>

              <button type="submit" className="service-save-btn">
                {editingId ? "Update Service" : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="service-list-card">
        <div className="service-list-heading">
          <div>
            <h2>All Services</h2>
            <p>View and manage your salon services.</p>
          </div>

          <button
            className="service-refresh-btn"
            onClick={fetchServices}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="service-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
          />
        </div>

        {loading ? (
          <div className="service-empty">
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="service-empty">
            <Scissors size={35} />
            <h3>No services found</h3>
            <p>Add your first salon service to get started.</p>
          </div>
        ) : (
          <div className="service-table-wrapper">
            <table className="service-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="service-name-cell">
                        <div className="service-row-icon">
                          <Scissors size={18} />
                        </div>
                        <div>
                          <strong>{service.name}</strong>
                          <small>
                            {service.description || "No description"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>₹{Number(service.price).toLocaleString("en-IN")}</strong>
                    </td>

                    <td>
                      <span className="service-duration">
                        <Clock size={14} />
                        {service.duration_minutes} min
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          service.is_active
                            ? "service-status active"
                            : "service-status inactive"
                        }
                      >
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="service-actions">
                        <button
                          className="service-edit-btn"
                          onClick={() => openEditForm(service)}
                          title="Edit service"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="service-delete-btn"
                          onClick={() => handleDelete(service.id)}
                          title="Delete service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicesManagement;
