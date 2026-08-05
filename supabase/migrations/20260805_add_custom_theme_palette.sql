-- Migration: add custom_theme_palette column to restaurants
-- Run this in Supabase SQL Editor before using the Custom Palette editor in admin.

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS custom_theme_palette JSONB DEFAULT NULL;
