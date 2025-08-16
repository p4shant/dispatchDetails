document.addEventListener("DOMContentLoaded", function () {
  // Set current datetime as default
  const now = new Date();
  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);
  document.getElementById("date-time").value = localDateTime;

  // Elements
  const systemCountInput = document.getElementById("system-count");
  const cardsContainer = document.getElementById("cards-container");
  const cardsDiv = document.getElementById("cards");
  const countDisplay = document.getElementById("count-display");
  const saveBtn = document.getElementById("save-btn");
  const resetBtn = document.getElementById("reset-btn");
  const notification = document.getElementById("notification");

  // Plant types
  const plantTypes = ["2 Kw", "3 Kw", "4 Kw", "6 Kw", "8 Kw", "10 Kw"];

  // Components list (added new four wiring fields)
  const components = [
    "Module",
    "Inverter",
    "ACDB",
    "DCDB",
    "Earthing Kit",
    "L.A",
    "Structure",
    "WiFi",
    "AC wire",
    "DC wire",
    "Earthing Wire",
    "Earth Pit"
  ];

  // Populate store / technician / district selects (added to ensure UI has options)
  const storeSelect = document.getElementById("store");
  const techSelect = document.getElementById("technician");
  const districtSelect = document.getElementById("district");

  const stores = ["Ghazipur", "Varanasi"];
  const technicians = ["Upender", "Ashish", "Bablu"];
  const districts = [
    "Ghazipur",
    "Varanasi",
    "Ballia",
    "Azamgarh",
    "Mau",
    "Chandauli",
    "Lucknow",
    "Jaunpur",
    "Mirzapur",
    "Bhadohi",
  ];

  function fillSelect(selectEl, items, placeholder = "-- Choose --") {
    selectEl.innerHTML = `<option value="">${placeholder}</option>` + items.map(i => `<option value="${i}">${i}</option>`).join("");
  }

  fillSelect(storeSelect, stores, "-- Choose Store --");
  fillSelect(techSelect, technicians, "-- Choose Technician --");
  fillSelect(districtSelect, districts, "-- Choose District --");

  // Generate cards when system count changes
  systemCountInput.addEventListener("input", function () {
    const count = parseInt(this.value) || 0;

    if (count > 0 && count <= 20) {
      cardsContainer.style.display = "block";
      countDisplay.textContent = `${count} system${
        count > 1 ? "s" : ""
      } to configure`;
      generateCards(count);
    } else if (count > 20) {
      // enforce max
      this.value = 20;
      generateCards(20);
      countDisplay.textContent = `20 systems to configure (max)`;
    } else {
      cardsContainer.style.display = "none";
      cardsDiv.innerHTML = "";
      countDisplay.textContent = "0 systems to configure";
    }
  });

  // Generate card HTML (fixed IDs and labels so checkboxes are clickable)
  function generateCards(count) {
    cardsDiv.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const checkboxHtml = components
        .map((component) => {
          const id = `${component.replace(/\s+/g, "-").toLowerCase()}-${i}`;
          return `
            <div class="component-item">
              <input type="checkbox" id="${id}" name="component-${i}" value="${component}" class="component-checkbox">
              <label for="${id}">${component}</label>
            </div>
          `;
        })
        .join("");

      const plantOptions = plantTypes
        .map((pt) => `<option value="${pt}">${pt}</option>`)
        .join("");

      const cardHtml = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">System ${i}</h3>
          </div>

          <div class="form-group">
            <label for="customer-${i}">Customer Name</label>
            <input type="text" id="customer-${i}" class="customer-name" placeholder="Enter customer name" required>
          </div>

          <div class="form-group">
            <label for="plant-${i}">Plant Type</label>
            <select id="plant-${i}" class="plant-type" required>
              <option value="">Select Plant Type</option>
              ${plantOptions}
            </select>
          </div>

          <div class="components-grid">
            ${checkboxHtml}
          </div>
        </div>
      `;

      cardsDiv.insertAdjacentHTML("beforeend", cardHtml);
    }
  }

  // Save data to Google Sheet
  saveBtn.addEventListener("click", async function () {
    // Basic validation
    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    // Prepare data
    const dispatchData = {
      dateTime: document.getElementById("date-time").value,
      store: document.getElementById("store").value,
      technician: document.getElementById("technician").value,
      district: document.getElementById("district").value,
      totalSystems: parseInt(systemCountInput.value),
      systems: [],
    };

    // Collect system data
    const systemCards = document.querySelectorAll(".card");
    systemCards.forEach((card) => {
      const customerName = card.querySelector(".customer-name").value;
      const plantType = card.querySelector(".plant-type").value;

      const componentsData = {};
      const checkboxes = card.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => {
        componentsData[checkbox.value] = checkbox.checked;
      });

      dispatchData.systems.push({
        customerName,
        plantType,
        components: componentsData,
      });
    });

    // Replace with your deployed Web App URL
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyLKbDI-rxSchN4ngz1ATW6F6lTHeaBAoxnXtoOrMsznknMZaROin3C7PdS9CzkfV-FOg/exec";

    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dispatchData),
            mode: 'no-cors' // Use 'no-cors' mode for Apps Script web apps
        });
        
        // Show notification for a successful save
        notification.style.display = "block";
        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);

    } catch (error) {
        console.error("Error saving data:", error);
        notification.textContent = "Error saving data!";
        notification.style.backgroundColor = "red";
        notification.style.display = "block";
        setTimeout(() => {
            notification.style.display = "none";
            notification.textContent = "Data saved successfully! Excel file downloaded.";
            notification.style.backgroundColor = "#4caf50";
        }, 3000);
    }
  });

  // Reset form
  resetBtn.addEventListener("click", function () {
    // Reset all input fields
    document.getElementById("date-time").value = localDateTime;
    document.getElementById("store").value = "";
    document.getElementById("technician").value = "";
    document.getElementById("district").value = "";
    document.getElementById("system-count").value = "";
    
    // Hide cards container and clear cards
    cardsContainer.style.display = "none";
    cardsDiv.innerHTML = "";
    countDisplay.textContent = "0 systems to configure";
  });

  // Form validation
  function validateForm() {
    if (!document.getElementById("date-time").value) return false;
    if (!document.getElementById("store").value) return false;
    if (!document.getElementById("technician").value) return false;
    if (!document.getElementById("district").value) return false;
    if (!systemCountInput.value || parseInt(systemCountInput.value) < 1)
      return false;

    const customerNames = document.querySelectorAll(".customer-name");
    for (let name of customerNames) {
      if (!name.value.trim()) return false;
    }

    const plantTypes = document.querySelectorAll(".plant-type");
    for (let type of plantTypes) {
      if (!type.value) return false;
    }

    return true;
  }
});
