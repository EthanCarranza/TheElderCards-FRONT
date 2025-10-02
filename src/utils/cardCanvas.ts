/**
 * Draws a card on a canvas with the given properties
 * @param ctx - The canvas 2D rendering context
 * @param options - Card options including title, type, cost, description, etc.
 */
interface CardOptions {
  title: string;
  type: string;
  cost: number;
  description: string;
  frameColor: string;
  creator: string;
  imageElement?: HTMLImageElement;
  attack?: number;
  defense?: number;
}

interface CardDimensions {
  canvasWidth: number;
  canvasHeight: number;
  border: number;
  cutSize: number;
  imageHeight: number;
  titleBarHeight: number;
  typeBarHeight: number;
  footerHeight: number;
}

const CARD_DIMENSIONS: CardDimensions = {
  canvasWidth: 400,
  canvasHeight: 600,
  border: 12,
  cutSize: 48,
  imageHeight: 300, // Half of canvasHeight
  titleBarHeight: 56,
  typeBarHeight: 32,
  footerHeight: 68,
};

// Cargar la fuente Cyrodiil
const cyrodiilFont = new FontFace("Cyrodiil", "url(/fonts/Cyrodiil.otf)");

// Función para asegurarnos de que la fuente está cargada
async function ensureFontLoaded() {
  try {
    const font = await cyrodiilFont.load();
    document.fonts.add(font);
  } catch (error) {
    console.error("Error cargando la fuente Cyrodiil:", error);
  }
}

export async function drawCard(
  ctx: CanvasRenderingContext2D,
  options: CardOptions
): Promise<void> {
  // Asegurarnos de que la fuente está cargada
  await ensureFontLoaded();
  const {
    title,
    type,
    cost,
    description,
    frameColor,
    creator,
    imageElement,
    attack,
    defense,
  } = options;

  const {
    canvasWidth,
    canvasHeight,
    border,
    cutSize,
    imageHeight,
    titleBarHeight,
    typeBarHeight,
    footerHeight,
  } = CARD_DIMENSIONS;

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Dibuja marco con esquinas recortadas
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvasWidth - cutSize, 0);
  ctx.lineTo(canvasWidth, cutSize);
  ctx.lineTo(canvasWidth, canvasHeight);
  ctx.lineTo(cutSize, canvasHeight);
  ctx.lineTo(0, canvasHeight - cutSize);
  ctx.closePath();
  ctx.fillStyle = frameColor;
  ctx.fill();
  ctx.restore();

  // Fondo interior blanco
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(border, border);
  ctx.lineTo(canvasWidth - cutSize, border);
  ctx.lineTo(canvasWidth - border, cutSize);
  ctx.lineTo(canvasWidth - border, canvasHeight - border);
  ctx.lineTo(cutSize, canvasHeight - border);
  ctx.lineTo(border, canvasHeight - cutSize);
  ctx.closePath();
  ctx.fillStyle = "#f0f0f0";
  ctx.fill();
  ctx.restore();

  // Imagen principal arriba (si está disponible)
  if (imageElement) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(border, border);
    ctx.lineTo(canvasWidth - cutSize, border);
    ctx.lineTo(canvasWidth - border, cutSize);
    ctx.lineTo(canvasWidth - border, imageHeight + border);
    ctx.lineTo(cutSize, imageHeight + border);
    ctx.lineTo(border, imageHeight + cutSize);
    ctx.closePath();
    ctx.clip();
    const imgX = border;
    const imgY = border;
    const drawWidth = canvasWidth - 2 * border;
    const drawHeight = imageHeight;

    // Calcular las dimensiones manteniendo el aspect ratio y cubriendo el área
    let finalWidth = drawWidth;
    let finalHeight = drawHeight;

    const imageRatio = imageElement.width / imageElement.height;
    const areaRatio = drawWidth / drawHeight;

    if (imageRatio > areaRatio) {
      // Imagen más ancha que el área
      finalHeight = drawHeight;
      finalWidth = drawHeight * imageRatio;
    } else {
      // Imagen más alta que el área
      finalWidth = drawWidth;
      finalHeight = drawWidth / imageRatio;
    }

    // Centrar la imagen
    const offsetX = (drawWidth - finalWidth) / 2;
    const offsetY = (drawHeight - finalHeight) / 2;

    ctx.drawImage(
      imageElement,
      imgX + offsetX,
      imgY + offsetY,
      finalWidth,
      finalHeight
    );
    ctx.restore();
  }

  // Círculo de coste en la esquina superior izquierda
  ctx.save();
  const costRadius = 28;
  const extraMargin = 2;
  const costX = border + costRadius + extraMargin;
  const costY = border + costRadius + extraMargin;
  ctx.beginPath();
  ctx.arc(costX, costY, costRadius, 0, 2 * Math.PI);
  ctx.fillStyle = "#222";
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = "bold 28px Cyrodiil";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(cost), costX, costY);
  ctx.restore();

  // Franja del titulo
  ctx.save();
  ctx.fillStyle = "#c6c6c6";
  ctx.fillRect(border, imageHeight, canvasWidth - 2 * border, titleBarHeight);
  ctx.fillStyle = "#222";
  ctx.font = "bold 24px Cyrodiil";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, canvasWidth / 2, imageHeight + titleBarHeight / 2);
  ctx.restore();

  // Franja del tipo
  ctx.save();
  ctx.fillStyle = "#dadada";
  ctx.fillRect(
    border,
    imageHeight + titleBarHeight,
    canvasWidth - 2 * border,
    typeBarHeight
  );
  const typeTranslations: Record<string, string> = {
    Creature: "Criatura",
    Artifact: "Artefacto",
    Spell: "Hechizo",
  };

  ctx.fillStyle = "#333";
  ctx.font = "600 18px Cyrodiil";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const translatedType = (typeTranslations[type] || type).toUpperCase();
  ctx.fillText(
    translatedType,
    canvasWidth / 2,
    imageHeight + titleBarHeight + typeBarHeight / 2
  );
  ctx.restore();

  // Descripción
  const descY = imageHeight + titleBarHeight + typeBarHeight;
  // Calcular el espacio disponible teniendo en cuenta el área de ataque/defensa
  const defenseHeight = 38; // Altura del recuadro de ataque/defensa
  const defenseMargin = 8; // Margen adicional para separación
  const availableDescHeight = Math.max(
    canvasHeight - border - descY - defenseHeight - defenseMargin,
    0
  );
  const descHeight = availableDescHeight; // Usar todo el espacio disponible

  if (descHeight > 0) {
    ctx.save();
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(border, descY, canvasWidth - 2 * border, descHeight);
    ctx.fillStyle = "#333";
    ctx.font = "17px Cyrodiil";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lineHeight = 22;
    const descBoxWidth = canvasWidth - 2 * border - 32;
    const maxLines = Math.floor(descHeight / lineHeight);
    const lines: string[] = [];

    const words = description.split(" ");
    let currentLine = "";

    for (const word of words) {
      // Si la palabra es más larga que el ancho disponible, cortarla
      if (ctx.measureText(word).width > descBoxWidth) {
        // Si hay una línea actual, añadirla primero
        if (currentLine) {
          lines.push(currentLine);
          if (lines.length >= maxLines) break;
          currentLine = "";
        }

        // Cortar la palabra larga en pedazos
        let remainingWord = word;
        while (remainingWord && lines.length < maxLines) {
          let i = remainingWord.length;
          let chunk = remainingWord;

          // Reducir el tamaño del chunk hasta que quepa
          while (ctx.measureText(chunk).width > descBoxWidth && i > 0) {
            i--;
            chunk = remainingWord.substring(0, i);
          }

          if (i > 0) {
            lines.push(chunk);
            remainingWord = remainingWord.substring(i);
          } else {
            // Si ni siquiera un carácter cabe, forzar al menos uno
            lines.push(remainingWord[0]);
            remainingWord = remainingWord.substring(1);
          }
        }
      } else {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width <= descBoxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            if (lines.length >= maxLines) break;
          }
          currentLine = word;
        }
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    // Asegurar márgenes iguales arriba y abajo
    const fixedPadding = 16; // Padding fijo arriba y abajo
    const availableHeight = descHeight - fixedPadding * 2; // Espacio disponible entre paddings
    const totalLines = Math.min(lines.length, maxLines);
    const totalTextHeight = totalLines * lineHeight;
    const extraSpace = Math.max(availableHeight - totalTextHeight, 0);
    const startY = descY + fixedPadding + extraSpace / 2;

    lines.slice(0, maxLines).forEach((line, index) => {
      const y = startY + index * lineHeight;
      ctx.fillText(line, canvasWidth / 2, y);
    });
    ctx.restore();
  } // Pie con nombre del creador
  const footerY = canvasHeight - border - footerHeight;
  ctx.save();
  const footerLabelFont = 12;
  const footerNameFont = 14;
  const footerGap = 4;
  const footerPaddingBottom = 12;
  const footerBaseline = footerY + footerHeight - footerPaddingBottom;
  const footerLabel = "Created by:";
  const footerName = creator && creator !== "undefined" ? creator : "Anónimo";
  const footerLabelFontStr = "400 " + footerLabelFont + "px Cyrodiil";
  const footerNameFontStr = "600 " + footerNameFont + "px Cyrodiil";

  ctx.fillStyle = "#222";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = footerLabelFontStr;
  const labelWidth = ctx.measureText(footerLabel).width;
  ctx.font = footerNameFontStr;
  const nameWidth = ctx.measureText(footerName).width;
  const totalWidth = labelWidth + footerGap + nameWidth;
  const footerStartX = (canvasWidth - totalWidth) / 2;

  ctx.font = footerLabelFontStr;
  ctx.fillText(footerLabel, footerStartX, footerBaseline);
  ctx.font = footerNameFontStr;
  ctx.fillText(
    footerName,
    footerStartX + labelWidth + footerGap,
    footerBaseline
  );
  ctx.restore();

  // Ataque/defensa si es Creature
  if (type === "Creature" && attack !== undefined && defense !== undefined) {
    const rectW = 80;
    const rectH = 38;
    const rectX = canvasWidth - border - rectW;
    const rectY = canvasHeight - border - rectH;
    ctx.save();
    ctx.fillStyle = "#222";
    ctx.globalAlpha = 0.85;
    ctx.fillRect(rectX, rectY, rectW, rectH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Cyrodiil";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${attack} / ${defense}`,
      rectX + rectW / 2,
      rectY + rectH / 2
    );
    ctx.restore();
  }
}

export const CARD_DIMENSIONS_EXPORT = CARD_DIMENSIONS;
