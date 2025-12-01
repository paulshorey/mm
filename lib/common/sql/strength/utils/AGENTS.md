# Strength Utils

Utility functions for processing strength data during database operations.

## Files

- `constants.ts` - Defines interval column names and configuration constants
- `forwardFill.ts` - Forward-fill logic to populate missing interval values from previous rows
- `average.ts` - Calculate average of all interval columns
- `index.ts` - Exports all utilities

## Key Concepts

### Forward-Fill

When new data arrives, some interval columns may be missing. Forward-fill looks back up to 3 previous rows to find values for missing columns. This ensures the average is always calculated with complete data.

### Average Column

The `average` column stores the mean of all interval columns ("2", "4", "12", "30", "60", "240"). It's automatically calculated and updated whenever any interval value changes.

## Usage

These utilities are used internally by `add.ts`. They're not typically called directly from frontend code.

