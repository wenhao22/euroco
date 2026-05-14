const CART_STORAGE_KEY = "eurocoCart";

const cartList = document.getElementById("cartList");
const cartEmpty = document.getElementById("cartEmpty");
const cartTotal = document.getElementById("cartTotal");
const confirmCartButton = document.getElementById("confirmCart");
const clearCartButton = document.getElementById("clearCart");
const orderModal = document.getElementById("orderModal");
const closeOrderModalButton = document.getElementById("closeOrderModal");
const orderSummary = document.getElementById("orderSummary");
const orderForm = document.getElementById("orderForm");
const formMessage = document.getElementById("formMessage");

let cart = getStoredCart();

function getStoredCart() {
  return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.total, 0);
}

function renderCart() {
  const total = getCartTotal();

  cartList.innerHTML = "";
  cartEmpty.style.display = cart.length === 0 ? "block" : "none";
  cartTotal.textContent = `Cart total: $${total}`;

  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    const itemDetails = document.createElement("div");
    itemDetails.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.details.join("\n")}\nSubtotal: $${item.total}</p>
    `;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      cart = cart.filter((cartEntry) => cartEntry.id !== item.id);
      saveCart();
      renderCart();
    });

    cartItem.append(itemDetails, removeButton);
    cartList.append(cartItem);
  });
}

function getCartSummary() {
  const total = getCartTotal();
  const lines = cart.flatMap((item) => [
    item.title,
    ...item.details,
    `Subtotal: $${item.total}`,
    "",
  ]);

  return `Order summary\n${lines.join("\n")}Total: $${total}`;
}

function openOrderModal() {
  if (cart.length === 0) {
    cartEmpty.textContent = "Please add at least one bouquet to your cart before confirming.";
    return;
  }

  formMessage.textContent = "";
  orderSummary.textContent = getCartSummary();
  orderModal.classList.add("open");
  orderModal.setAttribute("aria-hidden", "false");
  document.getElementById("customerName").focus();
}

function closeOrderModal() {
  orderModal.classList.remove("open");
  orderModal.setAttribute("aria-hidden", "true");
}

function formatDateForPdf(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

function getAllCartRows() {
  return cart.flatMap((item) => item.rows);
}

function drawWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function generateWishlistPdf(orderDetails) {
  if (!window.jspdf) {
    formMessage.textContent = "PDF library did not load. Please check your internet connection and try again.";
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const textColor = "#5f4444";
  const borderColor = "#7f5757";
  const backgroundColor = "#fff4ea";
  const rows = getAllCartRows();
  const total = getCartTotal();

  doc.setFillColor(backgroundColor);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor("#9b6267");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("WISHLIST", marginX, 34);

  doc.setTextColor(textColor);
  doc.setFontSize(11);
  doc.text(`Date Issued: ${orderDetails.dateIssued}`, marginX, 50);
  doc.text(`Name: ${orderDetails.name}`, marginX, 57);
  doc.text(`Contact Details: ${orderDetails.contact}`, marginX, 64);
  doc.text(`Preferred Date of Collection/Delivery: ${orderDetails.collectionDate}`, marginX, 71);
  doc.text(`Occasion (optional): ${orderDetails.occasion || "-"}`, marginX, 78);

  const summaryX = marginX;
  const summaryY = 90;
  const summaryWidth = 174;

  doc.setTextColor("#000000");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Bouquet Details", summaryX, summaryY);

  doc.setDrawColor(borderColor);
  doc.setLineWidth(0.35);
  doc.line(summaryX, summaryY + 4, summaryX + summaryWidth, summaryY + 4);

  doc.setTextColor("#2f2a25");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  let summaryTextY = summaryY + 13;

  rows.forEach((row, index) => {
    const line = `${index + 1}. ${row.description} - Qty: ${row.quantity} - Price: ${row.price} - Subtotal: ${row.subtotal}`;
    summaryTextY = drawWrappedText(doc, line, summaryX, summaryTextY, summaryWidth, 5);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`TOTAL AMOUNT: $${total}`, summaryX + summaryWidth, summaryTextY + 6, { align: "right" });

  doc.setTextColor(230, 215, 207);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bolditalic");
  doc.text("EuRo&Co", pageWidth / 2, 160, { align: "center" });

  doc.setTextColor("#000000");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  let contentY = 214;
  doc.text("How to Order", marginX, contentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  contentY += 7;

  [
    "1. Send this completed form to our Instagram DM (@bloomwith.euronco).",
    "2. Our team will review and confirm your order details with you.",
    "3. Once confirmed, a $20 non-refundable deposit is required to secure your order.",
    "4. Your bouquet will then be lovingly crafted for you.",
  ].forEach((step) => {
    contentY = drawWrappedText(doc, step, marginX + 4, contentY, 174, 5);
  });

  contentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Terms & Notes", marginX, contentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  contentY += 7;

  [
    "Submission of this wishlist does not confirm an order.",
    "All orders are only confirmed upon Instagram discussion and deposit payment.",
    "A $20 non-refundable deposit is required to proceed, which will be offset from the final amount.",
    "We will always communicate and confirm all details before crafting your bouquet.",
    "This wishlist is not automatically submitted and is meant to help you explore your preferences comfortably with our upfront pricing before reaching out to us.",
  ].forEach((term) => {
    doc.text("-", marginX + 2, contentY);
    contentY = drawWrappedText(doc, term, marginX + 8, contentY, 168, 5);
  });

  doc.setDrawColor(185, 165, 165);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 52, 0, pageWidth - 16, 42);
  doc.line(pageWidth - 45, 0, pageWidth - 8, 58);
  doc.line(0, pageHeight - 38, 38, pageHeight);
  doc.line(0, pageHeight - 18, 26, pageHeight);

  const cleanName = orderDetails.name.trim().replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`euroco-wishlist-${cleanName || "order"}.pdf`);
}

confirmCartButton.addEventListener("click", openOrderModal);

clearCartButton.addEventListener("click", () => {
  cart = [];
  saveCart();
  cartEmpty.textContent = "Your cart is empty.";
  renderCart();
});

closeOrderModalButton.addEventListener("click", closeOrderModal);

orderModal.addEventListener("click", (event) => {
  if (event.target === orderModal) {
    closeOrderModal();
  }
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const orderDetails = {
    dateIssued: new Date().toLocaleDateString("en-SG"),
    name: document.getElementById("customerName").value.trim(),
    contact: document.getElementById("contactDetails").value.trim(),
    collectionDate: formatDateForPdf(document.getElementById("collectionDate").value),
    occasion: document.getElementById("occasion").value.trim(),
  };

  generateWishlistPdf(orderDetails);
  formMessage.textContent = "PDF exported. Send the downloaded wishlist to Euroco on Instagram.";
});

renderCart();
