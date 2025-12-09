// Doctor data
const DOCTORS = [
  {
    id: "dr-sharma",
    name: "Dr. Neeraj Sharma",
    speciality: "General Physician",
    timings: "10:00 AM – 1:30 PM",
    fee: "₹500",
    slots: ["10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "12:00", "12:20"]
  },
  {
    id: "dr-patil",
    name: "Dr. Asha Patil",
    speciality: "Dentist",
    timings: "4:00 PM – 8:00 PM",
    fee: "₹600",
    slots: ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"]
  },
  {
    id: "dr-khan",
    name: "Dr. Imran Khan",
    speciality: "Pediatrician",
    timings: "11:00 AM – 3:00 PM",
    fee: "₹650",
    slots: ["11:00", "11:20", "11:40", "12:00", "12:20", "12:40", "13:00"]
  }
];

const STORAGE_KEY = "smilecare_appointments";

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  setMinDate();
  populateDoctors();
  renderAppointments();

  document.getElementById("doctor").addEventListener("change", populateSlots);
  document.getElementById("appointmentForm").addEventListener("submit", handleSubmit);
});

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function setMinDate() {
  const input = document.getElementById("date");
  if (!input) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const min = `${yyyy}-${mm}-${dd}`;
  input.min = min;
  input.value = min;
}

function populateDoctors() {
  const select = document.getElementById("doctor");
  if (!select) return;
  select.innerHTML = '<option value="">Select doctor</option>';

  DOCTORS.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = `${doc.name} (${doc.speciality})`;
    select.appendChild(opt);
  });
}

function populateSlots() {
  const doctorSelect = document.getElementById("doctor");
  const slotSelect = document.getElementById("timeSlot");
  if (!doctorSelect || !slotSelect) return;

  const id = doctorSelect.value;
  slotSelect.innerHTML = '<option value="">Select time slot</option>';
  if (!id) return;

  const doc = DOCTORS.find((d) => d.id === id);
  if (!doc) return;

  doc.slots.forEach((time24) => {
    const label = formatTimeDisplay(time24);
    const opt = document.createElement("option");
    opt.value = label;
    opt.textContent = label;
    slotSelect.appendChild(opt);
  });
}

function formatTimeDisplay(time24) {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

// FORM SUBMIT
function handleSubmit(e) {
  e.preventDefault();

  const errorEl = document.getElementById("formError");
  const successEl = document.getElementById("formSuccess");
  errorEl.textContent = "";
  successEl.textContent = "";

  const patientName = document.getElementById("patientName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const doctorId = document.getElementById("doctor").value;
  const service = document.getElementById("service").value;
  const date = document.getElementById("date").value;
  const timeSlot = document.getElementById("timeSlot").value;
  const notes = document.getElementById("notes").value.trim();
  const whatsapp = document.getElementById("whatsappUpdates").checked;

  if (!patientName || !phone || !doctorId || !service || !date || !timeSlot) {
    errorEl.textContent = "Please fill all required fields.";
    return;
  }

  const phoneReg = /^[6-9]\d{9}$/;
  if (!phoneReg.test(phone)) {
    errorEl.textContent = "Please enter a valid 10 digit Indian mobile number.";
    return;
  }

  const doctor = DOCTORS.find((d) => d.id === doctorId);

  const appointment = {
    id: "apt_" + Date.now(),
    patientName,
    phone,
    email,
    doctorId,
    doctorName: doctor ? doctor.name : "",
    speciality: doctor ? doctor.speciality : "",
    timings: doctor ? doctor.timings : "",
    fee: doctor ? doctor.fee : "",
    service,
    date,
    timeSlot,
    notes,
    whatsapp,
    createdAt: new Date().toISOString()
  };

  saveAppointment(appointment);
  renderAppointments();

  successEl.textContent =
    "Appointment booked successfully! Please reach 10 minutes before your time slot.";
  e.target.reset();
  setMinDate();
  populateSlots();

  setTimeout(() => {
    successEl.textContent = "";
  }, 5000);
}

// LOCAL STORAGE HELPERS
function getAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading appointments", err);
    return [];
  }
}

function saveAppointment(apt) {
  const all = getAppointments();
  all.push(apt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function clearAppointments() {
  if (!confirm("Clear all appointments saved on this device?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderAppointments();
}

function renderAppointments() {
  const container = document.getElementById("appointmentsList");
  if (!container) return;

  const appointments = getAppointments();
  if (!appointments.length) {
    container.innerHTML =
      '<p style="font-size:0.8rem;color:#94a3b8;">No appointments saved on this device yet.</p>';
    return;
  }

  const sorted = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
  container.innerHTML = "";

  sorted.forEach((apt) => {
    const item = document.createElement("div");
    item.className = "appointment-item";

    const dateDisplay = formatDateDisplay(apt.date);

    item.innerHTML = `
      <div class="appointment-top">
        <span>${apt.patientName}</span>
        <span>${dateDisplay}, ${apt.timeSlot}</span>
      </div>
      <div class="appointment-meta">
        <span>${apt.doctorName} (${apt.speciality})</span>
        <span>${apt.service}</span>
        <span>Mobile: ${apt.phone}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-IN", opts);
}
