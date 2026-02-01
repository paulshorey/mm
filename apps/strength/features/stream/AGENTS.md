# Stream Chart

Real-time financial chart using `lightweight-charts` to display price, CVD, RSI, and various market metrics with absorption detection markers.

## Architecture

Wrapper.tsx - Loaded first. Waits for window to load, to know available screen size. It passes available width/height to Chart.tsx.
Chart.tsx - Renders full-screen chart. Calls function to set up time series plots, and another function to populate plots with real-time updating data.
plot/ -
plot/useChart.ts - called by Chart.tsx to set up plots. Returns `seriesRefs` (refs to elements)
plot/usePolling.ts - called by Chart.sx to manage data. Fetches, aggregates, and adds data to `seriesRefs` returned by UseInitChart.ts
plot/dataFormatting.ts - used by hooks/useDataPolling.ts to transform raw database numbers into expected format
plot/constants.ts - configuration to render, enable, and style each line plot and marker on the chart
lib/ -
lib/indicators.ts - utility functions to generate custom time series like RSI (relative strength) from price/volume
ui/ -
ui/useEventPatcher.ts - the page is zoomed out to 50%, to fit more pixels on the screen (higher resolution charts). Then the user elements on the page are zoomed in 200% using CSS. This fixes the remaining issue of user cursor position, which in lightweight-charts library does not notice the 50% zoom out. So this script hijacks cursor position from lightweight-charts and modifies it to expand 200% to fill the new screen resolution.
