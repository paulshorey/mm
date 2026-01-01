# Strength app (apps/strength/)

Financial charting app displaying price and relative strength, with real-time updates.

## Overview

- **Left y-axis:** Strength (-100 to 100)
- **Right y-axis:** Price
- **X-axis:** Time (shared)

## Folders

Current working directory is `apps/strength`

Inside:

- api - NextJS api
- price - /price page - will display new improved chart using highcharts library
- page.tsx - / homepage - renders old (current version) chart using lightweight-charts
- components - React components for the new
