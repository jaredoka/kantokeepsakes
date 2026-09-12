#!/usr/bin/env node

/**
 * csv-to-json.js
 *
 * Converts a CSV export from the product inventory spreadsheet
 * into data/products.json.
 *
 * Usage:
 *   node tools/csv-to-json.js <path-to-csv>
 *
 * Example:
 *   node tools/csv-to-json.js ~/Downloads/products.csv
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = ['name', 'category', 'type', 'price'];
const VALID_CATEGORIES = ['japanese', 'english', 'accessories'];
const VALID_TYPES = ['sealed', 'singles', 'graded', 'accessories'];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.error('Error: CSV must have a header row and at least one data row.');
    process.exit(1);
  }

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every((v) => v === '')) continue; // skip empty rows

    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  values.push(current);
  return values;
}

function generateId(category, type, index) {
  const prefixMap = {
    japanese: 'jp',
    english: 'en',
    accessories: 'acc',
  };
  const prefix = prefixMap[category] || category.slice(0, 3);
  const typeShort = type === 'accessories' ? '' : `-${type}`;
  return `${prefix}${typeShort}-${String(index).padStart(3, '0')}`;
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  const v = String(value).toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1';
}

function convertRow(row, index, counters) {
  const errors = [];

  // Validate required fields
  REQUIRED_FIELDS.forEach((field) => {
    if (!row[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  const category = (row.category || '').toLowerCase();
  const type = (row.type || '').toLowerCase();

  if (category && !VALID_CATEGORIES.includes(category)) {
    errors.push(`Invalid category "${row.category}". Must be: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (type && !VALID_TYPES.includes(type)) {
    errors.push(`Invalid type "${row.type}". Must be: ${VALID_TYPES.join(', ')}`);
  }

  const price = parseFloat(row.price);
  if (isNaN(price) || price < 0) {
    errors.push(`Invalid price "${row.price}". Must be a positive number.`);
  }

  if (errors.length > 0) {
    return { errors, product: null };
  }

  // Auto-generate ID if missing
  const counterKey = `${category}-${type}`;
  counters[counterKey] = (counters[counterKey] || 0) + 1;
  const id = row.id || generateId(category, type, counters[counterKey]);

  // Auto-generate image path if missing
  const image = row.image || `images/products/${id}.jpg`;

  const product = {
    id,
    name: row.name,
    category,
    type,
    price,
    image,
    description: row.description || '',
    inStock: row.inStock !== undefined && row.inStock !== '' ? toBoolean(row.inStock) : true,
    preorder: row.preorder !== undefined && row.preorder !== '' ? toBoolean(row.preorder) : false,
  };

  return { errors: [], product };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node tools/csv-to-json.js <path-to-csv>');
    console.log('');
    console.log('Converts a CSV product inventory into data/products.json.');
    console.log('');
    console.log('CSV columns: id, name, category, type, price, image, description, inStock, preorder');
    console.log('Required:    name, category, type, price');
    console.log('Auto-generated if blank: id, image');
    process.exit(0);
  }

  const csvPath = path.resolve(args[0]);

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);

  console.log(`Parsed ${rows.length} rows from CSV.`);

  const products = [];
  const allErrors = [];
  const counters = {};

  rows.forEach((row, index) => {
    const { errors, product } = convertRow(row, index, counters);

    if (errors.length > 0) {
      allErrors.push({ row: index + 2, errors }); // +2 for header row + 0-index
    } else {
      products.push(product);
    }
  });

  if (allErrors.length > 0) {
    console.error('\nValidation errors:');
    allErrors.forEach(({ row, errors }) => {
      errors.forEach((err) => console.error(`  Row ${row}: ${err}`));
    });
    console.error(`\n${allErrors.length} row(s) with errors were skipped.`);
  }

  if (products.length === 0) {
    console.error('No valid products to write.');
    process.exit(1);
  }

  const outputPath = path.resolve(__dirname, '..', 'data', 'products.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2) + '\n', 'utf-8');

  console.log(`\nWrote ${products.length} products to ${outputPath}`);
}

main();
