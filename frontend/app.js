// ===== CONFIGURATION =====
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "productId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "producer",
          "type": "string"
        }
      ],
      "name": "ProductCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "productId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "participant",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "eventType",
          "type": "string"
        }
      ],
      "name": "ProductUpdated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "productId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "origin",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "date",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "producer",
          "type": "string"
        }
      ],
      "name": "createProduct",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "productId",
          "type": "string"
        }
      ],
      "name": "getHistory",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "participant",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "eventType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "date",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "internalType": "struct StrawberryTraceability.Event[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "productId",
          "type": "string"
        }
      ],
      "name": "getProducer",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "productId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "participant",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "eventType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "date",
          "type": "string"
        }
      ],
      "name": "updateProduct",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

// ---------- CONNECT TO CONTRACT ----------
const ETHERS_CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js",
  "https://cdn.ethers.io/lib/ethers-5.7.umd.min.js",
];

let ethersLoadPromise;

function loadEthersFromCdn(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () =>
      window.ethers
        ? resolve(window.ethers)
        : reject(new Error(`ethers.js failed to initialize from ${src}`));
    script.onerror = () => reject(new Error(`ethers.js failed to load from ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureEthersLoaded() {
  if (window.ethers) return window.ethers;

  if (!ethersLoadPromise) {
    ethersLoadPromise = (async () => {
      let lastError;

      for (const url of ETHERS_CDN_URLS) {
        try {
          return await loadEthersFromCdn(url);
        } catch (err) {
          console.error(`Failed to load ethers.js from ${url}`, err);
          lastError = err;
        }
      }

      throw lastError || new Error("ethers.js failed to load from all sources");
    })();
  }

  try {
    return await ethersLoadPromise;
  } catch (err) {
    // Allow retry on subsequent attempts.
    ethersLoadPromise = null;
    throw err;
  }
}


async function getContract() {
  if (!window.ethereum) {
    alert("❌ MetaMask not detected. Please install it to use this DApp.");
    throw new Error("MetaMask not found");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  // Ensure ethers.js is available from the CDN script or load it lazily.
  const ethersLib = await ensureEthersLoaded().catch((err) => {
    console.error("ethers load error", err);
    alert("❌ Ethers.js failed to load. Please check your connection and refresh the page.");
    return null;
  });
  if (!ethersLib) {
    throw new Error("ethers.js not available on window");
  }

  // ethers v5 syntax:
  const provider = new ethersLib.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  // Optional: verify correct network (Hardhat localhost)
  const network = await provider.getNetwork();
  if (network.chainId !== 31337) {
    alert("⚠️ Please switch MetaMask to the Hardhat network (chainId 31337)");
  }

  return new ethersLib.Contract(contractAddress, contractABI, signer);
}

// Public/read-only contract instance that does not prompt the user to connect
async function getReadOnlyContract() {
  const ethersLib = await ensureEthersLoaded().catch((err) => {
    console.error("ethers load error", err);
    alert("❌ Ethers.js failed to load. Please check your connection and refresh the page.");
    return null;
  });
  if (!ethersLib) throw new Error("ethers.js not available on window");

  // Always read from local Hardhat node (stable for logs)
  const provider = new ethersLib.providers.JsonRpcProvider("http://127.0.0.1:8545");
  return new ethersLib.Contract(contractAddress, contractABI, provider);
}


// ---------- MY QR LIST (Farmer / Warehouse / Retailer) ----------
function buildConsumerUrl(productId) {
  return `${window.location.origin}/index.html?productId=${encodeURIComponent(productId)}`;
}

async function renderMyQrListForCurrentPage() {
  const container = document.getElementById("myQrList");
  if (!container) return;

  const session = getCurrentUser();
  if (!session || !session.username) {
    container.innerHTML = "<p class='text-muted'>Please log in to see your products.</p>";
    return;
  }

  const username = session.username;
  const contract = await getReadOnlyContract();

  // Read blockchain events
  const createdEvents = await contract.queryFilter("ProductCreated", 0, "latest");
  const updatedEvents = await contract.queryFilter("ProductUpdated", 0, "latest");

  let productIds = [];
  const page = window.location.pathname.toLowerCase();

  if (page.endsWith("farmer.html")) {
    // Farmer → products they created
    productIds = createdEvents
      .filter(e => e.args?.producer === username)
      .map(e => e.args.productId);
  } else {
    // Warehouse / Retailer → products they updated
    productIds = updatedEvents
      .filter(e => e.args?.participant === username)
      .map(e => e.args.productId);
  }

  productIds = [...new Set(productIds)]; // unique

  if (productIds.length === 0) {
    container.innerHTML = "<p class='text-muted'>No products found yet.</p>";
    return;
  }

  container.innerHTML = "";

  for (const id of productIds) {
    const url = buildConsumerUrl(id);

    const card = document.createElement("div");
    card.className = "card shadow-sm mb-3";
    card.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-8">
            <div><strong>Product ID:</strong> ${id}</div>
            <div class="mt-1">
              <strong>Verification link:</strong>
              <a href="${url}" target="_blank" rel="noopener noreferrer">
                ${url}
              </a>
            </div>
          </div>
          <div class="col-md-4 text-center">
            <canvas id="myqr-${id}"></canvas>
            <div class="small text-muted mt-2">Scan to verify</div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);

    // Draw QR
    if (window.QRCode?.toCanvas) {
      const canvas = document.getElementById(`myqr-${id}`);
      await QRCode.toCanvas(canvas, url, { width: 140, margin: 1 });
    }
  }
}


// ADDED FOR ROLE-BASED ACCESS
function checkRole(allowedRoles) {
  const session = getCurrentUser();
  const isAllowed = session && allowedRoles.includes(session.role);
  if (!isAllowed) {
    alert("🚫 Forbidden: You do not have access to this action.");
  }
  return isAllowed;
}

// ---------- CREATE PRODUCT ----------
async function createProduct() {
  if (!checkRole(["Farmer", "Admin"])) return false; // ADDED FOR ROLE-BASED ACCESS
  try{
  const id = document.getElementById("pid").value.trim();
  const name = document.getElementById("pname").value.trim();
  const origin = document.getElementById("porigin").value.trim();
  const dateInput = document.getElementById("pdate").value.trim();
  const producerDisplay = document.getElementById("pproducer").value.trim(); // keep for UI only
  const session = getCurrentUser();
  const producer = session?.username || producerDisplay; // on-chain identity = username


  if (!id || !name || !origin || !dateInput || !producerDisplay) {
    alert("⚠️ Please fill in all fields.");
    return;
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD for blockchain storage
  const date = convertDDMMYYYYtoISO(dateInput);

  const contract = await getContract();
  const tx = await contract.createProduct(id, name, origin, date, producer);
  const receipt = await tx.wait();

  // Capture the unique transaction hash
  const txHash = receipt.transactionHash;

  // Increment counter only after successful blockchain transaction
  let productCounter = localStorage.getItem("productCounter")
    ? parseInt(localStorage.getItem("productCounter"))
    : 0;
  productCounter++;
  localStorage.setItem("productCounter", productCounter);

  // Show success notification
  alert("✅ Product added successfully to blockchain!\n\n📦 Product ID: " + id + "\n🔗 Transaction Hash: " + txHash + "\n📱 QR Code generated below");

  return { success: true, txHash };
  } catch (err) {
    console.error("❌ Error in createProduct:", err);
    alert("❌ Failed to add product. Open browser console (F12 → Console) to see details.");
    return { success: false };
  }
}

// ---------- UPDATE PRODUCT ----------
// ADDED FOR ROLE-BASED ACCESS: split update handlers so each role reads its own form fields
async function updateProductFromFields(fieldMap, allowedRoles) {
  if (!checkRole(allowedRoles)) return;

  const id = document.getElementById(fieldMap.id)?.value.trim();
  const session = getCurrentUser();
  const participant = session?.username || ""; // on-chain identity = username

  const locationName = document.getElementById(fieldMap.participant)?.value.trim(); // warehouse/store name (UI)
  const event = document.getElementById(fieldMap.event)?.value.trim();

  const eventWithLocation = locationName ? `${event} @ ${locationName}` : event;

  const dateInput = document.getElementById(fieldMap.date)?.value.trim();

  if (!id || !event || !dateInput) {
    alert("⚠️ Please fill in all fields.");
    return;
  }
  if (!participant) {
    alert("⚠️ You must be logged in.");
    return;
  }


  // Convert DD/MM/YYYY to YYYY-MM-DD for blockchain storage
  const date = convertDDMMYYYYtoISO(dateInput);

  const contract = await getContract();
  const tx = await contract.updateProduct(id, participant, eventWithLocation, date);

  await tx.wait();

  alert("✅ Product updated successfully!");
}

function updateWarehouseProduct() {
  updateProductFromFields(
    { id: "warehousePid", participant: "warehouseParticipant", event: "warehouseEvent", date: "warehouseDate" },
    ["WarehouseWorker", "Admin"]
  );
}

function updateRetailerProduct() {
  updateProductFromFields(
    { id: "retailerPid", participant: "retailerParticipant", event: "retailerEvent", date: "retailerDate" },
    ["Retailer", "Admin"]
  );
}

// ---------- GET PRODUCT HISTORY ----------
async function getHistory() {
  const id = document.getElementById("gid").value.trim();
  const outputEl = document.getElementById("output");

  if (!id) {
    alert("⚠️ Enter a product ID first.");
    return;
  }

  try {
    const contract = await getContract();
    const history = await contract.getHistory(id);

    let text = "";
    history.forEach((h) => {
      const formattedDate = formatDateString(h.date) || h.date;
      const timestamp = new Date(h.timestamp * 1000); // Convert Unix timestamp (seconds) to milliseconds
      const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      text += `[Product ${id}] ${h.participant} → ${h.eventType} on ${formattedDate} at ${time}\n`;
    });

    outputEl.textContent = text || "No history found for this ID.";
    outputEl.style.display = "block"; // Show the results
  } catch (err) {
    console.error("❌ Error fetching history:", err);
    alert(
      "❌ Unable to read product history. Check that ethers.js loaded, the contract is deployed on the selected network, and the product ID exists."
    );
    outputEl.style.display = "none"; // Hide on error
  }
}

// ADDED FOR ROLE-BASED ACCESS: admin history helper
async function adminGetHistory() {
  const id = document.getElementById("adminTraceId").value.trim();
  const outputEl = document.getElementById("adminOutput");

  if (!id) {
    alert("⚠️ Enter a product ID first.");
    return;
  }

  try {
    const contract = await getContract();
    const history = await contract.getHistory(id);
    let text = "";
    history.forEach((h) => {
      const formattedDate = formatDateString(h.date) || h.date;
      const timestamp = new Date(h.timestamp * 1000); // Convert Unix timestamp (seconds) to milliseconds
      const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      text += `[Product ${id}] ${h.participant} → ${h.eventType} on ${formattedDate} at ${time}\n`;
    });

    outputEl.textContent = text || "No history found for this ID.";
    outputEl.style.display = "block"; // Show the results
  } catch (err) {
    console.error("❌ Error fetching admin history:", err);
    alert("❌ Unable to load history for admin view.");
    outputEl.style.display = "none"; // Hide on error
  }
}

// ADDED FOR ROLE-BASED ACCESS: public history helper
async function publicGetHistory() {
  const id = document.getElementById("publicTraceId").value.trim();
  const outputEl = document.getElementById("publicOutput");
  const resultsSection = document.getElementById("resultsSection");
  const invalidProduct = document.getElementById("invalidProduct");

  if (!id) {
    alert("⚠️ Enter a product ID first.");
    return;
  }

  // Hide previous results
  if (resultsSection) resultsSection.style.display = "none";
  if (invalidProduct) invalidProduct.style.display = "none";

  try {
    const contract = await getReadOnlyContract();
    const history = await contract.getHistory(id);

    if (history && history.length > 0) {
      let text = "";
      history.forEach((h) => {
        const formattedDate = formatDateString(h.date) || h.date;
        const timestamp = new Date(h.timestamp * 1000); // Convert Unix timestamp (seconds) to milliseconds
        const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        text += `[Product ${id}] ${h.participant} → ${h.eventType} on ${formattedDate} at ${time}\n`;
      });
      outputEl.textContent = text;
      if (resultsSection) resultsSection.style.display = "block";
    } else {
      outputEl.textContent = "No history found for this ID.";
      if (invalidProduct) invalidProduct.style.display = "block";
    }
  } catch (err) {
    console.error("❌ Error fetching public history:", err);
    if (invalidProduct) {
      invalidProduct.style.display = "block";
    } else {
      alert("❌ Unable to load history for this product.");
    }
  }
}

// ---------- QR/FRONTEND HELPERS ----------
// Function to create QR only (UPDATED: QR encodes a URL + clickable link shown)
async function generateQR(txHash = null) {
  const pid = document.getElementById("pid").value;
  const pname = document.getElementById("pname").value.trim();
  const porigin = document.getElementById("porigin").value.trim();
  const pdate = document.getElementById("pdate").value.trim();
  const pproducer = document.getElementById("pproducer").value.trim();

  if (!pname || !porigin || !pdate || !pproducer) {
    alert("Please fill in all fields before adding the product.");
    return;
  }

  const qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = "";
  document.getElementById("printQR").style.display = "none";

  try {
    // Create QR code wrapper with styling
    const qrWrapper = document.createElement("div");
    qrWrapper.className = "qr-code-wrapper";

    const txHashDisplay = txHash
      ? `<div class="product-detail"><strong>Blockchain TX:</strong> <span class="text-break small">${txHash}</span></div>`
      : "";

    qrWrapper.innerHTML = `
      <div class="alert alert-success mb-3">
        <strong>✓ QR Code Generated Successfully!</strong>
        <p class="mb-0 small">Scan this code to verify product authenticity</p>
      </div>
      <div class="qr-display-card">
        <div class="row">
          <div class="col-md-6 text-center qr-canvas-container">
            <canvas id="qr-canvas"></canvas>
            <p class="small text-muted mt-2">Scan with any QR code reader</p>
          </div>
          <div class="col-md-6 qr-product-info">
            <h6 class="mb-3">Product Information</h6>
            <div class="product-detail"><strong>Product ID:</strong> ${pid}</div>
            <div class="product-detail"><strong>Name:</strong> ${pname}</div>
            <div class="product-detail"><strong>Origin:</strong> ${porigin}</div>
            <div class="product-detail"><strong>Harvest Date:</strong> ${pdate}</div>
            <div class="product-detail"><strong>Producer:</strong> ${pproducer}</div>
            ${txHashDisplay}
          </div>
        </div>
      </div>
    `;
    qrContainer.appendChild(qrWrapper);

    // ✅ UPDATED: QR contains a URL to the consumer verification page
    // This is what makes the QR "live": consumer page fetches latest on-chain history by productId
    const qrUrl = `${window.location.origin}/index.html?productId=${encodeURIComponent(pid)}`;

    // Add clickable link for PC users (next to product info)
    const infoPanel = qrWrapper.querySelector(".qr-product-info");
    if (infoPanel) {
      infoPanel.insertAdjacentHTML(
        "beforeend",
        `
        <div class="product-detail">
          <strong>Verification link:</strong>
          <a href="${qrUrl}" target="_blank" rel="noopener noreferrer">
            ${qrUrl}
          </a>
        </div>
        `
      );
    }

    // Generate QR code on the canvas (encodes the URL)
    const canvas = document.getElementById("qr-canvas");
    await QRCode.toCanvas(canvas, qrUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    document.getElementById("printQR").style.display = "inline-block";

    // Smooth scroll to QR code
    setTimeout(() => {
      qrContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  } catch (err) {
    console.error("QR generation error:", err);
    alert("Could not generate QR code.");
  }
}


// Combined function → runs MetaMask logic from app.js + QR generator
async function addProduct() {
  let result = { success: false };
  try {
    // Call blockchain createProduct() from app.js (MetaMask)
    if (typeof createProduct === "function") {
      result = await createProduct();
    } else {
      console.warn("createProduct() not found in app.js");
    }
  } catch (err) {
    console.error("Blockchain error:", err);
  }

  // Only generate QR code when product creation succeeds
  if (result.success) {
    await generateQR(result.txHash);

    // Clear form fields AFTER QR code is generated
    document.getElementById("pname").value = "";
    document.getElementById("porigin").value = "";
    document.getElementById("pproducer").value = "";

    // Refresh form to show next available ID
    prepareFarmerForm();
  }
}

function formatDateString(dateValue) {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime())
    ? dateValue
    : parsed.toLocaleDateString('en-GB', {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

// Convert Date object to DD/MM/YYYY format
function formatDateToDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for blockchain storage
function convertDDMMYYYYtoISO(ddmmyyyy) {
  if (!ddmmyyyy) return "";
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return ddmmyyyy;
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

// USER MANAGEMENT SYSTEM - Backend API Integration
const API_BASE = '';  // Same origin

async function isFirstUser() {
  try {
    const response = await fetch(`${API_BASE}/api/is-first-user`);
    const data = await response.json();
    return data.isFirstUser;
  } catch (err) {
    console.error("Error checking first user:", err);
    return false;
  }
}

async function getUserDirectory() {
  try {
    const response = await fetch(`${API_BASE}/api/users`);
    const data = await response.json();
    return data.success ? data.users : {};
  } catch (err) {
    console.error("Error fetching users:", err);
    return {};
  }
}

async function registerUser(username, password, role) {
  if (!username || !password || !role) {
    return { success: false, message: "All fields are required." };
  }

  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error registering user:", err);
    return { success: false, message: "Failed to register. Please try again." };
  }
}

async function authenticate(username, password) {
  try {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error authenticating:", err);
    return { success: false, message: "Failed to login. Please try again." };
  }
}

function saveSession(user) {
  localStorage.setItem("sessionUser", JSON.stringify(user));
}

function getCurrentUser() {
  const saved = localStorage.getItem("sessionUser");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (err) {
    console.warn("Unable to parse session", err);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("sessionUser");
}

// ADDED FOR ROLE-BASED ACCESS: logout helper
function logout() {
  clearSession();
  window.location.href = "/portal.html";
}

function navigateForRole(role) {
  const map = {
    Farmer: "/farmer.html",
    WarehouseWorker: "/warehouse.html",
    Retailer: "/retailer.html",
    Admin: "/admin.html",
  };
  const page = map[role] || "/portal.html";
  window.location.href = page;
}

function setVisibility(sectionId, visible) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.style.display = visible ? "block" : "none";
}

async function removeUser(username) {
  if (confirm(`Are you sure you want to remove user "${username}"?`)) {
    try {
      const response = await fetch(`${API_BASE}/api/users/${username}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await populateUserTable();
        await populatePendingTable();
        alert(`User "${username}" has been removed.`);
      } else {
        alert(`Failed to remove user: ${data.message}`);
      }
    } catch (err) {
      console.error("Error removing user:", err);
      alert("Failed to remove user. Please try again.");
    }
  }
}

async function populateUserTable() {
  const tableBody = document.querySelector("#userTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const directory = await getUserDirectory();
  const currentUser = getCurrentUser();

  const entries = Object.entries(directory).filter(([_, info]) => info.approved === true);

  if (entries.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="4" class="text-center text-muted">No approved users</td>';
    tableBody.appendChild(emptyRow);
    return;
  }

  entries.forEach(([username, info]) => {
    const tr = document.createElement("tr");

    // Username column
    const usernameTd = document.createElement("td");
    usernameTd.textContent = username;
    tr.appendChild(usernameTd);

    // Role column
    const roleTd = document.createElement("td");
    roleTd.textContent = info.role;
    tr.appendChild(roleTd);

    // Update Role column with dropdown
    const updateRoleTd = document.createElement("td");
    const roleSelect = document.createElement("select");
    roleSelect.className = "form-select form-select-sm";
    ["Farmer", "WarehouseWorker", "Retailer", "Admin"].forEach((role) => {
      const opt = document.createElement("option");
      opt.value = role;
      opt.textContent = role === "WarehouseWorker" ? "Warehouse Worker" : role;
      if (role === info.role) opt.selected = true;
      roleSelect.appendChild(opt);
    });
    roleSelect.addEventListener("change", async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users/${username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: roleSelect.value })
        });
        const data = await response.json();
        if (data.success) {
          populateUserTable();
          alert(`Role for ${username} updated to ${roleSelect.value}`);
        } else {
          alert(`Failed to update role: ${data.message}`);
        }
      } catch (err) {
        console.error("Error updating role:", err);
        alert("Failed to update role. Please try again.");
      }
    });
    updateRoleTd.appendChild(roleSelect);
    tr.appendChild(updateRoleTd);

    // Actions column
    const actionsTd = document.createElement("td");
    // Prevent removing yourself
    if (currentUser && currentUser.username !== username) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-sm btn-danger";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => removeUser(username));
      actionsTd.appendChild(removeBtn);
    } else {
      actionsTd.innerHTML = '<span class="text-muted small">(You)</span>';
    }
    tr.appendChild(actionsTd);

    tableBody.appendChild(tr);
  });
}

async function populatePendingTable() {
  const tableBody = document.querySelector("#pendingUserTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const directory = await getUserDirectory();
  const pendingEntries = Object.entries(directory).filter(
    ([_, info]) => info.approved === false
  );

  if (pendingEntries.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="3" class="text-center text-muted">No pending requests</td>';
    tableBody.appendChild(emptyRow);
    return;
  }

  pendingEntries.forEach(([username, info]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${username}</td><td>${info.role}</td>`;
    const actionTd = document.createElement("td");

    // Approve button
    const approveBtn = document.createElement("button");
    approveBtn.className = "btn btn-sm btn-success me-2";
    approveBtn.textContent = "Approve";
    approveBtn.addEventListener("click", async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users/${username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true })
        });
        const data = await response.json();
        if (data.success) {
          populatePendingTable();
          populateUserTable();
          alert(`User "${username}" has been approved.`);
        } else {
          alert(`Failed to approve user: ${data.message}`);
        }
      } catch (err) {
        console.error("Error approving user:", err);
        alert("Failed to approve user. Please try again.");
      }
    });

    // Reject button
    const rejectBtn = document.createElement("button");
    rejectBtn.className = "btn btn-sm btn-danger";
    rejectBtn.textContent = "Reject";
    rejectBtn.addEventListener("click", async () => {
      if (confirm(`Reject user "${username}"? This will delete their account request.`)) {
        try {
          const response = await fetch(`${API_BASE}/api/users/${username}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            populatePendingTable();
            alert(`User "${username}" has been rejected and removed.`);
          } else {
            alert(`Failed to reject user: ${data.message}`);
          }
        } catch (err) {
          console.error("Error rejecting user:", err);
          alert("Failed to reject user. Please try again.");
        }
      }
    });

    actionTd.appendChild(approveBtn);
    actionTd.appendChild(rejectBtn);
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  });
}

// OLD ROUTING FUNCTION - NO LONGER NEEDED (using separate HTML files now)
// function renderRoute() {
//   ... (disabled)
// }

function prepareFarmerForm() {
  // Show the next available product ID (without incrementing yet)
  let productCounter = localStorage.getItem("productCounter")
    ? parseInt(localStorage.getItem("productCounter"))
    : 0;
  const nextId = "P" + String(productCounter + 1).padStart(4, "0");
  const pidField = document.getElementById("pid");
  if (pidField) {
    pidField.value = nextId;
    pidField.readOnly = true;
  }

  const harvestDateField = document.getElementById("pdate");
  if (harvestDateField && !harvestDateField.value) {
    harvestDateField.value = formatDateToDDMMYYYY(new Date());
  }
}

function setupLogin() {
  const form = document.getElementById("loginForm");
  const statusEl = document.getElementById("loginStatus");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const result = await authenticate(username, password);
    if (!result.success) {
      statusEl.textContent = result.message;
      statusEl.classList.remove("text-success");
      statusEl.classList.add("text-danger");
      return;
    }
    statusEl.textContent = "";
    saveSession(result.user);
    navigateForRole(result.user.role);
  });
}

function setupSignup() {
  const form = document.getElementById("signupForm");
  const statusEl = document.getElementById("signupStatus");
  const firstUserNotice = document.getElementById("firstUserNotice");

  if (!form) return;

  // Show first user notice if no users exist
  async function updateFirstUserNotice() {
    if (firstUserNotice) {
      const first = await isFirstUser();
      firstUserNotice.style.display = first ? "block" : "none";
    }
  }

  updateFirstUserNotice();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("signupRole").value;
    const result = await registerUser(username, password, role);

    statusEl.textContent = result.message;
    statusEl.classList.remove("text-danger", "text-success");
    statusEl.classList.add(result.success ? "text-success" : "text-danger");

    if (result.success) {
      form.reset();
      updateFirstUserNotice();

      // If first user (auto-approved admin), show login prompt
      if (result.autoApproved) {
        setTimeout(() => {
          statusEl.textContent = "Please login with your credentials.";
        }, 2000);
      }
    }
  });
}

// Removed old routing - now using separate HTML pages
// window.addEventListener("popstate", renderRoute);

// Initialize UI
window.addEventListener("DOMContentLoaded", () => {
  setupLogin();
  setupSignup();
  renderMyQrListForCurrentPage();
  // renderRoute(); // Disabled - using separate pages now
  // Print QR Code
  const printButton = document.getElementById("printQR");
  if (printButton) {
    printButton.addEventListener("click", function() {
      const qrCanvas = document.querySelector("#qrcode canvas");
      if (!qrCanvas) {
        alert("No QR code available to print.");
        return;
      }

      const qrImage = qrCanvas.toDataURL("image/png");
      const newWindow = window.open("", "", "width=400,height=400");
      newWindow.document.write(`
        <html><head><title>Print QR Code</title></head>
        <body style="text-align:center; font-family:Arial;">
          <h3>Product QR Code</h3>
          <img src="${qrImage}" alt="QR Code"><br>
          <button onclick="window.print()">Print</button>
        </body></html>
      `);
      newWindow.document.close();
    });
  }
});
