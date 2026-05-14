const CART_STORAGE_KEY = "eurocoCart";

const calculatorItems = document.querySelectorAll(".calculator > .calculator-grid > .calculator-item");
const calculateButton = document.getElementById("calculateTotal");
const addCustomToCartButton = document.getElementById("addCustomToCart");
const clearButton = document.getElementById("clearCalculator");
const result = document.getElementById("calculatorResult");
const mysteryItems = document.querySelectorAll(".mystery-item");
const calculateMysteryButton = document.getElementById("calculateMysteryTotal");
const addMysteryToCartButton = document.getElementById("addMysteryToCart");
const clearMysteryButton = document.getElementById("clearMysteryCalculator");
const mysteryResult = document.getElementById("mysteryCalculatorResult");
const cartCount = document.getElementById("cartCount");

function getStoredCart() {
  return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getStoredCart();
  cartCount.textContent = cart.length;
}

function cleanQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
}

function cleanMysteryQuantity(value) {
  return Math.min(cleanQuantity(value), 3);
}

function getTiers(item) {
  return item.dataset.tiers
    .split(",")
    .map((tier) => {
      const [minimumQuantity, price] = tier.split(":").map(Number);
      return { minimumQuantity, price };
    })
    .sort((firstTier, secondTier) => firstTier.minimumQuantity - secondTier.minimumQuantity);
}

function getPriceForQuantity(item, quantity) {
  const tiers = getTiers(item);
  let selectedPrice = tiers[0].price;

  tiers.forEach((tier) => {
    if (quantity >= tier.minimumQuantity) {
      selectedPrice = tier.price;
    }
  });

  return selectedPrice;
}

function getMysteryPrices(item) {
  return item.dataset.prices.split(",").reduce((prices, priceGroup) => {
    const [quantity, price] = priceGroup.split(":").map(Number);
    prices[quantity] = price;
    return prices;
  }, {});
}

function getCustomBouquetSelection() {
  let total = 0;
  const details = [];
  const rows = [];

  calculatorItems.forEach((item) => {
    const input = item.querySelector(".quantity-input");
    const quantity = cleanQuantity(input.value);

    input.value = quantity;

    if (quantity === 0) {
      return;
    }

    const price = getPriceForQuantity(item, quantity);
    const itemTotal = price * quantity;

    total += itemTotal;
    details.push(`${item.dataset.name}: ${quantity} x $${price} = $${itemTotal}`);
    rows.push({
      description: item.dataset.name,
      quantity,
      price: `$${price}`,
      subtotal: `$${itemTotal}`,
    });
  });

  return {
    title: "Custom Bouquet",
    details,
    rows,
    total,
  };
}

function getMysteryBouquetSelection() {
  let total = 0;
  const details = [];
  const rows = [];

  mysteryItems.forEach((item) => {
    const input = item.querySelector(".mystery-quantity-input");
    const quantity = cleanMysteryQuantity(input.value);

    input.value = quantity;

    if (quantity === 0) {
      return;
    }

    const prices = getMysteryPrices(item);
    const itemTotal = prices[quantity];

    total += itemTotal;
    details.push(`${item.dataset.name}: ${quantity} for $${itemTotal}`);
    rows.push({
      description: item.dataset.name,
      quantity,
      price: `$${itemTotal}`,
      subtotal: `$${itemTotal}`,
    });
  });

  return {
    title: "Mystery Bouquet",
    details,
    rows,
    total,
  };
}

function updateCustomResult() {
  const selection = getCustomBouquetSelection();

  if (selection.details.length === 0) {
    result.textContent = "Estimated total: $0";
    return selection;
  }

  result.textContent = `Estimated total: $${selection.total}\n${selection.details.join("\n")}`;
  return selection;
}

function updateMysteryResult() {
  const selection = getMysteryBouquetSelection();

  if (selection.details.length === 0) {
    mysteryResult.textContent = "Mystery bouquet total: $0";
    return selection;
  }

  mysteryResult.textContent = `Mystery bouquet total: $${selection.total}\n${selection.details.join("\n")}`;
  return selection;
}

function addSelectionToCart(selection) {
  if (selection.details.length === 0) {
    return;
  }

  const cart = getStoredCart();

  cart.push({
    ...selection,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  });

  saveCart(cart);
  updateCartCount();
}

document.querySelectorAll(".quantity-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".calculator-item");
    const input = item.querySelector(".quantity-input");
    const isMysteryItem = item.classList.contains("mystery-item");
    const currentValue = isMysteryItem ? cleanMysteryQuantity(input.value) : cleanQuantity(input.value);
    const maximumValue = isMysteryItem ? 3 : Number.POSITIVE_INFINITY;

    if (button.dataset.action === "increase") {
      input.value = Math.min(currentValue + 1, maximumValue);
    } else {
      input.value = Math.max(currentValue - 1, 0);
    }
  });
});

calculateButton.addEventListener("click", updateCustomResult);

addCustomToCartButton.addEventListener("click", () => {
  addSelectionToCart(updateCustomResult());
});

clearButton.addEventListener("click", () => {
  calculatorItems.forEach((item) => {
    item.querySelector(".quantity-input").value = 0;
  });

  result.textContent = "Estimated total: $0";
});

calculateMysteryButton.addEventListener("click", updateMysteryResult);

addMysteryToCartButton.addEventListener("click", () => {
  addSelectionToCart(updateMysteryResult());
});

clearMysteryButton.addEventListener("click", () => {
  mysteryItems.forEach((item) => {
    item.querySelector(".mystery-quantity-input").value = 0;
  });

  mysteryResult.textContent = "Mystery bouquet total: $0";
});

updateCartCount();
