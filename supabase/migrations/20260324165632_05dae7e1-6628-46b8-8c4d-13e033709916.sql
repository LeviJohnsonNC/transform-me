ALTER TABLE habits
  ADD COLUMN active_on_weekdays boolean NOT NULL DEFAULT true,
  ADD COLUMN active_on_weekends boolean NOT NULL DEFAULT true;