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
  // Ensure ethers.js is available from the CDN script or load it lazily.
  const ethersLib = await ensureEthersLoaded().catch((err) => {
    console.error("ethers load error", err);
    alert("❌ Ethers.js failed to load. Please check your connection and refresh the page.");
    return null;
  });
  if (!ethersLib) {
    throw new Error("ethers.js not available on window");
  }

  const provider = window.ethereum
    ? new ethersLib.providers.Web3Provider(window.ethereum)
    : new ethersLib.providers.JsonRpcProvider("http://127.0.0.1:8545");

  return new ethersLib.Contract(contractAddress, contractABI, provider);
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
  const date = document.getElementById("pdate").value.trim();
  const producer = document.getElementById("pproducer").value.trim();

  if (!id || !name || !origin || !date || !producer) {
    alert("⚠️ Please fill in all fields.");
    return;
  }

  const contract = await getContract();
  const tx = await contract.createProduct(id, name, origin, date, producer);
  await tx.wait();

  alert("✅ Product added successfully!");
  QRCode.toCanvas(document.getElementById("qrcode"), id);
  return true;
  } catch (err) {
    console.error("❌ Error in createProduct:", err);
    alert("❌ Failed to add product. Open browser console (F12 → Console) to see details.");
    return false;
  }
}

// ---------- UPDATE PRODUCT ----------
// ADDED FOR ROLE-BASED ACCESS: split update handlers so each role reads its own form fields
async function updateProductFromFields(fieldMap, allowedRoles) {
  if (!checkRole(allowedRoles)) return;

  const id = document.getElementById(fieldMap.id)?.value.trim();
  const participant = document.getElementById(fieldMap.participant)?.value.trim();
  const event = document.getElementById(fieldMap.event)?.value.trim();
  const date = document.getElementById(fieldMap.date)?.value.trim();

  if (!id || !participant || !event || !date) {
    alert("⚠️ Please fill in all fields.");
    return;
  }

  const contract = await getContract();
  const tx = await contract.updateProduct(id, participant, event, date);
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
  if (!id) {
    alert("⚠️ Enter a product ID first.");
    return;
  }

  try{
  const contract = await getContract();
  const history = await contract.getHistory(id);

    let text = "";
    history.forEach((h) => {
      text += `${h.participant} → ${h.eventType} on ${h.date}\n`;
    });

  document.getElementById("output").textContent =
    text || "No history found for this ID.";
    document.getElementById("output").textContent =
      text || "No history found for this ID.";
  } catch (err) {
    console.error("❌ Error fetching history:", err);
    alert(
      "❌ Unable to read product history. Check that ethers.js loaded, the contract is deployed on the selected network, and the product ID exists."
    );
  }
}

// ADDED FOR ROLE-BASED ACCESS: admin history helper
async function adminGetHistory() {
  const id = document.getElementById("adminTraceId").value.trim();
  if (!id) {
    alert("⚠️ Enter a product ID first.");
    return;
  }
  try {
    const contract = await getContract();
    const history = await contract.getHistory(id);
    let text = "";
    history.forEach((h) => {
      text += `${h.participant} → ${h.eventType} on ${h.date}\n`;
    });
    document.getElementById("adminOutput").textContent = text || "No history found for this ID.";
  } catch (err) {
    console.error("❌ Error fetching admin history:", err);
    alert("❌ Unable to load history for admin view.");
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
        text += `${h.participant} → ${h.eventType} on ${h.date}\n`;
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
// Function to create QR only
async function generateQR() {
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
    const canvas = document.createElement("canvas");
    qrContainer.appendChild(canvas);

    const readableDate = formatDateString(pdate) || pdate;
    const qrText = `Product ID: ${pid}\nName: ${pname}\nOrigin: ${porigin}\nHarvest Date: ${readableDate}\nProducer: ${pproducer}`;
    await QRCode.toCanvas(canvas, qrText);
    document.getElementById("printQR").style.display = "inline-block";
  } catch (err) {
    console.error("QR generation error:", err);
    alert("Could not generate QR code.");
  }
}

// Combined function → runs MetaMask logic from app.js + QR generator
async function addProduct() {
  let created = false;
  try {
    // Call blockchain createProduct() from app.js (MetaMask)
    if (typeof createProduct === "function") {
      created = await createProduct();
    } else {
      console.warn("createProduct() not found in app.js");
    }
  } catch (err) {
    console.error("Blockchain error:", err);
  }

  // Only generate QR code when product creation succeeds
  if (created) {
    await generateQR();
  }
}

function formatDateString(dateValue) {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime())
    ? dateValue
    : parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
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

function renderRoute() {
  const path = window.location.pathname;
  const session = getCurrentUser();
  const publicMatch = path.match(/^\/(trace|product)\/([^/]+)/i);

  // reset all sections
    [
    "loginSection",
    "signupSection",
    "publicOverview",
    "farmerSection",
    "warehouseSection",
    "retailerSection",
    "adminSection",
    "consumerSection",
  ].forEach((id) => setVisibility(id, false));

  if (publicMatch) {
    setVisibility("consumerSection", true);
    const batchId = decodeURIComponent(publicMatch[2]);
    const field = document.getElementById("publicTraceId");
    if (field) {
      field.value = batchId;
    }
    publicGetHistory();
    return;
  }

  if (!session) {
    window.history.replaceState({}, "", "/");
    setVisibility("loginSection", true);
    setVisibility("signupSection", true);
    setVisibility("publicOverview", true);
    setVisibility("consumerSection", true);
    return;
  }

  const roleRoutes = {
    "/farmer": "Farmer",
    "/warehouse": "WarehouseWorker",
    "/retailer": "Retailer",
    "/admin": "Admin",
  };

  const requiredRole = roleRoutes[path];
  if (!requiredRole) {
    // default redirect to their dashboard
    navigateForRole(session.role);
    return;
  }

  if (session.role !== requiredRole) {
    alert("🚫 Forbidden: This route is not available for your role.");
    navigateForRole(session.role);
    return;
  }

  // show appropriate section
  switch (session.role) {
    case "Farmer":
      setVisibility("farmerSection", true);
      setVisibility("loginSection", false);
      prepareFarmerForm();
      break;
    case "WarehouseWorker":
      setVisibility("warehouseSection", true);
      setVisibility("loginSection", false);
      break;
    case "Retailer":
      setVisibility("retailerSection", true);
      setVisibility("loginSection", false);
      break;
    case "Admin":
      setVisibility("adminSection", true);
      setVisibility("loginSection", false);
      populateUserTable();
      populatePendingTable();
      break;
    default:
      setVisibility("loginSection", true);
  }
}

function prepareFarmerForm() {
  // Persistent product ID counter
  let productCounter = localStorage.getItem("productCounter")
    ? parseInt(localStorage.getItem("productCounter"))
    : 0;
  productCounter++;
  const newId = "P" + String(productCounter).padStart(4, "0");
  const pidField = document.getElementById("pid");
  if (pidField) {
    pidField.value = newId;
    pidField.readOnly = true;
  }
  localStorage.setItem("productCounter", productCounter);
  const harvestDateField = document.getElementById("pdate");
  if (harvestDateField && !harvestDateField.value) {
    harvestDateField.value = new Date().toISOString().split("T")[0];
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

window.addEventListener("popstate", renderRoute);

// Initialize UI
window.addEventListener("DOMContentLoaded", () => {
  setupLogin();
  setupSignup();
  renderRoute();
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
