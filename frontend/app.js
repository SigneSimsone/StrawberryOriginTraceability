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

// ---------- CREATE PRODUCT ----------
async function createProduct() {
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
  } catch (err) {
    console.error("❌ Error in createProduct:", err);
    alert("❌ Failed to add product. Open browser console (F12 → Console) to see details.");
  }
}

// ---------- UPDATE PRODUCT ----------
async function updateProduct() {
  const id = document.getElementById("upid").value.trim();
  const participant = document.getElementById("uparticipant").value.trim();
  const event = document.getElementById("uevent").value.trim();
  const date = document.getElementById("udate").value.trim();

  if (!id || !participant || !event || !date) {
    alert("⚠️ Please fill in all fields.");
    return;
  }

  const contract = await getContract();
  const tx = await contract.updateProduct(id, participant, event, date);
  await tx.wait();

  alert("✅ Product updated successfully!");
}

// ---------- GET PRODUCT HISTORY ----------
async function getHistory() {
  const id = document.getElementById("gid").value.trim();
  if (!id) {
    alert("⚠️ Enter a product ID first.");
    return;
  }

  const contract = await getContract();
  const history = await contract.getHistory(id);

  let text = "";
  history.forEach((h) => {
    text += `${h.participant} → ${h.eventType} on ${h.date}\n`;
  });

  document.getElementById("output").textContent =
    text || "No history found for this ID.";
}