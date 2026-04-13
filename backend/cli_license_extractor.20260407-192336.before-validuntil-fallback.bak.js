const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');
const path = require('path');

const execAsync = promisify(exec);

class LicenseExtractorCLI {
  constructor() {
    this.debugMode = true;
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[DEBUG] ${message}`);
      if (data) console.log(data);
    }
  }

  async pdfToImage(pdfPath) {
    this.log('Converting PDF to PNG...');
    
    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const outputPrefix = path.join(tempDir, `license_${Date.now()}`);
    const command = `pdftoppm -r 400 -png -singlefile "${pdfPath}" "${outputPrefix}"`;

    let stderr = '';

    try {
      const result = await execAsync(command);
      stderr = result.stderr;
    } catch (error) {
      console.error('pdftoppm failed:', error.message);
      if (error.stderr) {
        console.error('pdftoppm stderr:', error.stderr);
      }
      throw error;
    }

    if (stderr) this.log('pdftoppm stderr:', stderr);
    
    const outputPath = `${outputPrefix}.png`;
    this.log('PDF converted to:', outputPath);
    return outputPath;
  }

  async preprocessImage(imagePath) {
    this.log('Preprocessing image...');
    
    const processedPath = imagePath.replace('.png', '_processed.png');
    
    await sharp(imagePath)
      .greyscale()
      .normalize()
      .sharpen({ sigma: 2 })
      .threshold(128)
      .toFile(processedPath);

    this.log('Processed:', processedPath);
    return processedPath;
  }

  async runOCR(imagePath) {
    this.log('Running Tesseract CLI...');
    
    const outputBase = imagePath.replace('.png', '_ocr');
    const command = `"C:\\Program Files\\Tesseract-OCR\\tesseract.exe" "${imagePath}" "${outputBase}" -l eng --psm 3`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr) this.log('tesseract stderr:', stderr);
      
      const ocrText = await fs.readFile(`${outputBase}.txt`, 'utf-8');
      
      this.log('OCR completed. Text length:', ocrText.length);
      this.log('Raw OCR output (first 800 chars):');
      this.log(ocrText.substring(0, 800));
      
      await fs.unlink(`${outputBase}.txt`).catch(() => {});
      
      return ocrText;
    } catch (error) {
      console.error('tesseract failed:', error.message);
      if (error.stderr) {
        console.error('tesseract stderr:', error.stderr);
      }
      throw new Error(`Tesseract failed: ${error.message}`);
    }
  }

  extractLicenseNumber(text) {
    this.log('\n=== EXTRACTION STRATEGIES ===');
    
    if (!text) {
      this.log('ERROR: No text');
      return null;
    }

    const cleaned = text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    this.log('Cleaned text (first 400 chars):');
    this.log(cleaned.substring(0, 400));
    this.log('');

    const p1 = /(?:LIC|IC|LC)-\d{6,8}-[A-Z]{2,4}/i;
    const m1 = cleaned.match(p1);
    if (m1) {
      const lic = this.normalizeLicenseNumber(m1[0]);
      this.log('✓ FOUND:', lic);
      return lic;
    }

    const p2 = /LICENCIJA\s+Nr\.?\s*([A-Z0-9-]{10,})/i;
    const m2 = cleaned.match(p2);
    if (m2) {
      const lic = this.normalizeLicenseNumber(m2[1]);
      this.log('✓ FOUND:', lic);
      return lic;
    }

    const p3 = /(?:LIC|IC|LC)[^a-z\n]{0,5}(\d{6,8})[^a-z\n]{0,5}([A-Z]{2,4})/i;
    const m3 = cleaned.match(p3);
    if (m3) {
      const lic = this.normalizeLicenseNumber(`LIC-${m3[1]}-${m3[2]}`);
      this.log('✓ FOUND:', lic);
      return lic;
    }

    const fixed = cleaned
      .replace(/[wW]/g, '')
      .replace(/[uU]/g, '0')
      .replace(/[cC](?=[0-9])/g, '')
      .replace(/[oO]/g, '0')
      .replace(/[mM]/g, '2')
      .replace(/[sS](?=\d|[A-Z])/g, '5')
      .replace(/[xX](?=[A-Z])/g, 'X')
      .replace(/[iI](?=\d)/g, '1');

    const p4 = /(?:LIC|IC|LC)[^a-z]*(\d{6,8})[^a-z]*([A-Z]{2,4})/i;
    const m4 = fixed.match(p4);
    if (m4) {
      const lic = this.normalizeLicenseNumber(`LIC-${m4[1]}-${m4[2]}`);
      this.log('✓ FOUND (after correction):', lic);
      return lic;
    }

    const p5 = /\b(\d{6})\b.*?\b([A-Z]{4})\b/i;
    const m5 = cleaned.match(p5);
    if (m5) {
      const lic = this.normalizeLicenseNumber(`LIC-${m5[1]}-${m5[2]}`);
      this.log('⚠ FOUND (risky):', lic);
      return lic;
    }

    return null;
  }

  normalizeLicenseNumber(value) {
    const cleaned = String(value || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/^(?:ic|lc)/i, 'LIC')
      .replace(/^LIC(?=\d)/, 'LIC-')
      .replace(/^LIC(?!-)/, 'LIC-')
      .replace(/^LIC--+/, 'LIC-')
      .toUpperCase();

    const match = cleaned.match(/^(?:LIC-)?(\d{6,8})-?([A-Z]{2,4})$/);
    if (match) {
      return `LIC-${match[1]}-${match[2]}`.toUpperCase();
    }

    return cleaned.toUpperCase();
  }

  extractValidUntil(text) {
    if (!text) {
      return '';
    }

    const cleaned = text.replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const normalizedText = cleaned
      .replace(/[|!]/g, 'I')
      .replace(/\b[il1][k][il1]\b/gi, 'Iki')
      .replace(/\bunti[li1]\b/gi, 'until')
      .replace(/\bunti\b/gi, 'until')
      .replace(/\bva[li1]id\b/gi, 'valid')
      .replace(/\bfr0m\b/gi, 'from')
      .replace(/\bun[tf][il1]\b/gi, 'until')
      .replace(/\bva[1l]id\b/gi, 'valid')
      .replace(/\bfro[mn]\b/gi, 'from');

    const dateMatches = normalizedText.match(/\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4}/g) || [];

    const rangePatterns = [
      /valid\s*from\s*(\d{4}[-/.]\d{2}[-/.]\d{2})\s*(?:until|till|to)\s*(\d{4}[-/.]\d{2}[-/.]\d{2})/i,
      /valid\s*from\s*(\d{2}[-/.]\d{2}[-/.]\d{4})\s*(?:until|till|to)\s*(\d{2}[-/.]\d{2}[-/.]\d{4})/i,
      /(?:iki|until|valid\s*until|valid\s*to|expiry\s*date|expiration\s*date|expires?)\s*[:\-]?\s*(\d{4}[-/.]\d{2}[-/.]\d{2})/i,
      /(?:iki|until|valid\s*until|valid\s*to|expiry\s*date|expiration\s*date|expires?)\s*[:\-]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})/i
    ];

    for (const pattern of rangePatterns) {
      const match = normalizedText.match(pattern);
      if (!match) {
        continue;
      }

      const candidate = match[2] || match[1];
      const normalized = this.normalizeDate(candidate);
      if (normalized) {
        return normalized;
      }
    }

    if (dateMatches.length >= 2 && /valid\s*from/i.test(normalizedText)) {
      const normalized = this.normalizeDate(dateMatches[dateMatches.length - 1]);
      if (normalized) {
        return normalized;
      }
    }

    if (dateMatches.length >= 1 && /\b(?:iki|until|valid\s*until|valid\s*to|expiry|expiration|expires?)\b/i.test(normalizedText)) {
      const normalized = this.normalizeDate(dateMatches[dateMatches.length - 1]);
      if (normalized) {
        return normalized;
      }
    }

    const patterns = [
      /(?:VALID\s*UNTIL|VALID\s*TO|UNTIL|EXPIRY\s*DATE|EXPIRATION\s*DATE|EXPIRES?)\s*[:\-]?\s*(\d{4}[-/.]\d{2}[-/.]\d{2})/i,
      /(?:VALID\s*UNTIL|VALID\s*TO|UNTIL|EXPIRY\s*DATE|EXPIRATION\s*DATE|EXPIRES?)\s*[:\-]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (!match || !match[1]) {
        continue;
      }

      const normalized = this.normalizeDate(match[1]);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  normalizeDate(value) {
    const text = String(value || '').trim();

    let match = text.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    match = text.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }

    return '';
  }

  async extract(pdfPath) {
    let imagePath = null;
    let processedPath = null;

    try {
      imagePath = await this.pdfToImage(pdfPath);
      processedPath = await this.preprocessImage(imagePath);
      const ocrText = await this.runOCR(processedPath);
      const licenseNumber = this.extractLicenseNumber(ocrText);
      const validUntil = this.extractValidUntil(ocrText);

      if (imagePath) await fs.unlink(imagePath).catch(() => {});
      if (processedPath) await fs.unlink(processedPath).catch(() => {});

      return {
        licenseNumber,
        validUntil,
        method: 'ocr_cli',
        confidence: licenseNumber ? 'medium' : 'none',
        rawOCRText: ocrText.substring(0, 600),
        success: !!licenseNumber
      };

    } catch (error) {
      if (imagePath) await fs.unlink(imagePath).catch(() => {});
      if (processedPath) await fs.unlink(processedPath).catch(() => {});

      return {
        licenseNumber: null,
        validUntil: '',
        method: 'failed',
        confidence: 'none',
        error: error.message,
        success: false
      };
    }
  }
}

module.exports = LicenseExtractorCLI;
