export interface FractalData {
  time: string
  volumeStrength: number
  volumeStrengthMa: number
  priceStrength: number
  priceStrengthMa: number
  priceVolumeStrength: number
  priceVolumeStrengthMa: number
}

export async function parseFractalCSV(csvPath: string): Promise<FractalData[]> {
  try {
    const response = await fetch(csvPath)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const csvText = await response.text()
    const lines = csvText.trim().split('\n') || []

    // Parse CSV - simple comma split (ignore parentheses/quotes)
    const headers = lines[0]?.split(',') || []

    // Find the indices of the columns we need
    const timeIndex = headers.indexOf('time')
    const volumeStrengthIndex = headers.indexOf('volumeStrength')
    const volumeStrengthMaIndex = headers.indexOf('volumeStrengthMa')
    const priceStrengthIndex = headers.indexOf('priceStrength')
    const priceStrengthMaIndex = headers.indexOf('priceStrengthMa')
    const priceVolumeStrengthIndex = headers.indexOf('priceVolumeStrength')
    const priceVolumeStrengthMaIndex = headers.indexOf('priceVolumeStrengthMa')

    const data: FractalData[] = []

    // Skip header row and parse data
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i]?.split(',') || []

      if (columns.length >= headers.length) {
        const rowData = {
          time: columns[timeIndex] || '',
          volumeStrength: parseFloat(columns[volumeStrengthIndex] || '0'),
          volumeStrengthMa: parseFloat(columns[volumeStrengthMaIndex] || '0'),
          priceStrength: parseFloat(columns[priceStrengthIndex] || '0'),
          priceStrengthMa: parseFloat(columns[priceStrengthMaIndex] || '0'),
          priceVolumeStrength: parseFloat(
            columns[priceVolumeStrengthIndex] || '0'
          ),
          priceVolumeStrengthMa: parseFloat(
            columns[priceVolumeStrengthMaIndex] || '0'
          ),
        }

        // Only add valid data rows (skip rows with invalid data)
        if (rowData.time && !isNaN(rowData.volumeStrength)) {
          data.push(rowData)
        }
      }
    }

    return data
  } catch (error) {
    console.error('Error parsing CSV:', error)
    return []
  }
}
