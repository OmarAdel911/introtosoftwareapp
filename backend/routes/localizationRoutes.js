const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// Get available languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            translations: true
          }
        }
      }
    });
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get language translations
router.get('/languages/:languageCode/translations', async (req, res) => {
  try {
    const { languageCode } = req.params;
    const translations = await prisma.translation.findMany({
      where: { languageCode },
      include: {
        language: true
      }
    });
    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's language preference
router.get('/preferences/language', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { languageCode: true }
    });
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user's language preference
router.put('/preferences/language', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { languageCode } = req.body;

    // Verify language exists and is active
    const language = await prisma.language.findUnique({
      where: { code: languageCode }
    });

    if (!language || !language.isActive) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { languageCode },
      create: {
        userId,
        languageCode
      }
    });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available regions
router.get('/regions', async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      where: { isActive: true },
      include: {
        countries: {
          where: { isActive: true },
          include: {
            currencies: true,
            timezones: true
          }
        }
      }
    });
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's region preference
router.get('/preferences/region', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: {
        countryCode: true,
        currencyCode: true,
        timezone: true
      }
    });
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user's region preference
router.put('/preferences/region', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { countryCode, currencyCode, timezone } = req.body;

    // Verify country exists and is active
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
      include: {
        currencies: true,
        timezones: true
      }
    });

    if (!country || !country.isActive) {
      return res.status(400).json({ error: 'Invalid country code' });
    }

    // Verify currency exists for country
    if (currencyCode && !country.currencies.some(c => c.code === currencyCode)) {
      return res.status(400).json({ error: 'Invalid currency code for country' });
    }

    // Verify timezone exists for country
    if (timezone && !country.timezones.some(t => t.code === timezone)) {
      return res.status(400).json({ error: 'Invalid timezone for country' });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        countryCode,
        currencyCode,
        timezone
      },
      create: {
        userId,
        countryCode,
        currencyCode,
        timezone
      }
    });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get currency exchange rates
router.get('/currencies/rates', async (req, res) => {
  try {
    const { baseCurrency = 'USD' } = req.query;
    const rates = await prisma.currencyExchangeRate.findMany({
      where: { baseCurrency },
      include: {
        targetCurrency: true
      }
    });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert currency
router.get('/currencies/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.query;

    const rate = await prisma.currencyExchangeRate.findFirst({
      where: {
        baseCurrency: fromCurrency,
        targetCurrency: {
          code: toCurrency
        }
      }
    });

    if (!rate) {
      return res.status(400).json({ error: 'Exchange rate not found' });
    }

    const convertedAmount = amount * rate.rate;

    res.json({
      amount: parseFloat(amount),
      fromCurrency,
      toCurrency,
      rate: rate.rate,
      convertedAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get timezone information
router.get('/timezones', async (req, res) => {
  try {
    const timezones = await prisma.timezone.findMany({
      where: { isActive: true },
      include: {
        country: true
      }
    });
    res.json(timezones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's timezone
router.get('/preferences/timezone', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { timezone: true }
    });
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user's timezone
router.put('/preferences/timezone', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timezone } = req.body;

    // Verify timezone exists and is active
    const timezoneExists = await prisma.timezone.findFirst({
      where: {
        code: timezone,
        isActive: true
      }
    });

    if (!timezoneExists) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { timezone },
      create: {
        userId,
        timezone
      }
    });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 