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

async function renderMyQrListForCurrentPage(searchProductId = null) {
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

  // If searching for a specific product, filter to only that one
  if (searchProductId) {
    if (!productIds.includes(searchProductId)) {
      container.innerHTML = "<p class='text-danger'>Product ID not found or you don't have access to it.</p>";
      return;
    }
    productIds = [searchProductId];
  } else if (page.endsWith("farmer.html") || page.endsWith("warehouse.html") || page.endsWith("retailer.html")) {
    // For farmer, warehouse, and retailer pages, don't show anything until they search
    container.innerHTML = "<p class='text-muted'>Enter a Product ID above to view its details and QR code.</p>";
    return;
  }

  if (productIds.length === 0) {
    container.innerHTML = "<p class='text-muted'>No products found yet.</p>";
    return;
  }

  container.innerHTML = "";

  for (const id of productIds) {
  const url = buildConsumerUrl(id);

  const qrCanvasId = `myqr-${id}`;
  const historyDivId = `hist-${id}`;

  // Check if user can see QR code
  const canViewQR = session.role === 'Farmer' || session.role === 'Admin' ||
                    session.printRequests?.find(r => r.productId === id && r.status === 'approved');

  const card = document.createElement("div");
  card.className = "card shadow-sm mb-3";

  if (canViewQR) {
    // Show full card with QR code
    card.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-3 align-items-start">
          <div class="col-md-8">
            <div><strong>Product ID:</strong> ${id}</div>

            <div class="mt-1">
              <strong>Verification link:</strong>
              <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
            </div>

            <div class="mt-3">
              <strong>Updates:</strong>
              <div id="${historyDivId}" class="product-timeline mt-2"></div>
            </div>
          </div>

          <div class="col-md-4 text-center">
            <canvas id="${qrCanvasId}"></canvas>
            <div class="small text-muted mt-2">Scan to verify</div>

            <button class="btn btn-secondary btn-sm mt-2 w-100" type="button">
              Print QR
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Show card without QR code but with verification link
    card.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-3">
          <div class="col-md-8">
            <div><strong>Product ID:</strong> ${id}</div>

            <div class="mt-1">
              <strong>Verification link:</strong>
              <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
            </div>

            <div class="mt-3">
              <strong>Updates:</strong>
              <div id="${historyDivId}" class="product-timeline mt-2"></div>
            </div>
          </div>

          <div class="col-md-4 text-center d-flex flex-column justify-content-center">
            <div class="border rounded p-4 mb-3 bg-light">
              <i class="text-muted">🔒</i>
              <div class="small text-muted mt-2">QR code hidden</div>
              <div class="small text-muted">Request approval to print</div>
            </div>

            <button class="btn btn-secondary btn-sm w-100" type="button">
              Request to Print
            </button>
          </div>
        </div>
      </div>
    `;
  }

  container.appendChild(card);

  // Draw QR only if user can view it
  if (canViewQR && window.QRCode?.toCanvas) {
    const canvas = document.getElementById(qrCanvasId);
    await QRCode.toCanvas(canvas, url, { width: 140, margin: 1 });
  }

  // Print button - check if user has permission for this specific product
  const btn = card.querySelector("button.btn.btn-secondary");
  if (btn) {
    if (canViewQR) {
      // User has permission - show print button
      btn.addEventListener("click", () => printQrCanvas(qrCanvasId, `QR Code - ${id}`));
    } else {
      // User doesn't have permission - check request status
      const printRequest = session.printRequests?.find(r => r.productId === id);

      if (printRequest && printRequest.status === 'pending') {
        // Request pending
        btn.outerHTML = '<div class="alert alert-info small mb-0 mt-2 text-center">⏳ Request pending approval</div>';
      } else if (printRequest && printRequest.status === 'denied') {
        // Request denied
        btn.outerHTML = '<div class="alert alert-danger small mb-0 mt-2 text-center">❌ Request denied<br><button class="btn btn-outline-secondary btn-sm mt-2 w-100" onclick="requestPrintPermission(\'' + id + '\')">Request Again</button></div>';
      } else {
        // No request yet - allow user to request
        btn.addEventListener("click", () => requestPrintPermission(id));
      }
    }
  }

  // Load and render full history inline
  const histEl = document.getElementById(historyDivId);
  try {
    const history = await contract.getHistory(id);

    if (!history || history.length === 0) {
      histEl.innerHTML = "<span class='text-muted'>No history.</span>";
      continue;
    }

    // Get producer information
    let producer = "";
    try {
      producer = await contract.getProducer(id);
    } catch (e) {
      console.warn("Could not fetch producer for", id);
    }

    // Try to find product creation details from ProductCreated events
    let productName = "";
    let productOrigin = "";
    let harvestDate = "";

    const productCreatedEvents = createdEvents.filter(e => e.args?.productId === id);
    if (productCreatedEvents.length > 0) {
      const createEvent = productCreatedEvents[0];
      // Try to get transaction details to extract name and origin
      try {
        const tx = await createEvent.getTransaction();
        if (tx && tx.data) {
          // Decode the transaction data to get the parameters
          const iface = new window.ethers.utils.Interface(contractABI);
          const decoded = iface.parseTransaction({ data: tx.data });
          if (decoded && decoded.args) {
            productName = decoded.args.name || "";
            productOrigin = decoded.args.origin || "";
            harvestDate = decoded.args.date || "";
          }
        }
      } catch (e) {
        console.warn("Could not decode transaction data for product creation", e);
      }
    }

    // Build timeline HTML with product header
    let html = "<div class='mb-3'>";
    html += `<div class='fw-bold mb-2'>Product: ${id}</div>`;
    if (productName) html += `<div class='small'><strong>Name:</strong> ${productName}</div>`;
    if (productOrigin) html += `<div class='small'><strong>Origin:</strong> ${productOrigin}</div>`;
    if (producer) {
      const isVerified = await isVerifiedProducer(producer);
      html += `<div class='small'><strong>Producer:</strong> ${producer}${isVerified ? getVerifiedBadgeHtml() : ''}</div>`;
    }
    if (harvestDate) {
      const formattedHarvestDate = (typeof formatDateString === "function")
        ? (formatDateString(harvestDate) || harvestDate)
        : harvestDate;
      html += `<div class='small'><strong>Harvest Date:</strong> ${formattedHarvestDate}</div>`;
    }
    html += "</div>";

    html += "<div class='border-top pt-2 mt-2'><strong>Timeline:</strong><br><br>";

    // Oldest -> newest
    for (const h of history) {
      const formattedDate = (typeof formatDateString === "function")
        ? (formatDateString(h.date) || h.date)
        : h.date;

      const ts = new Date(Number(h.timestamp) * 1000);
      const time = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      html += `• <strong>${h.participant}</strong> → ${h.eventType}<br>
               <span class="text-muted small">(${formattedDate} at ${time})</span><br><br>`;
    }
    html += "</div>";
    histEl.innerHTML = html;
  } catch (e) {
    console.error("Failed to load history for", id, e);
    histEl.innerHTML = "<span class='text-danger small'>Failed to load history.</span>";
  }
}

}

// Search for a specific product on the farmer page
async function searchMyProduct() {
  const searchInput = document.getElementById("searchProductId");
  if (!searchInput) return;

  const productId = searchInput.value.trim();
  if (!productId) {
    alert("⚠️ Please enter a Product ID to search.");
    return;
  }

  await renderMyQrListForCurrentPage(productId);
}

// Request print permission for a specific product
async function requestPrintPermission(productId) {
  const session = getCurrentUser();
  if (!session || !session.username) {
    alert("⚠️ You must be logged in to request print permission.");
    return;
  }

  // Ask for optional message
  const message = prompt(`Request permission to print QR code for product ${productId}\n\nOptional: Enter a message explaining why you need access (or leave blank):`);

  // If user clicked Cancel, don't proceed
  if (message === null) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/print-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: session.username,
        productId: productId,
        message: message.trim()
      })
    });

      const data = await response.json();

      if (data.success) {
        alert("✅ Print request submitted successfully!\n\nAn administrator will review your request.");

        // Update session with new or updated request
        if (!session.printRequests) session.printRequests = [];

        // Find existing request and update it, or add new one
        const existingRequest = session.printRequests.find(r => r.productId === productId);
        if (existingRequest) {
          existingRequest.status = 'pending';
          existingRequest.requestDate = new Date().toISOString();
          delete existingRequest.processedDate;
        } else {
          session.printRequests.push({
            productId,
            status: 'pending',
            requestDate: new Date().toISOString()
          });
        }

        saveSession(session);

        // Refresh the display
        await searchMyProduct();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (err) {
    console.error("Error requesting print permission:", err);
    alert("❌ Failed to submit print request. Please try again.");
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

    if (history && history.length > 0) {
      // Get producer information
      let producer = "";
      try {
        producer = await contract.getProducer(id);
      } catch (e) {
        console.warn("Could not fetch producer for", id);
      }

      // Read blockchain events to get product details
      const createdEvents = await contract.queryFilter("ProductCreated", 0, "latest");

      // Try to find product creation details from ProductCreated events
      let productName = "";
      let productOrigin = "";
      let harvestDate = "";

      const productCreatedEvents = createdEvents.filter(e => e.args?.productId === id);
      if (productCreatedEvents.length > 0) {
        const createEvent = productCreatedEvents[0];
        // Try to get transaction details to extract name and origin
        try {
          const tx = await createEvent.getTransaction();
          if (tx && tx.data) {
            // Decode the transaction data to get the parameters
            const iface = new window.ethers.utils.Interface(contractABI);
            const decoded = iface.parseTransaction({ data: tx.data });
            if (decoded && decoded.args) {
              productName = decoded.args.name || "";
              productOrigin = decoded.args.origin || "";
              harvestDate = decoded.args.date || "";
            }
          }
        } catch (e) {
          console.warn("Could not decode transaction data for product creation", e);
        }
      }

      // Build HTML with product header
      let html = "<div class='mb-3'>";
      html += `<div class='fw-bold mb-2' style='font-size: 1.1rem;'>Product: ${id}</div>`;
      if (productName) html += `<div class='mb-1'><strong>Name:</strong> ${productName}</div>`;
      if (productOrigin) html += `<div class='mb-1'><strong>Origin:</strong> ${productOrigin}</div>`;
      if (producer) {
        const isVerified = await isVerifiedProducer(producer);
        html += `<div class='mb-1'><strong>Producer:</strong> ${producer}${isVerified ? getVerifiedBadgeHtml() : ''}</div>`;
      }
      if (harvestDate) {
        const formattedHarvestDate = (typeof formatDateString === "function")
          ? (formatDateString(harvestDate) || harvestDate)
          : harvestDate;
        html += `<div class='mb-1'><strong>Harvest Date:</strong> ${formattedHarvestDate}</div>`;
      }
      html += "</div>";

      html += "<div class='border-top pt-3 mt-3'><strong>Product Journey:</strong><br><br>";

      // Display timeline
      history.forEach((h) => {
        const formattedDate = formatDateString(h.date) || h.date;
        const timestamp = new Date(h.timestamp * 1000);
        const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        html += `• <strong>${h.participant}</strong> → ${h.eventType}<br>
                 <span class="text-muted small">(${formattedDate} at ${time})</span><br><br>`;
      });
      html += "</div>";

      outputEl.innerHTML = html;
      outputEl.style.display = "block"; // Show the results
    } else {
      outputEl.innerHTML = "No history found for this ID.";
      outputEl.style.display = "block";
    }
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
      // Get producer information
      let producer = "";
      try {
        producer = await contract.getProducer(id);
      } catch (e) {
        console.warn("Could not fetch producer for", id);
      }

      // Read blockchain events to get product details
      const createdEvents = await contract.queryFilter("ProductCreated", 0, "latest");

      // Try to find product creation details from ProductCreated events
      let productName = "";
      let productOrigin = "";
      let harvestDate = "";

      const productCreatedEvents = createdEvents.filter(e => e.args?.productId === id);
      if (productCreatedEvents.length > 0) {
        const createEvent = productCreatedEvents[0];
        // Try to get transaction details to extract name and origin
        try {
          const tx = await createEvent.getTransaction();
          if (tx && tx.data) {
            // Decode the transaction data to get the parameters
            const iface = new window.ethers.utils.Interface(contractABI);
            const decoded = iface.parseTransaction({ data: tx.data });
            if (decoded && decoded.args) {
              productName = decoded.args.name || "";
              productOrigin = decoded.args.origin || "";
              harvestDate = decoded.args.date || "";
            }
          }
        } catch (e) {
          console.warn("Could not decode transaction data for product creation", e);
        }
      }

      // Build HTML with product header
      let html = "<div class='mb-3'>";
      html += `<div class='fw-bold mb-2' style='font-size: 1.1rem;'>Product: ${id}</div>`;
      if (productName) html += `<div class='mb-1'><strong>Name:</strong> ${productName}</div>`;
      if (productOrigin) html += `<div class='mb-1'><strong>Origin:</strong> ${productOrigin}</div>`;
      if (producer) {
        const isVerified = await isVerifiedProducer(producer);
        html += `<div class='mb-1'><strong>Producer:</strong> ${producer}${isVerified ? getVerifiedBadgeHtml() : ''}</div>`;
      }
      if (harvestDate) {
        const formattedHarvestDate = (typeof formatDateString === "function")
          ? (formatDateString(harvestDate) || harvestDate)
          : harvestDate;
        html += `<div class='mb-1'><strong>Harvest Date:</strong> ${formattedHarvestDate}</div>`;
      }
      html += "</div>";

      html += "<div class='border-top pt-3 mt-3'><strong>Product Journey:</strong><br><br>";

      // Display timeline
      history.forEach((h) => {
        const formattedDate = formatDateString(h.date) || h.date;
        const timestamp = new Date(h.timestamp * 1000);
        const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        html += `• <strong>${h.participant}</strong> → ${h.eventType}<br>
                 <span class="text-muted small">(${formattedDate} at ${time})</span><br><br>`;
      });
      html += "</div>";

      outputEl.innerHTML = html;
      if (resultsSection) resultsSection.style.display = "block";
    } else {
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

// Helper to check if a username is a verified producer (approved farmer)
async function isVerifiedProducer(username) {
  try {
    const users = await getUserDirectory();
    const user = users[username];
    return user && user.role === 'Farmer' && user.approved === true;
  } catch (err) {
    console.error("Error checking verified status:", err);
    return false;
  }
}

// Helper to get verified badge HTML
function getVerifiedBadgeHtml() {
  return '<img src="verified-badge.png" alt="Latvian Verified Producer" class="verified-producer-badge ms-1">';
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
    emptyRow.innerHTML = '<td colspan="5" class="text-center text-muted">No approved users</td>';
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

    // Verified Producer column
    const verifiedTd = document.createElement("td");
    if (info.role === 'Farmer' && info.approved) {
      verifiedTd.innerHTML = '<img src="verified-badge.png" alt="Latvian Verified" class="verified-producer-badge">';
    } else {
      verifiedTd.innerHTML = '<span class="text-muted small">—</span>';
    }
    tr.appendChild(verifiedTd);

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


async function populatePrintRequestTable() {
  const tableBody = document.querySelector("#printRequestTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE}/api/print-requests/all`);
    const data = await response.json();

    if (!data.success || data.requests.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = '<td colspan="7" class="text-center text-muted">No print requests</td>';
      tableBody.appendChild(emptyRow);
      return;
    }

    data.requests.forEach(request => {
      const tr = document.createElement("tr");

      // Username
      const usernameTd = document.createElement("td");
      usernameTd.textContent = request.username;
      tr.appendChild(usernameTd);

      // Role
      const roleTd = document.createElement("td");
      roleTd.textContent = request.role === "WarehouseWorker" ? "Warehouse Worker" : request.role;
      tr.appendChild(roleTd);

      // Product ID
      const productTd = document.createElement("td");
      productTd.textContent = request.productId;
      tr.appendChild(productTd);

      // Message
      const messageTd = document.createElement("td");
      messageTd.textContent = request.message || '(no message)';
      messageTd.className = request.message ? '' : 'text-muted fst-italic';
      tr.appendChild(messageTd);

      // Status
      const statusTd = document.createElement("td");
      const statusBadge = document.createElement("span");
      statusBadge.className = `badge ${
        request.status === 'approved' ? 'bg-success' :
        request.status === 'denied' ? 'bg-danger' :
        'bg-warning text-dark'
      }`;
      statusBadge.textContent = request.status.charAt(0).toUpperCase() + request.status.slice(1);
      statusTd.appendChild(statusBadge);
      tr.appendChild(statusTd);

      // Request Date
      const dateTd = document.createElement("td");
      const date = new Date(request.requestDate);
      dateTd.textContent = date.toLocaleString();
      tr.appendChild(dateTd);

      // Actions
      const actionsTd = document.createElement("td");

      if (request.status === 'pending') {
        // Pending: Show Approve and Deny buttons
        const approveBtn = document.createElement("button");
        approveBtn.className = "btn btn-sm btn-success me-2";
        approveBtn.textContent = "Approve";
        approveBtn.addEventListener("click", async () => {
          try {
            const response = await fetch(`${API_BASE}/api/print-request`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: request.username,
                productId: request.productId,
                status: 'approved'
              })
            });
            const data = await response.json();
            if (data.success) {
              alert(`✅ Print request approved for ${request.username} - ${request.productId}`);
              populatePrintRequestTable();
            } else {
              alert(`Failed to approve request: ${data.message}`);
            }
          } catch (err) {
            console.error("Error approving print request:", err);
            alert("Failed to approve request. Please try again.");
          }
        });

        const denyBtn = document.createElement("button");
        denyBtn.className = "btn btn-sm btn-danger";
        denyBtn.textContent = "Deny";
        denyBtn.addEventListener("click", async () => {
          if (confirm(`Deny print request for ${request.username} - ${request.productId}?`)) {
            try {
              const response = await fetch(`${API_BASE}/api/print-request`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: request.username,
                  productId: request.productId,
                  status: 'denied'
                })
              });
              const data = await response.json();
              if (data.success) {
                alert(`❌ Print request denied for ${request.username} - ${request.productId}`);
                populatePrintRequestTable();
              } else {
                alert(`Failed to deny request: ${data.message}`);
              }
            } catch (err) {
              console.error("Error denying print request:", err);
              alert("Failed to deny request. Please try again.");
            }
          }
        });

        actionsTd.appendChild(approveBtn);
        actionsTd.appendChild(denyBtn);
      } else if (request.status === 'approved') {
        // Approved: Show Revoke button
        const revokeBtn = document.createElement("button");
        revokeBtn.className = "btn btn-sm btn-warning";
        revokeBtn.textContent = "Revoke";
        revokeBtn.addEventListener("click", async () => {
          if (confirm(`Revoke print permission for ${request.username} - ${request.productId}?\n\nThis will prevent them from printing the QR code.`)) {
            try {
              const response = await fetch(`${API_BASE}/api/print-request`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: request.username,
                  productId: request.productId,
                  status: 'denied'
                })
              });
              const data = await response.json();
              if (data.success) {
                alert(`🔒 Print permission revoked for ${request.username} - ${request.productId}`);
                populatePrintRequestTable();
              } else {
                alert(`Failed to revoke permission: ${data.message}`);
              }
            } catch (err) {
              console.error("Error revoking permission:", err);
              alert("Failed to revoke permission. Please try again.");
            }
          }
        });
        actionsTd.appendChild(revokeBtn);
      } else if (request.status === 'denied') {
        // Denied: Show Approve button
        const approveBtn = document.createElement("button");
        approveBtn.className = "btn btn-sm btn-success";
        approveBtn.textContent = "Approve";
        approveBtn.addEventListener("click", async () => {
          try {
            const response = await fetch(`${API_BASE}/api/print-request`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: request.username,
                productId: request.productId,
                status: 'approved'
              })
            });
            const data = await response.json();
            if (data.success) {
              alert(`✅ Print request approved for ${request.username} - ${request.productId}`);
              populatePrintRequestTable();
            } else {
              alert(`Failed to approve request: ${data.message}`);
            }
          } catch (err) {
            console.error("Error approving request:", err);
            alert("Failed to approve request. Please try again.");
          }
        });
        actionsTd.appendChild(approveBtn);
      }

      tr.appendChild(actionsTd);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading print requests:", err);
    const errorRow = document.createElement("tr");
    errorRow.innerHTML = '<td colspan="7" class="text-center text-danger">Failed to load print requests</td>';
    tableBody.appendChild(errorRow);
  }
}

function printQrCanvas(canvasId, title = "Product QR Code") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    alert("No QR code available to print.");
    return;
  }
  const img = canvas.toDataURL("image/png");
  const w = window.open("", "", "width=450,height=520");
  w.document.write(`
    <html>
      <head><title>${title}</title></head>
      <body style="text-align:center;font-family:Arial;padding:20px;">
        <h3>${title}</h3>
        <img src="${img}" style="max-width:320px;" />
        <br><br>
        <button onclick="window.print()">Print</button>
      </body>
    </html>
  `);
  w.document.close();
}
