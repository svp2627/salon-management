
import { useEffect, useState } from "react";
import "./AddAppointment.css";

function AddAppointment({ onAppointmentCreated }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    customer_id: "",
    service: "",
    staff_name: "",
    appointment_date: "",
    notes: "",
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/customers")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load customers");
        return res.json();
      })
      .then((data) => setCustomers(data))
      .catch(() => {
        setMessage("Unable to load customers. Check backend.");
        setMessageType("error");
      });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            customer_id: Number(formData.customer_id),
            appointment_date: formData.appointment_date,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Appointment creation failed");
      }

      setMessage("Appointment created successfully!");
      setMessageType("success");

      setFormData({
        customer_id: "",
        service: "",
        staff_name: "",
        appointment_date: "",
        notes: "",
      });

      if (onAppointmentCreated) {
        onAppointmentCreated();
      }
    } catch (error) {
      setMessage(
        typeof error.message === "string"
          ? error.message
          : "Something went wrong"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-page">
      <div className="appointment-heading">
        <div>
          <span className="appointment-eyebrow">
            ENACT SALON MANAGEMENT
          </span>
          <h1>New Appointment</h1>
          <p>Create and manage your salon bookings with ease.</p>
        </div>

        <div className="appointment-heading-icon">✦</div>
      </div>

      <div className="appointment-card">
        <div className="appointment-card-header">
          <div>
            <span className="appointment-step">BOOKING DETAILS</span>
            <h2>Appointment Information</h2>
            <p>Fill in the details to schedule a new appointment.</p>
          </div>
          <span className="appointment-badge">NEW BOOKING</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="appointment-grid">

            <div className="appointment-field full-width">
              <label>SELECT CUSTOMER</label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name} — {customer.phone_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="appointment-field">
              <label>SERVICE</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              >
                <option value="">Select service</option>
                <option value="Haircut">Haircut</option>
                <option value="Hair Styling">Hair Styling</option>
                <option value="Hair Coloring">Hair Coloring</option>
                <option value="Facial">Facial</option>
                <option value="Manicure">Manicure</option>
                <option value="Pedicure">Pedicure</option>
                <option value="Beard Styling">Beard Styling</option>
                <option value="Bridal Makeup">Bridal Makeup</option>
              </select>
            </div>

            <div className="appointment-field">
              <label>STAFF MEMBER</label>
              <input
                type="text"
                name="staff_name"
                value={formData.staff_name}
                onChange={handleChange}
                placeholder="Enter staff name"
                required
              />
            </div>

            <div className="appointment-field full-width">
              <label>APPOINTMENT DATE & TIME</label>
              <input
                type="datetime-local"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="appointment-field full-width">
              <label>ADDITIONAL NOTES</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any special requests or instructions..."
                rows="4"
              />
            </div>

          </div>

          {message && (
            <div className={`appointment-message ${messageType}`}>
              {messageType === "success" ? "✓ " : "!"}
              {message}
            </div>
          )}

          <div className="appointment-actions">
            <button
              type="button"
              className="appointment-reset"
              onClick={() => {
                setFormData({
                  customer_id: "",
                  service: "",
                  staff_name: "",
                  appointment_date: "",
                  notes: "",
                });
                setMessage("");
              }}
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="appointment-submit"
              disabled={loading}
            >
              {loading ? "Saving..." : "✦  Confirm Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAppointment;
