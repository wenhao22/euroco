const calculatorItems = document.querySelectorAll(".calculator > .calculator-grid > .calculator-item");
const calculateButton = document.getElementById("calculateTotal");
const clearButton = document.getElementById("clearCalculator");
const result = document.getElementById("calculatorResult");
const mysteryItems = document.querySelectorAll(".mystery-item");
const calculateMysteryButton = document.getElementById("calculateMysteryTotal");
const clearMysteryButton = document.getElementById("clearMysteryCalculator");
const mysteryResult = document.getElementById("mysteryCalculatorResult");

function cleanQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
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

function cleanMysteryQuantity(value) {
  return Math.min(cleanQuantity(value), 3);
}

function calculateTotal() {
  let total = 0;
  const selectedFlowers = [];

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
    selectedFlowers.push(`${item.dataset.name}: ${quantity} x $${price} = $${itemTotal}`);
  });

  if (selectedFlowers.length === 0) {
    result.textContent = "Estimated total: $0";
    return;
  }

  result.textContent = `Estimated total: $${total}\n${selectedFlowers.join("\n")}`;
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

calculateButton.addEventListener("click", calculateTotal);

clearButton.addEventListener("click", () => {
  calculatorItems.forEach((item) => {
    item.querySelector(".quantity-input").value = 0;
  });

  result.textContent = "Estimated total: $0";
});

calculateMysteryButton.addEventListener("click", () => {
  let total = 0;
  const selectedBouquets = [];

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
    selectedBouquets.push(`${item.dataset.name}: ${quantity} for $${itemTotal}`);
  });

  if (selectedBouquets.length === 0) {
    mysteryResult.textContent = "Mystery bouquet total: $0";
    return;
  }

  mysteryResult.textContent = `Mystery bouquet total: $${total}\n${selectedBouquets.join("\n")}`;
});

clearMysteryButton.addEventListener("click", () => {
  mysteryItems.forEach((item) => {
    item.querySelector(".mystery-quantity-input").value = 0;
  });

  mysteryResult.textContent = "Mystery bouquet total: $0";
});
