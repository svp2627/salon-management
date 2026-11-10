
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  Receipt,
  Search,
  MessageCircle,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import "./POSBilling.css";

const CUSTOMER_API = "http://localhost:8000/api/customers";
const SERVICE_API = "http://localhost:8000/api/services";

// DEMO DETAILS - Replace with your actual salon details
const SALON_DETAILS = {
  name: "ENACT SALON",
  tagline: "PREMIUM HAIR & BEAUTY STUDIO",
  address:
    "No. 24, 2nd Floor, Anna Nagar Main Road, Chennai, Tamil Nadu - 600040",
  phone: "+91 98765 43210",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Anna+Nagar+Main+Road+Chennai",
};

function POSBilling() {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);

  // Load customers and services
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerResponse, serviceResponse] = await Promise.all([
          fetch(CUSTOMER_API),
          fetch(SERVICE_API),
        ]);

        if (!customerResponse.ok || !serviceResponse.ok) {
          throw new Error("Could not load customers or services");
        }

        const customerData = await customerResponse.json();
        const serviceData = await serviceResponse.json();

        setCustomers(
          Array.isArray(customerData)
            ? customerData
            : customerData.customers || []
        );

        const serviceList = Array.isArray(serviceData)
          ? serviceData
          : serviceData.services || [];

        setServices(
          serviceList.filter((service) => service.is_active !== false)
        );
      } catch (error) {
        console.error(error);
        alert("Customers or services load aagala. Backend check pannu.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Add service to cart
  const addToCart = (service) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === service.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: service.id,
          name: service.name,
          price: Number(service.price),
          quantity: 1,
        },
      ];
    });

    setReceiptData(null);
  };

  // Change quantity
  const changeQuantity = (id, amount) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    setReceiptData(null);
  };

  // Remove service
  const removeItem = (id) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );

    setReceiptData(null);
  };

  // Calculate totals
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const total = Math.max(0, subtotal - discountAmount);

  // Search services
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase())
  );

  // Selected customer
  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerId)
  );

  // Generate bill
  const generateBill = () => {
    if (cart.length === 0) {
      alert("Please add at least one service.");
      return;
    }

    const bill = {
      billNumber: `EN-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleString("en-IN"),
      customer: selectedCustomer?.full_name || "Walk-in Customer",
      phone: selectedCustomer?.phone_number || "",
      items: cart.map((item) => ({ ...item })),
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
    };

    setReceiptData(bill);
  };

  // Download PDF invoice
  const downloadInvoicePDF = async () => {
    if (!receiptData) return;

    try {
      const invoice = document.getElementById("pos-print-area");

      if (!invoice) {
        alert("Invoice not found.");
        return;
      }

      const canvas = await html2canvas(invoice, {
        scale: 2,
        backgroundColor: "#fffdf8",
      });

      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;

      const imageWidth = pageWidth - margin * 2;
      const imageHeight =
        (canvas.height * imageWidth) / canvas.width;

      // Supports multiple PDF pages if invoice is long
      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(
        image,
        "PNG",
        margin,
        position,
        imageWidth,
        imageHeight
      );

      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft);
        pdf.addPage();

        pdf.addImage(
          image,
          "PNG",
          margin,
          position,
          imageWidth,
          imageHeight
        );

        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`${receiptData.billNumber}.pdf`);
    } catch (error) {
      console.error(error);
      alert("PDF download failed. Please try again.");
    }
  };

  // Download personalized thank-you image
  const downloadThankYouImage = async () => {
    if (!receiptData) return;

    try {
      const card = document.getElementById("pos-thankyou-card");

      if (!card) {
        alert("Thank-you card not found.");
        return;
      }

      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: "#17130d",
      });

      const link = document.createElement("a");

      link.download = `${receiptData.billNumber}-ThankYou.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error(error);
      alert("Thank-you image download failed.");
    }
  };

  // Send WhatsApp message
  const sendWhatsAppBill = () => {
    if (!receiptData?.phone) {
      alert(
        "Customer WhatsApp number not available. Please select a customer."
      );
      return;
    }

    let phone = String(receiptData.phone).replace(/\D/g, "");

    if (phone.length === 10) {
      phone = "91" + phone;
    }

    const itemsText = receiptData.items
      .map(
        (item) =>
          `${item.name} x ${item.quantity} = ₹${(
            item.price * item.quantity
          ).toLocaleString("en-IN")}`
      )
      .join("\n");

    const message = `✨ *${SALON_DETAILS.name} - PAYMENT RECEIPT* ✨

Bill No: ${receiptData.billNumber}
Date: ${receiptData.date}

Dear ${receiptData.customer},

Thank you for visiting ${SALON_DETAILS.name}!

*SERVICES*
${itemsText}

Subtotal: ₹${receiptData.subtotal.toLocaleString("en-IN")}
Discount: ₹${receiptData.discount.toLocaleString("en-IN")}

*TOTAL: ₹${receiptData.total.toLocaleString("en-IN")}*

Payment: ${receiptData.paymentMethod}

Please find your invoice PDF and personalized thank-you card attached.

Thank you for choosing ${SALON_DETAILS.name}. We look forward to seeing you again! ❤️`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  // Print invoice
  const printBill = () => {
    window.print();
  };

  // New bill
  const newBill = () => {
    setCart([]);
    setCustomerId("");
    setDiscount(0);
    setPaymentMethod("Cash");
    setSearch("");
    setReceiptData(null);
  };

  if (loading) {
    return (
      <div className="pos-loading">
        Loading POS Billing...
      </div>
    );
  }

  return (
    <div className="pos-page">
      {/* Header */}
      <div className="pos-header">
        <div>
          <h1>POS Billing</h1>
          <p>Create customer bills and process payments</p>
        </div>

        <div className="pos-header-icon">
          <Receipt size={25} />
        </div>
      </div>

      <div className="pos-layout">
        {/* Services panel */}
        <section className="pos-services-panel">
          <div className="pos-section-heading">
            <h2>Select Services</h2>
            <span>{services.length} services</span>
          </div>

          <div className="pos-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
            />
          </div>

          <div className="pos-service-grid">
            {filteredServices.length === 0 ? (
              <p className="pos-empty">No services found.</p>
            ) : (
              filteredServices.map((service) => (
                <div
                  className="pos-service-card"
                  key={service.id}
                >
                  <div className="pos-service-icon">
                    <Receipt size={22} />
                  </div>

                  <h3>{service.name}</h3>
                  <p>{service.duration_minutes} minutes</p>

                  <div className="pos-service-bottom">
                    <strong>
                      ₹{Number(service.price).toLocaleString("en-IN")}
                    </strong>

                    <button
                      onClick={() => addToCart(service)}
                      title="Add service"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Cart panel */}
        <section className="pos-cart-panel">
          <div className="pos-section-heading">
            <h2>
              <ShoppingCart size={20} /> Current Bill
            </h2>
            <span>{cart.length} items</span>
          </div>

          <label
            className="pos-label"
            htmlFor="pos-customer"
          >
            Select Customer
          </label>

          <select
            id="pos-customer"
            className="pos-input"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setReceiptData(null);
            }}
          >
            <option value="">Walk-in Customer</option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.full_name}
                {customer.phone_number
                  ? ` - ${customer.phone_number}`
                  : ""}
              </option>
            ))}
          </select>

          {/* Cart items */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-empty-cart">
                <ShoppingCart size={35} />
                <p>No services added yet</p>
                <span>Select a service to start billing</span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  className="pos-cart-item"
                  key={item.id}
                >
                  <div className="pos-cart-item-info">
                    <strong>{item.name}</strong>
                    <span>
                      ₹{item.price.toLocaleString("en-IN")} each
                    </span>
                  </div>

                  <div className="pos-quantity">
                    <button
                      onClick={() =>
                        changeQuantity(item.id, -1)
                      }
                    >
                      <Minus size={14} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        changeQuantity(item.id, 1)
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <strong className="pos-line-total">
                    ₹{(
                      item.price * item.quantity
                    ).toLocaleString("en-IN")}
                  </strong>

                  <button
                    className="pos-remove"
                    onClick={() => removeItem(item.id)}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bill summary */}
          <div className="pos-bill-summary">
            <div className="pos-summary-row">
              <span>Subtotal</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="pos-discount-row">
              <label htmlFor="pos-discount">
                Discount (₹)
              </label>

              <input
                id="pos-discount"
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) => {
                  setDiscount(e.target.value);
                  setReceiptData(null);
                }}
                placeholder="0"
              />
            </div>

            <div className="pos-summary-row pos-total-row">
              <span>Total Amount</span>
              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {/* Payment method */}
          <label
            className="pos-label"
            htmlFor="pos-payment"
          >
            Payment Method
          </label>

          <select
            id="pos-payment"
            className="pos-input"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setReceiptData(null);
            }}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>

          {/* Generate bill */}
          <button
            className="pos-generate-btn"
            onClick={generateBill}
          >
            <Receipt size={18} />
            Generate Bill
          </button>

          {/* Receipt actions */}
          {receiptData && (
            <>
              <button
                className="pos-print-btn"
                onClick={downloadInvoicePDF}
              >
                <Download size={18} />
                Download Invoice PDF
              </button>

              <button
                className="pos-print-btn"
                onClick={downloadThankYouImage}
              >
                <ImageIcon size={18} />
                Download Thank-you Image
              </button>

              <button
                className="pos-print-btn"
                onClick={printBill}
              >
                <Printer size={18} />
                Print Invoice
              </button>

              <button
                className="pos-whatsapp-btn"
                onClick={sendWhatsAppBill}
              >
                <MessageCircle size={18} />
                Open WhatsApp
              </button>
            </>
          )}

          <button
            className="pos-clear-btn"
            onClick={newBill}
          >
            Clear / New Bill
          </button>
        </section>
      </div>

      {/* Invoice receipt */}
      {receiptData && (
        <div
          className="pos-receipt"
          id="pos-print-area"
        >
          <div className="pos-receipt-header">
            <h2>{SALON_DETAILS.name}</h2>
            <p>{SALON_DETAILS.tagline}</p>
            <p>Payment Receipt</p>
          </div>

          <div className="pos-receipt-details">
            <p>
              <strong>Bill No:</strong> {receiptData.billNumber}
            </p>
            <p>
              <strong>Date:</strong> {receiptData.date}
            </p>
            <p>
              <strong>Customer:</strong> {receiptData.customer}
            </p>

            {receiptData.phone && (
              <p>
                <strong>Phone:</strong> {receiptData.phone}
              </p>
            )}

            <p>{SALON_DETAILS.address}</p>
            <p>{SALON_DETAILS.phone}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {receiptData.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>
                    ₹{(
                      item.price * item.quantity
                    ).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pos-receipt-total">
            <p>
              Subtotal: ₹{receiptData.subtotal.toLocaleString("en-IN")}
            </p>

            <p>
              Discount: ₹{receiptData.discount.toLocaleString("en-IN")}
            </p>

            <h3>
              Total: ₹{receiptData.total.toLocaleString("en-IN")}
            </h3>

            <p>Payment: {receiptData.paymentMethod}</p>
          </div>

          <p className="pos-thank-you">
            Thank you for visiting {SALON_DETAILS.name}!
          </p>
        </div>
      )}

      {/* Personalized thank-you card */}
      {receiptData && (
        <div
          className="pos-thankyou-card"
          id="pos-thankyou-card"
        >
          <div className="thankyou-top-line">
            ✦ {SALON_DETAILS.name} ✦
          </div>

          <p className="thankyou-tagline">
            {SALON_DETAILS.tagline}
          </p>

          <div className="thankyou-divider">✧</div>

          <h1>THANK YOU!</h1>

          <h2>Dear {receiptData.customer},</h2>

          <p className="thankyou-message">
            Thank you for choosing {SALON_DETAILS.name}.
            It was our pleasure to serve you.
            We hope to see you again soon!
          </p>

          <div className="thankyou-bill">
            <span>YOUR VISIT</span>
            <strong>{receiptData.billNumber}</strong>
            <strong>
              ₹{receiptData.total.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="thankyou-divider">✧</div>

          <h3>WE LOOK FORWARD TO SEEING YOU AGAIN</h3>

          <p className="thankyou-shop-name">
            {SALON_DETAILS.name}
          </p>

          <p>{SALON_DETAILS.address}</p>
          <p>{SALON_DETAILS.phone}</p>

          <a
            href={SALON_DETAILS.mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            Find us on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

export default POSBilling;
