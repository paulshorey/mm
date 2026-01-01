# Price UI app (apps/price-ui/)

Financial charting app displaying price and relative strength (RSI), with real-time updates.

## Overview

- **Left y-axis:** Strength (-100 to 100)
- **Right y-axis:** Price
- **X-axis:** Time (shared)

## Folders

Current working directory is `apps/price-ui`
Inside:

- api/ NextJS api
- components/ wrappers imported directly from page.tsx should be placed in the root of this folder - all other components for specific features or layout should be nested in sub-folders
- docs/ documentation markdown files for HighCharts, other libraries, and specific techniques

## Highcharts

@apps/price-ui/docs/highcharts/overview.md
