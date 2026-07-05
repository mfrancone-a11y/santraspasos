const canvas = document.getElementById("flyerCanvas");
const ctx = canvas.getContext("2d");
const TITLE_FONT = "Geist, Inter, Arial, sans-serif";
const TEXT_FONT = "Inter, Arial, sans-serif";

const inputs = {
  brandName: document.getElementById("brandName"),
  copyOption: document.getElementById("copyOption"),
  investment: document.getElementById("investment"),
  location: document.getElementById("location"),
  profitability: document.getElementById("profitability"),
  payback: document.getElementById("payback"),
  projectedRevenue: document.getElementById("projectedRevenue"),
  extraLabel: document.getElementById("extraLabel"),
  extraValue: document.getElementById("extraValue"),
  overlayColor: document.getElementById("overlayColor"),
  overlayOpacity: document.getElementById("overlayOpacity"),
  metricBoxColor: document.getElementById("metricBoxColor"),
  localFrameColor: document.getElementById("localFrameColor"),
  textColor: document.getElementById("textColor"),
  photoInput: document.getElementById("photoInput"),
  logoInput: document.getElementById("logoInput"),
  localPhotoInput: document.getElementById("localPhotoInput"),
  secondaryLocalPhotoInput: document.getElementById("secondaryLocalPhotoInput"),
  generatedCopy: document.getElementById("generatedCopy"),
};

let representativePhoto = null;
let brandLogo = null;
let localPhoto = null;
let secondaryLocalPhoto = null;

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

function colorWithAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
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
    profitability: inputs.profitability.value.trim(),
    payback: inputs.payback.value.trim(),
    projectedRevenue: inputs.projectedRevenue.value.trim(),
    extraLabel: inputs.extraLabel.value.trim(),
    extraValue: inputs.extraValue.value.trim(),
    overlayColor: inputs.overlayColor.value,
    overlayOpacity: Number(inputs.overlayOpacity.value) / 100,
    metricBoxColor: inputs.metricBoxColor.value,
    localFrameColor: inputs.localFrameColor.value,
    textColor: inputs.textColor.value,
  };
}

function updateGeneratedCopy(data) {
  const detailLines = [
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
  const logoX = 260;
  const logoY = 56;
  const logoW = 560;
  const logoH = 180;

  if (brandLogo) {
    drawContainImage(brandLogo, logoX, logoY, logoW, logoH);
    return;
  }

  ctx.fillStyle = data.textColor;
  const brandSize = fitFont(data.brandName, `800 {size}px ${TITLE_FONT}`, 680, 84, 48);
  ctx.font = `800 ${brandSize}px ${TITLE_FONT}`;
  wrapText(data.brandName, 220, 170, 640, brandSize + 8, 2, "center");
}

function drawMetric(label, value, x, y, width, boxColor, height = 108) {
  if (!value) return 0;

  ctx.fillStyle = boxColor;
  drawRoundedRect(x, y, width, height, 14);
  ctx.fill();

  ctx.fillStyle = readableTextColor(boxColor);
  const labelSize = fitFont(label, `800 {size}px ${TEXT_FONT}`, width - 48, 32, 20);
  ctx.font = `800 ${labelSize}px ${TEXT_FONT}`;
  wrapText(label, x + 24, y + 42, width - 48, 34, 1, "center");

  const valueSize = fitFont(value, `800 {size}px ${TEXT_FONT}`, width - 72, 44, 30);
  ctx.font = `800 ${valueSize}px ${TEXT_FONT}`;
  wrapText(value, x + 36, y + 84, width - 72, 44, 1, "center");

  return height;
}

function drawLocalPhotoCard(data, frameY, image = localPhoto, side = "right") {
  const frameW = 334;
  const frameH = 452;
  const frameX = side === "left" ? 94 : 652;
  const angle = (side === "left" ? 4 : -4) * Math.PI / 180;

  ctx.save();
  ctx.translate(frameX + frameW / 2, frameY + frameH / 2);
  ctx.rotate(angle);

  ctx.fillStyle = data.localFrameColor;
  ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);

  const inset = 12;
  ctx.fillStyle = "#b3aaa8";
  ctx.fillRect(-frameW / 2 + inset, -frameH / 2 + inset, frameW - inset * 2, frameH - inset * 2);

  if (image) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-frameW / 2 + inset, -frameH / 2 + inset, frameW - inset * 2, frameH - inset * 2);
    ctx.clip();
    drawCoverImage(image, -frameW / 2 + inset, -frameH / 2 + inset, frameW - inset * 2, frameH - inset * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#111111";
    ctx.font = `400 46px ${TEXT_FONT}`;
    wrapText("foto local", -frameW / 2 + 48, 42, frameW - 96, 64, 1, "center");
  }

  ctx.restore();
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

  ctx.fillStyle = data.textColor;
  const titleText = data.title.toUpperCase();
  const titleSize = fitFont(titleText, `800 {size}px ${TITLE_FONT}`, 900, 72, 46);
  ctx.font = `800 ${titleSize}px ${TITLE_FONT}`;
  let currentY = 384;
  currentY += wrapText(titleText, 90, currentY, 900, titleSize + 8, 2, "center");

  ctx.fillStyle = colorWithAlpha(data.textColor, 0.88);
  ctx.font = `800 52px ${TEXT_FONT}`;
  currentY += 34;
  currentY += wrapText(data.subtitle, 150, currentY, 780, 62, 3, "center");

  const metrics = [
    ["Rentabilidad", data.profitability],
    ["Tiempo de recupero", data.payback],
    ["Facturación proyectada", data.projectedRevenue],
    [data.extraLabel || "Dato extra", data.extraValue],
  ].filter(([, value]) => value);

  const hasLocalPhoto = Boolean(localPhoto);
  const hasSecondaryNoDataPhoto = metrics.length === 0 && Boolean(secondaryLocalPhoto);
  currentY = Math.max(currentY + 56, 760);

  ctx.fillStyle = data.textColor;
  ctx.font = `500 72px ${TITLE_FONT}`;
  wrapText("INVERSIÓN", 190, currentY + 18, 700, 76, 1, "center");

  const investmentSize = fitFont(data.investment, `500 {size}px ${TITLE_FONT}`, 900, 126, 78);
  ctx.font = `500 ${investmentSize}px ${TITLE_FONT}`;
  wrapText(data.investment, 90, currentY + 160, 900, investmentSize + 8, 1, "center");

  const ctaY = 1768;
  const ctaHeight = 78;
  const investmentBottom = currentY + 190;
  const blockTop = investmentBottom + 80;
  let contentBottom = investmentBottom;
  const metricStep = 126;
  if (metrics.length) {
    const metricX = hasLocalPhoto ? 78 : 230;
    const metricW = hasLocalPhoto ? 500 : 620;
    const metricY = blockTop;
    metrics.slice(0, 4).forEach(([label, value], index) => {
      drawMetric(label, value, metricX, metricY + index * metricStep, metricW, data.metricBoxColor, 98);
    });
    contentBottom = metricY + (Math.min(metrics.length, 4) - 1) * metricStep + 98;
  }

  if (hasSecondaryNoDataPhoto) {
    drawLocalPhotoCard(data, blockTop, secondaryLocalPhoto, "left");
    contentBottom = Math.max(contentBottom, blockTop + 452);
  }

  if (hasLocalPhoto) {
    drawLocalPhotoCard(data, blockTop, localPhoto, "right");
    contentBottom = Math.max(contentBottom, blockTop + 452);
  }

  ctx.fillStyle = data.textColor;
  ctx.font = `800 40px ${TEXT_FONT}`;
  const locationY = data.location ? Math.min(contentBottom + 140, ctaY - 122) : 0;
  if (data.location) {
    wrapText("¿Dónde está la franquicia?", 150, locationY, 780, 46, 1, "center");
    ctx.font = `400 36px ${TEXT_FONT}`;
    wrapText(data.location, 150, locationY + 62, 780, 42, 2, "center");
  }

  ctx.fillStyle = data.metricBoxColor;
  drawRoundedRect(130, ctaY, 820, ctaHeight, 16);
  ctx.fill();
  ctx.fillStyle = readableTextColor(data.metricBoxColor);
  ctx.font = `800 28px ${TEXT_FONT}`;
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

inputs.localPhotoInput.addEventListener("change", () => {
  loadImageFromInput(inputs.localPhotoInput, (image) => {
    localPhoto = image;
    drawFlyer();
  });
});

inputs.secondaryLocalPhotoInput.addEventListener("change", () => {
  loadImageFromInput(inputs.secondaryLocalPhotoInput, (image) => {
    secondaryLocalPhoto = image;
    drawFlyer();
  });
});

document.getElementById("downloadPng").addEventListener("click", () => downloadFlyer("png"));
document.getElementById("downloadJpg").addEventListener("click", () => downloadFlyer("jpeg"));

drawFlyer();
