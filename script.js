const canvas = document.getElementById("flyerCanvas");
const ctx = canvas.getContext("2d");

const inputs = {
  brandName: document.getElementById("brandName"),
  copyOption: document.getElementById("copyOption"),
  investment: document.getElementById("investment"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),
  profitability: document.getElementById("profitability"),
  payback: document.getElementById("payback"),
  projectedRevenue: document.getElementById("projectedRevenue"),
  extraLabel: document.getElementById("extraLabel"),
  extraValue: document.getElementById("extraValue"),
  overlayColor: document.getElementById("overlayColor"),
  overlayOpacity: document.getElementById("overlayOpacity"),
  metricBoxColor: document.getElementById("metricBoxColor"),
  photoInput: document.getElementById("photoInput"),
  logoInput: document.getElementById("logoInput"),
  generatedCopy: document.getElementById("generatedCopy"),
};

let representativePhoto = null;
let brandLogo = null;

function loadImageFromInput(input, callback) {
  const file = input.files?.[0];
  if (!file) {
    callback(null);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => callback(image);
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawCoverImage(image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > boxRatio) {
    sourceWidth = image.height * boxRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / boxRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawContainImage(image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function readableTextColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#111111" : "#ffffff";
}

function fitFont(text, fontTemplate, maxWidth, startSize, minSize) {
  let size = startSize;
  do {
    ctx.font = fontTemplate.replace("{size}", size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 3;
  } while (size >= minSize);
  return minSize;
}

function wrapText(text, x, y, maxWidth, lineHeight, maxLines, align = "left") {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      line = testLine;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  const visibleLines = lines.slice(0, maxLines);

  visibleLines.forEach((visibleLine, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    const finalLine = `${visibleLine}${suffix}`;
    let drawX = x;
    if (align === "center") drawX = x + (maxWidth - ctx.measureText(finalLine).width) / 2;
    ctx.fillText(finalLine, drawX, y + index * lineHeight);
  });

  return visibleLines.length * lineHeight;
}

function drawPlaceholderPhoto() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#4a4943");
  gradient.addColorStop(0.5, "#242424");
  gradient.addColorStop(1, "#8b762f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function selectedCopy() {
  const [title, subtitle = ""] = inputs.copyOption.value.split("|");
  return { title, subtitle };
}

function getData() {
  const copy = selectedCopy();
  return {
    brandName: inputs.brandName.value.trim() || "Marca",
    title: copy.title,
    subtitle: copy.subtitle,
    investment: inputs.investment.value.trim() || "Consultar inversión",
    location: inputs.location.value.trim(),
    description: inputs.description.value.trim(),
    profitability: inputs.profitability.value.trim(),
    payback: inputs.payback.value.trim(),
    projectedRevenue: inputs.projectedRevenue.value.trim(),
    extraLabel: inputs.extraLabel.value.trim(),
    extraValue: inputs.extraValue.value.trim(),
    overlayColor: inputs.overlayColor.value,
    overlayOpacity: Number(inputs.overlayOpacity.value) / 100,
    metricBoxColor: inputs.metricBoxColor.value,
  };
}

function updateGeneratedCopy(data) {
  const detailLines = [
    data.description,
    `Inversión: ${data.investment}`,
    data.profitability && `Rentabilidad: ${data.profitability}`,
    data.payback && `Tiempo de recupero: ${data.payback}`,
    data.projectedRevenue && `Facturación proyectada: ${data.projectedRevenue}`,
    data.extraLabel && data.extraValue && `${data.extraLabel}: ${data.extraValue}`,
    data.location && `Ubicación: ${data.location}`,
    "Contactame para tener más información.",
  ].filter(Boolean);

  inputs.generatedCopy.value = [
    data.title,
    data.subtitle,
    "",
    ...detailLines,
  ].join("\n");
}

function drawLogoBlock(data) {
  const logoX = 190;
  const logoY = 150;
  const logoW = 700;
  const logoH = 235;

  if (brandLogo) {
    drawContainImage(brandLogo, logoX, logoY, logoW, logoH);
    return;
  }

  ctx.fillStyle = "#ffffff";
  const brandSize = fitFont(data.brandName, "900 {size}px Georgia", 700, 78, 46);
  ctx.font = `900 ${brandSize}px Georgia`;
  wrapText(data.brandName, 150, 270, 780, brandSize + 8, 2, "center");
}

function drawMetric(label, value, x, y, width, boxColor) {
  if (!value) return 0;

  ctx.fillStyle = boxColor;
  drawRoundedRect(x, y, width, 96, 16);
  ctx.fill();

  ctx.fillStyle = readableTextColor(boxColor);
  const labelSize = fitFont(label.toUpperCase(), "900 {size}px Arial", width - 48, 27, 19);
  ctx.font = `900 ${labelSize}px Arial`;
  wrapText(label.toUpperCase(), x + 24, y + 37, width - 48, 30, 1, "center");

  const valueSize = fitFont(value, "900 {size}px Arial", width - 72, 40, 28);
  ctx.font = `900 ${valueSize}px Arial`;
  wrapText(value, x + 36, y + 76, width - 72, 40, 1, "center");

  return 116;
}

function drawFlyer() {
  const data = getData();
  updateGeneratedCopy(data);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (representativePhoto) {
    drawCoverImage(representativePhoto, 0, 0, canvas.width, canvas.height);
  } else {
    drawPlaceholderPhoto();
  }

  const rgb = hexToRgb(data.overlayColor);
  ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${data.overlayOpacity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vignette.addColorStop(0, "rgba(0,0,0,0.32)");
  vignette.addColorStop(0.5, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawLogoBlock(data);

  ctx.fillStyle = "#ffffff";
  const titleSize = fitFont(data.title, "900 {size}px Arial", 820, 74, 48);
  ctx.font = `900 ${titleSize}px Arial`;
  let currentY = 523;
  currentY += wrapText(data.title, 130, currentY, 820, titleSize + 8, 2, "center");

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "700 38px Arial";
  currentY += 12;
  currentY += wrapText(data.subtitle, 150, currentY, 780, 48, 3, "center");

  if (data.description) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "400 32px Arial";
    currentY += 34;
    currentY += wrapText(data.description, 160, currentY, 760, 42, 3, "center");
  }

  const metrics = [
    ["Rentabilidad", data.profitability],
    ["Tiempo de recupero", data.payback],
    ["Facturación proyectada", data.projectedRevenue],
    [data.extraLabel || "Dato extra", data.extraValue],
  ].filter(([, value]) => value);

  currentY = Math.max(currentY + 56, metrics.length ? 900 : 1020);
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(210, currentY - 52);
  ctx.lineTo(870, currentY - 52);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 40px Arial";
  wrapText("INVERSIÓN", 190, currentY + 16, 700, 46, 1, "center");

  const investmentSize = fitFont(data.investment, "900 {size}px Arial", 900, 126, 70);
  ctx.font = `900 ${investmentSize}px Arial`;
  wrapText(data.investment, 90, currentY + 150, 900, investmentSize + 8, 1, "center");

  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(210, currentY + 246);
  ctx.lineTo(870, currentY + 246);
  ctx.stroke();

  const ctaY = 1768;
  const ctaHeight = 78;
  let contentBottom = currentY + 270;
  const metricStep = 112;
  let metricY = metrics.length >= 4 ? currentY + 282 : metrics.length >= 3 ? currentY + 306 : currentY + 326;
  if (metrics.length === 1) {
    drawMetric(metrics[0][0], metrics[0][1], 230, metricY, 620, data.metricBoxColor);
    contentBottom = metricY + 96;
  } else if (metrics.length > 1) {
    metrics.slice(0, 4).forEach(([label, value], index) => {
      drawMetric(label, value, 230, metricY + index * metricStep, 620, data.metricBoxColor);
    });
    contentBottom = metricY + (Math.min(metrics.length, 4) - 1) * metricStep + 96;
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px Arial";
  const locationY = data.location ? Math.min(Math.max(contentBottom + 96, metrics.length ? 1508 : 1420), ctaY - 92) : 0;
  if (data.location) {
    wrapText(data.location, 150, locationY, 780, 42, 2, "center");
  }

  ctx.fillStyle = data.metricBoxColor;
  drawRoundedRect(130, ctaY, 820, ctaHeight, 16);
  ctx.fill();
  ctx.fillStyle = readableTextColor(data.metricBoxColor);
  ctx.font = "900 28px Arial";
  wrapText("CONTACTAME PARA TENER MÁS INFORMACIÓN", 148, ctaY + 49, 784, 32, 1, "center");
}

function downloadFlyer(type) {
  drawFlyer();
  const link = document.createElement("a");
  const brand = (inputs.brandName.value.trim() || "flyer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.download = `${brand}-traspaso.${type === "jpeg" ? "jpg" : "png"}`;
  link.href = canvas.toDataURL(`image/${type}`, 0.94);
  link.click();
}

Object.values(inputs).forEach((input) => {
  if (!input || input.type === "file" || input.readOnly) return;
  input.addEventListener("input", drawFlyer);
  input.addEventListener("change", drawFlyer);
});

inputs.photoInput.addEventListener("change", () => {
  loadImageFromInput(inputs.photoInput, (image) => {
    representativePhoto = image;
    drawFlyer();
  });
});

inputs.logoInput.addEventListener("change", () => {
  loadImageFromInput(inputs.logoInput, (image) => {
    brandLogo = image;
    drawFlyer();
  });
});

document.getElementById("downloadPng").addEventListener("click", () => downloadFlyer("png"));
document.getElementById("downloadJpg").addEventListener("click", () => downloadFlyer("jpeg"));

drawFlyer();
